/**
 * DIALLO HRMS — UNIFIED NOTIFICATION ENGINE (PHASE 13)
 * In-App Alerts, Multi-Channel Routing (Push & Email), Preferences, Real-time Listeners, and Deep Linking
 */

const notificationService = {
  activeListenerUnsubscribe: null,

  // Notification Category Schemes
  NOTIFICATION_CATEGORIES: [
    { code: 'ALL', name: 'All Alerts' },
    { code: 'LEAVE', name: 'Leave & Time-Off' },
    { code: 'ATTENDANCE', name: 'Attendance & Punches' },
    { code: 'PAYROLL', name: 'Payroll & Payslips' },
    { code: 'EXPENSES', name: 'Expense Reimbursements' },
    { code: 'DOCUMENTS', name: 'Dossier & Compliance' },
    { code: 'REQUESTS', name: 'HR Helpdesk Requests' },
    { code: 'ANNOUNCEMENTS', name: 'Company Announcements' }
  ],

  // 1. GET NOTIFICATIONS (Filtered by Category & Read status)
  async getNotifications(employeeId = null, category = 'ALL', limitCount = 30) {
    try {
      const targetEmp = employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      let query = db.collection('notifications')
        .where('employeeId', '==', targetEmp)
        .orderBy('createdAt', 'desc')
        .limit(limitCount);

      const snapshot = await query.get();
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (category && category !== 'ALL') {
        list = list.filter(n => (n.relatedModule || '').toUpperCase() === category.toUpperCase());
      }
      return list;
    } catch (e) {
      console.warn('Error fetching notifications:', e);
      return [];
    }
  },

  // 2. REAL-TIME UNREAD LISTENER FOR GLOBAL NAVBAR BADGE
  initRealtimeBadgeListener() {
    if (this.activeListenerUnsubscribe) {
      this.activeListenerUnsubscribe();
    }

    const targetEmp = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    if (!targetEmp) return;

    try {
      this.activeListenerUnsubscribe = db.collection('notifications')
        .where('employeeId', '==', targetEmp)
        .where('read', '==', false)
        .onSnapshot(snap => {
          const count = snap.docs.length;
          this.updateNavBadge(count);
        }, err => {
          console.warn('Notification snapshot warning:', err);
        });
    } catch (e) {
      console.warn('Realtime listener error:', e);
    }
  },

  updateNavBadge(count) {
    const badge = document.getElementById('top-nav-notification-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  },

  // 3. CREATE CENTRAL NOTIFICATION (WITH PREFERENCE CHECK & LOGGING)
  async createNotification(data) {
    try {
      const companyId = data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const employeeId = data.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;

      const payload = {
        companyId,
        employeeId,
        recipientUserId: data.recipientUserId || AuthGuard.currentUser?.uid || null,
        type: data.type || 'SYSTEM_ALERT',
        title: data.title || 'System Notification',
        message: data.message || '',
        priority: data.priority || 'NORMAL', // LOW, NORMAL, HIGH, URGENT
        relatedModule: data.relatedModule || 'general',
        relatedId: data.relatedId || null,
        read: false,
        readAt: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('notifications').add(payload);
      payload.id = docRef.id;

      // Log delivery record
      await db.collection('notificationDeliveries').add({
        notificationId: docRef.id,
        employeeId,
        channel: 'IN_APP',
        status: 'DELIVERED',
        sentAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return payload;
    } catch (e) {
      console.warn('Notification creation error:', e);
      return null;
    }
  },

  // 4. MARK SINGLE NOTIFICATION AS READ
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

  // 5. MARK ALL NOTIFICATIONS AS READ
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
      this.updateNavBadge(0);
      return true;
    } catch (e) {
      return false;
    }
  },

  // 6. FCM PUSH DEVICE TOKEN REGISTRATION
  async registerDeviceToken(token, platform = 'Web') {
    try {
      const userId = AuthGuard.currentUser?.uid;
      const employeeId = AuthGuard.userProfile?.employeeId || userId;
      const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';

      await db.collection('userDevices').doc(`${userId}_${platform}`).set({
        userId,
        employeeId,
        companyId,
        platform,
        token,
        deviceName: navigator.userAgent.slice(0, 50),
        isActive: true,
        lastSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return true;
    } catch (e) {
      console.warn('Device registration error:', e);
      return false;
    }
  },

  // 7. USER NOTIFICATION PREFERENCES
  async getPreferences(userId = null) {
    try {
      const uid = userId || AuthGuard.currentUser?.uid;
      const doc = await db.collection('notificationPreferences').doc(uid).get();
      if (doc.exists) return doc.data();

      // Default preferences
      return {
        leave: { inApp: true, push: true, email: true },
        attendance: { inApp: true, push: true, email: false },
        payroll: { inApp: true, push: true, email: true },
        expenses: { inApp: true, push: true, email: true },
        documents: { inApp: true, push: true, email: true },
        announcements: { inApp: true, push: true, email: true }
      };
    } catch (e) {
      return {};
    }
  },

  async updatePreferences(prefs) {
    try {
      const uid = AuthGuard.currentUser?.uid;
      await db.collection('notificationPreferences').doc(uid).set(prefs, { merge: true });
      await auditService.log('NOTIFICATION_PREFERENCES_UPDATED', 'COMMUNICATION', 'notificationPreferences', uid, prefs);
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 8. NOTIFICATION DEEP LINK NAVIGATION
  handleNotificationClick(relatedModule, relatedId) {
    if (!relatedModule) return;
    const mod = relatedModule.toLowerCase();

    if (mod === 'leave') Router.navigate('leave');
    else if (mod === 'attendance') Router.navigate('attendance');
    else if (mod === 'payroll') Router.navigate('payroll');
    else if (mod === 'expenses') Router.navigate('expenses');
    else if (mod === 'assets') Router.navigate('assets');
    else if (mod === 'documents') Router.navigate('documents');
    else if (mod === 'requests') Router.navigate('requests');
    else if (mod === 'announcements') Router.navigate('communication');
    else Router.navigate('dashboard');
  }
};

window.notificationService = notificationService;
