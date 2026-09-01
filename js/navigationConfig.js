// navigationConfig.js
export const navigation = {
  admin: [
    { label: "Dashboard", icon: "dashboard", route: "#dashboard" },
    { label: "People", icon: "users", children: [
        { label: "Employees", route: "#people" },
        { label: "Departments", route: "#departments" },
        { label: "Designations", route: "#designations" },
        { label: "Organization Chart", route: "#orgChart" },
        { label: "Onboarding", route: "#onboarding" },
        { label: "Exits", route: "#exits" }
    ]},
    { label: "Recruitment", icon: "briefcase", route: "#recruitment" },
    { label: "Attendance", icon: "clock", route: "#attendance" },
    { label: "Leave", icon: "calendar", route: "#leave" },
    { label: "Payroll", icon: "money", route: "#payroll" },
    { label: "Expenses", icon: "receipt", route: "#expenses" },
    { label: "Assets", icon: "laptop", route: "#assets" },
    { label: "Performance", icon: "chart", route: "#performance" },
    { label: "HR Requests", icon: "clipboard", route: "#hrRequests" },
    { label: "Workflows & Approvals", icon: "check-circle", route: "#approvals" },
    { label: "Communication", icon: "message", route: "#communication" },
    { label: "Compliance & HR", icon: "shield", route: "#compliance" },
    { label: "Reports", icon: "bar-chart", route: "#reports" },
    { label: "Settings", icon: "gear", children: [
        { label: "Company Settings", route: "#settings/company" },
        { label: "Branches / Locations", route: "#settings/branches" },
        { label: "Roles & Permissions", route: "#settings/roles" },
        { label: "User Management", route: "#settings/users" },
        { label: "Security & Audit", route: "#settings/security" },
        { label: "Notifications", route: "#settings/notifications" },
        { label: "System Configuration", route: "#settings/system" }
    ]}
  ],
  manager: [
    { label: "Dashboard", icon: "dashboard", route: "#dashboard" },
    { label: "My Team", icon: "users", route: "#myTeam" },
    { label: "People", icon: "users", route: "#people" },
    { label: "Attendance", icon: "clock", route: "#attendance" },
    { label: "Leave", icon: "calendar", route: "#leave" },
    { label: "Performance", icon: "chart", route: "#performance" },
    { label: "HR Requests", icon: "clipboard", route: "#hrRequests" },
    { label: "Workflows & Approvals", icon: "check-circle", route: "#approvals" },
    { label: "Communication", icon: "message", route: "#communication" },
    { label: "Reports", icon: "bar-chart", route: "#reports" },
    { label: "Settings", icon: "gear", route: "#settings" }
  ],
  employee: [
    { label: "Dashboard", icon: "dashboard", route: "#dashboard" },
    { label: "My Profile", icon: "user", route: "#myProfile" },
    { label: "My Attendance", icon: "clock", route: "#myAttendance" },
    { label: "My Leave", icon: "calendar", route: "#myLeave" },
    { label: "My Payroll", icon: "money", route: "#myPayroll" },
    { label: "My Expenses", icon: "receipt", route: "#myExpenses" },
    { label: "My Assets", icon: "laptop", route: "#myAssets" },
    { label: "My Performance", icon: "chart", route: "#myPerformance" },
    { label: "My Documents", icon: "folder", route: "#myDocuments" },
    { label: "HR Requests", icon: "clipboard", route: "#hrRequests" },
    { label: "Communication", icon: "message", route: "#communication" },
    { label: "Settings", icon: "gear", route: "#settings" }
  ]
};
