import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyJwtToken } from '@/lib/jwt-security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    let userId = searchParams.get('userId');
    if (token) {
      try {
        const decoded = verifyJwtToken(token);
        userId = decoded.uid || userId;
      } catch {
        // use query param fallback
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const notifications = await db
      .collection('notifications')
      .find({ userId })
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
    const body = await req.json().catch(() => ({}));
    const { id, markAll, userId } = body;

    const db = await getDatabase();

    if (markAll && userId) {
      await db.collection('notifications').updateMany(
        { userId },
        { $set: { read: true, updatedAt: new Date().toISOString() } }
      );
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (id) {
      await db.collection('notifications').updateOne(
        { id },
        { $set: { read: true, updatedAt: new Date().toISOString() } }
      );
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ error: 'Notification ID or userId required' }, { status: 400 });
  } catch (error: any) {
    console.error('API /notifications PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

