import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth-guard';
import { logAdminAction } from '@/lib/audit-logger';
import { updateMongoActivityRequestStatus } from '@/lib/mongodb-service';
import { notifyActivityRequestDecision } from '@/lib/push-notifications';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authCheck = await verifyAdminRequest(req, ['SUPER_ADMIN', 'OPERATIONS_ADMIN']);
  if (!authCheck.success) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { id } = await context.params;
  const admin = authCheck.session!;
  const body = await req.json().catch(() => ({}));
  const { reason } = body;

  if (!reason || reason.trim().length < 5) {
    return NextResponse.json(
      { error: 'Mandatory rejection reason required (min 5 characters).' },
      { status: 400 }
    );
  }

  try {
    const updated = await updateMongoActivityRequestStatus(id, 'REJECTED', admin.email, reason.trim());
    if (!updated) {
      return NextResponse.json({ error: 'Activity request not found' }, { status: 404 });
    }

    // Push notification to salon owner
    if (updated.ownerId) {
      notifyActivityRequestDecision(
        updated.ownerId,
        updated.salonName,
        updated.title,
        'REJECTED',
        reason.trim()
      ).catch((err) => console.warn('Push notify activity reject error:', err.message));
    }

    // Audit log
    await logAdminAction({
      adminId: admin.uid,
      adminEmail: admin.email,
      adminRole: admin.role,
      action: 'ACTIVITY_REQUEST_REJECT',
      targetCollection: 'activity_requests',
      targetId: id,
      newValue: { status: 'REJECTED', rejectionReason: reason.trim() },
      reason: reason.trim(),
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      message: 'Activity request rejected with reason',
      request: updated,
    });
  } catch (err: any) {
    console.error('API /activity-requests/[id]/reject error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to reject activity request' },
      { status: 500 }
    );
  }
}
