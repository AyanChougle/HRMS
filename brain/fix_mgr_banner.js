const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/views/manager-dashboard-view.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace duplicate return statement
content = content.replace(
  `    return \`
    const role = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '').toString().toUpperCase().trim();
    let portalTitle = 'Manager Portal';
    let portalSubtitle = 'Team attendance oversight, leave approvals, and shift monitoring';
    if (role === 'OPERATIONS_MANAGER') {
      portalTitle = 'Operations Manager Portal';
      portalSubtitle = 'Operational management through Team Leaders, shift presence, and team performance oversight';
    } else if (role === 'TEAM_LEAD') {
      portalTitle = 'Team Leader Portal';
      portalSubtitle = 'Direct team attendance monitoring, shift approvals, and daily goal tracking';
    }

    return \``,
  `    const role = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '').toString().toUpperCase().trim();
    let portalTitle = 'Manager Portal';
    let portalSubtitle = 'Team attendance oversight, leave approvals, and shift monitoring';
    if (role === 'OPERATIONS_MANAGER') {
      portalTitle = 'Operations Manager Portal';
      portalSubtitle = 'Operational management through Team Leaders, shift presence, and team performance oversight';
    } else if (role === 'TEAM_LEAD') {
      portalTitle = 'Team Leader Portal';
      portalSubtitle = 'Direct team attendance monitoring, shift approvals, and daily goal tracking';
    }

    return \``
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed manager-dashboard-view.js syntax');
