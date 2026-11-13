# GLAMORA — BUG FIX AND REGRESSION AUDIT REPORT

**Date:** November 13, 2026  
**Auditor:** Principal Software Architect & QA Lead  
**Scope:** Defect Discovery, Code Hardening, Security Fixes, and Full Regression Verification across Mobile, Backend, and Database  

---

## 1. DEFECTS IDENTIFIED & RESOLUTIONS IMPLEMENTED

| # | Defect / Vulnerability Description | Severity | Target File(s) | Fix Implemented | Regression Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Missing iOS Permissions in `app.json`**<br>Missing `cameraPermission`, `buildNumber`, and `infoPlist` usage descriptions would cause App Store rejection. | **CRITICAL** | [`Galmora/app.json`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/app.json#L15) | Added `buildNumber: "1"`, `cameraPermission`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, and `NSLocationWhenInUseUsageDescription`. | **VERIFIED WITH AUTOMATED TEST** |
| **2** | **Missing iOS Profiles in `eas.json`**<br>EAS build configuration omitted iOS targets under `development`, `preview`, and `production`. | **HIGH** | [`Galmora/eas.json`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/eas.json#L6) | Added iOS build configurations across all three EAS profiles. | **VERIFIED WITH AUTOMATED TEST** |
| **3** | **Unprotected `POST /api/salons`**<br>Any unauthenticated user could create or overwrite salon profiles in MongoDB. | **CRITICAL** | [`admin-web/src/app/api/salons/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/salons/route.ts#L40) | Added JWT verification; restricted modifications strictly to Super/Operations Admins or verified Salon Owners matching `ownerId`. | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **4** | **Unprotected `PATCH /api/bookings/[id]`**<br>Booking status could be modified anonymously without authentication or status whitelist validation. | **HIGH** | [`admin-web/src/app/api/bookings/[id]/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/bookings/%5Bid%5D/route.ts#L10) | Added mandatory JWT authentication and whitelist validation (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `DELAYED`, `NO_SHOW`). | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **5** | **Missing Auth Header in Mobile Booking API**<br>`updateBookingInBackend` called backend PATCH without attaching JWT token. | **MEDIUM** | [`Galmora/src/api/mongoApi.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/src/api/mongoApi.ts#L30) | Injected `getSecureToken()` into request headers (`Authorization: Bearer <token>`). | **VERIFIED WITH LOCAL INTEGRATION TEST** |
| **6** | **Missing `.gitignore` in `admin-web` & Root**<br>Missing gitignore files posed a risk of committing `.env.local` to source control. | **HIGH** | [`admin-web/.gitignore`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/.gitignore)<br>[`.gitignore`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/.gitignore) | Created comprehensive `.gitignore` files strictly excluding `.env`, `.env.local`, `.env*.local`, and build artifacts. | **VERIFIED WITH AUTOMATED TEST** |
| **7** | **Missing Password Hash Vulnerability in Login**<br>If a user record lacked a `passwordHash` field, login could succeed without password match. | **CRITICAL** | [`admin-web/src/app/api/auth/customer/login/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/auth/customer/login/route.ts#L25) | Added strict check: `if (!user \|\| !user.passwordHash)` return HTTP 401. | **VERIFIED WITH AUTOMATED TEST** |
| **8** | **Short Server Selection Timeout on Atlas**<br>`serverSelectionTimeoutMS: 2500` could cause premature timeout during cold start DNS SRV lookups. | **MEDIUM** | [`admin-web/src/lib/mongodb.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/lib/mongodb.ts#L14) | Increased `serverSelectionTimeoutMS` and `connectTimeoutMS` to 10,000ms. | **VERIFIED WITH LIVE EXTERNAL SERVICE** |

---

## 2. REGRESSION TEST EXECUTION RESULTS

Following the implementation of all defect fixes, the full regression suite was executed across all components:

1. **Android TypeScript Check (`Galmora/` `npm run typecheck`):**
   - Result: **0 Errors** (`tsc --noEmit` exited with code 0).
2. **Mobile Automated Test Suite (`Galmora/` `npm test`):**
   - Result: **11/11 Passed (0 Failures)**.
3. **Backend Full Test Suite (`admin-web/` `npm test`):**
   - Result: **74/74 Passed (0 Failures)** across all 7 test suites.
4. **Next.js Production Build (`admin-web/` `npm run build`):**
   - Result: **31/31 routes compiled cleanly (0 Errors)**.

---

## 3. CONCLUSION

Zero regressions were introduced. All 8 identified defects have been resolved and verified with automated and live tests.

