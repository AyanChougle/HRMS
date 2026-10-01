const fs = require('fs');
let txt = fs.readFileSync('js/services/notificationService.js', 'utf8');

txt = txt.replace('handleNotificationClick(relatedModule, relatedId) {', 
`async handleNotificationClick(relatedModule, relatedId, notificationId) {
    if (notificationId) {
      await this.deleteNotification(notificationId);
    }`);

txt = txt.replace('// 8. NOTIFICATION DEEP LINK NAVIGATION', 
`// DELETE NOTIFICATION
  async deleteNotification(notificationId) {
    try {
      await db.collection('notifications').doc(notificationId).delete();
    } catch (e) {
      console.warn('Error deleting notification:', e);
    }
  },

  // 8. NOTIFICATION DEEP LINK NAVIGATION`);

fs.writeFileSync('js/services/notificationService.js', txt);
console.log('Fixed handleNotificationClick');
