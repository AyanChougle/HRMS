// navigationConfig.js
// Diallo HRMS - Canonical 7 Top-Level Sections
const navigation = {
  admin: [
    { label: "Dashboard", icon: "dashboard", route: "#dashboard" },
    { label: "User Accounts & Roles", icon: "users", route: "#users" },
    { label: "Role & Page Permissions", icon: "shield", route: "#role-permissions" },
    { label: "Employee Directory", icon: "users", route: "#people" },
    { label: "Attendance Hub", icon: "clock", route: "#attendance" },
    { label: "Leave Management", icon: "calendar", route: "#leave" },
    { label: "Compliance & Dossiers", icon: "shield", route: "#compliance" },
    { label: "System Settings", icon: "gear", route: "#settings" },
    { label: "My Profile (ESS)", icon: "user", route: "#ess" }
  ],
  hr: [
    { label: "Dashboard", icon: "dashboard", route: "#dashboard" },
    { label: "Employee Directory", icon: "users", route: "#people" },
    { label: "Onboard Employee", icon: "user-plus", route: "#create-employee" },
    { label: "Attendance & Rosters", icon: "clock", route: "#attendance" },
    { label: "Leave Management", icon: "calendar", route: "#leave" },
    { label: "Compliance & Verification", icon: "shield", route: "#compliance" },
    { label: "User Logins", icon: "users", route: "#users" },
    { label: "Communication Hub", icon: "message", route: "#communication" },
    { label: "My Profile (ESS)", icon: "user", route: "#ess" }
  ],
  ops: [
    { label: "Dashboard (OPS)", icon: "dashboard", route: "#dashboard" },
    { label: "Operational Hierarchy", icon: "users", route: "#people" },
    { label: "Team Attendance Oversight", icon: "clock", route: "#attendance" },
    { label: "Shift Approvals & Leave", icon: "calendar", route: "#leave" },
    { label: "Operational Compliance", icon: "shield", route: "#compliance" },
    { label: "Performance Overview", icon: "chart", route: "#performance" },
    { label: "Communication", icon: "message", route: "#communication" },
    { label: "My Profile (ESS)", icon: "user", route: "#ess" }
  ],
  compliance: [
    { label: "Dashboard", icon: "dashboard", route: "#dashboard" },
    { label: "Compliance Dossiers", icon: "shield", route: "#compliance" },
    { label: "Document Verification", icon: "folder", route: "#documents" },
    { label: "Audit Reports", icon: "bar-chart", route: "#reports" },
    { label: "Attendance Records", icon: "clock", route: "#attendance" },
    { label: "Leave Records", icon: "calendar", route: "#leave" },
    { label: "My Profile (ESS)", icon: "user", route: "#ess" }
  ],
  manager: [
    { label: "Dashboard", icon: "dashboard", route: "#dashboard" },
    { label: "Department Team", icon: "users", route: "#people" },
    { label: "Team Attendance", icon: "clock", route: "#attendance" },
    { label: "Leave Approvals", icon: "calendar", route: "#leave" },
    { label: "Performance Reviews", icon: "chart", route: "#performance" },
    { label: "Communication", icon: "message", route: "#communication" },
    { label: "My Profile (ESS)", icon: "user", route: "#ess" }
  ],
  tl: [
    { label: "Dashboard (TL)", icon: "dashboard", route: "#dashboard" },
    { label: "My Direct Team", icon: "users", route: "#people" },
    { label: "Live Shift Attendance", icon: "clock", route: "#attendance" },
    { label: "Team Leave Requests", icon: "calendar", route: "#leave" },
    { label: "Performance", icon: "chart", route: "#performance" },
    { label: "Communication", icon: "message", route: "#communication" },
    { label: "My Profile (ESS)", icon: "user", route: "#ess" }
  ],
  employee: [
    { label: "Dashboard", icon: "dashboard", route: "#dashboard" },
    { label: "My Profile (ESS)", icon: "user", route: "#ess" },
    { label: "My Attendance & Breaks", icon: "clock", route: "#attendance" },
    { label: "My Leave Balance", icon: "calendar", route: "#leave" },
    { label: "My Documents & Policies", icon: "shield", route: "#compliance" },
    { label: "Notice Board", icon: "message", route: "#communication" }
  ]
};

if (typeof window !== 'undefined') {
  window.navigationConfig = navigation;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = navigation;
}
