const fs = require('fs');
const tHtml = fs.readFileSync('timecard.html', 'utf8');
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

function patchFile(file, kpiComment) {
  let c = fs.readFileSync(file, 'utf8');
  if (c.includes('emp-timecard-hero-card')) {
    console.log(file, 'already patched');
    return;
  }
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
