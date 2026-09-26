const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/services/announcementService.js';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/if \(filters\.category && filters\.category !== 'ALL'\) \{\s*list = list\.filter\(a => a\.category === filters\.category\);\s*\}/g,
`if (opts.category && opts.category !== 'ALL') {
        list = list.filter(a => a && a.category === opts.category);
      }`);

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed announcementService.js category error');
