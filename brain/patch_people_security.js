const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/views/people-view.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldDrawerStart = `  async openEmployeeDrawer(employeeId) {
    try {
      const emp = await employeeService.getEmployee(employeeId);
      if (!emp) {
        Toast.error('Employee record not found.');
        return;
      }`;

const newDrawerStart = `  async openEmployeeDrawer(employeeId) {
    try {
      const emp = await employeeService.getEmployee(employeeId);
      if (!emp) {
        Toast.error('Employee record not found.');
        return;
      }

      const activeRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '').toString().toUpperCase().trim();
      const currentEmpId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || '';
      const currentEmpCode = AuthGuard.userProfile?.employeeCode || '';
      const currentEmpName = AuthGuard.userProfile?.displayName || AuthGuard.userProfile?.fullName || '';

      if (activeRole === 'TEAM_LEAD') {
        const isAssigned = emp.teamLeaderId && (emp.teamLeaderId === currentEmpId || emp.teamLeaderId === currentEmpCode || emp.teamLeaderId === currentEmpName);
        if (!isAssigned) {
          if (typeof Toast !== 'undefined') Toast.error('Access Denied: You can only view profiles of employees assigned to your team.');
          return;
        }
      }`;

content = content.replace(oldDrawerStart, newDrawerStart);

// Also hide edit profile button and access tab for Team Lead
const oldEditBtn = `<button class="btn btn-secondary btn-sm" onclick="Forms.openEmployeeModal('\${emp.id}')">Edit Profile</button>`;
const newEditBtn = `\${activeRole !== 'TEAM_LEAD' ? \`<button class="btn btn-secondary btn-sm" onclick="Forms.openEmployeeModal('\${emp.id}')">Edit Profile</button>\` : ''}`;

content = content.replace(oldEditBtn, newEditBtn);

const oldAccessTabBtn = `<button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-access')">Access & Portal</button>`;
const newAccessTabBtn = `\${activeRole !== 'TEAM_LEAD' ? \`<button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-access')">Access & Portal</button>\` : ''}`;

content = content.replace(oldAccessTabBtn, newAccessTabBtn);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched people-view.js with Team Lead profile security checks');
