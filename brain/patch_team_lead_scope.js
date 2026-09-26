const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/services/employeeService.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldFilterBlock = `      if (filters.managerId) query = query.where('managerId', '==', filters.managerId);`;

const newFilterBlock = `      if (filters.managerId) query = query.where('managerId', '==', filters.managerId);
      if (filters.teamLeaderId) query = query.where('teamLeaderId', '==', filters.teamLeaderId);
      if (filters.operationsManagerId) query = query.where('operationsManagerId', '==', filters.operationsManagerId);
      if (filters.mentorTrainerId) query = query.where('mentorTrainerId', '==', filters.mentorTrainerId);

      const activeRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '').toString().toUpperCase().trim();
      const currentEmpId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || '';
      const currentEmpCode = AuthGuard.userProfile?.employeeCode || '';
      const currentEmpName = AuthGuard.userProfile?.displayName || AuthGuard.userProfile?.fullName || '';

      if (activeRole === 'TEAM_LEAD' && !filters.bypassScope) {
        // Enforce strict Team Leader scope
        if (currentEmpId) {
          query = query.where('teamLeaderId', '==', currentEmpId);
        }
      }`;

content = content.replace(oldFilterBlock, newFilterBlock);

// Also add a post-filter safety net inside getEmployees
const oldReturn = `records = legitimateRecords;`;
const newReturn = `records = legitimateRecords;

      if (activeRole === 'TEAM_LEAD' && !filters.bypassScope) {
        records = records.filter(e => {
          if (!e.teamLeaderId) return false;
          return e.teamLeaderId === currentEmpId || e.teamLeaderId === currentEmpCode || e.teamLeaderId === currentEmpName;
        });
      }`;

content = content.replace(oldReturn, newReturn);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched employeeService.js with Team Leader scoping');
