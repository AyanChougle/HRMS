/**
 * DIALLO HRMS — LIVE ATTENDANCE & DESKTOP PRESENCE VIEW
 * Real-time monitoring of desktop system presence, idle time, lock state, and web heartbeats
 */

const LivePresenceView = {
  staleMs: 90000,

  fmtSeconds(s) {
    s = Math.max(0, Math.round(s || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  },

  derive(d) {
    const now = Date.now();
    const agentFresh = d.agentLastHeartbeatAt?.toDate ?
      now - d.agentLastHeartbeatAt.toDate().getTime() <= this.staleMs : false;
    const browserFresh = d.browserLastHeartbeatAt?.toDate ?
      now - d.browserLastHeartbeatAt.toDate().getTime() <= this.staleMs : false;

    let system = agentFresh ? (d.agentStatus || 'ACTIVE') : 'OFFLINE';
    let browser = browserFresh ? (d.browserStatus || 'ACTIVE') : 'DISCONNECTED';
    if (agentFresh && browser === 'DISCONNECTED') browser = 'TAB CLOSED / WEB OFFLINE';

    return { system, browser, agentFresh, browserFresh };
  },

  async getPresenceData() {
    try {
      const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      let q = db.collection('employeePresence');
      if (companyId) q = q.where('companyId', '==', companyId);
      const snap = await q.get();
      return snap.docs.map(x => ({ id: x.id, ...x.data() })).map(d => ({ ...d, ...this.derive(d) }));
    } catch (e) {
      console.warn('Error fetching employee presence:', e);
      return [];
    }
  },

  async render() {
    const rows = await this.getPresenceData();
    const counts = rows.reduce((a, r) => {
      a[r.system] = (a[r.system] || 0) + 1;
      return a;
    }, {});

    const statusBadgeClass = (s) => {
      switch (s) {
        case 'ACTIVE': return 'badge-success';
        case 'IDLE': return 'badge-warning';
        case 'LOCKED': return 'badge-neutral';
        case 'SLEEPING': return 'badge-soft';
        case 'OFFLINE': default: return 'badge-danger';
      }
    };

    const browserBadgeClass = (b) => {
      if (b === 'ACTIVE') return 'badge-success';
      if (b === 'HIDDEN') return 'badge-warning';
      if (b && b.includes('TAB CLOSED')) return 'badge-warning';
      return 'badge-neutral';
    };

    return `
      <!-- Live Presence KPI Metric Cards -->
      <div class="kpi-grid" style="margin-bottom: 20px;">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light, #ecfdf5); color: var(--success, #10b981);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span class="kpi-trend positive">Desktop Active</span>
          </div>
          <div class="kpi-value">${counts['ACTIVE'] || 0}</div>
          <div class="kpi-label">Active at Workstations</div>
          <div class="kpi-subtitle">Input active within 5 minutes</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light, #fffbeb); color: var(--warning, #f59e0b);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span class="kpi-trend neutral">Idle</span>
          </div>
          <div class="kpi-value">${counts['IDLE'] || 0}</div>
          <div class="kpi-label">Idle / Away from Desk</div>
          <div class="kpi-subtitle">No input for &gt; 5 minutes</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light, #eff6ff); color: var(--info, #3b82f6);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span class="kpi-trend neutral">Locked / Sleep</span>
          </div>
          <div class="kpi-value">${(counts['LOCKED'] || 0) + (counts['SLEEPING'] || 0)}</div>
          <div class="kpi-label">Windows Locked / Sleeping</div>
          <div class="kpi-subtitle">${counts['LOCKED'] || 0} Locked • ${counts['SLEEPING'] || 0} Suspended</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--danger-light, #fef2f2); color: var(--danger, #ef4444);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <span class="kpi-trend neutral">Offline</span>
          </div>
          <div class="kpi-value">${counts['OFFLINE'] || 0}</div>
          <div class="kpi-label">Agent Offline</div>
          <div class="kpi-subtitle">Heartbeat expired (&gt; 90s)</div>
        </div>
      </div>

      <!-- Live Roster Card -->
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="card-title">Real-Time Desktop & Web Presence (${rows.length})</div>
            <div class="card-subtitle">Desktop agent reports OS-level user activity and idle states; web browser reports focus and tab visibility</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="LivePresenceView.refresh()">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Status
            </button>
          </div>
        </div>

        <div class="card-body" style="padding: 0;">
          ${rows.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="empty-state-title">No Desktop Agent Heartbeats</div>
              <div class="empty-state-desc">Desktop background agent heartbeats or web presence events will appear here as employees punch in.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Desktop Agent State</th>
                  <th>Web Browser State</th>
                  <th>Idle Duration</th>
                  <th>Last Desktop Heartbeat</th>
                  <th>Last Web Heartbeat</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(r => `
                  <tr>
                    <td>
                      <div class="flex items-center gap-2">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem;">
                          ${(r.employeeName || 'Staff').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div class="font-semibold text-main">${r.employeeName || 'Staff'}</div>
                          <div class="text-muted" style="font-size: 0.75rem;">ID: ${r.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge ${statusBadgeClass(r.system)}">
                        <span class="badge-dot"></span>
                        ${r.system}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${browserBadgeClass(r.browser)}">
                        ${r.browser}
                      </span>
                    </td>
                    <td>
                      <strong>${this.fmtSeconds(r.idleSeconds)}</strong>
                    </td>
                    <td>
                      <span class="text-muted" style="font-size: 0.8rem;">
                        ${r.agentLastHeartbeatAt?.toDate ? r.agentLastHeartbeatAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never / None'}
                      </span>
                    </td>
                    <td>
                      <span class="text-muted" style="font-size: 0.8rem;">
                        ${r.browserLastHeartbeatAt?.toDate ? r.browserLastHeartbeatAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'None'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  async mount(containerId = 'live-presence-container') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = await this.render();
  },

  async refresh() {
    if (window.AttendanceView && AttendanceView.activeTab === 'presence') {
      Router.mountView('attendance');
    } else {
      await this.mount();
    }
    if (typeof Toast !== 'undefined') {
      Toast.success('Live presence records refreshed.');
    }
  }
};

window.LivePresenceView = LivePresenceView;
