const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/users-view.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/<option value="SUPER_ADMIN">Super Administrator<\/option>[\s\S]*?<option value="EMPLOYEE">Employee \(Self Service\)<\/option>/g, 
`<option value="SUPER_ADMIN">Super Administrator</option>
                <option value="HR_MANAGER" selected>HR Manager</option>
                <option value="MANAGER">Manager</option>
                <option value="OPERATIONS_MANAGER">Operations Manager</option>
                <option value="TEAM_LEAD">Team Leader</option>
                <option value="MENTOR_TRAINER">Mentor / Trainer</option>
                <option value="TRAINEE">Trainee</option>
                <option value="EMPLOYEE">Employee (Self Service)</option>`);

// Also update the edit modal options in users-view.js
c = c.replace(/<option value="SUPER_ADMIN" \$\{currentRole === "SUPER_ADMIN" \? "selected" : ""\}>Super Admin<\/option>[\s\S]*?<option value="EMPLOYEE" \$\{currentRole === "EMPLOYEE" \? "selected" : ""\}>Employee<\/option>/g,
`<option value="SUPER_ADMIN" \${currentRole === "SUPER_ADMIN" ? "selected" : ""}>Super Admin</option>
            <option value="HR_MANAGER" \${currentRole === "HR_MANAGER" ? "selected" : ""}>HR Manager</option>
            <option value="MANAGER" \${currentRole === "MANAGER" ? "selected" : ""}>Manager</option>
            <option value="OPERATIONS_MANAGER" \${currentRole === "OPERATIONS_MANAGER" ? "selected" : ""}>Operations Manager</option>
            <option value="TEAM_LEAD" \${currentRole === "TEAM_LEAD" ? "selected" : ""}>Team Leader</option>
            <option value="MENTOR_TRAINER" \${currentRole === "MENTOR_TRAINER" ? "selected" : ""}>Mentor / Trainer</option>
            <option value="TRAINEE" \${currentRole === "TRAINEE" ? "selected" : ""}>Trainee</option>
            <option value="EMPLOYEE" \${currentRole === "EMPLOYEE" ? "selected" : ""}>Employee</option>`);

// Also the badge display in users-view.js line 80
c = c.replace(/u\.roleId === "HR" \? "badge-success" : u\.roleId === "TRAINER" \? "badge-info" : u\.roleId === "TRAINEE" \? "badge-warning" : "badge-neutral"/g,
`u.roleId === "HR_MANAGER" ? "badge-success" : (u.roleId === "MANAGER" || u.roleId === "OPERATIONS_MANAGER") ? "badge-info" : u.roleId === "MENTOR_TRAINER" ? "badge-info" : u.roleId === "TRAINEE" ? "badge-warning" : "badge-neutral"`);

// Update u.roleId display string
c = c.replace(/\$\{u\.roleId \|\| "EMPLOYEE"\}/g, `\${u.roleId === 'HR_MANAGER' ? 'HR Manager' : u.roleId === 'MENTOR_TRAINER' ? 'Mentor/Trainer' : u.roleId === 'TEAM_LEAD' ? 'Team Lead' : u.roleId || 'Employee'}`);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED users-view.js dropdowns');
