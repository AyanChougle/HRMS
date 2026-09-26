const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/firebase/auth-guard.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/COMPANY_ADMIN: 'Company Admin',\s*/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned up COMPANY_ADMIN from auth-guard.js maps');
