import { NextRequest, NextResponse } from 'next/server';
import {
  getMongoActivityRequests,
  insertMongoActivityRequest,
  insertMongoAuditLog,
} from '@/lib/mongodb-service';
import { ActivityRequest, ActivityRequestStatus } from '@/lib/types';
import { verifyAdminRequest } from '@/lib/auth-guard';
import { verifyJwtToken } from '@/lib/jwt-security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') as ActivityRequestStatus) || undefined;
    const salonId = searchParams.get('salonId') || undefined;

    const adminCheck = await verifyAdminRequest(req, ['SUPER_ADMIN', 'OPERATIONS_ADMIN']);
    if (adminCheck.success) {
      const requests = await getMongoActivityRequests({ salonId, status });
      return NextResponse.json({ success: true, count: requests.length, requests });
    }

    // Owner token verification
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    if (token) {
      try {
        const caller = verifyJwtToken(token);
        const callerSalonId = caller.salonId;
        const callerId = caller.uid || caller.id || '';

        const all = await getMongoActivityRequests({
          salonId: salonId || callerSalonId,
          status,
        });

        // Filter to owner's records
        const filtered = all.filter(
          (r) =>
            (callerSalonId && r.salonId === callerSalonId) ||
            (callerId && r.ownerId === callerId)
        );

        return NextResponse.json({ success: true, count: filtered.length, requests: filtered });
      } catch {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: adminCheck.error || 'Unauthorized: Authentication required' },
      { status: adminCheck.status || 401 }
    );
  } catch (error: any) {
    console.error('API /activity-requests GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activity requests' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    let callerInfo: { uid?: string; email?: string; salonId?: string } = {};

    if (token) {
      try {
        callerInfo = verifyJwtToken(token);
      } catch {
        return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { salonId, salonName, requestType, title, description, documents, ownerName, ownerEmail } = body;

    if (!salonId || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required activity request fields (salonId, title, description)' },
        { status: 400 }
      );
    }

    const activityReq = await insertMongoActivityRequest({
      salonId,
      salonName: salonName || 'Glamora Partner Salon',
      ownerId: callerInfo.uid || body.ownerId || 'unknown_owner',
      ownerName: ownerName || body.ownerName || 'Salon Owner',
      ownerEmail: callerInfo.email || ownerEmail || '',
      requestType: requestType || 'BRANCH_EXPANSION',
      title,
      description,
      documents: Array.isArray(documents) ? documents : [],
      status: 'PENDING',
    });

    // Record audit log
    await insertMongoAuditLog({
      id: `log_${Date.now()}`,
      adminId: callerInfo.uid || 'system',
      adminEmail: callerInfo.email || ownerEmail || 'owner@glamora.com',
      adminRole: 'OPERATIONS_ADMIN',
      action: 'SALON_ACTIVITY_REQUEST_SUBMITTED',
      targetCollection: 'activity_requests',
      targetId: activityReq.id,
      reason: `Activity request submitted: "${title}" (${requestType}) for salon "${salonName || salonId}"`,
      timestamp: new Date().toISOString(),
      result: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      message: 'Activity request submitted successfully for administrative review',
      request: activityReq,
    });
  } catch (error: any) {
    console.error('API /activity-requests POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit activity request' },
      { status: 500 }
    );
  }
}
