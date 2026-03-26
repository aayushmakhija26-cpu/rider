import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { getStaffInviteState, acceptStaffInvite, DealerStaffError } from '@/src/services/dealerStaff.service';
import { auditService } from '@/src/services/audit.service';

vi.mock('@/src/services/dealerStaff.service');
vi.mock('@/src/services/audit.service');

describe('GET /api/staff-invites/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns valid invite state for active token', async () => {
    const token = 'valid-token-123';
    vi.mocked(getStaffInviteState).mockResolvedValueOnce({
      status: 'valid',
      email: 'staff@dealership.com',
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    } as any);

    const request = new Request(`http://localhost/api/staff-invites/valid-token-123`, {
      method: 'GET',
    });

    const response = await GET(request, {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('valid');
    expect(data.email).toBe('staff@dealership.com');
  });

  it('returns invalid state for unknown token', async () => {
    const token = 'unknown-token';
    vi.mocked(getStaffInviteState).mockResolvedValueOnce({
      status: 'invalid',
    } as any);

    const request = new Request(`http://localhost/api/staff-invites/unknown-token`, {
      method: 'GET',
    });

    const response = await GET(request, {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('invalid');
  });

  it('returns expired state for past expiry', async () => {
    const token = 'expired-token';
    vi.mocked(getStaffInviteState).mockResolvedValueOnce({
      status: 'expired',
      email: 'staff@dealership.com',
    } as any);

    const request = new Request(`http://localhost/api/staff-invites/expired-token`, {
      method: 'GET',
    });

    const response = await GET(request, {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('expired');
  });

  it('returns deactivated state if staff was deactivated', async () => {
    const token = 'deactivated-token';
    vi.mocked(getStaffInviteState).mockResolvedValueOnce({
      status: 'deactivated',
      email: 'staff@dealership.com',
    } as any);

    const request = new Request(`http://localhost/api/staff-invites/deactivated-token`, {
      method: 'GET',
    });

    const response = await GET(request, {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('deactivated');
  });
});

describe('POST /api/staff-invites/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts valid staff invite and returns session token', async () => {
    const token = 'valid-token-123';
    vi.mocked(acceptStaffInvite).mockResolvedValueOnce({
      id: 'staff-1',
      email: 'staff@dealership.com',
      role: 'DEALER_STAFF',
      dealerId: 'dealer-1',
    } as any);
    vi.mocked(auditService.log).mockResolvedValueOnce(undefined);

    const request = new Request(`http://localhost/api/staff-invites/valid-token-123`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('staff@dealership.com');
    expect(vi.mocked(acceptStaffInvite)).toHaveBeenCalledWith(
      token,
      'John Doe',
      expect.any(String) // passwordHash
    );
  });

  it('returns 400 for invalid request body', async () => {
    const token = 'valid-token-123';

    const request = new Request(`http://localhost/api/staff-invites/valid-token-123`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        password: 'short',
        confirmPassword: 'short',
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for mismatched passwords', async () => {
    const token = 'valid-token-123';

    const request = new Request(`http://localhost/api/staff-invites/valid-token-123`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(400);
  });

  it('returns 404 for invalid token', async () => {
    const token = 'invalid-token';
    vi.mocked(acceptStaffInvite).mockRejectedValueOnce(
      new DealerStaffError('INVALID_TOKEN', 'Token not found')
    );

    const request = new Request(`http://localhost/api/staff-invites/invalid-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(404);
  });

  it('returns 410 for expired invite', async () => {
    const token = 'expired-token';
    vi.mocked(acceptStaffInvite).mockRejectedValueOnce(
      new DealerStaffError('INVITE_EXPIRED', 'Invite has expired')
    );

    const request = new Request(`http://localhost/api/staff-invites/expired-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(410);
  });
});
