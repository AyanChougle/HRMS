const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/services/roleAccessService.js';
let content = fs.readFileSync(filePath, 'utf8');

// Update label to Compliance & HR Policies
content = content.replace(
  `{ key: 'compliance', label: 'Master HR Policies & Rules', category: 'Compliance', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }`,
  `{ key: 'compliance', label: 'Compliance & HR Policies', category: 'Compliance', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }`
);

const oldDefaults = `  DEFAULT_ROLE_PAGES: {
    SUPER_ADMIN: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave',
      'compliance', 'payroll', 'recruitment', 'expenses', 'assets', 'performance',
      'documents', 'requests', 'workflows', 'communication', 'reports', 'role-permissions',
      'settings', 'ess'
    ],
    HR_MANAGER: [
      'dashboard', 'people', 'create-employee', 'attendance', 'leave', 'payroll',
      'performance', 'requests', 'workflows', 'compliance', 'reports', 'documents', 'recruitment', 'communication', 'ess'
    ],
    MANAGER: [
      'dashboard', 'people', 'attendance', 'leave', 'performance', 'requests',
      'workflows', 'reports', 'communication', 'ess'
    ],
    OPERATIONS_MANAGER: [
      'dashboard', 'people', 'attendance', 'leave', 'performance', 'requests',
      'workflows', 'reports', 'communication', 'ess'
    ],
    TEAM_LEAD: [
      'dashboard', 'people', 'attendance', 'leave', 'performance', 'requests',
      'workflows', 'communication', 'ess'
    ],
    MENTOR_TRAINER: [
      'dashboard', 'training', 'attendance', 'leave', 'performance',
      'communication', 'ess'
    ],
    TRAINEE: [
      'dashboard', 'training', 'attendance', 'leave',
      'documents', 'communication', 'ess'
    ],
    EMPLOYEE: [
      'dashboard', 'attendance', 'leave', 'expenses', 'assets', 'performance',
      'documents', 'requests', 'communication', 'ess'
    ]
  },`;

const newDefaults = `  DEFAULT_ROLE_PAGES: {
    SUPER_ADMIN: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave',
      'compliance', 'payroll', 'recruitment', 'expenses', 'assets', 'performance',
      'documents', 'requests', 'workflows', 'communication', 'reports', 'role-permissions',
      'settings', 'ess'
    ],
    HR_MANAGER: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave', 'payroll',
      'recruitment', 'compliance', 'documents', 'requests', 'workflows', 'communication', 'reports', 'ess'
    ],
    MANAGER: [
      'dashboard', 'people', 'attendance', 'leave', 'performance', 'compliance',
      'workflows', 'requests', 'communication', 'reports', 'ess'
    ],
    OPERATIONS_MANAGER: [
      'dashboard', 'people', 'attendance', 'leave', 'performance', 'compliance',
      'workflows', 'requests', 'communication', 'reports', 'ess'
    ],
    TEAM_LEAD: [
      'dashboard', 'people', 'attendance', 'leave', 'performance', 'compliance',
      'workflows', 'requests', 'communication', 'ess'
    ],
    MENTOR_TRAINER: [
      'dashboard', 'training', 'attendance', 'leave', 'performance', 'compliance',
      'documents', 'communication', 'ess'
    ],
    TRAINEE: [
      'dashboard', 'training', 'attendance', 'leave', 'compliance',
      'documents', 'communication', 'ess'
    ],
    EMPLOYEE: [
      'dashboard', 'attendance', 'leave', 'expenses', 'assets', 'performance',
      'compliance', 'documents', 'requests', 'communication', 'ess'
    ]
  },`;

content = content.replace(oldDefaults, newDefaults);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched roleAccessService.js with Compliance & HR Policies label and official role defaults');
