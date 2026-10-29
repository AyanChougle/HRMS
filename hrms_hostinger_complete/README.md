# Diallo HRMS — Enterprise Cloud Suite (Phase 2)

Diallo HRMS is an enterprise-grade Human Resource Management System built with **Vanilla HTML5, CSS3, JavaScript (ES6+)**, and powered by **Firebase Backend Services** (Firebase Authentication, Cloud Firestore, Firebase Storage, and Security Rules).

---

## 🚀 Phase 2 Architecture

```
                    DIALLO HRMS (Pure Vanilla JS Frontend)
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
       Firebase Authentication  Cloud Firestore   Firebase Storage
        • Email / Password       • Multi-tenant     • Employee Docs
        • Auth Guards / State    • CRUD Services    • Profile Photos
        • Role & Permissions     • Audit Logging    • Upload Meta
```

---

## 🔒 Security & Authentication
- **Firebase Authentication**: Session persistence, Email & Password sign-in, Sign-up, Password Recovery (`forgot-password.html`), and Sign-out.
- **Route Protection**: `AuthGuard.init()` ensures unauthenticated visitors cannot access application pages and redirects them to `login.html`.
- **Role-Based Access**: Role definitions (`SUPER_ADMIN`, `HR`, `PAYROLL`, `MANAGER`, `EMPLOYEE`) and `hasPermission(permissionName)` helper.
- **Security Rules**: Production-grade `firestore.rules` and `storage.rules` enforcing tenant boundary checks and role-based permissions at the database level.
- **Audit Logging**: Immutable action history in `auditLogs` collection for every create, update, and deactivation action.

---

## 📁 Project Structure

```
D:\AYAN\HRMS/
├── index.html                  # Protected main application shell
├── login.html                  # SaaS authentication portal
├── forgot-password.html        # Password reset page
├── firestore.rules             # Cloud Firestore security rules
├── storage.rules               # Firebase Storage security rules
├── README.md                   # Documentation
├── css/                        # CSS variables, layout, components, responsive
└── js/
    ├── firebase/
    │   ├── firebase-config.js  # Centralized Firebase initialization (Project: hrms-3b9d9)
    │   └── auth-guard.js       # Auth listener, session state & permission checks
    ├── services/
    │   ├── auditService.js     # System audit trail logger
    │   ├── authService.js      # Sign-in, sign-up, password reset
    │   ├── userService.js      # User profiles & role assignments
    │   ├── companyService.js   # Multi-company legal entities & branches
    │   ├── departmentService.js# Departments, designations, grades & cost centers
    │   ├── employeeService.js  # Real Firestore Employee CRUD & soft deactivation
    │   ├── attendanceService.js# Live punch logs & daily attendance records
    │   ├── leaveService.js     # Leave applications, balances & status updates
    │   ├── approvalService.js  # Multi-module approval queue
    │   ├── payrollService.js   # Salary structures & monthly payroll batches
    │   ├── announcementService.js # Organization broadcast notices
    │   ├── notificationService.js # In-app notification queue
    │   ├── storageService.js   # Document & avatar uploads to Firebase Storage
    │   └── seedService.js      # One-time bootstrap utility for new setups
    ├── views/                  # View renderers connected to Firestore services
    └── app.js                  # Application coordinator & header switchers
```

---

## ⚡ How to Run
Open `login.html` directly in your browser or run via local HTTP server:

```bash
cd D:\AYAN\HRMS
python -m http.server 8080
```
Navigate to `http://localhost:8080/login.html` to sign in.