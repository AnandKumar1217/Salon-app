# GLAMORA — PHASE 8: PUSH NOTIFICATIONS & SMS ARCHITECTURE REPORT

**Date:** November 13, 2026  
**Auditor:** Principal Mobile Communications Engineer & Security Lead  
**Scope:** Push Notification Services (APNs, FCM, Expo Push), Cellular SMS Carriers (Twilio/Msg91), and First-Release Mandatory Status  
**Architectural Policy:** Strict Zero-Firebase Mandate (No Firebase Auth, No Firestore, No Firebase Admin SDK, No Cloud Functions)  

---

## 1. FIRST-RELEASE (V1.0.0) MANDATORY STATUS ANALYSIS

| Communication Channel | First-Release Requirement | Fallback Mechanism Present in V1.0.0 | Operational Impact if Omitted in V1.0.0 |
| :--- | :---: | :--- | :--- |
| **In-App Notification Stream** | **MANDATORY (READY)** | Fully implemented in [`notificationsApi.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/src/api/notificationsApi.ts) & [`NotificationsScreen.tsx`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/src/screens/notifications/NotificationsScreen.tsx). | None. Operates completely offline/online in-memory and storage. |
| **WhatsApp Appointment Handoff**| **MANDATORY (READY)** | Direct one-touch `https://wa.me/` concierges in both Mobile and Customer Website. | None. Customers receive instant WhatsApp booking slips directly from salons. |
| **Cellular SMS Text Delivery** | **OPTIONAL FOR MVP** | Email verification + password authentication are fully functional in MongoDB Atlas. | Minor. Users log in with email + password; SMS OTP is an alternative convenience. |
| **Dead-App Background Push (APNs/FCM)**| **OPTIONAL FOR MVP** | Live polling on active screens + in-app notification center. | Moderate. Users receive alerts when opening the app, but not on locked lock screens when app is killed. |

> [!TIP]
> **MVP Launch Strategy Recommendation:**
> Glamora can be deployed to production and submitted to the App Store and Google Play immediately as **Version 1.0.0** utilizing Email/Password authentication, In-App Notifications, and WhatsApp Concierge booking receipts.
> Carrier SMS and APNs/FCM push credentials can be integrated in **Version 1.1.0** without modifying the core booking engine.

---

## 2. PUSH NOTIFICATION ARCHITECTURE (ZERO-FIREBASE COMPLIANT)

A critical requirement of Glamora is that **Firebase must never be reintroduced**.

### 2.1 How Push Notifications Work Without Firebase SDKs
1. **The Trap to Avoid:** Reintroducing `firebase-admin` or the `@react-native-firebase/*` libraries would pull in Firestore and Firebase Authentication, violating the approved MongoDB architecture.
2. **The Approved Solution:** Glamora utilizes the **Expo Push Service HTTP/2 Gateway** (`https://exp.host/--/api/v2/push/send`):
   - The mobile client calls `Notifications.getExpoPushTokenAsync()` to obtain an anonymous Expo token (e.g. `ExponentPushToken[xxxxxxxxxxxxxx]`).
   - The token is saved in the MongoDB `users` collection.
   - When a booking occurs, the Next.js backend makes a standard HTTPS `POST` to the Expo Push Gateway.
   - Expo securely hands off the payload to **Apple APNs** for iPhones and **Google FCM v1 HTTP API** for Android.
   - **Zero Firebase code exists in the client bundle or backend.**

```
Mobile App (React Native)
      │
      ▼ (getExpoPushTokenAsync)
Saves Token to MongoDB Atlas (`users.pushToken`)
      │
      ▼
When Booking Status Changes:
Next.js Central API (/api/bookings/[id])
      │
      ▼ HTTPS POST (Zero Firebase SDK)
Expo Push Gateway (https://exp.host/--/api/v2/push/send)
      ├──► Apple APNs Gateway ────► iOS Lock Screen Notification
      └──► Google FCM v1 API  ────► Android System Notification Bar
```

---

## 3. EXACT STEP-BY-STEP CREDENTIAL CONFIGURATION GUIDE

When the owner decides to enable locked-screen push alerts, execute these steps:

### 3.1 Apple APNs Configuration (iOS)
1. Log in to [Apple Developer Portal](https://developer.apple.com/account).
2. Go to **Certificates, Identifiers & Profiles > Keys**.
3. Click the **"+"** button to register a new key named `"Glamora Push Key"`.
4. Check **Apple Push Notifications service (APNs)**.
5. Download the `.p8` key file (e.g., `AuthKey_XXXXXXXXXX.p8`). Note down the **Key ID** and your **Team ID**.
6. In your terminal:
   ```bash
   cd Galmora
   npx eas-cli credentials
   ```
   Select `iOS > Push Notifications > Upload APNs Key`. Upload the `.p8` file.
7. Done! EAS automatically links APNs with zero app recompilation needed.

### 3.2 Google FCM v1 Configuration (Android)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) (or Firebase Console for FCM messaging credentials only).
2. Generate a **Google Cloud Service Account JSON** with the role `"Firebase Cloud Messaging API Admin"`.
3. In your terminal:
   ```bash
   cd Galmora
   npx eas-cli credentials
   ```
   Select `Android > Push Notifications > Upload Service Account JSON`.
4. Done! Android push notifications are now linked.

---

## 4. CELLULAR SMS GATEWAY SPECIFICATION (TWILIO / MSG91)

The backend has been constructed with pluggable provider support in [`admin-web/src/app/api/auth/otp/send/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/auth/otp/send/route.ts).

### 4.1 Required Environment Variables
When ready for cellular SMS, enter the credentials in `admin-web/.env.local`:

```env
# Outbound SMS Provider (twilio or msg91)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Or for India-specific DLT approved routes:
# SMS_PROVIDER=msg91
# MSG91_AUTH_KEY=your_msg91_auth_key
# MSG91_TEMPLATE_ID=your_dlt_template_id
```

### 4.2 Security Controls Implemented
- **SHA-256 Digest in Database:** OTPs are never stored in plaintext.
- **TTL Index:** MongoDB automatically drops expired OTP records after 10 minutes.
- **Immediate Burn on Verify:** Single-use guarantee prevents replay attacks.
- **Rate Limit:** Maximum 3 SMS requests per phone number per 15 minutes to defend against financial exhaustion attacks.

