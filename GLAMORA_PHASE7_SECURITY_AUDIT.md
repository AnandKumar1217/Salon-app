# GLAMORA — PHASE 7: COMPREHENSIVE PRODUCTION SECURITY AUDIT

**Date:** November 13, 2026  
**Auditor:** Principal Security Engineer & Cryptographic Systems Architect  
**Scope:** Full-Stack Security Audit covering Mobile Client, Central API, Super Admin, MongoDB Atlas, and Media CDN  
**Standard:** OWASP Top 10 • NIST Special Publication 800-63B • ISO/IEC 27001 Controls  

---

## 1. CRYPTOGRAPHIC & TOKEN INTEGRITY (JWT)

### 1.1 Secret Key Hardening
- **Implementation:** [`admin-web/src/lib/jwt-security.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/lib/jwt-security.ts)
- **Entropy & Length:** Rejects any key with fewer than 32 characters or entropy below industry standards.
- **Blacklist Enforcement:** Explicitly rejects known default or weak keys (e.g. `secret`, `changeme`, `admin`, `default_jwt_secret`).
- **Production Guard:** Throws a fatal initialization exception if `JWT_SECRET` is unset or invalid in `NODE_ENV=production`.

### 1.2 Claims & Signature Verification
- **Signature Algorithm:** Strictly enforced as `HS256` (HMAC with SHA-256). Any token presenting `alg: "none"` or asymmetric confusion is rejected immediately.
- **Standard Claims:**
  - `iss` (Issuer): Strictly validated as `glamora-platform`.
  - `aud` (Audience): Strictly validated as `glamora-clients`.
  - `exp` (Expiration): Enforced at 7 days (`7d`) with automatic rejection of expired timestamps.
  - `sub` / `uid`: Contains the unique MongoDB user identifier.
  - `role`: Contains either `CUSTOMER`, `OWNER`, or administrative role (`SUPER_ADMIN`, `OPERATIONS_ADMIN`).

---

## 2. AUTHENTICATION & CREDENTIAL STORAGE

### 2.1 Password Hashing & Salt Rounds
- **Library:** `bcryptjs`
- **Cost Factor:** Work factor **10** (1,024 rounds), providing a robust balance between defense against offline dictionary/GPU rainbow attacks and sub-second server response times.
- **Storage:** Only the resulting 60-character bcrypt hash (`$2a$10$...`) is stored in the MongoDB `users` collection. Plaintext passwords are never logged, stored, or returned in API responses.
- **Missing Hash Vulnerability Defense:** Verified in [`admin-web/src/app/api/auth/customer/login/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/auth/customer/login/route.ts#L25): If a user record lacks `passwordHash`, the system immediately aborts with HTTP 401, preventing undefined comparisons.

### 2.2 Mobile Token Storage (Hardware Keystore & Keychain)
- **Library:** `expo-secure-store`
- **Android:** Encrypted via the **Android Keystore Provider** using hardware-backed AES-GCM 256-bit encryption.
- **iOS:** Encrypted via the **iOS Keychain Services** framework using `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`.
- **AsyncStorage Migration:** Safe migration routine automatically reads legacy tokens, writes them to `SecureStore`, and permanently purges them from unencrypted `AsyncStorage`.
- **Zero Plaintext Credentials:** Passwords and OTP codes are never written to disk or device memory.

---

## 3. SESSION REVOCATION & LOGOUT

- **Endpoint:** `POST /api/auth/logout` ([`admin-web/src/app/api/auth/logout/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/auth/logout/route.ts))
- **Cookie Clearing:** Sets the `glamora_admin_token` cookie with:
  - `Max-Age: 0`
  - `Expires: Thu, 01 Jan 1970 00:00:00 GMT`
  - `HttpOnly: true`
  - `SameSite: Lax`
  - `Path: /`
- **Mobile Client Action:** Mobile `logout()` cleanly executes `SecureStore.deleteItemAsync('auth_token')` and resets the in-memory React user state to `null`.

---

## 4. PHONE & EMAIL VERIFICATION / OTP REPLAY DEFENSE

- **Generation:** Cryptographically secure 6-digit pseudorandom number (`crypto.randomInt(100000, 999999)`).
- **One-Way Hashing in Database:** The raw OTP is **never stored in plaintext**. Only its SHA-256 digest (`crypto.createHash('sha256').update(rawOtp).digest('hex')`) is saved in MongoDB collection `otps`.
- **Time-to-Live (TTL):** Hardcoded expiration at **10 minutes**. MongoDB automated TTL index drops expired records automatically.
- **Immediate Token Burn (Replay Defense):** Upon a single successful verification match, the OTP record is deleted atomically (`collection.deleteOne({ _id: record._id })`), rendering any replay attempt invalid.
- **Anti-Enumeration:** Password reset and OTP endpoints return identical HTTP 200 generic responses (`"If the account exists, instructions have been sent"`), preventing user account enumeration.

---

## 5. DISTRIBUTED RATE LIMITING

Rate limiting is implemented using atomic MongoDB upsert operations (`$inc: { count: 1 }`), ensuring protection works across multi-instance serverless deployments and Docker containers without reliance on single-process in-memory state.

| Route / Capability | Threshold Limit | Window | Action upon Breach |
| :--- | :--- | :--- | :--- |
| **Admin Login** (`/api/auth/login`) | Max 5 attempts | 15 minutes | HTTP 429 Too Many Requests with `Retry-After` header |
| **Customer Login / Register** | Max 10 attempts | 15 minutes | HTTP 429 Too Many Requests |
| **OTP Send** (`/api/auth/otp/send`) | Max 3 attempts | 15 minutes per phone | HTTP 429 (Blocks SMS spam & cost attacks) |
| **Password Reset** | Max 3 attempts | 15 minutes per IP | HTTP 429 |
| **Cloudinary Media Upload** | Max 20 uploads | 1 minute per IP | HTTP 429 |

---

## 6. SERVER-SIDE ROLE-BASED ACCESS CONTROL (RBAC)

RBAC is strictly enforced on the server within Next.js API route handlers. Client-side navigation guards are treated purely as UI conveniences.

- **Super Admin Exclusive Routes:**
  - `GET /api/admin-users`
  - `POST /api/salons/[id]/suspend`
  - `POST /api/salons/[id]/reactivate`
  - `GET /api/audit-logs`
  - **Rejection Behavior:** Returns `HTTP 401 Unauthorized` for missing/invalid tokens; returns `HTTP 403 Forbidden` if caller role is `CUSTOMER`, `OWNER`, or unauthorized.
- **Salon Owner Modification Route (`POST /api/salons`):**
  - Admins can modify any salon.
  - Salon owners are strictly constrained by the rule: `caller.uid === body.ownerId`. Attempting to modify another merchant's salon ID returns `HTTP 403 Forbidden`.
- **Booking Modification Route (`PATCH /api/bookings/[id]`):**
  - Requires valid JWT.
  - Whitelists status transitions (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `DELAYED`, `NO_SHOW`). Unknown status strings return `HTTP 400 Bad Request`.

---

## 7. INPUT SANITIZATION & INJECTION DEFENSE

- **NoSQL Injection Defense:** All MongoDB queries use strictly typed parameter matching (e.g. `{ id: String(id) }`) or explicit sanitization. Object parameter injection (such as `{ username: { $ne: null } }`) is blocked by type-checking incoming JSON inputs prior to database queries.
- **Cross-Site Scripting (XSS) Defense:**
  - React and Next.js automatically escape rendered string content in the DOM.
  - Cookies storing authentication tokens use the `HttpOnly` flag, preventing access from browser JavaScript or malicious injected scripts.
  - `public-web/index.html` uses safe text interpolation and DOM properties (`textContent`).

---

## 8. CLOUDINARY SECRET ISOLATION

- **Server-Side Exclusivity:** `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are declared strictly in `admin-web/.env.local`.
- **Zero Frontend Exposure:**
  - Neither `Galmora/app.json`, `Galmora/.env`, nor `Galmora/public-web/index.html` contains the API Secret.
  - Only `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` (`etq3layz`) is exposed to the mobile app for dynamic image URL rendering (`https://res.cloudinary.com/etq3layz/...`).
  - Media uploads pass through the authenticated server endpoint `POST /api/upload`, which inspects file sizes (max 5MB), validates MIME types, applies rate limits, and performs server-side signed uploads.

---

## 9. GIT REPOSITORY SECRETS AUDIT

- **Audited `.gitignore` Files:**
  - Root: [`c:/Users/tammi/Downloads/Projects/Galmora App/.gitignore`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/.gitignore)
  - Backend: [`admin-web/.gitignore`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/.gitignore)
  - Mobile: [`Galmora/.gitignore`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/.gitignore)
- **Defect Discovered & Fixed in Phase 7:** `Galmora/.gitignore` originally lacked an explicit `.env` exclusion (only listed `.env*.local`). This was remediated in Phase 7 by adding `.env` and `.env.local` to `Galmora/.gitignore`.
- **Git History Scan:** Executed `git log --all --full-history -- "**/.*env*"` inside `Galmora/`. **Result: Zero `.env` files or secrets have ever been committed into the git commit tree.**

