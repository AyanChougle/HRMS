const fs = require('fs');
let txt = fs.readFileSync('js/services/notificationService.js', 'utf8');

txt = txt.replace(/async deleteAllNotifications[\s\S]*?\/\/ 5\. MARK ALL NOTIFICATIONS AS READ/, 
`async deleteAllNotifications(employeeId = null) {
    try {
      const targetEmp = employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      const uid = AuthGuard.currentUser?.uid;
      
      let promises = [];
      if (targetEmp) {
        const snap = await db.collection('notifications').where('employeeId', '==', targetEmp).limit(500).get();
        snap.docs.forEach(doc => promises.push(doc.ref.delete()));
      }
      if (uid && uid !== targetEmp) {
        const snap2 = await db.collection('notifications').where('recipientUserId', '==', uid).limit(500).get();
        snap2.docs.forEach(doc => promises.push(doc.ref.delete()));
      }
      
      await Promise.all(promises);
      return true;
    } catch (e) {
      console.warn('Error clearing notifications:', e);
      return false;
    }
  },

  // 5. MARK ALL NOTIFICATIONS AS READ`);

fs.writeFileSync('js/services/notificationService.js', txt);
console.log('Fixed delete batch');
