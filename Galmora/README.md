# 🌸 GLAMORA — Cross-Platform Mobile Application (Android & iOS)

> **Your Salon. Your Style. Your Time.**
> A single, commercial-grade mobile application delivering TWO completely different, dynamic user experiences based on server-verified roles: **Customer Mode** and **Salon Owner Mode**. Built with React Native, Expo SDK 58, TypeScript, Central Next.js REST API, MongoDB Atlas, Cloudinary CDN, and Expo Push Gateway.

---

## 📑 Table of Contents

1. [Product Vision & Dual-Mode Architecture](#1-product-vision--dual-mode-architecture)
2. [Dynamic Role Selection & Authorization Engine](#2-dynamic-role-selection--authorization-engine)
3. [Customer Mode Experience](#3-customer-mode-experience)
4. [Salon Owner Mode Experience](#4-salon-owner-mode-experience)
5. [Unified Staff Availability & Booking Engine](#5-unified-staff-availability--booking-engine)
6. [Public Web Booking Portal & Deep Linking](#6-public-web-booking-portal--deep-linking)
7. [MongoDB Atlas & Central API Security Architecture](#7-mongodb-atlas--central-api-security-architecture)
8. [Automated Test Suite](#8-automated-test-suite)
9. [Android Build & EAS Production Deployment](#9-android-build--eas-production-deployment)
10. [Google Play Store Release Checklist](#10-google-play-store-release-checklist)

---

## 1. Product Vision & Dual-Mode Architecture

Glamora unifies offline local salons with online appointments without disrupting their core walk-in business.

### ONE App. TWO Dynamic Modes.
- **Customer Mode:** Warm luxury aesthetic, curated boutique salon discovery, service exploration, committed-start-time booking, WhatsApp concierge, appointment reminders, and saved salons.
- **Salon Owner Mode:** High-efficiency operational suite, live daily appointments, fast walk-in check-in, protected FIFO waiting lounge queue, employee shift calendar, delay alerting, treatments/pricing management, and daily collections reports.

```
                            [ GLAMORA ANDROID APP ]
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             [ CUSTOMER MODE ]                 [ SALON OWNER MODE ]
         • Luxury Warm Ivory Theme          • High-Clarity Operations
         • Bottom Tabs:                     • Bottom Tabs:
           1. Home                            1. Dashboard
           2. Explore (Discovery)             2. Calendar (Day/Week)
           3. Bookings                        3. Walk-ins & Queue
           4. Saved                           4. Staff Specialists
           5. Profile                         5. More & Reports
                      ▲                                 ▲
                      └─────────[ ROLE SWITCHER ]───────┘
                           (Server-Verified Access)
```

---

## 2. Dynamic Role Selection & Authorization Engine

- **Role Selection Screen (`RoleSelectionScreen`):**
  - Brand: **GLAMORA**
  - Tagline: *Your Salon. Your Style. Your Time.*
  - Heading: *Welcome to Glamora*
  - Selection Cards:
    - **CARD 1 — Customer:** "Discover salons, explore services and book your next appointment."
    - **CARD 2 — Salon Owner:** "Manage your salon, employees, appointments and customers."
  - Stored strictly as a navigation preference — permissions are server-verified on the backend.
- **Dual-Role Switching:**
  - Users authorized for both roles can switch between Customer Mode and Salon Owner Mode with a single tap in the header or profile menu.
  - Customer accounts without an approved salon cannot navigate to owner screens.
- **Owner Multi-Step Registration Wizard:**
  - Step 1: Owner Profile (Full name, phone, email).
  - Step 2: Salon Address & Contact (Brand name, street, city, postal code, reception phone).
  - Step 3: Business Verification (Category, GSTIN/license, description, policy agreement).
- **Salon Lifecycle Statuses:**
  - `APPROVED`: Direct access to the live Owner Dashboard.
  - `PENDING_APPROVAL`: Shows `PendingApprovalScreen` (24-48h review status).
  - `REJECTED`: Shows `RejectedApplicationScreen` with reviewer feedback and re-apply action.
  - `SUSPENDED`: Shows `SuspendedAccountScreen` with support contact and appeal channel.

---

## 3. Customer Mode Experience

### Customer Bottom Navigation
1. **Home (`HomeScreen`):**
   - Location selector with GPS area support.
   - Dynamic upcoming appointment reminder card.
   - Quick "Switch to Salon Owner Mode" banner (for authorized owners).
   - Horizontal service categories (Hair, Color, Facial, Nails, Beard, Spa).
   - Zero-waiting member privilege cards.
   - Featured nearby salons carousel.
2. **Explore (`SalonListScreen`):**
   - Real-time search by salon name, stylist, and service.
   - Filter chips for price (`$`, `$$`, `$$$`), categories, and ratings (4.5+).
3. **Bookings (`AppointmentsListScreen`):**
   - Segmented tabs for "Upcoming" and "Past History".
   - Status indicators (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
   - Detailed appointment view with cancellation and rescheduling modals.
4. **Saved (`SavedSalonsScreen`):**
   - Bookmarked boutique salons with instant re-book shortcuts.
5. **Profile (`ProfileScreen`):**
   - Personal information and avatar customization.
   - Role switcher / Salon Owner registration shortcut.
   - WhatsApp and push notification toggles.
   - Support, policies, and account deletion.

---

## 4. Salon Owner Mode Experience

### Owner Bottom Navigation
1. **Dashboard (`OwnerDashboardScreen`):**
   - Real-time KPIs: Today's appointments, Walk-ins, Waiting queue count, Working vs Available staff.
   - Next upcoming confirmed appointment with "Start Service" and "10m Delay" shortcuts.
   - Chairs In Service tracking.
   - Revenue summary and booking source breakdown (App, WhatsApp, Walk-in).
   - Fast action dock: Add Walk-in, Add Appointment, Block Time, Staff.
2. **Calendar (`OwnerCalendarScreen`):**
   - Daily and weekly schedule timeline.
   - Staff filter chips (All Staff vs Resident Stylists).
   - Status transitions: Check-in, Delay notification, Complete, Mark No-Show.
   - Blocked time slot windows.
3. **Walk-ins (`WalkInManagementScreen`):**
   - Instant walk-in check-in with capacity protection.
   - FIFO waiting lounge queue with estimated wait times.
   - "Seat Guest" action to assign freed specialists.
   - SMS/WhatsApp customer notification shortcut.
4. **Staff (`StaffManagementScreen`):**
   - Specialist roster with experience and ratings.
   - Active/Inactive on floor toggle.
   - Working shift hours and mandatory rest breaks.
   - `StaffEditModal` for adding or modifying employee schedules.
5. **More (`OwnerMoreScreen`):**
   - Public Booking Link & QR Code generator (`SalonQrCodeScreen`).
   - Collections & Financial Reports (`OwnerReportsScreen`).
   - Salon Profile & Zero-Waiting buffer configuration (`SalonProfileEditScreen`).
   - Switch back to Customer Mode.

---

## 5. Unified Staff Availability & Booking Engine

The core operational principle of Glamora is **zero double-booking** across all channels:

```
[ App Booking ]     [ WhatsApp ]     [ Public Web ]     [ Walk-in Guest ]
       │                  │                 │                  │
       └──────────────────┴────────┬────────┴──────────────────┘
                                   │
                                   ▼
                   [ UNIFIED CAPACITY ENGINE ]
            ├─ 1. Salon Operating Hours (Day of week)
            ├─ 2. Staff Shift Hours & Scheduled Breaks
            ├─ 3. Blocked Time Windows (Trainings, Leave)
            ├─ 4. Category Skill Qualifications
            ├─ 5. Existing Bookings (Start to End + Buffer)
            └─ 6. Protected Confirmed Appointments
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
           [ CAPACITY EXISTS ]           [ CAPACITY ENGAGED ]
        Atomic Lock in Transaction     Added to Waiting Queue
          Status: CONFIRMED             Est. Wait Calculated
```

---

## 6. Public Web Booking Portal & Deep Linking

Every salon receives a shareable public booking link:
```
https://glamora.example/salon/<salon-slug>
```

- **Responsive Web Portal (`public-web/index.html`):**
  - Clients can browse services, select date and available time slots, and confirm appointments without app installation.
  - Submits to the exact same backend booking engine (`source: 'WEB'`).
  - Includes an "Open in Glamora App" smart banner.
- **Deep Linking & Android App Links:**
  - Configured in `app.json` with scheme `glamora` and verified intent filters for `https://glamora.example/salon/*`.
  - Customers with Glamora installed open directly into the salon detail view.

---

## 7. MongoDB Atlas & Central API Security Architecture

### Multi-Tenant MongoDB Collections
- `users`: User profiles with roles, bcrypt password hashes, and registered push tokens.
- `salons`: Multi-tenant salon business records, services, staff, and operating hours.
- `bookings`: Central reservation records with salon tenant tags and concurrency checks.
- `notifications`: In-app notification records.
- `push_tokens`: Device push tokens for cross-platform Expo Push Gateway delivery.
- `owner_applications`: Merchant registration submissions.
- `admin_audit_logs`: Server-immutable audit records.

### API Security Summary
- Customer records are readable/writable only by authenticated token owners.
- Salons, services, and staff are publicly readable via central API for discovery.
- Salon operational endpoints are strictly restricted to verified salon owners.
- Bookings can be accessed only by the customer or the assigned salon owner.

---

## 8. Automated Test Suite

Glamora includes an automated test suite verifying all 11 core architectural requirements:

```bash
cd Galmora
npm test
```

### Verified Test Cases:
1. **Authentication & OTP Validation** — Mobile format check, OTP verification, blacklisted OTP rejection.
2. **Role Switching** — Safe transitions between Customer and Owner modes.
3. **Unauthorized Access Protection** — Blocks customer-only accounts from owner dashboards.
4. **Salon Multi-Tenant Isolation** — Prevents cross-salon data contamination.
5. **Booking Concurrency** — Atomic capacity locking prevents double-booking.
6. **Walk-in Conflict Detection** — Protects confirmed appointments from walk-in overlap.
7. **Booking Cancellation Policies** — Enforces cancellation window deadlines.
8. **Rescheduling & Capacity Transfer** — Verifies target availability before transferring slots.
9. **Deep Link & App Link URL Resolution** — Parses custom schemes and HTTPS URLs.
10. **Customer Public Web Booking Engine** — Validates web booking structure and validation.
11. **Owner Operational Workflows** — Validates delay reporting, staff time blocking, and queue management.

---

## 9. Android Build & EAS Production Deployment

### Local Development Build
```bash
# Start the Expo development server
npm start

# Run on connected Android device or emulator
npm run android
```

### Cloud Production Build with EAS
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to Expo
eas login

# Build Android Preview APK
eas build --platform android --profile preview

# Build Android App Bundle (AAB) for Google Play Store
eas build --platform android --profile production
```

---

## 10. Google Play Store Release Checklist

1. **Package Name:** `com.glamora.app` (single unified application).
2. **Version:** `1.0.0` (`versionCode: 1`).
3. **Scheme & App Links:** `scheme: "glamora"` with `autoVerify: true` on `glamora.example/salon/*`.
4. **Icons & Splash:** Custom 512x512 adaptive icon with signature brand background (`#4A1E36`).
5. **Permissions:**
   - `ACCESS_COARSE_LOCATION` & `ACCESS_FINE_LOCATION` for nearby salon discovery.
   - `POST_NOTIFICATIONS` for appointment reminders, queue updates, and delay alerts.
   - `INTERNET` for Cloud Functions and Firestore communication.
   - `CALL_PHONE` for one-tap salon customer inquiries.
6. **Data Privacy & Account Deletion:** Direct account deletion workflow accessible from `Profile` > `Delete Account`.
