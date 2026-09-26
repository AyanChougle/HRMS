const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/index.html';
let content = fs.readFileSync(filePath, 'utf8');

const oldPopoverOptions = `<option value="SUPER_ADMIN">Super Admin</option>
                  <option value="COMPANY_ADMIN">Company Admin</option>
                  <option value="HR">HR Manager</option>
                  <option value="MANAGER">Manager</option>
                  <option value="TEAM_LEAD">Team Leader</option>
                  <option value="MENTOR">Mentor / Trainer</option>
                  <option value="TRAINEE">Trainee</option>
                  <option value="EMPLOYEE">Employee</option>`;

const newPopoverOptions = `<option value="SUPER_ADMIN">Super Admin</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OPERATIONS_MANAGER">Operations Manager</option>
                  <option value="TEAM_LEAD">Team Leader</option>
                  <option value="MENTOR_TRAINER">Mentor / Trainer</option>
                  <option value="TRAINEE">Trainee</option>
                  <option value="EMPLOYEE">Employee</option>`;

content = content.replace(oldPopoverOptions, newPopoverOptions);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed popover role switcher in index.html');
