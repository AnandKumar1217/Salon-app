# GLAMORA — RENDER STAGING DEPLOYMENT FINAL CHECKLIST

**Document Version:** 1.0.0  
**Target Service:** Render Web Service (`admin-web/`)  
**Target Environment:** Staging / Production  
**Target Node Version:** `24.22.1`  
**Target Framework:** Next.js 16.4.6 (Turbopack) & React 19.3.1  
**Target Branch:** `feature/next16-migration` (or `main` following review & merge)  

---

## 1. PRE-DEPLOYMENT VERIFICATION CHECKLIST

Ensure the following checkboxes are verified prior to initiating the Render Web Service deployment:

- [x] **Git Branch Isolation:** All changes reside on `feature/next16-migration` (clean working tree).
- [x] **Framework Version:** `admin-web/package.json` specifies `"next": "16.4.6"` and `"react": "19.3.1"`.
- [x] **Reproducible Lockfile:** `admin-web/package-lock.json` regenerated and passes `npm ci`.
- [x] **Zero TypeScript Errors:** `npx tsc --noEmit` exits 0.
- [x] **ESLint 9 Passing:** `npm run lint` (`eslint .`) exits 0 with 0 errors and 0 warnings.
- [x] **Automated Tests:** 111/111 automated tests passed across all 11 test suites.
- [x] **Turbopack Production Build:** `npm run build` succeeds (32/32 static and dynamic routes).
- [x] **Dynamic Port Binding Verified:** Confirmed `npx next start -p $PORT` successfully binds to dynamic ports (tested on port 3005).
- [x] **Zero Secrets in Repository:** No `.env`, `.env.local`, credentials, keystores, or certificates are tracked in Git.
- [x] **CORS & CSRF Security:** Verified `admin-web/src/proxy.ts` preserves exact origin allowlist, preflight OPTIONS (204/403), and cookie CSRF protection.

---

## 2. RENDER WEB SERVICE CONFIGURATION

When creating the Web Service in the Render Dashboard, enter the following exact settings:

| Setting | Exact Value | Purpose |
| :--- | :--- | :--- |
| **Name** | `glamora-backend-api` | Public staging service identifier |
| **Repository** | `https://github.com/AnandKumar1217/Salon-app.git` | GitHub connected repository |
| **Branch** | `feature/next16-migration` | Staging migration branch |
| **Root Directory** | `admin-web` | Isolated Next.js root folder |
| **Environment / Runtime** | `Node` | Native Node.js runtime |
| **Region** | `Singapore (sin)` | Lowest latency to India customer base |
| **Instance Type** | `Starter` (or `Free` for initial staging) | 512 MB – 1 GB RAM sufficient for SSR + API routes |
| **Build Command** | `npm ci && npm run build` | Guaranteed clean install from lockfile & Turbopack build |
| **Start Command** | `npx next start -p $PORT` | Binds to dynamic port injected by Render |
| **Health Check Path** | `/api/health` | Returns HTTP 200 with DB status |
| **Auto-Deploy** | `Yes` | Automatically redeploys when commits are pushed |

> [!WARNING]
> **CRITICAL: Root Directory Must Be `admin-web`**
> In the Render Dashboard under **Settings > Root Directory**, you MUST specify `admin-web`.
> If left blank or default (`.`), Render executes `npm ci && npm run build` in the repository root directory where no `package.json` or `package-lock.json` exists, causing npm to display `EUSAGE` and fail the build. A `render.yaml` Blueprint file is now committed at the repository root to automatically declare `rootDir: admin-web`.

---

## 3. MANDATORY ENVIRONMENT VARIABLES (RENDER DASHBOARD)

Configure these environment variables under the **Environment** tab in Render:

| Variable Name | Required Value / Format | Description |
| :--- | :--- | :--- |
| `NODE_VERSION` | `24.22.1` | Instructs Render to use Node.js 24 LTS |
| `MONGODB_URI` | `mongodb+srv://<username>:<password>@cluster0.hrcaov7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0` | Production MongoDB Atlas connection URI |
| `MONGODB_DB_NAME` | `glamora` | Central Glamora database name |
| `JWT_SECRET` | *(64-character random hex string)* | HS256 JWT signing secret (min 32 characters) |
| `SESSION_COOKIE_SECRET` | *(64-character random hex string)* | Admin session cookie signing key |
| `CLOUDINARY_CLOUD_NAME` | *(Your Cloudinary Cloud Name)* | Cloudinary media upload cloud identifier |
| `CLOUDINARY_API_KEY` | *(Your Cloudinary API Key)* | Cloudinary API access key |
| `CLOUDINARY_API_SECRET` | *(Your Cloudinary API Secret)* | Cloudinary API access secret |
| `NEXT_PUBLIC_USE_MOCK_FALLBACK` | `false` | Strictly disables mock data fallbacks in production |
| `ALLOWED_ORIGINS` | `https://glamora-backend-api.onrender.com,http://localhost:3000,http://localhost:3001,http://localhost:3002` | Explicit CORS allowlist for web and mobile origins |

> [!CRITICAL]
> **MongoDB Atlas Network Access:**
> Ensure your MongoDB Atlas cluster allows connections from Render. In the **Atlas Dashboard > Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere with strong username/password authentication) or add Render's outbound static IPs if running on a team plan.

---

## 4. POST-DEPLOYMENT VERIFICATION STEPS

Once the deployment completes on Render and displays `Live`, run the following smoke tests against the assigned URL (e.g. `https://glamora-backend-api.onrender.com`):

### 1. Health & Database Connectivity Check
```bash
curl -i https://glamora-backend-api.onrender.com/api/health
```
**Expected Response:** HTTP 200 OK with `status: "healthy"` and `services.database.status: "connected"`.

### 2. CORS Preflight Check
```bash
curl -i -X OPTIONS https://glamora-backend-api.onrender.com/api/salons \
  -H "Origin: https://glamora-backend-api.onrender.com" \
  -H "Access-Control-Request-Method: POST"
```
**Expected Response:** HTTP 204 No Content with `Access-Control-Allow-Origin` and `Vary: Origin`.

### 3. Super Admin Dashboard Smoke Test
Navigate in Chrome/Edge to:
`https://glamora-backend-api.onrender.com/login`
Confirm:
- Super Admin login form renders cleanly without hydration mismatches.
- Authentication succeeds with valid admin credentials.
- Protected dashboard (`/`) renders stats, live salon listings, and booking stream.

### 4. Public Web & Mobile App Integration Smoke Test
Confirm that the customer booking website and Expo Android app can reach `https://glamora-backend-api.onrender.com/api/salons` and load salon listings.
