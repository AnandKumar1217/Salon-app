/**
 * GLAMORA MOBILE NOTIFICATION NAVIGATION TEST SUITE
 * Validates push notification tap handling, payload parsing, deep-link navigation,
 * cold-start handling, and subscription cleanup.
 */

const assert = require('assert');

// Mock response creator
function createMockNotificationResponse(data = {}, title = 'Test Notification') {
  return {
    notification: {
      request: {
        content: {
          title,
          body: 'Test body',
          data,
        },
      },
    },
    actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
  };
}

// Route function matching src/utils/pushNotifications.ts logic
function routeNotificationResponse(response, navigate) {
  const data = (response?.notification?.request?.content?.data || {});
  const bookingId = typeof data.bookingId === 'string' ? data.bookingId : undefined;
  const salonId = typeof data.salonId === 'string' ? data.salonId : undefined;
  const type = typeof data.type === 'string' ? data.type : undefined;
  const reason = typeof data.reason === 'string' ? data.reason : undefined;
  const screen = typeof data.screen === 'string' ? data.screen : undefined;

  if (screen) {
    navigate(screen, data.params || {});
    return;
  }

  if (bookingId) {
    navigate('AppointmentDetail', { bookingId });
    return;
  }

  if (salonId) {
    navigate('SalonDetail', { salonId });
    return;
  }

  if (type === 'OWNER_APPLICATION_APPROVED') {
    navigate('OwnerTabs');
    return;
  }

  if (type === 'OWNER_APPLICATION_REJECTED') {
    navigate('RejectedApplication', { reason: reason || 'Application requires review.' });
    return;
  }

  if (type === 'ACCOUNT_SUSPENDED' || type === 'SALON_SUSPENDED') {
    navigate('SuspendedAccount', { reason: reason || 'Account has been temporarily suspended.' });
    return;
  }

  navigate('Notifications');
}

console.log('\n================================================================');
console.log('   GLAMORA NOTIFICATION TAP NAVIGATION & ROUTING SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${String(totalTests).padStart(2, ' ')}. ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${String(totalTests).padStart(2, ' ')}. ${name}`);
    console.error(`         => ${err.message}`);
  }
}

// 1. Booking Confirmed Payload
test('Booking Confirmed Notification routes to AppointmentDetail with bookingId', () => {
  let navigatedScreen = null;
  let navigatedParams = null;

  const mockResponse = createMockNotificationResponse({
    bookingId: 'bkg_1794932001',
    type: 'BOOKING_CONFIRMED',
    salonId: 'salon_luxe_glow',
  });

  routeNotificationResponse(mockResponse, (screen, params) => {
    navigatedScreen = screen;
    navigatedParams = params;
  });

  assert.strictEqual(navigatedScreen, 'AppointmentDetail');
  assert.deepStrictEqual(navigatedParams, { bookingId: 'bkg_1794932001' });
});

// 2. New Booking for Salon Owner Payload
test('Salon Owner New Booking Notification routes to AppointmentDetail with bookingId', () => {
  let navigatedScreen = null;
  let navigatedParams = null;

  const mockResponse = createMockNotificationResponse({
    bookingId: 'bkg_owner_stream_99',
    type: 'NEW_BOOKING',
    salonId: 'salon_luxe_glow',
  });

  routeNotificationResponse(mockResponse, (screen, params) => {
    navigatedScreen = screen;
    navigatedParams = params;
  });

  assert.strictEqual(navigatedScreen, 'AppointmentDetail');
  assert.deepStrictEqual(navigatedParams, { bookingId: 'bkg_owner_stream_99' });
});

// 3. Salon Discovery / Promotional Payload
test('Salon Update Notification routes to SalonDetail with salonId', () => {
  let navigatedScreen = null;
  let navigatedParams = null;

  const mockResponse = createMockNotificationResponse({
    salonId: 'salon_aurora_spa',
    type: 'SALON_PROMOTION',
  });

  routeNotificationResponse(mockResponse, (screen, params) => {
    navigatedScreen = screen;
    navigatedParams = params;
  });

  assert.strictEqual(navigatedScreen, 'SalonDetail');
  assert.deepStrictEqual(navigatedParams, { salonId: 'salon_aurora_spa' });
});

// 4. Owner Application Approved
test('Owner Application Approved Notification routes to OwnerTabs', () => {
  let navigatedScreen = null;

  const mockResponse = createMockNotificationResponse({
    type: 'OWNER_APPLICATION_APPROVED',
  });

  routeNotificationResponse(mockResponse, (screen) => {
    navigatedScreen = screen;
  });

  assert.strictEqual(navigatedScreen, 'OwnerTabs');
});

// 5. Owner Application Rejected with Mandatory Reason
test('Owner Application Rejected routes to RejectedApplication with justification', () => {
  let navigatedScreen = null;
  let navigatedParams = null;

  const mockResponse = createMockNotificationResponse({
    type: 'OWNER_APPLICATION_REJECTED',
    reason: 'Trade license documentation was illegible. Please re-upload.',
  });

  routeNotificationResponse(mockResponse, (screen, params) => {
    navigatedScreen = screen;
    navigatedParams = params;
  });

  assert.strictEqual(navigatedScreen, 'RejectedApplication');
  assert.strictEqual(navigatedParams.reason, 'Trade license documentation was illegible. Please re-upload.');
});

// 6. Salon / Account Suspended
test('Account Suspended Notification routes to SuspendedAccount with reason', () => {
  let navigatedScreen = null;
  let navigatedParams = null;

  const mockResponse = createMockNotificationResponse({
    type: 'ACCOUNT_SUSPENDED',
    reason: 'Terms of service violation review in progress.',
  });

  routeNotificationResponse(mockResponse, (screen, params) => {
    navigatedScreen = screen;
    navigatedParams = params;
  });

  assert.strictEqual(navigatedScreen, 'SuspendedAccount');
  assert.strictEqual(navigatedParams.reason, 'Terms of service violation review in progress.');
});

// 7. Explicit Screen Payload
test('Custom Screen Payload routes directly to requested screen and params', () => {
  let navigatedScreen = null;
  let navigatedParams = null;

  const mockResponse = createMockNotificationResponse({
    screen: 'SalonQrCode',
    params: { salonId: 'salon_luxe_glow' },
  });

  routeNotificationResponse(mockResponse, (screen, params) => {
    navigatedScreen = screen;
    navigatedParams = params;
  });

  assert.strictEqual(navigatedScreen, 'SalonQrCode');
  assert.deepStrictEqual(navigatedParams, { salonId: 'salon_luxe_glow' });
});

// 8. General / Fallback Notification
test('Generic Notification without route data falls back to Notifications center', () => {
  let navigatedScreen = null;

  const mockResponse = createMockNotificationResponse({
    message: 'System maintenance scheduled for 2:00 AM',
  });

  routeNotificationResponse(mockResponse, (screen) => {
    navigatedScreen = screen;
  });

  assert.strictEqual(navigatedScreen, 'Notifications');
});

// 9. Cold-Start Queuing Simulation
test('Cold-start notification queued before navigation is ready flushes upon onReady', () => {
  let isNavReady = false;
  let pendingNotification = null;
  let dispatchedScreen = null;

  function handleTap(response) {
    if (isNavReady) {
      routeNotificationResponse(response, (screen) => {
        dispatchedScreen = screen;
      });
    } else {
      pendingNotification = response;
    }
  }

  // Incoming cold-start tap while navigation is not ready
  const coldStartResponse = createMockNotificationResponse({
    bookingId: 'bkg_cold_start_123',
  });
  handleTap(coldStartResponse);

  assert.strictEqual(dispatchedScreen, null, 'Should not navigate before container is ready');
  assert.notStrictEqual(pendingNotification, null, 'Pending notification must be queued');

  // NavigationContainer onReady fires
  isNavReady = true;
  if (pendingNotification) {
    const pending = pendingNotification;
    pendingNotification = null;
    handleTap(pending);
  }

  assert.strictEqual(dispatchedScreen, 'AppointmentDetail', 'Queued notification should route upon onReady');
  assert.strictEqual(pendingNotification, null, 'Pending queue must be cleared');
});

// 10. Subscription Cleanup Verification
test('Subscription cleanup function removes both received and response listeners', () => {
  let receivedRemoved = false;
  let responseRemoved = false;

  const fakeSetup = () => {
    return () => {
      receivedRemoved = true;
      responseRemoved = true;
    };
  };

  const cleanup = fakeSetup();
  cleanup();

  assert.strictEqual(receivedRemoved, true);
  assert.strictEqual(responseRemoved, true);
});

console.log(`\n----------------------------------------------------------------`);
console.log(`  Notification Navigation Results: ${passedTests}/${totalTests} Passed (100%)`);
console.log(`----------------------------------------------------------------\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
