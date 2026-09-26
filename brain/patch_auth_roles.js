const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/firebase/auth-guard.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/normalizedRoleId === 'HR' \|\| normalizedRoleId === 'HR_MANAGER'/g, "normalizedRoleId === 'HR_MANAGER'");
c = c.replace(/id: 'HR'/g, "id: 'HR_MANAGER'");

c = c.replace(/} else if \(normalizedRoleId === 'MENTOR'\) \{\s*this\.userRole = \{ name: 'Mentor', id: 'MENTOR' \};\s*\} else if \(normalizedRoleId === 'TRAINER'\) \{\s*this\.userRole = \{ name: 'Trainer', id: 'TRAINER' \};/g, 
`} else if (normalizedRoleId === 'MENTOR_TRAINER') {
          this.userRole = { name: 'Mentor / Trainer', id: 'MENTOR_TRAINER' };
        } else if (normalizedRoleId === 'OPERATIONS_MANAGER') {
          this.userRole = { name: 'Operations Manager', id: 'OPERATIONS_MANAGER' };`);

// Fix switchRoles
c = c.replace(/} else if \(normalizedRole === 'MENTOR'\) \{\s*this\.permissions = window\.PermissionService \? PermissionService\.getUserPermissions\(\{ roleId: 'MENTOR' \}\) : new Set\(\['training\.\*', 'performance\.view', 'attendance\.view', 'leave\.view', 'ess\.view'\]\);\s*this\.userRole = \{ name: 'Mentor', id: 'MENTOR' \};\s*\} else if \(normalizedRole === 'TRAINER'\) \{\s*this\.permissions = window\.PermissionService \? PermissionService\.getUserPermissions\(\{ roleId: 'TRAINER' \}\) : new Set\(\['training\.\*', 'performance\.view', 'attendance\.punch', 'attendance\.view', 'leave\.view', 'leave\.create', 'own\.profile'\]\);\s*this\.userRole = \{ name: 'Trainer', id: 'TRAINER' \};/g, 
`} else if (normalizedRole === 'MENTOR_TRAINER') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'MENTOR_TRAINER' }) : new Set(['training.*', 'performance.view', 'attendance.punch', 'attendance.view', 'leave.view', 'leave.create', 'own.profile']);
      this.userRole = { name: 'Mentor / Trainer', id: 'MENTOR_TRAINER' };
    } else if (normalizedRole === 'OPERATIONS_MANAGER') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'OPERATIONS_MANAGER' }) : new Set(['team.view', 'performance.view', 'attendance.view', 'leave.view', 'ess.view', 'approvals.view', 'approvals.approve']);
      this.userRole = { name: 'Operations Manager', id: 'OPERATIONS_MANAGER' };
    } else if (normalizedRole === 'MANAGER') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'MANAGER' }) : new Set(['team.view', 'performance.view', 'attendance.view', 'leave.view', 'ess.view', 'approvals.view', 'approvals.approve']);
      this.userRole = { name: 'Manager', id: 'MANAGER' };`);

c = c.replace(/} else if \(normalizedRole === 'HR' \|\| normalizedRole === 'HR_MANAGER'\) \{\s*this\.permissions = window\.PermissionService \? PermissionService\.getUserPermissions\(\{ roleId: 'HR' \}\) : new Set\(\['\*\.\*'\]\);\s*this\.userRole = \{ name: 'HR Manager', id: 'HR' \};/g, 
`} else if (normalizedRole === 'HR_MANAGER') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'HR_MANAGER' }) : new Set(['*.*']);
      this.userRole = { name: 'HR Manager', id: 'HR_MANAGER' };`);

// Update the roleMaps
c = c.replace(/HR: 'HR Manager',/g, "HR_MANAGER: 'HR Manager',\n        MANAGER: 'Manager',\n        OPERATIONS_MANAGER: 'Operations Manager',");
c = c.replace(/MENTOR: 'Mentor',\s*TRAINER: 'Trainer',/g, "MENTOR_TRAINER: 'Mentor / Trainer',");

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED auth-guard.js');
