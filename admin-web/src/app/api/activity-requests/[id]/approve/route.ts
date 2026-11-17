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

  try {
    const updated = await updateMongoActivityRequestStatus(id, 'APPROVED', admin.email);
    if (!updated) {
      return NextResponse.json({ error: 'Activity request not found' }, { status: 404 });
    }

    // Push notification to salon owner
    if (updated.ownerId) {
      notifyActivityRequestDecision(
        updated.ownerId,
        updated.salonName,
        updated.title,
        'APPROVED'
      ).catch((err) => console.warn('Push notify activity approve error:', err.message));
    }

    // Audit log
    await logAdminAction({
      adminId: admin.uid,
      adminEmail: admin.email,
      adminRole: admin.role,
      action: 'ACTIVITY_REQUEST_APPROVE',
      targetCollection: 'activity_requests',
      targetId: id,
      newValue: { status: 'APPROVED' },
      reason: `Activity request "${updated.title}" approved by ${admin.email}`,
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      message: 'Activity request approved successfully',
      request: updated,
    });
  } catch (err: any) {
    console.error('API /activity-requests/[id]/approve error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to approve activity request' },
      { status: 500 }
    );
  }
}
