# GLAMORA — MANUAL ACTIONS REQUIRED PRIOR TO STORE SUBMISSION

**Audit Date:** November 2026  
**Status:** **CRITICAL ACTION ITEMS FOR PLATFORM OWNER**

Before initiating production store publishing or physical device test builds, complete the following manual configuration tasks.

---

## Priority 1: MongoDB Atlas Network Access (IP Whitelist)

### The Issue:
When connecting to your MongoDB Atlas cluster (`cluster0.lvrwitr.mongodb.net`) from your current workstation network, MongoDB Atlas firewall rejects the TLS connection handshake with:
```
SSL alert number 80: tlsv1 alert internal error
```
This occurs because your current workstation public IP is **`110.225.36.74`**, and it is not currently permitted in the Atlas Network Access list.

### Required Action:
1. Log in to your [MongoDB Atlas Console](https://cloud.mongodb.com).
2. In the left navigation, click **Network Access** (under Security).
3. Click the green **+ Add IP Address** button.
4. Choose one of the following:
   - **For Local Development & Testing:** Click **Add Current IP Address** (adds `110.225.36.74`).
   - **For Cloud Staging & EAS Testing:** Enter `0.0.0.0/0` (Allow Access from Anywhere) with a descriptive label like "Universal Staging Access".
5. Click **Confirm** and wait ~1 minute for Atlas to apply changes.

---

## Priority 2: Initialize EAS Project & Link Account

### The Issue:
To build standalone APKs or iOS TestFlight IPAs using Expo Application Services (EAS), the project must be linked to your Expo account.

### Required Action:
Open terminal in `Galmora/` and execute:
```bash
cd Galmora
npx eas-cli login
npx eas-cli project:init
```
Follow the interactive prompt to link or create the project under your Expo account.

---

## Priority 3: Create Cloudinary Unsigned Upload Preset

### The Issue:
For mobile clients to upload salon photos and profile avatars directly to Cloudinary without exposing backend API secrets, an unsigned upload preset is required.

### Required Action:
1. Log in to [Cloudinary Console](https://cloudinary.com/console).
2. Go to **Settings (Gear Icon) -> Upload -> Upload presets**.
3. Click **Add upload preset**.
4. Set **Preset name:** `glamora_mobile_uploads`.
5. Set **Signing Mode:** `Unsigned`.
6. Set **Folder:** `glamora_app`.
7. Click **Save**.

---

## Priority 4: Deploy Central REST API to Cloud Hosting

### The Issue:
For physical phones outside your local Wi-Fi to use the app, the Next.js API in `admin-web/` must be hosted on a public HTTPS server (e.g. Vercel, Railway, Render, or AWS).

### Required Action:
1. Deploy `admin-web/` to Vercel or Railway:
   - Root Directory: `admin-web`
   - Build Command: `npm run build`
   - Start Command: `npm start`
2. Add all environment variables from `admin-web/.env.local`:
   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `JWT_SECRET`
   - `SESSION_COOKIE_SECRET`
   - `NEXT_PUBLIC_USE_MOCK_FALLBACK=false`
3. Update `Galmora/.env` with your new production backend URL:
   ```env
   EXPO_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com
   ```

---

## Priority 5: Google Play Developer Console Setup

1. Register at [Google Play Console](https://play.google.com/console) ($25 fee).
2. Create App entry: **Glamora**.
3. Complete the **Closed Testing Track** requirements (20 testers for 14 continuous days).
4. Fill in the Data Safety form and Store Listing details as outlined in [GOOGLE_PLAY_SUBMISSION_CHECKLIST.md](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/FINAL_DEPLOYMENT_READINESS/GOOGLE_PLAY_SUBMISSION_CHECKLIST.md).

---

## Priority 6: Apple Developer Program Enrollment

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year).
2. Create App ID `com.glamora.app` in Apple Developer Portal.
3. Create App record in [App Store Connect](https://appstoreconnect.apple.com).
4. Run `eas build --platform ios --profile production` to upload your first TestFlight build.

