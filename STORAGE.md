# DIALLO HRMS — HOSTINGER PRODUCTION FILE STORAGE SPECIFICATION (PHASE 20)

---

## 1. Domain & URL Structure

- **Base URL**: `https://storage.diallo.com`
- **Upload API Endpoint**: `https://storage.diallo.com/api/upload.php`
- **Download API Endpoint**: `https://storage.diallo.com/api/download.php?file=...`

---

## 2. Directory Hierarchy

```
storage.diallo.com/
│
└── companies/
    └── {companyId}/
        ├── branding/
        │   └── logo_{timestamp}.png
        ├── company-documents/
        ├── policies/
        │   └── {policyId}_{timestamp}.pdf
        ├── expenses/
        │   └── {expenseId}_{timestamp}.jpg
        ├── recruitment/
        ├── assets/
        └── employees/
            └── {employeeId}/
                ├── profile/
                ├── identity/
                ├── contracts/
                ├── certificates/
                ├── payslips/
                ├── letters/
                ├── training/
                └── other/
```

---

## 3. Supported Formats & File Size Limits

| Category | Allowed Formats | Max File Size |
| :--- | :--- | :--- |
| **Profile Photos** | `JPG`, `JPEG`, `PNG`, `WEBP` | **2 MB** |
| **Expense Receipts** | `JPG`, `PNG`, `PDF` | **5 MB** |
| **Identity Documents** | `PDF`, `JPG`, `PNG` | **10 MB** |
| **Contracts & Letters** | `PDF`, `DOC`, `DOCX` | **15 MB** |
| **Company Policies** | `PDF`, `DOCX`, `XLSX` | **25 MB** |
| **General HR Docs** | `PDF`, `JPG`, `PNG`, `DOCX`, `XLSX` | **10 MB** |

---

## 4. Security & Access Control

1. **Path Traversal Protection**: Upload requests containing `..` or leading slashes are immediately rejected.
2. **Safe Filename Sanitization**: Filenames are cryptographically randomized into safe UUIDs (`doc_{timestamp}_{random}.{ext}`) to prevent filesystem collisions.
3. **Audit Trail**: Every file operation logs an append-only event (`FILE_UPLOAD`, `FILE_DOWNLOAD`, `FILE_DELETE`, `FILE_ACCESS_DENIED`) in Firestore `auditLogs`.
