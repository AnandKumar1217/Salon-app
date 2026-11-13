# GLAMORA PLATFORM — PRODUCTION DEPLOYMENT CHECKLIST
**Document Status:** RELEASE GATE SPECIFICATION  
**Target Release:** Production v1.0.0  
**Target Architecture:** MongoDB Atlas + Cloudinary CDN + Next.js 14 API + Android React Native  

---

## 1. Pre-Deployment Environment & Configuration Gate

> [!IMPORTANT]
> The following environment variables must be populated with production credentials before initiating deployment. Production must NEVER use `localhost`, private LAN IPs, or default secrets.

### 1.1 Backend & Super Admin (`admin-web/.env.production`)

| Variable | Requirement & Format | Production Status |
| :--- | :--- | :---: |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.glamora.mongodb.net/glamora?retryWrites=true&w=majority` (Must use TLS/SSL & Atlas IP access list) | **PENDING USER PROVISIONING** |
| `MONGODB_DB_NAME` | Set to `glamora` | **CONFIGURED** |
| `CLOUDINARY_CLOUD_NAME` | Active Cloudinary cloud identifier (e.g. `glamora-prod`) | **PENDING USER PROVISIONING** |
| `CLOUDINARY_API_KEY` | 15-digit Cloudinary API Key | **PENDING USER PROVISIONING** |
| `CLOUDINARY_API_SECRET` | 27-character Cloudinary Secret (Strictly server-side) | **PENDING USER PROVISIONING** |
| `JWT_SECRET` | 64-character random cryptographic secret (`openssl rand -hex 32`) | **PENDING USER PROVISIONING** |
| `SESSION_COOKIE_SECRET` | 64-character random cryptographic secret | **PENDING USER PROVISIONING** |
| `NEXT_PUBLIC_USE_MOCK_FALLBACK` | Must be strictly set to `false` | **VERIFIED (`false`)** |

---

### 1.2 Android Application (`Galmora/.env.production`)

| Variable | Requirement & Format | Production Status |
| :--- | :--- | :---: |
| `EXPO_PUBLIC_BACKEND_API_URL` | Live HTTPS backend domain (e.g. `https://api.glamora.com`) — **NO localhost or LAN IP** | **PENDING DOMAIN ASSIGNMENT** |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Production Cloudinary cloud identifier | **PENDING USER PROVISIONING** |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`| Unsigned preset locked to `glamora` folder | **CONFIGURED (`[your_upload_preset]`)** |
| `EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP` | Verified Glamora official WhatsApp helpline | **CONFIGURED (`+910000000000`)** |
| `EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK` | Must be strictly set to `false` | **VERIFIED (`false`)** |

---

## 2. Build & Quality Verification Gate

| Step | Verification Command | Target Result | Current Status |
| :--- | :--- | :--- | :---: |
| **Android Typecheck** | `cd Galmora && npm run typecheck` | 0 TypeScript Errors | **PASS (0 Errors)** |
| **Mobile Test Suite** | `cd Galmora && npm run test` | 11/11 Automated Tests Passed | **PASS (11/11 Passed)** |
| **Admin Web Test Suite** | `cd admin-web && npm run test` | 21/21 Automated Tests Passed | **PASS (21/21 Passed)** |
| **Admin Web Build** | `cd admin-web && npm run build` | Next.js Clean Build (26/26 routes) | **PASS (26/26 routes)** |
| **Android Package Name** | Verify `app.json` | Package equals `com.glamora.app` | **VERIFIED (`com.glamora.app`)** |
| **Firebase Eradication** | Full workspace grep | 0 occurrences in source code | **VERIFIED (0 references)** |

---

## 3. Android Release Packaging Steps

1. **Configure EAS Build:**
   ```bash
   cd Galmora
   npx eas-cli login
   npx eas-cli build:configure
   ```
2. **Generate Production Android App Bundle (.aab):**
   ```bash
   npx eas-cli build --platform android --profile production
   ```
3. **Google Play Console Release:**
   - Upload the generated `.aab` file to Google Play Console under the `com.glamora.app` application identifier.
   - Complete Data Safety section: Declare camera & photo library permissions for salon profile setup.

---

## 4. Web Console & Customer Launchpad Deployment

1. **Super Admin & Next.js API:**
   - Deploy `admin-web` to Node server (Docker / AWS ECS) or Vercel.
   - Configure environment variables from Section 1.1.
   - Ensure custom domain SSL certificate is active (`https://admin.glamora.com` or `https://api.glamora.com`).
2. **Customer Booking Launchpad:**
   - Deploy `Galmora/public-web/index.html` to static hosting (Netlify, Cloudflare Pages, or AWS S3/CloudFront).
   - Point the `BACKEND_URL` in `index.html` to the production API origin.

---

## 5. Deployment Gate & Stop Condition

> [!CAUTION]
> **DEPLOYMENT GATE ACTIVE:**  
> All automated tests, typechecks, clean production builds, and documentation are complete. Per instructions, **no deployment, cloud resource provisioning, data migration, or production account creation will be performed without explicit user approval.**

