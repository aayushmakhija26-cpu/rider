import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { requireAuth, AuthError } from '@/lib/auth/session';
import { deactivateStaffAccount, DealerStaffError } from '@/src/services/dealerStaff.service';
import { auditService } from '@/src/services/audit.service';

vi.mock('@/lib/auth/session');
vi.mock('@/src/services/dealerStaff.service');
vi.mock('@/src/services/audit.service');

describe('POST /api/dealers/[dealerId]/staff/[staffUserId]/deactivate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deactivates staff account for authorized admin', async () => {
    const dealerId = 'dealer-1';
    const staffUserId = 'staff-1';
    const session = { userId: 'admin-1', dealerId, role: 'DEALER_ADMIN' as const };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(deactivateStaffAccount).mockResolvedValueOnce(undefined);
    vi.mocked(auditService.log).mockResolvedValueOnce(undefined);

    const request = new Request(
      `http://localhost/api/dealers/dealer-1/staff/staff-1/deactivate`,
      {
        method: 'POST',
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ dealerId, staffUserId }),
    });

    expect(response.status).toBe(200);
    expect(vi.mocked(deactivateStaffAccount)).toHaveBeenCalledWith(
      dealerId,
      staffUserId,
      'admin-1'
    );
  });

  it('returns 403 when attempting to deactivate staff from different dealer', async () => {
    const dealerId = 'dealer-2';
    const staffUserId = 'staff-1';
    const session = {
      userId: 'admin-1',
      dealerId: 'dealer-1',
      role: 'DEALER_ADMIN' as const,
    };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);

    const request = new Request(
      `http://localhost/api/dealers/dealer-2/staff/staff-1/deactivate`,
      {
        method: 'POST',
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ dealerId, staffUserId }),
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.code).toBe('FORBIDDEN');
  });

  it('returns 401 when unauthenticated', async () => {
    const dealerId = 'dealer-1';
    const staffUserId = 'staff-1';

    vi.mocked(requireAuth).mockImplementationOnce(() => {
      throw new AuthError('UNAUTHORIZED', 'No session');
    });

    const request = new Request(
      `http://localhost/api/dealers/dealer-1/staff/staff-1/deactivate`,
      {
        method: 'POST',
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ dealerId, staffUserId }),
    });

    expect(response.status).toBe(401);
  });

  it('returns 404 when staff user not found', async () => {
    const dealerId = 'dealer-1';
    const staffUserId = 'nonexistent';
    const session = { userId: 'admin-1', dealerId, role: 'DEALER_ADMIN' as const };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(deactivateStaffAccount).mockRejectedValueOnce(
      new DealerStaffError('NOT_FOUND', 'Staff user not found')
    );

    const request = new Request(
      `http://localhost/api/dealers/dealer-1/staff/nonexistent/deactivate`,
      {
        method: 'POST',
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ dealerId, staffUserId }),
    });

    expect(response.status).toBe(404);
  });

  it('returns 403 when trying to deactivate an admin', async () => {
    const dealerId = 'dealer-1';
    const staffUserId = 'admin-1';
    const session = { userId: 'admin-1', dealerId, role: 'DEALER_ADMIN' as const };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(deactivateStaffAccount).mockRejectedValueOnce(
      new DealerStaffError('CANNOT_DEACTIVATE_ADMIN', 'Cannot deactivate admin users')
    );

    const request = new Request(
      `http://localhost/api/dealers/dealer-1/staff/admin-1/deactivate`,
      {
        method: 'POST',
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ dealerId, staffUserId }),
    });

    expect(response.status).toBe(403);
  });

  it('is idempotent: deactivating already deactivated user succeeds', async () => {
    const dealerId = 'dealer-1';
    const staffUserId = 'staff-1';
    const session = { userId: 'admin-1', dealerId, role: 'DEALER_ADMIN' as const };

    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(deactivateStaffAccount).mockResolvedValueOnce(undefined);
    vi.mocked(auditService.log).mockResolvedValueOnce(undefined);

    // First deactivation
    const request1 = new Request(
      `http://localhost/api/dealers/dealer-1/staff/staff-1/deactivate`,
      { method: 'POST' }
    );
    const response1 = await POST(request1, {
      params: Promise.resolve({ dealerId, staffUserId }),
    });
    expect(response1.status).toBe(200);

    // Reset mocks and deactivate again
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValueOnce(session as any);
    vi.mocked(deactivateStaffAccount).mockResolvedValueOnce(undefined);
    vi.mocked(auditService.log).mockResolvedValueOnce(undefined);

    const request2 = new Request(
      `http://localhost/api/dealers/dealer-1/staff/staff-1/deactivate`,
      { method: 'POST' }
    );
    const response2 = await POST(request2, {
      params: Promise.resolve({ dealerId, staffUserId }),
    });
    expect(response2.status).toBe(200);
  });
});
