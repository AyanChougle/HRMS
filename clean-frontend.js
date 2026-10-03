const fs = require('fs');

// 1. Update Employee Code Generation
let empService = fs.readFileSync('js/services/employeeService.js', 'utf8');
empService = empService.replace(/async getNextEmployeeCode[\s\S]*?catch \(e\) {\s*return `EMP-0001`;\s*}\s*},/, 
`async getNextEmployeeCode(companyId = 'comp_diallo_india') {
    try {
      const snapshot = await db.collection('employees').where('companyId', '==', companyId).get();
      let maxNum = 0;
      snapshot.docs.forEach(d => {
        const c = d.data().employeeCode;
        if (c && c.toUpperCase().startsWith('D-')) {
          const numStr = c.substring(2);
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      return \`D-\${String(maxNum + 1).padStart(5, '0')}\`;
    } catch (e) {
      return 'D-00001';
    }
  },`);
fs.writeFileSync('js/services/employeeService.js', empService);


// 2. Remove Role Switcher from index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
// Replace the role switcher select block
indexHtml = indexHtml.replace(/<div class="header-profile-role".*?>[\s\S]*?<\/select>\s*<\/div>/, '');
fs.writeFileSync('index.html', indexHtml);

// 3. Remove Payroll from router, sidebar, settings, etc.
let router = fs.readFileSync('js/router.js', 'utf8');
router = router.replace(/payroll:\s*{[\s\S]*?},/, '');
router = router.replace(/payslip-templates:\s*{[\s\S]*?},/, '');

// Remove Payroll from Sidebar
let sidebarPattern = /<a href="#payroll"[\s\S]*?Payroll & Payslips<\/a>/;
indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(sidebarPattern, '');
fs.writeFileSync('index.html', indexHtml);

// Remove Payroll and Email from Settings
let settingsView = fs.readFileSync('js/views/settings-view.js', 'utf8');
settingsView = settingsView.replace(/<div class="card settings-card" onclick="SettingsView\.openModal\('smtp'\)">[\s\S]*?<\/div>/, '');
settingsView = settingsView.replace(/<div class="card settings-card" onclick="SettingsView\.openModal\('payslip'\)">[\s\S]*?<\/div>/, '');
fs.writeFileSync('js/views/settings-view.js', settingsView);

console.log('Done cleaning frontend');
