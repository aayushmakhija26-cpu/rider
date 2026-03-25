import type { Role } from '@prisma/client';

export type RouteAccess = 'public' | 'unauthenticated-only' | Role[];

// ORDERING IS LOAD-BEARING: more-specific prefixes must precede less-specific ones.
// e.g. /dashboard/security/billing must come before /dashboard.
// When adding new sub-routes, insert ABOVE the parent catch-all.
export const ROUTE_RULES: Array<{ prefix: string; access: RouteAccess }> = [
  { prefix: '/sign-in', access: 'unauthenticated-only' },
  { prefix: '/sign-up', access: 'unauthenticated-only' },
  { prefix: '/unauthorized', access: 'public' },
  { prefix: '/api/', access: 'public' },
  // Admin-only sub-route — must remain BEFORE /dashboard catch-all
  { prefix: '/dashboard/security/billing', access: ['DEALER_ADMIN'] },
  // Dealer portal
  { prefix: '/dashboard', access: ['DEALER_ADMIN', 'DEALER_STAFF'] },
  // SysAdmin portal
  { prefix: '/sysadmin', access: ['SYSADMIN'] },
  // Consumer portal
  { prefix: '/consumer', access: ['CONSUMER'] },
];

export function getRoleHome(role: Role): string {
  switch (role) {
    case 'SYSADMIN': return '/sysadmin/dashboard';
    case 'CONSUMER': return '/consumer/dashboard';
    default: return '/dashboard';
  }
}
