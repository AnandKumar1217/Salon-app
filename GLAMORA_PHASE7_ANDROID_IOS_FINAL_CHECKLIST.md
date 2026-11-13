# GLAMORA — PHASE 7: ANDROID & iOS FINAL STORE RELEASE CHECKLIST

**Date:** November 13, 2026  
**Auditor:** Principal Mobile Release Engineer & Store Submission Specialist  
**Application Name:** Glamora  
**Package / Bundle ID:** `com.glamora.app` (Identical on both Android & iOS)  
**Version:** `1.0.0` (Android VersionCode: `1`, iOS Build: `"1"`)  

---

## 1. ANDROID RELEASE READINESS AUDIT (`com.glamora.app`)

### 1.1 Manifest & Native Hardware Configuration
- **Application ID:** `com.glamora.app` verified in [`Galmora/app.json`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/app.json#L20).
- **Target SDK Level:** Expo SDK 52 targets **Android 15 (API Level 35)**, satisfying Google Play's requirement that all new apps target API Level 34+.
- **Adaptive App Icons:**
  - Foreground: `./assets/android-icon-foreground.png` (Glamora luxury 'G' monogram).
  - Background Color: `#4A1E36` (Glamora signature luxury burgundy).
- **Splash Screen:** Background `#FAF7F2` with centered logo (`./assets/splash-icon.png`).
- **Encrypted Credential Storage:** Verified `expo-secure-store` utilizing the Android Keystore Provider (hardware-backed AES-GCM 256-bit encryption).

### 1.2 Permissions Declared & User-Facing Justifications
| Permission Name | Justification for Google Play Review |
| :--- | :--- |
| `android.permission.INTERNET` | Communicate with central Next.js REST API and download salon assets from Cloudinary. |
| `android.permission.ACCESS_FINE_LOCATION` | Detect user location to recommend nearest verified salons and spas. |
| `android.permission.ACCESS_COARSE_LOCATION` | Approximate neighborhood-level salon discovery. |
| `android.permission.CAMERA` | Enable salon owners to capture facility pictures and customers to upload avatars. |
| `android.permission.READ_MEDIA_IMAGES` | Select cover photos and gallery images on Android 13+. |
| `android.permission.POST_NOTIFICATIONS` | Send appointment reminders and booking status updates on Android 13+. |
| `android.permission.CALL_PHONE` | Direct one-touch phone concierge calling from salon detail screen. |

### 1.3 Google Play Console Submission Checklist
- [x] Application ID `com.glamora.app` configured in `app.json`.
- [x] Production build profile `app-bundle` (AAB) configured in `eas.json`.
- [x] In-app Privacy Policy screen present (`CustomerPrivacyScreen`).
- [x] In-app Terms of Service screen present (`CustomerTermsScreen`).
- [x] Support contact present (`support@glamora.com` / WhatsApp concierge).
- [ ] **Pending Owner Action:** Create app listing on Google Play Console ($25 one-time registration).
- [ ] **Pending Owner Action:** Complete Google Play Data Safety Questionnaire (declare location, photos, user ID; declare tokens are encrypted in transit via HTTPS and at rest via Keystore).
- [ ] **Pending Owner Action:** Supply `google-service-account.json` or run interactive build in EAS CLI.

---

## 2. iOS RELEASE READINESS AUDIT (`com.glamora.app`)

### 2.1 Manifest & Apple App Store Guidelines Compliance
- **Bundle Identifier:** `com.glamora.app` verified in [`Galmora/app.json`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/app.json#L17).
- **Build Number:** `"1"`.
- **Target Device Family:** iPhone (`supportsTablet: false`).
- **Encrypted Credential Storage:** Verified `expo-secure-store` utilizing the **iOS Keychain Services** framework (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`).
- **Safe-Area Inset Handling:** Dynamic safe area padding implemented in [`BottomTabNavigator.tsx`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/src/navigation/BottomTabNavigator.tsx) and [`OwnerTabNavigator.tsx`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/src/navigation/OwnerTabNavigator.tsx) (`height: 80, paddingBottom: 24`), preventing overlapping with the iOS Home Indicator bar across iPhone 14/15/16 Dynamic Island screens.

### 2.2 Info.plist Mandatory Permission Justifications (Human Interface Guidelines)
| Key | Apple Human Interface Justification String |
| :--- | :--- |
| `NSCameraUsageDescription` | *"Allow Glamora to use your camera to take salon and profile photos."* |
| `NSPhotoLibraryUsageDescription` | *"Allow Glamora to access your photos to set salon logos, cover pictures, and profile photos."* |
| `NSLocationWhenInUseUsageDescription` | *"Glamora uses your location to discover premier salons and spas nearby."* |

### 2.3 Apple App Store Submission Checklist
- [x] Bundle identifier `com.glamora.app` matches Android package ID.
- [x] All 3 required `Info.plist` usage descriptions configured in `app.json`.
- [x] Production iOS build profile configured in `eas.json`.
- [x] Zero third-party ad tracking SDKs installed (no App Tracking Transparency prompt required).
- [x] Zero in-app digital purchases (physical appointments in salons are exempt from Apple 30% IAP commission under Apple App Store Review Guideline 3.1.5).
- [ ] **Pending Owner Action:** Enroll in Apple Developer Program ($99/year).
- [ ] **Pending Owner Action:** Create Glamora App Record in App Store Connect.
- [ ] **Pending Owner Action:** Execute cloud EAS build to provision distribution certificates and provisioning profile.

---

## 3. EAS BUILD CONFIGURATION (`Galmora/eas.json`)

The EAS build profiles are fully configured for both Android and iOS in [`Galmora/eas.json`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/eas.json):

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": true }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {}
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 4. PRODUCTION BUILD COMMANDS

When the owner provides Google Play and Apple Developer accounts, trigger builds with:

### Android Production App Bundle (Google Play):
```bash
cd Galmora
npx eas-cli build -p android --profile production
```
*(Outputs signed `.aab` file ready for direct upload to Google Play Internal/Production track).*

### Android Standalone APK (Immediate Physical Device Testing):
```bash
cd Galmora
npx eas-cli build -p android --profile preview
```
*(Outputs installable `.apk` file that can be downloaded to any Android device immediately via QR code).*

### iOS Production IPA (TestFlight & App Store):
```bash
cd Galmora
npx eas-cli build -p ios --profile production
```
*(EAS cloud automates signing, provisions certificate, and uploads build directly to Apple TestFlight).*

