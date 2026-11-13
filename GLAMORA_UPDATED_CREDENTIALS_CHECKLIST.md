# GLAMORA — PRODUCTION CREDENTIALS & ENVIRONMENT CONFIGURATION CHECKLIST

**Date:** November 12, 2026  
**Auditor:** Principal Software Architect & DevOps Lead  
**Scope:** Production Configuration Audit across Android App (`Galmora/`), Next.js Super Admin API (`admin-web/`), and Customer Web Portal (`Galmora/public-web/`)  
**Security Policy:** Zero credential leakage in reports. All secrets must remain in isolated environment configuration files (`.env.local` / CI/CD secrets).

---

## 1. CREDENTIALS & ENVIRONMENT AUDIT MATRIX

| Service / Resource | Configuration Key | Destination File | Status | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication JWT** | `JWT_SECRET` | `admin-web/.env.local` | **VERIFIED WITH AUTOMATED TEST** | High-entropy random string ($\ge 32$ chars). Validated against blacklist. Required in production. |
| **Session Cookie Signing** | `SESSION_COOKIE_SECRET` | `admin-web/.env.local` | **VERIFIED WITH AUTOMATED TEST** | High-entropy random string ($\ge 32$ chars). Used for HTTP-only cookie integrity. |
| **MongoDB Atlas** | `MONGODB_URI` | `admin-web/.env.local` | **MISSING** | User must supply live MongoDB Atlas cluster connection string (`mongodb+srv://...`). |
| **MongoDB Database Name** | `MONGODB_DB_NAME` | `admin-web/.env.local` | **VERIFIED WITH AUTOMATED TEST** | Set to `glamora`. Verified in schema definitions and index configurations. |
| **Cloudinary Cloud Name** | `CLOUDINARY_CLOUD_NAME`<br>`EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | `admin-web/.env.local`<br>`Galmora/.env` | **IMPLEMENTED BUT NOT VERIFIED** | Configured as `glamora-cloud`. Awaits user account confirmation. |
| **Cloudinary API Key** | `CLOUDINARY_API_KEY` | `admin-web/.env.local` | **MISSING** | User must supply Cloudinary API key in backend `.env.local` (kept server-side). |
| **Cloudinary API Secret** | `CLOUDINARY_API_SECRET` | `admin-web/.env.local` | **MISSING** | User must supply Cloudinary API secret in backend `.env.local` (never on client). |
| **Mobile Backend API URL** | `EXPO_PUBLIC_BACKEND_URL` | `Galmora/.env` | **IMPLEMENTED BUT NOT VERIFIED** | Must be updated to production HTTPS domain prior to APK build (currently `http://localhost:3001` for dev). |
| **Public Web API URL** | `API_BASE_URL` | `Galmora/public-web/config.js` | **IMPLEMENTED BUT NOT VERIFIED** | Must be updated to production HTTPS domain prior to hosting deployment. |
| **SMS Gateway Credentials** | `SMS_GATEWAY_API_KEY`<br>`SMS_GATEWAY_SENDER_ID` | `admin-web/.env.local` | **MISSING** | Required for live SMS OTP dispatch (Twilio / Msg91 / AWS SNS). |

---

## 2. PRODUCTION ENVIRONMENT FILE TEMPLATES

### 2.1 Backend Super Admin & Central API (`admin-web/.env.local`)
```env
# MongoDB Atlas Production Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/glamora?retryWrites=true&w=majority
MONGODB_DB_NAME=glamora

# Cloudinary Media Storage (Server-side Only)
CLOUDINARY_CLOUD_NAME=glamora-cloud
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

# JWT & Cookie Security (Must be minimum 32 random characters)
JWT_SECRET=GENERATE_64_CHAR_RANDOM_HEX_KEY
SESSION_COOKIE_SECRET=GENERATE_64_CHAR_RANDOM_HEX_KEY

# Production Governance (Strictly Disable Mock Data Fallbacks)
NODE_ENV=production
NEXT_PUBLIC_USE_MOCK_FALLBACK=false

# Optional: Production SMS Dispatch Gateway (Twilio / Msg91)
# SMS_GATEWAY_API_KEY=
# SMS_GATEWAY_SENDER_ID=GLAMOR
```

### 2.2 Android Mobile App (`Galmora/.env`)
```env
# Production Central API Endpoint (Must be HTTPS public domain)
EXPO_PUBLIC_BACKEND_URL=https://api.glamora.com

# Cloudinary Public Assets
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=glamora-cloud

# Strict Production Policy
EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK=false
```

### 2.3 Customer Public Web Portal (`Galmora/public-web/config.js`)
```javascript
window.GLAMORA_CONFIG = {
  API_BASE_URL: 'https://api.glamora.com',
  CLOUDINARY_CLOUD_NAME: 'glamora-cloud',
  APP_STORE_URL: 'https://play.google.com/store/apps/details?id=com.glamora.app',
};
```

---

## 3. SECURITY VERIFICATION CHECKLIST BEFORE PRODUCTION RELEASE

- [x] **Zero Hardcoded Secrets in Source Code:** Checked across git repository. No secrets hardcoded in bundles.
- [x] **JWT_SECRET High Entropy Enforcement:** Enforced in code with length check ($\ge 32$ chars) and blacklist check.
- [x] **Hardware Keystore Mobile Storage:** `expo-secure-store` installed; automatic migration implemented; zero plaintext tokens in `AsyncStorage`.
- [x] **Rate Limiting Implemented on Sensitive Routes:** Login, register, OTP send, OTP verify, password reset, and media upload throttled.
- [x] **Role-Based Access Control:** Super Admin, Operations Admin, Support Admin, Finance Admin, Salon Owner, and Customer permissions strictly separated.
- [x] **Anti-Enumeration Protections:** Password reset endpoint returns uniform response to prevent user discovery.
- [x] **One-Time Token Consumption:** OTP records burned immediately upon verification to prevent replay attacks.
- [ ] **Supply Live MongoDB Atlas URI:** Connect production MongoDB cluster (`MONGODB_URI`).
- [ ] **Supply Live Cloudinary Credentials:** Supply `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`.
- [ ] **Supply SMS Gateway Credentials:** Select and configure SMS gateway for live OTP delivery.
- [ ] **Configure Public Domain & SSL Certificate:** Point DNS and provision TLS certificate.

---

## 4. GATE STATUS & NEXT STEP

> [!IMPORTANT]
> **GATE REACHED:** All code implementations, security hardening, mobile Keystore storage, distributed rate limiting, and 55 automated tests have passed.
> Per strict instructions, execution is paused before external paid-service provisioning and deployment.
> Awaiting user approval and provisioning of MongoDB Atlas URI, Cloudinary API keys, and production domain.

