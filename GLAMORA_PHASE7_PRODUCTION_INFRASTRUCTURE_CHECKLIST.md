# GLAMORA — PHASE 7: PRODUCTION INFRASTRUCTURE CHECKLIST

**Date:** November 13, 2026  
**Auditor:** Principal DevOps Engineer & Cloud Infrastructure Architect  
**Scope:** Infrastructure Verification covering Domain Setup, SSL/TLS, CORS Policies, Backups, Telemetry, and Disaster Recovery  
**Deployment Models:** Vercel Enterprise / AWS ECS / Self-Hosted Docker + MongoDB Atlas M10+ + Cloudinary  

---

## 1. INFRASTRUCTURE READINESS DASHBOARD

| Infrastructure Component | Target Specification | Current Status | Action Needed for Production Release |
| :--- | :--- | :--- | :--- |
| **Domain & DNS** | `glamora.com`, `api.glamora.com` | **CONFIGURED FOR LOCALHOST** | Owner must purchase domain and create DNS CNAME records. |
| **TLS / SSL Certificates** | HTTPS Only with HSTS | **READY FOR HOSTING** | Automated SSL provisioned on Vercel / Cloudflare upon domain link. |
| **CORS Policy** | Global Cross-Origin API headers | **VERIFIED & OPERATIONAL** | Global headers added to `admin-web/next.config.js`; preflight verified. |
| **MongoDB Atlas Cluster** | Atlas M0 Free / M10 Dedicated | **CONNECTED & OPERATIONAL** | Connected to live cluster `Glamora`. Recommend M10 tier for high traffic. |
| **Database Automated Backups** | Automated Daily Snapshots + PITR | **SUPPORTED ON ATLAS** | Enable Continuous Cloud Backups (PITR) in Atlas project settings. |
| **Health Telemetry Endpoint** | `GET /api/health` with DB/Media ping | **VERIFIED & OPERATIONAL** | Implemented in `admin-web/src/app/api/health/route.ts`; returns HTTP 200. |
| **Error Monitoring** | Sentry / Datadog Application Telemetry| **READY FOR INTEGRATION** | Add `NEXT_PUBLIC_SENTRY_DSN` to production environment. |
| **Structured Audit Logging** | Immutable logs in MongoDB `audit_logs`| **VERIFIED & OPERATIONAL** | Operational in `mongodb-service.ts`; recorded on all admin actions. |
| **Rollback Strategy** | Blue-Green / Instant Git Rollback | **SUPPORTED BY HOST** | One-click rollback supported in Vercel or Docker container registry. |

---

## 2. DOMAIN & DNS SETUP ARCHITECTURE

To route customer web traffic, administrative users, and mobile app API requests cleanly, configure the following DNS records at your registrar (Cloudflare, Route 53, GoDaddy, or Namecheap):

```
DNS Zone: glamora.com
-----------------------------------------------------------------------------------------
Type    Host/Name    Target / Value                          TTL        Purpose
-----------------------------------------------------------------------------------------
A       @            76.76.21.21 (or Vercel Anycast IP)      Auto / 300 Apex Domain / Landing
CNAME   www          cname.vercel-dns.com                    Auto / 300 WWW Redirect
CNAME   api          cname.vercel-dns.com                    Auto / 300 Central REST API Gateway
CNAME   admin        cname.vercel-dns.com                    Auto / 300 Super Admin Portal
CNAME   book         cname.vercel-dns.com                    Auto / 300 Customer Booking Website
```

### Mobile App Environment Update (Pre-Build)
Once `api.glamora.com` is active, update [`Galmora/.env`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/Galmora/.env):
```env
# Production API Gateway
EXPO_PUBLIC_BACKEND_API_URL=https://api.glamora.com
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=etq3layz
EXPO_PUBLIC_DEFAULT_SUPPORT_WHATSAPP=+919876543210
EXPO_PUBLIC_USE_LOCAL_MOCK_FALLBACK=false
```

---

## 3. TLS / SSL CERTIFICATE & SECURITY HEADERS

### 3.1 Strict Transport Security
In production, all HTTP requests must automatically redirect to HTTPS. When deployed on Vercel, Cloudflare, or AWS CloudFront, SSL certificates are automatically provisioned via Let's Encrypt with auto-renewal.

### 3.2 Global Security Headers (`admin-web/next.config.js`)
The following headers should be active in production:
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options`: `nosniff`
- `X-Frame-Options`: `DENY` (blocks clickjacking attacks on admin portal)
- `X-XSS-Protection`: `1; mode=block`
- `Referrer-Policy`: `strict-origin-when-cross-origin`

---

## 4. CORS POLICY CONFIGURATION (VERIFIED)

Cross-Origin Resource Sharing is active and verified in [`admin-web/next.config.js`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/next.config.js):

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
        { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
      ],
    },
  ];
}
```

- **Verification Evidence:** Executed `curl.exe -i -X OPTIONS http://localhost:3001/api/salons -H "Origin: http://localhost:3002"`. Server returned `HTTP 204 No Content` with complete CORS headers.

---

## 5. DATABASE BACKUP & POINT-IN-TIME RECOVERY (PITR)

### 5.1 MongoDB Atlas Automated Backups
- **Continuous Cloud Backups (PITR):** When running on an Atlas Dedicated Tier (M10+), Atlas provides Point-in-Time Recovery with granularity down to 1 minute over the last 7 days.
- **Snapshot Schedule:**
  - Hourly snapshots retained for 24 hours.
  - Daily snapshots retained for 30 days.
  - Weekly snapshots retained for 52 weeks.
- **Failover:** MongoDB Atlas multi-AZ replica sets provide automated failover with `< 5 seconds` election time if the primary node goes offline.

### 5.2 Manual Backup Utility
For offline archival, run:
```bash
mongodump --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/Glamora" --out=./backups/backup_$(date +%Y%m%d)
```

---

## 6. MONITORING, TELEMETRY & HEALTH CHECK

### 6.1 Central Health Telemetry Endpoint (`/api/health`)
- **Route:** [`admin-web/src/app/api/health/route.ts`](file:///c:/Users/tammi/Downloads/Projects/Galmora%20App/admin-web/src/app/api/health/route.ts)
- **Status:** **VERIFIED & OPERATIONAL**
- **Test Evidence:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-11-13T12:03:08.724Z",
    "uptimeSeconds": 35,
    "responseTimeMs": 81,
    "services": {
      "database": {
        "status": "connected",
        "latencyMs": 81,
        "engine": "MongoDB Atlas"
      },
      "media": {
        "status": "configured",
        "provider": "Cloudinary"
      },
      "auth": {
        "status": "configured",
        "algorithm": "HS256"
      }
    },
    "environment": "development"
  }
  ```
- **Uptime Monitoring:** Configure UptimeRobot, Pingdom, or BetterStack to ping `https://api.glamora.com/api/health` every 60 seconds.

### 6.2 Error Reporting Integration (Sentry)
Recommended installation before high-volume public marketing:
```bash
cd admin-web; npx @sentry/wizard@latest -i nextjs
cd ../Galmora; npx @sentry/wizard@latest -i react-native
```

---

## 7. ROLLBACK & DISASTER RECOVERY STRATEGY

| Scenario | Recovery Protocol | Estimated Recovery Time (RTO) | Data Loss Limit (RPO) |
| :--- | :--- | :--- | :--- |
| **Defective API Deployment** | Roll back to previous deployment in Vercel Dashboard (1 click) or revert Docker tag. | `< 60 seconds` | Zero data loss |
| **Database Corruption / Errant Admin Script** | Restore MongoDB Atlas cluster to Point-in-Time (e.g. 5 minutes before event). | `< 15 minutes` | `< 5 minutes` |
| **Regional Cloud Outage** | Atlas cross-region replica promotion; Vercel edge rerouting. | `< 5 minutes` | Zero data loss |
| **Compromised Secret (JWT/Cloudinary)** | Rotate key in hosting dashboard; redeploy backend; all active sessions cleanly invalidated. | `< 3 minutes` | Zero data loss |

