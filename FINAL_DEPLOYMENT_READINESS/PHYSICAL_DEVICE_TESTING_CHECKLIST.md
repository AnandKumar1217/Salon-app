# GLAMORA — PHYSICAL DEVICE TESTING CHECKLIST

**Platform Target:** Physical Android Smartphone & Physical Apple iPhone  
**Status:** **NOT VERIFIED ON PHYSICAL HARDWARE (SIMULATOR & UNIT TEST PASS)**  
**Network Reachability Address:** `http://10.142.53.27:3001` (Workstation LAN IP)

---

## 1. Prerequisites for Physical Testing

Because physical phones cannot access `http://localhost:3001` directly:
1. Ensure the testing phone and development computer are connected to the **SAME Wi-Fi network**.
2. Verify workstation LAN IP `10.142.53.27` is accessible from the phone browser by opening:
   `http://10.142.53.27:3001/api/health`
3. Verify `Galmora/.env` contains:
   ```env
   EXPO_PUBLIC_BACKEND_API_URL=http://10.142.53.27:3001
   EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK=false
   ```

---

## 2. Android Physical Device Testing Matrix

Generate the standalone preview APK via EAS:
```bash
cd Galmora
eas build --platform android --profile preview
```
Download and install the APK directly on your Android phone.

| Test ID | Test Case | Expected Behavior | Physical Pass/Fail |
| :--- | :--- | :--- | :--- |
| **AND-01** | App Installation & Launch | App installs without Play Protect warnings and splash screen smoothly transitions to onboarding. | [ ] PASS  [ ] FAIL |
| **AND-02** | Vector Icons & Typography | All Ionicons (navigation tabs, search, heart icons) render crisply without missing glyph boxes. | [ ] PASS  [ ] FAIL |
| **AND-03** | Location Permission Dialog | App requests "While using the app" permission; nearby salons populate based on GPS. | [ ] PASS  [ ] FAIL |
| **AND-04** | Notification Permission | Android 13+ native permission prompt appears; granting permission registers push token with backend. | [ ] PASS  [ ] FAIL |
| **AND-05** | Customer Auth & Keystore | Register new customer; restart app and verify session is restored from Android Keystore. | [ ] PASS  [ ] FAIL |
| **AND-06** | Real-Time Slot Booking | Select service, pick slot, confirm booking; verify booking appears in database and confirmation banner shows. | [ ] PASS  [ ] FAIL |
| **AND-07** | Push Notification Reception | Complete or cancel the booking on admin panel; verify notification arrives in phone status bar with sound. | [ ] PASS  [ ] FAIL |
| **AND-08** | Salon Owner Application | Fill out salon owner form; submit and verify state shows "Pending Admin Review". | [ ] PASS  [ ] FAIL |
| **AND-09** | Salon Owner Mode Unlock | Approve salon in Admin Panel; restart or pull-to-refresh mobile app; verify Owner Mode unlocks. | [ ] PASS  [ ] FAIL |

---

## 3. iOS Physical Device Testing Matrix

Install via Apple TestFlight:
```bash
cd Galmora
eas build --platform ios --profile production --auto-submit
```

| Test ID | Test Case | Expected Behavior | Physical Pass/Fail |
| :--- | :--- | :--- | :--- |
| **IOS-01** | TestFlight Installation | App installs smoothly from TestFlight; launch screen renders `#FAF7F2` ivory background. | [ ] PASS  [ ] FAIL |
| **IOS-02** | Camera & Photo Library | Salon owner profile photo upload triggers customized `NSPhotoLibraryUsageDescription` prompt. | [ ] PASS  [ ] FAIL |
| **IOS-03** | Location Permission | Native iOS Location prompt appears; nearby distance calculations reflect actual GPS position. | [ ] PASS  [ ] FAIL |
| **IOS-04** | Push Notifications (APNs) | Native iOS notification permission banner appears; Expo Push Token is generated and stored. | [ ] PASS  [ ] FAIL |
| **IOS-05** | iOS Keychain Persistence | Close app completely (kill from app switcher); relaunch; verify user remains authenticated. | [ ] PASS  [ ] FAIL |
| **IOS-06** | Deep Link Execution | Tap `glamora://salon/salon_001` from Notes or Safari; verify app opens directly to salon view. | [ ] PASS  [ ] FAIL |
| **IOS-07** | WhatsApp Concierge Handoff | Tap "Chat on WhatsApp"; verify native WhatsApp app opens with pre-filled message. | [ ] PASS  [ ] FAIL |

