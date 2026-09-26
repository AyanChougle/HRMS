const fs = require('fs');
const file = 'D:/AYAN/HRMS/js/views/ess-view.js';
let content = fs.readFileSync(file, 'utf8');

const isSatCode = `const isSaturday = new Date().getDay() === 6;
      const targetHoursStr = isSaturday ? '6h' : '8h';`;

content = content.replace(/const employeeName = employee\.fullName \|\| employee\.name \|\| "Employee";/, 
  isSatCode + '\n      const employeeName = employee.fullName || employee.name || "Employee";');

content = content.replace(/Today's Shift Duration \(8h Target\)/g, "Today's Shift Duration (${targetHoursStr} Target)");
content = content.replace(/"Active On Duty \(8h Work Target\)"/g, '`Active On Duty (${targetHoursStr} Work Target)`');

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');
