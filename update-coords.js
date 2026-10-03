const fs = require('fs');

const files = [
  'js/services/attendanceService.js',
  'js/services/attendanceSettingsService.js',
  'js/views/ess-view.js'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let txt = fs.readFileSync(file, 'utf8');
    txt = txt.replace(/19\.091100/g, '19.075975');
    txt = txt.replace(/73\.006000/g, '72.87738');
    txt = txt.replace(/73\.006/g, '72.87738'); // just in case
    fs.writeFileSync(file, txt);
    console.log('Updated coordinates in', file);
  }
});
