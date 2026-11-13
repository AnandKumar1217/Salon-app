import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth-guard';
import { getMongoAuditLogs } from '@/lib/mongodb-service';
import { INITIAL_AUDIT_LOGS } from '@/lib/mock-data';
import { AdminAuditLog } from '@/lib/types';

export async function GET(req: NextRequest) {
  const authCheck = await verifyAdminRequest(req, ['SUPER_ADMIN', 'OPERATIONS_ADMIN']);
  if (!authCheck.success) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  let logs: AdminAuditLog[] = [];
  try {
    logs = await getMongoAuditLogs();
  } catch (err) {
    console.warn('MongoDB getMongoAuditLogs notice:', err);
  }

  if (logs.length === 0 && process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'true') {
    logs = INITIAL_AUDIT_LOGS;
  }

  return NextResponse.json({ success: true, logs });
}
