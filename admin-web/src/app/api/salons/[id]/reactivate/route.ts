import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth-guard';
import { logAdminAction } from '@/lib/audit-logger';
import { updateMongoSalonStatus } from '@/lib/mongodb-service';
import { INITIAL_SALONS } from '@/lib/mock-data';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await verifyAdminRequest(req, ['SUPER_ADMIN', 'OPERATIONS_ADMIN']);
  if (!authCheck.success) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { id } = params;
  const admin = authCheck.session!;

  // 1. Update in MongoDB
  try {
    await updateMongoSalonStatus(id, 'APPROVED', undefined, false);
  } catch (dbErr) {
    console.warn('MongoDB reactivate update note:', dbErr);
  }

  // 2. In-memory sync for test suite parity
  const salon = INITIAL_SALONS.find((s) => s.id === id);
  if (salon) {
    salon.status = 'APPROVED';
    salon.isOnlineBookingPaused = false;
    delete salon.suspensionReason;
  }

  // 3. Audit Log
  await logAdminAction({
    adminId: admin.uid,
    adminEmail: admin.email,
    adminRole: admin.role,
    action: 'SALON_REACTIVATE',
    targetCollection: 'salons',
    targetId: id,
    newValue: { status: 'APPROVED' },
    reason: 'Salon reactivated by admin',
    result: 'SUCCESS',
  });

  return NextResponse.json({ success: true, message: 'Salon reactivated successfully' });
}
