/**
 * DIALLO HRMS — MANAGER DASHBOARD (PHASE 3)
 * Focused on team headcount, team presence, team leave approvals, and regularization requests
 */

const ManagerDashboardView = {
  async render() {
    const userDisplayName = AuthGuard.userProfile?.displayName || 'Team Manager';
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <!-- Welcome Banner -->
      <div class="welcome-banner animate-fade-in">
        <div class="welcome-text">
          <h1>Manager Portal — ${userDisplayName} 👔</h1>
          <p>Team attendance oversight, leave approvals, and shift monitoring</p>
        </div>
        <div class="welcome-date-badge">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>${todayStr} (IST)</span>
        </div>
      </div>

      <!-- 4 Team Focused KPI Cards -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card" onclick="Router.navigate('employees')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Roster</span>
          </div>
          <div class="kpi-value" id="mgr-kpi-team-size">-</div>
          <div class="kpi-label">Team Members</div>
          <div class="kpi-subtitle">Direct reporting employees</div>
        </div>

        <div class="kpi-card" onclick="Router.navigate('attendance')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive" id="mgr-kpi-present-pct">0%</span>
          </div>
          <div class="kpi-value" id="mgr-kpi-team-present">-</div>
          <div class="kpi-label">Present Today</div>
          <div class="kpi-subtitle">Active on shift</div>
        </div>

        <div class="kpi-card" onclick="Router.navigate('leave')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Off</span>
          </div>
          <div class="kpi-value" id="mgr-kpi-team-leave">-</div>
          <div class="kpi-label">On Leave Today</div>
          <div class="kpi-subtitle">Approved absences</div>
        </div>

        <div class="kpi-card" onclick="ManagerDashboardView.scrollToApprovals()" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--danger-light); color: var(--danger);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend warning" id="mgr-kpi-approvals-status">Pending</span>
          </div>
          <div class="kpi-value" id="mgr-kpi-approvals-count">-</div>
          <div class="kpi-label">Pending Approvals</div>
          <div class="kpi-subtitle">Team requests awaiting review</div>
        </div>
      </div>

      <!-- Main Manager Grid -->
      <div class="dashboard-grid">
        <!-- Team Approvals Queue -->
        <div class="col-span-6 card" id="manager-approvals-section">
          <div class="card-header">
            <div class="card-title">Team Approvals Queue</div>
            <button class="btn btn-soft btn-sm" onclick="Router.navigate('leave')">View All</button>
          </div>
          <div class="card-body" id="manager-approvals-body">
            <div style="padding: 24px; text-align: center; color: var(--text-muted);">Loading pending requests...</div>
          </div>
        </div>

        <!-- Team Attendance Roster -->
        <div class="col-span-6 card">
          <div class="card-header">
            <div class="card-title">Today's Team Attendance</div>
            <span class="badge badge-primary">Live Roster</span>
          </div>
          <div class="card-body" id="manager-team-attendance-body">
            <div style="padding: 24px; text-align: center; color: var(--text-muted);">Loading team logs...</div>
          </div>
        </div>
      </div>
    `;
  },

  async postRender() {
    try {
      const [employees, attendanceSum, approvals] = await Promise.all([
        employeeService.getEmployees(),
        attendanceService.getTodaySummary(),
        approvalService.getPendingApprovals()
      ]);

      const teamSize = employees.length;
      const present = attendanceSum.present;
      const onLeave = attendanceSum.onLeave;
      const pendingCount = approvals.length;

      document.getElementById('mgr-kpi-team-size').textContent = teamSize;
      document.getElementById('mgr-kpi-team-present').textContent = present;
      document.getElementById('mgr-kpi-team-leave').textContent = onLeave;
      document.getElementById('mgr-kpi-approvals-count').textContent = pendingCount;

      const pct = teamSize > 0 ? Math.round((present / teamSize) * 100) : 0;
      document.getElementById('mgr-kpi-present-pct').textContent = `${pct}%`;

      // Render Approvals List
      const approvalsBody = document.getElementById('manager-approvals-body');
      if (approvals.length === 0) {
        approvalsBody.innerHTML = `
          <div class="empty-state" style="border: none; padding: 24px;">
            <div class="empty-state-icon" style="width: 36px; height: 36px; margin-bottom: 6px; background: var(--success-light); color: var(--success);">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div class="empty-state-title" style="font-size: 0.9rem;">No Pending Team Approvals</div>
            <div class="empty-state-desc" style="font-size: 0.78rem; margin-bottom: 0;">All team leave and regularization requests have been reviewed.</div>
          </div>
        `;
      } else {
        approvalsBody.innerHTML = `
          <div class="action-center-list">
            ${approvals.map(a => `
              <div class="action-item" id="mgr-act-${a.id}">
                <div class="action-item-info">
                  <div>
                    <div class="action-item-text">${a.employee} — <strong>${a.type}</strong></div>
                    <div class="action-item-meta">${a.detail}</div>
                  </div>
                </div>
                <div class="action-item-buttons">
                  <button class="btn btn-soft btn-sm" onclick="ManagerDashboardView.approve('${a.id}')">Approve</button>
                  <button class="btn btn-secondary btn-sm" onclick="ManagerDashboardView.reject('${a.id}')">Reject</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      // Render Team Attendance Table
      const teamBody = document.getElementById('manager-team-attendance-body');
      if (employees.length === 0) {
        teamBody.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No employees registered in your team.</div>`;
      } else {
        teamBody.innerHTML = `
          <div class="flex flex-col gap-2">
            ${employees.slice(0, 6).map(e => `
              <div class="flex items-center justify-between" style="padding: 8px 12px; border: 1px solid var(--border-light); border-radius: var(--radius-sm);">
                <div class="flex items-center gap-3">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem;">
                    ${e.avatar || 'EM'}
                  </div>
                  <div>
                    <div class="font-semibold text-main" style="font-size: 0.85rem;">${e.fullName || e.name}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${e.designation || 'Staff'}</div>
                  </div>
                </div>
                <span class="badge ${e.employmentStatus === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}">
                  ${e.employmentStatus || 'Active'}
                </span>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (err) {
      console.error('Error rendering manager dashboard:', err);
    }
  },

  scrollToApprovals() {
    document.getElementById('manager-approvals-section')?.scrollIntoView({ behavior: 'smooth' });
  },

  async approve(id) {
    try {
      await approvalService.resolveApproval(id, 'APPROVED');
      document.getElementById(`mgr-act-${id}`)?.remove();
      Toast.success('Request approved successfully!');
    } catch (e) {
      Toast.error(`Approval failed: ${e.message}`);
    }
  },

  async reject(id) {
    try {
      await approvalService.resolveApproval(id, 'REJECTED');
      document.getElementById(`mgr-act-${id}`)?.remove();
      Toast.warning('Request rejected.');
    } catch (e) {
      Toast.error(`Rejection failed: ${e.message}`);
    }
  }
};

window.ManagerDashboardView = ManagerDashboardView;
