const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/create-employee-view.js';
let c = fs.readFileSync(path, 'utf8');

const oldHeader = `const CreateEmployeeView = {
  async render() {
    const userRole = (AuthGuard.userProfile?.roleId || '').toUpperCase().trim();`;

const newHeader = `const CreateEmployeeView = {
  async render() {
    const userRole = (AuthGuard.userProfile?.roleId || '').toUpperCase().trim();
    let employees = [];
    try {
      if (typeof employeeService !== 'undefined') {
        employees = await employeeService.getAllEmployees();
      }
    } catch(e) { console.warn(e); }
    
    const mgrOptions = '<option value="">-- Select --</option>' + employees.map(e => \`<option value="\${e.id}">\${e.fullName || e.firstName} (\${e.employeeCode})</option>\`).join('');
    `;

c = c.replace(oldHeader, newHeader);

const oldMentorInput = `<div class="form-group">
                <label class="form-label">Assigned Mentor / Reporting Manager</label>
                <input type="text" id="new-emp-mentor" class="form-control" placeholder="e.g. Mentor / Manager Name" />
              </div>`;

const newMentorInput = `<div class="form-group">
                <label class="form-label">Team Leader</label>
                <select id="new-emp-team-leader" class="form-control">\${mgrOptions}</select>
              </div>
              <div class="form-group">
                <label class="form-label">Operations Manager</label>
                <select id="new-emp-ops-manager" class="form-control">\${mgrOptions}</select>
              </div>
              <div class="form-group">
                <label class="form-label">Manager</label>
                <select id="new-emp-manager" class="form-control">\${mgrOptions}</select>
              </div>
              <div class="form-group">
                <label class="form-label">Mentor / Trainer (If Trainee)</label>
                <select id="new-emp-mentor" class="form-control">\${mgrOptions}</select>
              </div>`;

c = c.replace(oldMentorInput, newMentorInput);

const oldPayload = `        roleId: role,
        department: document.getElementById('new-emp-dept').value,
        designation: document.getElementById('new-emp-designation').value,
        manager: mentor,
        status: status,
        employmentStatus: 'ACTIVE',`;

const newPayload = `        roleId: role,
        department: document.getElementById('new-emp-dept').value,
        designation: document.getElementById('new-emp-designation').value,
        teamLeaderId: document.getElementById('new-emp-team-leader')?.value || '',
        operationsManagerId: document.getElementById('new-emp-ops-manager')?.value || '',
        managerId: document.getElementById('new-emp-manager')?.value || '',
        mentorTrainerId: document.getElementById('new-emp-mentor')?.value || '',
        status: status,
        employmentStatus: 'ACTIVE',
        trainingStatus: role === 'TRAINEE' ? 'IN_PROGRESS' : 'COMPLETED',
        certificationStatus: role === 'TRAINEE' ? 'PENDING' : 'PASSED',`;

c = c.replace(oldPayload, newPayload);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED create-employee-view.js with standard IDs');
