# GLAMORA — iOS RELEASE READINESS REPORT

**Platform:** Apple iOS (`com.glamora.app`)  
**Target iOS Version:** iOS 15.1+  
**Framework:** React Native 0.88.1 / Expo SDK ~58.0.25  
**Version:** 1.0.0 (buildNumber: "1")  
**Readiness Verdict:** **READY FOR TESTFLIGHT & SIMULATOR BUILD**

---

## 1. Apple App Store Configuration (`app.json`)

The iOS bundle configuration is fully specified in `Galmora/app.json`:

```json
"ios": {
  "supportsTablet": false,
  "bundleIdentifier": "com.glamora.app",
  "buildNumber": "1",
  "infoPlist": {
    "NSCameraUsageDescription": "Allow Glamora to use your camera to take salon and profile photos.",
    "NSPhotoLibraryUsageDescription": "Allow Glamora to access your photos to set salon logos, cover pictures, and profile photos.",
    "NSLocationWhenInUseUsageDescription": "Glamora uses your location to discover premier salons and spas nearby."
  }
}
```

### Key Verification Highlights:
- **Device Support:** `supportsTablet: false`. The application UI is optimized exclusively for iPhone portrait orientation.
- **Privacy Strings:** Mandatory `NS*UsageDescription` keys are clearly formulated with user-centric explanations, satisfying Apple App Store Review Guideline 5.1.1 (Data Collection and Storage).

---

## 2. Secure Credential Storage (iOS Keychain)

- **Library:** `expo-secure-store` (@~58.0.3).
- **Security Policy:** All JWT session tokens are stored using `keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK`.
- **Memory Protection:** Sensitive keys and tokens are excluded from persistent unencrypted storage (`AsyncStorage`). On logout, tokens are wiped from Keychain immediately.

---

## 3. Push Notifications & APNs Integration

- **Architecture:** Zero Firebase Cloud Messaging on iOS.
- **Delivery Gateway:** Managed Expo Push Gateway converts standard JSON notifications into Apple Push Notification service (APNs) payloads over HTTP/2.
- **Foreground Display:** Configured via `Notifications.setNotificationHandler` to show banners, sound alerts, and update app badge counters when the app is active.
- **Credentials Setup:** EAS Build automatically creates and manages Apple APNs keys (`.p8` auth keys) linked to the Apple Developer Account when building with `eas build --platform ios`.

---

## 4. Visual Assets & Icon Specifications

- **Master App Icon:** `./assets/icon.png` (1024x1024 px without alpha/transparency, satisfying Apple App Store requirements).
- **Splash Screen:** Governed by `expo-splash-screen` with `#FAF7F2` warm ivory background and `./assets/splash-icon.png` centered.

---

## 5. EAS Build Profiles for iOS (`eas.json`)

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {}
    }
  }
}
```

### Execution Commands:

#### To generate an iOS Simulator build (`.tar.gz` for macOS Xcode Simulator):
```bash
cd Galmora
eas build --platform ios --profile preview
```

#### To generate a production IPA and submit directly to Apple TestFlight:
```bash
cd Galmora
eas build --platform ios --profile production --auto-submit
```

---

## 6. Pre-Submission Checklist & Requirements

| Item | Requirement | Status |
| :--- | :--- | :--- |
| **Apple Developer Account** | Active Organization or Individual account ($99/year) | Developer Action Required |
| **App Store Connect Record** | App created with Bundle ID `com.glamora.app` | Developer Action Required |
| **EAS Credentials** | Apple Team ID & Distribution Certificate managed by EAS | Automated via `eas build` |
| **App Privacy Details** | Privacy questionnaire in App Store Connect completed | Formulated in Report 8 |
| **Review Credentials** | Demo customer and salon owner accounts created | Available in DB |

