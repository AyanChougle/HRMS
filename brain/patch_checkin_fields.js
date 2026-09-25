const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  `        punchIn: status === 'ABSENT' ? null : '10:00',\n        punchOut: status === 'PRESENT' ? '19:00' : (status === 'HALF_DAY' ? '16:00' : null),`,
  `        checkIn: status === 'ABSENT' ? '-' : '10:00 AM',\n        checkOut: status === 'PRESENT' ? '07:00 PM' : (status === 'HALF_DAY' ? '02:00 PM' : '-'),`
);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED checkIn checkOut for trainer override');
