const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let code = fs.readFileSync(path, 'utf8');

// Replace the literal \n before openCertifyModal
code = code.replace(/\\n\s*openCertifyModal/g, '\n  openCertifyModal');
// Replace the literal \n before button
code = code.replace(/\\n\s*<button class="btn btn-danger/g, '\n                          <button class="btn btn-danger');

fs.writeFileSync(path, code, 'utf8');
console.log('Cleaned up training-view.js');
