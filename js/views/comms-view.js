/**
 * DIALLO HRMS — COMMUNICATION & ANNOUNCEMENTS MODULE (FIREBASE BACKED)
 * Broadcast announcements creator and live Company Wall feed backed by Firestore
 */

const CommsView = {
  async renderHub() {
    let announcements = [];
    try {
      announcements = await announcementService.getAnnouncements(null, 20);
    } catch (e) {
      console.warn('Could not fetch announcements:', e);
    }

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Communication</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Communication & Notices</h1>
            <p class="page-subtitle">Company broadcast announcements, townhall alerts, and organization bulletin wall</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="CommsView.openPostAnnouncementModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Post Announcement
            </button>
          </div>
        </div>
      </div>

      <!-- 5 Responsive Navigation Cards -->
      <div class="module-grid" style="margin-bottom: 24px;">
        <div class="module-nav-card" onclick="CommsView.scrollToWall()">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(13, 148, 136, 0.1); color: var(--accent-comms);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                </svg>
              </div>
              <span class="module-card-badge">${announcements.length} Posts</span>
            </div>
            <div class="module-card-content">
              <h3>Company Wall</h3>
              <p>Live feed of broadcast announcements, management updates, and townhall notices.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>View feed</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="CommsView.openPostAnnouncementModal()">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(37, 99, 235, 0.1); color: var(--primary);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </div>
              <span class="module-card-badge">Broadcast</span>
            </div>
            <div class="module-card-content">
              <h3>Broadcast Creator</h3>
              <p>Publish company notices by branch, department, or company-wide audience.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>New broadcast</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="CommsView.showSub('Policy Library')">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(124, 58, 237, 0.1); color: var(--accent-people);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <span class="module-card-badge">Handbooks</span>
            </div>
            <div class="module-card-content">
              <h3>HR Policy Documents</h3>
              <p>POSH compliance handbooks, code of conduct, travel guidelines, and IT policies.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>Open library</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="CommsView.showSub('Grievance Redressal')">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(220, 38, 38, 0.1); color: var(--danger);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <span class="module-card-badge">Confidential</span>
            </div>
            <div class="module-card-content">
              <h3>Grievance Desk</h3>
              <p>Confidential whistleblower channel, POSH committee escalations and inquiry logs.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>Grievance portal</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="CommsView.showSub('Surveys & Feedback')">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(22, 163, 74, 0.1); color: var(--success);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <span class="module-card-badge">eNPS</span>
            </div>
            <div class="module-card-content">
              <h3>Pulse Surveys</h3>
              <p>Employee Net Promoter Score (eNPS), quarterly mood checkers, and team pulse polls.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>Survey results</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>

      <!-- Company Wall Feed -->
      <div class="card" id="company-wall-section">
        <div class="card-header">
          <div>
            <div class="card-title">Live Company Wall Feed</div>
            <div class="card-subtitle">Organization notices published to Cloud Firestore</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="CommsView.openPostAnnouncementModal()">+ New Notice</button>
        </div>
        <div class="card-body">
          ${announcements.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px 10px;">
              <div class="empty-state-icon" style="width: 40px; height: 40px; margin-bottom: 8px; background: var(--primary-light); color: var(--primary);">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                </svg>
              </div>
              <div class="empty-state-title" style="font-size: 0.95rem;">No Announcements in Firestore</div>
              <div class="empty-state-desc" style="font-size: 0.8rem; margin-bottom: 12px;">Share notices, policy updates, and company events with your workforce.</div>
              <button class="btn btn-soft btn-sm" onclick="CommsView.openPostAnnouncementModal()">+ Post Announcement</button>
            </div>
          ` : `
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
              ${announcements.map(ann => `
                <div class="announcement-card">
                  <div class="flex items-center justify-between" style="margin-bottom: 4px;">
                    <span class="badge badge-neutral">${ann.tag || 'Notice'}</span>
                    <span class="announcement-date">${ann.date || 'Today'}</span>
                  </div>
                  <div class="announcement-title">${ann.title}</div>
                  <div class="announcement-desc">${ann.content || ann.description || ''}</div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  scrollToWall() {
    const el = document.getElementById('company-wall-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  },

  openPostAnnouncementModal() {
    ModalManager.openModal({
      id: 'post-ann-modal',
      title: 'Post Company Announcement',
      subtitle: 'Publish a bulletin notice to Cloud Firestore',
      contentHtml: `
        <form id="ann-form">
          <div class="form-row">
            <div class="col-8 form-group">
              <label class="form-label required">Announcement Title</label>
              <input type="text" id="ann-title" class="form-control" placeholder="e.g. Q3 All Hands Meeting" required />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Tag / Category</label>
              <select id="ann-tag" class="form-control">
                <option value="Notice">Notice</option>
                <option value="Townhall">Townhall</option>
                <option value="Policy">Policy Update</option>
                <option value="Celebration">Celebration</option>
              </select>
            </div>
            <div class="col-12 form-group">
              <label class="form-label required">Announcement Content</label>
              <textarea id="ann-content" class="form-control" rows="4" placeholder="Write announcement details..." required></textarea>
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="CommsView.saveAnnouncement()">Publish Announcement</button>
      `
    });
  },

  async saveAnnouncement() {
    const title = document.getElementById('ann-title')?.value.trim();
    const tag = document.getElementById('ann-tag')?.value;
    const content = document.getElementById('ann-content')?.value.trim();

    if (!title || !content) return;

    try {
      await announcementService.createAnnouncement({ title, tag, content });
      Toast.success('Announcement published to Cloud Firestore!');
      ModalManager.closeModal();
      Router.navigate('communication');
    } catch (err) {
      Toast.error(`Publish failed: ${err.message}`);
    }
  },

  showSub(title) {
    ModalManager.openModal({
      id: 'comms-sub-modal',
      title,
      subtitle: `Enterprise communication channel for ${title}`,
      contentHtml: `
        <div class="empty-state" style="padding: 24px;">
          <div class="empty-state-icon" style="background: rgba(13, 148, 136, 0.1); color: var(--accent-comms);">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
            </svg>
          </div>
          <div class="empty-state-title">${title} Active</div>
          <div class="empty-state-desc">Policies and communication flows for <strong>${title}</strong> are active.</div>
        </div>
      `,
      footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close</button>`
    });
  }
};

window.CommsView = CommsView;
