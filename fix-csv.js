const fs = require('fs');

// Fix people-view.js
let txt = fs.readFileSync('js/views/people-view.js', 'utf8');

// Add aliases
txt = txt.replace(
  "{ key: 'employeeCode', label: 'Employee Code', aliases: ['Emp Code', 'Code'] },",
  "{ key: 'employeeCode', label: 'Employee Code', aliases: ['Emp Code', 'Code', 'E-ID', 'EID'] },"
);
txt = txt.replace(
  "{ key: 'dateOfJoining', label: 'Joining Date', aliases: ['Date of Joining'] },",
  "{ key: 'dateOfJoining', label: 'Joining Date', aliases: ['Date of Joining', 'DOJ'] },"
);
txt = txt.replace(
  "{ key: 'phone', label: 'Phone', aliases: ['Mobile'] }",
  "{ key: 'phone', label: 'Phone', aliases: ['Mobile', 'Mobile No'] }"
);

// Map manager names to IDs
txt = txt.replace(
  "const emails = new Set(), codes = new Set();",
  "const emails = new Set(), codes = new Set();\n        ctx.managerMap = {};"
);
txt = txt.replace(
  "if (e.employeeCode) codes.add(String(e.employeeCode).toUpperCase().trim());",
  "if (e.employeeCode) codes.add(String(e.employeeCode).toUpperCase().trim());\n          if (e.fullName) ctx.managerMap[e.fullName.toLowerCase().trim()] = d.id;"
);

// Update importRow to use managerMap and map designation/department
txt = txt.replace(
  "manager: row.manager || '',",
  "manager: (row.manager && ctx.managerMap && ctx.managerMap[row.manager.toLowerCase().trim()]) ? ctx.managerMap[row.manager.toLowerCase().trim()] : (row.manager || ''),"
);

fs.writeFileSync('js/views/people-view.js', txt);


// Fix forms.js
let forms = fs.readFileSync('js/forms.js', 'utf8');
const ctcBlock = `<div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label">Monthly CTC Gross (INR ₹)</label>
              <input type="text" id="ef-salary" class="form-control font-bold" value="\${emp?.salary || '₹65,000/mo'}" placeholder="₹65,000/mo" />
            </div>
            <div class="col-6 form-group">
              <label class="form-label">UAN / PF Number</label>
              <input type="text" id="ef-uan" class="form-control" value="\${emp?.uan || ''}" placeholder="100987654321" maxlength="12" />
            </div>
          </div>`;

forms = forms.replace(ctcBlock, '');
fs.writeFileSync('js/forms.js', forms);

console.log('Fixed CSV logic and removed salary fields');
