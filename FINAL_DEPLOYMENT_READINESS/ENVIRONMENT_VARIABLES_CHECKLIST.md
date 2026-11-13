# GLAMORA — PRODUCTION ENVIRONMENT VARIABLES CHECKLIST

**Audit Date:** November 2026  
**Scope:** Central Backend (`admin-web/`), Mobile Client (`Galmora/`), Cloud Hosting & EAS  
**Compliance Standard:** Zero Secret Leakage • 100% Parameter Validation

---

## 1. Central Backend (`admin-web/.env.local` & Production Hosting)

| Variable Name | Required | Purpose | Production Example / Format | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| `MONGODB_URI` | **YES** | MongoDB Atlas connection string with replica set & auth | `mongodb+srv://[username]:[password]@[cluster].mongodb.net/?retryWrites=true&w=majority` | **CONFIGURED** *(IP whitelist update required)* |
| `MONGODB_DB_NAME` | **YES** | Production database name | `Glamora` | **CONFIGURED** |
| `CLOUDINARY_CLOUD_NAME` | **YES** | Cloudinary account cloud identifier | `[your_cloudinary_cloud_name]` | **CONFIGURED** |
| `CLOUDINARY_API_KEY` | **YES** | Cloudinary REST API key | `[your_cloudinary_api_key]` | **CONFIGURED** |
| `CLOUDINARY_API_SECRET` | **YES** | Cloudinary REST API secret (server-side only) | `[your_cloudinary_api_secret]` | **CONFIGURED** |
| `JWT_SECRET` | **YES** | Minimum 32-byte cryptographic secret for JWT signing | `[64_char_hex_jwt_secret]` | **CONFIGURED** |
| `SESSION_COOKIE_SECRET` | **YES** | Cookie encryption & HMAC integrity secret | `[64_char_hex_session_secret]` | **CONFIGURED** |
| `NEXT_PUBLIC_USE_MOCK_FALLBACK` | **YES** | Strict Zero-Mock policy enforcement | `false` | **CONFIGURED** |
| `ALLOWED_ORIGINS` | OPTIONAL | Comma-separated list of approved web domains for CORS | `https://glamora.app,https://admin.glamora.app` | Ready for production URL assignment |

> [!WARNING]
> **MongoDB Atlas Network Access:**
> Your local developer workstation public IP is currently `110.225.36.74`.
> MongoDB Atlas requires that this IP address (or `0.0.0.0/0` for universal cloud access) be present in the **Network Access -> IP Access List** in the MongoDB Atlas console, otherwise the cluster firewall terminates connections with `SSL alert number 80`.

---

## 2. Mobile Application (`Galmora/.env` & EAS Build Secrets)

| Variable Name | Required | Purpose | Production Target | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_BACKEND_API_URL` | **YES** | Central Next.js API root endpoint | `https://api.glamora.app` (or LAN IP for local testing) | **CONFIGURED** (`http://10.142.53.27:3001` for physical device test) |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | **YES** | Cloudinary cloud name for direct mobile media fetching | `etq3layz` | **CONFIGURED** |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | **YES** | Unsigned upload preset for direct mobile image upload | `glamora_mobile_uploads` | Setup required in Cloudinary dashboard |
| `EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP` | **YES** | Concierge support phone number | `+919876543210` | **CONFIGURED** |
| `EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK` | **YES** | Enforces zero dummy data in mobile UI | `false` | **CONFIGURED** |

---

## 3. EAS Build Secrets Setup (for Cloud Building)

To ensure EAS Build has access to the required environment variables during remote Android APK and iOS TestFlight builds, execute:

```bash
cd Galmora

# Set production API URL
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_API_URL --type string --value "https://api.glamora.app"

# Set Cloudinary identifiers
eas secret:create --scope project --name EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME --type string --value "[your_cloudinary_cloud_name]"
eas secret:create --scope project --name EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET --type string --value "[your_upload_preset]"

# Set Support WhatsApp
eas secret:create --scope project --name EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP --type string --value "+910000000000"

# Enforce zero mock fallback
eas secret:create --scope project --name EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK --type string --value "false"
```

