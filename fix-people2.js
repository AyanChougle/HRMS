const fs = require('fs');
let c = fs.readFileSync('js/views/people-view.js', 'utf8');

const regex = /<button[^>]*purgeDemoEmployees\(\)[^>]*>[\s\S]*?<\/button>/g;
c = c.replace(regex, '');

const funcRegex = /purgeDemoEmployees\(\)\s*{[\s\S]*?},/g;
c = c.replace(funcRegex, '');

fs.writeFileSync('js/views/people-view.js', c);
console.log('Removed purge functions');
