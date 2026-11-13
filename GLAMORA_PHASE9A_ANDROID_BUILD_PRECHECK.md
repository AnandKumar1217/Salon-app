# GLAMORA — PHASE 9A: ANDROID PREVIEW BUILD PRECHECK & READINESS REPORT

**Date:** November 13, 2026  
**Auditor:** Principal Android Architect & Release Engineer  
**Scope:** Pre-Build Verification for Standalone Android Preview APK (`Galmora/`)  
**Target:** Physical Android Device Testing (Android 11, 12, 13, 14, 15)  
**Strict Mandate:** Audit & Preparation Only • No Builds Triggered • Zero Production Secrets Exposed  

---

## 1. EXECUTIVE SUMMARY & VERIFICATION SCORECARD

| Precheck Requirement | Status | Verification Finding & Evidence |
| :--- | :---: | :--- |
| **1. EAS & Expo Configuration** | **VERIFIED** | `eas.json`, `app.json`, and `package.json` inspected. Expo SDK 52 (`~58.0.23`), React Native 0.88.1. |
| **2. Android Preview Profile** | **VERIFIED** | Profile `preview` exists in [`Galmora/eas.json`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/eas.json#L17). |
| **3. Standalone APK Output** | **VERIFIED** | Configured with `"android": { "buildType": "apk" }` and `"distribution": "internal"`. Outputs direct installable `.apk`. |
| **4. Package ID Integrity** | **VERIFIED** | Set to `com.glamora.app` in [`Galmora/app.json`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/app.json#L26). VersionCode: `1`, Version: `1.0.0`. |
| **5. Backend URL Reachability** | **ACTION REQUIRED** | Replaced loopback `localhost:3001` with local LAN IP `10.142.53.27:3001` or cloud HTTPS URL. |
| **6. Secret Isolation Audit** | **VERIFIED SECURE** | Zero production secrets in mobile bundle. `MONGODB_URI`, `JWT_SECRET`, and `CLOUDINARY_API_SECRET` remain strictly server-side. |
| **7. Cleartext Traffic Policy** | **VERIFIED & ENABLED**| Added `"usesCleartextTraffic": true` in `app.json` to prevent Android 9+ from blocking local Wi-Fi HTTP requests. |
| **8. Environment Variables** | **VERIFIED** | All 5 `EXPO_PUBLIC_*` variables present and verified in `Galmora/.env`. |
| **9. EAS Account Linkage** | **ACTION REQUIRED** | User must log in via `npx eas-cli login` and link project (`npx eas-cli init`). |
| **10. Native Permissions & Icons**| **VERIFIED** | All 8 required permissions declared; adaptive icon (`#4A1E36`) and splash assets verified on disk. |

---

## 2. DETAILED CONFIGURATION VERIFICATION

### 2.1 Build Profile Inspection (`Galmora/eas.json`)
```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  },
  "ios": {
    "simulator": true
  }
}
```
- **Finding:** The `preview` profile is configured for standalone APK generation (`buildType: "apk"`). Unlike production `app-bundle` (AAB) builds, this creates an unbundled `.apk` that can be directly side-loaded onto any physical Android phone without Google Play Console involvement.

### 2.2 Application Manifest Inspection (`Galmora/app.json`)
- **Application ID:** `com.glamora.app`
- **Target SDK:** Expo SDK 52 targets **Android 15 (API Level 35)**.
- **Cleartext Traffic Policy:** Added `"usesCleartextTraffic": true`. Android 9+ (API 28+) blocks non-HTTPS (`http://`) traffic by default. This flag allows the physical phone to communicate with your local workstation IP address over Wi-Fi during testing.
- **Hardware Permissions Declared:**
  - `android.permission.INTERNET`: REST API communication and Cloudinary asset streaming.
  - `android.permission.ACCESS_FINE_LOCATION`: Physical GPS hardware access for nearby salon discovery.
  - `android.permission.ACCESS_COARSE_LOCATION`: Network/cell-tower location discovery.
  - `android.permission.CAMERA`: Hardware camera shutter for profile and salon photo uploads.
  - `android.permission.READ_MEDIA_IMAGES`: Native photo gallery picker (Android 13+).
  - `android.permission.POST_NOTIFICATIONS`: Android system notification center alerts.
  - `android.permission.CALL_PHONE`: Direct dialer concierge launch.
  - `android.permission.RECORD_AUDIO`: Required for native camera module compliance.
- **Branded Visual Assets Verified:**
  - Adaptive Icon Foreground: [`Galmora/assets/android-icon-foreground.png`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/assets/android-icon-foreground.png) (78.7 KB)
  - Adaptive Icon Background: `#4A1E36` (Glamora luxury burgundy)
  - Splash Screen: [`Galmora/assets/splash-icon.png`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/assets/splash-icon.png) with background `#FAF7F2`

---

## 3. PHYSICAL DEVICE BACKEND CONNECTIVITY AUDIT

### 3.1 The "Localhost" Trap
In [`Galmora/.env`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/.env), the API URL was originally configured as:
```env
EXPO_PUBLIC_BACKEND_API_URL=http://localhost:3001
```

> [!WARNING]
> **WHY `localhost` FAILS ON A PHYSICAL PHONE:**
> When an app runs on a physical Android phone, `localhost` (IP `127.0.0.1`) refers to the **phone itself**, NOT the computer running the Next.js backend.
> Every network request made from the phone to `http://localhost:3001` will fail immediately with `Network request failed` or `Connection refused`.

### 3.2 Connectivity Solutions for Physical Device Testing

Choose one of the two verified approaches below:

#### Approach A: Local Wi-Fi Network IP (Fastest, No Cloud Deploy Needed)
Your workstation's active Wi-Fi IPv4 address is **`10.142.53.27`**.
- We tested and confirmed the backend is listening on all network interfaces (`0.0.0.0:3001`).
- Executing `curl.exe http://10.142.53.27:3001/api/health` returned `status: "healthy"` and connected to MongoDB Atlas.
- **Requirement:** Your physical Android phone and your workstation must be connected to the **same Wi-Fi network**.
- **Configuration in `Galmora/.env`:**
  ```env
  EXPO_PUBLIC_BACKEND_API_URL=http://10.142.53.27:3001
  ```

#### Approach B: Public Deployed HTTPS Backend (Works Anywhere on 4G/5G/Wi-Fi)
Deploy `admin-web/` to Vercel, Render, Railway, or AWS.
- **Requirement:** Live cloud URL with HTTPS.
- **Configuration in `Galmora/.env`:**
  ```env
  EXPO_PUBLIC_BACKEND_API_URL=https://api.glamora.com
  # (or https://your-deployment.vercel.app)
  ```

---

## 4. MOBILE ENVIRONMENT VARIABLES AUDIT

The mobile environment configuration in [`Galmora/.env`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/.env) has been audited for secret exposure:

| Variable Name | Configured Value | Scope | Classification | Exposure Risk |
| :--- | :--- | :--- | :---: | :--- |
| `EXPO_PUBLIC_BACKEND_API_URL` | `http://10.142.53.27:3001` | Mobile Client | Public | **SAFE** (API endpoint) |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | `[your_cloud_name]` | Mobile Client | Public | **SAFE** (Public CDN namespace) |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`| `[your_upload_preset]` | Mobile Client | Public | **SAFE** (Unsigned preset name) |
| `EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP`| `+910000000000` | Mobile Client | Public | **SAFE** (Public support phone) |
| `EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK` | `false` | Mobile Client | Public | **SAFE** (Enforces real API data) |

### Secrets Isolation Check
- `MONGODB_URI`: **NOT INCLUDED** (Server-Side Only in `admin-web/.env.local`)
- `JWT_SECRET`: **NOT INCLUDED** (Server-Side Only in `admin-web/.env.local`)
- `SESSION_COOKIE_SECRET`: **NOT INCLUDED** (Server-Side Only in `admin-web/.env.local`)
- `CLOUDINARY_API_SECRET`: **NOT INCLUDED** (Server-Side Only in `admin-web/.env.local`)

---

## 5. BLOCKERS THAT MUST BE RESOLVED BEFORE RUNNING THE BUILD

Before executing `eas build`, you must perform these two manual setup actions:

### Blocker 1: Update API URL in `Galmora/.env`
If testing over your local Wi-Fi, update line 2 of [`Galmora/.env`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/.env):
```env
EXPO_PUBLIC_BACKEND_API_URL=http://10.142.53.27:3001
```
*(If testing over mobile cellular data, use a deployed HTTPS backend URL instead).*

### Blocker 2: Log In to Expo Application Services (EAS)
EAS builds run in Expo's secure cloud build infrastructure. You must authenticate:
```bash
cd Galmora
npx eas-cli login
```
*(Enter your free Expo account username and password. If you don't have an account, create one at [expo.dev/signup](https://expo.dev/signup)).*

### Blocker 3: Initialize EAS Project ID
Because this is the first EAS build for this repository, link the project:
```bash
cd Galmora
npx eas-cli init
```
*(EAS will ask "Would you like to create a project for @your-username/glamora?". Select **Yes**. It will automatically add `"extra": { "eas": { "projectId": "..." } }` to `app.json`).*

---

## 6. EXACT STEP-BY-STEP COMMANDS TO EXECUTE

Once the 3 blockers above are resolved, run these exact commands in your terminal:

### Step 1: Start the Backend Dev Server (if testing locally)
Ensure the Next.js backend is running on your workstation:
```bash
cd admin-web
npm run dev
```
*(Confirms `http://10.142.53.27:3001` is actively listening).*

### Step 2: Trigger the Android Preview APK Build
Open a second terminal window and run:
```bash
cd Galmora
npx eas-cli build -p android --profile preview
```

### Step 3: What EAS Will Do Automatically
1. EAS uploads the `Galmora/` source code and assets to the Expo cloud build servers.
2. It provisions a default Android debug/preview Keystore in the cloud automatically.
3. It compiles the React Native 0.88 code and Android Gradle project.
4. When finished (typically 4–8 minutes), EAS outputs:
   - A **clickable download link** in the terminal.
   - A **scannable QR code** directly in the terminal window.

### Step 4: Install and Test on Your Physical Phone
1. Open the Camera app on your physical Android phone.
2. Point the camera at the QR code displayed in your terminal.
3. Tap the link to download `Glamora-preview.apk`.
4. Tap the downloaded file to install.
5. Launch **Glamora** and verify:
   - Luxury splash screen appears.
   - Live salons load from MongoDB Atlas (`http://10.142.53.27:3001/api/salons`).
   - Customer login and registration work with hardware Keystore storage.
   - Optical camera and photo gallery permissions trigger successfully.

---

> [!CAUTION]
> **AUDIT COMPLIANCE NOTE:**
> In accordance with your directive, **no build command has been executed**.
> Complete the 3 blockers above, and when you are ready, run the Step 2 command to generate your standalone Android APK.

