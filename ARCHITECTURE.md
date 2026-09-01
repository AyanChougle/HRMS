# DIALLO HRMS — OFFICIAL PRODUCTION ARCHITECTURE (PHASE 20)

```
                    DIALLO HRMS
                         │
                         ▼
                HTML / CSS / JS (ES6+)
                         │
                         ▼
              FIREBASE AUTHENTICATION
                         │
                         ▼
                   USER IDENTITY
                         │
               ┌─────────┴─────────┐
               ▼                   ▼
          FIRESTORE          CLOUD FUNCTIONS
       (All Collections)           │
               │                   ├── Auth Claims Sync
               │                   ├── Scheduled Compliance Reminders
               │                   └── Storage Authorization Proxy
               │
               ▼
       DOCUMENT METADATA
               │
               ▼
        HOSTINGER STORAGE
       (storage.diallo.com)
```

---

## Component Separation

1. **Authentication (Firebase Auth Only)**:
   - Manages user identity, JWT session tokens, email verification, and password resets.
   - Zero custom passwords stored in Firestore.

2. **Database (Cloud Firestore)**:
   - Stores structured document metadata (`documentId`, `companyId`, `employeeId`, `storagePath`, `fileUrl`, `fileSize`, `uploadedBy`, `createdAt`).

3. **Backend Serverless (Firebase Cloud Functions)**:
   - Executes background workers, daily scheduled compliance audits, and role sync.

4. **Binary File Storage (Hostinger Storage Only)**:
   - Stores all uploaded files, profile photos, identity cards, appointment letters, payslips, expense receipts, and company policies under `https://storage.diallo.com`.
   - **Firebase Storage is NOT used**.
