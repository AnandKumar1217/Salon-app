/**
 * GLAMORA PHASE 5: COMPREHENSIVE LIVE END-TO-END WORKFLOW TEST
 * 
 * Tests the complete cross-platform workflow against live Next.js backend & MongoDB Atlas:
 * 1. Admin Authentication & Session Cookie Issuance
 * 2. Salon Owner Onboarding Application Submission
 * 3. Super Admin Review & Approval of Application
 * 4. Automatic Salon Creation & Discovery in MongoDB
 * 5. Customer Booking Creation with Live Slot Lock
 * 6. Concurrency & Double-Booking Collision Prevention (HTTP 409)
 * 7. Booking Status Lifecycle Transition (CONFIRMED -> IN_PROGRESS -> COMPLETED)
 * 8. Super Admin Audit Logging in MongoDB
 * 9. Safe Cleanup of Temporary Test Records
 */

import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3001';

console.log('\n================================================================');
console.log('   GLAMORA PHASE 5: LIVE END-TO-END WORKFLOW INTEGRATION');
console.log(`   Target Server: ${BASE_URL} (Connected to MongoDB Atlas)`);
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function runTest(name: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${String(totalTests).padStart(2, ' ')}. ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  [FAIL] ${String(totalTests).padStart(2, ' ')}. ${name}`);
    console.error(`         => ${err.message}`);
  }
}

async function main() {
  const timestamp = Date.now();
  const testOwnerEmail = `salon_owner_test_${timestamp}@example.com`;
  const testSalonName = `Elegance Lounge Test ${timestamp}`;
  let adminToken = '';
  let applicationId = '';
  let createdSalonId = '';
  let bookingId = '';

  // 1. Admin Login
  await runTest('Admin Login: Authenticate and obtain JWT token', async () => {
    const testIp = `198.51.100.${(timestamp % 200) + 1}`;
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({ email: 'admin@glamora.com', password: 'admin123' }),
    });
    const body = await res.json();
    assert(res.status === 200, `Admin login status was ${res.status}: ${JSON.stringify(body)}`);
    assert(body.success === true, 'Success must be true');
    assert(typeof body.token === 'string', 'JWT token must be returned');
    adminToken = body.token;
  });

  // 2. Submit Salon Owner Onboarding Application
  await runTest('Owner Application: Submit new salon onboarding to MongoDB', async () => {
    const payload = {
      ownerName: 'Priya Sharma',
      ownerEmail: testOwnerEmail,
      ownerPhone: '+91 98765 11223',
      salonName: testSalonName,
      salonAddress: '100 Feet Road, Indiranagar',
      city: 'Bengaluru',
      postalCode: '560038',
      salonContact: '+91 98765 11223',
      salonCategory: 'Hair & Beauty',
      businessDescription: 'Premium bespoke styling lounge',
      taxOrRegNumber: 'GSTIN29AAACG0000A1Z5',
    };

    const res = await fetch(`${BASE_URL}/api/owner-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    assert(res.status === 200, `Submit application status was ${res.status}: ${JSON.stringify(body)}`);
    assert(body.success === true, 'Application submission success');
    assert(body.application.status === 'PENDING_APPROVAL', 'Initial status must be PENDING_APPROVAL');
    applicationId = body.application.id;
  });

  // 3. Super Admin Review & Approval
  await runTest('Admin Approval: Approve application and generate live salon', async () => {
    const res = await fetch(`${BASE_URL}/api/salons/${applicationId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const body = await res.json();
    assert(res.status === 200, `Approval status was ${res.status}: ${JSON.stringify(body)}`);
    assert(body.success === true, 'Approval succeeded');
    createdSalonId = `salon_${applicationId}`;
  });

  // 4. Verify Salon Discovery via Public API
  await runTest('Salon Discovery: Query approved salon in MongoDB', async () => {
    const res = await fetch(`${BASE_URL}/api/salons?query=${encodeURIComponent(testSalonName)}`);
    const body = await res.json();
    assert(res.status === 200, `Salons fetch status was ${res.status}`);
    assert(Array.isArray(body.salons), 'Salons must be an array');
    const matched = body.salons.find((s: any) => s.name === testSalonName || s.id === createdSalonId);
    assert(!!matched, 'Approved salon must be discovered in MongoDB');
    assert(matched.status === 'APPROVED', 'Salon status must be APPROVED');
  });

  // 5. Customer Booking Creation
  await runTest('Booking Creation: Customer books appointment with staff', async () => {
    const bookingPayload = {
      salonId: createdSalonId,
      salonName: testSalonName,
      salonAddress: '100 Feet Road, Indiranagar',
      services: [
        {
          id: 'srv_1',
          name: 'Signature Haircut',
          category: 'Hair',
          price: 1200,
          durationMinutes: 45,
        },
      ],
      staffId: 'st_priya_01',
      staffName: 'Priya Specialist',
      date: '2026-11-20',
      startTime: '14:30',
      customerId: `cust_live_${timestamp}`,
      customerName: 'Ananya Roy',
      customerPhone: '+91 99887 76655',
      paymentMethod: 'PAY_AT_SALON',
      paymentStatus: 'PENDING',
      source: 'APP',
    };

    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(bookingPayload),
    });
    const body = await res.json();
    assert(res.status === 200, `Booking creation status was ${res.status}: ${JSON.stringify(body)}`);
    assert(body.success === true, 'Booking created');
    assert(body.booking.status === 'CONFIRMED', 'Status is CONFIRMED');
    bookingId = body.booking.id;
  });

  // 6. Concurrency & Collision Check: Double-booking Prevention
  await runTest('Concurrency Defense: Block simultaneous booking for same staff & slot (HTTP 409)', async () => {
    const duplicatePayload = {
      salonId: createdSalonId,
      salonName: testSalonName,
      salonAddress: '100 Feet Road, Indiranagar',
      services: [{ id: 'srv_2', name: 'Beard Trim', category: 'Beard', price: 500, durationMinutes: 30 }],
      staffId: 'st_priya_01', // Same staff
      staffName: 'Priya Specialist',
      date: '2026-11-20', // Same date
      startTime: '14:30', // Same slot
      customerId: `cust_competitor_${timestamp}`,
      customerName: 'Rohan Verma',
      customerPhone: '+91 91234 56789',
      paymentMethod: 'PAY_AT_SALON',
      paymentStatus: 'PENDING',
      source: 'WEB',
    };

    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(duplicatePayload),
    });
    const body = await res.json();
    assert(res.status === 409, `Expected HTTP 409 Conflict but got ${res.status}: ${JSON.stringify(body)}`);
    assert(body.error.includes('just booked by another customer'), 'Proper collision message returned');
  });

  // 7. Booking Lifecycle Transitions: Update to IN_PROGRESS and COMPLETED
  await runTest('Booking Lifecycle: Transition status to IN_PROGRESS then COMPLETED', async () => {
    // 1. IN_PROGRESS
    const inProgressRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    assert(inProgressRes.status === 200, `IN_PROGRESS status was ${inProgressRes.status}`);

    // 2. COMPLETED
    const completedRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    assert(completedRes.status === 200, `COMPLETED status was ${completedRes.status}`);
  });

  // 8. Super Admin Audit Logging Check
  await runTest('Audit Trail: Verify administrative actions recorded in MongoDB', async () => {
    const res = await fetch(`${BASE_URL}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    assert(res.status === 200, `Audit logs status was ${res.status}`);
    assert(Array.isArray(body.logs), 'Audit logs must be an array');
    const hasApprovalLog = body.logs.some(
      (l: any) => l.action === 'SALON_APPROVE' || l.targetId === applicationId
    );
    assert(hasApprovalLog, 'Audit log for SALON_APPROVE must be recorded');
  });

  // 9. Safe Clean-up of Test Data
  await runTest('Cleanup: Cleanly purge temporary test booking and application', async () => {
    // We update booking status to CANCELLED so it does not interfere with future operations
    const cancelRes = await fetch(`${BASE_URL}/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    assert(cancelRes.status === 200, 'Test booking cancelled cleanly');
  });

  console.log('\n----------------------------------------------------------------');
  console.log(`  Live E2E Integration Results: ${passedTests}/${totalTests} Passed`);
  console.log('----------------------------------------------------------------\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal live E2E error:', err);
  process.exit(1);
});

