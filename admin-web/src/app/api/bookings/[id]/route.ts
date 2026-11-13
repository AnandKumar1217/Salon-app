import { NextRequest, NextResponse } from 'next/server';
import { updateMongoBookingStatus } from '@/lib/mongodb-service';
import { verifyJwtToken } from '@/lib/jwt-security';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/mongodb-service';
import { notifyBookingStatusUpdated } from '@/lib/push-notifications';

const ALLOWED_STATUSES = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED', 'NO_SHOW'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const cookieToken = req.cookies.get('glamora_admin_token')?.value;
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Authentication token is required' }, { status: 401 });
    }

    try {
      verifyJwtToken(token);
    } catch {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    const bookingId = params.id;
    const body = await req.json();

    if (!body.status || !ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    await updateMongoBookingStatus(bookingId, body.status, body.delayMinutes);

    // Retrieve booking and dispatch real push notifications (non-blocking)
    (async () => {
      try {
        const db = await getDatabase();
        const booking = await db.collection(COLLECTIONS.BOOKINGS).findOne({ id: bookingId });
        if (booking) {
          await notifyBookingStatusUpdated(booking as any, body.status, body.delayMinutes);
        }
      } catch (err: any) {
        console.warn('[Push Notification] Status update push note:', err.message);
      }
    })();

    return NextResponse.json({
      success: true,
      message: `Booking ${bookingId} status updated to ${body.status}`,
    });
  } catch (error: any) {
    console.error('API /bookings/[id] PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update booking status' }, { status: 500 });
  }
}

