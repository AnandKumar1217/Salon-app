# GLAMORA — REMAINING IMPLEMENTATION WORK
**Document Status:** PRE-DEPLOYMENT SPECIFICATION  
**Target Architecture:** MongoDB Atlas + Next.js 14 API + Cloudinary + Expo React Native  

---

## 1. Executive Summary

The Glamora platform has completed its migration from Firebase to an authoritative MongoDB and Cloudinary architecture. All core schemas, REST API endpoints, image upload pipelines, Zero-Dummy-Data empty states, and role-based access control policies are operational and verified.

Before initiating a live public production release, the following 6 implementation items should be finalized.

---

## 2. Prioritized Implementation Roadmap

### Priority 1: Native Mobile Authentication & SMS OTP Gateway
- **Current State:** The mobile app (`Galmora/src/context/AuthContext.tsx`) provides UI flows for Phone OTP and Email login, but verifies OTP locally with a 6-digit check (`code !== '000000'`) and loads pre-seeded testing profiles if `AsyncStorage` is empty.
- **Required Implementation:**
  1. Connect mobile `loginWithEmail` and `ownerLoginWithEmail` to the Next.js API `/api/auth/login`.
  2. Implement an SMS verification gateway endpoint:
     - `POST /api/auth/send-otp` (integrating with Twilio, AWS SNS, or Msg91).
     - `POST /api/auth/verify-otp` (verifying cryptographic hash or Redis/MongoDB transient OTP doc with 5-minute TTL).
  3. Store the issued JWT token securely in `expo-secure-store` rather than unencrypted `AsyncStorage`.
  4. Pass `Authorization: Bearer <token>` on all outbound mobile API requests.
- **Complexity:** Medium  
- **Status:** **IMPLEMENTED BUT NOT VERIFIED**

---

### Priority 2: Owner Salon Appointment Synchronization to MongoDB
- **Current State:** The Android Salon Owner mode (`Galmora/src/context/OwnerSalonContext.tsx`) persists appointments, queue items, and staff blocks to `AsyncStorage`. When an owner updates an appointment status (`IN_PROGRESS`, `COMPLETED`, delay), the change is saved locally.
- **Required Implementation:**
  1. Call `updateBookingInBackend(bookingId, status, delayMinutes)` from `OwnerSalonContext.tsx` whenever `updateAppointmentStatus` is triggered.
  2. Ensure offline mutations are queued and retried when network connectivity is restored.
- **Complexity:** Low  
- **Status:** **IMPLEMENTED BUT NOT VERIFIED**

---

### Priority 3: Razorpay Payment Gateway Integration
- **Current State:** Online payment flows and invoices are modeled in the database schema (`payments` collection), and the checkout UI supports choosing `ONLINE` vs `PAY_AT_SALON`.
- **Required Implementation:**
  1. Implement `POST /api/payments/create-order`: Initializes Razorpay order via Razorpay Node SDK using `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
  2. Implement `POST /api/payments/verify-webhook`: Validates HMAC-SHA256 signature using `RAZORPAY_WEBHOOK_SECRET` and marks booking `paymentStatus = 'PAID'` upon capture.
  3. Integrate `react-native-razorpay` in the mobile app for native UPI and card checkout sheets.
- **Complexity:** Medium  
- **Status:** **MISSING** (Documented in API specs)

---

### Priority 4: WhatsApp Business Cloud API Integration
- **Current State:** Salon WhatsApp numbers are configured in the database, and customers can initiate direct WhatsApp chats from the app.
- **Required Implementation:**
  1. Create `POST /api/webhooks/whatsapp`: Listens to incoming webhook messages from Meta WhatsApp Cloud API.
  2. Parse customer appointment requests via natural language template and map them to `/api/bookings` with `source: 'WHATSAPP'`.
  3. Dispatch automated WhatsApp appointment confirmation messages with booking codes upon slot reservation.
- **Complexity:** Medium  
- **Status:** **MISSING** (Documented in API specs)

---

### Priority 5: Push Notifications via Expo Push Service
- **Current State:** Super Admin features a platform broadcast UI (`/notifications`) and modal.
- **Required Implementation:**
  1. Register Expo Push Tokens on mobile device login (`Notifications.getExpoPushTokenAsync()`) and persist in MongoDB `users` collection.
  2. Implement `POST /api/notifications/broadcast`: Dispatches notification payloads via Expo Push REST API (`https://exp.host/--/api/v2/push/send`).
  3. Target broadcasts by user segment (`CUSTOMERS`, `SALON_OWNERS`, `ALL`).
- **Complexity:** Low  
- **Status:** **MISSING**

---

### Priority 6: MongoDB Multi-Document ACID Transactions (Replica Set)
- **Current State:** The booking engine enforces slot uniqueness and staff conflict checks via composite index queries and pre-flight validation.
- **Required Implementation:**
  1. When deploying to MongoDB Atlas M10+ (which operates as a 3-node replica set), wrap `insertMongoBooking` in `session.withTransaction()`.
  2. Ensure atomic write guarantees during high-traffic booking flash sales or seasonal peaks.
- **Complexity:** Low  
- **Status:** **IMPLEMENTED BUT NOT VERIFIED** (Pending Atlas replica set provisioning)

