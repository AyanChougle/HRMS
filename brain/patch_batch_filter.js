const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let c = fs.readFileSync(path, 'utf8');

// 1. Add batch-status data attribute to row
const OLD_TR = "      return '<tr>' +";
const NEW_TR = `      let bStatus = 'CURRENT';
      if (t.status === 'CERTIFIED' || t.status === 'HANDED_OVER') bStatus = 'PAST';
      else if (t.status === 'NOT_STARTED' || (t.startDate && new Date(t.startDate) > new Date())) bStatus = 'UPCOMING';
      return '<tr class="att-row-item" data-batch-status="' + bStatus + '">' +`;
c = c.replace(OLD_TR, NEW_TR);

// 2. Add batch filter dropdown to header
const OLD_HEADER = `          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <input type="date" id="att-date-picker" class="form-control" style="width: 175px;" value="\${today}" />
            <button class="btn btn-primary btn-sm" onclick="TrainingView.switchTab('attendance')">`;
const NEW_HEADER = `          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <select id="att-batch-filter" class="form-control" style="width: 160px;" onchange="TrainingView.filterAttendanceBatch(this.value)">
              <option value="ALL">All Batches</option>
              <option value="CURRENT" selected>Current Active Batches</option>
              <option value="UPCOMING">Upcoming Batches</option>
              <option value="PAST">Past / Completed</option>
            </select>
            <input type="date" id="att-date-picker" class="form-control" style="width: 140px;" value="\${today}" />
            <button class="btn btn-primary btn-sm" onclick="TrainingView.switchTab('attendance')">`;
c = c.replace(OLD_HEADER, NEW_HEADER);

// 3. Add client-side filter method
const END_MARKER = '  async exportTraineesCSV() {';
const FILTER_METHOD = `
  filterAttendanceBatch(status) {
    const rows = document.querySelectorAll('.att-row-item');
    let visibleCount = 0;
    rows.forEach(row => {
      if (status === 'ALL' || row.getAttribute('data-batch-status') === status) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    // Call it once after render if needed
  },
`;
c = c.replace(END_MARKER, FILTER_METHOD + '\n' + END_MARKER);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED successfully');
