const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let c = fs.readFileSync(path, 'utf8');

// 1. Add ID to row
c = c.replace(
  `      return '<tr class="att-row-item" data-batch-status="' + bStatus + '">' +`,
  `      return '<tr id="att-row-' + t.id + '" class="att-row-item" data-batch-status="' + bStatus + '">' +`
);

// 2. Add class to cell
c = c.replace(
  `        '<td style="text-align:center;">' +\n          '<div style="display:inline-flex;gap:5px;flex-wrap:wrap;justify-content:center;">' +`,
  `        '<td class="att-status-cell" style="text-align:center;">' +\n          '<div style="display:inline-flex;gap:5px;flex-wrap:wrap;justify-content:center;">' +`
);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED row ids for attendance marking');
