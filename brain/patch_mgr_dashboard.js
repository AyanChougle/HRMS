const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/views/manager-dashboard-view.js';
let content = fs.readFileSync(filePath, 'utf8');

const oldPostRender = `  async postRender() {
    try {
      const [employees, attendanceSum, approvals] = await Promise.all([
        employeeService.getEmployees(),
        attendanceService.getTodaySummary(),
        approvalService.getPendingApprovals(),
      ]);`;

const newPostRender = `  async postRender() {
    try {
      const employees = await employeeService.getEmployees();
      const teamEmpIds = employees.map(e => e.id);
      const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';

      const [attendanceSum, approvals] = await Promise.all([
        attendanceService.getTodaySummary(companyId, teamEmpIds),
        approvalService.getPendingApprovals(),
      ]);`;

content = content.replace(oldPostRender, newPostRender);

// Replace empty state text for team roster
const oldEmptyText = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No employees registered in your team.</div>`;
const newEmptyText = `<div class="empty-state" style="border: none; padding: 24px;">
            <div class="empty-state-title" style="font-size: 0.9rem;">No team members assigned yet.</div>
            <div class="empty-state-desc" style="font-size: 0.78rem;">Employees assigned to your teamLeaderId will appear here automatically.</div>
          </div>`;

content = content.replace(oldEmptyText, newEmptyText);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched manager-dashboard-view.js for Team Leader statistics');
