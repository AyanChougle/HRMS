const fs = require('fs');
const path = require('path');

const filesToPatch = [
  'js/views/manager-dashboard-view.js',
  'js/views/admin-dashboard-view.js',
  'js/views/trainer-dashboard-view.js'
];

const syncCode = `    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    if (typeof ESSView !== "undefined" && window.attendanceService) {
      try {
        const todayRecord = await attendanceService.getTodayRecord(employeeId);
        await ESSView.syncWithFirestore(todayRecord);
      } catch (e) {
        console.warn("Dashboard ESSView sync warning:", e);
      }
    }
`;

const timecardHtml = `      <!-- HIGHLIGHTED TIMECARD & BREAK STATION HERO -->
      <div class="card animate-fade-in" style="margin-bottom: 24px; border: 2px solid \${ESSView.isPunchedIn && ESSView.isOnBreak ? "var(--warning)" : "var(--primary-light)"}; box-shadow: \${ESSView.isPunchedIn && ESSView.isOnBreak ? "0 0 16px rgba(245, 158, 11, 0.15)" : "var(--shadow-sm)"};" id="emp-timecard-hero-card">
        <div class="card-header timecard-header">
          <div class="timecard-header-main">
            <div class="card-title" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span>My Daily Shift & Timecard</span>
              <span id="emp-header-break-badge">\${ESSView.isPunchedIn && ESSView.isOnBreak ? '<span class="badge badge-warning" style="font-size: 0.75rem; animation: pulse 2s infinite; display: inline-flex; align-items: center; gap: 4px;"><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Break Active</span>' : ""}</span>
            </div>
            <div class="card-subtitle timecard-header-subtitle">General Shift: Mon–Fri 10:00 AM – 07:00 PM • Sat 10:00 AM – 04:00 PM (Half Day)</div>
          </div>
          <div class="timecard-header-status">
            <span class="badge \${ESSView.isShiftCompletedToday ? "badge-success" : !ESSView.isPunchedIn ? "badge-neutral" : ESSView.isOnBreak ? "badge-warning" : "badge-success"}" id="emp-shift-badge">
              <span class="badge-dot"></span> \${ESSView.isShiftCompletedToday ? "Shift Completed (Today)" : !ESSView.isPunchedIn ? "Checked OUT" : ESSView.isOnBreak ? "On Break (Paused)" : "Checked IN"}
            </span>
          </div>
        </div>

        <div class="card-body" style="padding: 18px 20px;">
          <div class="timecard-station-grid">
            <!-- Left: Work Time Display (Minimal Clean Timer) -->
            <div class="timecard-timer-card">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(59, 130, 246, 0.08); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div style="min-width: 0; flex: 1;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Work Duration</span>
                  <span style="font-size: 0.7rem; font-weight: 600; color: var(--text-muted); background: var(--bg-hover, #f1f5f9); padding: 2px 6px; border-radius: 4px; letter-spacing: 0.02em;">8h Target</span>
                </div>
                <div style="margin-top: 3px; display: flex; align-items: baseline; gap: 6px;">
                  <span id="emp-live-timer" style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', system-ui, sans-serif; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; font-size: 1.85rem; font-weight: 700; color: var(--text-main, #0f172a); letter-spacing: 0.03em; line-height: 1.1;">
                    00:00:00
                  </span>
                </div>
                <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  Status: <strong id="emp-timer-substatus">\${ESSView.isShiftCompletedToday ? "Shift completed & punched out" : !ESSView.isPunchedIn ? "Ready to Check In (Opens 09:30 AM)" : ESSView.isOnBreak ? "Paused for Break" : "Active On Duty"}</strong>
                </div>
              </div>
            </div>

            <!-- Center: Break Time Tracker (Minimal Clean Timer) -->
            <div class="timecard-timer-card" style="display: block; background: \${ESSView.isOnBreak ? "rgba(245, 158, 11, 0.08)" : "var(--bg-card, #ffffff)"}; border: 1px solid \${ESSView.isOnBreak ? "#d97706" : "var(--border-color, #e2e8f0)"};" id="emp-break-highlight-box">
              <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                <div class="flex items-center gap-2">
                  <div style="width: 22px; height: 22px; border-radius: 6px; background: rgba(217, 119, 6, 0.12); color: #d97706; display: flex; align-items: center; justify-content: center;">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3M10 1v3M14 1v3"/></svg>
                  </div>
                  <span style="font-size: 0.72rem; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.05em;">Break Tracker</span>
                </div>
                <span class="badge \${ESSView.isOnBreak ? "badge-warning" : "badge-neutral"}" style="font-size: 0.7rem;" id="emp-break-badge-status">
                  \${ESSView.isShiftCompletedToday ? "Shift Ended" : ESSView.isOnBreak ? (ESSView.currentBreakLabel ? "Break: " + ESSView.currentBreakLabel : "On Break") : "1h Quota"}
                </span>
              </div>
              <div class="flex items-baseline justify-between" style="gap: 12px; margin-top: 4px;">
                <div>
                  <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;">Current</div>
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', system-ui, sans-serif; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; font-size: 1.45rem; font-weight: 700; color: \${ESSView.isOnBreak ? "var(--warning)" : "var(--text-secondary)"}; letter-spacing: 0.03em; line-height: 1.1; margin-top: 3px;" id="emp-break-timer">
                    00:00
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;">Used / Quota</div>
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', system-ui, sans-serif; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; font-size: 1.45rem; font-weight: 700; color: #d97706; letter-spacing: 0.03em; line-height: 1.1; margin-top: 3px;" id="emp-total-break">
                    \${typeof attendanceService !== "undefined" && attendanceService.formatBreakDuration ? attendanceService.formatBreakDuration(ESSView.totalBreakSeconds) : Math.floor(ESSView.totalBreakSeconds / 60) + "m"}
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Action Buttons Group (2 Distinct Punch Buttons + Break + Apply Leave) -->
            <div class="timecard-actions-panel">
              <div class="timecard-action-grid">
                <!-- 1. Dedicated Punch In Button -->
                <button class="btn timecard-action-btn \${ESSView.isShiftCompletedToday ? "btn-secondary disabled" : ESSView.isPunchedIn ? "btn-secondary disabled" : "btn-primary"}" id="emp-punch-in-btn" onclick="EmployeeDashboardView.handlePunchIn()" style="\${ESSView.isShiftCompletedToday ? "opacity: 0.55; cursor: not-allowed;" : ESSView.isPunchedIn ? "opacity: 0.85; cursor: default; background: #f0fdf4; border-color: #86efac; color: #166534;" : "background: #16a34a; border-color: #16a34a; color: #ffffff;"}" \${ESSView.isShiftCompletedToday || ESSView.isPunchedIn ? "disabled" : ""}>
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    \${ESSView.isPunchedIn || ESSView.isShiftCompletedToday
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3h7a3 3 0 013 3v1"/>'
      }
                  </svg>
                  <span>\${ESSView.isPunchedIn || ESSView.isShiftCompletedToday ? "Punched In" : "Punch In"}</span>
                </button>

                <!-- 2. Dedicated Punch Out Button -->
                <button class="btn timecard-action-btn \${ESSView.isShiftCompletedToday ? "btn-secondary disabled" : ESSView.isPunchedIn ? "btn-secondary" : "btn-secondary disabled"}" id="emp-punch-out-btn" onclick="ESSView.punchOut()" style="\${ESSView.isShiftCompletedToday ? "opacity: 0.7; cursor: not-allowed; background: #fef2f2; border-color: #fecaca; color: #991b1b;" : ESSView.isPunchedIn ? "color: #dc2626; border-color: #fca5a5; background: #fff5f5; cursor: pointer;" : "opacity: 0.5; cursor: not-allowed;"}" \${ESSView.isShiftCompletedToday || !ESSView.isPunchedIn ? "disabled" : ""}>
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    \${ESSView.isShiftCompletedToday
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>'
      }
                  </svg>
                  <span>\${ESSView.isShiftCompletedToday ? "Punched Out" : "Punch Out"}</span>
                </button>
                
                <!-- 3. Break Button -->
                <button class="btn timecard-action-btn \${ESSView.isShiftCompletedToday ? "btn-secondary disabled" : ESSView.isOnBreak ? "btn-warning" : "btn-secondary"}" id="emp-break-btn" onclick="ESSView.toggleBreak()" style="\${ESSView.isShiftCompletedToday ? "opacity: 0.55; cursor: not-allowed;" : !ESSView.isOnBreak && ESSView.isPunchedIn ? "color: #d97706; border-color: #fcd34d;" : ""}" \${ESSView.isShiftCompletedToday ? "disabled" : ""}>
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="\${ESSView.isOnBreak ? "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3M10 1v3M14 1v3"}"/>
                  </svg>
                  <span>\${ESSView.isShiftCompletedToday ? "Break" : ESSView.isOnBreak ? "Resume" : "Break"}</span>
                </button>

                <!-- 4. Apply Leave Button -->
                <button class="btn btn-secondary timecard-action-btn" onclick="Forms.openApplyLeaveModal()">
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>Apply Leave</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
`;

filesToPatch.forEach(relPath => {
  const file = path.join(__dirname, relPath);
  if (!fs.existsSync(file)) return;

  let content = fs.readFileSync(file, 'utf8');

  if (content.includes('emp-timecard-hero-card')) {
    console.log(relPath, 'already has timecard');
    return;
  }

  // 1. Inject sync code right after async render() {
  content = content.replace("async render() {", "async render() {\\n" + syncCode);

  // 2. Inject HTML right before <!-- 4 Team Focused KPI Cards --> or <!-- Quick KPIs -->
  if (content.includes('<!-- 4 Team Focused KPI Cards -->')) {
    content = content.replace('<!-- 4 Team Focused KPI Cards -->', timecardHtml + '\\n      <!-- 4 Team Focused KPI Cards -->');
  } else if (content.includes('<!-- Dashboard KPI Cards -->')) {
    content = content.replace('<!-- Dashboard KPI Cards -->', timecardHtml + '\\n      <!-- Dashboard KPI Cards -->');
  } else if (content.includes('<!-- Quick KPIs -->')) {
    content = content.replace('<!-- Quick KPIs -->', timecardHtml + '\\n      <!-- Quick KPIs -->');
  } else if (content.includes('<!-- Top KPIs -->')) {
    content = content.replace('<!-- Top KPIs -->', timecardHtml + '\\n      <!-- Top KPIs -->');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Patched:', relPath);
});
