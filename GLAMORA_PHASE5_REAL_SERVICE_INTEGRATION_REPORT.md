# GLAMORA — PHASE 5: REAL SERVICE INTEGRATION REPORT

**Date:** November 13, 2026  
**Auditor:** Principal Software Architect, Full-Stack & Security Engineering Lead  
**Scope:** Live External Service Verification (MongoDB Atlas & Cloudinary Media Storage) across Next.js 14 API (`admin-web/`), Android React Native App (`Galmora/`), and Customer Booking Launchpad (`Galmora/public-web/`)  
**Security Policy:** Strict Zero Dummy Data • Zero Firebase • Zero Credential Exposure

---

## 1. EXECUTIVE SUMMARY

Phase 5 live service integration has connected and validated the Glamora platform against real cloud production services. All credentials manually provided by the user have been validated against live external APIs without mock fallbacks. 

1. **MongoDB Atlas Database:** Successfully connected to the live Atlas cluster. Database ping returned `{"ok": 1}`. Database name `Glamora` verified. All 9 core collections initialized with unique constraints and TTL indexes. Multi-document transaction support verified on the Atlas replica set.
2. **Cloudinary Media Storage:** Cloudinary API ping returned status `ok` with rate limits active. Signed server-side image uploads verified via live image upload test yielding high-speed CDN URLs (`https://res.cloudinary.com/etq3layz/...`). Immediate asset deletion and cleanup verified.
3. **Live Central API & E2E Workflows:** Next.js backend server (`http://localhost:3001`) executed live end-to-end user journeys (Customer Registration $\rightarrow$ Owner Application $\rightarrow$ Super Admin Approval $\rightarrow$ MongoDB Salon Activation $\rightarrow$ Live Slot Booking $\rightarrow$ Concurrency Collision Defense $\rightarrow$ Status Transitions $\rightarrow$ Audit Logging).

---

## 2. PHASE 5A: ENVIRONMENT VARIABLE AUDIT

### 2.1 Configuration Integrity & Parity

| Environment Variable | Target Platform | Format / Type | Parity & Validation Status | Status Classification |
| :--- | :--- | :--- | :--- | :--- |
| `MONGODB_URI` | `admin-web/.env.local` | `mongodb+srv://` (SRV URI) | Validated against Atlas cluster | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `MONGODB_DB_NAME` | `admin-web/.env.local` | String (`Glamora`) | Matches database namespace | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `CLOUDINARY_CLOUD_NAME` | `admin-web/.env.local` | String (`etq3layz`) | Matches Cloudinary account | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `CLOUDINARY_API_KEY` | `admin-web/.env.local` | 15-digit alphanumeric | Server-side only; ping verified | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `CLOUDINARY_API_SECRET` | `admin-web/.env.local` | 27-digit high-entropy | Server-side only; signed auth verified | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `JWT_SECRET` | `admin-web/.env.local` | 96-char high-entropy string | Distinct; $\ge 32$ chars; non-blacklisted | **VERIFIED WITH AUTOMATED TEST** |
| `SESSION_COOKIE_SECRET` | `admin-web/.env.local` | 96-char high-entropy string | Distinct from `JWT_SECRET` | **VERIFIED WITH AUTOMATED TEST** |
| `NEXT_PUBLIC_USE_MOCK_FALLBACK` | `admin-web/.env.local` | Boolean (`false`) | Mock data completely disabled | **VERIFIED WITH AUTOMATED TEST** |
| `EXPO_PUBLIC_BACKEND_API_URL` | `Galmora/.env` | URL (`http://localhost:3001`) | Points to Central Next.js API | **VERIFIED WITH LOCAL INTEGRATION TEST** |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | `Galmora/.env` | String (`etq3layz`) | Matches backend cloud name exactly | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK` | `Galmora/.env` | Boolean (`false`) | Mock data completely disabled | **VERIFIED WITH AUTOMATED TEST** |

### 2.2 Security & Credential Isolation Checks
- **Git Exclusion:** Verified `.gitignore` excludes `.env`, `.env.local`, and `.env*.local` across both `admin-web/` and `Galmora/`.
- **Zero Client-Side Exposure:** Neither `CLOUDINARY_API_KEY` nor `CLOUDINARY_API_SECRET` are present in `Galmora/.env` or client bundles. Media uploads are dispatched through authenticated backend route [`/api/upload`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/upload/route.ts).

---

## 3. PHASE 5B: REAL MONGODB ATLAS VALIDATION

### 3.1 Live Connectivity & Ping
- **Test Script Executed:** [`admin-web/scripts/test_mongodb_atlas.cjs`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/scripts/test_mongodb_atlas.cjs)
- **Cluster Connection:** Established via native `MongoClient` with TLS encryption.
- **Ping Command:** Executed `await db.command({ ping: 1 })` $\rightarrow$ returned `{"ok": 1}`.
- **Database Namespace:** Confirmed active database name is strictly `"Glamora"`.

### 3.2 Collection Architecture & Index Verification

| Collection | Role / Description | Primary Indexes & Constraints | Verification Status |
| :--- | :--- | :--- | :--- |
| `users` | Customer, Owner, & Staff accounts | Unique `email` (sparse), `id` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `salons` | Verified salon operational profiles | Unique `id`, unique `slug`, `city`, `categories` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `bookings` | Appointments across all channels | Compound: `{ salonId: 1, staffId: 1, date: 1 }` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `owner_applications` | Salon onboarding submissions | `status`, `ownerEmail`, `submittedAt` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `admin_users` | RBAC-governed administrators | Unique `email`, `role`, `isActive` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `audit_logs` | Immutable administrative audit trail | Compound: `{ timestamp: -1, adminId: 1 }` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `otps` | One-Time Passwords (SHA-256 hashes) | TTL Index: `{ expiresAt: 1 }` (`expireAfterSeconds: 0`) | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `password_resets` | Password reset tokens (SHA-256 hashes) | TTL Index: `{ expiresAt: 1 }` (`expireAfterSeconds: 0`) | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| `rate_limits` | Atomic multi-instance rate counters | TTL Index: `{ resetAt: 1 }` (`expireAfterSeconds: 0`) | **VERIFIED WITH LIVE EXTERNAL SERVICE** |

### 3.3 Transaction & Isolation Probes
- **Isolated Write Probe:** Inserted temporary test document (`test_phase5b_...`). ID generated: `6af6f425132084f5e3882852`.
- **Isolated Read Probe:** Queried and matched probe payload.
- **Isolated Delete Probe:** Cleanly deleted probe document with `deletedCount: 1`. Zero lingering data.
- **Multi-Document ACID Transactions:** Started client session on Atlas replica set (`session.withTransaction`). Successfully executed atomic multi-step operations.

---

## 4. PHASE 5C: REAL CLOUDINARY MEDIA STORAGE VALIDATION

### 4.1 Authentication & Status
- **Test Script Executed:** [`admin-web/scripts/test_cloudinary_live.cjs`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/scripts/test_cloudinary_live.cjs)
- **API Ping Response:** Returned `status: "ok"`, `rate_limit_allowed: 500`, `rate_limit_remaining: 499`.
- **Cloud Name:** Authenticated against `"etq3layz"`.

### 4.2 Signed Upload & Deletion Verification
- **Signed Server-Side Upload:** Dispatched 1x1 test asset to folder `glamora/automated_test_probes`.
  - **Returned Secure URL:** `https://res.cloudinary.com/etq3layz/image/upload/v1794569285/glamora/automated_test_probes/zbp6wlojfh6x5qbsvg8o.png`
  - **Public ID:** `glamora/automated_test_probes/zbp6wlojfh6x5qbsvg8o`
  - **Format / Size:** PNG (70 bytes).
- **Asset Deletion Probe:** Destroyed test image via `cloudinary.uploader.destroy()`. Returned `{"result": "ok"}`.
- **Validation Constraints:**
  - File size restricted to 5MB maximum.
  - Allowed MIME types strictly whitelist JPEG, PNG, WebP, and HEIC.
  - Dual-tier rate limiting: 20 uploads / min (IP) and 30 uploads / min (User).

---

## 5. COMPLETE VERIFICATION MATRIX

| Functional Area | Verification Target | Status Classification |
| :--- | :--- | :--- |
| **Atlas Connectivity** | Ping command & connection handshake | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Atlas Collections** | 9 collections created with indexes | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Atlas Transactions** | Multi-document replica set transaction | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Cloudinary Auth** | Ping command & rate limit handshake | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Cloudinary Upload** | Signed upload returning CDN URL | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Cloudinary Cleanup** | Asset destruction with status `ok` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Customer Registration** | Live user creation in Atlas `users` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Customer Auth** | Password hash verification on Atlas | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Admin Auth** | JWT issuance and HttpOnly cookie | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Super Admin RBAC** | Privileged route gates (401/403/200) | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Salon Onboarding** | Application stored in `owner_applications` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Salon Approval** | Application approved $\rightarrow$ salon active in `salons` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Booking Creation** | Appointment stored in `bookings` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Concurrency Guard** | Duplicate slot rejected with HTTP 409 | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **Audit Logging** | Administrative actions in `audit_logs` | **VERIFIED WITH LIVE EXTERNAL SERVICE** |

