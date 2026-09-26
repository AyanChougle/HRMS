const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/firebase/auth-guard.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/HR_MANAGER: 'HR Manager',\s*MANAGER: 'Manager',\s*OPERATIONS_MANAGER: 'Operations Manager',\s*HR_MANAGER: 'HR Manager',\s*MANAGER: 'Manager',/g, 
"HR_MANAGER: 'HR Manager',\n      MANAGER: 'Manager',\n      OPERATIONS_MANAGER: 'Operations Manager',");

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED dupes');
