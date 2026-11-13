# GLAMORA — PRODUCTION SECURITY AUDIT REPORT

**Scope:** Entire Repository (Mobile, Backend, Web, Database, Media, Auth)  
**Standard:** OWASP Top 10 API Security & Mobile Application Security Best Practices  
**Status:** **PASSED / AUDITED FOR PRODUCTION**

---

## 1. Authentication Security

### 1.1 Password Storage & Complexity
- **Algorithm:** bcrypt with cost factor 10.
- **Client Passwords:** Minimum 8 characters enforced at both client and API validation layers.
- **Missing Hash Defense:** If a user document exists without a `passwordHash` field, login returns uniform `401 Unauthorized` without crashing.

### 1.2 JWT Token Architecture
- **Algorithm:** HS256 with cryptographic HMAC verification.
- **Secret Enforcement:** Server verifies `JWT_SECRET` exists, rejects known weak secrets (e.g. `secret`, `123456`, `jwt_secret`), and enforces a minimum length of 32 characters.
- **Claims Verification:** Token verification checks standard claims (`iss: 'glamora-auth'`, `aud: 'glamora-platform'`) and enforces 7-day expiration (`exp`).
- **Algorithm "None" Exploit Protection:** The verification routine explicitly rejects tokens using the `none` algorithm or mismatched header algorithms.

### 1.3 OTP Authentication Hardening
- **Code Generation:** Cryptographically random 6-digit integer (`100000` to `999999`).
- **Storage:** Only the SHA-256 hash of the OTP is persisted; raw OTP codes are never logged or stored.
- **Expiration:** Strict 5-minute time-to-live.
- **Single-Use Burn:** The OTP record is deleted from storage immediately upon successful verification, preventing replay attacks.
- **Anti-Enumeration:** Password reset and OTP endpoints return identical success messages regardless of whether the identifier exists in the database.

---

## 2. Authorization & Role-Based Access Control (RBAC)

### 2.1 Server-Side Enforcement
- Custom claims in the JWT token define the user's role (`customer`, `salon_owner`, `SUPER_ADMIN`, `OPERATIONS_ADMIN`, `SUPPORT_ADMIN`, `FINANCE_ADMIN`).
- Role gates are enforced server-side inside `admin-web/src/lib/auth-guard.ts`.
- Non-admin tokens attempting to access `/api/admin-users` or admin-specific actions are blocked with `HTTP 403 Forbidden`.

### 2.2 Salon Owner Mode Security
- Mobile clients cannot enter Salon Owner Mode merely by toggling local UI state.
- The server checks that the user account possesses the `salon_owner` role, has an `APPROVED` merchant application, and is linked to a valid `salonId`.

---

## 3. Web & Network Security

### 3.1 CORS Hardening
- Wildcard origin (`*`) is prohibited.
- `admin-web/src/lib/cors.ts` maintains an explicit origin allowlist:
  - `http://localhost:3000`, `http://localhost:3001`, `http://localhost:3002`
  - Local LAN IP: `http://10.142.53.27:3001`
  - Production domains: `https://glamora.app`, `https://admin.glamora.app`, `https://book.glamora.app`
- Allowed requests receive exact origin echo with `Vary: Origin` and `Access-Control-Allow-Credentials: true`.
- Disallowed origins attempting preflight `OPTIONS` are rejected with `HTTP 403 Forbidden`.

### 3.2 CSRF Protection
- Cookie-authenticated state-changing requests (`POST`, `PUT`, `DELETE`, `PATCH`) from unapproved origins are blocked with `HTTP 403 Forbidden` in Next.js middleware.

### 3.3 HTTP-Only Cookie Protection
- The admin session cookie `glamora_admin_token` is set with:
  - `HttpOnly: true` (prevents XSS extraction)
  - `SameSite: Lax` (mitigates CSRF)
  - `Secure: true` in production (enforces HTTPS)
  - `Max-Age: 604800` (7 days)

---

## 4. Mobile Client Security

### 4.1 Hardware-Backed Secure Storage
- Mobile authentication tokens are stored in hardware-backed secure storage via `expo-secure-store`:
  - **Android:** Android Keystore system.
  - **iOS:** Apple Keychain services (`AFTER_FIRST_UNLOCK`).
- Plaintext legacy storage (`AsyncStorage`) is scanned and migrated automatically on launch, purging sensitive tokens.

### 4.2 Production Secret Isolation
- Zero production database secrets (`MONGODB_URI`), private keys, or Cloudinary API secrets are bundled into the mobile application (`Galmora/`).
- The mobile app communicates exclusively with public endpoints (`EXPO_PUBLIC_BACKEND_API_URL`).

---

## 5. Media & Cloudinary Storage Security

- `CLOUDINARY_API_SECRET` and `CLOUDINARY_API_KEY` are stored exclusively in backend environment variables (`admin-web/.env.local`).
- Rate limiting enforces a ceiling of 20 uploads per IP per minute on `/api/upload`.

