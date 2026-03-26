/**
 * Audit service for logging user actions.
 * Used to track registrations, deletions, and other important events.
 */

interface AuditLogData {
  action: string;
  actorId: string;
  actorRole: string;
  dealerId: string;
  targetId: string;
  targetType: string;
  metadata?: Record<string, any>;
}

/**
 * Log an audit event.
 * In production, this would write to an immutable audit log table.
 * For now, we log to console in development.
 */
export async function log(data: AuditLogData): Promise<void> {
  // TODO: In a production system, write to audit_logs table with:
  // - timestamp, action, actorId, actorRole, dealerId, targetId, targetType, metadata
  // - immutable append-only constraint
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', data);
  }
}

export const auditService = { log };
