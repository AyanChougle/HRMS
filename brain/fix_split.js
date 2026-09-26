const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/views/training-view.js';
let content = fs.readFileSync(filePath, 'utf8');

// Fix split multiline
content = content.replace(/value\.split\('\s+'\)/g, "value.split('\\n')");
content = content.replace(/value\.split\('\n'\)/g, "value.split('\\n')");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed split strings in training-view.js');
