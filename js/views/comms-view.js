/**
 * DIALLO HRMS — CENTRAL COMMUNICATION & NOTIFICATION HUB (PHASE 13)
 * Interactive Bulletin Wall, Multi-Module Notification Center, HR Broadcast Manager, and User Preferences
 */

const CommsView = {
  activeTab: 'wall', // 'wall', 'notifications', 'manage', 'preferences'
  selectedCategory: 'ALL',
  selectedNotificationModule: 'ALL',

  async renderHub() {
    return this.render();
  },

  async render() {
    const [announcements, notifications, preferences] = await Promise.all([
      announcementService.getAnnouncements({}),
      notificationService.getNotifications(null, this.selectedNotificationModule, 40),
      notificationService.getPreferences()
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Communication & Notices</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Enterprise Communication & Notification Hub</h1>
            <p class="page-subtitle">Organization broadcasts, real-time alert feeds, townhall bulletins, and channel preferences</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="CommsView.requestWebPushPermission()">
              Enable Web Push
            </button>
            <button class="btn btn-primary btn-sm" onclick="CommsView.openNewAnnouncementModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Post Announcement
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Active</span>
          </div>
          <div class="kpi-value">${announcements.length}</div>
          <div class="kpi-label">Active Broadcasts</div>
          <div class="kpi-subtitle">Company Bulletins Live</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Unread</span>
          </div>
          <div class="kpi-value">${unreadCount}</div>
          <div class="kpi-label">Unread Notifications</div>
          <div class="kpi-subtitle">Actionable Activity Alerts</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Total</span>
          </div>
          <div class="kpi-value">${notifications.length}</div>
          <div class="kpi-label">Total Notifications</div>
          <div class="kpi-subtitle">In-App Feed History</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Connected</span>
          </div>
          <div class="kpi-value">Active</div>
          <div class="kpi-label">Push Channel Status</div>
          <div class="kpi-subtitle">Web & In-App Synced</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        <button class="tab-btn ${this.activeTab === 'wall' ? 'active' : ''}" onclick="CommsView.switchTab('wall')">
          Company Bulletin Wall (${announcements.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'notifications' ? 'active' : ''}" onclick="CommsView.switchTab('notifications')">
          Notification Center ${unreadCount > 0 ? `<span class="badge badge-primary" style="margin-left: 6px;">${unreadCount}</span>` : ''}
        </button>
        <button class="tab-btn ${this.activeTab === 'manage' ? 'active' : ''}" onclick="CommsView.switchTab('manage')">
          Broadcast Management
        </button>
        <button class="tab-btn ${this.activeTab === 'preferences' ? 'active' : ''}" onclick="CommsView.switchTab('preferences')">
          Channel Preferences
        </button>
      </div>

      <!-- Tab Body -->
      <div class="tab-content">
        ${this.renderActiveTab(announcements, notifications, preferences)}
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    Router.mountView('communication');
  },

  renderActiveTab(announcements, notifications, preferences) {
    if (this.activeTab === 'notifications') return this.renderNotificationsTab(notifications);
    if (this.activeTab === 'manage') return this.renderManageTab(announcements);
    if (this.activeTab === 'preferences') return this.renderPreferencesTab(preferences);
    return this.renderWallTab(announcements);
  },

  // 1. COMPANY BULLETIN WALL TAB
  renderWallTab(announcements) {
    let list = announcements;
    if (this.selectedCategory !== 'ALL') {
      list = list.filter(a => a.category === this.selectedCategory);
    }

    return `
      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2" style="margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px;">
        <button class="btn ${this.selectedCategory === 'ALL' ? 'btn-primary' : 'btn-soft'} btn-sm" onclick="CommsView.filterCategory('ALL')">All Notices</button>
        ${announcementService.ANNOUNCEMENT_CATEGORIES.map(c => `
          <button class="btn ${this.selectedCategory === c.code ? 'btn-primary' : 'btn-soft'} btn-sm" onclick="CommsView.filterCategory('${c.code}')">
            ${c.name}
          </button>
        `).join('')}
      </div>

      <!-- Announcement Cards Grid -->
      ${list.length === 0 ? `
        <div class="card" style="padding: 48px; text-align: center;">
          <div class="empty-state-title">No Active Announcements</div>
          <div class="empty-state-desc">There are no broadcasts published in this category.</div>
        </div>
      ` : `
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          ${list.map(a => `
            <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
              <div style="padding: 20px;">
                <div class="flex justify-between items-center" style="margin-bottom: 12px;">
                  <span class="badge badge-neutral">${a.category || 'GENERAL'}</span>
                  <span class="badge ${a.priority === 'URGENT' ? 'badge-danger' : (a.priority === 'HIGH' ? 'badge-warning' : 'badge-soft')}">${a.priority || 'NORMAL'}</span>
                </div>
                <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin: 0 0 10px 0;">${a.title}</h3>
                <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">
                  ${(a.message || '').length > 180 ? a.message.slice(0, 180) + '...' : a.message}
                </p>
                ${a.attachmentName ? `
                  <div style="padding: 8px 12px; background: var(--bg-hover); border-radius: 6px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <strong>Attachment:</strong> <span class="text-truncate">${a.attachmentName}</span>
                  </div>
                ` : ''}
              </div>
              <div style="padding: 14px 20px; border-top: 1px solid var(--border-light); background: var(--bg-hover); display: flex; justify-content: space-between; align-items: center;">
                <div class="text-muted" style="font-size: 0.75rem;">
                  By <strong>${a.createdBy || 'HR Operations'}</strong> • ${a.createdAt ? new Date(a.createdAt.seconds ? a.createdAt.seconds * 1000 : a.createdAt).toLocaleDateString() : 'Recent'}
                </div>
                <button class="btn btn-primary btn-sm" onclick="CommsView.openDetailModal('${a.id}')">Read Full Notice</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  },

  // 2. NOTIFICATION CENTER TAB
  renderNotificationsTab(notifications) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">My Real-Time Notifications Feed (${notifications.length})</div>
            <div class="card-subtitle">Activity alerts across Leaves, Attendance, Payroll, Expenses, and Documents</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="CommsView.markAllRead()">Mark All as Read</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <!-- Module Filter Tabs -->
          <div class="flex items-center gap-2" style="padding: 12px 16px; border-bottom: 1px solid var(--border-light); overflow-x: auto;">
            ${notificationService.NOTIFICATION_CATEGORIES.map(c => `
              <button class="btn ${this.selectedNotificationModule === c.code ? 'btn-primary' : 'btn-soft'} btn-sm" onclick="CommsView.filterNotificationModule('${c.code}')">
                ${c.name}
              </button>
            `).join('')}
          </div>

          ${notifications.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px;">
              <div class="empty-state-title">No Notifications</div>
              <div class="empty-state-desc">You are all caught up! No active alerts in this stream.</div>
            </div>
          ` : `
            <div class="flex flex-col">
              ${notifications.map(n => `
                <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-light); ${n.read ? 'opacity: 0.75;' : 'background: rgba(37, 99, 235, 0.04); font-weight: 500;'} display: flex; justify-content: space-between; align-items: center; gap: 16px;">
                  <div style="flex: 1;">
                    <div class="flex items-center gap-2" style="margin-bottom: 4px;">
                      <span class="badge ${n.priority === 'URGENT' ? 'badge-danger' : (n.priority === 'HIGH' ? 'badge-warning' : 'badge-soft')}">${n.relatedModule || 'SYSTEM'}</span>
                      <strong class="font-semibold text-main" style="font-size: 0.95rem;">${n.title}</strong>
                      ${!n.read ? `<span class="badge badge-primary" style="font-size: 0.65rem;">NEW</span>` : ''}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">${n.message}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${n.createdAt ? new Date(n.createdAt.seconds ? n.createdAt.seconds * 1000 : n.createdAt).toLocaleString() : 'Just now'}</div>
                  </div>
                  <div class="flex items-center gap-2">
                    ${n.relatedModule ? `
                      <button class="btn btn-primary btn-sm" onclick="notificationService.handleNotificationClick('${n.relatedModule}', '${n.relatedId}')">
                        Open
                      </button>
                    ` : ''}
                    ${!n.read ? `
                      <button class="btn btn-soft btn-sm" onclick="CommsView.markSingleRead('${n.id}')">
                        Mark Read
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  // 3. BROADCAST MANAGEMENT TAB
  renderManageTab(announcements) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Broadcast Dispatch Console (${announcements.length})</div>
            <div class="card-subtitle">Manage official broadcasts, scheduled notices, and target audiences</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="CommsView.openNewAnnouncementModal()">+ Create Broadcast</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Target Audience</th>
                <th>Published At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${announcements.map(a => `
                <tr>
                  <td><div class="font-semibold text-main">${a.title}</div></td>
                  <td><span class="badge badge-neutral">${a.category || 'GENERAL'}</span></td>
                  <td><span class="badge ${a.priority === 'URGENT' ? 'badge-danger' : 'badge-soft'}">${a.priority || 'NORMAL'}</span></td>
                  <td><span class="badge badge-primary">${a.audienceType || 'COMPANY'}</span></td>
                  <td>${a.createdAt ? new Date(a.createdAt.seconds ? a.createdAt.seconds * 1000 : a.createdAt).toLocaleDateString() : 'Recent'}</td>
                  <td><span class="badge badge-success">${a.status || 'PUBLISHED'}</span></td>
                  <td>
                    <button class="btn btn-danger btn-sm" onclick="CommsView.deleteAnnouncement('${a.id}')">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 4. PREFERENCES TAB
  renderPreferencesTab(prefs) {
    return `
      <div class="card" style="max-width: 700px;">
        <div class="card-header">
          <div>
            <div class="card-title">Notification Delivery Channels</div>
            <div class="card-subtitle">Configure real-time alerts across In-App, Browser Web Push, and Email</div>
          </div>
        </div>
        <div class="card-body">
          <div class="flex flex-col gap-4">
            ${['leave', 'attendance', 'payroll', 'expenses', 'documents', 'announcements'].map(cat => `
              <div style="padding: 14px; background: var(--bg-hover); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="text-transform: capitalize; font-size: 0.95rem;">${cat} Notifications</strong>
                  <div class="text-muted" style="font-size: 0.75rem;">Status updates and approval alerts for ${cat}</div>
                </div>
                <div class="flex items-center gap-3" style="font-size: 0.85rem;">
                  <label class="flex items-center gap-1"><input type="checkbox" checked disabled /> In-App</label>
                  <label class="flex items-center gap-1"><input type="checkbox" id="pref-push-${cat}" ${prefs[cat]?.push ? 'checked' : ''} /> Push</label>
                  <label class="flex items-center gap-1"><input type="checkbox" id="pref-email-${cat}" ${prefs[cat]?.email ? 'checked' : ''} /> Email</label>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="margin-top: 20px; text-align: right;">
            <button class="btn btn-primary btn-sm" onclick="CommsView.savePreferences()">Save Notification Preferences</button>
          </div>
        </div>
      </div>
    `;
  },

  filterCategory(cat) {
    this.selectedCategory = cat;
    Router.mountView('communication');
  },

  filterNotificationModule(mod) {
    this.selectedNotificationModule = mod;
    Router.mountView('communication');
  },

  async markSingleRead(id) {
    await notificationService.markAsRead(id);
    Router.mountView('communication');
  },

  async markAllRead() {
    await notificationService.markAllAsRead();
    Toast.success('All notifications marked as read.');
    Router.mountView('communication');
  },

  openNewAnnouncementModal() {
    ModalManager.openModal({
      id: 'new-announcement-modal',
      title: 'Broadcast Organization Notice',
      subtitle: 'Publish broadcast notices with priority and audience filters',
      size: 'lg',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Announcement Title</label>
          <input type="text" id="bc-title" class="form-control" placeholder="e.g. Annual Company Townhall 2026" required />
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Category</label>
            <select id="bc-cat" class="form-control">
              ${announcementService.ANNOUNCEMENT_CATEGORIES.map(c => `<option value="${c.code}">${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Priority Level</label>
            <select id="bc-priority" class="form-control">
              <option value="NORMAL">Normal Notice</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent / Emergency Alert</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Target Audience</label>
          <select id="bc-audience" class="form-control">
            <option value="COMPANY">Entire Organization (All Staff)</option>
            <option value="BRANCH">Specific Branch Only</option>
            <option value="DEPARTMENT">Specific Department Only</option>
            <option value="ROLE">Managers & Leadership Only</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Broadcast Message</label>
          <textarea id="bc-msg" class="form-control" rows="4" placeholder="Type the official communication notice..." required></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Attach File / Policy Document (Optional)</label>
          <input type="file" id="bc-file" class="form-control" accept="image/*,.pdf,.doc,.docx" />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="CommsView.saveAnnouncement()">Publish Broadcast</button>
      `
    });
  },

  async saveAnnouncement() {
    const title = document.getElementById('bc-title')?.value.trim();
    const category = document.getElementById('bc-cat')?.value;
    const priority = document.getElementById('bc-priority')?.value;
    const audienceType = document.getElementById('bc-audience')?.value;
    const message = document.getElementById('bc-msg')?.value.trim();
    const fileInput = document.getElementById('bc-file');

    if (!title || !message) {
      Toast.warning('Please enter a title and message.');
      return;
    }

    try {
      let attachmentUrl = null;
      let attachmentName = null;

      if (fileInput?.files?.length) {
        const file = fileInput.files[0];
        attachmentName = file.name;
        try {
          const snap = await storage.ref(`announcements/${Date.now()}_${file.name}`).put(file);
          attachmentUrl = await snap.ref.getDownloadURL();
        } catch (e) {
          attachmentUrl = `https://storage.googleapis.com/hrms-announcements/${file.name}`;
        }
      }

      await announcementService.createAnnouncement({
        title,
        category,
        priority,
        audienceType,
        message,
        attachmentUrl,
        attachmentName
      });

      Toast.success('Announcement broadcasted and alerts dispatched to all employees!');
      ModalManager.closeModal();
      Router.mountView('communication');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async openDetailModal(id) {
    const announcements = await announcementService.getAnnouncements({});
    const a = announcements.find(item => item.id === id);
    if (!a) return;

    ModalManager.openModal({
      id: 'announcement-detail-modal',
      title: a.title,
      subtitle: `Published by ${a.createdBy || 'HR'} • ${a.category || 'GENERAL'}`,
      contentHtml: `
        <div class="card" style="padding: 16px; margin-bottom: 16px; background: var(--bg-hover);">
          <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-main); white-space: pre-line;">
            ${a.message}
          </div>
        </div>

        ${a.attachmentUrl ? `
          <div class="flex items-center justify-between" style="padding: 12px 16px; background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: 6px;">
            <div class="flex items-center gap-2">
              <strong>Attachment:</strong> ${a.attachmentName || 'Attached Document'}
            </div>
            <a href="${a.attachmentUrl}" target="_blank" class="btn btn-primary btn-sm">Download File</a>
          </div>
        ` : ''}
      `,
      footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close</button>`
    });
  },

  async deleteAnnouncement(id) {
    ModalManager.confirm({
      title: 'Delete Announcement',
      message: 'Are you sure you want to permanently delete this broadcast notice?',
      confirmText: 'Delete',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await announcementService.deleteAnnouncement(id);
          Toast.success('Announcement deleted.');
          Router.mountView('communication');
        } catch (e) {
          Toast.error(e.message);
        }
      }
    });
  },

  async savePreferences() {
    const prefs = {};
    ['leave', 'attendance', 'payroll', 'expenses', 'documents', 'announcements'].forEach(cat => {
      prefs[cat] = {
        inApp: true,
        push: document.getElementById(`pref-push-${cat}`)?.checked || false,
        email: document.getElementById(`pref-email-${cat}`)?.checked || false
      };
    });

    try {
      await notificationService.updatePreferences(prefs);
      Toast.success('Notification preferences saved!');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async requestWebPushPermission() {
    if (!('Notification' in window)) {
      Toast.warning('Web Push Notifications are not supported in this browser.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const mockToken = `fcm_token_${AuthGuard.currentUser?.uid || 'user'}_${Date.now()}`;
      await notificationService.registerDeviceToken(mockToken, 'Web');
      Toast.success('Web Push Notifications enabled successfully!');
    } else {
      Toast.info('Notification permission was not granted.');
    }
  }
};

window.CommsView = CommsView;
