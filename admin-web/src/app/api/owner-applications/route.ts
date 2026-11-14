import { NextRequest, NextResponse } from 'next/server';
import { getMongoOwnerApplications, insertMongoOwnerApplication, insertMongoAuditLog } from '@/lib/mongodb-service';
import { OwnerApplication } from '@/lib/types';
import { verifyAdminRequest } from '@/lib/auth-guard';
import { verifyJwtToken } from '@/lib/jwt-security';

export async function GET(req: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(req, ['SUPER_ADMIN', 'OPERATIONS_ADMIN']);
    if (authCheck.success) {
      const applications = await getMongoOwnerApplications();
      return NextResponse.json({ success: true, count: applications.length, applications });
    }

    // Check if caller is authenticated owner checking their own applications
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    if (token) {
      try {
        const caller = verifyJwtToken(token);
        const callerEmail = caller.email ? String(caller.email).toLowerCase().trim() : '';
        const callerId = caller.uid || caller.id || '';
        const all = await getMongoOwnerApplications();
        const userApps = all.filter(
          (a) =>
            (callerEmail && a.ownerEmail?.toLowerCase().trim() === callerEmail) ||
            (callerId && a.ownerId === callerId)
        );
        return NextResponse.json({ success: true, count: userApps.length, applications: userApps });
      } catch {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: authCheck.error || 'Unauthorized: Admin authentication required' },
      { status: authCheck.status || 401 }
    );
  } catch (error: any) {
    console.error('API /owner-applications GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: OwnerApplication = await req.json();

    if (!body.salonName || !body.ownerEmail || !body.ownerName) {
      return NextResponse.json(
        { error: 'Missing required onboarding application fields' },
        { status: 400 }
      );
    }

    const application: OwnerApplication = {
      ...body,
      id: body.id || `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'PENDING_APPROVAL',
      submittedAt: new Date().toISOString(),
    };

    await insertMongoOwnerApplication(application);

    // Record audit log
    await insertMongoAuditLog({
      id: `log_${Date.now()}`,
      adminId: 'system',
      adminEmail: body.ownerEmail,
      adminRole: 'OPERATIONS_ADMIN',
      action: 'SALON_APPLICATION_SUBMITTED',
      targetCollection: 'owner_applications',
      targetId: application.id,
      reason: `New salon application submitted for "${body.salonName}" by ${body.ownerName}`,
      timestamp: new Date().toISOString(),
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      message: 'Salon application submitted to MongoDB',
      application,
    });
  } catch (error: any) {
    console.error('API /owner-applications POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit application' }, { status: 500 });
  }
}
