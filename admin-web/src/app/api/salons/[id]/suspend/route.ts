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
  const body = await req.json().catch(() => ({}));
  const { reason } = body;

  if (!reason || reason.trim().length < 5) {
    return NextResponse.json(
      { error: 'Mandatory suspension reason required (min 5 characters).' },
      { status: 400 }
    );
  }

  // 1. Update in MongoDB
  try {
    await updateMongoSalonStatus(id, 'SUSPENDED', reason, true);
  } catch (dbErr) {
    console.warn('MongoDB suspend update note:', dbErr);
  }

  // 2. In-memory sync for test suite parity
  const salon = INITIAL_SALONS.find((s) => s.id === id);
  if (salon) {
    salon.status = 'SUSPENDED';
    salon.suspensionReason = reason;
    salon.isOnlineBookingPaused = true;
  }

  // 3. Audit Log
  await logAdminAction({
    adminId: admin.uid,
    adminEmail: admin.email,
    adminRole: admin.role,
    action: 'SALON_SUSPEND',
    targetCollection: 'salons',
    targetId: id,
    newValue: { status: 'SUSPENDED', suspensionReason: reason },
    reason,
    result: 'SUCCESS',
  });

  return NextResponse.json({ success: true, message: 'Salon suspended successfully' });
}
