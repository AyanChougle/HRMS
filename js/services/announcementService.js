/**
 * DIALLO HRMS — ANNOUNCEMENT & NOTIFICATION SERVICES
 * Real Firestore queries and creation for announcements and user alerts
 */

const announcementService = {
  // Get active announcements
  async getAnnouncements(companyId = null, limitCount = 10) {
    try {
      let query = db.collection('announcements').where('status', '==', 'ACTIVE');
      if (companyId) {
        query = query.where('companyId', '==', companyId);
      }
      const snapshot = await query.orderBy('publishedAt', 'desc').limit(limitCount).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching announcements:', err);
      return [];
    }
  },

  // Create announcement
  async createAnnouncement(data) {
    try {
      const payload = {
        title: data.title,
        content: data.content || data.description,
        description: data.content || data.description,
        tag: data.tag || 'Notice',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        companyId: data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        branchId: data.branchId || 'ALL',
        publishedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'ACTIVE',
        createdBy: AuthGuard.currentUser ? AuthGuard.currentUser.uid : 'SYSTEM'
      };

      const docRef = await db.collection('announcements').add(payload);
      payload.id = docRef.id;
      await auditService.log('ANNOUNCEMENT_POSTED', 'COMMUNICATION', 'announcements', docRef.id, payload);
      return payload;
    } catch (err) {
      console.error('Error creating announcement:', err);
      throw err;
    }
  }
};

const notificationService = {
  // Get unread notifications for the current user
  async getNotifications(userId) {
    try {
      if (!userId) return [];
      const snapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return [];
    }
  },

  // Send an in-app notification
  async sendNotification(userId, title, message, type = 'INFO') {
    try {
      const payload = {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('notifications').add(payload);
    } catch (err) {
      console.warn('Failed to send notification:', err);
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const snapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  }
};

window.announcementService = announcementService;
window.notificationService = notificationService;
