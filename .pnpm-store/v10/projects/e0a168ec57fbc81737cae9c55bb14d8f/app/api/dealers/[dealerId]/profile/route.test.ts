import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { updateDealerProfile } from '@/src/services/dealer.service';
import { auditService } from '@/src/services/audit.service';

vi.mock('@/src/services/dealer.service');
vi.mock('@/src/services/audit.service');

// Preserve real AuthError so instanceof checks work; only mock requireAuth
vi.mock('@/lib/auth/session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/session')>();
  return { ...actual, requireAuth: vi.fn() };
});

import { requireAuth, AuthError } from '@/lib/auth/session';

describe('PATCH /api/dealers/[dealerId]/profile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const mockDealer = {
    id: 'dealer-1',
    name: 'Test Dealership',
    logoUrl: null,
    primaryColour: '#2563EB',
    contactPhone: null,
    contactEmail: null,
    websiteUrl: null,
  };

  it('returns 401 without auth', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new AuthError('UNAUTHORIZED'));

    const req = new Request('http://localhost/api/dealers/dealer-1/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ dealerId: 'dealer-1' }) });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 for DEALER_STAFF', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new AuthError('FORBIDDEN'));

    const req = new Request('http://localhost/api/dealers/dealer-1/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ dealerId: 'dealer-1' }) });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe('FORBIDDEN');
  });

  it('returns 403 when dealerId does not match session', async () => {
    const session = { userId: 'admin-1', dealerId: 'dealer-1', role: 'DEALER_ADMIN' };
    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);

    const req = new Request('http://localhost/api/dealers/dealer-2/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ dealerId: 'dealer-2' }) });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe('FORBIDDEN');
  });

  it('returns 400 for invalid body (DEALER_ADMIN + invalid data)', async () => {
    const session = { userId: 'admin-1', dealerId: 'dealer-1', role: 'DEALER_ADMIN' };
    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);

    const req = new Request('http://localhost/api/dealers/dealer-1/profile', {
      method: 'PATCH',
      // primaryColour is not a valid hex
      body: JSON.stringify({ primaryColour: 'not-a-colour' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ dealerId: 'dealer-1' }) });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('updates profile and returns data for DEALER_ADMIN', async () => {
    const session = { userId: 'admin-1', dealerId: 'dealer-1', role: 'DEALER_ADMIN' };
    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(updateDealerProfile).mockResolvedValueOnce(mockDealer as any);
    vi.mocked(auditService.log).mockResolvedValueOnce(undefined);

    const req = new Request('http://localhost/api/dealers/dealer-1/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Test Dealership' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ dealerId: 'dealer-1' }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe('dealer-1');
    expect(data.name).toBe('Test Dealership');
    expect(auditService.log).toHaveBeenCalledOnce();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'dealer_profile_updated' })
    );
  });
});
