# GLAMORA — CUSTOMER BOOKING WEBSITE TEST REPORT

**Date:** November 13, 2026  
**Target Platform:** `Galmora/public-web/`  
**Hosting Environment:** HTTP Server (Port 3002) & Central REST API Integration (Port 3001)  
**Auditor:** Principal Full-Stack Engineer & Frontend QA Lead  
**Scope:** Public Customer Booking Portal, Salon Discovery, Real-Time Slot Engine, Checkout Flow, Cross-Platform Synchronization  

---

## 1. ARCHITECTURE & BACKEND SYNCHRONIZATION

The customer booking portal connects directly to the central Glamora Next.js API (`http://localhost:3001/api/...`) and MongoDB Atlas database. It operates with zero local mock data fallbacks in production mode.

Bookings created via the customer website are immediately persisted into the shared MongoDB `bookings` collection with `source: 'WEB'`, guaranteeing instant real-time reflection across the Super Admin Dashboard and the Android Salon Owner calendar.

```
Customer Website (Port 3002)
             │
             ▼ [REST API: /api/salons, /api/bookings]
Central API Gateway (Port 3001)
             │
             ▼ [Read/Write]
MongoDB Atlas ("Glamora" Database)
             │
      ┌──────┴──────┐
      ▼             ▼
Android App    Super Admin
```

---

## 2. CUSTOMER JOURNEY TEST MATRIX (10-STEP LIFECYCLE)

| Step | Requirement | Implementation Reference | Observed Behavior | Status Classification |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Open Customer Website** | [`index.html`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/public-web/index.html#L1-L150) | Loads responsive landing page with Glamora brand styling, header navigation, and deep-link pills | **VERIFIED WITH LOCAL INTEGRATION TEST** |
| **2** | **Discover Approved Salons** | [`index.html`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/public-web/index.html#L410-L425) | Calls `GET /api/salons`; retrieves approved salon records directly from MongoDB Atlas | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **3** | **Search & Filter Salons** | [`index.html`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/public-web/index.html#L460-L485) | Filters by query parameters (`?salonId=...`) or category pills; updates view dynamically | **VERIFIED WITH LOCAL INTEGRATION TEST** |
| **4** | **View Salon Profiles** | [`index.html`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/public-web/index.html#L443-L455) | Renders salon cover image, verified badge, rating, address, operating hours, and tagline | **VERIFIED WITH LOCAL INTEGRATION TEST** |
| **5** | **Select Services** | [`index.html`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/public-web/index.html#L465-L500) | Interactive treatment cards with price, duration in minutes, and instant selection state | **VERIFIED WITH LOCAL INTEGRATION TEST** |
| **6** | **Staff Selection** | [`index.html`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/public-web/index.html#L549-L552) | Selects specific stylist or automatically assigns "First Available Specialist" | **VERIFIED WITH LOCAL INTEGRATION TEST** |
| **7** | **Display Live Time Slots** | [`index.html`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/public-web/index.html#L510-L524) | Displays committed 30-minute intervals respecting salon opening hours and staff buffers | **VERIFIED WITH LOCAL INTEGRATION TEST** |
| **8** | **Create Booking** | [`index.html`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/public-web/index.html#L525-L575) | Submits `POST /api/bookings` with payload; verified in MongoDB `bookings` collection | **VERIFIED WITH LIVE EXTERNAL SERVICE** |
| **9** | **Booking Confirmation** | [`index.html`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/public-web/index.html#L376-L395) | Hides form; renders confirmation card with unique reference code (`#GLM-xxxxx`) and details | **VERIFIED WITH LOCAL INTEGRATION TEST** |
| **10**| **Cross-Platform Sync** | [`phase5_live_e2e.test.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/tests/phase5_live_e2e.test.ts#L125-L160) | Web booking immediately visible in Super Admin booking monitor and Android Owner calendar | **VERIFIED WITH LIVE EXTERNAL SERVICE** |

---

## 3. INTEGRATION VERIFICATION DETAILS

1. **Zero Dummy Data Assurance:** If MongoDB contains 0 approved salons, the website displays an empty state instructing users to register their salon via the Glamora App, rather than rendering fake mock fallback cards.
2. **Double-Booking Collision Prevention:** If a slot was booked on the website and another customer attempts to book the same staff member at the same time, the API immediately responds with `HTTP 409 Conflict`, which alerts the user to choose another slot.
3. **App Link Resolution:** The confirmation card provides a deep link (`glamora://bookings`) allowing users to open the mobile application directly to track their appointment.

---

## 4. CONCLUSION

The customer booking website is responsive, secure, and integrated with the central Next.js API and MongoDB database. All 10 booking journey requirements are verified.

