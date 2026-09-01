/**
 * DIALLO HRMS — LEAVE MANAGEMENT MODULE (PHASE 6)
 * Leave Dashboard, Quota Ledgers, Dynamic Working-Day Apply Wizard, Multi-Role Approvals, and Calendars
 */

const LeaveView = {
  activeTab: 'all',
  currentFilters: {},

  async renderHub() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const isEmployeeOnly = role === 'EMPLOYEE';

    let summary = { onLeaveToday: 0, pendingRequests: 0, approvedCount: 0, rejectedCount: 0 };
    let balances = {};

    try {
      [summary, balances] = await Promise.all([
        leaveService.getLeaveDashboardSummary(),
        leaveService.getEmployeeBalances(employeeId)
      ]);
    } catch (e) {
      console.warn('Leave Hub data load warning:', e);
    }

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Leave</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Leave & Time-Off Management</h1>
            <p class="page-subtitle">Statutory leave entitlements, holiday calendars, working-day calculations, and multi-tier approval workflows</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="LeaveView.openApplyLeaveModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Apply Leave
            </button>
          </div>
        </div>
      </div>

      <!-- Leave Metrics KPI Cards -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card" onclick="LeaveView.setFilterStatus('All Status')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Absence</span>
          </div>
          <div class="kpi-value">${summary.onLeaveToday}</div>
          <div class="kpi-label">On Leave Today</div>
          <div class="kpi-subtitle">Approved absences</div>
        </div>

        <div class="kpi-card" onclick="LeaveView.setFilterStatus('PENDING')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend warning">${summary.pendingRequests > 0 ? 'Needs Action' : 'Clear'}</span>
          </div>
          <div class="kpi-value">${summary.pendingRequests}</div>
          <div class="kpi-label">Pending Requests</div>
          <div class="kpi-subtitle">Awaiting manager review</div>
        </div>

        <div class="kpi-card" onclick="LeaveView.setFilterStatus('APPROVED')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Approved</span>
          </div>
          <div class="kpi-value">${summary.approvedCount}</div>
          <div class="kpi-label">Approved Applications</div>
          <div class="kpi-subtitle">Current financial year</div>
        </div>

        <div class="kpi-card" onclick="LeaveView.setFilterStatus('REJECTED')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--danger-light); color: var(--danger);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Declined</span>
          </div>
          <div class="kpi-value">${summary.rejectedCount}</div>
          <div class="kpi-label">Rejected Requests</div>
          <div class="kpi-subtitle">Historical records</div>
        </div>
      </div>

      <!-- Navigation Sub-Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        ${!isEmployeeOnly ? `
          <button class="tab-btn ${this.activeTab === 'all' ? 'active' : ''}" onclick="LeaveView.switchTab('all')">All Leave Requests</button>
        ` : ''}
        <button class="tab-btn ${this.activeTab === 'my' || isEmployeeOnly ? 'active' : ''}" onclick="LeaveView.switchTab('my')">My Leave & Balances</button>
        ${role === 'MANAGER' || role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || role === 'HR' ? `
          <button class="tab-btn ${this.activeTab === 'team' ? 'active' : ''}" onclick="LeaveView.switchTab('team')">Team Leave Roster</button>
        ` : ''}
        <button class="tab-btn ${this.activeTab === 'calendar' ? 'active' : ''}" onclick="LeaveView.switchTab('calendar')">Leave Calendar</button>
        <button class="tab-btn ${this.activeTab === 'types' ? 'active' : ''}" onclick="LeaveView.switchTab('types')">Leave Schemes & Policy</button>
      </div>

      <!-- TAB CONTENT VIEWPORT -->
      <div id="leave-tab-content">
        ${await this.renderTabContent(balances, role)}
      </div>
    `;
  },

  async renderTabContent(balances, role) {
    if (this.activeTab === 'my' || role === 'EMPLOYEE') {
      return await this.renderMyLeaveTab(balances);
    } else if (this.activeTab === 'team') {
      return await this.renderTeamLeaveTab();
    } else if (this.activeTab === 'calendar') {
      return await this.renderCalendarTab();
    } else if (this.activeTab === 'types') {
      return await this.renderLeaveTypesTab();
    }
    return await this.renderAllRequestsTab();
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    Router.navigate('leave');
  },

  setFilterStatus(status) {
    this.currentFilters.status = status;
    this.activeTab = 'all';
    Router.navigate('leave');
  },

  // 1. ALL LEAVE REQUESTS TAB (ADMIN / HR)
  async renderAllRequestsTab() {
    const requests = await leaveService.getLeaveRequests(this.currentFilters);

    return `
      <!-- Toolbar Filters Card -->
      <div class="card" style="margin-bottom: 20px; padding: 16px;">
        <div class="flex items-center gap-3" style="flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <input type="text" id="leave-filter-search" class="form-control" placeholder="Search by Employee Code or Name..." value="${this.currentFilters.search || ''}" onkeydown="if(event.key==='Enter') LeaveView.applyFilters()" />
          </div>

          <select id="leave-filter-status" class="form-control" style="width: 160px;">
            <option value="All Status">All Status</option>
            <option value="PENDING" ${this.currentFilters.status === 'PENDING' ? 'selected' : ''}>Pending Review</option>
            <option value="APPROVED" ${this.currentFilters.status === 'APPROVED' ? 'selected' : ''}>Approved</option>
            <option value="REJECTED" ${this.currentFilters.status === 'REJECTED' ? 'selected' : ''}>Rejected</option>
            <option value="CANCELLED" ${this.currentFilters.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
          </select>

          <select id="leave-filter-type" class="form-control" style="width: 180px;">
            <option value="All Types">All Leave Types</option>
            <option value="AL" ${this.currentFilters.leaveTypeCode === 'AL' ? 'selected' : ''}>Annual Leave (PL)</option>
            <option value="CL" ${this.currentFilters.leaveTypeCode === 'CL' ? 'selected' : ''}>Casual Leave (CL)</option>
            <option value="SL" ${this.currentFilters.leaveTypeCode === 'SL' ? 'selected' : ''}>Sick Leave (SL)</option>
            <option value="ML" ${this.currentFilters.leaveTypeCode === 'ML' ? 'selected' : ''}>Maternity Leave (ML)</option>
          </select>

          <button class="btn btn-primary btn-sm" onclick="LeaveView.applyFilters()">Apply</button>
          <button class="btn btn-secondary btn-sm" onclick="LeaveView.clearFilters()">Clear</button>
        </div>
      </div>

      <!-- Leave Requests Table Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Leave Applications (${requests.length})</div>
            <div class="card-subtitle">Verified in Cloud Firestore</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="LeaveView.openApplyLeaveModal()">+ Apply Leave</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${requests.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-icon" style="width: 44px; height: 44px; margin-bottom: 8px; background: var(--primary-light); color: var(--primary);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div class="empty-state-title">No Leave Requests Found</div>
              <div class="empty-state-desc">No leave applications match the selected filter criteria.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Leave Scheme</th>
                  <th>Duration / Dates</th>
                  <th>Working Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${requests.map(r => `
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-cell-avatar">${(r.employeeName || 'EM').substring(0, 2).toUpperCase()}</div>
                        <div class="user-cell-info">
                          <span class="user-cell-name font-semibold">${r.employeeName || 'Staff'}</span>
                          <span class="user-cell-code font-bold" style="color: var(--primary);">${r.employeeCode || r.employeeId}</span>
                        </div>
                      </div>
                    </td>
                    <td><span class="font-medium text-main">${r.department || 'General'}</span></td>
                    <td><span class="badge badge-neutral">${r.leaveTypeName || r.leaveTypeCode}</span></td>
                    <td><strong class="text-main">${r.startDate}</strong> to <strong>${r.endDate}</strong></td>
                    <td><strong style="color: var(--primary);">${r.numberOfDays} ${r.numberOfDays === 1 ? 'Day' : 'Days'}</strong></td>
                    <td style="max-width: 180px; font-size: 0.8rem;">${r.reason}</td>
                    <td>
                      <span class="badge ${r.status === 'APPROVED' ? 'badge-success' : (r.status === 'PENDING' ? 'badge-warning' : (r.status === 'REJECTED' ? 'badge-danger' : 'badge-neutral'))}">
                        <span class="badge-dot"></span> ${r.status}
                      </span>
                    </td>
                    <td>
                      ${r.status === 'PENDING' ? `
                        <div class="flex items-center gap-1">
                          <button class="btn btn-soft btn-sm" onclick="LeaveView.approveLeave('${r.id}')">Approve</button>
                          <button class="btn btn-secondary btn-sm" onclick="LeaveView.openRejectModal('${r.id}')">Reject</button>
                        </div>
                      ` : (r.status === 'APPROVED' && r.startDate > new Date().toISOString().slice(0, 10) ? `
                        <button class="btn btn-ghost btn-sm text-danger" onclick="LeaveView.cancelLeave('${r.id}')">Cancel</button>
                      ` : '<span class="text-muted" style="font-size: 0.75rem;">Completed</span>')}
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

  applyFilters() {
    this.currentFilters = {
      search: document.getElementById('leave-filter-search')?.value.trim() || '',
      status: document.getElementById('leave-filter-status')?.value || 'All Status',
      leaveTypeCode: document.getElementById('leave-filter-type')?.value || 'All Types'
    };
    Router.navigate('leave');
  },

  clearFilters() {
    this.currentFilters = {};
    const s = document.getElementById('leave-filter-search'); if (s) s.value = '';
    const st = document.getElementById('leave-filter-status'); if (st) st.value = 'All Status';
    const t = document.getElementById('leave-filter-type'); if (t) t.value = 'All Types';
    Router.navigate('leave');
  },

  // 2. MY LEAVE TAB (EMPLOYEE SELF-SERVICE)
  async renderMyLeaveTab(balances) {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const requests = await leaveService.getLeaveRequests({ employeeId });
    const todayStr = new Date().toISOString().slice(0, 10);
    const upcoming = requests.filter(r => r.status === 'APPROVED' && r.startDate >= todayStr);

    return `
      <!-- 4 Quota Balance Cards -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Paid PL</span>
          </div>
          <div class="kpi-value">${balances.AL?.available ?? 18} Days</div>
          <div class="kpi-label">Annual Leave (PL)</div>
          <div class="kpi-subtitle">${balances.AL?.used || 0} Days Used of ${balances.AL?.allocated || 18}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Short Absences</span>
          </div>
          <div class="kpi-value">${balances.CL?.available ?? 12} Days</div>
          <div class="kpi-label">Casual Leave (CL)</div>
          <div class="kpi-subtitle">${balances.CL?.used || 0} Days Used of ${balances.CL?.allocated || 12}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Medical</span>
          </div>
          <div class="kpi-value">${balances.SL?.available ?? 12} Days</div>
          <div class="kpi-label">Sick Leave (SL)</div>
          <div class="kpi-subtitle">${balances.SL?.used || 0} Days Used of ${balances.SL?.allocated || 12}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Maternity/Paternity</span>
          </div>
          <div class="kpi-value">${balances.ML?.available ?? 182} Days</div>
          <div class="kpi-label">Statutory Parental</div>
          <div class="kpi-subtitle">26 Weeks Benefit Act</div>
        </div>
      </div>

      <!-- Upcoming Approved Leaves Alert -->
      ${upcoming.length > 0 ? `
        <div class="card" style="margin-bottom: 20px; background: #f0fdf4; border: 1px solid #86efac;">
          <div class="card-body" style="padding: 16px;">
            <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 12px;">
              <div>
                <strong style="color: #15803d; font-size: 0.95rem;">Upcoming Approved Time-Off</strong>
                <div style="font-size: 0.85rem; color: #334155; margin-top: 2px;">
                  You have scheduled leave from <strong>${upcoming[0].startDate}</strong> to <strong>${upcoming[0].endDate}</strong> (${upcoming[0].numberOfDays} Days — ${upcoming[0].leaveTypeName}).
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" style="color: #dc2626; border-color: #fca5a5;" onclick="LeaveView.cancelLeave('${upcoming[0].id}')">Cancel This Leave</button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- My Leave History Table Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">My Leave History & Status</div>
            <div class="card-subtitle">Personal applications ledger</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="LeaveView.openApplyLeaveModal()">+ Apply Leave</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${requests.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Leave Requests Submitted</div>
              <div class="empty-state-desc">Click "Apply Leave" to schedule planned time-off or sick absence.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates Range</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${requests.map(r => `
                  <tr>
                    <td><span class="badge badge-neutral font-semibold">${r.leaveTypeName || r.leaveTypeCode}</span></td>
                    <td><strong class="text-main">${r.startDate}</strong> to <strong>${r.endDate}</strong></td>
                    <td><strong style="color: var(--primary);">${r.numberOfDays} ${r.numberOfDays === 1 ? 'Day' : 'Days'}</strong></td>
                    <td style="max-width: 220px; font-size: 0.8rem;">${r.reason}</td>
                    <td>
                      <span class="badge ${r.status === 'APPROVED' ? 'badge-success' : (r.status === 'PENDING' ? 'badge-warning' : (r.status === 'REJECTED' ? 'badge-danger' : 'badge-neutral'))}">
                        <span class="badge-dot"></span> ${r.status}
                      </span>
                    </td>
                    <td>
                      ${r.status === 'APPROVED' && r.startDate >= todayStr ? `
                        <button class="btn btn-ghost btn-sm text-danger" onclick="LeaveView.cancelLeave('${r.id}')">Cancel</button>
                      ` : (r.status === 'PENDING' ? `
                        <button class="btn btn-ghost btn-sm text-danger" onclick="LeaveView.cancelLeave('${r.id}')">Withdraw</button>
                      ` : '<span class="text-muted" style="font-size: 0.75rem;">—</span>')}
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

  // 3. TEAM LEAVE TAB (MANAGER PORTAL)
  async renderTeamLeaveTab() {
    const managerId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const teamRequests = await leaveService.getLeaveRequests({ managerId });

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Team Leave Requests & Absences</div>
            <div class="card-subtitle">Review time-off requests submitted by your direct reporting staff</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${teamRequests.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Team Leave Requests</div>
              <div class="empty-state-desc">All team member leave requests have been reviewed.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${teamRequests.map(r => `
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-cell-avatar">${(r.employeeName || 'EM').substring(0, 2).toUpperCase()}</div>
                        <div class="user-cell-info">
                          <span class="user-cell-name font-semibold">${r.employeeName || 'Staff'}</span>
                          <span class="user-cell-code font-bold" style="color: var(--primary);">${r.employeeCode || r.employeeId}</span>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge badge-neutral">${r.leaveTypeName || r.leaveTypeCode}</span></td>
                    <td>${r.startDate} to ${r.endDate}</td>
                    <td><strong style="color: var(--primary);">${r.numberOfDays} Days</strong></td>
                    <td style="max-width: 180px; font-size: 0.8rem;">${r.reason}</td>
                    <td>
                      <span class="badge ${r.status === 'APPROVED' ? 'badge-success' : (r.status === 'PENDING' ? 'badge-warning' : 'badge-danger')}">
                        ${r.status}
                      </span>
                    </td>
                    <td>
                      ${r.status === 'PENDING' ? `
                        <div class="flex items-center gap-1">
                          <button class="btn btn-soft btn-sm" onclick="LeaveView.approveLeave('${r.id}')">Approve</button>
                          <button class="btn btn-secondary btn-sm" onclick="LeaveView.openRejectModal('${r.id}')">Reject</button>
                        </div>
                      ` : '<span class="text-muted" style="font-size: 0.75rem;">Reviewed</span>'}
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

  // 4. LEAVE CALENDAR TAB
  async renderCalendarTab() {
    const holidays = await attendanceSettingsService.getHolidays();
    const requests = await leaveService.getLeaveRequests({ status: 'APPROVED' });

    return `
      <div class="card" style="padding: 24px;">
        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">Organization Time-Off & Holiday Calendar</h3>
        
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
          <!-- Approved Leaves -->
          <div class="card" style="padding: 16px;">
            <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--primary); margin-bottom: 12px;">Active & Scheduled Leaves</h4>
            ${requests.length === 0 ? `
              <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No approved leaves scheduled.</div>
            ` : `
              <div class="flex flex-col gap-2">
                ${requests.slice(0, 8).map(r => `
                  <div class="flex items-center justify-between" style="padding: 8px 12px; background: var(--bg-hover); border-radius: 6px;">
                    <div>
                      <div class="font-semibold text-main" style="font-size: 0.85rem;">${r.employeeName}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${r.startDate} to ${r.endDate} (${r.leaveTypeName})</div>
                    </div>
                    <span class="badge badge-success">${r.numberOfDays} Days</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Official Holidays -->
          <div class="card" style="padding: 16px;">
            <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--accent-leave); margin-bottom: 12px;">Official Paid Holidays</h4>
            ${holidays.length === 0 ? `
              <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No official holidays registered.</div>
            ` : `
              <div class="flex flex-col gap-2">
                ${holidays.map(h => `
                  <div class="flex items-center justify-between" style="padding: 8px 12px; background: var(--bg-hover); border-radius: 6px;">
                    <div>
                      <div class="font-semibold text-main" style="font-size: 0.85rem;">${h.name}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${h.date} • ${h.type}</div>
                    </div>
                    <span class="badge badge-primary">Holiday</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  },

  // 5. LEAVE TYPES MASTER TAB
  async renderLeaveTypesTab() {
    const types = await leavePolicyService.getLeaveTypes();

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Statutory Leave Schemes & Quotas</div>
            <div class="card-subtitle">Indian Labour Law compliant leave types and carry forward policies</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="LeaveView.openAddLeaveTypeModal()">+ Add Scheme</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Scheme Name</th>
                <th>Annual Quota</th>
                <th>Paid</th>
                <th>Carry Forward</th>
                <th>Half-Day</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${types.map(t => `
                <tr>
                  <td class="font-bold" style="font-family: monospace; color: var(--primary);">${t.code}</td>
                  <td class="font-semibold text-main">${t.name}</td>
                  <td><strong>${t.annualQuota} Days / yr</strong></td>
                  <td><span class="badge ${t.paid ? 'badge-success' : 'badge-neutral'}">${t.paid ? 'Paid' : 'Unpaid'}</span></td>
                  <td>${t.carryForwardAllowed ? `Max ${t.maxCarryForward} Days` : 'No'}</td>
                  <td>${t.allowHalfDay ? 'Allowed' : 'Full Day Only'}</td>
                  <td><span class="badge badge-success">ACTIVE</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openAddLeaveTypeModal() {
    ModalManager.openModal({
      id: 'add-leave-type-modal',
      title: 'Create Leave Scheme',
      subtitle: 'Define quota and rules for a new leave type',
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Scheme Name</label>
            <input type="text" id="lt-name" class="form-control" placeholder="e.g. Bereavement Leave" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Code</label>
            <input type="text" id="lt-code" class="form-control" placeholder="e.g. BL" style="text-transform: uppercase;" required />
          </div>
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Annual Quota (Days)</label>
            <input type="number" id="lt-quota" class="form-control" value="5" min="1" max="365" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Paid Status</label>
            <select id="lt-paid" class="form-control">
              <option value="true">Paid Leave</option>
              <option value="false">Unpaid Leave</option>
            </select>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="LeaveView.saveLeaveType()">Save Scheme</button>
      `
    });
  },

  async saveLeaveType() {
    const name = document.getElementById('lt-name')?.value.trim();
    const code = document.getElementById('lt-code')?.value.trim().toUpperCase();
    const annualQuota = Number(document.getElementById('lt-quota')?.value) || 5;
    const paid = document.getElementById('lt-paid')?.value === 'true';

    if (!name || !code) return;

    try {
      await leavePolicyService.createLeaveType({ name, code, annualQuota, paid });
      Toast.success(`Created leave scheme '${name}'`);
      ModalManager.closeModal();
      this.switchTab('types');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  // 6. APPLY LEAVE MODAL WITH DYNAMIC DAY CALCULATION
  async openApplyLeaveModal() {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const balances = await leaveService.getEmployeeBalances(employeeId);
    const leaveTypes = await leavePolicyService.getLeaveTypes();

    const todayStr = new Date().toISOString().slice(0, 10);

    ModalManager.openModal({
      id: 'apply-leave-wizard-modal',
      title: 'Apply for Leave / Time-Off',
      subtitle: 'Working days calculated dynamically (excluding weekends and official holidays)',
      contentHtml: `
        <form id="apply-leave-full-form" onsubmit="event.preventDefault(); LeaveView.submitLeaveApplication()">
          <div class="form-group">
            <label class="form-label required">Select Leave Scheme</label>
            <select id="alf-type" class="form-control" onchange="LeaveView.recalculateWorkingDays()">
              ${leaveTypes.map(lt => {
                const b = balances ? balances[lt.code] : null;
                const avail = (b && typeof b.available === 'number') ? b.available : (typeof b === 'number' ? b : (lt.annualQuota || 12));
                return `<option value="${lt.code}">${lt.name} (${lt.code}) (Available: ${avail} Days)</option>`;
              }).join('')}
            </select>
          </div>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Start Date</label>
              <input type="date" id="alf-start-date" class="form-control" value="${todayStr}" onchange="LeaveView.recalculateWorkingDays()" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">End Date</label>
              <input type="date" id="alf-end-date" class="form-control" value="${todayStr}" onchange="LeaveView.recalculateWorkingDays()" required />
            </div>
          </div>

          <div class="form-row items-center" style="margin-bottom: 12px;">
            <div class="col-6 form-group" style="margin-bottom: 0;">
              <label class="flex items-center gap-2" style="cursor: pointer;">
                <input type="checkbox" id="alf-halfday" onchange="LeaveView.toggleHalfDay(this.checked)" />
                <span class="font-semibold text-main" style="font-size: 0.85rem;">Half Day Leave</span>
              </label>
            </div>
            <div class="col-6 form-group" id="alf-halfday-type-group" style="display: none; margin-bottom: 0;">
              <select id="alf-halfday-type" class="form-control">
                <option value="FIRST_HALF">First Half (Morning)</option>
                <option value="SECOND_HALF">Second Half (Afternoon)</option>
              </select>
            </div>
          </div>

          <!-- Live Day Calculation Box -->
          <div class="card" style="padding: 12px 16px; background: var(--bg-hover); margin-bottom: 16px; border: 1px solid var(--border-main);">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-main" style="font-size: 0.85rem;">Calculated Leave Duration:</span>
              <strong id="alf-calc-days-display" style="font-size: 1.1rem; color: var(--primary);">1 Working Day</strong>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Reason for Absence</label>
            <textarea id="alf-reason" class="form-control" rows="3" placeholder="Provide reason for time-off..." required></textarea>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" id="btn-submit-leave-app" onclick="LeaveView.submitLeaveApplication()">Submit Leave Application</button>
      `
    });

    this.recalculateWorkingDays();
  },

  toggleHalfDay(isHalf) {
    const group = document.getElementById('alf-halfday-type-group');
    if (group) group.style.display = isHalf ? 'block' : 'none';
    this.recalculateWorkingDays();
  },

  async recalculateWorkingDays() {
    const startDate = document.getElementById('alf-start-date')?.value;
    const endDate = document.getElementById('alf-end-date')?.value;
    const isHalfDay = document.getElementById('alf-halfday')?.checked;
    const display = document.getElementById('alf-calc-days-display');

    if (!startDate || !endDate) return;

    const days = await leaveService.calculateLeaveDays(startDate, endDate, isHalfDay);
    if (display) {
      display.textContent = `${days} ${days === 1 ? 'Working Day' : 'Working Days'}`;
    }
  },

  async submitLeaveApplication() {
    const type = document.getElementById('alf-type')?.value;
    const startDate = document.getElementById('alf-start-date')?.value;
    const endDate = document.getElementById('alf-end-date')?.value;
    const isHalfDay = document.getElementById('alf-halfday')?.checked;
    const halfDayType = isHalfDay ? document.getElementById('alf-halfday-type')?.value : null;
    const reason = document.getElementById('alf-reason')?.value.trim();

    if (!startDate || !endDate || !reason) {
      Toast.warning('Please complete all required fields.');
      return;
    }

    const btn = document.getElementById('btn-submit-leave-app');
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

    try {
      await leaveService.applyLeave({
        type,
        startDate,
        endDate,
        halfDay: isHalfDay,
        halfDayType,
        reason
      });

      Toast.success('Leave application submitted successfully!');
      ModalManager.closeModal();
      this.switchTab('my');
    } catch (e) {
      Toast.error(e.message);
      if (btn) { btn.disabled = false; btn.textContent = 'Submit Leave Application'; }
    }
  },

  async approveLeave(leaveId) {
    try {
      await leaveService.approveLeave(leaveId);
      Toast.success('Leave approved and attendance synchronized!');
      Router.navigate('leave');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openRejectModal(leaveId) {
    ModalManager.openModal({
      id: 'reject-leave-modal',
      title: 'Reject Leave Request',
      subtitle: 'Provide a reason for rejection',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Rejection Reason</label>
          <textarea id="leave-reject-reason" class="form-control" rows="3" placeholder="State reason..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-danger btn-sm" onclick="LeaveView.confirmRejectLeave('${leaveId}')">Confirm Rejection</button>
      `
    });
  },

  async confirmRejectLeave(leaveId) {
    const reason = document.getElementById('leave-reject-reason')?.value.trim();
    if (!reason) return;

    try {
      await leaveService.rejectLeave(leaveId, reason);
      Toast.warning('Leave request rejected.');
      ModalManager.closeModal();
      Router.navigate('leave');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  async cancelLeave(leaveId) {
    ModalManager.confirm({
      title: 'Cancel Leave Request',
      message: 'Are you sure you want to cancel this leave application? Any deducted leave quota will be restored.',
      confirmText: 'Cancel Leave',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await leaveService.cancelLeave(leaveId);
          Toast.success('Leave request cancelled and quota balance restored.');
          Router.navigate('leave');
        } catch (e) {
          Toast.error(`Cancellation failed: ${e.message}`);
        }
      }
    });
  }
};

window.LeaveView = LeaveView;
