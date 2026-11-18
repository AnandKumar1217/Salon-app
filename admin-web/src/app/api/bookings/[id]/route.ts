import { NextRequest, NextResponse } from 'next/server';
import { updateMongoBookingStatus, getMongoBookingById, COLLECTIONS } from '@/lib/mongodb-service';
import { verifyJwtToken } from '@/lib/jwt-security';
import { getDatabase } from '@/lib/mongodb';
import { notifyBookingStatusUpdated } from '@/lib/push-notifications';

const ALLOWED_STATUSES = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED', 'NO_SHOW'];

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id: bookingId } = await context.params;
    const booking = await getMongoBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: `Booking ${bookingId} not found` }, { status: 404 });
    }

    const callerId = caller.uid || caller.id || '';
    const callerEmail = caller.email ? String(caller.email).toLowerCase().trim() : '';
    const roles: string[] = Array.isArray(caller.roles)
      ? caller.roles.map((r: string) => String(r).toLowerCase())
      : caller.role
      ? [String(caller.role).toLowerCase()]
      : [];
    if (caller.adminRole) {
      roles.push(String(caller.adminRole).toLowerCase());
    }

    const isAdmin =
      roles.includes('super_admin') ||
      roles.includes('operations_admin') ||
      roles.includes('support_admin') ||
      roles.includes('finance_admin') ||
      caller.adminRole === 'SUPER_ADMIN' ||
      caller.adminRole === 'OPERATIONS_ADMIN';

    const isCustomer =
      (callerId && booking.customerId === callerId) ||
      (callerEmail && booking.customerEmail && booking.customerEmail.toLowerCase().trim() === callerEmail);

    let isSalonOwner = caller.salonId === booking.salonId;
    if (!isSalonOwner && roles.includes('salon_owner')) {
      try {
        const db = await getDatabase();
        const salon = await db.collection(COLLECTIONS.SALONS).findOne({
          id: booking.salonId,
          $or: [{ ownerId: callerId }, { ownerEmail: callerEmail }],
        });
        if (salon) isSalonOwner = true;
      } catch (err) {
        console.error('[Bookings GET] Salon check error:', err);
      }
    }

    if (!isAdmin && !isSalonOwner && !isCustomer) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this booking' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('API /bookings/[id] GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id: bookingId } = await context.params;
    const body = await req.json().catch(() => ({}));

    if (!body.status || !ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Lookup booking from MongoDB
    const booking = await getMongoBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: `Booking ${bookingId} not found` }, { status: 404 });
    }

    // Determine caller roles & identity
    const callerId = caller.uid || caller.id || '';
    const callerEmail = caller.email ? String(caller.email).toLowerCase().trim() : '';
    const roles: string[] = Array.isArray(caller.roles)
      ? caller.roles.map((r: string) => String(r).toLowerCase())
      : caller.role
      ? [String(caller.role).toLowerCase()]
      : [];
    if (caller.adminRole) {
      roles.push(String(caller.adminRole).toLowerCase());
    }

    const isAdmin =
      roles.includes('super_admin') ||
      roles.includes('operations_admin') ||
      caller.adminRole === 'SUPER_ADMIN' ||
      caller.adminRole === 'OPERATIONS_ADMIN';

    let isAuthorized = false;

    if (isAdmin) {
      // Super Admin and Operations Admin can perform any valid status transition
      isAuthorized = true;
    } else {
      // Check if caller is Salon Owner of this booking's salon
      let isSalonOwner = false;
      if (caller.salonId && caller.salonId === booking.salonId) {
        isSalonOwner = true;
      } else if (roles.includes('salon_owner')) {
        try {
          const db = await getDatabase();
          const salon = await db.collection(COLLECTIONS.SALONS).findOne({
            id: booking.salonId,
            $or: [
              { ownerId: callerId },
              { ownerEmail: callerEmail },
            ],
          });
          if (salon) {
            isSalonOwner = true;
          }
        } catch (dbErr) {
          console.error('[Bookings PATCH] Salon ownership check error:', dbErr);
        }
      }

      if (isSalonOwner) {
        isAuthorized = true;
      } else {
        // Check if caller is the Customer who owns this booking
        const isBookingCustomer =
          (callerId && booking.customerId === callerId) ||
          (callerEmail && booking.customerEmail && booking.customerEmail.toLowerCase().trim() === callerEmail);

        if (isBookingCustomer) {
          // Customers are strictly restricted: can ONLY cancel their own booking
          if (body.status !== 'CANCELLED') {
            return NextResponse.json(
              { error: 'Forbidden: Customers are only permitted to cancel their own bookings' },
              { status: 403 }
            );
          }
          if (booking.status === 'COMPLETED') {
            return NextResponse.json(
              { error: 'Cannot cancel a booking that has already been completed' },
              { status: 400 }
            );
          }
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to modify this booking' },
        { status: 403 }
      );
    }

    await updateMongoBookingStatus(
      bookingId,
      body.status,
      body.delayMinutes,
      body.cancellationReason
    );

    // Retrieve booking and dispatch real push notifications (non-blocking)
    (async () => {
      try {
        const db = await getDatabase();
        const updatedBooking = await db.collection(COLLECTIONS.BOOKINGS).findOne({ id: bookingId });
        if (updatedBooking) {
          await notifyBookingStatusUpdated(updatedBooking as any, body.status, body.delayMinutes);
        }
      } catch (err: any) {
        console.warn('[Push Notification] Status update push note:', err.message);
      }
    })();

    return NextResponse.json({
      success: true,
      message: `Booking ${bookingId} status updated to ${body.status}`,
      booking: { id: bookingId, status: body.status },
    });
  } catch (error: any) {
    console.error('API /bookings/[id] PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update booking status' }, { status: 500 });
  }
}
