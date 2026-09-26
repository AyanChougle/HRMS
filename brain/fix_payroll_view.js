const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/payroll-view.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/const isHRorAdmin = rawRole === 'SUPER_ADMIN' \|\| rawRole === 'COMPANY_ADMIN' \|\| rawRole === 'HR' \|\| rawRole === 'HR_MANAGER';/g,
`const isHRorAdmin = rawRole === 'SUPER_ADMIN' || rawRole === 'COMPANY_ADMIN' || rawRole === 'HR' || rawRole === 'HR_MANAGER';
    const isEmployeeOnly = !isHRorAdmin;`);

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed payroll-view.js isEmployeeOnly ReferenceError');
