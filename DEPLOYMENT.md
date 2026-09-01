# DIALLO HRMS — PRODUCTION DEPLOYMENT GUIDE (PHASE 20)

This document provides complete instructions for deploying **Diallo HRMS** into production with **Firebase Authentication**, **Cloud Firestore**, **Firebase Cloud Functions**, and **Hostinger Dedicated File Storage** (`storage.diallo.com`).

---

## 1. Production Architecture Overview

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | Vanilla HTML5 / CSS3 / ES6+ JS | UI, Client Routing, Theme & Forms (Zero Frameworks) |
| **Authentication** | Firebase Authentication | Identity, Google Login, Session Integrity |
| **Database** | Cloud Firestore | Multi-tenant Collections & Real-Time Sync |
| **Server Logic** | Firebase Cloud Functions | Webhooks, Scheduled Jobs & Claims Assignment |
| **File Storage** | **Hostinger Storage (`storage.diallo.com`)** | **All File Binaries (Firebase Storage is Disabled)** |

---

## 2. Production Domain & DNS Configuration

1. **Primary HRMS Application**: `https://hrms.diallo.com` (Pointing to hosting server with SSL)
2. **Dedicated Storage Subdomain**: `https://storage.diallo.com` (Pointing to Hostinger hosting directory)
3. **CORS Headers**: Configured in Hostinger `.htaccess` and `upload.php` to restrict uploads strictly to `https://hrms.diallo.com`.

---

## 3. Hostinger Storage Setup

1. Log into **Hostinger hPanel** &rarr; **File Manager**.
2. Navigate to `public_html/storage/` for `storage.diallo.com`.
3. Upload the backend scripts located in `hostinger-backend/`:
   - `upload.php`
   - `download.php`
   - `.htaccess`
4. Set directory permissions:
   - `/storage/companies/` &rarr; `0755`
   - `/api/*.php` &rarr; `0644`
5. Verify SSL Certificate is active for `storage.diallo.com`.

---

## 4. Cloud Firestore & Security Rules Deployment

Deploy Firestore rules covering all Phase 1 to Phase 20 collections:

```bash
firebase deploy --only firestore:rules
```

---

## 5. Cloud Functions Deployment

Navigate to the `functions/` directory and deploy to Firebase:

```bash
cd functions
npm install
firebase deploy --only functions
```

---

## 6. Pre-Launch Verification Checklist

- [x] Hostinger Storage endpoint responding at `https://storage.diallo.com/api/upload.php`
- [x] Firebase Storage completely disabled across all client services
- [x] Firestore multi-tenant `companyId` partitioning verified
- [x] Standardized `.kpi-card` components, 0 emojis, 0 colored left/top borders
- [x] Append-only audit logging active for all file actions (`FILE_UPLOAD`, `FILE_DOWNLOAD`, `FILE_DELETE`)
