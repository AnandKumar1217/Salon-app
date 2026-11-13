# GLAMORA — CHANGED FILES & AUDIT MANIFEST

**Audit Date:** November 2026  
**Scope:** Migration from Firebase to MongoDB Atlas + Cloudinary + Expo Push + Security Hardening

---

## 1. Newly Created Files

| File Path | Purpose |
| :--- | :--- |
| `Galmora/src/utils/pushNotifications.ts` | Mobile push notification service with `expo-notifications`, Android channel setup, token sync, and event handlers. |
| `admin-web/src/lib/push-notifications.ts` | Backend push notification engine connecting to Expo Push HTTP/2 Gateway with automated booking lifecycle triggers. |
| `admin-web/src/app/api/users/push-token/route.ts` | REST API route to register mobile device push tokens into MongoDB Atlas. |
| `admin-web/src/app/api/notifications/route.ts` | REST API route to fetch and update in-app notifications. |
| `admin-web/tests/push_notifications.test.ts` | Automated test suite verifying push token validation, batching, and notification payloads (9/9 passed). |
| `admin-web/src/lib/cors.ts` | Dynamic CORS origin allowlist, credential validation, and preflight handling. |
| `admin-web/src/middleware.ts` | Next.js middleware enforcing CORS headers and blocking unapproved CSRF requests. |
| `FINAL_DEPLOYMENT_READINESS/*.md` | The 12 comprehensive final production deployment readiness reports. |

---

## 2. Modified & Hardened Files

| File Path | Modifications Made |
| :--- | :--- |
| `Galmora/package.json` | Installed `expo-font`, `expo-splash-screen`, `expo-notifications`, and `expo-device` compatible with Expo SDK 58. |
| `Galmora/app.json` | Removed deprecated top-level `splash` and invalid `usesCleartextTraffic`. Configured `expo-splash-screen` and `expo-notifications` plugins, Android permissions, and iOS privacy strings. |
| `Galmora/src/context/AuthContext.tsx` | Wired push notification registration upon session load, login, registration, and OTP verification. Enforced zero mock fallback in production. |
| `Galmora/src/api/notificationsApi.ts` | Integrated with central REST API `/api/notifications` with offline local storage cache fallback. |
| `Galmora/README.md` | Replaced legacy Firebase architecture documentation with MongoDB Atlas, Cloudinary, and Expo Push. |
| `admin-web/package.json` | Updated test scripts to include `tests/push_notifications.test.ts`. |
| `admin-web/src/app/api/bookings/route.ts` | Integrated `notifyBookingCreated` to trigger instant push notifications to customer and salon owner. |
| `admin-web/src/app/api/bookings/[id]/route.ts` | Integrated `notifyBookingStatusUpdated` to trigger push alerts on appointment status changes (`COMPLETED`, `CANCELLED`, `DELAYED`). |
| `admin-web/src/lib/mongodb.ts` | Implemented self-healing reconnect logic on connection drops or IP whitelist updates. |
| `admin-web/scripts/bootstrap-super-admin.mjs` | Completely rewritten from legacy Firebase Admin SDK to native MongoDB Atlas driver with bcrypt password hashing. |
| `admin-web/README.md` | Replaced obsolete Firebase architecture diagrams and descriptions with Next.js REST API, MongoDB Atlas, and Cloudinary. |
| `admin-web/tests/*.ts` | Injected `export {};` to isolate scope and eliminate TS2451 global redeclaration errors. |

---

## 3. Deleted / Obsolete Files Cleaned Up

| File Path | Reason for Removal |
| :--- | :--- |
| `Galmora/scripts/bootstrap-super-admin.mjs` | Obsolete leftover from initial Phase 1 Firebase setup. Super Admin bootstrap belongs exclusively to `admin-web/`. |
| `admin-web/test-conn.js` | Temporary diagnostic connection test file cleaned up after SSL analysis. |

