export {};

import assert from 'assert';

/**
 * Validates whether a token string is a valid Expo Push Token
 */
function isExpoPushToken(token: any): boolean {
  if (typeof token !== 'string') return false;
  return /^(ExponentPushToken|ExpoPushToken)\[.+\]$/.test(token.trim());
}

interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  badge?: number;
}

function preparePushPayloads(messages: ExpoPushMessage | ExpoPushMessage[]): Array<ExpoPushMessage & { to: string }> {
  const msgList = Array.isArray(messages) ? messages : [messages];
  const validMessages: Array<ExpoPushMessage & { to: string }> = [];

  for (const m of msgList) {
    const recipients = Array.isArray(m.to) ? m.to : [m.to];
    for (const token of recipients) {
      if (isExpoPushToken(token)) {
        validMessages.push({
          ...m,
          to: token,
          sound: m.sound === undefined ? 'default' : m.sound,
          channelId: m.channelId || 'glamora-default',
        });
      }
    }
  }
  return validMessages;
}

function chunkPushMessages<T>(items: T[], size: number = 100): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function formatBookingCreatedCustomerNotification(booking: any) {
  const serviceList = booking.services.map((s: any) => s.name).join(', ');
  return {
    title: 'Booking Confirmed! ✨',
    body: `Your appointment at ${booking.salonName} for ${serviceList} is scheduled for ${booking.date} at ${booking.startTime}.`,
    type: 'BOOKING_CONFIRMED',
    bookingId: booking.id,
    data: { salonId: booking.salonId, date: booking.date, time: booking.startTime },
  };
}

function formatBookingCreatedOwnerNotification(booking: any) {
  const serviceList = booking.services.map((s: any) => s.name).join(', ');
  return {
    title: 'New Appointment Booked 📅',
    body: `${booking.customerName} booked ${serviceList} on ${booking.date} at ${booking.startTime}.`,
    type: 'NEW_BOOKING',
    bookingId: booking.id,
    data: { salonId: booking.salonId, customerPhone: booking.customerPhone },
  };
}

function formatBookingStatusNotification(booking: any, status: string, delayMinutes?: number) {
  switch (status) {
    case 'COMPLETED':
      return {
        title: 'Appointment Completed 🎉',
        body: `Thank you for visiting ${booking.salonName}! How was your service with ${booking.staffName}?`,
        type: 'COMPLETED',
        bookingId: booking.id,
      };
    case 'CANCELLED':
      return {
        title: 'Booking Cancelled ❌',
        body: `Your appointment at ${booking.salonName} for ${booking.date} has been cancelled.`,
        type: 'CANCELLED',
        bookingId: booking.id,
      };
    case 'DELAYED':
      return {
        title: 'Appointment Schedule Update ⏳',
        body: `Your appointment at ${booking.salonName} is delayed${delayMinutes ? ` by ~${delayMinutes} mins` : ''}. We apologize for the wait!`,
        type: 'DELAY',
        bookingId: booking.id,
      };
    case 'CONFIRMED':
    default:
      return {
        title: 'Appointment Confirmed! 💇',
        body: `${booking.salonName} confirmed your upcoming visit for ${booking.date} at ${booking.startTime}.`,
        type: 'BOOKING_CONFIRMED',
        bookingId: booking.id,
      };
  }
}

async function main() {
  console.log('================================================================');
  console.log('   GLAMORA PUSH NOTIFICATION SYSTEM AUTOMATED TEST SUITE');
  console.log('   Zero-Firebase Architecture: Expo Push HTTP/2 Gateway + APNs/FCM');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  async function runTest(name: string, fn: () => Promise<void> | void) {
    totalTests++;
    try {
      await fn();
      console.log(`  [PASS] ${totalTests.toString().padStart(2, ' ')}. ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  [FAIL] ${totalTests.toString().padStart(2, ' ')}. ${name}`);
      console.error(`         ${err.message}`);
    }
  }

  // 1. Token validation
  await runTest('isExpoPushToken validates official ExponentPushToken format', () => {
    assert(isExpoPushToken('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'));
    assert(isExpoPushToken('ExpoPushToken[1234567890abcdef]'));
    assert(!isExpoPushToken(''));
    assert(!isExpoPushToken(null));
    assert(!isExpoPushToken(undefined));
    assert(!isExpoPushToken('fcm_token_invalid_prefix'));
    assert(!isExpoPushToken('ExponentPushToken[]'));
  });

  // 2. Push message formatting and invalid token filtering
  await runTest('preparePushPayloads handles empty recipients gracefully without error', () => {
    const payloads = preparePushPayloads([]);
    assert(payloads.length === 0);
  });

  await runTest('preparePushPayloads filters invalid tokens and attaches sound + channelId', () => {
    const payloads = preparePushPayloads([
      {
        to: ['ExponentPushToken[valid_token_1]', 'invalid_token_junk'],
        title: 'Upcoming Appointment',
        body: 'Reminder: Haircut in 1 hour',
      },
    ]);
    assert(payloads.length === 1);
    assert(payloads[0].to === 'ExponentPushToken[valid_token_1]');
    assert(payloads[0].sound === 'default');
    assert(payloads[0].channelId === 'glamora-default');
  });

  // 3. Batch chunking for large recipient volumes (Expo 100-item limit per batch)
  await runTest('chunkPushMessages splits large recipient lists into batches of 100', () => {
    const dummyTokens = Array.from({ length: 250 }, (_, i) => `ExponentPushToken[token_${i}]`);
    const messages = dummyTokens.map((t) => ({ to: t, title: 'Notice', body: 'Test' }));
    const batches = chunkPushMessages(messages, 100);
    assert(batches.length === 3);
    assert(batches[0].length === 100);
    assert(batches[1].length === 100);
    assert(batches[2].length === 50);
  });

  // 4. Booking creation customer & owner push payloads
  const mockBooking = {
    id: 'bkg_push_test_001',
    bookingCode: 'GLAM-9812',
    salonId: 'salon_001',
    salonName: 'Luxe Hair & Spa',
    customerId: 'cust_001',
    customerName: 'Aarav Patel',
    customerPhone: '+91 98765 43210',
    staffId: 'staff_01',
    staffName: 'Elena Rostova',
    services: [{ id: 'srv_1', name: 'Signature Haircut', price: 1200, durationMinutes: 45 }],
    date: '2026-11-20',
    startTime: '14:00',
  };

  await runTest('formatBookingCreatedCustomerNotification formats correct customer confirmation', () => {
    const notif = formatBookingCreatedCustomerNotification(mockBooking);
    assert(notif.type === 'BOOKING_CONFIRMED');
    assert(notif.title.includes('Booking Confirmed'));
    assert(notif.body.includes('Luxe Hair & Spa'));
    assert(notif.body.includes('Signature Haircut'));
    assert(notif.body.includes('2026-11-20'));
    assert(notif.body.includes('14:00'));
  });

  await runTest('formatBookingCreatedOwnerNotification formats correct owner notification', () => {
    const notif = formatBookingCreatedOwnerNotification(mockBooking);
    assert(notif.type === 'NEW_BOOKING');
    assert(notif.title.includes('New Appointment Booked'));
    assert(notif.body.includes('Aarav Patel'));
    assert(notif.body.includes('Signature Haircut'));
  });

  // 5. Booking status updates
  await runTest('formatBookingStatusNotification handles COMPLETED status with review prompt', () => {
    const notif = formatBookingStatusNotification(mockBooking, 'COMPLETED');
    assert(notif.type === 'COMPLETED');
    assert(notif.title.includes('Appointment Completed'));
    assert(notif.body.includes('Elena Rostova'));
  });

  await runTest('formatBookingStatusNotification handles CANCELLED status', () => {
    const notif = formatBookingStatusNotification(mockBooking, 'CANCELLED');
    assert(notif.type === 'CANCELLED');
    assert(notif.title.includes('Booking Cancelled'));
  });

  await runTest('formatBookingStatusNotification handles DELAYED status with custom delay minutes', () => {
    const notif = formatBookingStatusNotification(mockBooking, 'DELAYED', 20);
    assert(notif.type === 'DELAY');
    assert(notif.title.includes('Schedule Update'));
    assert(notif.body.includes('~20 mins'));
  });

  console.log('\n----------------------------------------------------------------');
  console.log(`  Push Notification System Test Results: ${passedTests}/${totalTests} Passed`);
  console.log('----------------------------------------------------------------\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
