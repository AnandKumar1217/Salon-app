# GLAMORA — PHASE 7: MANUAL ACTION GUIDE FOR THE OWNER

**Date:** November 13, 2026  
**Auditor:** Principal Software Architect & DevOps Lead  
**Scope:** Actionable Step-by-Step Instructions for the Business Owner to Launch Glamora to the Public  

> [!IMPORTANT]
> The engineering team has completed all code auditing, security hardening, multi-tenant concurrency protection, test suite validation (85/85 tests passed, 0 errors), and build configuration.
>
> In accordance with strict instructions, **the system has stopped before deploying or purchasing any external services.** Follow these exact steps to complete the public release.

---

## STEP 1: DEPLOY CENTRAL BACKEND & SUPER ADMIN (`admin-web`)

Deploy the Next.js backend and Super Admin portal to a production cloud host (Vercel is strongly recommended for Next.js App Router).

### Option A: Using Vercel (Fastest & Recommended)
1. Sign in to [Vercel](https://vercel.com).
2. Click **"Add New Project"** and import your Git repository.
3. Set the **Root Directory** to `admin-web`.
4. In the **Environment Variables** section, enter the values below.
5. Click **Deploy**.

### Option B: Using Docker / Linux VPS
1. Run `cd admin-web && docker build -t glamora-backend .`
2. Run container exposing port 3001 with reverse proxy (Nginx or Caddy) handling SSL.

---

## STEP 2: CONFIGURE PRODUCTION ENVIRONMENT VARIABLES

Add these exact environment variables in your Vercel Project Settings (or Docker `.env`):

```env
# MongoDB Atlas Production Cluster (Live & Verified)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/Glamora?retryWrites=true&w=majority
MONGODB_DB_NAME=Glamora

# Cloudinary Media Storage (Server-Side Only - Live & Verified)
CLOUDINARY_CLOUD_NAME=etq3layz
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

# Security & Authentication Secrets (Generate 64+ random hex characters)
JWT_SECRET=YOUR_SECURE_RANDOM_JWT_SECRET_KEY
SESSION_COOKIE_SECRET=YOUR_SECURE_RANDOM_SESSION_SECRET_KEY

# Production Governance Flags
NODE_ENV=production
NEXT_PUBLIC_USE_MOCK_FALLBACK=false
```

---

## STEP 3: CONFIGURE YOUR CUSTOM DOMAIN DNS

At your domain registrar (GoDaddy, Namecheap, Route 53, or Cloudflare), create these DNS records:

```
Type     Name / Subdomain     Target Value               Purpose
-----------------------------------------------------------------------------------
CNAME    api                  cname.vercel-dns.com       Central REST API Gateway
CNAME    admin                cname.vercel-dns.com       Super Admin Dashboard
CNAME    book                 cname.vercel-dns.com       Customer Booking Website
```

Once DNS propagates (usually 5–15 minutes), verify your API is live by visiting:  
`https://api.glamora.com/api/health` (should return `status: "healthy"`).

---

## STEP 4: DEPLOY CUSTOMER BOOKING WEBSITE (`Galmora/public-web/`)

1. Open [`Galmora/public-web/index.html`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/public-web/index.html).
2. Update line 410 with your live production API URL:
   ```javascript
   const BACKEND_URL = 'https://api.glamora.com';
   ```
3. Deploy the `Galmora/public-web/` folder to Vercel, Cloudflare Pages, Netlify, or AWS S3 + CloudFront.
4. Bind your domain `https://book.glamora.com` (or `https://glamora.com`).

---

## STEP 5: UPDATE MOBILE ENVIRONMENT FILE FOR PRODUCTION

Before building the Android and iOS apps, point the mobile app to your live production HTTPS API:

1. Open [`Galmora/.env`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/.env).
2. Change the backend URL to your production domain:
   ```env
   EXPO_PUBLIC_BACKEND_API_URL=https://api.glamora.com
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=etq3layz
   EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP=+919876543210
   EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK=false
   ```

---

## STEP 6: GOOGLE PLAY STORE RELEASE (ANDROID)

1. Register for a **Google Play Console Developer Account** ($25 one-time fee) at [play.google.com/console](https://play.google.com/console).
2. Create a new application named **Glamora**.
3. Log in to EAS CLI on your terminal:
   ```bash
   cd Galmora
   npx eas-cli login
   ```
4. Generate the production Android App Bundle:
   ```bash
   npx eas-cli build -p android --profile production
   ```
   *(EAS will automatically generate the Android production Keystore, compile the code in the cloud, and provide a downloadable `.aab` file).*
5. Upload the `.aab` file to Google Play Console under **Production > Create new release**.
6. Fill out the Store Listing, Content Rating, and Data Safety sections, then submit for review.

---

## STEP 7: APPLE APP STORE RELEASE (iOS)

1. Enroll in the **Apple Developer Program** ($99/year) at [developer.apple.com](https://developer.apple.com).
2. Create a new App Record in [App Store Connect](https://appstoreconnect.apple.com) with Bundle ID `com.glamora.app`.
3. In your terminal, trigger the iOS cloud build:
   ```bash
   cd Galmora
   npx eas-cli build -p ios --profile production
   ```
   *(EAS will prompt you to log in to your Apple Developer Account. It will automatically provision the distribution certificate, Apple provisioning profile, and compile the signed `.ipa` in the cloud).*
4. Once complete, distribute the build to internal testers via **Apple TestFlight** or submit directly for App Store review.

---

## STEP 8: CONNECT OUTBOUND SMS GATEWAY (OPTIONAL BUT RECOMMENDED)

To deliver real SMS OTP codes to customer and owner mobile phones:
1. Create an account with **Twilio** ([twilio.com](https://www.twilio.com)) or **Msg91** ([msg91.com](https://msg91.com)).
2. Add your account credentials into `admin-web/.env.local`:
   ```env
   SMS_GATEWAY_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_FROM_PHONE=+1XXXXXXXXXX
   ```

---

## STEP 9: PHYSICAL DEVICE SMOKE TEST

Once the production builds are generated:
1. Download the Android preview APK (`eas build -p android --profile preview`) and install it on an Android phone.
2. Download the iOS TestFlight build on an iPhone.
3. Test the following physical interactions:
   - Grant Camera permission and upload a salon cover image.
   - Grant Location permission and verify nearby salon discovery.
   - Complete an appointment booking and verify that the confirmation card renders correctly.
   - Tap "Chat on WhatsApp" and verify it launches the WhatsApp mobile app.

