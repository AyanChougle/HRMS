/**
 * DIALLO HRMS — ATTENDANCE MANAGEMENT MODULE (PHASE 5)
 * Daily Attendance Roster, Web Check-In/Out, Late Tracking, Regularizations, Shifts, and Holidays
 */

const AttendanceView = {
  activeTab: 'daily',
  currentDate: new Date().toISOString().slice(0, 10),
  currentFilters: {},
  myAttendanceMonth: '',
  myAttendanceDate: '',

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
    const rawRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    const isSuperAdmin = rawRole === 'SUPER_ADMIN';
    const isCompanyAdmin = rawRole === 'COMPANY_ADMIN' || rawRole === 'ADMIN';
    const isHR = rawRole === 'HR' || rawRole === 'HR_MANAGER';
    const isManager = rawRole === 'MANAGER';
    const canManageAttendance = isSuperAdmin || isCompanyAdmin || isHR;
    const canApproveRegularization = canManageAttendance || isManager;
    const isStaffOnly = !canManageAttendance && !isManager;
    const isEmployeeOnly = isStaffOnly;
    const role = rawRole;

    if (typeof ESSView !== 'undefined') {
      try {
        await ESSView.syncWithFirestore(todayRecord);
      } catch (err) {
        console.warn('ESSView sync error:', err);
      }
    }

    if (isStaffOnly && (this.activeTab === 'daily' || this.activeTab === 'team' || this.activeTab === 'presence' || this.activeTab === 'settings')) {
      this.activeTab = 'my';
    }

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Attendance</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">${isEmployeeOnly ? 'My Attendance & Timecard' : 'Attendance & Time Tracking'}</h1>
            <p class="page-subtitle">${isEmployeeOnly ? 'Daily punch logging, shift timer, break station, and regularization requests' : 'Real-time punch records, roster status, regularization workflows, and holiday schedules'}</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="AttendanceView.openRegularizationModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Regularize Punch
            </button>
            ${!isEmployeeOnly ? `
              <button class="btn btn-primary btn-sm" onclick="AttendanceView.quickPunch()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                ${!todayRecord?.checkIn ? 'Web Check In' : (!todayRecord?.checkOut ? 'Check Out' : 'Resume Shift')}
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Attendance Metrics KPI Cards -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        ${isEmployeeOnly ? `
          <div class="kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="kpi-trend ${todayRecord?.checkIn && !todayRecord?.checkOut ? 'positive' : 'neutral'}">Today</span>
            </div>
            <div class="kpi-value" style="font-size: 1.35rem;">${!todayRecord?.checkIn ? 'Not Marked' : (todayRecord.checkOut ? 'Shift Done' : (todayRecord.status === 'ON_BREAK' ? 'On Break' : 'On Shift'))}</div>
            <div class="kpi-label">Today's Shift Status</div>
            <div class="kpi-subtitle">Schedule: 10:00 AM – 07:00 PM</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                </svg>
              </div>
              <span class="kpi-trend neutral">Punch</span>
            </div>
            <div class="kpi-value">${todayRecord?.checkIn || '—'}</div>
            <div class="kpi-label">Check-In Time</div>
            <div class="kpi-subtitle">${todayRecord?.lateMinutes > 0 ? `+${todayRecord.lateMinutes}m Late` : 'On-Time'}</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="kpi-trend positive">Worked</span>
            </div>
            <div class="kpi-value" style="color: var(--primary); font-family: monospace;">${todayRecord?.workedHoursFormatted || '0h 00m'}</div>
            <div class="kpi-label">Net Worked Hours</div>
            <div class="kpi-subtitle">Excluding break duration</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-top">
              <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3M10 1v3M14 1v3"/>
                </svg>
              </div>
              <span class="kpi-trend neutral">Breaks</span>
            </div>
            <div class="kpi-value" style="color: var(--warning); font-family: monospace;">${todayRecord?.breakFormatted || (todayRecord?.totalBreakMinutes ? todayRecord.totalBreakMinutes + 'm' : '0m')}</div>
            <div class="kpi-label">Break Duration</div>
            <div class="kpi-subtitle">Total time paused</div>
          </div>
        ` : `
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
            <div class="kpi-subtitle">After 10:15 AM IST</div>
          </div>

          <div class="kpi-card" onclick="AttendanceView.setFilterStatus('LEAVE')" style="cursor: pointer;">
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
        `}
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        ${canManageAttendance ? `
          <button class="tab-btn ${this.activeTab === 'daily' ? 'active' : ''}" onclick="AttendanceView.switchTab('daily')">Daily Attendance Roster</button>
        ` : ''}
        <button class="tab-btn ${this.activeTab === 'my' ? 'active' : ''}" onclick="AttendanceView.switchTab('my')">My Attendance & History</button>
        ${isManager || canManageAttendance ? `
          <button class="tab-btn ${this.activeTab === 'team' ? 'active' : ''}" onclick="AttendanceView.switchTab('team')">Team Attendance</button>
        ` : ''}
        <button class="tab-btn ${this.activeTab === 'regularizations' ? 'active' : ''}" onclick="AttendanceView.switchTab('regularizations')">
          ${canApproveRegularization ? 'Regularization Queue' : 'My Regularizations'}
        </button>
        <button class="tab-btn ${this.activeTab === 'holidays' ? 'active' : ''}" onclick="AttendanceView.switchTab('holidays')">Holidays & Shifts</button>
        ${canManageAttendance ? `
          <button class="tab-btn ${this.activeTab === 'presence' ? 'active' : ''}" onclick="AttendanceView.switchTab('presence')">Live Presence (Desktop & Web)</button>
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
    if (this.activeTab === 'my') {
      return await this.renderMyAttendanceTab(todayRecord);
    } else if (this.activeTab === 'team') {
      return await this.renderTeamAttendanceTab();
    } else if (this.activeTab === 'presence') {
      return await (window.LivePresenceView ? LivePresenceView.render() : '<div class="card p-6">Loading presence...</div>');
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
    Router.mountView('attendance');
  },

  setFilterStatus(status) {
    this.currentFilters.status = status;
    this.activeTab = 'daily';
    Router.navigate('attendance');
  },

  // 1. DAILY ATTENDANCE ROSTER TAB (ADMIN / HR)
  async renderDailyRosterTab(departments) {
    const rawRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    const canManageAttendance = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'HR_MANAGER'].includes(rawRole);
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

          <div class="flex items-center gap-1">
            <button class="btn btn-secondary btn-sm" onclick="AttendanceView.shiftDailyDate(-1)" title="Previous Day" style="padding: 6px 9px;">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <input type="date" id="att-filter-date" class="form-control" style="width: 150px;" value="${this.currentDate}" onchange="AttendanceView.changeDate(this.value)" />
            <button class="btn btn-secondary btn-sm" onclick="AttendanceView.shiftDailyDate(1)" title="Next Day" style="padding: 6px 9px;">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AttendanceView.changeDate(new Date().toISOString().slice(0, 10))" title="Jump to Today">Today</button>
          </div>

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
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <th>Break Time</th>
                  <th>Check Out</th>
                  <th>Gross Hours</th>
                  <th>Net Worked</th>
                  <th>Late / OT</th>
                  <th>Status</th>
                  ${canManageAttendance ? '<th>Actions</th>' : ''}
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
                    <td><span class="badge ${r.totalBreakMinutes > 0 ? 'badge-warning' : 'badge-neutral'}">${r.breakFormatted || (r.totalBreakMinutes ? r.totalBreakMinutes + 'm' : '0m')}</span></td>
                    <td><span class="font-semibold text-main">${r.checkOut || '<span class="badge badge-warning" style="font-size: 0.7rem;">In Progress</span>'}</span></td>
                    <td><span class="text-secondary" style="font-size: 0.85rem;">${r.grossHoursFormatted || r.workedHoursFormatted || '0h 00m'}</span></td>
                    <td><strong style="color: var(--primary);">${r.workedHoursFormatted || '0h 00m'}</strong></td>
                    <td>
                      ${r.lateMinutes > 0 ? `<span class="badge badge-warning" style="font-size: 0.7rem;">+${r.lateMinutes}m Late</span>` : ''}
                      ${r.overtimeMinutes > 0 ? `<span class="badge badge-success" style="font-size: 0.7rem;">+${r.overtimeMinutes}m OT</span>` : ''}
                      ${r.lateMinutes === 0 && r.overtimeMinutes === 0 ? '<span class="text-muted" style="font-size: 0.75rem;">—</span>' : ''}
                    </td>
                    <td>
                      <span class="badge ${r.status === 'PRESENT' ? 'badge-success' : (r.status === 'LATE' ? 'badge-warning' : (r.status === 'ON_BREAK' ? 'badge-warning' : (r.status === 'REGULARIZED' ? 'badge-primary' : 'badge-neutral')))}">
                        <span class="badge-dot"></span> ${r.status}
                      </span>
                    </td>
                    ${canManageAttendance ? `
                      <td>
                        <button class="btn btn-soft btn-sm" onclick="AttendanceView.openEditAttendanceModal('${r.id}', '${r.employeeName}', '${r.date}', '${r.checkIn || ''}', '${r.checkOut || ''}', '${r.status}')">Edit</button>
                      </td>
                    ` : ''}
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

  shiftDailyDate(offset) {
    const cur = new Date(this.currentDate || new Date());
    cur.setDate(cur.getDate() + offset);
    this.currentDate = cur.toISOString().slice(0, 10);
    Router.navigate('attendance');
  },

  shiftMyAttendanceMonth(offset) {
    const cur = this.myAttendanceMonth || new Date().toISOString().slice(0, 7);
    const parts = cur.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1 + offset, 1);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    this.myAttendanceMonth = `${yStr}-${mStr}`;
    this.myAttendanceDate = '';
    Router.mountView('attendance');
  },

  setMyAttendanceMonth(monthStr) {
    this.myAttendanceMonth = monthStr || '';
    this.myAttendanceDate = '';
    Router.mountView('attendance');
  },

  setMyAttendanceLastMonth() {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const yStr = lastMonth.getFullYear();
    const mStr = String(lastMonth.getMonth() + 1).padStart(2, '0');
    this.myAttendanceMonth = `${yStr}-${mStr}`;
    this.myAttendanceDate = '';
    Router.mountView('attendance');
  },

  setMyAttendanceDate(dateStr) {
    this.myAttendanceDate = dateStr || '';
    if (dateStr) {
      this.myAttendanceMonth = dateStr.slice(0, 7);
    }
    Router.mountView('attendance');
  },

  clearMyAttendanceFilters() {
    this.myAttendanceMonth = '';
    this.myAttendanceDate = '';
    Router.mountView('attendance');
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

    // Recent records strictly on top (descending date sort)
    history.sort((a, b) => {
      const dateDiff = (b.date || '').localeCompare(a.date || '');
      if (dateDiff !== 0) return dateDiff;
      return (b.checkIn || '').localeCompare(a.checkIn || '');
    });

    const todayIso = new Date().toISOString().slice(0, 10);
    const currentMonthStr = todayIso.slice(0, 7);
    const activeMonthVal = this.myAttendanceMonth || '';
    const activeDateVal = this.myAttendanceDate || '';

    // Filter by date or month
    let filteredHistory = history;
    if (activeDateVal) {
      filteredHistory = history.filter(h => h.date === activeDateVal);
    } else if (activeMonthVal) {
      filteredHistory = history.filter(h => (h.date || '').startsWith(activeMonthVal));
    }

    let filterPeriodLabel = 'All Recorded Months';
    if (activeDateVal) {
      filterPeriodLabel = `Date: ${activeDateVal}`;
    } else if (activeMonthVal) {
      const [y, m] = activeMonthVal.split('-');
      const dObj = new Date(Number(y), Number(m) - 1, 1);
      filterPeriodLabel = dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // Calculate period statistics
    const presentCount = filteredHistory.filter(h => h.status === 'PRESENT' || h.status === 'REGULARIZED').length;
    const lateCount = filteredHistory.filter(h => h.status === 'LATE' || (h.lateMinutes && h.lateMinutes > 0)).length;
    const halfDayCount = filteredHistory.filter(h => h.status === 'HALF_DAY').length;
    let totalWorkedMinutes = 0;
    filteredHistory.forEach(h => {
      totalWorkedMinutes += (h.workedMinutes || 0);
    });
    const totalWorkedHours = Math.floor(totalWorkedMinutes / 60);
    const totalWorkedRemMins = totalWorkedMinutes % 60;
    const totalWorkedStr = `${totalWorkedHours}h ${String(totalWorkedRemMins).padStart(2, '0')}m`;

    return `
      <!-- Live Web Check-In Card -->
      <div class="card" style="margin-bottom: 24px; border: 2px solid var(--primary-light);">
        <div class="card-header">
          <div>
            <div class="card-title">Today's Attendance Status (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})</div>
            <div class="card-subtitle">General Shift: 10:00 AM – 07:00 PM IST (Grace Period: 15 mins)</div>
          </div>
          <span class="badge ${todayRecord?.checkIn && !todayRecord?.checkOut ? (todayRecord?.status === 'ON_BREAK' ? 'badge-warning' : 'badge-success') : (todayRecord?.checkOut ? 'badge-neutral' : 'badge-warning')}">
            <span class="badge-dot"></span> ${todayRecord?.checkIn && !todayRecord?.checkOut ? (todayRecord?.status === 'ON_BREAK' ? 'On Break (Paused)' : 'Currently Checked IN') : (todayRecord?.checkOut ? 'Shift Completed' : 'Not Checked In')}
          </span>
        </div>
        <div class="card-body">
          <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 20px;">
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; flex: 1;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Check In Time</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${todayRecord?.checkIn || '—'}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Break Duration</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--warning); font-family: monospace;">${todayRecord?.breakFormatted || (todayRecord?.totalBreakMinutes ? todayRecord.totalBreakMinutes + 'm' : '0m')}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Check Out Time</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${todayRecord?.checkOut || '—'}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Net Worked Hours</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary); font-family: monospace;">${todayRecord?.workedHoursFormatted || '0h 00m'}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Status</div>
                <div style="font-size: 1.1rem; font-weight: 800; color: ${todayRecord?.status === 'LATE' ? 'var(--warning)' : (todayRecord?.status === 'ON_BREAK' ? 'var(--warning)' : 'var(--success)')};">${todayRecord?.status || 'NOT MARKED'}</div>
              </div>
            </div>

            <div class="flex items-center gap-3" style="flex-wrap: wrap;">
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
                <button class="btn btn-secondary btn-lg" disabled style="display: inline-flex; align-items: center; gap: 8px;">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  <span>Attendance Completed</span>
                </button>
              `)}
            </div>
          </div>
        </div>
      </div>

      <!-- My Attendance History Table -->
      <div class="card">
        <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="card-title">My Attendance History</div>
            <div class="card-subtitle">Verified monthly punch logs, break durations, and regularizations (Recent on top)</div>
          </div>
          <button class="btn btn-soft btn-sm" onclick="AttendanceView.openRegularizationModal()">+ Request Correction</button>
        </div>

        <!-- Month Toggles & Date Filter Toolbar -->
        <div style="background: var(--bg-surface-secondary, rgba(0,0,0,0.02)); border-bottom: 1px solid var(--border-color, #e2e8f0); padding: 12px 20px;">
          <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 12px;">
            <!-- Month selector & month toggles -->
            <div class="flex items-center gap-2" style="flex-wrap: wrap;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Month:</span>
              <div class="flex items-center gap-1">
                <button class="btn btn-secondary btn-sm" onclick="AttendanceView.shiftMyAttendanceMonth(-1)" title="Previous Month" style="padding: 5px 9px;">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <input type="month" id="my-att-month-picker" class="form-control" style="width: 160px; padding: 5px 10px; font-weight: 600;" value="${activeMonthVal || currentMonthStr}" onchange="AttendanceView.setMyAttendanceMonth(this.value)" />
                <button class="btn btn-secondary btn-sm" onclick="AttendanceView.shiftMyAttendanceMonth(1)" title="Next Month" style="padding: 5px 9px;">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>

              <!-- Quick Month Toggles -->
              <button class="btn ${!activeMonthVal && !activeDateVal ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="AttendanceView.clearMyAttendanceFilters()">All Months</button>
              <button class="btn ${activeMonthVal === currentMonthStr && !activeDateVal ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="AttendanceView.setMyAttendanceMonth('${currentMonthStr}')">This Month</button>
              <button class="btn btn-secondary btn-sm" onclick="AttendanceView.setMyAttendanceLastMonth()">Last Month</button>
            </div>

            <!-- Specific Date Filter -->
            <div class="flex items-center gap-2" style="flex-wrap: wrap;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Date:</span>
              <input type="date" id="my-att-date-picker" class="form-control" style="width: 150px; padding: 5px 10px;" value="${activeDateVal}" onchange="AttendanceView.setMyAttendanceDate(this.value)" />
              ${(activeMonthVal || activeDateVal) ? `
                <button class="btn btn-soft btn-sm" onclick="AttendanceView.clearMyAttendanceFilters()" style="color: var(--danger);">Reset Filter</button>
              ` : ''}
            </div>
          </div>

          <!-- Active Period Summary Bar -->
          <div class="flex items-center justify-between" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color, #e2e8f0); font-size: 0.82rem; color: var(--text-muted); flex-wrap: wrap; gap: 8px;">
            <div>
              Period: <strong style="color: var(--primary);">${filterPeriodLabel}</strong>
              • Showing <strong style="color: var(--text-main);">${filteredHistory.length}</strong> records (Recent above)
            </div>
            <div class="flex items-center gap-3">
              <span>Present: <strong style="color: var(--success);">${presentCount}</strong></span>
              <span>Late: <strong style="color: var(--warning);">${lateCount}</strong></span>
              <span>Half Day: <strong style="color: var(--warning);">${halfDayCount}</strong></span>
              <span>Total Worked: <strong style="color: var(--primary); font-family: monospace;">${totalWorkedStr}</strong></span>
            </div>
          </div>
        </div>

        <div class="card-body" style="padding: 0;">
          <div class="table-responsive" style="overflow-x: auto;">
          ${filteredHistory.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="empty-state-title">No Attendance Records Found</div>
              <div class="empty-state-desc">No logs found for ${filterPeriodLabel}. Try selecting a different month or date.</div>
              <div class="empty-state-actions">
                <button class="btn btn-secondary btn-sm" onclick="AttendanceView.clearMyAttendanceFilters()">View All Records</button>
                <button class="btn btn-primary btn-sm" onclick="AttendanceView.recordCheckIn()">Web Check In</button>
              </div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Break Time</th>
                  <th>Check Out</th>
                  <th>Gross Hours</th>
                  <th>Net Worked Hours</th>
                  <th>Late Arrival</th>
                  <th>Overtime</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${filteredHistory.map(h => `
                  <tr>
                    <td class="font-semibold text-main">${h.date}</td>
                    <td><span class="font-medium text-main">${h.checkIn || '-'}</span></td>
                    <td><span class="badge ${h.totalBreakMinutes > 0 ? 'badge-warning' : 'badge-neutral'}">${h.breakFormatted || (h.totalBreakMinutes ? h.totalBreakMinutes + 'm' : '0m')}</span></td>
                    <td><span class="font-medium text-main">${h.checkOut || '-'}</span></td>
                    <td><span class="text-secondary" style="font-size: 0.85rem;">${h.grossHoursFormatted || h.workedHoursFormatted || '0h 00m'}</span></td>
                    <td><strong style="color: var(--primary); font-family: monospace;">${h.workedHoursFormatted || '0h 00m'}</strong></td>
                    <td>${h.lateMinutes > 0 ? `<span class="text-warning font-semibold">+${h.lateMinutes}m</span>` : '—'}</td>
                    <td>${h.overtimeMinutes > 0 ? `<span class="text-success font-semibold">+${h.overtimeMinutes}m</span>` : '—'}</td>
                    <td>
                      <span class="badge ${h.status === 'PRESENT' ? 'badge-success' : (h.status === 'LATE' ? 'badge-warning' : (h.status === 'ON_BREAK' ? 'badge-warning' : (h.status === 'REGULARIZED' ? 'badge-primary' : 'badge-neutral')))}">
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
      </div>
    `;
  },

  async executeCheckIn() {
    const btn = document.getElementById('btn-self-punch');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span>Checking In...</span>'; }

    try {
      if (typeof ESSView !== 'undefined') {
        const ok = await ESSView.togglePunch();
        if (!ok && ESSView.isShiftCompletedToday) {
          if (btn) { btn.disabled = false; btn.innerHTML = '<span>Web Check In (GPS)</span>'; }
          return;
        }
      } else {
        await attendanceService.checkIn({ source: 'WEB' });
        Toast.success('Check-in logged successfully! Shift started (10:00 AM – 07:00 PM).');
      }
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
      if (typeof ESSView !== 'undefined') {
        await ESSView.togglePunch();
      } else {
        await attendanceService.checkOut(employeeId);
        Toast.info('Checked OUT successfully! Today’s shift completed.');
      }
      this.switchTab('my');
    } catch (e) {
      Toast.error(e.message);
      if (btn) { btn.disabled = false; btn.innerHTML = '<span>Web Check Out</span>'; }
    }
  },

  async quickPunch() {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const todayRecord = await attendanceService.getTodayRecord(employeeId);
    if (!todayRecord || !todayRecord.checkIn || todayRecord.checkOut) {
      await this.executeCheckIn();
    } else {
      await this.executeCheckOut(employeeId);
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
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div class="empty-state-title">No Direct Reporting Staff Found</div>
              <div class="empty-state-desc">Employees assigned with you as reporting manager will appear here for shift monitoring.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Designation</th>
                  <th>Check In</th>
                  <th>Break Time</th>
                  <th>Check Out</th>
                  <th>Net Worked Time</th>
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
                    <td><span class="badge ${t.attendance.totalBreakMinutes > 0 ? 'badge-warning' : 'badge-neutral'}">${t.attendance.breakFormatted || (t.attendance.totalBreakMinutes ? t.attendance.totalBreakMinutes + 'm' : '0m')}</span></td>
                    <td><span class="font-semibold text-main">${t.attendance.checkOut || '—'}</span></td>
                    <td><strong style="color: var(--primary);">${t.attendance.workedHoursFormatted || '0h 00m'}</strong></td>
                    <td>
                      <span class="badge ${t.attendance.status === 'PRESENT' ? 'badge-success' : (t.attendance.status === 'LATE' ? 'badge-warning' : (t.attendance.status === 'ON_BREAK' ? 'badge-warning' : 'badge-neutral'))}">
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
    const rawRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    const isSuperAdmin = rawRole === 'SUPER_ADMIN';
    const isCompanyAdmin = rawRole === 'COMPANY_ADMIN' || rawRole === 'ADMIN';
    const isHR = rawRole === 'HR' || rawRole === 'HR_MANAGER';
    const isManager = rawRole === 'MANAGER';
    const canApprove = isSuperAdmin || isCompanyAdmin || isHR || isManager;
    const currentUserId = AuthGuard.currentUser?.uid;
    const currentEmployeeId = AuthGuard.userProfile?.employeeId;

    let requests = [];
    try {
      const snap = await db.collection('attendanceRegularizations').orderBy('createdAt', 'desc').get();
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (canApprove) {
        requests = all;
      } else {
        // Staff/Trainers/Employees strictly only see their own regularization requests
        requests = all.filter(r => r.requestedById === currentUserId || (currentEmployeeId && r.employeeId === currentEmployeeId));
      }
    } catch (e) {
      console.warn('Regularizations fetch error:', e);
    }

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${canApprove ? 'Attendance Regularization Requests' : 'My Regularization Requests'}</div>
            <div class="card-subtitle">${canApprove ? 'Review missed punches and time adjustment requests (HR / Manager approval required)' : 'Track status of your submitted punch correction and on-duty adjustment requests'}</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AttendanceView.openRegularizationModal()">+ Submit Request</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${requests.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="empty-state-title">No ${canApprove ? 'Pending' : ''} Regularizations</div>
              <div class="empty-state-desc">${canApprove ? 'All attendance punch corrections have been reviewed and approved.' : 'You have not submitted any attendance regularization requests.'}</div>
              <div class="empty-state-actions">
                <button class="btn btn-primary btn-sm" onclick="AttendanceView.openRegularizationModal()">+ Submit Request</button>
              </div>
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
                ${requests.map(r => {
                  const isSelfRequest = r.requestedById === currentUserId || (currentEmployeeId && r.employeeId === currentEmployeeId);
                  return `
                  <tr>
                    <td class="font-semibold text-main">
                      ${r.employeeName || 'Staff'}
                      ${isSelfRequest ? '<span class="badge badge-neutral" style="font-size: 0.65rem; margin-left: 4px;">You</span>' : ''}
                    </td>
                    <td>${r.requestedDate}</td>
                    <td><span class="text-secondary" style="font-size: 0.8rem;">${r.originalCheckIn} → ${r.originalCheckOut}</span></td>
                    <td><strong style="color: var(--primary);">${r.requestedCheckIn} → ${r.requestedCheckOut}</strong></td>
                    <td style="max-width: 200px; font-size: 0.8rem;">${r.reason}</td>
                    <td>
                      <span class="badge ${r.status === 'APPROVED' ? 'badge-success' : (r.status === 'REJECTED' ? 'badge-danger' : (r.status === 'CANCELLED' ? 'badge-neutral' : 'badge-warning'))}">
                        ${r.status}
                      </span>
                    </td>
                    <td>
                      ${canApprove ? `
                        ${r.status === 'PENDING' ? `
                          ${isSelfRequest && !isSuperAdmin ? `
                            <span class="text-muted" style="font-size: 0.75rem;">Self Request (HR Approval Needed)</span>
                          ` : `
                            <div class="flex items-center gap-1">
                              <button class="btn btn-soft btn-sm" onclick="AttendanceView.approveRegularization('${r.id}', '${r.attendanceId}', '${r.requestedCheckIn}', '${r.requestedCheckOut}', '${r.requestedById}')">Approve</button>
                              <button class="btn btn-secondary btn-sm" onclick="AttendanceView.rejectRegularization('${r.id}')">Reject</button>
                            </div>
                          `}
                        ` : `<span class="text-muted" style="font-size: 0.75rem;">Reviewed</span>`}
                      ` : `
                        ${r.status === 'PENDING' ? `
                          <button class="btn btn-secondary btn-sm" onclick="AttendanceView.cancelRegularization('${r.id}')">Cancel Request</button>
                        ` : `<span class="text-muted" style="font-size: 0.75rem;">${r.status}</span>`}
                      `}
                    </td>
                  </tr>
                `}).join('')}
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
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const canManageHolidays = role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || role === 'HR';

    const [holidays, shifts] = await Promise.all([
      attendanceSettingsService.getHolidays(),
      attendanceSettingsService.getShifts()
    ]);

    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Holidays -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Corporate & Statutory Holidays</div>
              <div class="card-subtitle">Official company calendar and non-working paid days</div>
            </div>
            ${canManageHolidays ? `<button class="btn btn-primary btn-sm" onclick="AttendanceView.openAddHolidayModal()">+ Add Holiday</button>` : ''}
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
            <div>
              <div class="card-title">Official Company Work Shift</div>
              <div class="card-subtitle">Mandatory single operational shift schedule as per Diallo HR Policy</div>
            </div>
            <span class="badge badge-success" style="font-weight: 600;">Active Standard Shift</span>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead><tr><th>Shift Name</th><th>Timings</th><th>Break Quota</th><th>Grace Period</th></tr></thead>
              <tbody>
                <tr>
                  <td class="font-semibold text-main">General Shift</td>
                  <td><strong style="color: var(--primary);">10:00 AM – 07:00 PM</strong> (8h Work)</td>
                  <td>1 Hour (Tracked)</td>
                  <td><span class="badge badge-neutral">10 mins (past 10:10 AM = Late)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  openAddHolidayModal() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    if (role !== 'SUPER_ADMIN' && role !== 'COMPANY_ADMIN' && role !== 'HR') {
      Toast.error('Access restricted: Only HR and Administrators can configure holidays.');
      return;
    }

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
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    if (role !== 'SUPER_ADMIN' && role !== 'COMPANY_ADMIN' && role !== 'HR') {
      Toast.error('Access restricted.');
      return;
    }

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

  openAddShiftModal() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    if (role !== 'SUPER_ADMIN' && role !== 'COMPANY_ADMIN' && role !== 'HR') {
      Toast.error('Access restricted: Only HR and Administrators can configure shifts.');
      return;
    }

    ModalManager.openModal({
      id: 'add-shift-modal',
      title: 'Configure Work Shift',
      subtitle: 'Define shift roster timing and grace window',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Shift Name</label>
          <input type="text" id="shift-name" class="form-control" placeholder="e.g. Afternoon Shift" required />
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Start Time</label>
            <input type="time" id="shift-start" class="form-control" value="09:00" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">End Time</label>
            <input type="time" id="shift-end" class="form-control" value="18:00" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Grace Period (Minutes)</label>
          <input type="number" id="shift-grace" class="form-control" value="15" min="0" max="60" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AttendanceView.saveShift()">Save Shift</button>
      `
    });
  },

  async saveShift() {
    Toast.success('Shift configuration saved.');
    ModalManager.closeModal();
    this.switchTab('holidays');
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
    const rawRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    if (!['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'HR_MANAGER'].includes(rawRole)) {
      Toast.error('Security Alert: Only HR and Super Admin can edit attendance records.');
      return;
    }

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
    const rawRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    if (!['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'HR_MANAGER'].includes(rawRole)) {
      Toast.error('Security Alert: Only HR and Super Admin can edit attendance records.');
      return;
    }

    const checkIn = document.getElementById('edit-att-in')?.value.trim();
    const checkOut = document.getElementById('edit-att-out')?.value.trim();
    const status = document.getElementById('edit-att-status')?.value;

    try {
      const inMins = attendanceService.time12ToMinutes(checkIn);
      const outMins = attendanceService.time12ToMinutes(checkOut);
      let grossMins = 0;
      if (checkIn && checkOut && checkOut !== '-') {
        grossMins = Math.max(0, outMins - inMins);
      }
      const breakMins = grossMins >= 540 ? 60 : 0;
      const netWorkedMins = Math.max(0, grossMins - breakMins);
      const otMins = netWorkedMins > 480 ? netWorkedMins - 480 : 0;

      const grossHoursFormatted = `${Math.floor(grossMins / 60)}h ${String(grossMins % 60).padStart(2, '0')}m`;
      const workedHoursFormatted = `${Math.floor(netWorkedMins / 60)}h ${String(netWorkedMins % 60).padStart(2, '0')}m`;

      await db.collection('attendanceRecords').doc(recordId).update({
        checkIn,
        checkOut,
        grossMinutes: grossMins,
        grossHoursFormatted,
        totalBreakMinutes: breakMins,
        totalBreakSeconds: breakMins * 60,
        breakFormatted: `${breakMins}m`,
        workedMinutes: netWorkedMins,
        workedHoursFormatted,
        overtimeMinutes: otMins,
        status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      Toast.success('Attendance record updated accurately.');
      ModalManager.closeModal();
      this.switchTab('daily');
    } catch (e) {
      Toast.error(`Failed to update: ${e.message}`);
    }
  },

  async cancelRegularization(reqId) {
    if (!confirm('Are you sure you want to cancel this regularization request?')) return;
    try {
      await db.collection('attendanceRegularizations').doc(reqId).update({
        status: 'CANCELLED',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      Toast.info('Regularization request cancelled.');
      this.switchTab('regularizations');
    } catch (e) {
      Toast.error(`Could not cancel request: ${e.message}`);
    }
  }
};

window.AttendanceView = AttendanceView;
