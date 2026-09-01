/**
 * DIALLO HRMS — ANNOUNCEMENT & BROADCAST SERVICE (PHASE 13)
 * Organization-wide broadcast notices, audience filtering, attachments, and automated push fan-out
 */

const announcementService = {
  ANNOUNCEMENT_CATEGORIES: [
    { code: 'GENERAL', name: 'General Notice' },
    { code: 'HR', name: 'HR Operations & Policy' },
    { code: 'HOLIDAY', name: 'Official Holiday Announcement' },
    { code: 'PAYROLL', name: 'Payroll & Compensation' },
    { code: 'EVENT', name: 'Company Event & Townhall' },
    { code: 'TRAINING', name: 'Learning & Workshop' },
    { code: 'EMERGENCY', name: 'Urgent / Emergency Alert' },
    { code: 'MAINTENANCE', name: 'IT & Infrastructure Maintenance' }
  ],

  // 1. GET ANNOUNCEMENTS (Filtered by company, audience, and status)
  async getAnnouncements(filters = {}) {
    try {
      const companyId = filters.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      let query = db.collection('announcements').where('companyId', '==', companyId);

      if (filters.status && filters.status !== 'ALL') {
        query = query.where('status', '==', filters.status);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').limit(filters.limit || 30).get();
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (filters.category && filters.category !== 'ALL') {
        list = list.filter(a => a.category === filters.category);
      }

      return list;
    } catch (err) {
      console.warn('Error fetching announcements:', err);
      return [];
    }
  },

  // 2. CREATE / PUBLISH ANNOUNCEMENT (WITH AUTOMATED FAN-OUT NOTIFICATIONS)
  async createAnnouncement(data) {
    try {
      const companyId = data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const createdByName = AuthGuard.userProfile?.displayName || 'HR Broadcast';

      const payload = {
        companyId,
        title: data.title,
        message: data.message || data.content || '',
        category: data.category || 'GENERAL',
        priority: data.priority || 'NORMAL', // LOW, NORMAL, HIGH, URGENT
        audienceType: data.audienceType || 'COMPANY', // COMPANY, BRANCH, DEPARTMENT, ROLE
        audienceIds: data.audienceIds || [],
        attachmentUrl: data.attachmentUrl || null,
        attachmentName: data.attachmentName || null,
        publishAt: data.publishAt || new Date().toISOString(),
        expiresAt: data.expiresAt || null,
        status: data.status || 'PUBLISHED', // PUBLISHED, SCHEDULED, DRAFT, ARCHIVED
        createdBy: createdByName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('announcements').add(payload);
      payload.id = docRef.id;

      // Broadcast automated in-app notification to employees
      if (payload.status === 'PUBLISHED') {
        const empSnap = await db.collection('employees').where('companyId', '==', companyId).limit(50).get();
        empSnap.docs.forEach(async doc => {
          await notificationService.createNotification({
            companyId,
            employeeId: doc.id,
            type: 'ANNOUNCEMENT',
            title: `📢 Announcement: ${payload.title}`,
            message: payload.message.slice(0, 120),
            priority: payload.priority,
            relatedModule: 'announcements',
            relatedId: docRef.id
          });
        });
      }

      await auditService.log('ANNOUNCEMENT_PUBLISHED', 'COMMUNICATION', 'announcements', docRef.id, payload);
      return payload;
    } catch (err) {
      console.error('Error creating announcement:', err);
      throw err;
    }
  },

  // 3. ARCHIVE / DELETE ANNOUNCEMENT
  async deleteAnnouncement(id) {
    try {
      await db.collection('announcements').doc(id).delete();
      await auditService.log('ANNOUNCEMENT_DELETED', 'COMMUNICATION', 'announcements', id, {});
      return true;
    } catch (e) {
      throw e;
    }
  }
};

window.announcementService = announcementService;
