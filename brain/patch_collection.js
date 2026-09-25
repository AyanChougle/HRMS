const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/db\.collection\('attendance'\)/g, "db.collection('attendanceRecords')");

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed collection name');
