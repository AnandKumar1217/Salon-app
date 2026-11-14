/**
 * GLAMORA PHASE 3: LIVE HTTP ENDPOINT INTEGRATION TESTS
 * Executes real HTTP requests against http://localhost:3001
 */

import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_characters_long';
const ISSUER = 'glamora-platform';
const AUDIENCE = 'glamora-clients';

console.log('\n================================================================');
console.log('   GLAMORA PHASE 3: LIVE HTTP ENDPOINT INTEGRATION TESTS');
console.log(`   Target Server: ${BASE_URL}`);
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
  const uniqueTimestamp = Date.now();
  const testCustomerEmail = `customer_live_${uniqueTimestamp}@example.com`;
  const testCustomerPassword = 'SecureP@ssword2026!';
  const testIp = `198.51.${Math.floor(Math.random() * 100) + 1}.${Math.floor(Math.random() * 200) + 10}`;
  let customerToken = '';
  let adminToken = '';

  // 1. Customer Registration API
  await runTest('POST /api/auth/customer/register: Register valid customer', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({
        name: 'Live Test Customer',
        email: testCustomerEmail,
        password: testCustomerPassword,
        phone: '+91 98765 43210',
      }),
    });
    const body = await res.json();
    assert(res.status === 200 || res.status === 201, `Status was ${res.status}: ${JSON.stringify(body)}`);
    assert(body.success === true, 'Success must be true');
    assert(typeof body.token === 'string', 'Token must be returned');
    assert(body.user.email === testCustomerEmail, 'Email matches');
    assert(!('passwordHash' in body.user), 'passwordHash must never be exposed');
    customerToken = body.token;
  });

  // 2. Customer Registration Validation API
  await runTest('POST /api/auth/customer/register: Reject invalid email and duplicate', async () => {
    // Bad email
    const badEmailRes = await fetch(`${BASE_URL}/api/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({
        name: 'Test',
        email: 'invalid-email-no-domain',
        password: testCustomerPassword,
      }),
    });
    assert(badEmailRes.status === 400, `Bad email status was ${badEmailRes.status}`);

    // Short password
    const shortPassRes = await fetch(`${BASE_URL}/api/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({
        name: 'Test',
        email: `new_${Date.now()}@example.com`,
        password: 'short',
      }),
    });
    assert(shortPassRes.status === 400, `Short password status was ${shortPassRes.status}`);

    // Duplicate email
    const dupRes = await fetch(`${BASE_URL}/api/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({
        name: 'Duplicate',
        email: testCustomerEmail,
        password: testCustomerPassword,
      }),
    });
    assert(dupRes.status === 409, `Duplicate email status was ${dupRes.status}`);
  });

  // 3. Customer Login API
  await runTest('POST /api/auth/customer/login: Successful login and wrong password rejection', async () => {
    // Correct login
    const loginRes = await fetch(`${BASE_URL}/api/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: testCustomerPassword,
      }),
    });
    const loginBody = await loginRes.json();
    assert(loginRes.status === 200, `Login status was ${loginRes.status}: ${JSON.stringify(loginBody)}`);
    assert(loginBody.success === true, 'Login success');
    assert(typeof loginBody.token === 'string', 'Login returns token');

    // Wrong password
    const wrongRes = await fetch(`${BASE_URL}/api/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: 'WrongPassword123!',
      }),
    });
    assert(wrongRes.status === 401, `Wrong password status was ${wrongRes.status}`);
  });

  // 4. Password Reset API
  await runTest('POST /api/auth/password-reset: Anti-enumeration & dispatch message', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({ email: testCustomerEmail }),
    });
    const body = await res.json();
    assert(res.status === 200, `Password reset status was ${res.status}`);
    assert(body.success === true, 'Success is true');
    assert(body.message.includes('password reset instructions have been dispatched'), 'Uniform message returned');
  });

  // 5. OTP Send API
  await runTest('POST /api/auth/otp/send: Dispatch OTP without exposing digits', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({ phone: `+91 99${String(uniqueTimestamp).slice(-8)}` }),
    });
    const body = await res.json();
    assert(res.status === 200, `OTP send status was ${res.status}: ${JSON.stringify(body)}`);
    assert(body.success === true, 'OTP send success');
    assert(body.message.includes('dispatched via SMS'), 'Message confirms SMS dispatch');
    assert(!('otp' in body), 'OTP code must not be exposed');
    assert(!('code' in body), 'OTP code must not be exposed');
  });

  // 6. Super Admin Login & Cookie Issuance
  await runTest('POST /api/auth/login: Admin login & session cookie headers', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': testIp },
      body: JSON.stringify({
        email: 'admin@glamora.com',
        password: 'admin123',
      }),
    });
    const body = await res.json();
    assert(res.status === 200, `Admin login status was ${res.status}: ${JSON.stringify(body)}`);
    assert(body.success === true, 'Admin login success');
    assert(typeof body.token === 'string', 'Token issued');
    adminToken = body.token;

    // Verify Set-Cookie header
    const setCookie = res.headers.get('set-cookie') || '';
    assert(setCookie.includes('glamora_admin_token='), 'Sets glamora_admin_token cookie');
    assert(setCookie.includes('HttpOnly'), 'Cookie is HttpOnly');
    assert(setCookie.includes('Path=/'), 'Cookie path is root');
  });

  // 7. Protected Route Authorization (RBAC Gate)
  await runTest('GET /api/admin-users: RBAC Gate (Unauthenticated 401, Customer 403, Admin 200)', async () => {
    // 1. Unauthenticated -> 401
    const unauthRes = await fetch(`${BASE_URL}/api/admin-users`);
    assert(unauthRes.status === 401, `Unauthenticated status was ${unauthRes.status}`);

    // 2. Customer Token -> 403 Forbidden
    const validCustomerToken = customerToken || jwt.sign(
      { uid: 'usr_test_cust', email: 'cust@example.com', role: 'customer' },
      JWT_SECRET,
      { algorithm: 'HS256', issuer: ISSUER, audience: AUDIENCE }
    );
    const custRes = await fetch(`${BASE_URL}/api/admin-users`, {
      headers: { Authorization: `Bearer ${validCustomerToken}` },
    });
    assert(custRes.status === 403, `Customer token status was ${custRes.status}`);

    // 3. Super Admin Token -> 200 OK
    const validAdminToken = adminToken || jwt.sign(
      { uid: 'adm_super_01', email: 'admin@glamora.com', adminRole: 'SUPER_ADMIN', role: 'SUPER_ADMIN' },
      JWT_SECRET,
      { algorithm: 'HS256', issuer: ISSUER, audience: AUDIENCE }
    );
    const adminRes = await fetch(`${BASE_URL}/api/admin-users`, {
      headers: { Authorization: `Bearer ${validAdminToken}` },
    });
    assert(adminRes.status === 200, `Admin token status was ${adminRes.status}`);
    const adminBody = await adminRes.json();
    assert(adminBody.success === true, 'Admin users fetched');
    assert(Array.isArray(adminBody.admins), 'Admins list returned');
  });

  // 8. Admin Logout API & Cookie Clearance
  await runTest('POST /api/auth/logout: Wipes session cookie with Max-Age 0', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
    });
    assert(res.status === 200, `Logout status was ${res.status}`);
    const setCookie = res.headers.get('set-cookie') || '';
    assert(setCookie.includes('glamora_admin_token='), 'References cookie name');
    assert(setCookie.includes('Max-Age=0'), 'Sets Max-Age=0');
  });

  console.log('\n----------------------------------------------------------------');
  console.log(`  Live Integration Test Results: ${passedTests}/${totalTests} Passed`);
  console.log('----------------------------------------------------------------\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal live test error:', err);
  process.exit(1);
});
