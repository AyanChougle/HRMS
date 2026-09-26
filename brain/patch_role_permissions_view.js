const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/views/role-permissions-view.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldRolesList = `    const rolesList = [
      { id: 'SUPER_ADMIN', name: 'Super Administrator', desc: 'Root administrator with full access to all settings and modules' },
      { id: 'COMPANY_ADMIN', name: 'Company Administrator', desc: 'Enterprise management for legal entity' },
      { id: 'HR', name: 'HR Manager', desc: 'Employee onboarding, attendance, leave approval, and compliance' },
      { id: 'TRAINER', name: 'Corporate Trainer (Mentor)', desc: '7-day module tracking, assessments, and floor handover' },
      { id: 'TRAINEE', name: 'Graduate Trainee / Intern', desc: '7-day modules, mentor contact, company policy, and daily punches' },
      { id: 'EMPLOYEE', name: 'Employee (ESS)', desc: 'General staff self-service workspace' }
    ];`;

const newRolesList = `    const rolesList = [
      { id: 'SUPER_ADMIN', name: 'Super Administrator', desc: 'Root system administrator with global access across all companies and modules' },
      { id: 'HR_MANAGER', name: 'HR Manager', desc: 'Company-level HR operations, employee lifecycle, payroll, compliance, and terminations' },
      { id: 'MANAGER', name: 'Manager', desc: 'Departmental operational manager overseeing assigned organizational areas and teams' },
      { id: 'OPERATIONS_MANAGER', name: 'Operations Manager', desc: 'Operations management through Team Leaders and team performance oversight' },
      { id: 'TEAM_LEAD', name: 'Team Leader', desc: 'Direct operational manager for assigned team attendance, leave, goals, and approvals' },
      { id: 'MENTOR_TRAINER', name: 'Mentor / Trainer', desc: 'Dedicated training programs, daily module evaluation, assessments, and certifications' },
      { id: 'TRAINEE', name: 'Trainee', desc: 'Restricted 7-day learning track role undergoing assessment and certification' },
      { id: 'EMPLOYEE', name: 'Employee', desc: 'Normal operational staff with personal self-service profile, attendance, and leave' }
    ];`;

content = content.replace(oldRolesList, newRolesList);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched role-permissions-view.js with official 8 roles');
