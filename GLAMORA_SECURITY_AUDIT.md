# GLAMORA PLATFORM — COMPREHENSIVE SECURITY AUDIT
**Audit Date:** November 12, 2026  
**Audited Target:** Glamora Production Architecture (Next.js 14 API + MongoDB + Cloudinary + Expo React Native)  
**Security Classification:** AUTHORITATIVE AUDIT  

---

## 1. Executive Summary

This security audit inspects authentication mechanisms, session management, authorization gates, credential storage, upload security, and multi-tenant isolation across all Glamora components following the complete removal of Firebase.

---

## 2. Security Assessment Matrix

| Security Domain | Requirement / Control | Implementation Details | Status |
| :--- | :--- | :--- | :---: |
| **Authentication** | Password Storage & Hashing | Passwords hashed using `bcryptjs` with salt factor 10; never stored in plaintext. | **VERIFIED WITH AUTOMATED TEST** |
| **Authentication** | JWT Token Signing | Signed using HMAC-SHA256 with `JWT_SECRET`; verified in `auth-guard.ts`. | **VERIFIED WITH LIVE SERVICE** |
| **Authentication** | Token Expiration | Tokens configured with 7-day expiration (`expiresIn: '7d'`). | **VERIFIED WITH LIVE SERVICE** |
| **Session Security** | HTTP-Only Cookies | Session cookie `glamora_admin_token` configured with `httpOnly: true`, `sameSite: 'lax'`, `secure: production`. | **VERIFIED WITH LIVE SERVICE** |
| **Session Security** | Cookie Session Revocation | Calling `POST /api/auth/logout` deletes `glamora_admin_token` cookie immediately. | **VERIFIED WITH LIVE SERVICE** |
| **Authorization** | Server-Side RBAC Enforcement | `verifyAdminRequest(req, allowedRoles)` enforces authoritative claims on every privileged endpoint. | **VERIFIED WITH AUTOMATED TEST** |
| **Authorization** | Tamper-Proof Claims | Admin roles read from cryptographically signed JWT; frontend state modifications cannot grant admin rights. | **VERIFIED WITH AUTOMATED TEST** |
| **Media Security** | Server-Side Cloudinary Secret | `CLOUDINARY_API_SECRET` kept strictly server-side in `admin-web/.env.local`; omitted from client bundles. | **VERIFIED WITH LIVE SERVICE** |
| **Media Security** | Upload MIME & Size Gate | `POST /api/upload` enforces strict 5MB limit and whitelists `image/jpeg`, `image/png`, `image/webp`. | **VERIFIED WITH AUTOMATED TEST** |
| **Data Integrity** | Immutable Audit Trail | `admin_audit_logs` records admin ID, timestamp, target entity, previous/new values, and action reason. | **VERIFIED WITH LIVE SERVICE** |
| **Tenant Isolation** | Salon Operational Scoping | Bookings and staff shifts queried by `salonId`; multi-tenant segregation verified. | **VERIFIED WITH AUTOMATED TEST** |
| **Secret Management** | Default JWT Secret Fallback | Fallback secret exists in code if `JWT_SECRET` environment variable is omitted. | **SECURITY ISSUE** |
| **API Protection** | Rate Limiting on Auth Routes | No rate limiting currently active on `/api/auth/login` (brute-force exposure). | **SECURITY ISSUE** |
| **Mobile Storage** | Token Storage on Android | Auth state persisted in unencrypted `AsyncStorage` instead of `expo-secure-store`. | **SECURITY ISSUE** |

---

## 3. Vulnerability Findings & Detailed Remediation

### Finding SEC-01: Default Hardcoded JWT Secret Fallback
- **Severity:** HIGH
- **Location:** `admin-web/src/app/api/auth/login/route.ts` & `admin-web/src/lib/auth-guard.ts`
- **Description:** 
  The codebase uses a fallback key:
  ```ts
  const JWT_SECRET = process.env.JWT_SECRET || 'glamora_jwt_secret_production_key_2026_xyz';
  ```
  If the `JWT_SECRET` environment variable is unset in production, tokens are signed using the known fallback key, enabling attackers to forge valid `SUPER_ADMIN` tokens.
- **Remediation:**
  Enforce a startup assertion in production:
  ```ts
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required in production.');
  }
  ```
- **Status:** **SECURITY ISSUE** (Remediation specified)

---

### Finding SEC-02: Lack of Rate Limiting on Authentication & Upload Endpoints
- **Severity:** MEDIUM
- **Location:** `admin-web/src/app/api/auth/login/route.ts` and `admin-web/src/app/api/upload/route.ts`
- **Description:** 
  `/api/auth/login` does not restrict rapid successive POST attempts. A malicious actor could execute password guessing or credential stuffing attacks against administrator accounts. Similarly, `/api/upload` lacks IP-based rate limiting, which could lead to Cloudinary storage bandwidth exhaustion.
- **Remediation:**
  Deploy an in-memory or Redis-backed rate limiter (e.g. `@upstash/ratelimit` or Next.js middleware token bucket) restricting `/api/auth/login` to 5 attempts per 15 minutes per IP.
- **Status:** **SECURITY ISSUE** (Remediation specified)

---

### Finding SEC-03: Mobile Auth State in Unencrypted AsyncStorage
- **Severity:** LOW
- **Location:** `Galmora/src/context/AuthContext.tsx`
- **Description:** 
  User profile and credentials on the Android client are saved using `@react-native-async-storage/async-storage`, which stores values in plaintext SQLite/XML on the device filesystem. Rooted Android devices or backup extraction could expose user metadata.
- **Remediation:**
  Migrate sensitive authentication tokens to `expo-secure-store`, which utilizes Android Keystore hardware-backed encryption.
- **Status:** **SECURITY ISSUE** (Remediation specified)

---

## 4. Authorization & RBAC Verification Evidence

Automated tests verified the authoritative enforcement of roles:
1. `SUPER_ADMIN`: Can manage administrators (`/api/admin-users`), view financial ledgers, and manage salons.
2. `OPERATIONS_ADMIN`: Can inspect and approve/reject/suspend salons (`/api/salons/[id]/approve`), but is blocked with **403 Forbidden** when attempting to modify admin accounts.
3. `SUPPORT_ADMIN`: Can inspect customer and salon tickets, but blocked from modifying salon approval states.
4. `FINANCE_ADMIN`: Can view and reconcile subscription and transaction logs, but blocked from salon onboarding operations.
5. `CUSTOMER` / Anonymous: All write operations and administrative read routes reject with **401 Unauthorized** or **403 Forbidden**.

