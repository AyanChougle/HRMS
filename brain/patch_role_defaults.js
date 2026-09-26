const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/services/roleAccessService.js';
let c = fs.readFileSync(path, 'utf8');

const oldDefaults = `  DEFAULT_ROLE_PAGES: {
    SUPER_ADMIN: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave',
      'compliance', 'payroll', 'recruitment', 'expenses', 'assets', 'performance',
      'documents', 'requests', 'workflows', 'communication', 'reports', 'role-permissions',
      'settings', 'ess'
    ],
    COMPANY_ADMIN: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave',
      'compliance', 'payroll', 'recruitment', 'expenses', 'assets', 'performance',
      'documents', 'requests', 'workflows', 'communication', 'reports', 'settings', 'ess'
    ],
    ADMIN: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave',
      'compliance', 'payroll', 'recruitment', 'expenses', 'assets', 'performance',
      'documents', 'requests', 'workflows', 'communication', 'reports', 'settings', 'ess'
    ],
    HR_MANAGER: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave', 'payroll',
      'recruitment', 'compliance', 'documents', 'requests', 'communication', 'reports', 'ess'
    ],
    HR: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave', 'payroll',
      'recruitment', 'compliance', 'documents', 'requests', 'communication', 'reports', 'ess'
    ],
    MANAGER: [
      'dashboard', 'people', 'attendance', 'leave', 'performance', 'compliance',
      'workflows', 'requests', 'communication', 'reports', 'ess'
    ],
    TEAM_LEAD: [
      'dashboard', 'people', 'attendance', 'leave', 'performance', 'compliance',
      'workflows', 'requests', 'communication', 'reports', 'ess'
    ],
    MENTOR: [
      'dashboard', 'training', 'attendance', 'leave', 'performance', 'compliance',
      'documents', 'communication', 'ess'
    ],
    TRAINER: [
      'dashboard', 'training', 'create-employee', 'attendance', 'leave', 'performance',
      'compliance', 'documents', 'communication', 'ess'
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

const newDefaults = `  DEFAULT_ROLE_PAGES: {
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

c = c.replace(oldDefaults, newDefaults);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED roleAccessService.js');
