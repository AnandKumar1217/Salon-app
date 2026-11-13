# GLAMORA — CENTRAL REST API & BACKEND PRODUCTION READINESS REPORT

**Framework:** Next.js 14.2.15 (App Router API routes)  
**Database:** MongoDB Atlas (Driver: `mongodb` v7.8.0)  
**Media Provider:** Cloudinary Node SDK (v2.11.0)  
**Authentication:** Custom JWT (HS256) + bcryptjs (v3.0.3) + HTTP-only cookies  
**Directory:** `admin-web/`  
**Readiness Verdict:** **READY FOR CLOUD STAGING & PRODUCTION**

---

## 1. Architectural Architecture & Modules

The backend API inside `admin-web/src/app/api` serves as the authoritative single source of truth for:
1. **Glamora Mobile App** (Android & iOS)
2. **Customer Booking Website** (`public-web/`)
3. **Super Admin Operations Web Panel** (`admin-web/`)

### Key Route Hierarchy:
- `POST /api/auth/customer/register`: New customer registration with bcrypt cost factor 10.
- `POST /api/auth/customer/login`: Customer email/password verification and JWT issuance.
- `POST /api/auth/otp/send`: Generates and hashes 6-digit verification code with rate limiting.
- `POST /api/auth/otp/verify`: Validates OTP and returns JWT token.
- `POST /api/auth/login`: Admin login issuing secure HTTP-only cookie (`glamora_admin_token`).
- `POST /api/auth/logout`: Clears session cookies immediately with `Max-Age: 0`.
- `GET /api/salons`: Public discovery feed for mobile app and customer booking website.
- `POST /api/bookings`: Atomically inserts reservations with conflict detection.
- `PATCH /api/bookings/[id]`: Status updates (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `DELAYED`) with push notification dispatch.
- `POST /api/users/push-token`: Registers Expo Push Tokens for mobile devices into MongoDB.
- `GET/PATCH /api/notifications`: Retrieves and updates in-app notification records.
- `POST /api/upload`: Server-proxied secure image upload to Cloudinary.
- `GET /api/health`: Comprehensive system health diagnostics.

---

## 2. Database Connection Resilience & Schema Integrity

### Self-Healing Connection Pool (`admin-web/src/lib/mongodb.ts`):
- Uses `serverSelectionTimeoutMS: 5000` and `connectTimeoutMS: 5000`.
- Implements self-healing connection promise eviction: if a connection is rejected due to a network glitch or IP whitelist transition, the cached rejected promise is cleared automatically, enabling immediate recovery on the next request without server restart.

### Production Indexes (`admin-web/src/lib/mongodb-service.ts`):
1. `users`: Unique sparse index on `email` and `phone`.
2. `salons`: Unique index on `id`, standard indexes on `status`, `ownerId`, and `city`.
3. `bookings`: Composite index on `{ salonId: 1, date: 1, staffId: 1, status: 1 }` ensuring strict double-booking prevention.
4. `push_tokens`: Unique index on `token`, index on `userId`.
5. `admin_audit_logs`: Descending index on `timestamp: -1`.

---

## 3. Security Hardening Audit

### 3.1 Strict CORS & CSRF Defense (`admin-web/src/middleware.ts` & `cors.ts`)
- **No Wildcard Allowed:** Wildcard `*` is strictly forbidden.
- **Dynamic Origin Echoing:** The middleware verifies incoming `Origin` headers against an approved allowlist. If approved, it echoes back the exact origin accompanied by `Access-Control-Allow-Credentials: true` and `Vary: Origin`.
- **Preflight Handling:** `OPTIONS` preflight requests from approved origins receive `HTTP 204 No Content`. Unapproved origins receive `HTTP 403 Forbidden`.
- **CSRF Defense:** State-changing requests (`POST`, `PUT`, `DELETE`, `PATCH`) carrying session cookies from unapproved origins are blocked with `HTTP 403 Forbidden`.
- **Mobile Pass-Through:** Native mobile requests (which do not carry browser `Origin` headers) pass through seamlessly.

### 3.2 Sliding-Window Rate Limiting (`admin-web/src/lib/rate-limiter.ts`)
- Admin Login: Maximum 5 attempts per IP per 15 minutes.
- Customer Auth: Maximum 10 attempts per IP per 15 minutes.
- OTP Sending: Maximum 3 attempts per phone number per 15 minutes.
- Cloudinary Uploads: Maximum 20 uploads per IP per minute.

---

## 4. Central Push Notification Service (`push-notifications.ts`)

- **Architecture:** Zero-Firebase managed push delivery via Expo Push HTTP/2 Gateway (`https://exp.host/--/api/v2/push/send`).
- **Batching:** Dispatches notifications in chunks of 100 per official Expo specification.
- **Automated Lifecycle Hooks:**
  - On new booking creation: Customer receives immediate confirmation; salon owner receives new appointment notification.
  - On booking completion: Customer receives a review prompt notification.
  - On booking cancellation: Both customer and salon owner receive immediate cancellation alerts.
  - On appointment delay: Customer receives a schedule update alert with delay minutes.

---

## 5. Deployment Options & Recommended Cloud Hosts

### Recommended: Vercel / Railway / Render / AWS ECS
1. Set the Root Directory to `admin-web`.
2. Set Build Command to `npm run build`.
3. Set Start Command to `npm start`.
4. Configure all environment variables from `admin-web/.env.local`.
5. Set `NEXT_PUBLIC_USE_MOCK_FALLBACK=false`.
6. Add the production server egress IP (or `0.0.0.0/0`) in MongoDB Atlas Network Access console.

