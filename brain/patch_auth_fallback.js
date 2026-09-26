const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/firebase/auth-guard.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/new Set\(\['team\.view', 'performance\.view', 'attendance\.view', 'leave\.view', 'ess\.view'\]\)/g,
"new Set(['people.view', 'team.view', 'performance.view', 'attendance.view', 'leave.view', 'ess.view'])");

content = content.replace(/new Set\(\['team\.view', 'performance\.view', 'attendance\.view', 'leave\.view', 'ess\.view', 'approvals\.view', 'approvals\.approve'\]\)/g,
"new Set(['people.view', 'team.view', 'performance.view', 'attendance.view', 'leave.view', 'ess.view', 'approvals.view', 'approvals.approve'])");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched auth-guard.js fallback permission sets');
