const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/views/create-employee-view.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldCreateRoleOptions = `<option value="TRAINEE" selected>Trainee (7-Day Modules)</option>
                  <option value="EMPLOYEE">Employee (General Staff)</option>
                  <option value="MENTOR">Mentor (Trainer)</option>
                  <option value="TEAM_LEAD">Team Leader</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR">HR Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>`;

const newCreateRoleOptions = `<option value="TRAINEE" selected>Trainee (7-Day Modules)</option>
                  <option value="EMPLOYEE">Employee (Operational Staff)</option>
                  <option value="MENTOR_TRAINER">Mentor / Trainer</option>
                  <option value="TEAM_LEAD">Team Leader</option>
                  <option value="OPERATIONS_MANAGER">Operations Manager</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>`;

content = content.replace(oldCreateRoleOptions, newCreateRoleOptions);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched create-employee-view.js role options to official 8 roles');
