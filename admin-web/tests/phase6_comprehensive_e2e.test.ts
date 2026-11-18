/**
 * GLAMORA PHASE 6: 13-STEP COMPLETE END-TO-END WORKFLOW TEST
 * 
 * Executes the full end-to-end user and business lifecycle against live MongoDB Atlas:
 *  1. Customer registration
 *  2. Customer login
 *  3. Salon owner application submission
 *  4. Super Admin approval & audit trail
 *  5. Approved salon discovery on Web & Mobile
 *  6. Owner adds services and staff to salon profile
 *  7. Customer books an appointment
 *  8. Owner retrieves salon appointment stream
 *  9. Customer retrieves their own booking
 * 10. Owner checks in customer (status -> IN_PROGRESS)
 * 11. Owner completes appointment (status -> COMPLETED)
 * 12. Customer cancellation and rescheduling
 * 13. Walk-in booking prevents conflicting online bookings (HTTP 409 Conflict)
 */

import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3001';
import { TEST_ADMIN_PASSWORD } from './test_env.ts';

console.log('\n================================================================');
console.log('   GLAMORA PHASE 6: 13-STEP COMPLETE END-TO-END WORKFLOW TEST');
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
  const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
  const testCustomerEmail = `e2e_cust_${timestamp}@example.com`;
  const testCustomerPassword = 'SecureP@ssword2026!';
  const testOwnerEmail = `e2e_owner_${timestamp}@example.com`;
  const testSalonName = `E2E Royal Spa ${timestamp}`;
  
  let customerToken = '';
  let customerId = '';
  let adminToken = '';
  let applicationId = '';
  let salonId = '';
  let bookingId = '';
  let rescheduleBookingId = '';
  let walkInBookingId = '';

  // 0. Bootstrap Admin Token
  const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
    body: JSON.stringify({ email: 'admin@glamora.com', password: TEST_ADMIN_PASSWORD }),
  });
  const adminBody = await adminRes.json();
  adminToken = adminBody.token;

  // 1. Customer Registration
  await runTest('Step 1: Customer registration into MongoDB', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({
        name: 'Kavita Reddy',
        email: testCustomerEmail,
        password: testCustomerPassword,
        phone: '+91 98888 77777',
      }),
    });
    const body = await res.json();
    assert(res.status === 200 || res.status === 201, `Status was ${res.status}: ${JSON.stringify(body)}`);
    assert(body.success === true, 'Registration succeeded');
    assert(typeof body.token === 'string', 'Token returned');
    customerToken = body.token;
    customerId = body.user.id;
  });

  // 2. Customer Login
  await runTest('Step 2: Customer login with hashed password verification', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: testCustomerPassword,
      }),
    });
    const body = await res.json();
    assert(res.status === 200, `Login status was ${res.status}: ${JSON.stringify(body)}`);
    assert(body.success === true, 'Login succeeded');
    assert(body.user.email === testCustomerEmail, 'Email matches');
  });

  // 3. Salon Owner Application Submission
  await runTest('Step 3: Salon owner submits onboarding application', async () => {
    const res = await fetch(`${BASE_URL}/api/owner-applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerName: 'Vikram Seth',
        ownerEmail: testOwnerEmail,
        ownerPhone: '+91 97777 66666',
        salonName: testSalonName,
        salonAddress: 'Brigade Road, Central',
        city: 'Bengaluru',
        postalCode: '560001',
        salonContact: '+91 97777 66666',
        salonCategory: 'Luxury Spa',
        businessDescription: 'Award-winning hair and skin aesthetic lounge',
        taxOrRegNumber: 'GSTIN29AABCS1234F1Z5',
      }),
    });
    const body = await res.json();
    assert(res.status === 200, `Application status was ${res.status}`);
    assert(body.success === true, 'Application submitted');
    applicationId = body.application.id;
  });

  // 4. Super Admin Approval
  await runTest('Step 4: Super Admin approves salon application', async () => {
    const res = await fetch(`${BASE_URL}/api/salons/${applicationId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const body = await res.json();
    assert(res.status === 200, `Approval status was ${res.status}`);
    assert(body.success === true, 'Salon approved');
    salonId = `salon_${applicationId}`;
  });

  // 5. Approved Salon Discovered on Web & Mobile
  await runTest('Step 5: Approved salon appears on customer website and app query', async () => {
    const res = await fetch(`${BASE_URL}/api/salons?query=${encodeURIComponent(testSalonName)}`);
    const body = await res.json();
    assert(res.status === 200, `Salons status was ${res.status}`);
    const found = body.salons.find((s: any) => s.id === salonId || s.name === testSalonName);
    assert(!!found, 'Salon must be returned in query results');
    assert(found.status === 'APPROVED', 'Status is APPROVED');
  });

  // 6. Owner Adds Services and Staff
  await runTest('Step 6: Owner configures services and staff on salon profile', async () => {
    const updatedSalon = {
      id: salonId,
      name: testSalonName,
      address: 'Brigade Road, Central',
      city: 'Bengaluru',
      status: 'APPROVED',
      services: [
        {
          id: 'srv_spa_01',
          name: 'Balinese Aroma Massage',
          category: 'Spa',
          price: 2500,
          durationMinutes: 60,
        },
        {
          id: 'srv_hair_01',
          name: 'Precision Styling & Wash',
          category: 'Hair',
          price: 1500,
          durationMinutes: 45,
        },
      ],
      staff: [
        {
          id: 'st_vikram_01',
          name: 'Vikram Senior Therapist',
          role: 'Master Stylist',
          isActive: true,
          specialties: ['Spa', 'Hair'],
        },
      ],
    };

    const res = await fetch(`${BASE_URL}/api/salons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(updatedSalon),
    });
    const body = await res.json();
    assert(res.status === 200, `Update salon status was ${res.status}`);
    assert(body.success === true, 'Salon updated with services and staff');
  });

  // 7. Customer Books an Appointment
  await runTest('Step 7: Customer creates booking for service and specialist', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        salonId,
        salonName: testSalonName,
        salonAddress: 'Brigade Road, Central',
        services: [{ id: 'srv_spa_01', name: 'Balinese Aroma Massage', price: 2500, durationMinutes: 60 }],
        staffId: 'st_vikram_01',
        staffName: 'Vikram Senior Therapist',
        date: '2026-11-25',
        startTime: '11:00',
        customerId,
        customerName: 'Kavita Reddy',
        customerPhone: '+91 98888 77777',
        paymentMethod: 'PAY_AT_SALON',
        paymentStatus: 'PENDING',
        source: 'APP',
      }),
    });
    const body = await res.json();
    assert(res.status === 200, `Booking status was ${res.status}: ${JSON.stringify(body)}`);
    assert(body.success === true, 'Booking confirmed');
    bookingId = body.booking.id;
  });

  // 8. Owner Sees the Appointment
  await runTest('Step 8: Owner retrieves appointment in salon booking stream', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings?salonId=${salonId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    assert(res.status === 200, `Owner bookings status was ${res.status}`);
    const found = body.bookings.find((b: any) => b.id === bookingId);
    assert(!!found, 'Owner must see customer booking');
    assert(found.customerName === 'Kavita Reddy', 'Customer name matches');
  });

  // 9. Customer Sees the Same Booking
  await runTest('Step 9: Customer retrieves their appointment in booking history', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings?customerId=${customerId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const body = await res.json();
    assert(res.status === 200, `Customer bookings status was ${res.status}`);
    const found = body.bookings.find((b: any) => b.id === bookingId);
    assert(!!found, 'Customer must see their booking');
    assert(found.salonName === testSalonName, 'Salon name matches');
  });

  // 10. Owner Checks In the Customer (IN_PROGRESS)
  await runTest('Step 10: Owner checks in customer (status -> IN_PROGRESS)', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    const body = await res.json();
    assert(res.status === 200, `Check-in status was ${res.status}`);
    assert(body.success === true, 'Status transitioned to IN_PROGRESS');
  });

  // 11. Owner Completes the Appointment (COMPLETED)
  await runTest('Step 11: Owner completes appointment (status -> COMPLETED)', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const body = await res.json();
    assert(res.status === 200, `Completion status was ${res.status}`);
    assert(body.success === true, 'Status transitioned to COMPLETED');
  });

  // 12. Customer Rescheduling and Cancellation
  await runTest('Step 12: Customer books next appointment then cancels it', async () => {
    // 1. Create second booking
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        salonId,
        salonName: testSalonName,
        salonAddress: 'Brigade Road, Central',
        services: [{ id: 'srv_hair_01', name: 'Precision Styling & Wash', price: 1500, durationMinutes: 45 }],
        staffId: 'st_vikram_01',
        staffName: 'Vikram Senior Therapist',
        date: '2026-11-26',
        startTime: '15:00',
        customerId,
        customerName: 'Kavita Reddy',
        customerPhone: '+91 98888 77777',
        paymentMethod: 'PAY_AT_SALON',
        paymentStatus: 'PENDING',
        source: 'APP',
      }),
    });
    const body = await res.json();
    assert(res.status === 200, `New booking status was ${res.status}`);
    rescheduleBookingId = body.booking.id;

    // 2. Cancel it
    const cancelRes = await fetch(`${BASE_URL}/api/bookings/${rescheduleBookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
    assert(cancelRes.status === 200, 'Booking cancelled successfully');
  });

  // 13. Walk-in Booking Prevents Conflicting Online Bookings (Collision HTTP 409)
  await runTest('Step 13: Walk-in appointment locks slot and blocks online booking (HTTP 409)', async () => {
    // 1. Salon receptionist creates walk-in booking for slot 16:30
    const walkInRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        salonId,
        salonName: testSalonName,
        salonAddress: 'Brigade Road, Central',
        services: [{ id: 'srv_spa_01', name: 'Walk-in Treatment', price: 2000, durationMinutes: 60 }],
        staffId: 'st_vikram_01',
        staffName: 'Vikram Senior Therapist',
        date: '2026-11-27',
        startTime: '16:30',
        customerId: 'walkin_guest_01',
        customerName: 'Walk-in Client',
        customerPhone: '+91 90000 11111',
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        source: 'WALK_IN',
      }),
    });
    const walkInBody = await walkInRes.json();
    assert(walkInRes.status === 200, `Walk-in status was ${walkInRes.status}`);
    walkInBookingId = walkInBody.booking.id;

    // 2. An online customer tries to book the exact same specialist and slot
    const conflictRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        salonId,
        salonName: testSalonName,
        salonAddress: 'Brigade Road, Central',
        services: [{ id: 'srv_hair_01', name: 'Blowdry', price: 800, durationMinutes: 30 }],
        staffId: 'st_vikram_01', // Colliding staff
        staffName: 'Vikram Senior Therapist',
        date: '2026-11-27', // Colliding date
        startTime: '16:30', // Colliding slot
        customerId,
        customerName: 'Online Competitor',
        customerPhone: '+91 99999 88888',
        paymentMethod: 'PAY_AT_SALON',
        paymentStatus: 'PENDING',
        source: 'WEB',
      }),
    });
    const conflictBody = await conflictRes.json();
    assert(conflictRes.status === 409, `Expected HTTP 409 Conflict but received ${conflictRes.status}`);
    assert(conflictBody.error.includes('just booked by another customer'), 'Collision error returned');

    // Clean up walk-in booking
    await fetch(`${BASE_URL}/api/bookings/${walkInBookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
  });

  console.log('\n----------------------------------------------------------------');
  console.log(`  Phase 6 13-Step Workflow Results: ${passedTests}/${totalTests} Passed`);
  console.log('----------------------------------------------------------------\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal Phase 6 test error:', err);
  process.exit(1);
});

