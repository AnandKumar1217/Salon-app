# 🌸 GLAMORA PLATFORM — COMPLETE MONOREPO GUIDE

Welcome to the **Glamora Platform** repository.

Glamora is an enterprise-grade salon discovery, appointment booking, and salon management platform uniting offline salons with online appointment scheduling.

---

## 📁 Repository Structure

```
Galmora App/
├── Galmora/                     # Single Dynamic Android Mobile App (Expo SDK 58 / React Native)
│   ├── src/                     # Dynamic Customer Mode & Salon Owner Mode Screens
│   ├── functions/               # Firebase Cloud Functions (TypeScript backend)
│   ├── public-web/              # Public Web Booking Engine (salon/:slug)
│   ├── tests/                   # Mobile platform automated test suite (11 tests)
│   ├── firestore.rules          # Multi-tenant Firestore security rules with custom claims RBAC
│   ├── app.json                 # Single package com.glamora.app & Android App Links
│   └── README.md                # Comprehensive Android app documentation
│
├── admin-web/                   # Dedicated Super Admin Web Application (Next.js / Tailwind CSS)
│   ├── src/
│   │   ├── app/                 # Admin Dashboard, Salons, Customers, Bookings, Finance, Tickets, Audit Logs
│   │   ├── components/          # Reusable UI primitives, Modals, Sidebar, Topbar, AdminLayout
│   │   ├── context/             # Admin Authentication & Role State Management
│   │   └── lib/                 # Shared domain types, Firebase Admin SDK, Auth Guards, Audit Logger
│   ├── tests/                   # Admin Web automated test suite (12 tests)
│   └── README.md                # Super Admin Web documentation & deployment guide
│
└── README.md                    # Platform root overview (This file)
```

---

## 🚀 Quick Start Guide

### 1. Run Mobile App Tests
```powershell
cd Galmora
npm test
```
*Expected output: 11 tests passing.*

### 2. Start Mobile App Development Server
```powershell
cd Galmora
npx expo start
```
*Press `a` to run on an Android emulator or scan the QR code with Expo Go.*

### 3. Run Super Admin Web Tests
```powershell
cd admin-web
npm test
```
*Expected output: 12 tests passing.*

### 4. Start Super Admin Web Panel
```powershell
cd admin-web
npm run dev
```
*Opens on [http://localhost:3001](http://localhost:3001).*

---

## 🔐 Administrator Security Roles

| Role | Access Scope |
| :--- | :--- |
| **`SUPER_ADMIN`** | Unrestricted platform control, admin user provisioning, platform settings, immutable audit trail. |
| **`OPERATIONS_ADMIN`** | Salon onboarding verification, salon approve/reject/suspend actions, user status management, booking audit. |
| **`SUPPORT_ADMIN`** | Customer complaints, salon merchant support tickets, resolution notes. |
| **`FINANCE_ADMIN`** | Platform subscription billing, SaaS revenue tracking, financial reconciliation. |

---

## ⚡ Cross-Platform Synchronization

1. **Salon Approval Flow**: An administrator approves a pending salon application in the Super Admin Web Panel (`admin-web`). Cloud Functions update the owner's record, and the installed Glamora mobile app instantly unlocks **Salon Owner Mode** via real-time Firestore listeners.
2. **Unified Booking Engine**: Bookings made via the mobile app, public website (`/salon/:slug`), WhatsApp API, or salon walk-in counter appear in real-time on the Super Admin Booking Monitor.
3. **Financial Separation**: Customer service payments for salon haircuts/treatments are strictly separated from Glamora SaaS subscription fees paid by salon merchants.

