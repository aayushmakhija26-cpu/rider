import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { updateStaffRole, DealerStaffError } from '@/src/services/dealerStaff.service';
import { auditService } from '@/src/services/audit.service';

vi.mock('@/src/services/dealerStaff.service');
vi.mock('@/src/services/audit.service');
vi.mock('@/lib/auth/session');

import { requireAuth } from '@/lib/auth/session';

describe('PATCH /api/dealers/[dealerId]/staff/[staffUserId]/role', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('updates staff role successfully for DEALER_ADMIN', async () => {
    const session = { userId: 'admin-1', dealerId: 'dealer-1', role: 'DEALER_ADMIN' };
    const updatedStaff = {
      id: 'staff-1',
      role: 'DEALER_ADMIN',
      email: 'staff@test.com',
      name: 'Test Staff',
    };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(updateStaffRole).mockResolvedValueOnce({
      updated: updatedStaff,
      previousRole: 'DEALER_STAFF',
    } as any);
    vi.mocked(auditService.log).mockResolvedValueOnce(undefined);

    const req = new Request('http://localhost/api/dealers/dealer-1/staff/staff-1/role', {
      method: 'PATCH',
      body: JSON.stringify({ newRole: 'DEALER_ADMIN' }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ dealerId: 'dealer-1', staffUserId: 'staff-1' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.role).toBe('DEALER_ADMIN');
    expect(data.email).toBe('staff@test.com');
    expect(auditService.log).toHaveBeenCalledOnce();
  });

  it('returns 403 if dealerId does not match session dealerId', async () => {
    const session = { userId: 'admin-1', dealerId: 'dealer-1', role: 'DEALER_ADMIN' };
    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);

    const req = new Request('http://localhost/api/dealers/dealer-2/staff/staff-1/role', {
      method: 'PATCH',
      body: JSON.stringify({ newRole: 'DEALER_ADMIN' }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ dealerId: 'dealer-2', staffUserId: 'staff-1' }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe('FORBIDDEN');
  });

  it('returns 401 if not authenticated', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(
      new Error('UNAUTHORIZED') as any
    );

    const req = new Request('http://localhost/api/dealers/dealer-1/staff/staff-1/role', {
      method: 'PATCH',
      body: JSON.stringify({ newRole: 'DEALER_ADMIN' }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ dealerId: 'dealer-1', staffUserId: 'staff-1' }),
    });

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid newRole value', async () => {
    const session = { userId: 'admin-1', dealerId: 'dealer-1', role: 'DEALER_ADMIN' };
    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);

    const req = new Request('http://localhost/api/dealers/dealer-1/staff/staff-1/role', {
      method: 'PATCH',
      body: JSON.stringify({ newRole: 'INVALID_ROLE' }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ dealerId: 'dealer-1', staffUserId: 'staff-1' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 if staff user not found', async () => {
    const session = { userId: 'admin-1', dealerId: 'dealer-1', role: 'DEALER_ADMIN' };
    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(updateStaffRole).mockRejectedValueOnce(
      new DealerStaffError('NOT_FOUND', 'Staff account not found')
    );

    const req = new Request('http://localhost/api/dealers/dealer-1/staff/nonexistent/role', {
      method: 'PATCH',
      body: JSON.stringify({ newRole: 'DEALER_ADMIN' }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ dealerId: 'dealer-1', staffUserId: 'nonexistent' }),
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.code).toBe('NOT_FOUND');
  });

  it('returns 403 if attempting to change DEALER_ADMIN role', async () => {
    const session = { userId: 'admin-1', dealerId: 'dealer-1', role: 'DEALER_ADMIN' };
    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(updateStaffRole).mockRejectedValueOnce(
      new DealerStaffError('FORBIDDEN', 'Cannot change the role of a dealer admin from this flow')
    );

    const req = new Request('http://localhost/api/dealers/dealer-1/staff/admin-2/role', {
      method: 'PATCH',
      body: JSON.stringify({ newRole: 'DEALER_STAFF' }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ dealerId: 'dealer-1', staffUserId: 'admin-2' }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe('FORBIDDEN');
  });
});
