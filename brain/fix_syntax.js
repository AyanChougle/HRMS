const fs = require('fs');
const filePath = 'D:/AYAN/HRMS/js/views/training-view.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace literal string '\\n' with actual newlines
content = content.replace(/\\n/g, '\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed training-view.js syntax error');
