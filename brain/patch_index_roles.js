const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/index.html';
let content = fs.readFileSync(filePath, 'utf8');

const oldHeaderOptions = `<option value="SUPER_ADMIN">Super Admin</option>
                <option value="COMPANY_ADMIN">Company Admin</option>
                <option value="HR">HR Manager</option>
                <option value="MANAGER">Manager</option>
                <option value="TEAM_LEAD">Team Leader</option>
                <option value="MENTOR">Mentor / Trainer</option>
                <option value="TRAINEE">Trainee</option>
                <option value="EMPLOYEE">Employee</option>`;

const newHeaderOptions = `<option value="SUPER_ADMIN">Super Admin</option>
                <option value="HR_MANAGER">HR Manager</option>
                <option value="MANAGER">Manager</option>
                <option value="OPERATIONS_MANAGER">Operations Manager</option>
                <option value="TEAM_LEAD">Team Leader</option>
                <option value="MENTOR_TRAINER">Mentor / Trainer</option>
                <option value="TRAINEE">Trainee</option>
                <option value="EMPLOYEE">Employee</option>`;

content = content.replace(oldHeaderOptions, newHeaderOptions);
content = content.replace(oldHeaderOptions, newHeaderOptions); // Do it twice for popover as well!

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched index.html role switchers to 8 official roles');
