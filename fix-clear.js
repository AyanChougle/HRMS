const fs = require('fs');
let txt = fs.readFileSync('js/views/comms-view.js', 'utf8');

txt = txt.replace('onclick="CommsView.markAllRead()">Mark All as Read</button>', 
                  'onclick="CommsView.markAllRead()">Clear All Notifications</button>');

txt = txt.replace(/async markAllRead\(\) {[\s\S]*?},/, 
`async markAllRead() {
    await notificationService.deleteAllNotifications();
    Toast.success('All notifications cleared.');
    Router.mountView('communication');
  },`);

fs.writeFileSync('js/views/comms-view.js', txt);

let notif = fs.readFileSync('js/services/notificationService.js', 'utf8');
notif = notif.replace('// 5. MARK ALL NOTIFICATIONS AS READ', 
`// 5. CLEAR ALL NOTIFICATIONS
  async deleteAllNotifications(employeeId = null) {
    try {
      const targetEmp = employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      const uid = AuthGuard.currentUser?.uid;
      const batch = db.batch();
      
      if (targetEmp) {
        const snap = await db.collection('notifications').where('employeeId', '==', targetEmp).get();
        snap.docs.forEach(doc => batch.delete(doc.ref));
      }
      if (uid && uid !== targetEmp) {
        const snap2 = await db.collection('notifications').where('recipientUserId', '==', uid).get();
        snap2.docs.forEach(doc => batch.delete(doc.ref));
      }
      await batch.commit();
      return true;
    } catch (e) {
      console.warn('Error clearing notifications:', e);
      return false;
    }
  },

  // 5. MARK ALL NOTIFICATIONS AS READ`);

fs.writeFileSync('js/services/notificationService.js', notif);
console.log('Fixed UI to Clear All Notifications');
