import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { requireAuth, AuthError } from '@/lib/auth/session';
import {
  createPendingStaffInvite,
  listDealerStaff,
  DealerStaffError,
} from '@/src/services/dealerStaff.service';
import { auditService } from '@/src/services/audit.service';

// Mock dependencies
vi.mock('@/lib/auth/session');
vi.mock('@/src/services/dealerStaff.service');
vi.mock('@/src/services/audit.service');

describe('POST /api/dealers/[dealerId]/staff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a pending staff invite for valid request', async () => {
    const dealerId = 'dealer-1';
    const session = { userId: 'admin-1', dealerId, role: 'DEALER_ADMIN' as const };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(createPendingStaffInvite).mockResolvedValueOnce({
      inviteToken: 'token-123',
    } as any);
    vi.mocked(auditService.log).mockResolvedValueOnce(undefined);

    const request = new Request('http://localhost/api/dealers/dealer-1/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@dealership.com' }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ dealerId }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.inviteMode).toBeDefined();
    expect(vi.mocked(createPendingStaffInvite)).toHaveBeenCalledWith(
      dealerId,
      'staff@dealership.com',
      'admin-1'
    );
  });

  it('returns 403 when user tries to invite staff to different dealer', async () => {
    const dealerId = 'dealer-2';
    const session = {
      userId: 'admin-1',
      dealerId: 'dealer-1',
      role: 'DEALER_ADMIN' as const,
    };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);

    const request = new Request('http://localhost/api/dealers/dealer-2/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@dealership.com' }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ dealerId }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.code).toBe('FORBIDDEN');
  });

  it('returns 401 when unauthenticated', async () => {
    const dealerId = 'dealer-1';
    vi.mocked(requireAuth).mockImplementationOnce(() => {
      throw new AuthError('UNAUTHORIZED', 'No session');
    });

    const request = new Request('http://localhost/api/dealers/dealer-1/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@dealership.com' }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ dealerId }),
    });

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid email', async () => {
    const dealerId = 'dealer-1';
    const session = { userId: 'admin-1', dealerId, role: 'DEALER_ADMIN' as const };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);

    const request = new Request('http://localhost/api/dealers/dealer-1/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ dealerId }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 for duplicate email', async () => {
    const dealerId = 'dealer-1';
    const session = { userId: 'admin-1', dealerId, role: 'DEALER_ADMIN' as const };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(createPendingStaffInvite).mockRejectedValueOnce(
      new DealerStaffError('DUPLICATE_EMAIL', 'Email already exists')
    );

    const request = new Request('http://localhost/api/dealers/dealer-1/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@dealership.com' }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ dealerId }),
    });

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.code).toBe('DUPLICATE_EMAIL');
  });
});

describe('GET /api/dealers/[dealerId]/staff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns staff list for authorized admin', async () => {
    const dealerId = 'dealer-1';
    const session = { userId: 'admin-1', dealerId, role: 'DEALER_ADMIN' as const };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(listDealerStaff).mockResolvedValueOnce([
      {
        id: 'staff-1',
        email: 'staff1@dealership.com',
        name: 'Staff One',
        status: 'active',
      },
      {
        id: 'staff-2',
        email: 'staff2@dealership.com',
        name: 'Staff Two',
        status: 'pending',
      },
    ] as any);

    const request = new Request('http://localhost/api/dealers/dealer-1/staff', {
      method: 'GET',
    });

    const response = await GET(request, {
      params: Promise.resolve({ dealerId }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.staff).toHaveLength(2);
    expect(data.staff[0].email).toBe('staff1@dealership.com');
    expect(data.staff[0].status).toBe('active');
  });

  it('returns 403 when user requests staff for different dealer', async () => {
    const dealerId = 'dealer-2';
    const session = {
      userId: 'admin-1',
      dealerId: 'dealer-1',
      role: 'DEALER_ADMIN' as const,
    };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);

    const request = new Request('http://localhost/api/dealers/dealer-2/staff', {
      method: 'GET',
    });

    const response = await GET(request, {
      params: Promise.resolve({ dealerId }),
    });

    expect(response.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    const dealerId = 'dealer-1';
    vi.mocked(requireAuth).mockImplementationOnce(() => {
      throw new AuthError('UNAUTHORIZED', 'No session');
    });

    const request = new Request('http://localhost/api/dealers/dealer-1/staff', {
      method: 'GET',
    });

    const response = await GET(request, {
      params: Promise.resolve({ dealerId }),
    });

    expect(response.status).toBe(401);
  });
});
