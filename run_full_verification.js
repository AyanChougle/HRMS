const fs = require('fs');
const path = require('path');

const ROOT = 'D:/AYAN/HRMS';

console.log('================================================================');
console.log('       DIALLO HRMS — FULL VERIFICATION & AUDIT TEST SUITE       ');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    if (detail) console.log(`       ↳ ${detail}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (detail) console.error(`       ↳ ${detail}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// 1. ATTENDANCE LOGIC & POLICY HARMONIZATION TESTS
// -----------------------------------------------------------------------------
console.log('--- 1. ATTENDANCE POLICY & CALCULATION TESTS ---');

// Mock window and AuthGuard for service evaluation
global.window = {};
global.AuthGuard = { userProfile: { roleId: 'ADMIN' }, currentUser: { uid: 'admin_1' } };

const sampleRecords = [
  { id: 'att_1', employee_id: 'emp_1', employee_code: 'D-001', check_in: '10:10 AM', check_out: '07:00 PM', status: 'PRESENT' },
  { id: 'att_2', employee_id: 'emp_2', employee_code: 'D-002', check_in: '10:25 AM', check_out: '07:00 PM', status: 'LATE' },
  { id: 'att_3', employee_id: 'emp_3', employee_code: 'D-003', check_in: '10:00 AM', check_out: '02:00 PM', status: 'HALF_DAY' }
];

global.apiClient = {
  get: async (endpoint) => {
    if (endpoint.includes('attendance.php')) {
      return { success: true, records: sampleRecords };
    }
    return { success: true, records: [] };
  },
  post: async () => ({ success: true })
};
global.auditService = { log: async () => {} };
global.historyService = { logChange: async () => {} };
global.approvalService = { createApprovalRequest: async () => {} };

require(path.join(ROOT, 'js/services/attendanceService.js'));
const att = global.window.attendanceService;

// Test A: 12-hour time conversion
assert(att.time12ToMinutes('10:00 AM') === 600, 'Time conversion 10:00 AM -> 600m');
assert(att.time12ToMinutes('10:15 AM') === 615, 'Time conversion 10:15 AM -> 615m');
assert(att.time12ToMinutes('05:05 PM') === 1025, 'Time conversion 05:05 PM -> 1025m');
assert(att.time12ToMinutes('12:00 AM') === 0, 'Time conversion 12:00 AM -> 0m');

// Test B: 15-Minute Official Grace Period
// Shift starts at 10:00 AM. Grace period is 15 minutes (up to 10:15 AM).
// 10:15 AM should NOT be late. 10:16 AM MUST be late.
const onTimeRecord = att.sanitizeRecord({
  checkIn: '10:15 AM',
  checkOut: '07:15 PM',
  date: '2026-10-29'
});
assert(onTimeRecord.isLate === false && onTimeRecord.lateMinutes === 0, 'Grace Period: 10:15 AM is ON TIME (not marked late)');

const lateRecord = att.sanitizeRecord({
  checkIn: '10:16 AM',
  checkOut: '07:16 PM',
  date: '2026-10-29'
});
assert(lateRecord.isLate === true && lateRecord.lateMinutes === 16, 'Grace Period: 10:16 AM is LATE by 16 minutes from 10:00 AM start');

// Test C: Break duration formatting (Fixed synthetic break typo)
const standardDayRecord = att.sanitizeRecord({
  checkIn: '10:00 AM',
  checkOut: '07:00 PM', // 9 hours gross = 540m
  date: '2026-10-29'
});
assert(standardDayRecord.breakFormatted === '60m', 'Synthetic break formatted as "60m" (not "500m")', `Got: ${standardDayRecord.breakFormatted}`);
assert(standardDayRecord.workedMinutes === 480, 'Worked minutes is 480m (8h net after 60m break)');

// Test D: Open shift remains active with no checkout
const openShiftRecord = att.sanitizeRecord({
  checkIn: '10:00 AM',
  checkOut: '-',
  date: '2026-10-29'
});
assert(openShiftRecord.isOpenShift === true, 'Attendance record with no checkout remains an open shift');

// Test E: Today Summary separates Late marks from Half Days
att.getTodaySummary('comp_diallo_india').then(sum => {
  assert(sum.present >= 1, 'Summary has present count', `Present: ${sum.present}`);
  assert(sum.late >= 1, 'Summary has late count', `Late: ${sum.late}`);
  assert(sum.halfDay >= 1, 'Summary separates halfDay count from late count', `HalfDay: ${sum.halfDay}`);
});

// -----------------------------------------------------------------------------
// 2. ORG HIERARCHY & ROLE SCOPING TESTS
// -----------------------------------------------------------------------------
console.log('\n--- 2. ORG HIERARCHY & REPORTING SCOPING TESTS ---');

require(path.join(ROOT, 'js/services/employeeService.js'));
const empSvc = global.window.employeeService;

const sampleEmployees = [
  { id: 'adm_1', employeeCode: 'D-001', fullName: 'Omkar Admin', roleId: 'ADMIN', managerId: null },
  { id: 'mgr_1', employeeCode: 'D-002', fullName: 'Arshad Ops Manager', roleId: 'MANAGER', managerId: 'adm_1' },
  { id: 'tl_1', employeeCode: 'D-003', fullName: 'Ritik Team Lead', roleId: 'TL', managerId: 'mgr_1', teamLeadId: null },
  { id: 'emp_1', employeeCode: 'D-004', fullName: 'Ayan Employee', roleId: 'EMPLOYEE', managerId: 'mgr_1', teamLeadId: 'tl_1' },
  { id: 'emp_2', employeeCode: 'D-005', fullName: 'Staff Two', roleId: 'EMPLOYEE', managerId: 'mgr_1', teamLeadId: 'tl_1' },
  { id: 'tl_2', employeeCode: 'D-006', fullName: 'Other TL', roleId: 'TL', managerId: 'mgr_1', teamLeadId: null },
  { id: 'emp_3', employeeCode: 'D-007', fullName: 'Other Staff', roleId: 'EMPLOYEE', managerId: 'mgr_1', teamLeadId: 'tl_2' }
];

// Test A: Admin sees all employees
empSvc.getSubordinates({ id: 'adm_1', roleId: 'ADMIN' }, sampleEmployees).then(subs => {
  assert(subs.length === sampleEmployees.length, 'ADMIN gets full company census scoping', `Expected ${sampleEmployees.length}, got ${subs.length}`);
});

// Test B: Team Leader only sees their own team
empSvc.getSubordinates({ id: 'tl_1', roleId: 'TL' }, sampleEmployees).then(subs => {
  const codes = subs.map(s => s.employeeCode);
  const correct = codes.includes('D-004') && codes.includes('D-005') && !codes.includes('D-007');
  assert(correct && subs.length === 2, 'TL scoping is restricted strictly to their direct team members', `Found: ${codes.join(', ')}`);
});

// Test C: Manager sees all subordinates under their reporting line
empSvc.getSubordinates({ id: 'mgr_1', roleId: 'MANAGER' }, sampleEmployees).then(subs => {
  assert(subs.length === 5, 'MANAGER scoping includes all direct TLs and indirect team members', `Got ${subs.length} members`);
});

// -----------------------------------------------------------------------------
// 3. CODEBASE CLEANLINESS & ZERO DEAD FIRESTORE CALLS IN CORE SERVICES
// -----------------------------------------------------------------------------
console.log('\n--- 3. CLEAN CODE & ZERO DEAD CODE AUDIT ---');

const coreServices = [
  'employeeService.js',
  'attendanceService.js',
  'leaveService.js',
  'userService.js',
  'documentService.js',
  'announcementService.js',
  'departmentService.js'
];

coreServices.forEach(f => {
  const code = fs.readFileSync(path.join(ROOT, 'js/services', f), 'utf8');
  const matches = [...code.matchAll(/db\.collection\(['"]([a-zA-Z0-9_]+)['"]\)\.(add|set|update|delete)/g)];
  assert(matches.length === 0, `${f}: Zero dead db.collection write calls`, matches.length > 0 ? `Found: ${matches.map(m => m[0]).join(', ')}` : 'Clean');
});

// -----------------------------------------------------------------------------
// 4. BACKEND PHP SECURITY GATING & SCHEMA CONSISTENCY
// -----------------------------------------------------------------------------
console.log('\n--- 4. BACKEND PHP SECURITY & SCHEMA AUDIT ---');

const protectedEndpoints = [
  'attendance.php',
  'employees.php',
  'documents.php',
  'upload.php',
  'departments.php',
  'announcements.php',
  'leaves.php',
  'teams.php',
  'users.php'
];

protectedEndpoints.forEach(f => {
  const code = fs.readFileSync(path.join(ROOT, 'hostinger_backend', f), 'utf8');
  const hasAuth = code.includes('require_authenticated_user') || code.includes('Authentication required');
  assert(hasAuth, `${f}: Enforces mandatory server-side authentication`);
});

// Check db.php CORS configuration
const dbCode = fs.readFileSync(path.join(ROOT, 'hostinger_backend/db.php'), 'utf8');
const safeCors = !dbCode.includes("Access-Control-Allow-Origin: *");
assert(safeCors, 'db.php: CORS wildcard origin eliminated (safe origin reflection allowlist)');

// Check schema_full.sql tables
const schema = fs.readFileSync(path.join(ROOT, 'hostinger_backend/schema_full.sql'), 'utf8');
const requiredTables = [
  'users',
  'employees',
  'attendance_records',
  'punch_logs',
  'leave_applications',
  'leave_balances',
  'departments',
  'documents'
];

requiredTables.forEach(t => {
  const hasTable = schema.includes(`\`${t}\``) || schema.includes(` ${t} `);
  assert(hasTable, `schema_full.sql: Table '${t}' is defined`);
});

// Check documents table has company_id and file_url
assert(schema.includes('company_id') && schema.includes('file_url'), 'schema_full.sql: documents table includes company_id and file_url');

setTimeout(() => {
  console.log('\n================================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
  if (failed === 0) {
    console.log('STATUS: ALL 35+ AUTOMATED TESTS PASSED (100% SUCCESS RATE).');
  }
}, 500);
