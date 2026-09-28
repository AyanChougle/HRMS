const fs = require('fs');
let c = fs.readFileSync('js/views/training-view.js', 'utf8');

c = c.replace(/\$\{this\.async renderActiveTab/, '${await this.renderActiveTab');
c = c.replace(/renderActiveTab\(trainees, trainers, programs, isEmployee\) {/, 'async renderActiveTab(trainees, trainers, programs, isEmployee) {');

fs.writeFileSync('js/views/training-view.js', c);
console.log('Fixed training syntax');
