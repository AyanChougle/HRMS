/**
 * DIALLO HRMS — NOTIFICATION SERVICE (PHASE 11)
 * Real-time notification streams for Leaves, Expenses, Documents, Requests, and Payslips
 */

const notificationService = {
  // 1. GET NOTIFICATIONS FOR LOGGED IN EMPLOYEE
  async getNotifications(employeeId = null) {
    try {
      const targetEmp = employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      const snapshot = await db.collection('notifications')
        .where('employeeId', '==', targetEmp)
        .orderBy('createdAt', 'desc')
        .limit(25)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching notifications:', e);
      return [];
    }
  },

  // 2. CREATE NOTIFICATION
  async createNotification(data) {
    try {
      const payload = {
        companyId: data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        employeeId: data.employeeId,
        type: data.type || 'ANNOUNCEMENT',
        title: data.title || 'System Notification',
        message: data.message || '',
        read: false,
        priority: data.priority || 'NORMAL', // NORMAL, HIGH, URGENT
        relatedModule: data.relatedModule || 'general',
        relatedId: data.relatedId || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('notifications').add(payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.warn('Could not create notification:', e);
      return null;
    }
  },

  // 3. MARK SINGLE NOTIFICATION AS READ
  async markAsRead(notificationId) {
    try {
      await db.collection('notifications').doc(notificationId).update({
        read: true,
        readAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  // 4. MARK ALL NOTIFICATIONS AS READ
  async markAllAsRead(employeeId = null) {
    try {
      const targetEmp = employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      const snap = await db.collection('notifications')
        .where('employeeId', '==', targetEmp)
        .where('read', '==', false)
        .get();

      const batch = db.batch();
      snap.docs.forEach(doc => {
        batch.update(doc.ref, { read: true, readAt: firebase.firestore.FieldValue.serverTimestamp() });
      });
      await batch.commit();
      return true;
    } catch (e) {
      return false;
    }
  }
};

window.notificationService = notificationService;
