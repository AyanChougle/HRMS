const fs = require('fs');

// 1. Fix attendanceService.js geofence
let c = fs.readFileSync('js/services/attendanceService.js', 'utf8');
c = c.replace(
  'const officeLat = 19.166900;\n      const officeLng = 72.931000;',
  'const officeLat = 19.11058435750301;\n      const officeLng = 73.02805896557284;'
);
c = c.replace(
  'if (dist > 60 && !punchData.forcePunch) {',
  'if (dist > 500 && !punchData.forcePunch) {' // increase to 500m
);
c = c.replace(
  '(60m perimeter)',
  '(Office Premises)'
);
c = c.replace(/\r\n/g, '\n');
fs.writeFileSync('js/services/attendanceService.js', c);


// 2. Fix ess-view.js timer reset and geofence
let ess = fs.readFileSync('js/views/ess-view.js', 'utf8');
ess = ess.replace(/\r\n/g, '\n');

ess = ess.replace('radiusMeters: 60,', 'radiusMeters: 500,');
ess = ess.replace('(10m Geofence Verified)', '(Office Geofence Verified)');

const syncReplacement = `      if (todayRecord.currentCheckInDateIso || todayRecord.checkInDateIso) {
        const inDate = new Date(
          todayRecord.currentCheckInDateIso || todayRecord.checkInDateIso,
        );
        this.punchInTimestamp = inDate.getTime();
        const now = Date.now();
        const totalElapsed = Math.floor((now - this.punchInTimestamp) / 1000);
        this.workSeconds = Math.max(0, totalElapsed - this.totalBreakSeconds);
      } else if (todayRecord.checkIn && typeof todayRecord.checkIn === 'string') {
        const match = todayRecord.checkIn.match(/(\\d+):(\\d+)\\s*(AM|PM)/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          
          const inDate = new Date();
          inDate.setHours(h, m, 0, 0);
          this.punchInTimestamp = inDate.getTime();
          const now = Date.now();
          const totalElapsed = Math.floor((now - this.punchInTimestamp) / 1000);
          this.workSeconds = Math.max(0, totalElapsed - this.totalBreakSeconds);
        }
      }`;

const syncTarget = `      if (todayRecord.currentCheckInDateIso || todayRecord.checkInDateIso) {
        const inDate = new Date(
          todayRecord.currentCheckInDateIso || todayRecord.checkInDateIso,
        );
        this.punchInTimestamp = inDate.getTime();
        const now = Date.now();
        const totalElapsed = Math.floor((now - this.punchInTimestamp) / 1000);
        this.workSeconds = Math.max(0, totalElapsed - this.totalBreakSeconds);
      }`;

ess = ess.replace(syncTarget, syncReplacement);

fs.writeFileSync('js/views/ess-view.js', ess);
console.log('Fixed everything');
