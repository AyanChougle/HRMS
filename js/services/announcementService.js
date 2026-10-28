
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
  async getAnnouncements(filters = {}, limitCount = 30) {
    try {
      const opts = filters || {};
      const limit = typeof limitCount === 'number' ? limitCount : (opts.limit || 30);

      // 1. Primary: Hostinger MySQL API
      if (typeof apiClient !== 'undefined') {
        try {
          const params = {};
          if (opts.category && opts.category !== 'ALL') params.type = opts.category;
          if (opts.priority && opts.priority !== 'ALL') params.priority = opts.priority;
          const resp = await apiClient.get('announcements.php', params);
          if (resp && resp.success && Array.isArray(resp.announcements)) {
            return resp.announcements.slice(0, limit).map(a => ({
              id: a.id,
              title: a.title,
              message: a.content || '',
              content: a.content || '',
              category: a.type || 'GENERAL',
              type: a.type || 'GENERAL',
              priority: a.priority || 'NORMAL',
              audienceType: a.target_audience || 'ALL',
              createdBy: a.author_name || 'HR Broadcast',
              createdAt: a.created_at,
              expiresAt: a.expires_at,
              status: 'PUBLISHED'
            }));
          }
        } catch (apiErr) {
          console.warn('[announcementService] MySQL fetch notice:', apiErr.message);
        }
      }

      // 2. Fallback to Firestore
      const companyId = opts.companyId || (typeof AuthGuard !== 'undefined' && AuthGuard?.userProfile?.companyId) || 'comp_diallo_india';
      let query = db.collection('announcements').where('companyId', '==', companyId);

      if (opts.status && opts.status !== 'ALL') {
        query = query.where('status', '==', opts.status);
      }

      let snapshot;
      try {
        snapshot = await query.orderBy('createdAt', 'desc').limit(limit).get();
      } catch (idxErr) {
        snapshot = await query.limit(limit).get();
      }
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt || 0).getTime() || 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt || 0).getTime() || 0);
        return timeB - timeA;
      });

      // Exclude demo announcements
      const DEMO_TITLES = ['q3 town hall', 'diwali festive', 'annual group medical insurance'];
      list = list.filter(a => {
        const titleLower = (a.title || '').toLowerCase();
        return !docIdIsDemo(a.id) && !DEMO_TITLES.some(dt => titleLower.includes(dt));
      });

      function docIdIsDemo(id) {
        return id && (id.startsWith('ANN_DEMO') || id.startsWith('ANN00'));
      }

      if (opts.category && opts.category !== 'ALL') {
        list = list.filter(a => a && a.category === opts.category);
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
        priority: data.priority || 'NORMAL',
        audienceType: data.audienceType || 'ALL',
        audienceIds: data.audienceIds || [],
        attachmentUrl: data.attachmentUrl || null,
        attachmentName: data.attachmentName || null,
        publishAt: data.publishAt || new Date().toISOString(),
        expiresAt: data.expiresAt || null,
        status: data.status || 'PUBLISHED',
        createdBy: createdByName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // 1. Authoritative Save to MySQL
      if (typeof apiClient !== 'undefined') {
        try {
          const resp = await apiClient.post('announcements.php', {
            title: payload.title,
            content: payload.message,
            type: payload.category,
            priority: payload.priority,
            target_audience: payload.audienceType,
            author_name: createdByName,
            expires_at: payload.expiresAt
          });
          if (resp && resp.id) payload.id = resp.id;
        } catch (apiErr) {
          console.warn('[announcementService] MySQL post warning:', apiErr.message);
        }
      }

      if (!payload.id) {
        const docRef = await db.collection('announcements').add(payload);
        payload.id = docRef.id;
      }

      await auditService.log('ANNOUNCEMENT_PUBLISHED', 'COMMUNICATION', 'announcements', String(payload.id), payload).catch(() => {});
      return payload;
    } catch (err) {
      console.error('Error creating announcement:', err);
      throw err;
    }
  },

  // 3. ARCHIVE / DELETE ANNOUNCEMENT
  async deleteAnnouncement(id) {
    try {
      if (typeof apiClient !== 'undefined') {
        try {
          await apiClient.delete(`announcements.php?id=${encodeURIComponent(id)}`);
        } catch (_) {}
      }
      try {
        await db.collection('announcements').doc(String(id)).delete();
      } catch (_) {}
      await auditService.log('ANNOUNCEMENT_DELETED', 'COMMUNICATION', 'announcements', String(id), {}).catch(() => {});
      return true;
    } catch (e) {
      throw e;
    }
  }
};

window.announcementService = announcementService;
