const fs = require('fs');
const tHtml = fs.readFileSync('timecard.html', 'utf8');

function patchFile(file, kpiComment) {
  let c = fs.readFileSync(file, 'utf8');
  if (c.includes('emp-timecard-hero-card')) {
    console.log(file, 'already patched');
    return;
  }
  
  // Normalize line endings for reliable replacement
  c = c.replace(/\r\n/g, '\n');

  // Remove ALL existing sync code blocks manually
  let idx = c.indexOf('    const employeeId = AuthGuard.userProfile');
  while (idx !== -1) {
    let endIdx = c.indexOf('    }\n', idx);
    if (endIdx !== -1) {
       let blockEnd = c.indexOf('}\n', endIdx + 6) + 2;
       c = c.substring(0, idx) + c.substring(blockEnd);
    } else {
       break;
    }
    idx = c.indexOf('    const employeeId = AuthGuard.userProfile');
  }

  const syncCode = `    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    if (typeof ESSView !== "undefined" && window.attendanceService) {
      try {
        const todayRecord = await attendanceService.getTodayRecord(employeeId);
        await ESSView.syncWithFirestore(todayRecord);
      } catch (e) {
        console.warn("Dashboard ESSView sync warning:", e);
      }
    }
`;

  c = c.replace('async render() {', 'async render() {\n' + syncCode);
  c = c.replace(kpiComment, tHtml + '\n      ' + kpiComment);
  if (file.includes('trainer')) {
    c = c.replace('async postRender() {}', 'async postRender() {\n    if (typeof ESSView !== "undefined") {\n      ESSView.updateTimecardUI();\n    }\n  }');
  } else {
    c = c.replace('async postRender() {', 'async postRender() {\n    if (typeof ESSView !== "undefined") {\n      ESSView.updateTimecardUI();\n    }\n');
  }
  fs.writeFileSync(file, c);
  console.log('patched', file);
}

patchFile('js/views/trainer-dashboard-view.js', '<!-- 4 Trainer-Focused KPI Cards -->');
patchFile('js/views/admin-dashboard-view.js', '<!-- 5 Core KPI Metrics Cards -->');
