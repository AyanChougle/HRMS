const fs = require('fs');
let txt = fs.readFileSync('js/views/people-view.js', 'utf8');

txt = txt.replace(
  "{ key: 'branchName', label: 'Branch', aliases: ['Branch Location', 'Location'] },",
  "{ key: 'branchName', label: 'Branch', aliases: ['Branch Location', 'Location', 'Center'] },"
);
fs.writeFileSync('js/views/people-view.js', txt);
