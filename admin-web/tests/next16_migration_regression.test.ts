import assert from 'node:assert';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  [PASS]  ${name}`);
  } catch (err: any) {
    console.error(`  [FAIL]  ${name}`);
    console.error(`         Error: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  console.log('\n================================================================');
  console.log('   GLAMORA NEXT.JS 16 & REACT 19 MIGRATION REGRESSION SUITE');
  console.log(`   Target Server: ${BASE_URL}`);
  console.log('================================================================\n');

  let adminCookie = '';
  let adminToken = '';
  const timestamp = Date.now();

  // 1. Health check & zero secret exposure
  await runTest('1. /api/health returns HTTP 200 and zero exposed secrets', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');
    assert.ok(data.services.database, 'Missing database status');
    assert.ok(data.services.media, 'Missing media status');
    assert.ok(data.services.auth, 'Missing auth status');

    const raw = JSON.stringify(data);
    assert.ok(!raw.includes('mongodb+srv'), 'MongoDB URI secret leaked!');
    assert.ok(!raw.includes('CLOUDINARY_API_SECRET'), 'Cloudinary secret leaked!');
    assert.ok(!raw.includes('JWT_SECRET'), 'JWT secret leaked!');
  });

  // 2. Admin Authentication
  await runTest('2. Super Admin login issues HttpOnly cookie and JWT token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': `198.51.100.${(timestamp % 200) + 1}`,
      },
      body: JSON.stringify({
        email: 'admin@glamora.com',
        password: 'admin123',
      }),
    });

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.token, 'Expected JWT token in login response');
    adminToken = data.token;

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie && setCookie.includes('glamora_admin_token='), 'Expected admin cookie');
    assert.ok(setCookie.toLowerCase().includes('httponly'), 'Expected HttpOnly');
    const match = setCookie.match(/glamora_admin_token=([^;]+)/);
    adminCookie = match ? match[1] : '';
  });

  // 3. Next 16 Async Dynamic Route: /api/bookings/[id] PATCH
  await runTest('3. Async Route Handler: PATCH /api/bookings/[id] successfully resolves params Promise', async () => {
    const fakeBookingId = `bkg_next16_${timestamp}`;
    const res = await fetch(`${BASE_URL}/api/bookings/${fakeBookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'CONFIRMED',
      }),
    });

    // Should successfully execute route logic and return 200 (or handled response)
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // 4. Next 16 Async Dynamic Route: /api/salons/[id]/approve POST
  await runTest('4. Async Route Handler: POST /api/salons/[id]/approve resolves params Promise', async () => {
    const fakeAppId = `app_next16_${timestamp}`;
    const res = await fetch(`${BASE_URL}/api/salons/${fakeAppId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    // Should reach the handler and return 200
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // 5. Next 16 Async Dynamic Route: /api/salons/[id]/reject POST with validation
  await runTest('5. Async Route Handler: POST /api/salons/[id]/reject enforces validation and resolves params', async () => {
    const fakeAppId = `app_next16_${timestamp}`;
    const res = await fetch(`${BASE_URL}/api/salons/${fakeAppId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        reason: 'Next.js 16 verification rejection justification',
      }),
    });

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // 6. Next 16 Async Dynamic Route: /api/salons/[id]/suspend POST
  await runTest('6. Async Route Handler: POST /api/salons/[id]/suspend resolves params and halts salon', async () => {
    const fakeSalonId = `salon_next16_${timestamp}`;
    const res = await fetch(`${BASE_URL}/api/salons/${fakeSalonId}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        reason: 'Routine compliance audit for Next.js 16 migration',
      }),
    });

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // 7. Next 16 Async Dynamic Route: /api/salons/[id]/reactivate POST
  await runTest('7. Async Route Handler: POST /api/salons/[id]/reactivate resolves params and restores salon', async () => {
    const fakeSalonId = `salon_next16_${timestamp}`;
    const res = await fetch(`${BASE_URL}/api/salons/${fakeSalonId}/reactivate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // 8. Next 16 proxy.ts CORS verification: OPTIONS Preflight for allowed origin
  await runTest('8. Proxy CORS: OPTIONS preflight returns HTTP 204 with exact origin and Vary header', async () => {
    const res = await fetch(`${BASE_URL}/api/salons`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
      },
    });

    assert.strictEqual(res.status, 204, `Expected 204, got ${res.status}`);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.strictEqual(res.headers.get('access-control-allow-credentials'), 'true');
    assert.ok(res.headers.get('vary')?.includes('Origin'), 'Expected Vary: Origin');
  });

  // 9. Next 16 proxy.ts CORS verification: OPTIONS Preflight for unapproved origin
  await runTest('9. Proxy CORS: OPTIONS preflight rejects unapproved origin with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/api/salons`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://evil-unauthorized-hacker.com',
        'Access-Control-Request-Method': 'POST',
      },
    });

    assert.strictEqual(res.status, 403, `Expected 403, got ${res.status}`);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), null);
  });

  // 10. Next 16 proxy.ts CSRF Defense: Cross-origin state mutation with cookie
  await runTest('10. Proxy CSRF: Untrusted cross-origin request carrying cookie is blocked (HTTP 403)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://phishing-site.org',
        'Cookie': `glamora_admin_token=${adminCookie}`,
      },
      body: JSON.stringify({ email: 'attacker@evil.com' }),
    });

    assert.strictEqual(res.status, 403, `Expected 403, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.error.includes('CSRF Protection'), 'Expected CSRF protection error');
  });

  // 11. React 19 Client Component Dynamic Page: /salons/[id]
  await runTest('11. React 19 Dynamic Route Page: GET /salons/salon_1 returns HTTP 200 with UI', async () => {
    const res = await fetch(`${BASE_URL}/salons/salon_1`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert.ok(html.includes('Luxe Salon &amp; Spa') || html.includes('Luxe Salon & Spa') || html.includes('salon'), 'Expected salon page HTML');
  });

  console.log('\n----------------------------------------------------------------');
  console.log('  Next.js 16 & React 19 Migration Regression: 11/11 Passed');
  console.log('----------------------------------------------------------------\n');
}

main().catch((err) => {
  console.error('Fatal error in regression suite:', err);
  process.exit(1);
});

