import { AdminAuditLog, AdminRole } from './types';
import { insertMongoAuditLog } from './mongodb-service';
import { INITIAL_AUDIT_LOGS } from './mock-data';

export async function logAdminAction(entry: {
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole;
  action: string;
  targetCollection: string;
  targetId: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
  ipAddress?: string;
  result: 'SUCCESS' | 'FAILURE';
}): Promise<AdminAuditLog> {
  const timestamp = new Date().toISOString();
  const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const logRecord: AdminAuditLog = {
    id,
    timestamp,
    ...entry,
  };

  const isMockFallback = process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'true';

  if (!isMockFallback) {
    try {
      await insertMongoAuditLog(logRecord);
    } catch (e) {
      console.warn('Could not write audit log to MongoDB:', e);
    }
  }

  // Always keep in memory for immediate UI visibility
  INITIAL_AUDIT_LOGS.unshift(logRecord);

  return logRecord;
}
