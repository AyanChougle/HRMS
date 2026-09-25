/**
 * DIALLO HRMS — COMPREHENSIVE EMPLOYEE SELF-SERVICE DASHBOARD
 * Focused on highlighted timecard/break station, fast action launchpad, leave balances, attendance overview, and notices
 */

const EmployeeDashboardView = {
  async render() {
    const employeeId =
      AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    if (typeof ESSView !== "undefined") {
      try {
        const todayRecord = await attendanceService.getTodayRecord(employeeId);
        await ESSView.syncWithFirestore(todayRecord);
      } catch (e) {
        console.warn("Dashboard ESSView sync warning:", e);
      }
    }

    const userDisplayName = AuthGuard.userProfile?.displayName || "Team Member";
    const employeeCode = AuthGuard.userProfile?.employeeCode || "EMP-0001";
    const department = AuthGuard.userProfile?.department || "Operations";
    const rawRole = (
      AuthGuard._previewRoleId ||
      AuthGuard.userProfile?.roleId ||
      "EMPLOYEE"
    )
      .toString()
      .toUpperCase()
      .trim();
    const isTrainee = rawRole === "TRAINEE";
    const todayStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Dynamic Current Week Attendance Rhythm (Mon – Fri)
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const dayOfWeek = now.getDay();
    const distToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distToMon);

    const weekDays = [];
    const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      weekDays.push({
        name: dayNames[i],
        iso,
        isSaturday: i === 5,
        isToday: iso === todayIso,
        isPast: iso < todayIso,
        isFuture: iso > todayIso,
      });
    }

    let weekAttendanceRecords = [];
    if (window.attendanceService && employeeId) {
      try {
        weekAttendanceRecords = await attendanceService.getAttendanceRecords({
          employeeId,
        });
      } catch (e) {
        console.warn("Attendance rhythm fetch warning:", e);
      }
    }
    const attMap = new Map();
    weekAttendanceRecords.forEach((r) => {
      if (r.date) attMap.set(r.date, r);
    });

    let onTimeCount = 0;
    let pastLoggedCount = 0;
    weekDays.forEach((wd) => {
      const rec = attMap.get(wd.iso);
      if (wd.isPast && rec) {
        pastLoggedCount++;
        if (rec.status === "PRESENT" || rec.status === "REGULARIZED")
          onTimeCount++;
      }
    });
    const punctualityRate =
      pastLoggedCount > 0
        ? Math.round((onTimeCount / pastLoggedCount) * 100)
        : 100;

    return `
      <!-- Welcome Hero Banner -->
      <div class="welcome-banner animate-fade-in" style="margin-bottom: 24px;">
        <div class="welcome-text">
          <div class="flex items-center gap-2" style="margin-bottom: 4px;">
            <span class="badge ${isTrainee ? "badge-warning" : "badge-primary"}" style="font-size: 0.75rem;">${isTrainee ? "Graduate Trainee" : employeeCode}</span>
            <span class="text-muted" style="font-size: 0.8rem;">• ${department}</span>
          </div>
          <h1>Hello, ${userDisplayName}</h1>
          <p>${isTrainee ? "Your graduate trainee workspace, daily timecard station, and curriculum track" : "Your employee self-service workspace, daily timecard station, and personal HR portal"}</p>
        </div>
        <div class="welcome-date-badge">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>${todayStr} (IST)</span>
        </div>
      </div>

      <!-- HIGHLIGHTED TIMECARD & BREAK STATION HERO -->
      <div class="card animate-fade-in" style="margin-bottom: 24px; border: 2px solid ${ESSView.isPunchedIn && ESSView.isOnBreak ? "var(--warning)" : "var(--primary-light)"}; box-shadow: ${ESSView.isPunchedIn && ESSView.isOnBreak ? "0 0 16px rgba(245, 158, 11, 0.15)" : "var(--shadow-sm)"};" id="emp-timecard-hero-card">
        <div class="card-header timecard-header">
          <div class="timecard-header-main">
            <div class="card-title" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span>Daily Shift & Timecard Station</span>
              <span id="emp-header-break-badge">${ESSView.isPunchedIn && ESSView.isOnBreak ? '<span class="badge badge-warning" style="font-size: 0.75rem; animation: pulse 2s infinite; display: inline-flex; align-items: center; gap: 4px;"><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Break Active</span>' : ""}</span>
            </div>
            <div class="card-subtitle timecard-header-subtitle">General Shift: Mon–Fri 10:00 AM – 07:00 PM • Sat 10:00 AM – 04:00 PM (Half Day) • Premises Geofence: 60m</div>
          </div>
          <div class="timecard-header-status">
            <span class="badge ${ESSView.isShiftCompletedToday ? "badge-success" : !ESSView.isPunchedIn ? "badge-neutral" : ESSView.isOnBreak ? "badge-warning" : "badge-success"}" id="emp-shift-badge">
              <span class="badge-dot"></span> ${ESSView.isShiftCompletedToday ? "Shift Completed (Today)" : !ESSView.isPunchedIn ? "Checked OUT" : ESSView.isOnBreak ? "On Break (Paused)" : "Checked IN"}
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
                  Status: <strong id="emp-timer-substatus">${ESSView.isShiftCompletedToday ? "Shift completed & punched out" : !ESSView.isPunchedIn ? "Ready to Check In (Opens 09:30 AM)" : ESSView.isOnBreak ? "Paused for Break" : "Active On Duty"}</strong>
                </div>
              </div>
            </div>

            <!-- Center: Break Time Tracker (Minimal Clean Timer) -->
            <div class="timecard-timer-card" style="display: block; background: ${ESSView.isOnBreak ? "rgba(245, 158, 11, 0.08)" : "var(--bg-card, #ffffff)"}; border: 1px solid ${ESSView.isOnBreak ? "#d97706" : "var(--border-color, #e2e8f0)"};" id="emp-break-highlight-box">
              <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                <div class="flex items-center gap-2">
                  <div style="width: 22px; height: 22px; border-radius: 6px; background: rgba(217, 119, 6, 0.12); color: #d97706; display: flex; align-items: center; justify-content: center;">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3M10 1v3M14 1v3"/></svg>
                  </div>
                  <span style="font-size: 0.72rem; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.05em;">Break Tracker</span>
                </div>
                <span class="badge ${ESSView.isOnBreak ? "badge-warning" : "badge-neutral"}" style="font-size: 0.7rem;" id="emp-break-badge-status">
                  ${ESSView.isShiftCompletedToday ? "Shift Ended" : ESSView.isOnBreak ? (ESSView.currentBreakLabel ? "Break: " + ESSView.currentBreakLabel : "On Break") : "1h Quota"}
                </span>
              </div>
              
              <div class="flex items-baseline justify-between" style="gap: 12px; margin-top: 4px;">
                <div>
                  <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;">Current</div>
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', system-ui, sans-serif; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; font-size: 1.45rem; font-weight: 700; color: ${ESSView.isOnBreak ? "var(--warning)" : "var(--text-secondary)"}; letter-spacing: 0.03em; line-height: 1.1; margin-top: 3px;" id="emp-break-timer">
                    00:00
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;">Used / Quota</div>
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', system-ui, sans-serif; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; font-size: 1.45rem; font-weight: 700; color: #d97706; letter-spacing: 0.03em; line-height: 1.1; margin-top: 3px;" id="emp-total-break">
                    ${typeof attendanceService !== "undefined" && attendanceService.formatBreakDuration ? attendanceService.formatBreakDuration(ESSView.totalBreakSeconds) : Math.floor(ESSView.totalBreakSeconds / 60) + "m"}
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Action Buttons Group (2 Distinct Punch Buttons + Break + Apply Leave) -->
            <div class="timecard-actions-panel">
              <div class="timecard-action-grid">
                <!-- 1. Dedicated Punch In Button -->
                <button class="btn timecard-action-btn ${ESSView.isShiftCompletedToday ? "btn-secondary disabled" : ESSView.isPunchedIn ? "btn-secondary disabled" : "btn-primary"}" id="emp-punch-in-btn" onclick="EmployeeDashboardView.handlePunchIn()" style="${ESSView.isShiftCompletedToday ? "opacity: 0.55; cursor: not-allowed;" : ESSView.isPunchedIn ? "opacity: 0.85; cursor: default; background: #f0fdf4; border-color: #86efac; color: #166534;" : "background: #16a34a; border-color: #16a34a; color: #ffffff;"}" ${ESSView.isShiftCompletedToday || ESSView.isPunchedIn ? "disabled" : ""}>
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${ESSView.isPunchedIn || ESSView.isShiftCompletedToday
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>'
      }
                  </svg>
                  <span>${ESSView.isPunchedIn || ESSView.isShiftCompletedToday ? "Punched In" : "Punch In"}</span>
                </button>

                <!-- 2. Dedicated Punch Out Button -->
                <button class="btn timecard-action-btn ${ESSView.isShiftCompletedToday ? "btn-secondary disabled" : ESSView.isPunchedIn ? "btn-secondary" : "btn-secondary disabled"}" id="emp-punch-out-btn" onclick="ESSView.punchOut()" style="${ESSView.isShiftCompletedToday ? "opacity: 0.7; cursor: not-allowed; background: #fef2f2; border-color: #fecaca; color: #991b1b;" : ESSView.isPunchedIn ? "color: #dc2626; border-color: #fca5a5; background: #fff5f5; cursor: pointer;" : "opacity: 0.5; cursor: not-allowed;"}" ${ESSView.isShiftCompletedToday || !ESSView.isPunchedIn ? "disabled" : ""}>
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${ESSView.isShiftCompletedToday
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>'
      }
                  </svg>
                  <span>${ESSView.isShiftCompletedToday ? "Punched Out" : "Punch Out"}</span>
                </button>
                
                <!-- 3. Break Button -->
                <button class="btn timecard-action-btn ${ESSView.isShiftCompletedToday ? "btn-secondary disabled" : ESSView.isOnBreak ? "btn-warning" : "btn-secondary"}" id="emp-break-btn" onclick="ESSView.toggleBreak()" style="${ESSView.isShiftCompletedToday ? "opacity: 0.55; cursor: not-allowed;" : !ESSView.isOnBreak && ESSView.isPunchedIn ? "color: #d97706; border-color: #fcd34d;" : ""}${isTrainee ? " grid-column: span 2;" : ""}" ${ESSView.isShiftCompletedToday ? "disabled" : ""}>
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${ESSView.isOnBreak ? "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3M10 1v3M14 1v3"}"/>
                  </svg>
                  <span>${ESSView.isShiftCompletedToday ? "Break" : ESSView.isOnBreak ? "Resume" : "Break"}</span>
                </button>

                <!-- 4. Apply Leave Button (Only for Non-Trainees) -->
                ${!isTrainee
        ? `
                  <button class="btn btn-secondary timecard-action-btn" onclick="Forms.openApplyLeaveModal()">
                    <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span>Apply Leave</span>
                  </button>
                `
        : ""
      }
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- FAST QUICK ACTIONS LAUNCHPAD -->
      <div class="card" style="margin-bottom: 24px; padding: 18px 20px;">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Quick Self-Service Actions</div>
        <div class="emp-quick-launchpad">
          ${isTrainee
        ? `
            <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md); border: 1.5px solid var(--primary); background: rgba(37, 99, 235, 0.08);" onclick="EmployeeDashboardView.openTraineeAgreementModal()">
              <span style="color: var(--primary); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </span>
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">Sign Agreement</span>
            </button>

            <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md);" onclick="Router.navigate('training')">
              <span style="color: var(--primary); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              </span>
              <span style="font-size: 0.85rem; font-weight: 600;">7-Day Modules</span>
            </button>

            <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md);" onclick="Router.navigate('compliance')">
              <span style="color: var(--success); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </span>
              <span style="font-size: 0.85rem; font-weight: 600;">Company Policies</span>
            </button>

            <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md);" onclick="Router.navigate('attendance')">
              <span style="color: var(--warning); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </span>
              <span style="font-size: 0.85rem; font-weight: 600;">Timecard & Logs</span>
            </button>
          `
        : `
            <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md);" onclick="Forms.openApplyLeaveModal()">
              <span style="color: var(--primary); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </span>
              <span style="font-size: 0.85rem; font-weight: 600;">Apply Leave</span>
            </button>

            <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md);" onclick="AttendanceView.openRegularizationModal()">
              <span style="color: var(--warning); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </span>
              <span style="font-size: 0.85rem; font-weight: 600;">Regularize Punch</span>
            </button>

            <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md);" onclick="RequestsView.openNewRequestModal()">
              <span style="color: var(--primary); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </span>
              <span style="font-size: 0.85rem; font-weight: 600;">Raise HR Request</span>
            </button>

            <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md);" onclick="RequestsView.openNewRequestModal('SALARY_SLIP_REQUEST')">
              <span style="color: var(--success); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </span>
              <span style="font-size: 0.85rem; font-weight: 600;">Request Salary Slip</span>
            </button>

            <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md);" onclick="Router.navigate('documents')">
              <span style="color: var(--info); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
              </span>
              <span style="font-size: 0.85rem; font-weight: 600;">My Documents</span>
            </button>

            <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md);" onclick="Router.navigate('assets')">
              <span style="color: var(--text-main); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </span>
              <span style="font-size: 0.85rem; font-weight: 600;">My Assets / IT</span>
            </button>

            <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md);" onclick="Router.navigate('performance')">
              <span style="color: var(--warning); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </span>
              <span style="font-size: 0.85rem; font-weight: 600;">Goals & Appraisal</span>
            </button>
          `
      }
        </div>
      </div>

      <!-- Employee 2 Core Grid -->
      <div class="dashboard-grid">
        
        <!-- Leave Balances (Single Paid Leave Scheme) or Trainee Terms Agreement -->
        ${isTrainee ? `
        <div class="col-span-6 card" style="border: 2px solid rgba(37, 99, 235, 0.2); background: var(--bg-surface);">
          <div class="card-header">
            <div>
              <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
                <span>Training &amp; Certification Agreement</span>
                <span class="badge badge-warning" id="emp-dash-trainee-aggr-badge">Pending Review</span>
              </div>
              <div class="card-subtitle">Mandatory attendance, certification milestone &amp; salary activation policy</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="EmployeeDashboardView.openTraineeAgreementModal()">Review &amp; Sign Agreement</button>
          </div>
          <div class="card-body">
            <div style="padding: 14px 16px; background: var(--bg-hover); border-radius: var(--radius-sm); border-left: 4px solid var(--primary); margin-bottom: 14px;">
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-main); margin-bottom: 6px;">Official Commitment Terms</div>
              <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                The trainee solemnly agrees to attend mandatory training daily (Mon–Fri 10:00 AM – 07:00 PM • Sat 10:00 AM – 04:00 PM). Trainees will <strong>not</strong> receive salary disbursement if they fail to certify. Upon passing and certification, the candidate officially converts to full-time confirmed Employee, and salary disbursements commence.
              </p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="padding: 10px 12px; background: var(--bg-hover); border-radius: 6px; font-size: 0.8rem;">
                <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; font-weight: 700;">Leave Policy</div>
                <strong style="color: var(--danger);">No Leaves Allowed</strong>
                <div style="color: var(--text-muted); font-size: 0.72rem; margin-top: 2px;">Zero leave entitlement during 7-day cohort</div>
              </div>
              <div style="padding: 10px 12px; background: var(--bg-hover); border-radius: 6px; font-size: 0.8rem;">
                <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; font-weight: 700;">Passing Outcome</div>
                <strong style="color: var(--success);">Full-Time Employee</strong>
                <div style="color: var(--text-muted); font-size: 0.72rem; margin-top: 2px;">Full salary disbursement begins upon certification</div>
              </div>
            </div>
          </div>
        </div>
        ` : `
        <div class="col-span-6 card">
          <div class="card-header">
            <div>
              <div class="card-title">My Paid Leave Balance</div>
              <div class="card-subtitle">Tenure-based statutory leave entitlement</div>
            </div>
            <button class="btn btn-soft btn-sm" onclick="Forms.openApplyLeaveModal()">+ Apply Leave</button>
          </div>
          <div class="card-body">
            <div class="emp-leave-balances-grid" id="emp-leave-balances-grid">
              
              <div class="kpi-card" style="padding: 16px; background: var(--bg-hover);">
                <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                  <span class="badge badge-primary font-bold" style="font-size: 0.7rem;" id="emp-dash-pl-badge">Statutory</span>
                  <span style="color: var(--primary); display: flex; align-items: center;">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </span>
                </div>
                <div class="text-secondary" style="font-size: 0.85rem; font-weight: 600;">Paid Leave (PL) Available</div>
                <div style="font-size: 1.7rem; font-weight: 800; color: var(--primary); line-height: 1.2;" id="emp-dash-pl-bal">-- Days</div>
                <div class="text-muted" style="font-size: 0.75rem; margin-top: 4px;" id="emp-dash-pl-sub">Loading...</div>
              </div>

              <div class="kpi-card" style="padding: 16px; background: var(--bg-hover);">
                <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                  <span class="badge badge-neutral" style="font-size: 0.7rem;">Official Policy</span>
                  <span style="color: var(--accent-attendance); display: flex; align-items: center;">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </span>
                </div>
                <div class="text-secondary" style="font-size: 0.85rem; font-weight: 600;">Tenure Entitlement Rule</div>
                <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-main); margin-top: 4px; line-height: 1.4;" id="emp-dash-tenure-rule">
                  &lt;6m: 0 PL • 6m–1y: 12 PL (1/mo) • &gt;1y: 18 PL (3/mo)
                </div>
                <div class="text-muted" style="font-size: 0.75rem; margin-top: 4px;" id="emp-dash-tenure-status">No carry-forward to next year</div>
              </div>

            </div>
          </div>
        </div>
        `}

        <!-- Performance Goals Card (Non-Trainee) / Curriculum Track (Trainee) -->
        ${
          isTrainee
            ? `
        <div class="col-span-6 card">
          <div class="card-header">
            <div>
              <div class="card-title">7-Day Training &amp; Curriculum</div>
              <div class="card-subtitle">Daily learning modules, milestones &amp; mentor evaluation</div>
            </div>
            <button class="btn btn-soft btn-sm" onclick="Router.navigate('training')">Curriculum Track &rarr;</button>
          </div>
          <div class="card-body">
            <div class="flex items-center justify-between" style="padding: 14px; background: var(--bg-hover); border-radius: var(--radius-sm); margin-bottom: 12px;">
              <div>
                <div class="font-semibold text-main" style="font-size: 0.95rem;">Graduate Onboarding Track</div>
                <div class="text-muted" style="font-size: 0.75rem;">7 Daily Modules • Monitored and evaluated by assigned Trainer</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="Router.navigate('training')">Open Modules</button>
            </div>
            <div class="metrics-row-3" style="margin-top: 10px;">
              <div style="padding: 8px; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: 6px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">Current Track</div>
                <strong style="font-size: 0.85rem; color: var(--text-main);">Day 1 of 7</strong>
              </div>
              <div style="padding: 8px; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: 6px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">Evaluator</div>
                <strong style="font-size: 0.85rem; color: var(--primary);">Lead Trainer</strong>
              </div>
              <div style="padding: 8px; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: 6px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">Status</div>
                <strong style="font-size: 0.85rem; color: var(--success);">In Training</strong>
              </div>
            </div>
          </div>
        </div>
        `
            : `
        <div class="col-span-6 card">
          <div class="card-header">
            <div>
              <div class="card-title">Performance &amp; Goals</div>
              <div class="card-subtitle">Assigned and evaluated by your Team Leader</div>
            </div>
            <button class="btn btn-soft btn-sm" onclick="Router.navigate('performance')">View Goals &rarr;</button>
          </div>
          <div class="card-body">
            <div class="flex items-center justify-between" style="padding: 14px; background: var(--bg-hover); border-radius: var(--radius-sm); margin-bottom: 12px;">
              <div>
                <div class="font-semibold text-main" style="font-size: 0.95rem;">2026 Annual Appraisal Cycle</div>
                <div class="text-muted" style="font-size: 0.75rem;">Scorecards, OKRs &amp; Competencies monitored by Team Leader</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="Router.navigate('performance')">Open Scorecard</button>
            </div>
            <div class="metrics-row-3" style="margin-top: 10px;">
              <div style="padding: 8px; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: 6px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">Cycle</div>
                <strong style="font-size: 0.85rem; color: var(--text-main);">Active</strong>
              </div>
              <div style="padding: 8px; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: 6px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">Evaluator</div>
                <strong style="font-size: 0.85rem; color: var(--primary);">Team Leader</strong>
              </div>
              <div style="padding: 8px; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: 6px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">Weighting</div>
                <strong style="font-size: 0.85rem; color: var(--text-main);">60% / 40%</strong>
              </div>
            </div>
          </div>
        </div>
        `
        }

        <!-- Upcoming Official Paid Holidays Card -->
        <div class="col-span-6 card">
          <div class="card-header">
            <div>
              <div class="card-title">Upcoming Company Holidays (India)</div>
              <div class="card-subtitle">Official statutory paid days-off</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('leave')">All Holidays</button>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="flex flex-col">
              <div class="flex items-center justify-between" style="padding: 12px 18px; border-bottom: 1px solid var(--border-main);">
                <div class="flex items-center gap-3">
                  <span style="color: var(--primary); display: flex; align-items: center;">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/></svg>
                  </span>
                  <div>
                    <div class="font-semibold text-main" style="font-size: 0.85rem;">Mahatma Gandhi Jayanti</div>
                    <div class="text-muted" style="font-size: 0.75rem;">National Gazetted Holiday</div>
                  </div>
                </div>
                <span class="badge badge-primary">Oct 02, 2026</span>
              </div>

              <div class="flex items-center justify-between" style="padding: 12px 18px; border-bottom: 1px solid var(--border-main);">
                <div class="flex items-center gap-3">
                  <span style="color: var(--warning); display: flex; align-items: center;">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                  </span>
                  <div>
                    <div class="font-semibold text-main" style="font-size: 0.85rem;">Dussehra / Vijayadashami</div>
                    <div class="text-muted" style="font-size: 0.75rem;">Festival Holiday</div>
                  </div>
                </div>
                <span class="badge badge-primary">Oct 20, 2026</span>
              </div>

              <div class="flex items-center justify-between" style="padding: 12px 18px;">
                <div class="flex items-center gap-3">
                  <span style="color: var(--warning); display: flex; align-items: center;">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  </span>
                  <div>
                    <div class="font-semibold text-main" style="font-size: 0.85rem;">Diwali / Deepavali (Laxmi Puja)</div>
                    <div class="text-muted" style="font-size: 0.75rem;">Festival Holiday</div>
                  </div>
                </div>
                <span class="badge badge-primary">Nov 08, 2026</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Shift & Punctuality Overview -->
        <div class="col-span-6 card">
          <div class="card-header">
            <div>
              <div class="card-title">This Week's Attendance Rhythm</div>
              <div class="card-subtitle">Monday – Saturday punctuality summary (Saturday Half Day: 10:00 AM – 04:00 PM)</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('attendance')">My Attendance</button>
          </div>
          <div class="card-body">
            <div class="week-rhythm-grid">
              ${weekDays.map(wd => {
        const rec = attMap.get(wd.iso);
        let badgeClass = 'badge-neutral';
        let statusLabel = 'Scheduled';
        let iconColor = 'var(--text-muted)';
        let iconPath = 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
        let cardBg = 'var(--bg-hover)';
        let borderStyle = '1px solid var(--border-main)';

        if (wd.isToday) {
          cardBg = 'var(--primary-light)';
          borderStyle = '1px solid var(--primary)';
          iconColor = 'var(--primary)';
          if (ESSView.isShiftCompletedToday) {
            badgeClass = 'badge-success';
            statusLabel = 'Completed';
            iconPath = 'M5 13l4 4L19 7';
          } else if (ESSView.isPunchedIn) {
            badgeClass = ESSView.isOnBreak ? 'badge-warning' : 'badge-primary';
            statusLabel = ESSView.isOnBreak ? 'Break' : 'Active';
          } else {
            badgeClass = 'badge-neutral';
            statusLabel = 'Pending';
          }
        } else if (wd.isPast) {
          if (rec) {
            if (rec.status === 'PRESENT' || rec.status === 'REGULARIZED') {
              badgeClass = 'badge-success';
              statusLabel = 'On Time';
              iconColor = 'var(--success)';
              iconPath = 'M5 13l4 4L19 7';
            } else if (rec.status === 'LATE') {
              badgeClass = 'badge-warning';
              statusLabel = 'Late';
              iconColor = 'var(--warning)';
              iconPath = 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
            } else if (rec.status === 'HALF_DAY') {
              badgeClass = 'badge-warning';
              statusLabel = 'Half Day';
              iconColor = 'var(--warning)';
            } else if (rec.status === 'LEAVE' || rec.status === 'ON_LEAVE') {
              badgeClass = 'badge-info';
              statusLabel = 'Leave';
              iconColor = 'var(--info)';
              iconPath = 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
            } else {
              badgeClass = 'badge-neutral';
              statusLabel = rec.status || 'Logged';
            }
          } else {
            badgeClass = 'badge-neutral';
            statusLabel = 'Unlogged';
          }
        }

        return `
                  <div style="padding: 12px 6px; background: ${cardBg}; border-radius: 8px; border: ${borderStyle};">
                    <div style="font-size: 0.75rem; color: ${wd.isToday ? 'var(--primary)' : 'var(--text-muted)'}; font-weight: 700;">${wd.name}${wd.isSaturday ? ' (HALF DAY)' : ''}${wd.isToday ? ' (TODAY)' : ''}</div>
                    <div style="display: flex; justify-content: center; margin: 4px 0;">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="${iconColor}"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="${iconPath}"/></svg>
                    </div>
                    <span class="badge ${badgeClass}" style="font-size: 0.65rem;">${statusLabel}</span>
                  </div>
                `;
      }).join('')}
            </div>
            <div class="flex items-center justify-between" style="margin-top: 14px; font-size: 0.8rem; color: var(--text-secondary);">
              <span>Target Work Hours: <strong>46h / week (Sat Half Day: 10 AM – 4 PM)</strong></span>
              <span>Avg Punctuality: <strong style="color: var(--success);">${punctualityRate}%</strong></span>
            </div>
          </div>
        </div>

        <!-- Organization Notices & Townhall Updates -->
        <div class="col-span-12 card">
          <div class="card-header">
            <div>
              <div class="card-title">Organization Notices & Townhall Updates</div>
              <div class="card-subtitle">Published announcements and corporate communication</div>
            </div>
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
      // Sync live timecard and break state immediately
      if (typeof ESSView !== "undefined" && ESSView.updateTimecardUI) {
        ESSView.updateTimecardUI();
      }

      // Check trainee agreement status if trainee
      const role = AuthGuard.userProfile?.role || AuthGuard.userRole || "";
      const isTrainee = role === "TRAINEE" || role === "trainee";
      const employeeId =
        AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || "trainee";
      const traineeKey = "diallo_trainee_agreement_" + employeeId;
      const signedDataStr = localStorage.getItem(traineeKey);
      const aggrBadge = document.getElementById("emp-dash-trainee-aggr-badge");
      if (aggrBadge) {
        if (signedDataStr) {
          aggrBadge.className = "badge badge-success";
          aggrBadge.textContent = "Signed & Active";
        } else {
          aggrBadge.className = "badge badge-warning";
          aggrBadge.textContent = "Pending Review & Sign";
        }
      }

      // If trainee is new and accessing for first time without signed agreement, the agreement comes first
      if (isTrainee && !signedDataStr) {
        setTimeout(() => {
          if (EmployeeDashboardView.openTraineeAgreementModal) {
            EmployeeDashboardView.openTraineeAgreementModal();
          }
        }, 500);
      }

      // Fetch dynamic leave balances (Tenure-Based Paid Leave)
      const balances = await leaveService.getEmployeeBalances(employeeId);
      const plBalEl = document.getElementById("emp-dash-pl-bal");
      const plSubEl = document.getElementById("emp-dash-pl-sub");
      const plBadgeEl = document.getElementById("emp-dash-pl-badge");
      const tenureStatusEl = document.getElementById("emp-dash-tenure-status");

      const plQuota = balances.PL;
      if (plBalEl) plBalEl.textContent = `${plQuota?.available ?? 0} Days`;
      if (plSubEl)
        plSubEl.textContent = `${plQuota?.used ?? 0} Used of ${plQuota?.allocated ?? 0} • Cap: ${plQuota?.monthlyQuota ?? 0} PL/mo • ${plQuota?.pending ?? 0} Pending`;
      if (plBadgeEl && plQuota?.quotaInfo?.ruleBadge) {
        plBadgeEl.textContent = plQuota.quotaInfo.ruleBadge;
      }
      if (tenureStatusEl && plQuota?.quotaInfo?.ruleExplanation) {
        tenureStatusEl.textContent = plQuota.quotaInfo.ruleExplanation;
      }

      // Fetch announcements
      const announcements = await announcementService.getAnnouncements(null, 3);
      const annBody = document.getElementById("emp-announcements-body");
      if (annBody) {
        if (!announcements || announcements.length === 0) {
          annBody.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No new company notices published.</div>`;
        } else {
          annBody.innerHTML = `
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
              ${announcements
              .map(
                (ann) => `
                <div class="announcement-card" style="padding: 16px; background: var(--bg-hover); border-radius: var(--radius-md); border: 1px solid var(--border-main);">
                  <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                    <span class="badge badge-primary" style="font-size: 0.7rem;">${ann.tag || "Notice"}</span>
                    <span class="announcement-date" style="font-size: 0.75rem; color: var(--text-muted);">${ann.date || "Today"}</span>
                  </div>
                  <div class="announcement-title" style="font-weight: 700; color: var(--text-main); font-size: 0.95rem; margin-bottom: 4px;">${ann.title}</div>
                  <div class="announcement-desc" style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${ann.content || ann.description || ""}</div>
                </div>
              `,
              )
              .join("")}
            </div>
          `;
        }
      }
    } catch (e) {
      console.error("Error rendering employee dashboard:", e);
    }
  },

  openTraineeAgreementModal() {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || 'trainee';
    const userName = AuthGuard.userProfile?.displayName || AuthGuard.userProfile?.name || AuthGuard.currentUser?.email?.split('@')[0] || 'Graduate Trainee';
    const traineeKey = 'diallo_trainee_agreement_' + employeeId;
    const signedDataStr = localStorage.getItem(traineeKey);
    let signedData = null;
    if (signedDataStr) {
      try {
        signedData = JSON.parse(signedDataStr);
      } catch (e) {
        signedData = { signedAt: new Date().toISOString(), signedBy: userName };
      }
    }

    const isSigned = !!signedData;
    const signedDateDisplay = isSigned
      ? new Date(signedData.signedAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })
      : '';

    const bodyHtml = `
      <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-main);">
        ${isSigned ? `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--success); color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <div style="font-weight: 700; color: var(--success);">Agreement Signed & Legally Verified</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Signed by <strong>${signedData.signedBy || userName}</strong> on <strong>${signedDateDisplay}</strong> (Doc ID: TR-2026-T1)</div>
            </div>
          </div>
        ` : `
          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--warning); border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
            <div style="font-weight: 700; color: var(--warning); margin-bottom: 4px;">Mandatory Cohort Compliance Action Required</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary);">All graduate trainees must review and execute this agreement prior to cohort completion. Failure to certify forfeits all compensation.</div>
          </div>
        `}

        <div style="max-height: 380px; overflow-y: auto; padding: 16px; background: var(--bg-hover); border-radius: 8px; border: 1px solid var(--border-main); margin-bottom: 20px; font-size: 0.85rem;">
          <h4 style="margin: 0 0 10px 0; font-size: 1rem; color: var(--text-main);">DIALLO TRAINEE COHORT & CERTIFICATION TERMS</h4>
          
          <div style="margin-bottom: 14px;">
            <div style="font-weight: 700; color: var(--primary); margin-bottom: 4px;">1. Mandatory Daily Attendance & Work Schedule</div>
            <p style="margin: 0; color: var(--text-secondary);">
              The Trainee agrees to attend mandatory training on all scheduled working days:
              <br/>- <strong>Monday to Friday:</strong> 10:00 AM to 07:00 PM IST (Full Day)
              <br/>- <strong>Saturday:</strong> 10:00 AM to 04:00 PM IST (Half Day)
              <br/>- <strong>Weekly Commitment:</strong> 46 hours total.
              <br/>All punches (Check-In / Check-Out) must be performed on-site within the designated 60-meter office geofence.
            </p>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="font-weight: 700; color: var(--danger); margin-bottom: 4px;">2. Zero Leave Entitlement Policy</div>
            <p style="margin: 0; color: var(--text-secondary);">
              Trainees have <strong>zero (0) leave balance</strong> throughout the 7-day cohort. No planned or casual leaves are permitted. Any unexcused absence results in immediate cohort dismissal.
            </p>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="font-weight: 700; color: var(--danger); margin-bottom: 4px;">3. No Compensation on Certification Failure</div>
            <p style="margin: 0; color: var(--text-secondary);">
              The Trainee explicitly acknowledges and agrees that <strong>no stipend, salary, or financial compensation will be paid</strong> if the Trainee fails to achieve passing scores, fails module assessments, or fails to be certified by the Lead Trainer.
            </p>
          </div>

          <div style="margin-bottom: 10px;">
            <div style="font-weight: 700; color: var(--success); margin-bottom: 4px;">4. Full-Time Employee Conversion & Salary Activation</div>
            <p style="margin: 0; color: var(--text-secondary);">
              Upon successfully completing all 7 modules, achieving passing scores on daily assessments, and receiving official certification, the Trainee is automatically converted to a confirmed full-time <strong>Employee</strong>. Regular monthly salary disbursement, compensation benefits, and statutory tenure-based leave accruals commence immediately upon conversion.
            </p>
          </div>
        </div>

        ${!isSigned ? `
          <form id="trainee-aggr-form" onsubmit="event.preventDefault(); EmployeeDashboardView.submitAgreementSignature('${employeeId}');">
            <div style="margin-bottom: 14px;">
              <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="trainee-aggr-confirm" required style="margin-top: 3px; width: 18px; height: 18px;" />
                <span style="font-size: 0.85rem; color: var(--text-main); line-height: 1.4;">
                  I solemnly declare that I have read, understood, and accept all the terms of this Training Cohort & Certification Agreement. I accept that failure to certify will forfeit compensation, and that employment status and salary disbursement will only be granted upon successful certification.
                </span>
              </label>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label required" style="font-size: 0.8rem; font-weight: 600;">Signatory Full Legal Name</label>
              <input type="text" id="trainee-aggr-name" class="form-control" value="${userName}" placeholder="Type your full legal name as digital signature" required style="font-size: 0.9rem;" />
            </div>
          </form>
        ` : ''}
      </div>
    `;

    const footerHtml = isSigned ? `
      <button class="btn btn-secondary btn-sm" data-modal-close>Close</button>
    ` : `
      <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="EmployeeDashboardView.submitAgreementSignature('${employeeId}')">Accept & Sign Agreement</button>
    `;

    ModalManager.openModal({
      title: 'Trainee Cohort & Certification Agreement',
      subtitle: 'Mandatory Attendance, Zero-Leave Cohort & Employment Conversion Terms',
      contentHtml: bodyHtml,
      bodyHtml,
      footerHtml,
      size: 'lg'
    });
  },

  submitAgreementSignature(employeeId) {
    const confirmEl = document.getElementById('trainee-aggr-confirm');
    const nameEl = document.getElementById('trainee-aggr-name');

    if (!confirmEl || !confirmEl.checked) {
      Toast.warning('Please check the confirmation box to accept the agreement terms.');
      return;
    }

    const signerName = (nameEl?.value || '').trim();
    if (!signerName) {
      Toast.warning('Please enter your full legal name as your digital signature.');
      return;
    }

    const signaturePayload = {
      signedAt: new Date().toISOString(),
      signedBy: signerName,
      employeeId,
      version: '2026-v1.0'
    };

    localStorage.setItem('diallo_trainee_agreement_' + employeeId, JSON.stringify(signaturePayload));

    // Update UI badge if present on dashboard
    const aggrBadge = document.getElementById('emp-dash-trainee-aggr-badge');
    if (aggrBadge) {
      aggrBadge.className = 'badge badge-success';
      aggrBadge.textContent = 'Signed & Active';
    }

    Toast.success('Agreement successfully signed and recorded.');
    ModalManager.closeModal();
  },

  handlePunchIn() {
    const role = (typeof AuthGuard !== 'undefined' && (AuthGuard.userProfile?.role || AuthGuard.userRole)) || '';
    const isTrainee = role === 'TRAINEE' || role === 'trainee';
    const employeeId =
      (typeof AuthGuard !== 'undefined' && (AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid)) || 'trainee';
    if (isTrainee && !localStorage.getItem('diallo_trainee_agreement_' + employeeId)) {
      if (typeof Toast !== 'undefined') {
        Toast.warning('Please review and sign the Training & Certification Agreement first before punching in.');
      }
      this.openTraineeAgreementModal();
      return;
    }
    if (typeof ESSView !== 'undefined' && ESSView.punchIn) {
      ESSView.punchIn();
    }
  },
};

window.EmployeeDashboardView = EmployeeDashboardView;
