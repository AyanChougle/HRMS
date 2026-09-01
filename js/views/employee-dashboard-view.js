/**
 * DIALLO HRMS — EMPLOYEE SELF-SERVICE DASHBOARD (PHASE 3)
 * Focused on personal check-in status, leave balances, latest payslip, and notices
 */

const EmployeeDashboardView = {
  async render() {
    const userDisplayName = AuthGuard.userProfile?.displayName || 'Team Member';
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <!-- Welcome Banner -->
      <div class="welcome-banner animate-fade-in">
        <div class="welcome-text">
          <h1>Hello, ${userDisplayName} 👋</h1>
          <p>Your employee self-service workspace and daily timecard portal</p>
        </div>
        <div class="welcome-date-badge">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>${todayStr} (IST)</span>
        </div>
      </div>

      <!-- Live Self Check-In & Timecard Card -->
      <div class="card" style="margin-bottom: 24px; border: 2px solid var(--primary-light);">
        <div class="card-header">
          <div>
            <div class="card-title">My Today's Shift & Check-In Status</div>
            <div class="card-subtitle">General Shift: 09:00 AM – 06:00 PM IST</div>
          </div>
          <span class="badge ${ESSView.isPunchedIn ? 'badge-success' : 'badge-neutral'}" id="emp-shift-badge">
            <span class="badge-dot"></span> ${ESSView.isPunchedIn ? 'Checked IN' : 'Checked OUT'}
          </span>
        </div>
        <div class="card-body">
          <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 20px;">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Logged Work Time Today</div>
              <div style="font-size: 2.2rem; font-weight: 800; font-family: monospace; color: var(--primary);" id="emp-live-timer">
                00:00:00
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button class="btn btn-primary btn-lg" onclick="ESSView.togglePunch()">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>${ESSView.isPunchedIn ? 'Punch Out' : 'Web Punch In (GPS)'}</span>
              </button>
              <button class="btn btn-secondary btn-lg" onclick="Forms.openApplyLeaveModal()">
                <span>Apply Leave</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Employee 3 Core Grid -->
      <div class="dashboard-grid">
        <!-- Leave Balances -->
        <div class="col-span-6 card">
          <div class="card-header">
            <div class="card-title">My Leave Balances</div>
            <button class="btn btn-soft btn-sm" onclick="Forms.openApplyLeaveModal()">+ Apply Leave</button>
          </div>
          <div class="card-body">
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;" id="emp-leave-balances-grid">
              <div class="kpi-card" style="padding: 12px;">
                <div class="text-secondary" style="font-size: 0.8rem; font-weight: 600;">Privilege Leave (PL)</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary);">18 Days</div>
              </div>
              <div class="kpi-card" style="padding: 12px;">
                <div class="text-secondary" style="font-size: 0.8rem; font-weight: 600;">Casual Leave (CL)</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-attendance);">12 Days</div>
              </div>
              <div class="kpi-card" style="padding: 12px;">
                <div class="text-secondary" style="font-size: 0.8rem; font-weight: 600;">Sick Leave (SL)</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: var(--success);">12 Days</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Latest Payslip Card -->
        <div class="col-span-6 card">
          <div class="card-header">
            <div class="card-title">Latest Salary Statement</div>
            <span class="badge badge-success">Processed</span>
          </div>
          <div class="card-body">
            <div class="flex items-center justify-between" style="padding: 12px; background: var(--bg-hover); border-radius: var(--radius-sm); margin-bottom: 12px;">
              <div>
                <div class="font-semibold text-main" style="font-size: 0.9rem;">Monthly Payout (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})</div>
                <div class="text-muted" style="font-size: 0.75rem;">Disbursed via Direct Bank Transfer</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="Router.navigate('payroll')">View Payslip</button>
            </div>
            <div class="text-muted" style="font-size: 0.8rem;">
              Includes EPF (12%), ESIC, State Professional Tax and Section 192 TDS deductions.
            </div>
          </div>
        </div>

        <!-- Company Announcements -->
        <div class="col-span-12 card">
          <div class="card-header">
            <div class="card-title">Organization Notices & Townhall Updates</div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('communication')">Notice Board</button>
          </div>
          <div class="card-body" id="emp-announcements-body">
            <div style="padding: 20px; text-align: center; color: var(--text-muted);">Loading announcements...</div>
          </div>
        </div>
      </div>
    `;
  },

  async postRender() {
    try {
      // Connect live timer to ESSView
      const timerDisplay = document.getElementById('emp-live-timer');
      if (timerDisplay) {
        setInterval(() => {
          const hrs = String(Math.floor(ESSView.workSeconds / 3600)).padStart(2, '0');
          const mins = String(Math.floor((ESSView.workSeconds % 3600) / 60)).padStart(2, '0');
          const secs = String(ESSView.workSeconds % 60).padStart(2, '0');
          timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
        }, 1000);
      }

      // Fetch announcements
      const announcements = await announcementService.getAnnouncements(null, 3);
      const annBody = document.getElementById('emp-announcements-body');
      if (announcements.length === 0) {
        annBody.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No new company notices published.</div>`;
      } else {
        annBody.innerHTML = `
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
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
        `;
      }
    } catch (e) {
      console.error('Error rendering employee dashboard:', e);
    }
  }
};

window.EmployeeDashboardView = EmployeeDashboardView;
