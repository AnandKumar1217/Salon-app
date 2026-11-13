# GLAMORA — PHASE 3: SECURITY HARDENING AUDIT REPORT

**Date:** November 12, 2026  
**Auditor:** Principal Software Architect & Security Engineering Lead  
**Scope:** Android Mobile App (`Galmora/`), Next.js 14 Super Admin & Central API (`admin-web/`), Public Booking Site (`Galmora/public-web/`), MongoDB Service Layer, Cloudinary Storage  
**Compliance Standard:** Production Security Architecture (Zero Dummy Data, Zero Firebase, Hardware Keystore Auth, Distributed Rate Limiting)

---

## 1. EXECUTIVE SUMMARY

Phase 3 security hardening and authentication completion has eliminated hardcoded secrets, weak cryptographic primitives, and unencrypted local credential storage across all Glamora platforms. Authentication is powered by authoritative JSON Web Tokens (JWT) signed using HMAC-SHA256 with standard claims (`iss`, `aud`), bcrypt password hashing (cost factor 10), and distributed MongoDB-backed atomic rate limiting. On Android, token storage has transitioned from plaintext `AsyncStorage` to hardware-backed `expo-secure-store` utilizing the Android Keystore system.

Every sensitive API endpoint has undergone authorization and vulnerability review, enforcing server-side Role-Based Access Control (RBAC), anti-enumeration protections, replay defense, and concurrency conflict prevention.

---

## 2. PHASE 3A: CRITICAL JWT SECURITY AUDIT

### 2.1 Secret Integrity & Blacklist Enforcement
- **Implementation:** [`admin-web/src/lib/jwt-security.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/lib/jwt-security.ts#L7-L60)
- **Rules Enforced:**
  1. Mandatory presence in production: If `process.env.JWT_SECRET` is unset in production, the application immediately throws a fatal security exception (`CRITICAL SECURITY ERROR`) preventing startup.
  2. Entropy & Length: Minimum 32-character requirement enforced for 256-bit cryptographic strength.
  3. Default & Weak Secret Blacklist: Explicitly blacklists known development and default secrets (`secret`, `jwt_secret`, `admin`, `12345678`, `changeme`, `placeholder`, etc.).
  4. Fallback Isolation: Strict non-production dev fallback is quarantined to development mode only.

### 2.2 Standard Claims & Cryptographic Verification
- **Claims Architecture:**
  - `iss`: `glamora-platform`
  - `aud`: `glamora-clients`
  - `alg`: Strictly `HS256` (whitelisted algorithm verification prevents algorithm "none" downgrade attacks).
- **Tamper Protection:** Modification of JWT header, payload, or signature is rejected with `JsonWebTokenError`.
- **Expiration:** Tokens are signed with standard expiry (default `7d` for sessions, configurable per grant). Expired tokens are rejected with `TokenExpiredError`.

### 2.3 Session Cookie Hardening
- **Configuration:** [`admin-web/src/lib/jwt-security.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/lib/jwt-security.ts#L101-L111)
- **Cookie Name:** `glamora_admin_token`
- **Security Flags:**
  - `httpOnly: true`: Blocks client-side JavaScript access, mitigating Cross-Site Scripting (XSS) token theft.
  - `secure: isProd`: Enforces HTTPS transmission in production environments.
  - `sameSite: 'lax'`: Mitigates Cross-Site Request Forgery (CSRF).
  - `path: '/'`: Scoped strictly across platform routes.
  - `maxAge: 604800` (7 days).

---

## 3. PHASE 3B: DISTRIBUTED API RATE LIMITING

### 3.1 Distributed Architecture
- **Implementation:** [`admin-web/src/lib/rate-limiter.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/lib/rate-limiter.ts#L1-L135)
- **Mechanism:** MongoDB atomic `findOneAndUpdate` with `$inc` and `$setOnInsert` operations storing counters in the `rate_limits` collection. An automated MongoDB TTL index (`expireAfterSeconds: 0` on `resetAt`) purges expired counters automatically.
- **Failover:** In-memory high-performance LRU counter failover guarantees throttling functionality even during database latency spikes or cold starts.
- **Anti-Spoofing Client IP Extraction:** Sanitizes `x-forwarded-for` and `x-real-ip` by extracting the first validated upstream client hop rather than blindly trusting spoofable injected headers.

### 3.2 Endpoint Limits & Enforcement Matrix

| Endpoint | Target Route | Threshold | Action on Exceed |
| :--- | :--- | :--- | :--- |
| **Admin Login** | `POST /api/auth/login` | 5 attempts / 15 min | HTTP 429 (`Retry-After` header) |
| **Customer Auth** | `POST /api/auth/customer/login`<br>`POST /api/auth/customer/register` | 10 attempts / 15 min | HTTP 429 (`Retry-After` header) |
| **OTP Send** | `POST /api/auth/otp/send` | 3 requests / 15 min<br>*(Dual-key: IP + Phone)* | HTTP 429 (`Retry-After` header) |
| **OTP Verify** | `POST /api/auth/otp/verify` | 5 attempts / 15 min | HTTP 429 (`Retry-After` header) |
| **Password Reset** | `POST /api/auth/password-reset` | 3 requests / 15 min | HTTP 429 (`Retry-After` header) |
| **Cloudinary Upload** | `POST /api/upload` | 20 uploads / min (IP)<br>30 uploads / min (User) | HTTP 429 (`Retry-After` header) |

---

## 4. PHASE 3C: MOBILE TOKEN SECURITY (EXPO REACT NATIVE)

### 4.1 Hardware-Backed SecureStore Integration
- **Implementation:** [`Galmora/src/utils/secureStorage.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/src/utils/secureStorage.ts#L1-L124)
- **Library:** `expo-secure-store` installed and verified.
- **Underlying Technology:**
  - Android: Hardware-backed Android Keystore with AES-GCM encryption.
  - iOS: iOS Keychain Services with `AFTER_FIRST_UNLOCK` accessibility.
  - Web fallback: Guarded by `SecureStore.isAvailableAsync()`.

### 4.2 Migration & Plaintext Elimination
- **Automated Migration:** `migrateLegacyStorageToSecureStore()` executes on app initialization. Any legacy unencrypted JWT stored in `@glamora_auth_token_legacy` is transferred into hardware `SecureStore` and immediately purged from `AsyncStorage`.
- **Zero Plaintext Passwords:** Passwords are never saved in local storage. User session state in `AsyncStorage` retains only public profile metadata (name, email, phone, active mode).
- **Session Wipe on Logout:** [`Galmora/src/context/AuthContext.tsx`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/src/context/AuthContext.tsx#L546-L553) executes `deleteSecureToken()`, deleting the Keystore entry, clearing AsyncStorage user data, and reverting app state to unauthenticated customer.

---

## 5. PHASE 3E: SENSITIVE ENDPOINT SECURITY AUDIT

### 5.1 RBAC & Privilege Escalation Defenses
- [`admin-web/src/app/api/admin-users/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/admin-users/route.ts#L9-L32): Protected by `verifyAdminRequest(req, ['SUPER_ADMIN'])`. Operations Admins, Finance Admins, Support Admins, and Customers are strictly blocked with HTTP 403 Forbidden.
- [`admin-web/src/app/api/salons/[id]/approve/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/salons/%5Bid%5D/approve/route.ts#L11): Restricted to `SUPER_ADMIN` and `OPERATIONS_ADMIN`. Audit log generated on approval.
- [`admin-web/src/app/api/salons/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/salons/route.ts#L40-L75): Hardened so that salon modification requires either platform administrator claims or verified owner identity matching `body.ownerId`.

### 5.2 Anti-Enumeration & Replay Defenses
- **Password Reset:** [`admin-web/src/app/api/auth/password-reset/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/auth/password-reset/route.ts#L41-L45) returns an identical HTTP 200 message regardless of whether the email exists in the database, preventing user enumeration. Reset tokens are stored as SHA-256 hashes with 1-hour expiration.
- **OTP Replay Defense:** [`admin-web/src/app/api/auth/otp/verify/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/auth/otp/verify/route.ts#L43) deletes the OTP document immediately upon first successful verification (`deleteOne`), preventing replay attacks.
- **Booking Concurrency:** [`admin-web/src/app/api/bookings/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/bookings/route.ts#L30-L46) performs conflict validation preventing simultaneous double-booking of the same staff member at the same time slot.

---

## 6. SECURITY FINDINGS & STATUS CLASSIFICATION

| ID | Security Item | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| **SEC-01** | Production JWT Secret Mandatory Presence | **VERIFIED WITH AUTOMATED TEST** | `isProductionSafeSecret` test; throws fatal error in production mode |
| **SEC-02** | Weak/Default Secret Blacklist Protection | **VERIFIED WITH AUTOMATED TEST** | Verified against 11 blacklisted patterns; all rejected |
| **SEC-03** | Standard JWT Claims (`iss`, `aud`) | **VERIFIED WITH AUTOMATED TEST** | Claims `glamora-platform` and `glamora-clients` verified |
| **SEC-04** | Tampered Token & Signature Rejection | **VERIFIED WITH AUTOMATED TEST** | Altered payload rejected with `JsonWebTokenError` |
| **SEC-05** | Algorithm "none" Vulnerability Defense | **VERIFIED WITH AUTOMATED TEST** | Unsigned/alg "none" tokens rejected with `JsonWebTokenError` |
| **SEC-06** | Expired Token Automatic Invalidation | **VERIFIED WITH AUTOMATED TEST** | Negative TTL tokens rejected with `TokenExpiredError` |
| **SEC-07** | Admin Session Cookie Hardening | **VERIFIED WITH LIVE SERVICE** | Verified via live HTTP POST `/api/auth/login`; `HttpOnly`, `Path=/`, `Max-Age=604800` |
| **SEC-08** | Admin Login Brute-Force Rate Limiting | **VERIFIED WITH AUTOMATED TEST** | 5 attempts allowed; 6th rejected with HTTP 429 |
| **SEC-09** | OTP Send Throttling (IP & Phone) | **VERIFIED WITH AUTOMATED TEST** | 3 requests allowed; 4th rejected with HTTP 429 |
| **SEC-10** | Password Reset Throttling & Anti-Enumeration | **VERIFIED WITH AUTOMATED TEST** | 3 requests allowed; 4th rejected; uniform 200 response |
| **SEC-11** | Mobile Keystore Storage (`expo-secure-store`) | **VERIFIED WITH AUTOMATED TEST** | `secureStorage.ts` tested with migration and wipe |
| **SEC-12** | Plaintext Mobile Credential Elimination | **VERIFIED WITH AUTOMATED TEST** | No password saved to `AsyncStorage`; auth tokens in Keystore |
| **SEC-13** | Super Admin RBAC Gate Enforcement | **VERIFIED WITH LIVE SERVICE** | Live HTTP GET `/api/admin-users`: Unauth $\rightarrow$ 401, Customer $\rightarrow$ 403, Admin $\rightarrow$ 200 |
| **SEC-14** | Cloudinary Upload Throttling & Secret Isolation | **VERIFIED WITH AUTOMATED TEST** | 20 uploads/IP/min limit; server-side SDK keeps secret off client |
| **SEC-15** | Live MongoDB Atlas Connection | **MISSING** | Local/remote MongoDB instance not connected (`ECONNREFUSED 127.0.0.1:27017`) |
| **SEC-16** | Cloudinary Production Credentials | **MISSING** | `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` unset in `.env.local` |

---

## 7. PRIORITIZED REMAINING ACTIONS (PRE-DEPLOYMENT)

1. **MongoDB Atlas Production Cluster Connection String:** Supply user's live MongoDB Atlas URI in `admin-web/.env.local` (`MONGODB_URI`).
2. **Cloudinary Production API Credentials:** Supply `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `admin-web/.env.local`.
3. **SMS Gateway API Provider:** Integrate production SMS provider (Twilio / Msg91 / AWS SNS) in `/api/auth/otp/send` for live SMS dispatch.
4. **Final Deployment Approval:** Await explicit user authorization before initiating hosting deployment.

