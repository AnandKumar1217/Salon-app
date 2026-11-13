export {};

/**
 * GLAMORA PHASE 8: PRODUCTION CORS & CSRF SECURITY TEST SUITE
 * 
 * Verifies:
 * 1. Allowed origin preflight OPTIONS returns 204 with exact origin and credentials
 * 2. Unapproved origin preflight OPTIONS returns 403 Forbidden
 * 3. Allowed origin GET returns 200 with Access-Control-Allow-Origin matching caller
 * 4. Unapproved origin GET returns 200 WITHOUT Access-Control-Allow-Origin
 * 5. State-changing POST from unapproved origin with cookie credentials blocked (HTTP 403 CSRF)
 * 6. Native mobile / server-to-server request without Origin header succeeds cleanly
 * 7. Vary: Origin is correctly attached to responses
 * 8. Preflight Max-Age caching header is present (86400)
 */

const BASE_URL = 'http://localhost:3001';

console.log('\n================================================================');
console.log('   GLAMORA PHASE 8: PRODUCTION CORS & CSRF SECURITY TEST SUITE');
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
    console.error(`         Error: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  const allowedOrigin = 'http://localhost:3002';
  const unapprovedOrigin = 'http://unauthorized-domain.com';

  await runTest('Preflight OPTIONS for allowed origin returns HTTP 204 with exact origin', async () => {
    const res = await fetch(`${BASE_URL}/api/salons`, {
      method: 'OPTIONS',
      headers: {
        'Origin': allowedOrigin,
        'Access-Control-Request-Method': 'POST',
      },
    });

    assert(res.status === 204, `Expected HTTP 204 but received ${res.status}`);
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert(allowOrigin === allowedOrigin, `Expected origin ${allowedOrigin} but got ${allowOrigin}`);
    assert(res.headers.get('access-control-allow-credentials') === 'true', 'Expected credentials true');
    assert(Boolean(res.headers.get('vary')?.includes('Origin')), 'Expected Vary: Origin');
    assert(res.headers.get('access-control-max-age') === '86400', 'Expected Max-Age 86400');
  });

  await runTest('Preflight OPTIONS for unapproved origin is rejected with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/api/salons`, {
      method: 'OPTIONS',
      headers: {
        'Origin': unapprovedOrigin,
        'Access-Control-Request-Method': 'POST',
      },
    });

    assert(res.status === 403, `Expected HTTP 403 Forbidden but received ${res.status}`);
    const data = await res.json();
    assert(data.error?.includes('CORS Forbidden'), `Expected CORS Forbidden error, got: ${JSON.stringify(data)}`);
  });

  await runTest('GET request with allowed origin attaches Access-Control-Allow-Origin', async () => {
    const res = await fetch(`${BASE_URL}/api/salons`, {
      headers: { 'Origin': allowedOrigin },
    });

    assert(res.status === 200, `Expected HTTP 200 but received ${res.status}`);
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert(allowOrigin === allowedOrigin, `Expected ${allowedOrigin} but got ${allowOrigin}`);
    assert(res.headers.get('access-control-allow-credentials') === 'true', 'Expected credentials true');
  });

  await runTest('GET request with unapproved origin does NOT attach Access-Control-Allow-Origin', async () => {
    const res = await fetch(`${BASE_URL}/api/salons`, {
      headers: { 'Origin': unapprovedOrigin },
    });

    assert(res.status === 200, `Expected HTTP 200 but received ${res.status}`);
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert(!allowOrigin, `Expected NO Access-Control-Allow-Origin header for unapproved origin, got ${allowOrigin}`);
  });

  await runTest('State-changing POST with cookie credentials from unapproved origin blocked (HTTP 403 CSRF)', async () => {
    const res = await fetch(`${BASE_URL}/api/salons`, {
      method: 'POST',
      headers: {
        'Origin': unapprovedOrigin,
        'Cookie': 'glamora_admin_token=fake_session_token_123',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Tamper Salon' }),
    });

    assert(res.status === 403, `Expected HTTP 403 CSRF rejection but received ${res.status}`);
    const data = await res.json();
    assert(data.error?.includes('CSRF Protection'), `Expected CSRF Protection error, got: ${data.error}`);
  });

  await runTest('Native mobile / server request without Origin header succeeds normally', async () => {
    const res = await fetch(`${BASE_URL}/api/salons`);
    assert(res.status === 200, `Expected HTTP 200 but received ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Expected success: true');
  });

  await runTest('Health check endpoint /api/health returns healthy with DB status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { 'Origin': allowedOrigin },
    });

    assert(res.status === 200, `Expected HTTP 200 but received ${res.status}`);
    const data = await res.json();
    assert(data.status === 'healthy', `Expected healthy status, got: ${data.status}`);
    assert(data.services?.database?.status === 'connected', 'Expected database connected');
  });

  console.log('----------------------------------------------------------------');
  console.log(`  Phase 8 CORS & CSRF Security Results: ${passedTests}/${totalTests} Passed`);
  console.log('----------------------------------------------------------------\n');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
