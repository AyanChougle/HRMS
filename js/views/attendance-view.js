/**
 * DIALLO HRMS — ATTENDANCE MANAGEMENT MODULE (PHASE 5)
 * Daily Attendance Roster, Web Check-In/Out, Late Tracking, Regularizations, Shifts, and Holidays
 */

const AttendanceView = {
  activeTab: 'daily',
  currentDate: new Date().toISOString().slice(0, 10),
  currentFilters: {},

  async renderHub() {
    let summary = { totalEmployees: 0, present: 0, onTime: 0, late: 0, onLeave: 0, absent: 0, avgWorkHours: '0h 00m' };
    let departments = [];
    let todayRecord = null;
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;

    try {
      [summary, departments, todayRecord] = await Promise.all([
        attendanceService.getTodaySummary(),
        departmentService.getDepartments(),
        attendanceService.getTodayRecord(employeeId)
      ]);
    } catch (e) {
      console.warn('Attendance Hub data load warning:', e);
    }

    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployeeOnly = role === 'EMPLOYEE';

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Attendance</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Attendance & Shift Management</h1>
            <p class="page-subtitle">Daily check-in logs, punctuality tracking, regularization requests, and statutory muster rolls</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="AttendanceView.openRegularizationModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Request Regularization
            </button>
            <button class="btn btn-primary btn-sm" onclick="AttendanceView.triggerCheckInOutModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              ${todayRecord?.checkIn && !todayRecord?.checkOut ? 'Check Out' : 'Web Check In'}
            </button>
          </div>
        </div>
      </div>

      <!-- Attendance Metrics KPI Cards -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card" onclick="AttendanceView.setFilterStatus('All Status')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Roster</span>
          </div>
          <div class="kpi-value">${summary.totalEmployees}</div>
          <div class="kpi-label">Total Staff</div>
          <div class="kpi-subtitle">Active workforce</div>
        </div>

        <div class="kpi-card" onclick="AttendanceView.setFilterStatus('PRESENT')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">${summary.totalEmployees > 0 ? Math.round((summary.present/summary.totalEmployees)*100) : 0}%</span>
          </div>
          <div class="kpi-value">${summary.present}</div>
          <div class="kpi-label">Present Today</div>
          <div class="kpi-subtitle">${summary.onTime} On-Time Checkins</div>
        </div>

        <div class="kpi-card" onclick="AttendanceView.setFilterStatus('LATE')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend warning">Grace Exceeded</span>
          </div>
          <div class="kpi-value">${summary.late}</div>
          <div class="kpi-label">Late Arrivals</div>
          <div class="kpi-subtitle">After 09:15 AM IST</div>
        </div>

        <div class="kpi-card" onclick="AttendanceView.setFilterStatus('ON_LEAVE')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Absence</span>
          </div>
          <div class="kpi-value">${summary.onLeave}</div>
          <div class="kpi-label">On Approved Leave</div>
          <div class="kpi-subtitle">Scheduled time-off</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        ${!isEmployeeOnly ? `
          <button class="tab-btn ${this.activeTab === 'daily' ? 'active' : ''}" onclick="AttendanceView.switchTab('daily')">Daily Attendance Roster</button>
        ` : ''}
        <button class="tab-btn ${this.activeTab === 'my' || isEmployeeOnly ? 'active' : ''}" onclick="AttendanceView.switchTab('my')">My Attendance & History</button>
        ${role === 'MANAGER' || role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || role === 'HR' ? `
          <button class="tab-btn ${this.activeTab === 'team' ? 'active' : ''}" onclick="AttendanceView.switchTab('team')">Team Attendance</button>
        ` : ''}
        <button class="tab-btn ${this.activeTab === 'regularizations' ? 'active' : ''}" onclick="AttendanceView.switchTab('regularizations')">Regularization Queue</button>
        <button class="tab-btn ${this.activeTab === 'holidays' ? 'active' : ''}" onclick="AttendanceView.switchTab('holidays')">Holidays & Shifts</button>
        ${role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || role === 'HR' ? `
          <button class="tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" onclick="AttendanceView.switchTab('settings')">Attendance Settings</button>
        ` : ''}
      </div>

      <!-- TAB CONTENT VIEWPORT -->
      <div id="attendance-tab-content">
        ${await this.renderTabContent(departments, todayRecord, role)}
      </div>
    `;
  },

  async renderTabContent(departments, todayRecord, role) {
    if (this.activeTab === 'my' || role === 'EMPLOYEE') {
      return await this.renderMyAttendanceTab(todayRecord);
    } else if (this.activeTab === 'team') {
      return await this.renderTeamAttendanceTab();
    } else if (this.activeTab === 'regularizations') {
      return await this.renderRegularizationsTab();
    } else if (this.activeTab === 'holidays') {
      return await this.renderHolidaysTab();
    } else if (this.activeTab === 'settings') {
      return await this.renderSettingsTab();
    }
    return await this.renderDailyRosterTab(departments);
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    Router.navigate('attendance');
  },

  setFilterStatus(status) {
    this.currentFilters.status = status;
    this.activeTab = 'daily';
    Router.navigate('attendance');
  },

  // 1. DAILY ATTENDANCE ROSTER TAB (ADMIN / HR)
  async renderDailyRosterTab(departments) {
    const filters = {
      date: this.currentDate,
      ...this.currentFilters
    };
    const records = await attendanceService.getAttendanceRecords(filters);

    return `
      <!-- Toolbar Filters Card -->
      <div class="card" style="margin-bottom: 20px; padding: 16px;">
        <div class="flex items-center gap-3" style="flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <input type="text" id="att-filter-search" class="form-control" placeholder="Search by Employee Code or Name..." value="${this.currentFilters.search || ''}" onkeydown="if(event.key==='Enter') AttendanceView.applyFilters()" />
          </div>

          <input type="date" id="att-filter-date" class="form-control" style="width: 160px;" value="${this.currentDate}" onchange="AttendanceView.changeDate(this.value)" />

          <select id="att-filter-dept" class="form-control" style="width: 180px;">
            <option value="All Departments">All Departments</option>
            ${departments.map(d => `
              <option value="${d.name}" ${this.currentFilters.department === d.name ? 'selected' : ''}>${d.name}</option>
            `).join('')}
          </select>

          <select id="att-filter-status" class="form-control" style="width: 150px;">
            <option value="All Status">All Status</option>
            <option value="PRESENT" ${this.currentFilters.status === 'PRESENT' ? 'selected' : ''}>Present</option>
            <option value="LATE" ${this.currentFilters.status === 'LATE' ? 'selected' : ''}>Late</option>
            <option value="HALF_DAY" ${this.currentFilters.status === 'HALF_DAY' ? 'selected' : ''}>Half Day</option>
            <option value="ON_LEAVE" ${this.currentFilters.status === 'ON_LEAVE' ? 'selected' : ''}>On Leave</option>
            <option value="REGULARIZED" ${this.currentFilters.status === 'REGULARIZED' ? 'selected' : ''}>Regularized</option>
          </select>

          <button class="btn btn-primary btn-sm" onclick="AttendanceView.applyFilters()">Apply</button>
          <button class="btn btn-secondary btn-sm" onclick="AttendanceView.clearFilters()">Clear</button>
        </div>
      </div>

      <!-- Attendance Table Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Daily Attendance Logs (${this.currentDate})</div>
            <div class="card-subtitle">${records.length} records verified in Cloud Firestore</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${records.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-icon" style="width: 44px; height: 44px; margin-bottom: 8px; background: var(--primary-light); color: var(--primary);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="empty-state-title">No Attendance Recorded for ${this.currentDate}</div>
              <div class="empty-state-desc">Employees will appear as they log daily web check-ins or biometric entries.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Branch</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Worked Duration</th>
                  <th>Late / OT</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${records.map(r => `
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
                    <td>${r.branchName || 'HQ - Mumbai'}</td>
                    <td><span class="font-semibold text-main">${r.checkIn || '-'}</span></td>
                    <td><span class="font-semibold text-main">${r.checkOut || '<span class="badge badge-warning" style="font-size: 0.7rem;">In Progress</span>'}</span></td>
                    <td><strong style="color: var(--primary);">${r.workedHoursFormatted || '0h 00m'}</strong></td>
                    <td>
                      ${r.lateMinutes > 0 ? `<span class="badge badge-warning" style="font-size: 0.7rem;">+${r.lateMinutes}m Late</span>` : ''}
                      ${r.overtimeMinutes > 0 ? `<span class="badge badge-success" style="font-size: 0.7rem;">+${r.overtimeMinutes}m OT</span>` : ''}
                      ${r.lateMinutes === 0 && r.overtimeMinutes === 0 ? '<span class="text-muted" style="font-size: 0.75rem;">—</span>' : ''}
                    </td>
                    <td>
                      <span class="badge ${r.status === 'PRESENT' ? 'badge-success' : (r.status === 'LATE' ? 'badge-warning' : (r.status === 'REGULARIZED' ? 'badge-primary' : 'badge-neutral'))}">
                        <span class="badge-dot"></span> ${r.status}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-soft btn-sm" onclick="AttendanceView.openEditAttendanceModal('${r.id}', '${r.employeeName}', '${r.date}', '${r.checkIn || ''}', '${r.checkOut || ''}', '${r.status}')">Edit</button>
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

  changeDate(newDate) {
    this.currentDate = newDate;
    Router.navigate('attendance');
  },

  applyFilters() {
    this.currentFilters = {
      search: document.getElementById('att-filter-search')?.value.trim() || '',
      department: document.getElementById('att-filter-dept')?.value || 'All Departments',
      status: document.getElementById('att-filter-status')?.value || 'All Status'
    };
    Router.navigate('attendance');
  },

  clearFilters() {
    this.currentFilters = {};
    const s = document.getElementById('att-filter-search'); if (s) s.value = '';
    const d = document.getElementById('att-filter-dept'); if (d) d.value = 'All Departments';
    const st = document.getElementById('att-filter-status'); if (st) st.value = 'All Status';
    Router.navigate('attendance');
  },

  // 2. MY ATTENDANCE TAB (EMPLOYEE SELF-SERVICE)
  async renderMyAttendanceTab(todayRecord) {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const history = await attendanceService.getAttendanceRecords({ employeeId });

    return `
      <!-- Live Web Check-In Card -->
      <div class="card" style="margin-bottom: 24px; border: 2px solid var(--primary-light);">
        <div class="card-header">
          <div>
            <div class="card-title">Today's Attendance Status (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})</div>
            <div class="card-subtitle">General Shift: 09:00 AM – 06:00 PM IST (Grace Period: 15 mins)</div>
          </div>
          <span class="badge ${todayRecord?.checkIn && !todayRecord?.checkOut ? 'badge-success' : (todayRecord?.checkOut ? 'badge-neutral' : 'badge-warning')}">
            <span class="badge-dot"></span> ${todayRecord?.checkIn && !todayRecord?.checkOut ? 'Currently Checked IN' : (todayRecord?.checkOut ? 'Shift Completed' : 'Not Checked In')}
          </span>
        </div>
        <div class="card-body">
          <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 20px;">
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px; flex: 1;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Check In Time</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${todayRecord?.checkIn || '—'}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Check Out Time</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${todayRecord?.checkOut || '—'}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Logged Duration</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary); font-family: monospace;">${todayRecord?.workedHoursFormatted || '0h 00m'}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Status</div>
                <div style="font-size: 1.1rem; font-weight: 800; color: ${todayRecord?.status === 'LATE' ? 'var(--warning)' : 'var(--success)'};">${todayRecord?.status || 'NOT MARKED'}</div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              ${!todayRecord?.checkIn ? `
                <button class="btn btn-primary btn-lg" id="btn-self-punch" onclick="AttendanceView.executeCheckIn()">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>Web Check In (GPS)</span>
                </button>
              ` : (!todayRecord?.checkOut ? `
                <button class="btn btn-primary btn-lg" id="btn-self-punch" onclick="AttendanceView.executeCheckOut('${employeeId}')">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  <span>Web Check Out</span>
                </button>
              ` : `
                <button class="btn btn-secondary btn-lg" disabled>
                  <span>✓ Attendance Completed</span>
                </button>
              `)}
            </div>
          </div>
        </div>
      </div>

      <!-- My Attendance History Table -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">My Attendance History</div>
            <div class="card-subtitle">Verified monthly punch logs and regularizations</div>
          </div>
          <button class="btn btn-soft btn-sm" onclick="AttendanceView.openRegularizationModal()">+ Request Correction</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${history.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Attendance Records Logged Yet</div>
              <div class="empty-state-desc">Click "Web Check In" to record your first daily shift.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Worked Hours</th>
                  <th>Late Arrival</th>
                  <th>Overtime</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${history.map(h => `
                  <tr>
                    <td class="font-semibold text-main">${h.date}</td>
                    <td>${h.checkIn || '-'}</td>
                    <td>${h.checkOut || '-'}</td>
                    <td><strong style="color: var(--primary);">${h.workedHoursFormatted || '0h 00m'}</strong></td>
                    <td>${h.lateMinutes > 0 ? `<span class="text-warning font-semibold">+${h.lateMinutes}m</span>` : '—'}</td>
                    <td>${h.overtimeMinutes > 0 ? `<span class="text-success font-semibold">+${h.overtimeMinutes}m</span>` : '—'}</td>
                    <td>
                      <span class="badge ${h.status === 'PRESENT' ? 'badge-success' : (h.status === 'LATE' ? 'badge-warning' : (h.status === 'REGULARIZED' ? 'badge-primary' : 'badge-neutral'))}">
                        ${h.status}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-soft btn-sm" onclick="AttendanceView.openRegularizationModal('${h.date}', '${h.checkIn || ''}', '${h.checkOut || ''}')">Regularize</button>
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

  async executeCheckIn() {
    const btn = document.getElementById('btn-self-punch');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span>Checking In...</span>'; }

    try {
      await attendanceService.checkIn({ source: 'WEB' });
      Toast.success('Check-in logged successfully!');
      this.switchTab('my');
    } catch (e) {
      Toast.error(e.message);
      if (btn) { btn.disabled = false; btn.innerHTML = '<span>Web Check In (GPS)</span>'; }
    }
  },

  async executeCheckOut(employeeId) {
    const btn = document.getElementById('btn-self-punch');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span>Checking Out...</span>'; }

    try {
      await attendanceService.checkOut(employeeId);
      Toast.success('Check-out recorded successfully. Good day!');
      this.switchTab('my');
    } catch (e) {
      Toast.error(e.message);
      if (btn) { btn.disabled = false; btn.innerHTML = '<span>Web Check Out</span>'; }
    }
  },

  triggerCheckInOutModal() {
    this.switchTab('my');
  },

  // 3. TEAM ATTENDANCE TAB (FOR MANAGERS)
  async renderTeamAttendanceTab() {
    const managerId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const team = await attendanceService.getTeamAttendance(managerId, this.currentDate);

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">My Team Attendance (${this.currentDate})</div>
            <div class="card-subtitle">Real-time shift presence for your direct reports</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${team.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Direct Reporting Staff Found</div>
              <div class="empty-state-desc">Employees assigned with you as reporting manager will appear here.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Designation</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Worked Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${team.map(t => `
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-cell-avatar">${(t.employee.fullName || t.employee.name).substring(0, 2).toUpperCase()}</div>
                        <div class="user-cell-info">
                          <span class="user-cell-name font-semibold">${t.employee.fullName || t.employee.name}</span>
                          <span class="user-cell-code font-bold" style="color: var(--primary);">${t.employee.employeeCode || 'EMP'}</span>
                        </div>
                      </div>
                    </td>
                    <td>${t.employee.designation || 'Staff'}</td>
                    <td><span class="font-semibold text-main">${t.attendance.checkIn || '—'}</span></td>
                    <td><span class="font-semibold text-main">${t.attendance.checkOut || '—'}</span></td>
                    <td><strong style="color: var(--primary);">${t.attendance.workedHoursFormatted || '0h 00m'}</strong></td>
                    <td>
                      <span class="badge ${t.attendance.status === 'PRESENT' ? 'badge-success' : (t.attendance.status === 'LATE' ? 'badge-warning' : 'badge-neutral')}">
                        ${t.attendance.status}
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

  // 4. REGULARIZATION QUEUE TAB
  async renderRegularizationsTab() {
    let requests = [];
    try {
      const snap = await db.collection('attendanceRegularizations').orderBy('createdAt', 'desc').get();
      requests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Regularizations fetch error:', e);
    }

    const currentUserId = AuthGuard.currentUser?.uid;

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Attendance Regularization Requests</div>
            <div class="card-subtitle">Review missed punches and time adjustment requests</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AttendanceView.openRegularizationModal()">+ Submit Request</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${requests.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Pending Regularizations</div>
              <div class="empty-state-desc">All historical attendance corrections have been reviewed.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Original Punches</th>
                  <th>Requested Punches</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${requests.map(r => `
                  <tr>
                    <td class="font-semibold text-main">${r.employeeName || 'Staff'}</td>
                    <td>${r.requestedDate}</td>
                    <td><span class="text-secondary" style="font-size: 0.8rem;">${r.originalCheckIn} → ${r.originalCheckOut}</span></td>
                    <td><strong style="color: var(--primary);">${r.requestedCheckIn} → ${r.requestedCheckOut}</strong></td>
                    <td style="max-width: 200px; font-size: 0.8rem;">${r.reason}</td>
                    <td>
                      <span class="badge ${r.status === 'APPROVED' ? 'badge-success' : (r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning')}">
                        ${r.status}
                      </span>
                    </td>
                    <td>
                      ${r.status === 'PENDING' ? `
                        <div class="flex items-center gap-1">
                          <button class="btn btn-soft btn-sm" onclick="AttendanceView.approveRegularization('${r.id}', '${r.attendanceId}', '${r.requestedCheckIn}', '${r.requestedCheckOut}', '${r.requestedById}')">Approve</button>
                          <button class="btn btn-secondary btn-sm" onclick="AttendanceView.rejectRegularization('${r.id}')">Reject</button>
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

  openRegularizationModal(defaultDate = null, origIn = null, origOut = null) {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const employeeName = AuthGuard.userProfile?.displayName || 'Employee';

    ModalManager.openModal({
      id: 'regularization-modal',
      title: 'Request Attendance Regularization',
      subtitle: 'Apply for correction on missed punch or on-duty client visits',
      contentHtml: `
        <form id="reg-form" onsubmit="event.preventDefault(); AttendanceView.submitRegularization()">
          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Date of Occurrence</label>
              <input type="date" id="reg-date" class="form-control" value="${defaultDate || new Date().toISOString().slice(0, 10)}" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Original Status</label>
              <input type="text" id="reg-orig-status" class="form-control" value="${origIn ? `${origIn} – ${origOut || 'No Out'}` : 'Missed Punch'}" readonly style="background: var(--bg-hover);" />
            </div>
          </div>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Requested Check In</label>
              <input type="time" id="reg-req-in" class="form-control" value="09:00" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Requested Check Out</label>
              <input type="time" id="reg-req-out" class="form-control" value="18:00" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Reason for Regularization</label>
            <textarea id="reg-reason" class="form-control" rows="3" placeholder="e.g. Biometric device offline, client site visit, or emergency travel..." required></textarea>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AttendanceView.submitRegularization()">Submit Request</button>
      `
    });
  },

  async submitRegularization() {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const employeeName = AuthGuard.userProfile?.displayName || 'Employee';
    const date = document.getElementById('reg-date')?.value;
    const reqIn = document.getElementById('reg-req-in')?.value;
    const reqOut = document.getElementById('reg-req-out')?.value;
    const reason = document.getElementById('reg-reason')?.value.trim();

    if (!date || !reqIn || !reqOut || !reason) {
      Toast.warning('Please fill in all regularization fields.');
      return;
    }

    try {
      await attendanceService.requestRegularization({
        employeeId,
        employeeName,
        requestedDate: date,
        requestedCheckIn: reqIn,
        requestedCheckOut: reqOut,
        reason
      });

      Toast.success('Regularization request submitted to Manager/HR for approval.');
      ModalManager.closeModal();
      this.switchTab('regularizations');
    } catch (e) {
      Toast.error(`Failed to submit: ${e.message}`);
    }
  },

  async approveRegularization(reqId, attendanceId, reqIn, reqOut, requestedById) {
    try {
      await attendanceService.approveRegularization(reqId, attendanceId, reqIn, reqOut);
      Toast.success('Regularization approved and attendance record updated!');
      this.switchTab('regularizations');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async rejectRegularization(reqId) {
    ModalManager.openModal({
      id: 'reject-reg-modal',
      title: 'Reject Regularization',
      subtitle: 'Provide a reason for rejection',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Rejection Reason</label>
          <textarea id="reg-reject-reason" class="form-control" rows="3" placeholder="State reason..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-danger btn-sm" onclick="AttendanceView.confirmReject('${reqId}')">Confirm Rejection</button>
      `
    });
  },

  async confirmReject(reqId) {
    const reason = document.getElementById('reg-reject-reason')?.value.trim();
    if (!reason) return;

    try {
      await attendanceService.rejectRegularization(reqId, reason);
      Toast.warning('Regularization request rejected.');
      ModalManager.closeModal();
      this.switchTab('regularizations');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  // 5. HOLIDAYS & SHIFTS TAB
  async renderHolidaysTab() {
    const [holidays, shifts] = await Promise.all([
      attendanceSettingsService.getHolidays(),
      attendanceSettingsService.getShifts()
    ]);

    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Holidays -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Corporate & Statutory Holidays</div>
            <button class="btn btn-primary btn-sm" onclick="AttendanceView.openAddHolidayModal()">+ Add Holiday</button>
          </div>
          <div class="card-body" style="padding: 0;">
            ${holidays.length === 0 ? `
              <div style="padding: 30px; text-align: center; color: var(--text-muted);">No holidays configured.</div>
            ` : `
              <table class="data-table">
                <thead><tr><th>Holiday Name</th><th>Date</th><th>Type</th></tr></thead>
                <tbody>
                  ${holidays.map(h => `
                    <tr>
                      <td class="font-semibold text-main">${h.name}</td>
                      <td>${h.date}</td>
                      <td><span class="badge badge-primary">${h.type}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>

        <!-- Shifts -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Work Shifts & Timings</div>
            <button class="btn btn-primary btn-sm" onclick="AttendanceView.openAddShiftModal()">+ Add Shift</button>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead><tr><th>Shift Name</th><th>Timings</th><th>Grace</th></tr></thead>
              <tbody>
                <tr>
                  <td class="font-semibold text-main">General Shift</td>
                  <td>09:00 AM – 06:00 PM</td>
                  <td>15 mins</td>
                </tr>
                <tr>
                  <td class="font-semibold text-main">Morning Shift</td>
                  <td>07:00 AM – 04:00 PM</td>
                  <td>10 mins</td>
                </tr>
                <tr>
                  <td class="font-semibold text-main">Night Shift</td>
                  <td>08:00 PM – 05:00 AM</td>
                  <td>15 mins</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  openAddHolidayModal() {
    ModalManager.openModal({
      id: 'add-holiday-modal',
      title: 'Add Statutory / Corporate Holiday',
      subtitle: 'Registers a non-working paid holiday in attendance',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Holiday Name</label>
          <input type="text" id="hol-name" class="form-control" placeholder="e.g. Diwali / Republic Day" required />
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Date</label>
            <input type="date" id="hol-date" class="form-control" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Holiday Type</label>
            <select id="hol-type" class="form-control">
              <option value="NATIONAL">National Holiday</option>
              <option value="COMPANY">Company Holiday</option>
              <option value="OPTIONAL">Optional / Restricted</option>
            </select>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AttendanceView.saveHoliday()">Save Holiday</button>
      `
    });
  },

  async saveHoliday() {
    const name = document.getElementById('hol-name')?.value.trim();
    const date = document.getElementById('hol-date')?.value;
    const type = document.getElementById('hol-type')?.value;
    if (!name || !date) return;

    try {
      await attendanceSettingsService.createHoliday({ name, date, type });
      Toast.success(`Added holiday '${name}'`);
      ModalManager.closeModal();
      this.switchTab('holidays');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  // 6. ATTENDANCE SETTINGS TAB (ADMIN / HR)
  async renderSettingsTab() {
    const settings = await attendanceSettingsService.getSettings();

    return `
      <div class="card" style="max-width: 680px; margin: 0 auto; padding: 24px;">
        <div class="card-header" style="padding: 0 0 16px 0; border-bottom: 1px solid var(--border-main); margin-bottom: 20px;">
          <div>
            <div class="card-title">Company Attendance Rules & Thresholds</div>
            <div class="card-subtitle">Define standard work timings, grace periods, and weekly off rules</div>
          </div>
        </div>

        <form id="att-settings-form" onsubmit="event.preventDefault(); AttendanceView.saveSettings()">
          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Standard Work Start Time</label>
              <input type="time" id="set-start-time" class="form-control" value="${settings.defaultStartTime || '09:00'}" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Standard Work End Time</label>
              <input type="time" id="set-end-time" class="form-control" value="${settings.defaultEndTime || '18:00'}" required />
            </div>
          </div>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Grace Period (Minutes)</label>
              <input type="number" id="set-grace-mins" class="form-control" value="${settings.graceMinutes || 15}" min="0" max="60" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Overtime After (Hours)</label>
              <input type="number" id="set-ot-hours" class="form-control" value="${(settings.overtimeAfterMinutes || 480) / 60}" min="1" max="16" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Weekly Off Days</label>
            <select id="set-weekly-off" class="form-control">
              <option value="Sunday" selected>Sunday (Standard)</option>
              <option value="Saturday,Sunday">Saturday & Sunday (5-Day Workweek)</option>
            </select>
          </div>

          <div class="flex justify-end gap-3" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-main);">
            <button type="submit" class="btn btn-primary btn-sm">Save Attendance Policy</button>
          </div>
        </form>
      </div>
    `;
  },

  async saveSettings() {
    const defaultStartTime = document.getElementById('set-start-time')?.value;
    const defaultEndTime = document.getElementById('set-end-time')?.value;
    const graceMinutes = Number(document.getElementById('set-grace-mins')?.value) || 15;
    const otHours = Number(document.getElementById('set-ot-hours')?.value) || 8;

    try {
      await attendanceSettingsService.updateSettings('comp_diallo_india', {
        defaultStartTime,
        defaultEndTime,
        graceMinutes,
        overtimeAfterMinutes: otHours * 60
      });
      Toast.success('Attendance policy settings updated successfully!');
    } catch (e) {
      Toast.error(`Failed to update settings: ${e.message}`);
    }
  },

  // 7. EDIT ATTENDANCE MODAL (ADMIN / HR)
  openEditAttendanceModal(recordId, name, date, checkIn, checkOut, status) {
    ModalManager.openModal({
      id: 'edit-att-modal',
      title: `Edit Attendance: ${name}`,
      subtitle: `Date: ${date}`,
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label">Check In Time</label>
            <input type="text" id="edit-att-in" class="form-control" value="${checkIn}" />
          </div>
          <div class="col-6 form-group">
            <label class="form-label">Check Out Time</label>
            <input type="text" id="edit-att-out" class="form-control" value="${checkOut}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="edit-att-status" class="form-control">
            <option value="PRESENT" ${status === 'PRESENT' ? 'selected' : ''}>PRESENT</option>
            <option value="LATE" ${status === 'LATE' ? 'selected' : ''}>LATE</option>
            <option value="HALF_DAY" ${status === 'HALF_DAY' ? 'selected' : ''}>HALF_DAY</option>
            <option value="ON_LEAVE" ${status === 'ON_LEAVE' ? 'selected' : ''}>ON_LEAVE</option>
            <option value="REGULARIZED" ${status === 'REGULARIZED' ? 'selected' : ''}>REGULARIZED</option>
          </select>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AttendanceView.saveAttendanceEdit('${recordId}')">Save Changes</button>
      `
    });
  },

  async saveAttendanceEdit(recordId) {
    const checkIn = document.getElementById('edit-att-in')?.value.trim();
    const checkOut = document.getElementById('edit-att-out')?.value.trim();
    const status = document.getElementById('edit-att-status')?.value;

    try {
      await db.collection('attendanceRecords').doc(recordId).update({
        checkIn,
        checkOut,
        status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      Toast.success('Attendance record updated.');
      ModalManager.closeModal();
      this.switchTab('daily');
    } catch (e) {
      Toast.error(`Failed to update: ${e.message}`);
    }
  }
};

window.AttendanceView = AttendanceView;
