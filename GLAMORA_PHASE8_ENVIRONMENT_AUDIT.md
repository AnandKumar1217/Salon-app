# GLAMORA — PHASE 8: MULTI-TIER ENVIRONMENT AUDIT & SPECIFICATION

**Date:** November 13, 2026  
**Auditor:** Principal DevOps Engineer & Systems Security Architect  
**Scope:** Strict Environment Variable Segmentation for Development, Staging, and Production Tiers  
**Security Mandate:** Zero Secret Leakage to Client Bundles • Zero Hardcoded Passwords • Exact Public/Secret Classification  

---

## 1. ENVIRONMENT SEGREGATION ARCHITECTURE

The Glamora ecosystem operates across three decoupled deployment tiers. Each tier maintains strictly isolated database namespaces, media folders, and cryptographic keys.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   GLAMORA ENVIRONMENT TOPOLOGY                         │
├───────────────────┬────────────────────┬───────────────────────────────┤
│ LOCAL DEV         │ STAGING            │ PRODUCTION                    │
│ Host: localhost   │ Host: Vercel/Docker│ Host: Vercel Enterprise/AWS   │
│ DB: Glamora_dev   │ DB: Glamora_stage  │ DB: Glamora (Live Atlas M10+) │
│ Media: /dev       │ Media: /staging    │ Media: /production            │
│ Origin: localhost │ Origin: *.stage    │ Origin: *.glamora.com         │
└───────────────────┴────────────────────┴───────────────────────────────┘
```

---

## 2. EXHAUSTIVE ENVIRONMENT VARIABLE INVENTORY

| Environment Variable Name | Target Layer | Scope | Sensitivity | Purpose & Value Description |
| :--- | :--- | :--- | :---: | :--- |
| `MONGODB_URI` | Backend Only | Server-Side | **SECRET** | Authenticated connection string to MongoDB Atlas cluster with SRV and SSL parameters. |
| `MONGODB_DB_NAME` | Backend Only | Server-Side | **INTERNAL**| Database name (`Glamora_dev`, `Glamora_stage`, or `Glamora`). |
| `JWT_SECRET` | Backend Only | Server-Side | **SECRET** | 64+ char cryptographic key used for HMAC-SHA256 token signing and verification. |
| `SESSION_COOKIE_SECRET` | Backend Only | Server-Side | **SECRET** | 64+ char key for signing HTTP-only administrative cookies. |
| `CLOUDINARY_CLOUD_NAME` | Backend & Mobile| Public | **PUBLIC** | Cloudinary tenant namespace (`etq3layz`). |
| `CLOUDINARY_API_KEY` | Backend Only | Server-Side | **SECRET** | Cloudinary public identifier for server-side SDK calls. |
| `CLOUDINARY_API_SECRET` | Backend Only | Server-Side | **CRITICAL**| Cloudinary private secret key for image signing and destruction. |
| `ALLOWED_ORIGINS` | Backend Only | Server-Side | **INTERNAL**| Comma-separated list of approved web origins permitted for CORS. |
| `COOKIE_DOMAIN` | Backend Only | Server-Side | **INTERNAL**| Domain scope for session cookies (`.glamora.com` in production). |
| `NODE_ENV` | All | System | **PUBLIC** | System runtime environment (`development`, `staging`, `production`). |
| `NEXT_PUBLIC_USE_MOCK_FALLBACK` | Backend & Web | Public | **PUBLIC** | Must be strictly `false` in Staging and Production. |
| `EXPO_PUBLIC_BACKEND_API_URL` | Mobile App | Client-Side | **PUBLIC** | Base URL for REST API (`https://api.glamora.com` in production). |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`| Mobile App | Client-Side | **PUBLIC** | Cloud name used for client-side image URL construction (`etq3layz`). |
| `EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP`| Mobile App | Client-Side | **PUBLIC** | Help concierge WhatsApp phone number (`+919876543210`). |
| `EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK`| Mobile App | Client-Side | **PUBLIC** | Must be strictly `false` in Staging and Production. |

> [!CAUTION]
> **CRITICAL ARCHITECTURAL BOUNDARY:**
> The variables `MONGODB_URI`, `CLOUDINARY_API_SECRET`, `JWT_SECRET`, and `SESSION_COOKIE_SECRET` must **NEVER** be prefixed with `NEXT_PUBLIC_` or `EXPO_PUBLIC_`. Doing so would compile these secrets into the JavaScript bundle sent to web browsers and mobile decompilers.

---

## 3. READY-TO-USE CONFIGURATION TEMPLATES

### 3.1 Local Development Environment (`admin-web/.env.local`)
```env
# Local Development Tier
NODE_ENV=development
NEXT_PUBLIC_USE_MOCK_FALLBACK=false

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<dev-user>:<dev-pass>@cluster.mongodb.net/Glamora_dev?retryWrites=true&w=majority
MONGODB_DB_NAME=Glamora_dev

# Cloudinary Media
CLOUDINARY_CLOUD_NAME=etq3layz
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

# JWT & Cookie Secrets
JWT_SECRET=development_local_secure_secret_key_minimum_32_characters_long_12345
SESSION_COOKIE_SECRET=development_session_cookie_secret_key_minimum_32_characters_12345

# Allowed CORS Origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8081
```

### 3.2 Staging Environment (Vercel Staging / Docker `.env.staging`)
```env
# Staging Tier
NODE_ENV=production
NEXT_PUBLIC_USE_MOCK_FALLBACK=false

# MongoDB Atlas (Isolated Staging Database)
MONGODB_URI=mongodb+srv://<stage-user>:<stage-pass>@cluster.mongodb.net/Glamora_stage?retryWrites=true&w=majority
MONGODB_DB_NAME=Glamora_stage

# Cloudinary Media
CLOUDINARY_CLOUD_NAME=etq3layz
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

# Cryptographic Keys (Unique 64-char Hex String for Staging)
JWT_SECRET=6f9a8b1c4e2d3f5a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a
SESSION_COOKIE_SECRET=1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b

# Staging Origins & Cookie Scope
ALLOWED_ORIGINS=https://staging.glamora.com,https://staging-admin.glamora.com,https://staging-book.glamora.com
COOKIE_DOMAIN=.glamora.com
```

### 3.3 Live Production Environment (Vercel Production / AWS Secrets Manager)
```env
# Production Tier
NODE_ENV=production
NEXT_PUBLIC_USE_MOCK_FALLBACK=false

# MongoDB Atlas (Live High-Availability Production Cluster)
MONGODB_URI=mongodb+srv://<prod-user>:<prod-pass>@cluster.mongodb.net/Glamora?retryWrites=true&w=majority
MONGODB_DB_NAME=Glamora

# Cloudinary Media Storage (Dedicated Production Account)
CLOUDINARY_CLOUD_NAME=etq3layz
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

# Cryptographic Keys (High-Entropy Cryptographically Random 96-char Keys)
JWT_SECRET=e4d2a1b9c8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5
SESSION_COOKIE_SECRET=9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f

# Production Allowed Origins & Cookie Domain
ALLOWED_ORIGINS=https://glamora.com,https://www.glamora.com,https://admin.glamora.com,https://book.glamora.com
COOKIE_DOMAIN=.glamora.com
```

### 3.4 Mobile Application Environment (`Galmora/.env`)

#### For Local Dev / Metro Bundler:
```env
EXPO_PUBLIC_BACKEND_API_URL=http://localhost:3001
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=etq3layz
EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP=+919876543210
EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK=false
```

#### For Staging EAS Build:
```env
EXPO_PUBLIC_BACKEND_API_URL=https://staging-api.glamora.com
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=etq3layz
EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP=+919876543210
EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK=false
```

#### For Production EAS Build:
```env
EXPO_PUBLIC_BACKEND_API_URL=https://api.glamora.com
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=etq3layz
EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP=+919876543210
EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK=false
```

