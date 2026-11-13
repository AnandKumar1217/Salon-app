import { NextRequest, NextResponse } from 'next/server';
import { getMongoOwnerApplications, insertMongoOwnerApplication, insertMongoAuditLog } from '@/lib/mongodb-service';
import { OwnerApplication } from '@/lib/types';

export async function GET() {
  try {
    const applications = await getMongoOwnerApplications();
    return NextResponse.json({ success: true, count: applications.length, applications });
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
