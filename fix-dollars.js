const fs = require('fs');
['js/views/trainer-dashboard-view.js', 'js/views/admin-dashboard-view.js'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.split('\\$').join('$');
  fs.writeFileSync(f, c);
  console.log('Fixed', f);
});
