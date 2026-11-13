# GLAMORA — PHASE 8: PRODUCTION CORS & CSRF SECURITY REMEDIATION

**Date:** November 13, 2026  
**Auditor:** Principal Security Engineer & Cloud Systems Architect  
**Scope:** Replacement of Wildcard CORS with Environment-Driven Origin Allowlist, Credential Handling, and CSRF Protection  
**Standard:** W3C CORS Specification • OWASP Top 10 A01:2021-Broken Access Control • Cross-Site Request Forgery Defenses  

---

## 1. VULNERABILITY ANALYSIS & ROOT CAUSE

### 1.1 The Issue with Wildcard Access (`*`)
Prior to Phase 8, `admin-web/next.config.js` statically configured:
```javascript
{ key: 'Access-Control-Allow-Origin', value: '*' }
```

This presented two critical architectural and security flaws:
1. **Browser Credential Block:** According to the W3C CORS specification, web browsers strictly reject any cross-origin response when `credentials: 'include'` (such as authentication cookies or authorization headers) is used alongside a wildcard `Access-Control-Allow-Origin: *`.
2. **Over-Permissive Data Exposure:** Any arbitrary third-party web application running in a customer's browser could query the Glamora REST API without restriction.

---

## 2. PRODUCTION REMEDIATION ARCHITECTURE

The wildcard implementation has been completely eliminated and replaced with a dynamic, environment-governed middleware architecture.

```
Incoming Request
      │
      ▼
admin-web/src/middleware.ts
      │
      ├── Origin Header Present?
      │     ├── YES ──► Check admin-web/src/lib/cors.ts Allowlist
      │     │             ├── In Allowlist?
      │     │             │     ├── OPTIONS Preflight: Return 204 with exact Origin + Credentials + Max-Age
      │     │             │     └── GET/POST: Attach Access-Control-Allow-Origin: <origin> + Vary: Origin
      │     │             └── NOT in Allowlist?
      │     │                   ├── OPTIONS Preflight: Return 403 Forbidden
      │     │                   ├── State-Changing + Cookie: Return 403 Forbidden (CSRF Defense)
      │     │                   └── GET: Pass through with Vary: Origin (No Allow-Origin header)
      │     └── NO  ──► Native Mobile App / Server Request: Pass through cleanly (200 OK)
      ▼
Route Handler (/api/*)
```

### 2.1 Origin Allowlist Governance ([`admin-web/src/lib/cors.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/lib/cors.ts))
Origins are driven by the `ALLOWED_ORIGINS` environment variable, with strict default fallbacks:

```typescript
const DEFAULT_ALLOWED_ORIGINS = [
  // Local development environments
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:8081',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:8081',
  // Production Glamora domains
  'https://glamora.com',
  'https://www.glamora.com',
  'https://admin.glamora.com',
  'https://book.glamora.com',
  // Staging Glamora domains
  'https://staging.glamora.com',
  'https://staging-admin.glamora.com',
  'https://staging-book.glamora.com',
];
```

### 2.2 Next.js App Router Middleware ([`admin-web/src/middleware.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/middleware.ts))
1. **Preflight `OPTIONS` Handling:**
   - Authorized origins receive `HTTP 204 No Content`.
   - The exact caller origin is dynamically echoed (`Access-Control-Allow-Origin: <origin>`).
   - `Access-Control-Allow-Credentials: true` is strictly set.
   - `Access-Control-Max-Age: 86400` (24 hours) caches preflight decisions, reducing client round-trips.
   - Unauthorized origins attempting preflights are rejected immediately with `HTTP 403 Forbidden`.
2. **Cross-Site Request Forgery (CSRF) Protection:**
   - Any state-changing method (`POST`, `PUT`, `PATCH`, `DELETE`) carrying administrative session cookies (`glamora_admin_token`) originating from an untrusted origin is halted with `HTTP 403 Forbidden`.
3. **Cache Invalidation Safeguard:**
   - `Vary: Origin` is attached to all API responses, preventing edge CDN proxies from serving a cached response configured for one origin to a different origin.
4. **Clean Pass-Through for Native Apps:**
   - Mobile applications (React Native / Expo) communicating via `fetch` do not send browser `Origin` headers. These requests bypass CORS checks and authenticate cleanly via `Authorization: Bearer <token>`.

---

## 3. LIVE EMPIRICAL TEST EVIDENCE

The implementation was verified using the automated test suite [`admin-web/tests/phase8_cors_security.test.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/tests/phase8_cors_security.test.ts) executed against the live server:

```
================================================================
   GLAMORA PHASE 8: PRODUCTION CORS & CSRF SECURITY TEST SUITE
   Target Server: http://localhost:3001
================================================================

  [PASS]  1. Preflight OPTIONS for allowed origin returns HTTP 204 with exact origin
  [PASS]  2. Preflight OPTIONS for unapproved origin is rejected with HTTP 403
  [PASS]  3. GET request with allowed origin attaches Access-Control-Allow-Origin
  [PASS]  4. GET request with unapproved origin does NOT attach Access-Control-Allow-Origin
  [PASS]  5. State-changing POST with cookie credentials from unapproved origin blocked (HTTP 403 CSRF)
  [PASS]  6. Native mobile / server request without Origin header succeeds normally
  [PASS]  7. Health check endpoint /api/health returns healthy with DB status

----------------------------------------------------------------
  Phase 8 CORS & CSRF Security Results: 7/7 Passed (100%)
----------------------------------------------------------------
```

### 3.1 Raw CLI Test Verification

#### A. Allowed Origin Preflight (HTTP 204 with exact origin & credentials):
```http
OPTIONS /api/salons HTTP/1.1
Origin: http://localhost:3002
Access-Control-Request-Method: POST

HTTP/1.1 204 No Content
access-control-allow-credentials: true
access-control-allow-headers: Authorization, Content-Type, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, X-Api-Version
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
access-control-allow-origin: http://localhost:3002
access-control-max-age: 86400
vary: Origin
```

#### B. Unapproved Origin Preflight (HTTP 403 Forbidden):
```http
OPTIONS /api/salons HTTP/1.1
Origin: http://unauthorized-domain.com
Access-Control-Request-Method: POST

HTTP/1.1 403 Forbidden
content-type: application/json
Vary: Origin

{"error":"CORS Forbidden: Origin not allowed by Glamora security policy"}
```

#### C. Cross-Origin CSRF Attack Blocked (HTTP 403 Forbidden):
```http
POST /api/salons HTTP/1.1
Origin: http://untrusted-site.com
Cookie: glamora_admin_token=session_sample
Content-Type: application/json

HTTP/1.1 403 Forbidden
content-type: application/json
Vary: Origin

{"error":"Forbidden: Untrusted cross-origin request rejected (CSRF Protection)"}
```

---

## 4. CONCLUSION

Wildcard access has been completely eradicated. Glamora's REST API is now strictly protected by origin whitelisting, dynamic credential echoing, automated preflight caching, and server-side CSRF validation.

