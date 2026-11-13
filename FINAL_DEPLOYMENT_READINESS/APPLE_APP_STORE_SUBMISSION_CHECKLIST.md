# GLAMORA — APPLE APP STORE SUBMISSION CHECKLIST

**Platform:** Apple App Store Connect (iOS)  
**Bundle Identifier:** `com.glamora.app`  
**Current Version:** 1.0.0 (buildNumber: "1")  
**Format:** Production IPA submitted via EAS Build

---

## 1. Apple Developer Account & App Store Connect Setup

- [ ] **Apple Developer Program:** Active Organization or Individual membership ($99/year).
- [ ] **App Store Connect Record:**
  - Create new App in App Store Connect.
  - Primary Language: English (U.S. / India).
  - Bundle ID: Select `com.glamora.app` (registered via Apple Developer Portal or automatically by EAS).
  - SKU: `GLAMORA-APP-001`.
- [ ] **EAS Apple Account Linkage:** Run `eas credentials` in `Galmora/` to configure Apple Distribution Certificate and Apple Push Notification service (APNs) keys.

---

## 2. App Metadata & Store Listing Details

- [ ] **App Name:** Glamora: Salon & Spa Booking (30 characters max).
- [ ] **Subtitle:** Instant Appointments & Queues (30 characters max).
- [ ] **Primary Category:** Lifestyle (or Beauty).
- [ ] **Secondary Category:** Shopping / Business.
- [ ] **Keywords:** salon,spa,haircut,beauty,stylist,barber,appointment,booking,parlour,glamora.
- [ ] **Support URL:** `https://glamora.app/support` (or WhatsApp concierge link).
- [ ] **Marketing URL:** `https://glamora.app`.
- [ ] **Privacy Policy URL:** `https://glamora.app/privacy`.

---

## 3. App Screenshots & Visual Media

- [ ] **6.7" Display (iPhone 16 Pro Max / 15 Pro Max):** 1290 x 2796 px (minimum 3, up to 10 screenshots).
- [ ] **6.5" Display (iPhone 11 Pro Max / XS Max):** 1242 x 2688 px (minimum 3, up to 10 screenshots).
- [ ] **5.5" Display (iPhone 8 Plus):** Optional (required if supporting legacy 5.5" screen sizes).
- [ ] **iPad Screenshots:** Not required since `supportsTablet: false` in `app.json`.

---

## 4. App Privacy Nutrition Labels (App Store Connect Questionnaire)

- [ ] **Contact Info:**
  - Name, Email Address, Phone Number (linked to user identity for account management and appointment confirmation).
- [ ] **Location:**
  - Precise and Coarse Location (used for salon discovery; not used for tracking across other apps).
- [ ] **User Content:**
  - Photos/Videos (only when users or salon owners upload salon portfolios or profile images).
- [ ] **Identifiers:**
  - Device ID (used for push notifications via Expo Push Gateway).
- [ ] **Tracking Transparency:** Glamora does **NOT** track users across third-party apps or websites for targeted advertising. (No IDFA requested).

---

## 5. App Review Notes & Demo Credentials

Under **App Review Information**, provide:
- **Sign-In Required:** Checked.
- **Customer Demo Account:**
  - Username: `customer.demo@glamora.app`
  - Password: `Password123!`
- **Salon Owner Demo Account:**
  - Username: `owner.demo@glamora.app`
  - Password: `Password123!`
- **Notes for App Reviewer:**
  > "Glamora connects customers with boutique salons and spas. Customer Mode is active upon login. To test Salon Owner Mode, log in with the Salon Owner credentials and select 'Switch to Salon Owner Mode' from the Profile tab. Push notifications inform customers of booking updates and schedule changes. All camera and photo permissions are used strictly for salon listing imagery and profile avatars."

---

## 6. TestFlight Distribution Track

Before full public release submission, distribute via TestFlight:
1. Run:
   ```bash
   cd Galmora
   eas build --platform ios --profile production --auto-submit
   ```
2. Once the build finishes processing in App Store Connect:
   - Add Internal Testing group (team members get instant access).
   - Add External Testing group (requires brief automated Beta App Review).
3. Test push notifications, booking flow, and hardware Keychain persistence on a physical iPhone.

