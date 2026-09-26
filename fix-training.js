const fs = require('fs');
let c = fs.readFileSync('js/views/training-view.js', 'utf8');

c = c.replace(/renderActiveTab\(/, 'async renderActiveTab(');
c = c.replace(/\$\{this\.renderActiveTab/, '${await this.renderActiveTab');

fs.writeFileSync('js/views/training-view.js', c);
console.log('Fixed training-view.js async issue');
