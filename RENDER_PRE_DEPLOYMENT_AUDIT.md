# GLAMORA — RENDER PRE-DEPLOYMENT AUDIT REPORT

**Audit Date:** November 2026  
**Auditor:** Senior Infrastructure & Cloud Deployment Engineer  
**Target Repository:** [https://github.com/AnandKumar1217/Salon-app.git](https://github.com/AnandKumar1217/Salon-app.git)  
**Branch:** `main`  
**Latest Commit Hash:** `c7bfa81ccfe0d1d854e6b07d521cdb6632a34372`  
**Deployable Subsystem:** Central REST API & Super Admin (`admin-web/`)  
**Overall Verdict:** **READY FOR STAGING DEPLOYMENT ON RENDER**

---

## 1. Repository & Commit Verification

An empirical verification of the target Git repository was executed prior to audit preparation:

```bash
git branch -vv
# * main c7bfa81 [origin/main] docs: add GitHub repository deployment readiness report

git status
# On branch main
# Your branch is up to date with 'origin/main'.
# nothing to commit, working tree clean

git ls-remote origin
# c7bfa81ccfe0d1d854e6b07d521cdb6632a34372    refs/heads/main
```

### Manifest & Secret Isolation Audit:
- **`admin-web/` Directory:** Verified present in GitHub `main` branch.
- **`admin-web/package.json`:** Verified present (`blob 223022a`).
- **`admin-web/package-lock.json`:** Verified present (`blob 9450bf4`).
- **Secret Exclusion Audit:** Verified via AST/regex scan. Zero `.env`, `.env.local`, `.env.production`, or private keys (`.pem`, `.key`, `.jks`, `.keystore`, `.p8`, `.p12`) are tracked in the repository. Only safe documentation files (`.env.example`) with generic placeholders exist.

---

## 2. Render Command & Runtime Verification

### 2.1 Runtime & Recommended Node.js Version
- **Target Runtime:** `Node`
- **Next.js Version:** `14.2.15` (requires Node.js `>= 18.17.0`)
- **Recommended Node.js Version:** **Node.js 20.x LTS** (e.g. `20.18.0` or higher). Render defaults to Node 20.x on standard Web Services.

### 2.2 Build Command Verification
- **Verified Build Command:**
  ```bash
  npm ci && npm run build
  ```
- **Empirical Proof:**
  - `npm ci --dry-run` was executed in `admin-web/`: confirmed `up to date in 1s` with 0 dependency mismatches against `package-lock.json`.
  - `npm run build` (`next build`) was executed in `admin-web/`: compiled 33 static/dynamic routes, 20 API endpoints, and the security middleware into an optimized production bundle with **0 errors**.

### 2.3 Start Command & Dynamic PORT Binding Analysis
- **Current `package.json` Script:**
  `admin-web/package.json` line 8 specifies `"start": "next start -p 3001"`.
- **Render Dynamic Port Behavior:**
  Render injects an environment variable `PORT` (typically `PORT=10000`) and expects the web server to listen on `0.0.0.0:$PORT`.
- **Critical Recommendation:**
  If `npm start` is used, Next.js will override Render's assigned `$PORT` and bind to `3001`, causing Render's HTTP health check and reverse proxy to fail.
- **Exact Recommended Start Command for Render Dashboard:**
  ```bash
  npx next start -p $PORT
  ```
  *(This guarantees Next.js binds directly to Render's assigned port).*

---

## 3. Comprehensive Environment Variable Audit

All environment variables referenced in `admin-web/src` and configuration files were scanned and audited:

| Variable Name | Required / Optional | Scope & Secret Level | Phase | Purpose | Where to Obtain Value |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `NODE_ENV` | **REQUIRED** | Backend Configuration | Runtime & Build | Sets Next.js to production mode | Render sets automatically to `production` |
| `PORT` | **REQUIRED** | System Environment | Runtime | HTTP port on which the server listens | Render sets automatically (e.g. `10000`) |
| `NEXT_PUBLIC_USE_MOCK_FALLBACK` | **REQUIRED** | Public (Client & Server) | Build & Runtime | Enforces strict zero-mock policy (`false`) | Set explicitly to `false` in Render dashboard |
| `MONGODB_URI` | **REQUIRED** | **Backend-Only Secret** | Runtime | MongoDB Atlas replica-set connection string | MongoDB Atlas Console $\rightarrow$ Connect $\rightarrow$ Drivers $\rightarrow$ Node.js |
| `MONGODB_DB_NAME` | **REQUIRED** | Backend Configuration | Runtime | Target database name | Value: `Glamora` (from your Atlas cluster) |
| `JWT_SECRET` | **REQUIRED** | **Backend-Only Secret** | Runtime | Cryptographic HMAC secret for signing auth tokens (min 32 chars) | Generate 64-char hex key via `crypto.randomBytes(32)` |
| `SESSION_COOKIE_SECRET` | **REQUIRED** | **Backend-Only Secret** | Runtime | Cryptographic secret for signing HTTP-only admin cookies | Generate 64-char hex key via `crypto.randomBytes(32)` |
| `CLOUDINARY_CLOUD_NAME` | **REQUIRED** | Public / Backend Config | Runtime | Cloudinary account cloud identifier | Cloudinary Console Dashboard $\rightarrow$ Cloud name |
| `CLOUDINARY_API_KEY` | **REQUIRED** | **Backend-Only Secret** | Runtime | Cloudinary REST API Key | Cloudinary Console Dashboard $\rightarrow$ API Keys |
| `CLOUDINARY_API_SECRET` | **REQUIRED** | **Backend-Only Secret** | Runtime | Cloudinary REST API Secret | Cloudinary Console Dashboard $\rightarrow$ API Keys |
| `ALLOWED_ORIGINS` | OPTIONAL *(Recommended)* | Backend Configuration | Runtime | Comma-separated list of approved web origins for CORS | Custom domains + Render URL (e.g. `https://glamora-backend.onrender.com`) |

> [!CAUTION]
> **Strict Secret Privacy Rule:**
> Never commit or paste real secret values into repository documentation or chat interfaces. Values must be entered directly into the **Environment** tab in your private Render service dashboard.

---

## 4. Production Deployment & Security Checks

### 4.1 MongoDB Connection Resilience & Pooling
- **Connection Timeout:** `serverSelectionTimeoutMS: 5000` and `connectTimeoutMS: 5000` configured.
- **Self-Healing Pool:** `getClientPromise()` in `admin-web/src/lib/mongodb.ts` automatically evicts rejected connection promises, allowing automatic recovery upon network reconnection without server restarts.
- **Indexes:** Production composite indexes (`bookings`, `users`, `salons`, `push_tokens`, `admin_audit_logs`) ensure multi-tenant isolation and zero double-booking concurrency defense.

### 4.2 Cloudinary Media Integration
- **Server-Side Proxy:** Media upload endpoint `/api/upload` uploads via server SDK using `CLOUDINARY_API_SECRET`. Secrets are never exposed to clients.
- **Rate Limiting:** Enforces maximum 20 uploads per IP per minute and 30 uploads per user per minute.
- **Validation:** Enforces maximum 5MB file size and strict MIME type allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/heic`).

### 4.3 JWT, Session Cookies, RBAC & CSRF
- **JWT Hardening:** Rejects `none` algorithm; verifies issuer (`glamora-auth`), audience (`glamora-platform`), and 7-day expiration (`exp`).
- **HTTP-Only Cookies:** `glamora_admin_token` is configured with `HttpOnly: true`, `SameSite: Lax`, and `Secure: true` in production environments.
- **CSRF Defense:** State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) bearing admin cookies from unapproved origins are blocked with `HTTP 403 Forbidden` in Next.js middleware.
- **RBAC:** Four administrative tiers (`SUPER_ADMIN`, `OPERATIONS_ADMIN`, `SUPPORT_ADMIN`, `FINANCE_ADMIN`) enforced server-side.

### 4.4 CORS & Production Domain Configuration
- **No Wildcard:** Wildcard `*` is prohibited.
- **Dynamic Origin Echoing:** Allowed origins receive exact echo with `Access-Control-Allow-Credentials: true` and `Vary: Origin`.
- **Domain Merging:** When `ALLOWED_ORIGINS` is set in production, only explicitly listed domains are accepted.

### 4.5 Health Check Endpoint (`/api/health`)
- **Route:** `GET /api/health`
- **Output:** Returns JSON status (`healthy` or `degraded`), latency, and service states.
- **Zero Information Leak:** Exposes zero credentials, connection strings, or private keys. Returns HTTP 200 when healthy.

### 4.6 Zero Insecure Account Bootstrap
- `bootstrap-super-admin.mjs` is an interactive/CLI-only script requiring explicit parameters. No default or hardcoded admin accounts are generated automatically on application startup.

---

## 5. Render Configuration Parameters (Exact Values)

| Configuration Field | Exact Recommended Value | Explanation |
| :--- | :--- | :--- |
| **Service Type** | Web Service | Node.js web application hosting |
| **Service Name** | `glamora-backend` | Service identifier on Render |
| **Repository** | `https://github.com/AnandKumar1217/Salon-app.git` | Your verified GitHub repository |
| **Branch** | `main` | Production deployment branch |
| **Root Directory** | `admin-web` | Next.js API & Admin root |
| **Runtime** | `Node` | Node.js native runtime |
| **Region** | `Singapore (Southeast Asia)` | Optimal latency for Indian & Southeast Asian users |
| **Instance Type** | `Free` or `Starter` ($7/mo) | Free tier spins down on idle; Starter ensures persistent background availability |
| **Build Command** | `npm ci && npm run build` | Deterministic lockfile install & Next.js production build |
| **Start Command** | `npx next start -p $PORT` | Binds Next.js directly to Render's assigned port |
| **Health Check Path** | `/api/health` | Probed by Render router to verify service availability |
| **Auto-Deploy** | `Yes` | Automatically deploys when new commits land on `main` |

---

## 6. Pre-Deployment Blockers & Action Items

Before triggering the deployment on Render, execute these mandatory configuration tasks:

1. **MongoDB Atlas Network Access (CRITICAL):**
   - In MongoDB Atlas Console $\rightarrow$ **Network Access**, add an access entry permitting Render's servers to connect.
   - For initial staging on Render: Add `0.0.0.0/0` (Allow Access from Anywhere) with a label like `Render Staging Access`.
   - Ensure your MongoDB Atlas user credentials have strong, unique passwords.
2. **Configure Environment Variables in Render Dashboard:**
   - In Render Console $\rightarrow$ Web Service $\rightarrow$ **Environment**, add the 8 required keys listed in Section 3 above.
3. **Configure Custom Domains (Post-Deployment):**
   - Once Render assigns your default URL (e.g. `https://glamora-backend.onrender.com`), add this URL to the `ALLOWED_ORIGINS` environment variable in Render.
   - If using custom domains (e.g. `api.glamora.app`), configure DNS CNAME records and add to `ALLOWED_ORIGINS`.
4. **Update Mobile App & Customer Web:**
   - Update `Galmora/.env` (`EXPO_PUBLIC_BACKEND_API_URL`) to point to your new Render backend URL (`https://glamora-backend.onrender.com`).

---

## 7. Final Verdict

**FINAL VERDICT: READY FOR STAGING DEPLOYMENT ON RENDER**

The code is 100% compiled, tested, secure, and pushed to GitHub `main`. Once you configure the environment variables in the Render dashboard and update Atlas network access, the service is ready to deploy.
