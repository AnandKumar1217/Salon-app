# Glamora Super Admin Web Panel & Central REST API

Centralized, enterprise-grade administration and multi-tenant operations control panel for the **Glamora** platform.

Integrates seamlessly with the **Glamora Mobile Application** (Android & iOS `com.glamora.app`) and the **Customer Booking Website** (`public-web/`) through their shared **MongoDB Atlas** database, **Cloudinary** media storage, and **Next.js REST API**.

---

## 1. System Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │            GLAMORA PLATFORM                  │
                  └───────┬──────────────┬───────────────┬───────┘
                          │              │               │
                          ▼              ▼               ▼
             ┌─────────────────────┐ ┌───────────────┐ ┌─────────────────────┐
             │ GLAMORA MOBILE APP  │ │ CUSTOMER WEB  │ │ GLAMORA ADMIN WEB   │
             │ (Android & iOS)     │ │ (public-web/) │ │ (admin-web/)        │
             │ • Customer Mode     │ │ • Discovery   │ │ • Super Admin       │
             │ • Salon Owner Mode  │ │ • Web Booking │ │ • Operations Admin  │
             │ • Expo Push Client  │ │ • Deep Links  │ │ • Support & Finance │
             └──────────┬──────────┘ └───────┬───────┘ └──────────┬──────────┘
                        │                    │                    │
                        └────────────────────┼────────────────────┘
                                             │
                                             ▼
             ┌───────────────────────────────────────────────────────────────┐
             │                 CENTRAL NEXT.JS BACKEND API                   │
             │  • JWT + bcrypt Authentication + Hardware Keystore            │
             │  • Server-Side RBAC (Customer, Owner, Admin)                  │
             │  • CORS & CSRF Defense (Allowlist Origin Echoing)             │
             │  • Rate Limiting (IP + Account Scoped)                        │
             │  • Expo Push HTTP/2 Gateway Dispatcher                        │
             └───────────────────────┬───────────────────┬───────────────────┘
                                     │                   │
                                     ▼                   ▼
                      ┌─────────────────────────┐  ┌─────────────────────────┐
                      │      MONGODB ATLAS      │  │       CLOUDINARY        │
                      │  • users / salons       │  │  • Salon Covers / Logos  │
                      │  • bookings / payments  │  │  • Profile Avatars       │
                      │  • push_tokens / notifs │  │  • Upload Presets        │
                      │  • admin_audit_logs     │  │  • Signed Transformations│
                      └─────────────────────────┘  └─────────────────────────┘
```

---

## 2. Administrator Security Roles & Server-Side RBAC

Admin authorization is strictly enforced on the server via cryptographically signed JWT tokens and HTTP-only cookies (`glamora_admin_token`). Normal users or salon owners cannot gain admin privileges by modifying client-side state.

| Role | Access Level & Responsibilities |
| :--- | :--- |
| **`SUPER_ADMIN`** | Unrestricted platform authority. Provisions admin accounts, configures platform operating parameters, and accesses all financial and audit reports. |
| **`OPERATIONS_ADMIN`** | Salon onboarding verification, approving/rejecting/suspending salons, managing customer and salon owner account statuses, and monitoring cross-channel bookings. |
| **`SUPPORT_ADMIN`** | Customer and salon owner complaint ticket management, assigning tickets, logging internal notes, and resolving disputes. |
| **`FINANCE_ADMIN`** | Platform subscription billing management, tracking SaaS merchant revenues, monitoring customer salon service volumes, and verifying payment transactions. |

---

## 3. Key Modules

### A. Salon Onboarding & Management (`/salons`)
- Review submitted salon business information, owner details, operating hours, and trade license / GST records.
- **Approve Salon**: Automatically unlocks **Salon Owner Mode** in the owner's mobile app and publishes the listing on the discovery engine.
- **Reject Salon**: Requires mandatory justification; dispatches real-time push notification and allows re-application.
- **Suspend Salon**: Requires mandatory reason; halts public booking, pauses online appointment scheduling, and preserves all historical booking records.

### B. Push Notification Engine
- Powered by Expo Push Gateway (HTTP/2) connecting to Apple APNs and Google FCM v1.
- Automatic push dispatch on booking creation, status confirmation, delays, and cancellations.
- Zero Firebase SDK client dependencies.
