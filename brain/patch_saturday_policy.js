const fs = require('fs');

// 1. Patch attendanceService.js
const attPath = 'D:/AYAN/HRMS/js/services/attendanceService.js';
let attCode = fs.readFileSync(attPath, 'utf8');

// Add helper isSaturday method before sanitizeRecord
const helperCode = `  isSaturday(dateStr) {
    if (!dateStr) return false;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.getDay() === 6;
      }
    } catch (e) {}
    return false;
  },

  sanitizeRecord(rec) {`;

attCode = attCode.replace('sanitizeRecord(rec) {', helperCode);

// Replace sanitizeRecord inner calculation logic
const oldSanitizeCalc = `      // Diallo % Master Policy: 9hr shift = 8hr work (480m) + 1hr break (60m).
      // If a regularized record or full-shift has 0m recorded break, apply the standard 60m break.
      let effectiveBreakMinutes = r.totalBreakMinutes || 0;
      if (effectiveBreakMinutes === 0 && (r.status === 'REGULARIZED' || totalGrossMinutes >= 540)) {
        effectiveBreakMinutes = 60;
        r.totalBreakMinutes = 60;
        r.totalBreakSeconds = 3600;
        r.breakFormatted = '60m';
      }

      const workedMinutes = Math.max(0, totalGrossMinutes - effectiveBreakMinutes);

      const hours = Math.floor(workedMinutes / 60);
      const mins = workedMinutes % 60;
      r.workedMinutes = workedMinutes;
      r.workedHoursFormatted = \`\${hours}h \${String(mins).padStart(2, '0')}m\`;

      const grossHours = Math.floor(totalGrossMinutes / 60);
      const grossMins = totalGrossMinutes % 60;
      r.grossMinutes = totalGrossMinutes;
      r.grossHoursFormatted = \`\${grossHours}h \${String(grossMins).padStart(2, '0')}m\`;

      // Standard work target is 8 hours (480 minutes). Overtime is only beyond 8 hours of net work.
      r.overtimeMinutes = workedMinutes > 480 ? (workedMinutes - 480) : 0;

      // Ensure status is valid after checkOut
      if (!r.status || r.status === 'ON_BREAK') {
        r.status = workedMinutes < 240 ? 'HALF_DAY' : (r.lateMinutes > 0 ? 'LATE' : 'PRESENT');
      }`;

const newSanitizeCalc = `      const isSat = this.isSaturday(r.date);
      const targetWorkMins = isSat ? 360 : 480; // Saturday shift target = 6h (360m)
      const halfDayCutoff = isSat ? 180 : 240;   // Saturday half-day cutoff = 3h (180m)

      let effectiveBreakMinutes = r.totalBreakMinutes || 0;
      if (!isSat && effectiveBreakMinutes === 0 && (r.status === 'REGULARIZED' || totalGrossMinutes >= 540)) {
        effectiveBreakMinutes = 60;
        r.totalBreakMinutes = 60;
        r.totalBreakSeconds = 3600;
        r.breakFormatted = '60m';
      }

      const workedMinutes = Math.max(0, totalGrossMinutes - effectiveBreakMinutes);

      const hours = Math.floor(workedMinutes / 60);
      const mins = workedMinutes % 60;
      r.workedMinutes = workedMinutes;
      r.workedHoursFormatted = \`\${hours}h \${String(mins).padStart(2, '0')}m\`;

      const grossHours = Math.floor(totalGrossMinutes / 60);
      const grossMins = totalGrossMinutes % 60;
      r.grossMinutes = totalGrossMinutes;
      r.grossHoursFormatted = \`\${grossHours}h \${String(grossMins).padStart(2, '0')}m\`;

      // Saturday shift = 6 hours work target. Overtime is only beyond 6h on Sat (8h on Weekdays).
      r.overtimeMinutes = workedMinutes > targetWorkMins ? (workedMinutes - targetWorkMins) : 0;

      // Ensure status is valid after checkOut
      if (!r.status || r.status === 'ON_BREAK') {
        r.status = workedMinutes < halfDayCutoff ? 'HALF_DAY' : (r.lateMinutes > 0 ? 'LATE' : 'PRESENT');
      }`;

attCode = attCode.replace(oldSanitizeCalc, newSanitizeCalc);

// Replace checkOut calculation logic
const oldCheckoutCalc = `      // Early checkout & Overtime calculations (Shift 10:00 AM – 07:00 PM = 9h / 540m)
      const shiftEndMinutes = this.timeStringToMinutes(settings.defaultEndTime || '19:00');
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const earlyCheckoutMinutes = currentMinutes < shiftEndMinutes ? shiftEndMinutes - currentMinutes : 0;
      const shiftStandardMinutes = settings.overtimeAfterMinutes || 540;
      const overtimeMinutes = workedMinutes > shiftStandardMinutes ? workedMinutes - shiftStandardMinutes : 0;

      let status = rec.status;
      if (workedMinutes < (settings.minimumHalfDayMinutes || 270)) {
        status = 'HALF_DAY';
      }`;

const newCheckoutCalc = `      const isSat = now.getDay() === 6;
      const defaultEndTime = isSat ? '16:00' : '19:00';
      const shiftEndMinutes = this.timeStringToMinutes(settings.defaultEndTime || defaultEndTime);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const earlyCheckoutMinutes = currentMinutes < shiftEndMinutes ? shiftEndMinutes - currentMinutes : 0;
      const shiftStandardMinutes = isSat ? 360 : (settings.overtimeAfterMinutes || 540);
      const overtimeMinutes = workedMinutes > shiftStandardMinutes ? workedMinutes - shiftStandardMinutes : 0;

      let status = rec.status;
      const halfDayCutoff = isSat ? 180 : (settings.minimumHalfDayMinutes || 240);
      if (workedMinutes < halfDayCutoff) {
        status = 'HALF_DAY';
      }`;

attCode = attCode.replace(oldCheckoutCalc, newCheckoutCalc);

fs.writeFileSync(attPath, attCode, 'utf8');
console.log('Patched attendanceService.js for Saturday 4 PM (6-hour shift) policy');

// 2. Patch create-employee-view.js display policy text
const empViewPath = 'D:/AYAN/HRMS/js/views/create-employee-view.js';
let empViewCode = fs.readFileSync(empViewPath, 'utf8');

empViewCode = empViewCode.replace(
  `value="10:00 AM – 07:00 PM (8h Work • 1h Break)"`,
  `value="Mon–Fri: 10:00 AM – 07:00 PM (8h Work) • Sat: 10:00 AM – 04:00 PM (6h Work)"`
);

fs.writeFileSync(empViewPath, empViewCode, 'utf8');
console.log('Patched create-employee-view.js shift timing label');

// 3. Patch ess-view.js toast messages
const essViewPath = 'D:/AYAN/HRMS/js/views/ess-view.js';
let essViewCode = fs.readFileSync(essViewPath, 'utf8');

essViewCode = essViewCode.replace(
  `Toast.success(\n        "Checked IN successfully! Daily shift started (10:00 AM - 07:00 PM).",\n      );`,
  `const isSat = new Date().getDay() === 6;\n      Toast.success(\n        isSat ? "Checked IN successfully! Saturday shift started (10:00 AM - 04:00 PM • 6h Shift)." : "Checked IN successfully! Daily shift started (10:00 AM - 07:00 PM).",\n      );`
);

fs.writeFileSync(essViewPath, essViewCode, 'utf8');
console.log('Patched ess-view.js check-in toast message');
