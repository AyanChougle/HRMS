const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let c = fs.readFileSync(path, 'utf8');

// Fix the &quot; issue — replace HTML-entity quotes inside JS string with escaped quotes
// The problem is &quot; inside template literal onclick attributes
c = c.replace(/&quot;\\\\'/g, "\"\\\\'\"");

fs.writeFileSync(path, c, 'utf8');
console.log('FIX APPLIED');
