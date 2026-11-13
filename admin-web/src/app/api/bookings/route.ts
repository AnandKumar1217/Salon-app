import { NextRequest, NextResponse } from 'next/server';
import { getMongoBookings, insertMongoBooking } from '@/lib/mongodb-service';
import { Booking } from '@/lib/types';
import { notifyBookingCreated } from '@/lib/push-notifications';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const salonId = searchParams.get('salonId') || undefined;
    const customerId = searchParams.get('customerId') || undefined;

    const bookings = await getMongoBookings({ salonId, customerId });
    return NextResponse.json({ success: true, count: bookings.length, bookings });
  } catch (error: any) {
    console.error('API /bookings GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const booking: Booking = await req.json();

    if (!booking.salonId || !booking.staffId || !booking.date || !booking.startTime) {
      return NextResponse.json(
        { error: 'Missing required booking fields (salonId, staffId, date, startTime)' },
        { status: 400 }
      );
    }

    // Concurrency check: Ensure staff does not have an active CONFIRMED or IN_PROGRESS booking at this exact time
    const existing = await getMongoBookings({ salonId: booking.salonId });
    const hasConflict = existing.some(
      (b) =>
        b.staffId === booking.staffId &&
        b.date === booking.date &&
        b.startTime === booking.startTime &&
        b.status !== 'CANCELLED' &&
        b.status !== 'NO_SHOW'
    );

    if (hasConflict) {
      return NextResponse.json(
        { error: 'This time slot was just booked by another customer. Please select another slot.' },
        { status: 409 }
      );
    }

    const newBooking: Booking = {
      ...booking,
      id: booking.id || `bkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: booking.status || 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await insertMongoBooking(newBooking);

    // Dispatch real push notifications to customer and salon owner (non-blocking)
    notifyBookingCreated(newBooking).catch((err) =>
      console.warn('[Push Notification] Booking push dispatch note:', err.message)
    );

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed and persisted in MongoDB',
      booking: newBooking,
    });
  } catch (error: any) {
    console.error('API /bookings POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create booking' }, { status: 500 });
  }
}

