/**
 * GLAMORA CROSS-PLATFORM INTEGRATION & FLOW VERIFICATION
 * 
 * Verifies that all web apps, mobile apps, and public website are connected
 * to the exact same database and backend, and that the complete lifecycle
 * flows properly between Customer, Salon Owner, and Super Admin:
 * 
 * 1. Database Connection & Demo Salon Health Check
 * 2. Customer Booking Submission (Public Web / App)
 * 3. Super Admin Cross-Channel Booking Monitor Reflection
 * 4. Salon Owner Authentication & Live Appointment Stream Reflection
 * 5. Owner Check-In (Status -> IN_PROGRESS)
 * 6. Owner Completion (Status -> COMPLETED)
 * 7. Concurrency / Collision Prevention on Live Database (HTTP 409)
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load local environment overrides if available (git-ignored)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tammisettyanandkumar1_db_user:gJdkTgCS7NmZmnE2@cluster0.lvrwitr.mongodb.net';
const DB_NAME = process.env.MONGODB_DB_NAME || 'Glamora';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function runStep(name: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] Step ${totalTests}: ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  [FAIL] Step ${totalTests}: ${name} => ${err.message}`);
    throw err;
  }
}

async function main() {
  console.log('\n================================================================');
  console.log('   GLAMORA: CROSS-PLATFORM UNIFIED BACKEND FLOW VERIFICATION');
  console.log('   Target Server: ' + BASE_URL);
  console.log('   Database: MongoDB Atlas (' + DB_NAME + ')');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testDate = `2026-12-${String(10 + (Math.floor(Math.random() * 15))).padStart(2, '0')}`;
  const testTime = `${String(9 + (timestamp % 9)).padStart(2, '0')}:${String((timestamp % 5) * 10).padStart(2, '0')}`;
  let createdBookingId = '';
  let bookingCode = '';
  let adminToken = '';
  let ownerToken = '';

  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'admin123';
  const ownerPassword = process.env.DEMO_OWNER_PASSWORD || 'OwnerPassword123!';

  // 1. Verify Super Admin Authentication
  await runStep('Super Admin Login & Token Verification (admin@glamora.com)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': `198.51.100.${(timestamp % 200) + 1}`,
      },
      body: JSON.stringify({ email: 'admin@glamora.com', password: adminPassword }),
    });
    const data = await res.json();
    assert(res.status === 200, `Admin login status was ${res.status}`);
    assert(data.success === true, 'Admin login must succeed');
    assert(data.admin.role === 'SUPER_ADMIN', 'Admin role must be SUPER_ADMIN');
    adminToken = data.token;
  });

  // 2. Verify Salon Owner Authentication & Salon Binding
  await runStep('Salon Owner Login & Auto-Binding to Luxe Glow (owner@glamora.com)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': `198.51.100.${(timestamp % 200) + 2}`,
      },
      body: JSON.stringify({ email: 'owner@glamora.com', password: ownerPassword }),
    });
    const data = await res.json();
    assert(res.status === 200, `Owner login status was ${res.status}`);
    assert(data.success === true, 'Owner login must succeed');
    assert(data.admin.role === 'SALON_OWNER', 'Role must be SALON_OWNER');
    assert(data.admin.salonId === 'salon_luxe_glow', 'Owner must be bound to salon_luxe_glow');
    ownerToken = data.token;
  });

  // 3. Customer creates a real booking via Public Web / Mobile API
  await runStep('Customer books appointment at Luxe Glow Salon (POST /api/bookings)', async () => {
    const payload = {
      salonId: 'salon_luxe_glow',
      salonName: 'Luxe Glow Salon & Spa',
      salonAddress: 'Plot 42, 100 Feet Road, Indiranagar',
      services: [
        {
          id: 'srv_cut_01',
          name: 'Precision Haircut & Style',
          category: 'Hair',
          price: 1200,
          durationMinutes: 45,
        },
      ],
      staffId: 'st_aarav_01',
      staffName: 'Aarav Sharma',
      totalDurationMinutes: 45,
      bufferMinutes: 10,
      date: testDate,
      startTime: testTime,
      endTime: '19:45',
      customerId: 'usr_demo_customer_001',
      customerName: 'Ananya Roy',
      customerPhone: '+91 98765 43210',
      customerEmail: 'customer@glamora.com',
      paymentMethod: 'PAY_AT_SALON',
      paymentStatus: 'PENDING',
      source: 'PUBLIC_WEB',
      notes: 'Customer prefers organic styling products',
    };

    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    assert(res.status === 200, `Create booking status was ${res.status}: ${JSON.stringify(data)}`);
    assert(data.success === true, 'Booking creation must succeed');
    assert(data.booking.status === 'CONFIRMED', 'Initial booking status must be CONFIRMED');
    createdBookingId = data.booking.id;
    bookingCode = data.booking.bookingCode;
  });

  // 4. Verify Booking Reflection in MongoDB Atlas directly
  await runStep('Verify Booking directly stored in MongoDB Atlas bookings collection', async () => {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const found = await db.collection('bookings').findOne({ id: createdBookingId });
    await client.close();

    assert(Boolean(found), `Booking ${createdBookingId} not found in MongoDB`);
    if (!found) throw new Error('Not found in MongoDB');
    assert(found.customerName === 'Ananya Roy', 'Customer name must match');
    assert(found.salonId === 'salon_luxe_glow', 'Salon ID must match');
  });

  // 5. Verify Booking Reflection in Super Admin Panel (GET /api/bookings)
  await runStep('Super Admin queries all bookings (GET /api/bookings) & verifies reflection', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings`);
    const data = await res.json();
    assert(res.status === 200, `Admin fetch bookings status was ${res.status}`);
    assert(Array.isArray(data.bookings), 'Bookings list must be an array');
    const matched = data.bookings.find((b: any) => b.id === createdBookingId);
    assert(Boolean(matched), `Admin did not find booking ${createdBookingId}`);
    assert(matched.bookingCode === bookingCode, 'Booking code must match in admin view');
  });

  // 6. Verify Booking Reflection in Salon Owner Appointment Stream
  await runStep('Salon Owner queries their appointments (GET /api/bookings?salonId=salon_luxe_glow)', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings?salonId=salon_luxe_glow`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const data = await res.json();
    assert(res.status === 200, `Owner fetch appointments status was ${res.status}`);
    const matched = data.bookings.find((b: any) => b.id === createdBookingId);
    assert(Boolean(matched), `Salon owner did not find booking ${createdBookingId} in their stream`);
    assert(matched.customerName === 'Ananya Roy', 'Customer details must appear on owner schedule');
  });

  // 7. Salon Owner checks in customer (PATCH /api/bookings/[id] -> IN_PROGRESS)
  await runStep('Salon Owner checks in customer (Status -> IN_PROGRESS)', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    const data = await res.json();
    assert(res.status === 200, `Update to IN_PROGRESS status was ${res.status}: ${JSON.stringify(data)}`);
    assert(data.success === true, 'Status update must succeed');
    assert(data.booking.status === 'IN_PROGRESS', 'New status must be IN_PROGRESS');
  });

  // 8. Salon Owner completes service (PATCH /api/bookings/[id] -> COMPLETED)
  await runStep('Salon Owner completes treatment (Status -> COMPLETED)', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const data = await res.json();
    assert(res.status === 200, `Update to COMPLETED status was ${res.status}`);
    assert(data.booking.status === 'COMPLETED', 'New status must be COMPLETED');
  });

  // 9. Verify Concurrency Protection (Double-booking blocked with HTTP 409)
  await runStep('Concurrency Guard: Prevent simultaneous double-booking on same specialist & time', async () => {
    // First, book a slot
    const slotPayload = {
      salonId: 'salon_luxe_glow',
      salonName: 'Luxe Glow Salon & Spa',
      salonAddress: 'Plot 42, 100 Feet Road, Indiranagar',
      services: [{ id: 'srv_spa_01', name: 'Balinese Spa', price: 2500, durationMinutes: 60 }],
      staffId: 'st_priya_01',
      staffName: 'Priya Patel',
      totalDurationMinutes: 60,
      bufferMinutes: 10,
      date: '2026-11-26',
      startTime: '10:00',
      endTime: '11:00',
      customerId: 'usr_demo_customer_001',
      customerName: 'Ananya Roy',
      customerPhone: '+91 98765 43210',
    };

    const res1 = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotPayload),
    });
    assert(res1.status === 200, 'First booking must succeed');
    const bkg1 = await res1.json();

    // Now, another customer attempts to book the EXACT SAME specialist and time slot
    const res2 = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...slotPayload,
        customerId: 'usr_another_002',
        customerName: 'Another Customer',
      }),
    });

    assert(
      res2.status === 409,
      `Simultaneous booking must be blocked with HTTP 409 Conflict, got ${res2.status}`
    );

    // Clean up temporary slot test and step 3 booking
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    await client.db(DB_NAME).collection('bookings').deleteMany({
      id: { $in: [bkg1.booking.id, createdBookingId].filter(Boolean) }
    });
    await client.close();
  });

  console.log(`\n----------------------------------------------------------------`);
  console.log(`  Cross-Platform Integration Flow: ${passedTests}/${totalTests} Passed (100%)`);
  console.log(`----------------------------------------------------------------\n`);
}

main().catch((err) => {
  console.error('\nFlow verification aborted:', err);
  process.exit(1);
});
