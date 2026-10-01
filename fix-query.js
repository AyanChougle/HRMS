const fs = require('fs');
let txt = fs.readFileSync('js/services/notificationService.js', 'utf8');

txt = txt.replace(/\.where\('employeeId', '==', targetEmp\)\s*\.get\(\);/, 
  `.where('employeeId', '==', targetEmp).orderBy('createdAt', 'desc').limit(60).get().catch(e => db.collection('notifications').where('employeeId', '==', targetEmp).limit(60).get());`);

txt = txt.replace(/\.where\('recipientUserId', '==', uid\)\s*\.get\(\);/,
  `.where('recipientUserId', '==', uid).orderBy('createdAt', 'desc').limit(60).get().catch(e => db.collection('notifications').where('recipientUserId', '==', uid).limit(60).get());`);

fs.writeFileSync('js/services/notificationService.js', txt);
console.log('Fixed query limit');
