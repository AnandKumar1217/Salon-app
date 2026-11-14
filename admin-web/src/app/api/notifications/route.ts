import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyJwtToken } from '@/lib/jwt-security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization') || '';
    const cookieToken = req.cookies.get('glamora_admin_token')?.value;
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Authentication token is required' }, { status: 401 });
    }

    let caller: any;
    try {
      caller = verifyJwtToken(token);
    } catch {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    const callerId = caller.uid || caller.id || '';
    const isAdmin =
      caller.adminRole === 'SUPER_ADMIN' ||
      caller.adminRole === 'OPERATIONS_ADMIN' ||
      caller.role === 'SUPER_ADMIN' ||
      (Array.isArray(caller.roles) && (caller.roles.includes('super_admin') || caller.roles.includes('SUPER_ADMIN')));

    const requestedUserId = searchParams.get('userId');
    const targetUserId = isAdmin && requestedUserId ? requestedUserId : callerId;

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const notifications = await db
      .collection('notifications')
      .find({ userId: targetUserId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n) => ({
        id: n.id || n._id.toString(),
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        bookingId: n.bookingId,
        read: n.read ?? false,
        createdAt: n.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('API /notifications GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const cookieToken = req.cookies.get('glamora_admin_token')?.value;
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Authentication token is required' }, { status: 401 });
    }

    let caller: any;
    try {
      caller = verifyJwtToken(token);
    } catch {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    const callerId = caller.uid || caller.id || '';
    const isAdmin =
      caller.adminRole === 'SUPER_ADMIN' ||
      caller.adminRole === 'OPERATIONS_ADMIN' ||
      caller.role === 'SUPER_ADMIN' ||
      (Array.isArray(caller.roles) && (caller.roles.includes('super_admin') || caller.roles.includes('SUPER_ADMIN')));

    const body = await req.json().catch(() => ({}));
    const { id, markAll, userId } = body;

    const db = await getDatabase();

    if (markAll) {
      const targetUserId = isAdmin && userId ? userId : callerId;
      await db.collection('notifications').updateMany(
        { userId: targetUserId },
        { $set: { read: true, updatedAt: new Date().toISOString() } }
      );
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (id) {
      const query: any = { id };
      if (!isAdmin) {
        query.userId = callerId;
      }
      const result = await db.collection('notifications').updateOne(
        query,
        { $set: { read: true, updatedAt: new Date().toISOString() } }
      );
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Notification not found or access denied' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ error: 'Notification ID or markAll required' }, { status: 400 });
  } catch (error: any) {
    console.error('API /notifications PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}
