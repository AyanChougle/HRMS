const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/views/users-view.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldModalOptions = `<option value="SUPER_ADMIN" \${currentRole === "SUPER_ADMIN" ? "selected" : ""}>Super Administrator</option>
            <option value="COMPANY_ADMIN" \${currentRole === "COMPANY_ADMIN" ? "selected" : ""}>Company Administrator</option>
            <option value="HR" \${currentRole === "HR" ? "selected" : ""}>HR Administrator</option>
            <option value="TRAINER" \${currentRole === "TRAINER" ? "selected" : ""}>Corporate Trainer</option>
            <option value="TRAINEE" \${currentRole === "TRAINEE" ? "selected" : ""}>Graduate Trainee</option>
            <option value="PAYROLL" \${currentRole === "PAYROLL" ? "selected" : ""}>Payroll Officer</option>
            <option value="MANAGER" \${currentRole === "MANAGER" ? "selected" : ""}>Line Manager</option>
            <option value="EMPLOYEE" \${currentRole === "EMPLOYEE" ? "selected" : ""}>Employee</option>`;

const newModalOptions = `<option value="SUPER_ADMIN" \${currentRole === "SUPER_ADMIN" ? "selected" : ""}>Super Administrator</option>
            <option value="HR_MANAGER" \${currentRole === "HR_MANAGER" ? "selected" : ""}>HR Manager</option>
            <option value="MANAGER" \${currentRole === "MANAGER" ? "selected" : ""}>Manager</option>
            <option value="OPERATIONS_MANAGER" \${currentRole === "OPERATIONS_MANAGER" ? "selected" : ""}>Operations Manager</option>
            <option value="TEAM_LEAD" \${currentRole === "TEAM_LEAD" ? "selected" : ""}>Team Leader</option>
            <option value="MENTOR_TRAINER" \${currentRole === "MENTOR_TRAINER" ? "selected" : ""}>Mentor / Trainer</option>
            <option value="TRAINEE" \${currentRole === "TRAINEE" ? "selected" : ""}>Trainee</option>
            <option value="EMPLOYEE" \${currentRole === "EMPLOYEE" ? "selected" : ""}>Employee</option>`;

content = content.replace(oldModalOptions, newModalOptions);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched users-view.js edit user modal dropdown options');
