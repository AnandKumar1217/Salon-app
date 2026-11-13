# GLAMORA — ANDROID RELEASE READINESS REPORT

**Platform:** Android (`com.glamora.app`)  
**Target SDK:** Android 14 / 15 (API 34+)  
**Framework:** React Native 0.88.1 / Expo SDK ~58.0.25  
**Version:** 1.0.0 (versionCode: 1)  
**Readiness Verdict:** **READY FOR PREVIEW & PRODUCTION BUILD**

---

## 1. Expo Doctor & Dependency Verification

An empirical audit of the Android project dependencies was executed using official tooling:

```bash
cd Galmora
npx expo-doctor
```

**Result:**
```
Running 20 checks on your project...
20/20 checks passed. No issues detected!
```

### Critical Native Dependency Audit:
1. **`expo-font` (@~58.0.0):** Explicitly installed and registered in `package.json` and `app.json`. Eliminates the fatal crash risk in standalone Android APK/AAB where `@expo/vector-icons` Ionicons fail to load glyphs outside Expo Go.
2. **`expo-splash-screen` (@~58.0.14):** Installed and configured in the `plugins` array of `app.json`, resolving the SDK 58 schema deprecation of top-level `splash`.
3. **`expo-notifications` (@~58.1.9):** Correctly installed and configured with the notification icon and branding color `#4A1E36`.
4. **`expo-device` (@~58.0.0):** Installed to accurately distinguish physical devices from emulators for push token acquisition.
5. **`expo-secure-store` (@~58.0.3):** Verified hardware-backed Android Keystore integration for JWT auth tokens.

---

## 2. Android Manifest & Permissions (`app.json`)

All required Android permissions are declared explicitly in `Galmora/app.json`:

```json
"permissions": [
  "android.permission.INTERNET",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.CALL_PHONE",
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.CAMERA"
]
```

### Permission Justifications for Google Play Review:
- **`POST_NOTIFICATIONS`:** Mandatory on Android 13+ (API 33+) to alert customers of appointment confirmations, schedule changes, delays, and owner alerts.
- **`ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION`:** Required to discover salons and spas in the user's immediate vicinity and display distance estimates.
- **`CAMERA` & `READ_MEDIA_IMAGES`:** Required for salon owners to upload business facade covers, interior photos, and treatment showcase images, and for customers to customize avatars.
- **`CALL_PHONE`:** Enables direct one-tap dialing to the salon receptionist from the appointment screen.
- **`INTERNET`:** Communicates with the Glamora Next.js central REST API and MongoDB Atlas.

---

## 3. Deep Linking & App Links (Intent Filters)

The application registers two intent filters in `app.json`:
1. **Custom Scheme:** `glamora://` (internal app-to-app routing).
2. **Verified App Link:** `https://glamora.example/salon/*` with `autoVerify: true` (navigates web visitors directly into the native salon profile view if installed).

---

## 4. Visual Assets & Branding Audit

All required graphic assets are present and validated in `Galmora/assets`:
- **App Icon:** `./assets/icon.png` (1024x1024 px master icon).
- **Adaptive Icon Foreground:** `./assets/android-icon-foreground.png` (transparent background).
- **Adaptive Icon Background:** Hex `#4A1E36` (Glamora signature luxury burgundy).
- **Notification Icon:** `./assets/splash-icon.png` (tinted white with `#4A1E36` accent color).
- **Splash Screen:** Handled by `expo-splash-screen` with `#FAF7F2` warm ivory background and `./assets/splash-icon.png` centered.

---

## 5. EAS Build Profiles (`eas.json`)

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Execution Commands:

#### To generate installable standalone APK for physical device testing:
```bash
cd Galmora
eas build --platform android --profile preview
```

#### To generate production Android App Bundle (.aab) for Google Play Console:
```bash
cd Galmora
eas build --platform android --profile production
```

---

## 6. Pre-Build Release Blockers & Status

| Check | Status | Resolution |
| :--- | :--- | :--- |
| Zero Firebase in Android | **CLEAN** | No Firebase SDKs, no google-services.json dependencies in mobile client. |
| Zero Mock Data in Production | **CLEAN** | Production mode defaults to unauthenticated clean state. |
| Vector Icons Standalone Stability | **CLEAN** | `expo-font` verified. |
| Notification Channel Configuration | **CLEAN** | High-priority `glamora-default` notification channel created with sound & vibration. |
| Physical Hardware Verification | **PENDING** | Build APK using `eas build` and test on physical Android device. |

