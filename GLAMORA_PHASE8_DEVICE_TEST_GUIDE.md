# GLAMORA — PHASE 8: PHYSICAL DEVICE TEST SUITE & HARDWARE VALIDATION GUIDE

**Date:** November 13, 2026  
**Auditor:** Principal Mobile QA Architect & Native Systems Engineer  
**Scope:** Step-by-Step Hardware Validation Protocol for Physical Android and iOS Devices  
**Precondition:** Code Complete • 0 TypeScript Errors • Real MongoDB Atlas & Cloudinary Connected  

> [!IMPORTANT]
> Automated tests execute within virtualized Node.js and Metro environments. Physical sensors (optical camera sensors, device GPS chipsets, and hardware SecureStore flash memory) must be verified on actual physical hardware. Follow this test protocol before general store release.

---

## 1. ANDROID PHYSICAL HARDWARE TESTING PROTOCOL

### 1.1 Generating and Installing the Test Build (Standalone APK)
You do not need to wait for Google Play Store review to test on a physical Android device. Generate a standalone `.apk` using EAS:

1. In your terminal:
   ```bash
   cd Galmora
   npx eas-cli build -p android --profile preview
   ```
2. When the cloud build finishes, EAS provides a **QR code** in the terminal and a download URL.
3. On your physical Android phone (running Android 11, 12, 13, 14, or 15):
   - Scan the QR code using your phone's camera.
   - Download the `.apk` file (approx. 45–65 MB).
   - Tap to install. (If prompted, allow *"Install unknown apps"* for your browser).

---

### 1.2 Android Hardware & Feature Test Checklist

| Step # | Hardware / Feature | Test Action | Expected Hardware Response | Pass / Fail |
| :---: | :--- | :--- | :--- | :---: |
| **A1** | **Cold App Launch** | Tap the Glamora burgundy app icon from the home screen. | Splash screen displays for ~1.5s with luxury monogram; transitions cleanly to Onboarding/Home. | [ ] |
| **A2** | **Keystore Token Persistence** | Register a new customer; force-kill the app (swipe up in App Switcher); re-open the app. | User remains fully logged in without re-entering credentials (verified via Android Keystore Provider). | [ ] |
| **A3** | **Location Sensor (GPS)** | Navigate to Salon Discovery tab; tap "Use Current Location". | Android OS displays system permission dialog: *"Allow Glamora to access this device's location?"*. Choosing "While using app" auto-populates user's city/neighborhood. | [ ] |
| **A4** | **Camera Hardware Access** | Switch to Salon Owner Mode; tap "Upload Salon Cover Photo" > "Take Photo". | Android OS requests Camera permission; physical camera viewfinder opens; capturing photo saves to Cloudinary. | [ ] |
| **A5** | **Photo Gallery Access** | Tap "Choose from Library". | Opens Android Photo Picker (Android 13+ Photo Picker API); selected image uploads to Cloudinary CDN. | [ ] |
| **A6** | **One-Touch Dial (Call Phone)**| Open any Salon Detail page; tap the Phone/Concierge button. | Launches the native Android Phone dialer with the salon's phone number pre-filled. | [ ] |
| **A7** | **Appointment Booking & Lock** | Book an appointment for a specific specialist at 15:00. | Booking confirmation screen appears; slot is instantly locked in MongoDB Atlas. | [ ] |
| **A8** | **Cancellation & Slot Release** | Cancel the appointment from Appointments List. | Status updates to `CANCELLED`; slot becomes immediately bookable again for other customers. | [ ] |
| **A9** | **Background / Foreground Transition** | Minimize app while on booking screen; lock phone screen; unlock and resume app. | App state is preserved exactly; no white flash or crash. | [ ] |

---

## 2. APPLE iOS PHYSICAL HARDWARE TESTING PROTOCOL (TESTFLIGHT)

### 2.1 Generating and Installing the TestFlight Build
Because local iOS compilation requires macOS Xcode, Windows builds run via EAS Cloud:

1. In your terminal:
   ```bash
   cd Galmora
   npx eas-cli build -p ios --profile production
   ```
2. EAS will prompt you for your Apple ID credentials and automatically provision the distribution certificate and provisioning profile in your Apple Developer account.
3. Once completed, EAS automatically uploads the build to **Apple App Store Connect**.
4. In [App Store Connect](https://appstoreconnect.apple.com):
   - Navigate to **TestFlight**.
   - Add your email address under **Internal Testing**.
5. On your physical iPhone:
   - Install the **TestFlight** app from the App Store.
   - Open the invitation email and tap **"Start Testing"** to install Glamora.

---

### 2.2 iOS Hardware & Feature Test Checklist

| Step # | Hardware / Feature | Test Action | Expected Hardware Response | Pass / Fail |
| :---: | :--- | :--- | :--- | :---: |
| **I1** | **Notch & Dynamic Island Layout** | Open app on iPhone with Dynamic Island (iPhone 14 Pro, 15, 16) or notch. | Header bar respects top status bar; bottom navigation tab bar has 24px safe padding above Home Indicator. | [ ] |
| **I2** | **iOS Keychain Persistence** | Log in as customer; swipe to terminate app completely; reopen. | User session remains intact via `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`. | [ ] |
| **I3** | **iOS Location Permission** | Tap Location button on discovery map. | Apple iOS dialog appears with string: *"Glamora uses your location to discover premier salons and spas nearby."* | [ ] |
| **I4** | **iOS Camera Permission** | Tap Camera icon in Salon Profile. | Apple iOS dialog appears with string: *"Allow Glamora to use your camera to take salon and profile photos."* | [ ] |
| **I5** | **iOS Photo Library Permission**| Tap Photo Library icon. | Apple iOS dialog appears with string: *"Allow Glamora to access your photos to set salon logos, cover pictures, and profile photos."* | [ ] |
| **I6** | **WhatsApp Universal Linking** | Tap "Chat with Salon on WhatsApp". | Seamlessly opens the native iOS WhatsApp app with pre-filled message text. | [ ] |
| **I7** | **Appointment Booking Stream** | Complete booking; verify in Super Admin panel on desktop. | Booking record appears immediately in desktop Super Admin feed with status `CONFIRMED`. | [ ] |
| **I8** | **Memory Pressure Recovery** | Open 5 heavy games/apps to simulate memory pressure; return to Glamora. | Glamora rehydrates session gracefully from Keychain. | [ ] |

---

## 3. TEST LOG SUBMISSION TEMPLATE

Testers should record their device results using this format:

```text
================================================================
GLAMORA PHYSICAL DEVICE TEST EXECUTION LOG
Tester Name: _______________________
Device Model: [e.g. Samsung Galaxy S23 / iPhone 15 Pro]
OS Version: [e.g. Android 14 (OneUI 6) / iOS 17.5]
Network: [e.g. 5G Airtel / Home Wi-Fi]

Hardware Checks:
[PASS/FAIL] Cold Launch & Monogram Splash
[PASS/FAIL] Keystore / Keychain Persistence
[PASS/FAIL] GPS Location & Salon Discovery
[PASS/FAIL] Camera Capture & Cloudinary Upload
[PASS/FAIL] Gallery Selection & Upload
[PASS/FAIL] Native Dialer & WhatsApp Handoff
[PASS/FAIL] Booking Concurrency & Slot Release
[PASS/FAIL] Background / Lock Screen Resumption

Defects Observed (if any):
1. ___________________________________________________________
2. ___________________________________________________________
================================================================
```

