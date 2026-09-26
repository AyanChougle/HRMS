const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/views/people-view.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldTabNav = `<button class="tab-btn \${this.activeTab === 'masters' ? 'active' : ''}" onclick="PeopleView.switchTab('masters')">Org Masters</button>`;

const newTabNav = `\${['SUPER_ADMIN', 'HR_MANAGER', 'MANAGER', 'OPERATIONS_MANAGER'].includes(userRole) ? \`<button class="tab-btn \${this.activeTab === 'masters' ? 'active' : ''}" onclick="PeopleView.switchTab('masters')">Org Masters</button>\` : ''}`;

content = content.replace(oldTabNav, newTabNav);

// Also add a guard inside renderTabContent if someone requests 'masters' as TEAM_LEAD
const oldTabContent = `case 'masters':
        return this.renderOrgMastersTab(departments, branches);`;

const newTabContent = `case 'masters':
        if (userRole === 'TEAM_LEAD') return this.renderDirectoryTab(employees, departments, branches);
        return this.renderOrgMastersTab(departments, branches);`;

content = content.replace(oldTabContent, newTabContent);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched people-view.js to hide Org Masters tab from Team Leader');
