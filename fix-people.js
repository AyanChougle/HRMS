const fs = require('fs');
let c = fs.readFileSync('js/views/people-view.js', 'utf8');

c = c.replace(/<button class="btn btn-secondary btn-sm" onclick="PeopleView.purgeDemoEmployees\(\)"[^>]*>[\s\S]*?<\/button>/, '');
c = c.replace(/async purgeDemoEmployees\(\) {[\s\S]*?},/g, '');

fs.writeFileSync('js/views/people-view.js', c);
console.log('Fixed people-view.js');
