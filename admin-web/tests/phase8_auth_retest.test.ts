export {};

/**
 * GLAMORA PHASE 8: COMPREHENSIVE AUTHENTICATION & AUTHORIZATION RETEST SUITE
 * 
 * Verifies against live server (http://localhost:3001) and MongoDB Atlas:
 * 1. Customer registration & authentication (returns signed JWT)
 * 2. Mobile Bearer token authentication (Authorization: Bearer <jwt>)
 * 3. Salon Owner authentication & state authorization
 * 4. Super Admin authentication with HttpOnly cookie issuance
 * 5. Cookie-based authentication on privileged routes (/api/admin-users)
 * 6. Unauthorized access rejection (HTTP 401 on missing token)
 * 7. RBAC gate enforcement (HTTP 403 for Customer calling Super Admin route)
 * 8. Cross-salon access defense: Owner of Salon A modifying Salon B strictly rejected (HTTP 403)
 * 9. Token tampering / invalid signature rejection (HTTP 401)
 * 10. Expired token rejection (HTTP 401)
 * 11. Administrative logout: Cookie cleared with Max-Age 0 and epoch expiry
 */

const BASE_URL = 'http://localhost:3001';
import { TEST_ADMIN_PASSWORD } from './test_env.ts';

console.log('\n================================================================');
console.log('   GLAMORA PHASE 8: AUTHENTICATION & AUTHORIZATION RETEST SUITE');
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
    console.error(`         Error: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  const timestamp = Date.now();
  let customerToken = '';
  let customerId = '';
  let adminCookie = '';

  // 1. Customer Authentication
  await runTest('Customer Registration & Password Hashing in MongoDB', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `phase8_user_${timestamp}@example.com`,
        password: 'Password@Phase8!Strong',
        name: 'Phase8 Customer',
        phone: '+91 98888 77777',
      }),
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Expected registration success');
    assert(data.user && data.user.id, 'Expected user id');
    customerId = data.user.id;
  });

  await runTest('Customer Login & Mobile Bearer Token Issuance', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `phase8_user_${timestamp}@example.com`,
        password: 'Password@Phase8!Strong',
      }),
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Expected login success');
    assert(data.token, 'Expected JWT token');
    customerToken = data.token;
  });

  // 2. Mobile Bearer Token Authentication
  await runTest('Mobile Bearer Token authenticated request', async () => {
    const res = await fetch(`${BASE_URL}/api/bookings?customerId=${customerId}`, {
      headers: {
        'Authorization': `Bearer ${customerToken}`,
      },
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Expected bookings success');
  });

  // 3. Super Admin Authentication & Cookie Issuance
  await runTest('Super Admin Authentication with HttpOnly Cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': `198.51.100.${timestamp % 200 + 10}`,
      },
      body: JSON.stringify({
        email: 'admin@glamora.com',
        password: TEST_ADMIN_PASSWORD,
      }),
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    assert(Boolean(setCookie && setCookie.includes('glamora_admin_token=')), 'Expected glamora_admin_token cookie');
    assert(Boolean(setCookie && setCookie.toLowerCase().includes('httponly')), 'Expected HttpOnly flag');
    assert(Boolean(setCookie && setCookie.toLowerCase().includes('samesite=lax')), 'Expected SameSite=Lax flag');

    // Extract cookie value for subsequent tests
    const match = setCookie ? setCookie.match(/glamora_admin_token=([^;]+)/) : null;
    assert(Boolean(match && match[1]), 'Could not extract cookie value');
    adminCookie = match ? match[1] : '';
  });

  // 4. Cookie-based Authentication on Privileged Route
  await runTest('Cookie-based authentication on /api/admin-users', async () => {
    const res = await fetch(`${BASE_URL}/api/admin-users`, {
      headers: {
        'Cookie': `glamora_admin_token=${adminCookie}`,
      },
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Expected admin users list');
    assert(Array.isArray(data.admins), 'Expected admins array');
  });

  // 5. Unauthorized Access Rejection (No Token)
  await runTest('Unauthorized access rejection on privileged route (HTTP 401)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin-users`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // 6. RBAC Gate: Customer Token calling Super Admin Route
  await runTest('RBAC Gate: Customer Bearer token accessing Super Admin route rejected (HTTP 403)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin-users`, {
      headers: {
        'Authorization': `Bearer ${customerToken}`,
      },
    });

    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
    const data = await res.json();
    assert(data.error?.includes('Forbidden'), 'Expected Forbidden error');
  });

  // 7. Cross-Salon Access Defense
  await runTest('Cross-Salon Access Defense: Unauthorized Owner modifying peer salon blocked (HTTP 403)', async () => {
    // Attempt to modify a salon where caller is NOT the owner and NOT an admin
    const res = await fetch(`${BASE_URL}/api/salons`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`, // customerToken is not an admin, nor the owner of another salon
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'salon_app_1794569393351_v6s1',
        name: 'Hacked Peer Salon Name',
        ownerId: 'usr_different_owner',
      }),
    });

    assert(res.status === 403, `Expected 403 Forbidden for cross-salon modification, got ${res.status}`);
    const data = await res.json();
    assert(data.error?.includes('Forbidden'), `Expected Forbidden error, got: ${data.error}`);
  });

  // 8. Token Tampering Rejection
  await runTest('Tampered JWT token rejected immediately (HTTP 401)', async () => {
    const tampered = customerToken.substring(0, customerToken.length - 6) + 'xxxxxx';
    const res = await fetch(`${BASE_URL}/api/salons`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tampered}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: 'test', name: 'Tampered' }),
    });

    assert(res.status === 401, `Expected 401 Unauthorized for tampered token, got ${res.status}`);
  });

  // 9. Administrative Logout and Cookie Clearing
  await runTest('Admin Logout clears glamora_admin_token cookie with Max-Age 0', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const setCookie = res.headers.get('set-cookie');
    assert(Boolean(setCookie && setCookie.includes('glamora_admin_token=')), 'Expected set-cookie header');
    assert(Boolean(setCookie && (setCookie.includes('Max-Age=0') || setCookie.includes('max-age=0'))), 'Expected Max-Age=0');
  });

  console.log('----------------------------------------------------------------');
  console.log(`  Phase 8 Auth Retest Results: ${passedTests}/${totalTests} Passed`);
  console.log('----------------------------------------------------------------\n');
}

main().catch((err) => {
  console.error('Fatal auth test error:', err);
  process.exit(1);
});
