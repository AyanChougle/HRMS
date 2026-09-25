const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/attendance-view.js';
let c = fs.readFileSync(path, 'utf8');

const OLD_HOLIDAYS_BLOCK = '      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">\n' +
'        <!-- Holidays -->\n' +
'        <div class="card">\n' +
'          <div class="card-header">\n' +
'            <div>\n' +
'              <div class="card-title">Corporate & Statutory Holidays</div>\n' +
'              <div class="card-subtitle">Official company calendar and non-working paid days</div>\n' +
'            </div>\n' +
'            ${canManageHolidays ? `<button class="btn btn-primary btn-sm" onclick="AttendanceView.openAddHolidayModal()">+ Add Holiday</button>` : \'\'}\n' +
'          </div>\n' +
'          <div class="card-body" style="padding: 0;">\n' +
'            ${holidays.length === 0 ? `\n' +
'              <div style="padding: 30px; text-align: center; color: var(--text-muted);">No holidays configured.</div>\n' +
'            ` : `\n' +
'              <table class="data-table">';

const NEW_HOLIDAYS_BLOCK = '      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">\n' +
'        <!-- Holidays -->\n' +
'        <div class="card">\n' +
'          <div class="card-header">\n' +
'            <div>\n' +
'              <div class="card-title">Corporate & Statutory Holidays</div>\n' +
'              <div class="card-subtitle">Official company calendar and non-working paid days</div>\n' +
'            </div>\n' +
'            ${canManageHolidays ? `<button class="btn btn-primary btn-sm" onclick="AttendanceView.openAddHolidayModal()">+ Add Holiday</button>` : \'\'}\n' +
'          </div>\n' +
'          <div class="card-body" style="padding: 0;">\n' +
'            ${role.toUpperCase().trim() === \'TRAINEE\' ? `\n' +
'              <div style="padding: 30px; text-align: center; color: var(--text-muted);">\n' +
'                <strong>Zero Leave & Holiday Entitlement</strong><br><br>\n' +
'                As per the trainee agreement, there are no holidays or paid time off during the 7-day training track. Mandatory attendance is required.\n' +
'              </div>\n' +
'            ` : holidays.length === 0 ? `\n' +
'              <div style="padding: 30px; text-align: center; color: var(--text-muted);">No holidays configured.</div>\n' +
'            ` : `\n' +
'              <table class="data-table">';

c = c.replace(OLD_HOLIDAYS_BLOCK, NEW_HOLIDAYS_BLOCK);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED Holidays tab in attendance-view.js');
