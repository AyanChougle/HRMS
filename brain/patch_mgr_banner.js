const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/views/manager-dashboard-view.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldBanner = `      <!-- Welcome Banner -->
      <div class="welcome-banner animate-fade-in">
        <div class="welcome-text">
          <h1>Manager Portal — \${userDisplayName}</h1>
          <p>Team attendance oversight, leave approvals, and shift monitoring</p>
        </div>`;

const newBanner = `      <!-- Welcome Banner -->
      <%
        let portalTitle = 'Manager Portal';
        let portalSubtitle = 'Team attendance oversight, leave approvals, and shift monitoring';
        const role = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '').toString().toUpperCase().trim();
        if (role === 'OPERATIONS_MANAGER') {
          portalTitle = 'Operations Manager Portal';
          portalSubtitle = 'Operational management through Team Leaders, shift presence, and team performance oversight';
        } else if (role === 'TEAM_LEAD') {
          portalTitle = 'Team Leader Portal';
          portalSubtitle = 'Direct team attendance monitoring, shift approvals, and daily goal tracking';
        }
      %>
      <div class="welcome-banner animate-fade-in">
        <div class="welcome-text">
          <h1>\${portalTitle} — \${userDisplayName}</h1>
          <p>\${portalSubtitle}</p>
        </div>`;

// Replace script template syntax with clean JS variable assignment
const cleanBannerLogic = `    const role = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '').toString().toUpperCase().trim();
    let portalTitle = 'Manager Portal';
    let portalSubtitle = 'Team attendance oversight, leave approvals, and shift monitoring';
    if (role === 'OPERATIONS_MANAGER') {
      portalTitle = 'Operations Manager Portal';
      portalSubtitle = 'Operational management through Team Leaders, shift presence, and team performance oversight';
    } else if (role === 'TEAM_LEAD') {
      portalTitle = 'Team Leader Portal';
      portalSubtitle = 'Direct team attendance monitoring, shift approvals, and daily goal tracking';
    }

    return \`
      <!-- Welcome Banner -->
      <div class="welcome-banner animate-fade-in">
        <div class="welcome-text">
          <h1>\${portalTitle} — \${userDisplayName}</h1>
          <p>\${portalSubtitle}</p>
        </div>`;

content = content.replace(oldBanner, cleanBannerLogic);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched manager-dashboard-view.js with dynamic role banner for Operations Manager, Team Lead, and Manager');
