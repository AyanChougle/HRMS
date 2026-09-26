const fs = require('fs');

function clean(file) {
  let c = fs.readFileSync(file, 'utf8');
  let start = c.indexOf('    const employeeId = AuthGuard.userProfile');
  if (start !== -1) {
    let secondStart = c.indexOf('    const employeeId = AuthGuard.userProfile', start + 10);
    if (secondStart !== -1) {
       // We have double!
       // Let's remove the first one.
       let end = c.indexOf('    }', start) + 6;
       // actually there is another '}' inside catch, so:
       let blockEnd = c.indexOf('}\n    }\n', start) + 8;
       c = c.substring(0, start) + c.substring(blockEnd);
       fs.writeFileSync(file, c);
       console.log('Cleaned', file);
    }
  }
}

clean('js/views/admin-dashboard-view.js');
clean('js/views/trainer-dashboard-view.js');
