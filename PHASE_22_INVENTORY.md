# DIALLO HRMS — PHASE 22 COMPLETE APPLICATION INVENTORY
**Comprehensive Production Codebase & Architecture Ledger**

---

## 1. Frontend Core HTML & CSS Infrastructure

| Component | File Path | Responsibility |
| :--- | :--- | :--- |
| **Main Portal Shell** | [`index.html`](file:///D:/AYAN/HRMS/index.html) | Single-Page Application (SPA) shell, Top Navigation, Sidebar Drawer, Modals, Global Search |
| **Authentication Page** | [`login.html`](file:///D:/AYAN/HRMS/login.html) | Firebase Auth Login, Google OAuth, Password Reset, Registration |
| **Core Layout & Design System** | [`css/main.css`](file:///D:/AYAN/HRMS/css/main.css) | Design tokens, White + Blue / Dark + Blue themes, `.kpi-card`, `.data-table`, Modals |
| **Responsive Grid & Utilities** | [`css/utilities.css`](file:///D:/AYAN/HRMS/css/utilities.css) | Flexbox, CSS Grid layouts, spacing, typography, status badges |

---

## 2. Authentication & Client Core Coordination

| Module | File Path | Status | Functions & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Firebase Configuration** | [`js/firebase/firebase-config.js`](file:///D:/AYAN/HRMS/js/firebase/firebase-config.js) | Production | Firebase App, Auth, Firestore (Hostinger Storage used; Firebase Storage disabled) |
| **Authentication Guard** | [`js/firebase/auth-guard.js`](file:///D:/AYAN/HRMS/js/firebase/auth-guard.js) | Production | Session Token validation, Route interceptors, Role resolution, Logout |
| **Permission Engine** | [`js/auth/permissionService.js`](file:///D:/AYAN/HRMS/js/auth/permissionService.js) | Production | 7-Role Matrix, Dynamic wildcard permission check (`hasPermission`) |
| **Role Guard Directive** | [`js/auth/roleGuard.js`](file:///D:/AYAN/HRMS/js/auth/roleGuard.js) | Production | Client-side DOM action shielding and conditional rendering |
| **Client Router** | [`js/router.js`](file:///D:/AYAN/HRMS/js/router.js) | Production | 21 routes (`dashboard`, `people`, `attendance`, `leave`, `payroll`, `expenses`, `assets`, `documents`, `requests`, `workflows`, `recruitment`, `performance`, `reports`, `communication`, `compliance`, `security`, `qa`, `deployment`, `admin`, `users`, `settings`, `ess`) |
| **App Coordinator** | [`js/app.js`](file:///D:/AYAN/HRMS/js/app.js) | Production | Lifecycle bootstrap, Multi-tenant company switcher, Branch selector, Search modal |
| **Theme Engine** | [`js/theme.js`](file:///D:/AYAN/HRMS/js/theme.js) | Production | High-contrast Light / Dark mode toggling and persistence |
| **Toast Notifications** | [`js/toast.js`](file:///D:/AYAN/HRMS/js/toast.js) | Production | Non-blocking user feedback (`Toast.success`, `Toast.error`, `Toast.info`) |
| **Modal Manager** | [`js/modal.js`](file:///D:/AYAN/HRMS/js/modal.js) | Production | Dynamic accessible modal rendering, focus trap, and clean dismissal |
| **Table Component** | [`js/table.js`](file:///D:/AYAN/HRMS/js/table.js) | Production | Cursor pagination, header sorting, search filtering, empty states |
| **Form Utilities** | [`js/forms.js`](file:///D:/AYAN/HRMS/js/forms.js) | Production | Required field validation, numeric/date constraints, submit protection |
| **Charts Engine** | [`js/charts.js`](file:///D:/AYAN/HRMS/js/charts.js) | Production | Lightweight Canvas/SVG charts (Bar, Donut, Line) with empty state rendering |

---

## 3. Production Service Layer (Data & Business Logic)

| Service Module | File Path | Firestore Collections Handled |
| :--- | :--- | :--- |
| **`userService.js`** | [`js/services/userService.js`](file:///D:/AYAN/HRMS/js/services/userService.js) | `users`, `roles` |
| **`companyService.js`** | [`js/services/companyService.js`](file:///D:/AYAN/HRMS/js/services/companyService.js) | `companies`, `branches` |
| **`departmentService.js`**| [`js/services/departmentService.js`](file:///D:/AYAN/HRMS/js/services/departmentService.js) | `departments`, `designations` |
| **`employeeService.js`** | [`js/services/employeeService.js`](file:///D:/AYAN/HRMS/js/services/employeeService.js) | `employees`, `employeeHistory` |
| **`attendanceService.js`**| [`js/services/attendanceService.js`](file:///D:/AYAN/HRMS/js/services/attendanceService.js) | `attendanceRecords`, `punchLogs`, `attendanceSettings`, `attendanceRegularizations` |
| **`leaveService.js`** | [`js/services/leaveService.js`](file:///D:/AYAN/HRMS/js/services/leaveService.js) | `leaveApplications`, `leaveBalances`, `leaveTypes` |
| **`statutoryEngine.js`** | [`js/services/statutoryEngine.js`](file:///D:/AYAN/HRMS/js/services/statutoryEngine.js) | EPF (12%), ESIC (0.75%), State PT Slabs |
| **`payrollService.js`** | [`js/services/payrollService.js`](file:///D:/AYAN/HRMS/js/services/payrollService.js) | `payrollRuns`, `payslips`, `salaryStructures` |
| **`expenseService.js`** | [`js/services/expenseService.js`](file:///D:/AYAN/HRMS/js/services/expenseService.js) | `expenses`, `expenseCategories`, `expensePolicies` |
| **`assetService.js`** | [`js/services/assetService.js`](file:///D:/AYAN/HRMS/js/services/assetService.js) | `assets`, `assetCategories`, `assetAssignments`, `assetMaintenance` |
| **`documentService.js`** | [`js/services/documentService.js`](file:///D:/AYAN/HRMS/js/services/documentService.js) | `documents`, `employeeDocuments`, `documentTemplates` |
| **`recruitmentService.js`**| [`js/services/recruitmentService.js`](file:///D:/AYAN/HRMS/js/services/recruitmentService.js) | `jobRequisitions`, `candidates`, `jobApplications`, `interviewFeedback` |
| **`performanceService.js`**| [`js/services/performanceService.js`](file:///D:/AYAN/HRMS/js/services/performanceService.js) | `goals`, `reviewCycles`, `performanceReviews`, `360Feedback` |
| **`hrService.js`** | [`js/services/hrService.js`](file:///D:/AYAN/HRMS/js/services/hrService.js) | `employmentRecords`, `probationRecords`, `promotions`, `transfers`, `salaryHistory`, `hrCases`, `grievances` |
| **`complianceService.js`**| [`js/services/complianceService.js`](file:///D:/AYAN/HRMS/js/services/complianceService.js) | `certifications`, `trainingRecords`, `policyAcknowledgements`, `complianceRecords` |
| **`letterService.js`** | [`js/services/letterService.js`](file:///D:/AYAN/HRMS/js/services/letterService.js) | `letterTemplates`, `employeeLetters` |
| **`workflowService.js`** | [`js/services/workflowService.js`](file:///D:/AYAN/HRMS/js/services/workflowService.js) | `workflowDefinitions`, `workflowInstances`, `approvalTasks`, `workflowHistory` |
| **`notificationService.js`**| [`js/services/notificationService.js`](file:///D:/AYAN/HRMS/js/services/notificationService.js) | `notifications`, `notificationPreferences` |
| **`announcementService.js`**| [`js/services/announcementService.js`](file:///D:/AYAN/HRMS/js/services/announcementService.js) | `announcements` |
| **`reportService.js`** | [`js/services/reportService.js`](file:///D:/AYAN/HRMS/js/services/reportService.js) | `savedReports`, `analytics`, `scheduledReports` |
| **`auditService.js`** | [`js/services/auditService.js`](file:///D:/AYAN/HRMS/js/services/auditService.js) | `auditLogs` (Append-Only) |
| **`securityService.js`** | [`js/services/securityService.js`](file:///D:/AYAN/HRMS/js/services/securityService.js) | `securityEvents`, `securitySettings`, `accessReviews` |
| **`incidentService.js`** | [`js/services/incidentService.js`](file:///D:/AYAN/HRMS/js/services/incidentService.js) | `securityIncidents` |
| **`qaService.js`** | [`js/services/qaService.js`](file:///D:/AYAN/HRMS/js/services/qaService.js) | `qaBugs`, `qaTestRuns` |
| **`hostingerStorageService.js`**| [`js/services/hostingerStorageService.js`](file:///D:/AYAN/HRMS/js/services/hostingerStorageService.js) | Hostinger Upload/Download API Proxy (`storage.diallo.com`) |

---

## 4. View Presentation Modules

| View Module | File Path | Route | Supported Roles |
| :--- | :--- | :--- | :--- |
| **`dashboard-view.js`** | [`js/views/dashboard-view.js`](file:///D:/AYAN/HRMS/js/views/dashboard-view.js) | `#dashboard` | ALL Roles (Switches by Role) |
| **`admin-dashboard-view.js`**| [`js/views/admin-dashboard-view.js`](file:///D:/AYAN/HRMS/js/views/admin-dashboard-view.js) | `#dashboard` | `SUPER_ADMIN`, `COMPANY_ADMIN` |
| **`manager-dashboard-view.js`**| [`js/views/manager-dashboard-view.js`](file:///D:/AYAN/HRMS/js/views/manager-dashboard-view.js) | `#dashboard` | `MANAGER` |
| **`employee-dashboard-view.js`**| [`js/views/employee-dashboard-view.js`](file:///D:/AYAN/HRMS/js/views/employee-dashboard-view.js) | `#dashboard` | `EMPLOYEE` |
| **`people-view.js`** | [`js/views/people-view.js`](file:///D:/AYAN/HRMS/js/views/people-view.js) | `#people` | `SUPER_ADMIN`, `COMPANY_ADMIN`, `HR` |
| **`attendance-view.js`** | [`js/views/attendance-view.js`](file:///D:/AYAN/HRMS/js/views/attendance-view.js) | `#attendance` | ALL Roles |
| **`leave-view.js`** | [`js/views/leave-view.js`](file:///D:/AYAN/HRMS/js/views/leave-view.js) | `#leave` | ALL Roles |
| **`payroll-view.js`** | [`js/views/payroll-view.js`](file:///D:/AYAN/HRMS/js/views/payroll-view.js) | `#payroll` | `SUPER_ADMIN`, `COMPANY_ADMIN`, `FINANCE`, `HR` |
| **`expenses-view.js`** | [`js/views/expenses-view.js`](file:///D:/AYAN/HRMS/js/views/expenses-view.js) | `#expenses` | ALL Roles |
| **`assets-view.js`** | [`js/views/assets-view.js`](file:///D:/AYAN/HRMS/js/views/assets-view.js) | `#assets` | `SUPER_ADMIN`, `COMPANY_ADMIN`, `HR` |
| **`documents-view.js`** | [`js/views/documents-view.js`](file:///D:/AYAN/HRMS/js/views/documents-view.js) | `#documents` | ALL Roles |
| **`requests-view.js`** | [`js/views/requests-view.js`](file:///D:/AYAN/HRMS/js/views/requests-view.js) | `#requests` | ALL Roles |
| **`workflows-view.js`** | [`js/views/workflows-view.js`](file:///D:/AYAN/HRMS/js/views/workflows-view.js) | `#workflows` | `SUPER_ADMIN`, `COMPANY_ADMIN`, `HR`, `MANAGER` |
| **`recruitment-view.js`**| [`js/views/recruitment-view.js`](file:///D:/AYAN/HRMS/js/views/recruitment-view.js) | `#recruitment` | `SUPER_ADMIN`, `COMPANY_ADMIN`, `HR` |
| **`performance-view.js`**| [`js/views/performance-view.js`](file:///D:/AYAN/HRMS/js/views/performance-view.js) | `#performance` | ALL Roles |
| **`comms-view.js`** | [`js/views/comms-view.js`](file:///D:/AYAN/HRMS/js/views/comms-view.js) | `#communication` | ALL Roles |
| **`compliance-view.js`** | [`js/views/compliance-view.js`](file:///D:/AYAN/HRMS/js/views/compliance-view.js) | `#compliance` | `SUPER_ADMIN`, `COMPANY_ADMIN`, `HR` |
| **`reports-view.js`** | [`js/views/reports-view.js`](file:///D:/AYAN/HRMS/js/views/reports-view.js) | `#reports` | `SUPER_ADMIN`, `COMPANY_ADMIN`, `HR`, `FINANCE` |
| **`security-view.js`** | [`js/views/security-view.js`](file:///D:/AYAN/HRMS/js/views/security-view.js) | `#security` | `SUPER_ADMIN`, `COMPANY_ADMIN` |
| **`qa-view.js`** | [`js/views/qa-view.js`](file:///D:/AYAN/HRMS/js/views/qa-view.js) | `#qa` | `SUPER_ADMIN`, `COMPANY_ADMIN` |
| **`deployment-view.js`** | [`js/views/deployment-view.js`](file:///D:/AYAN/HRMS/js/views/deployment-view.js) | `#deployment` | `SUPER_ADMIN`, `COMPANY_ADMIN` |
| **`admin-view.js`** | [`js/views/admin-view.js`](file:///D:/AYAN/HRMS/js/views/admin-view.js) | `#admin` | `SUPER_ADMIN`, `COMPANY_ADMIN` |
| **`users-view.js`** | [`js/views/users-view.js`](file:///D:/AYAN/HRMS/js/views/users-view.js) | `#users` | `SUPER_ADMIN`, `COMPANY_ADMIN` |
| **`settings-view.js`** | [`js/views/settings-view.js`](file:///D:/AYAN/HRMS/js/views/settings-view.js) | `#settings` | ALL Roles |
| **`ess-view.js`** | [`js/views/ess-view.js`](file:///D:/AYAN/HRMS/js/views/ess-view.js) | `#ess` | `EMPLOYEE` |

---

## 5. Hostinger Storage & Cloud Function Endpoints

| Component | Path / Endpoint | Responsibility |
| :--- | :--- | :--- |
| **Hostinger Upload Handler** | `https://storage.diallo.com/api/upload.php` | Safe multipart file intake, MIME check, Path traversal protection |
| **Hostinger Preview & Download** | `https://storage.diallo.com/api/download.php` | Controlled authenticated file streaming and inline headers |
| **Hostinger Security Rules** | `hostinger-backend/.htaccess` | Directory index blocking, HTTPS enforcement, script execution prevention |
| **Cloud Functions Engine** | `functions/index.js` | Auth user claims synchronization, scheduled daily HR compliance worker |

---

## 6. Complete Firestore Database Collections List (79 Collections)

`users`, `roles`, `companies`, `companySettings`, `branches`, `departments`, `designations`, `jobLevels`, `employmentTypes`, `workLocations`, `shifts`, `holidays`, `leaveTypes`, `policies`, `organizationHistory`, `grades`, `costCenters`, `employees`, `employeeHistory`, `onboardingTasks`, `employeeExits`, `attendanceRecords`, `punchLogs`, `attendanceSettings`, `attendanceRegularizations`, `leaveApplications`, `leaveBalances`, `salaryStructures`, `payrollRuns`, `payslips`, `approvalRequests`, `goals`, `reviewCycles`, `performanceReviews`, `360Feedback`, `jobRequisitions`, `jobPositions`, `candidates`, `jobApplications`, `interviewFeedback`, `jobOffers`, `announcements`, `notifications`, `expenses`, `expenseCategories`, `expensePolicies`, `expenseApprovals`, `assets`, `assetCategories`, `assetAssignments`, `assetReturns`, `assetMaintenance`, `vendors`, `documents`, `employeeDocuments`, `documentRequests`, `employeeRequests`, `requestHistory`, `documentTemplates`, `savedReports`, `analytics`, `scheduledReports`, `userDevices`, `notificationPreferences`, `notificationTemplates`, `notificationDeliveries`, `workflowDefinitions`, `workflowInstances`, `approvalTasks`, `workflowHistory`, `workflowDelegations`, `employmentRecords`, `probationRecords`, `probationReviews`, `promotions`, `transfers`, `salaryHistory`, `letterTemplates`, `employeeLetters`, `certifications`, `trainingRecords`, `hrCases`, `hrCaseEvents`, `grievances`, `hrRequests`, `complianceRecords`, `policyAcknowledgements`, `auditLogs`, `securityEvents`, `securityIncidents`, `securitySettings`, `accessReviews`, `userSessions`, `operationLogs`, `qaBugs`, `qaTestRuns`.
