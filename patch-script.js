const fs = require('fs');
const file = 'D:/AYAN/HRMS/js/views/training-view.js';
let content = fs.readFileSync(file, 'utf8');

// The regex will match the start and end precisely without worrying about exact spaces
const regex = /const today = new Date\(\)\.toISOString\(\)\.slice\(0, 10\);\s*const rows = trainees\.map\(function\(t\) \{[\s\S]*?\}\)\.join\(''\);/;

const match = content.match(regex);
if (match) {
    const newBlock = `const today = new Date().toISOString().slice(0, 10);
    const selectedDate = this.currentFilters?.attendanceDate || today;
    const attMap = {};
    try {
      const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;
      if (db) {
        const snap = await db.collection('attendanceRecords').where('date', '==', selectedDate).where('isTrainee', '==', true).get();
        snap.forEach(doc => {
          if (doc.data().employeeId) {
            attMap[doc.data().employeeId] = doc.data().status;
          }
        });
      }
    } catch(e) { console.warn(e); }

    const colMap = { PRESENT: 'var(--success)', HALF_DAY: 'var(--warning)', ABSENT: 'var(--danger)' };

    const rows = trainees.map(function(t) {
      const curDay = Number(t.currentDay) || 1;
      const prog = t.progress || Math.round((curDay / 7) * 100);
      const safeName = (t.fullName || 'Trainee').replace(/"/g, '&quot;');
      const safeCode = (t.traineeCode || 'TRN').replace(/"/g, '&quot;');
      let bStatus = 'CURRENT';
      if (t.status === 'CERTIFIED' || t.status === 'HANDED_OVER') bStatus = 'PAST';
      else if (t.status === 'NOT_STARTED' || (t.startDate && new Date(t.startDate) > new Date())) bStatus = 'UPCOMING';
      
      let statusHtml = '';
      if (attMap[t.id]) {
        statusHtml = '<div style="display:flex; flex-direction:column; align-items:center; gap:4px;">' +
          '<span class="badge" style="background:' + colMap[attMap[t.id]] + ';color:#fff;">' + attMap[t.id].replace('_', ' ') + '</span>' +
          '<button class="btn btn-soft btn-sm" style="font-size:0.7rem; padding: 2px 6px;" onclick="TrainingView.markAttendance(' + "'" + t.id + "'" + ',' + "'" + safeName + "'" + ',' + "'PRESENT'" + ',document.getElementById(' + "'att-date-picker'" + ').value,' + "'" + safeCode + "'" + ')">Edit</button></div>';
      } else {
        statusHtml = '<div style="display:inline-flex;gap:5px;flex-wrap:wrap;justify-content:center;">' +
          '<button class="btn btn-sm" style="background:var(--success-light);color:var(--success);border:1px solid var(--success);" ' +
            'onclick="TrainingView.markAttendance(' + "'" + t.id + "'" + ',' + "'" + safeName + "'" + ',' + "'PRESENT'" + ',document.getElementById(' + "'att-date-picker'" + ').value,' + "'" + safeCode + "'" + ')">Present</button>' +
          '<button class="btn btn-sm" style="background:var(--warning-light);color:var(--warning);border:1px solid var(--warning);" ' +
            'onclick="TrainingView.markAttendance(' + "'" + t.id + "'" + ',' + "'" + safeName + "'" + ',' + "'HALF_DAY'" + ',document.getElementById(' + "'att-date-picker'" + ').value,' + "'" + safeCode + "'" + ')">Half</button>' +
          '<button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:1px solid var(--danger);" ' +
            'onclick="TrainingView.markAttendance(' + "'" + t.id + "'" + ',' + "'" + safeName + "'" + ',' + "'ABSENT'" + ',document.getElementById(' + "'att-date-picker'" + ').value,' + "'" + safeCode + "'" + ')">Absent</button>' +
        '</div>';
      }

      return '<tr id="att-row-' + t.id + '" class="att-row-item" data-batch-status="' + bStatus + '">' +
        '<td>' +
          '<div class="user-cell">' +
            '<div class="user-cell-avatar" style="background:var(--primary-light);color:var(--primary);font-weight:700;">' +
              (t.fullName || 'T').substring(0, 2).toUpperCase() +
            '</div>' +
            '<div class="user-cell-info">' +
              '<span class="user-cell-name font-semibold">' + (t.fullName || '') + '</span>' +
              '<span class="user-cell-email text-muted" style="font-size:0.75rem;">' + (t.traineeCode || 'TRN') + ' &bull; ' + (t.email || '') + '</span>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td><span class="badge badge-primary">' + (t.department || 'Operations') + '</span></td>' +
        '<td>' +
          '<div style="font-size:0.78rem;"><strong>' + (t.batchName || 'Cohort 2026') + '</strong></div>' +
          '<div style="font-size:0.72rem;color:var(--text-muted);">' +
            (t.startDate ? 'From: ' + t.startDate : 'Not started') +
            (t.targetEndDate ? ' &rarr; ' + t.targetEndDate : '') +
          '</div>' +
        '</td>' +
        '<td>' +
          '<div style="font-size:0.8rem;font-weight:600;">Day ' + curDay + ' / 7 &nbsp; <strong style="color:var(--primary);">' + prog + '%</strong></div>' +
          '<div style="width:100px;height:5px;background:var(--border-main);border-radius:3px;overflow:hidden;margin-top:4px;">' +
            '<div style="width:' + prog + '%;height:100%;background:var(--primary);border-radius:3px;"></div>' +
          '</div>' +
        '</td>' +
        '<td class="att-status-cell" style="text-align:center;">' +
          statusHtml +
        '</td>' +
        '<td style="text-align:center;">' +
          '<div style="display:inline-flex;gap:5px;">' +
            '<button class="btn btn-secondary btn-sm" onclick="TrainingView.openAttendanceSheetModal(' + "'" + t.id + "','" + safeName + "','" + safeCode + "'" + ')">Sheet</button>' +
            '<button class="btn btn-soft btn-sm" onclick="TrainingView.openManageModuleModal(' + "'" + t.id + "','" + safeName + "'," + curDay + ',' + prog + ',' + "'" + (t.startDate || '') + "','" + (t.targetEndDate || '') + "','" + (t.batchName || '') + "'" + ')">Manage</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');`;
    
    content = content.replace(match[0], newBlock);
    
    // Also patch the html elements
    content = content.replace(/<input type="date" id="att-date-picker" class="form-control" style="width: 140px;" value="\$\{today\}" \/>/g, 
      '<input type="date" id="att-date-picker" class="form-control" style="width: 140px;" value="${selectedDate}" onchange="TrainingView.changeAttendanceDate(this.value)" />');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully applied regex match and updated DOM!');
} else {
    console.log('Regex match not found');
}
