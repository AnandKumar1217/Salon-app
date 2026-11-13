# GLAMORA — GOOGLE PLAY STORE SUBMISSION CHECKLIST

**Platform:** Google Play Console (Android)  
**Package Name:** `com.glamora.app`  
**Current Version:** 1.0.0 (versionCode: 1)  
**Format:** Android App Bundle (.aab) via EAS Build

---

## 1. Google Play Console Account & Prerequisites

- [ ] **Developer Account:** Active Google Play Developer Console registration ($25 one-time registration fee).
- [ ] **Google Play App Signing:** Opt into Google Play App Signing (Play Console manages distribution keystore; upload key is managed by EAS).
- [ ] **EAS CLI Setup:** `npm install -g eas-cli` and logged in via `eas login`.
- [ ] **Link EAS Project:** Run `eas project:init` in `Galmora/` if not already linked to an Expo account.

---

## 2. Store Listing Information

- [ ] **App Title:** Glamora — Salon & Spa Booking (30 characters max).
- [ ] **Short Description:** Book appointments at top salons and spas with zero waiting time.
- [ ] **Full Description:** Comprehensive overview of Customer Mode (discovery, instant slot locking, price transparency, treatment catalog) and Salon Owner Mode (queue management, walk-in scheduling, delay alerting).
- [ ] **App Icon:** 512 x 512 px, 32-bit PNG with alpha, max 1MB. (Exported from `./assets/icon.png`).
- [ ] **Feature Graphic:** 1024 x 500 px, JPG or 24-bit PNG (no alpha).
- [ ] **Phone Screenshots:** Minimum 4 screenshots (1080 x 2400 px or standard 16:9 / 20:9 ratio) demonstrating:
  - Curated Salon Discovery Feed
  - Service Selection & Real-Time Slot Picker
  - Booking Confirmation & In-App Notification Center
  - Salon Owner Operations Dashboard & Daily Queue
- [ ] **Privacy Policy URL:** Publicly reachable HTTPS URL (e.g. `https://glamora.app/privacy`).

---

## 3. App Content & Policy Questionnaires

### 3.1 Data Safety Section
- **Location:**
  - Approximate location: Yes (App functionality — discovering nearby salons).
  - Precise location: Yes (App functionality — calculating accurate walking/driving distance).
  - Data shared with third parties: No.
- **Personal Info:**
  - Name, Phone Number, Email address collected for account creation and reservation confirmation.
- **Photos and Videos:**
  - Photos collected only when salon owners upload salon media or users update profile pictures.
- **Device or other IDs:**
  - Collected for push notification routing via Expo Push Gateway.
- **Security Practices:**
  - Data encrypted in transit (HTTPS/TLS).
  - Account deletion mechanism provided within the app (complies with May 2024 Play requirement).

### 3.2 Target Audience & Content Rating
- Target Age: 18 and older.
- Content Rating Questionnaire: Complete standard IARC questionnaire (Rating: Everyone / 3+).

### 3.3 App Access (Reviewer Credentials)
Provide active credentials in Play Console under **App access -> All or some functionality is restricted**:
- **Customer Account:** `customer.demo@glamora.app` / `Password123!`
- **Salon Owner Account:** `owner.demo@glamora.app` / `Password123!`
- Instructions: Mention that customer mode is the default; owner mode can be switched via Profile if the account is authorized.

---

## 4. Closed Testing Track Requirement (Personal Accounts)

> [!IMPORTANT]
> Google Play policy requires that personal developer accounts created after November 13, 2023 must test their app in a **Closed Testing Track** with at least **20 testers** opted-in for a minimum of **14 continuous days** before applying for Production release access.

- [ ] Create a Closed Testing Track in Google Play Console.
- [ ] Build production AAB: `eas build --platform android --profile production`.
- [ ] Upload AAB to Closed Testing.
- [ ] Invite 20+ testers via Google Group or email list.
- [ ] Ensure testers keep the app installed and provide periodic feedback over 14 days.
- [ ] Submit application for Production release access through the Play Console dashboard.

