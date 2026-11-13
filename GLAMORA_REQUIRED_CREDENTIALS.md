# GLAMORA PLATFORM — CREDENTIALS & CONFIGURATION MANUAL
**Database Engine:** MongoDB (via connection URI or MongoDB Atlas)  
**Media Storage Engine:** Cloudinary (High-performance image CDN & transformation)  
**Backend API & Admin:** Next.js 14 API (`admin-web/`)  
**Android Application Package:** `com.glamora.app` (`Galmora/`)  

---

## 1. Architecture Overview: MongoDB + Cloudinary

Glamora has transitioned to a modern, decoupled production architecture:
1. **Primary Database: MongoDB**
   - Collections: `users`, `user_roles`, `salons`, `bookings`, `owner_applications`, `payments`, `subscriptions`, `support_tickets`, `admin_audit_logs`.
   - Connected via official Node driver with connection pooling in `admin-web/src/lib/mongodb.ts`.
   - Shared between Super Admin, Mobile App, and Public Booking engine via unified REST API.

2. **Media Storage: Cloudinary**
   - High-performance media delivery for salon cover photos, logos, treatment pictures, customer avatars, and stylist photos.
   - Handled directly in `Galmora/src/api/cloudinaryService.ts` and through the backend endpoint `/api/upload` (`admin-web/src/lib/cloudinary.ts`).
   - Replaces Firebase Storage.

---

## 2. Master Credentials Matrix

| Credential / Variable | Service | Scope | Provider | Where Configured |
| :--- | :--- | :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Database | Secret | MongoDB Atlas or Local | `admin-web/.env.local` |
| `MONGODB_DB_NAME` | MongoDB Database | Public | Set to `glamora` | `admin-web/.env.local` |
| `CLOUDINARY_CLOUD_NAME` | Media Storage | Public | Cloudinary Console | `admin-web/.env.local` |
| `CLOUDINARY_API_KEY` | Media Storage | Secret | Cloudinary Console | `admin-web/.env.local` |
| `CLOUDINARY_API_SECRET` | Media Storage | **Strict Secret** | Cloudinary Console | `admin-web/.env.local` |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Mobile Image Picker | Public | Cloudinary Console | `Galmora/.env` |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`| Mobile Direct Upload | Public | Cloudinary Console (Settings > Upload) | `Galmora/.env` |
| `EXPO_PUBLIC_BACKEND_API_URL` | Mobile API Client | Public | Backend Host | `Galmora/.env` |
| `JWT_SECRET` | Auth Token Signing | **Strict Secret** | Random 32+ characters | `admin-web/.env.local` |
| `SESSION_COOKIE_SECRET` | Session Security | **Strict Secret** | Random 32+ characters | `admin-web/.env.local` |

---

## 3. Step-by-Step Guide: How to Get Real Keys

### Step 3.1: Get Free MongoDB Atlas Connection URI
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account (or log in).
2. Click **Create a Deployment** $\rightarrow$ choose the **M0 Free** tier.
3. Select your preferred provider (AWS / Google Cloud) and region (e.g. Mumbai, Singapore, or US).
4. In **Security Quickstart**:
   - Create a database user (e.g., Username: `glamora_admin`, Password: copy the generated strong password).
   - Under **Where would you like to connect from?**, select **My Local Environment** and add `0.0.0.0/0` (Allow Access from Anywhere).
5. Click **Finish and Close** $\rightarrow$ Go to **Databases** view.
6. Click the **Connect** button next to your cluster:
   - Select **Drivers** (Node.js).
   - Copy the connection string:
     ```text
     mongodb+srv://glamora_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password.
   - Set the database name to `glamora`:
     ```text
     mongodb+srv://glamora_admin:yourpassword@cluster0.xxxxx.mongodb.net/glamora?retryWrites=true&w=majority
     ```
7. Paste this into `admin-web/.env.local` as `MONGODB_URI`.

---

### Step 3.2: Get Free Cloudinary Credentials
1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account.
2. In the **Cloudinary Console (Dashboard)**, locate your **Product Environment Credentials**:
   - **Cloud Name**: (e.g. `dxy7abc12`)
   - **API Key**: (e.g. `123456789012345`)
   - **API Secret**: (e.g. `AbCdEfGhIjKlMnOpQrStUvWxYz`)
3. Create an **Upload Preset** (required for mobile direct image uploads):
   - In Cloudinary, click the **Settings gear icon** (bottom left) $\rightarrow$ **Upload**.
   - Scroll down to **Upload presets** $\rightarrow$ click **Add upload preset**.
   - Preset Name: **`[your_upload_preset]`**.
   - Signing Mode: Select **Unsigned**.
   - Folder: `glamora`.
   - Click **Save**.
4. Configure these values in `admin-web/.env.local` and `Galmora/.env`.

---

## 4. Exact File Configurations

### 4.1 Backend & Super Admin: `admin-web/.env.local`
Save this file at `c:\Users\tammi\Downloads\Projects\Galmora App\admin-web\.env.local`:

```env
# =================================================================
# GLAMORA BACKEND API & SUPER ADMIN CONSOLE
# Target: http://localhost:3001
# =================================================================

# 1. MongoDB Database Connection
MONGODB_URI=mongodb+srv://glamora_admin:yourpassword@cluster0.xxxxx.mongodb.net/glamora?retryWrites=true&w=majority
MONGODB_DB_NAME=glamora

# 2. Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# 3. Security
JWT_SECRET=super_secret_jwt_key_glamora_2026_xyz123456
SESSION_COOKIE_SECRET=super_secret_session_cookie_signing_token_glamora

# 4. Zero Dummy Data Policy
NEXT_PUBLIC_USE_MOCK_FALLBACK=false
```

---

### 4.2 Mobile Application: `Galmora/.env`
Save this file at `c:\Users\tammi\Downloads\Projects\Galmora App\Galmora\.env`:

```env
# =================================================================
# GLAMORA MOBILE APP (ANDROID: com.glamora.app)
# =================================================================

# 1. Backend REST API URL (Points to Next.js API on port 3001)
# Use your computer's LAN IP for physical device testing:
EXPO_PUBLIC_BACKEND_API_URL=http://10.142.53.27:3001

# 2. Cloudinary Media Storage
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=[your_upload_preset]

# 3. Zero Dummy Data Policy
EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK=false

# 4. Support Contact
EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP=+910000000000
```

---

## 5. End-to-End Verification Check

1. **Verify MongoDB & Cloudinary in Admin Web**:
   - Run `cd admin-web && npm run dev`
   - Test image upload via Cloudinary:
     ```powershell
     curl -X POST http://localhost:3001/api/upload -F "file=@test.png"
     ```
   - Test MongoDB Salons endpoint:
     ```powershell
     curl http://localhost:3001/api/salons
     ```

2. **Verify Mobile App**:
   - Run `cd Galmora && npx expo start`
   - When salon owners upload cover images or treatment photos, they upload directly to Cloudinary and the permanent URL is persisted to MongoDB!
