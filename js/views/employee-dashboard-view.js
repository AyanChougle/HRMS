/**
 * DIALLO HRMS — COMPREHENSIVE EMPLOYEE SELF-SERVICE DASHBOARD
 * Focused on highlighted timecard/break station, fast action launchpad, leave balances, attendance overview, and notices
 */

const EmployeeDashboardView = {
  async render() {
    const userDisplayName = AuthGuard.userProfile?.displayName || 'Team Member';
    const employeeCode = AuthGuard.userProfile?.employeeCode || 'EMP-0001';
    const department = AuthGuard.userProfile?.department || 'Operations';
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <!-- Welcome Hero Banner -->
      <div class="welcome-banner animate-fade-in" style="margin-bottom: 24px;">
        <div class="welcome-text">
          <div class="flex items-center gap-2" style="margin-bottom: 4px;">
            <span class="badge badge-primary" style="font-size: 0.75rem;">${employeeCode}</span>
            <span class="text-muted" style="font-size: 0.8rem;">• ${department}</span>
          </div>
          <h1>Hello, ${userDisplayName}</h1>
          <p>Your employee self-service workspace, daily timecard station, and personal HR portal</p>
        </div>
        <div class="welcome-date-badge">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>${todayStr} (IST)</span>
        </div>
      </div>

      <!-- HIGHLIGHTED TIMECARD & BREAK STATION HERO -->
      <div class="card animate-fade-in" style="margin-bottom: 24px; border: 2px solid ${(ESSView.isPunchedIn && ESSView.isOnBreak) ? 'var(--warning)' : 'var(--primary-light)'}; box-shadow: ${(ESSView.isPunchedIn && ESSView.isOnBreak) ? '0 0 16px rgba(245, 158, 11, 0.15)' : 'var(--shadow-sm)'};" id="emp-timecard-hero-card">
        <div class="card-header" style="border-bottom: 1px solid var(--border-main); padding-bottom: 14px;">
          <div>
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <span>Daily Shift & Timecard Station</span>
              <span id="emp-header-break-badge">${(ESSView.isPunchedIn && ESSView.isOnBreak) ? '<span class="badge badge-warning" style="font-size: 0.75rem; animation: pulse 2s infinite; display: inline-flex; align-items: center; gap: 4px;"><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Break Active</span>' : ''}</span>
            </div>
            <div class="card-subtitle">General Shift: 10:00 AM – 07:00 PM IST (9h Schedule • 15m Grace)</div>
          </div>
          <span class="badge ${ESSView.isShiftCompletedToday ? 'badge-success' : (!ESSView.isPunchedIn ? 'badge-neutral' : (ESSView.isOnBreak ? 'badge-warning' : 'badge-success'))}" id="emp-shift-badge">
            <span class="badge-dot"></span> ${ESSView.isShiftCompletedToday ? 'Shift Completed (Today)' : (!ESSView.isPunchedIn ? 'Checked OUT' : (ESSView.isOnBreak ? 'On Break (Paused)' : 'Checked IN'))}
          </span>
        </div>

        <div class="card-body">
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; align-items: center;">
            
            <!-- Left: Work Time Display -->
            <div class="flex items-center gap-4">
              <div style="width: 52px; height: 52px; border-radius: var(--radius-md); background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Logged Work Time Today</div>
                <div style="font-size: 2.4rem; font-weight: 800; font-family: monospace; color: var(--primary); line-height: 1.1; margin-top: 2px;" id="emp-live-timer">
                  00:00:00
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
                  Status: <strong id="emp-timer-substatus">${ESSView.isShiftCompletedToday ? 'Shift Completed for Today • Next shift tomorrow 10:00 AM – 07:00 PM' : (!ESSView.isPunchedIn ? 'Shift Not Started • General Shift 10:00 AM – 07:00 PM' : (ESSView.isOnBreak ? 'Timer Paused for Break' : 'Active On Duty'))}</strong>
                </div>
              </div>
            </div>

            <!-- Center: HIGHLIGHTED BREAK TIME STATION -->
            <div style="background: ${ESSView.isOnBreak ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-hover)'}; border: 1.5px solid ${ESSView.isOnBreak ? 'var(--warning)' : 'rgba(245, 158, 11, 0.3)'}; border-radius: var(--radius-md); padding: 16px 20px; position: relative;" id="emp-break-highlight-box">
              <div class="flex items-center justify-between" style="margin-bottom: 8px;">
                <div class="flex items-center gap-2">
                  <span style="color: #d97706; display: flex; align-items: center;">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3M10 1v3M14 1v3"/></svg>
                  </span>
                  <span style="font-size: 0.8rem; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.05em;">Break Time Tracker</span>
                </div>
                <span class="badge ${ESSView.isOnBreak ? 'badge-warning' : 'badge-neutral'}" style="font-size: 0.7rem;" id="emp-break-badge-status">
                  ${ESSView.isShiftCompletedToday ? 'Shift Ended' : (ESSView.isOnBreak ? 'Break in progress' : 'Break Idle')}
                </span>
              </div>
              
              <div class="flex items-baseline justify-between" style="gap: 12px; flex-wrap: wrap;">
                <div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Current Break:</div>
                  <div style="font-size: 1.5rem; font-weight: 800; font-family: monospace; color: ${ESSView.isOnBreak ? 'var(--warning)' : 'var(--text-secondary)'};" id="emp-break-timer">
                    00:00
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Total Break Taken:</div>
                  <div style="font-size: 1.5rem; font-weight: 800; font-family: monospace; color: #d97706;" id="emp-total-break">
                    ${(typeof attendanceService !== 'undefined' && attendanceService.formatBreakDuration) ? attendanceService.formatBreakDuration(ESSView.totalBreakSeconds) : (Math.floor(ESSView.totalBreakSeconds / 60) + 'm')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Action Buttons Group -->
            <div class="flex items-center gap-3 justify-end" style="flex-wrap: wrap;">
              <button class="btn ${ESSView.isShiftCompletedToday ? 'btn-secondary btn-lg disabled' : 'btn-primary btn-lg'}" id="emp-punch-btn" onclick="ESSView.togglePunch()" style="min-width: 170px; ${ESSView.isShiftCompletedToday ? 'opacity: 0.75; cursor: not-allowed;' : ''}" ${ESSView.isShiftCompletedToday ? 'disabled' : ''}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  ${ESSView.isShiftCompletedToday 
                    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>' 
                    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
                </svg>
                <span>${ESSView.isShiftCompletedToday ? 'Shift Completed Today' : (ESSView.isPunchedIn ? 'Punch Out' : 'Web Punch In (GPS)')}</span>
              </button>
              
              <button class="btn ${ESSView.isOnBreak ? 'btn-warning' : 'btn-secondary'} btn-lg" id="emp-break-btn" style="display: ${(ESSView.isPunchedIn && !ESSView.isShiftCompletedToday) ? 'inline-flex' : 'none'}; min-width: 140px;" onclick="ESSView.toggleBreak()">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${ESSView.isOnBreak ? 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z'}"/>
                </svg>
                <span>${ESSView.isOnBreak ? 'End Break' : 'Start Break'}</span>
              </button>

              <button class="btn btn-secondary btn-lg" onclick="Forms.openApplyLeaveModal()">
                <span>Apply Leave</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- FAST QUICK ACTIONS LAUNCHPAD (6 TILES) -->
      <div class="card" style="margin-bottom: 24px; padding: 18px 20px;">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Quick Self-Service Actions</div>
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
          
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

          <button class="btn btn-soft" style="padding: 12px; height: auto; flex-direction: column; gap: 8px; justify-content: center; text-align: center; border-radius: var(--radius-md);" onclick="Router.navigate('payroll')">
            <span style="color: var(--success); display: flex; align-items: center; justify-content: center;">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </span>
            <span style="font-size: 0.85rem; font-weight: 600;">View Salary Slip</span>
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

        </div>
      </div>

      <!-- Employee 2 Core Grid -->
      <div class="dashboard-grid">
        
        <!-- Leave Balances (PL & CL only) -->
        <div class="col-span-6 card">
          <div class="card-header">
            <div>
              <div class="card-title">My Leave Balances</div>
              <div class="card-subtitle">Statutory annual leave ledgers</div>
            </div>
            <button class="btn btn-soft btn-sm" onclick="Forms.openApplyLeaveModal()">+ Apply Leave</button>
          </div>
          <div class="card-body">
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 14px;" id="emp-leave-balances-grid">
              
              <div class="kpi-card" style="padding: 16px; background: var(--bg-hover);">
                <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                  <span class="badge badge-primary" style="font-size: 0.7rem;">Paid Earned</span>
                  <span style="color: var(--primary); display: flex; align-items: center;">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </span>
                </div>
                <div class="text-secondary" style="font-size: 0.85rem; font-weight: 600;">Privilege Leave (PL)</div>
                <div style="font-size: 1.7rem; font-weight: 800; color: var(--primary); line-height: 1.2;" id="emp-dash-pl-bal">18 Days</div>
                <div class="text-muted" style="font-size: 0.75rem; margin-top: 4px;" id="emp-dash-pl-sub">0 Days Used of 18</div>
              </div>

              <div class="kpi-card" style="padding: 16px; background: var(--bg-hover);">
                <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                  <span class="badge badge-neutral" style="font-size: 0.7rem;">Short Absence</span>
                  <span style="color: var(--accent-attendance); display: flex; align-items: center;">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </span>
                </div>
                <div class="text-secondary" style="font-size: 0.85rem; font-weight: 600;">Casual Leave (CL)</div>
                <div style="font-size: 1.7rem; font-weight: 800; color: var(--accent-attendance); line-height: 1.2;" id="emp-dash-cl-bal">12 Days</div>
                <div class="text-muted" style="font-size: 0.75rem; margin-top: 4px;" id="emp-dash-cl-sub">0 Days Used of 12</div>
              </div>

            </div>
          </div>
        </div>

        <!-- Latest Salary Statement Card -->
        <div class="col-span-6 card">
          <div class="card-header">
            <div>
              <div class="card-title">Latest Salary Statement</div>
              <div class="card-subtitle">Monthly Compensation & Statutory Slip</div>
            </div>
            <span class="badge badge-success">Processed</span>
          </div>
          <div class="card-body">
            <div class="flex items-center justify-between" style="padding: 14px; background: var(--bg-hover); border-radius: var(--radius-sm); margin-bottom: 12px;">
              <div>
                <div class="font-semibold text-main" style="font-size: 0.95rem;">Monthly Payout (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})</div>
                <div class="text-muted" style="font-size: 0.75rem;">Disbursed via Direct Bank Transfer • HDFC Bank</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="Router.navigate('payroll')">View Payslip</button>
            </div>
            <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; margin-top: 10px;">
              <div style="padding: 8px; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: 6px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">EPF (12%)</div>
                <strong style="font-size: 0.85rem; color: var(--text-main);">Deducted</strong>
              </div>
              <div style="padding: 8px; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: 6px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">Prof. Tax (PT)</div>
                <strong style="font-size: 0.85rem; color: var(--text-main);">Compliant</strong>
              </div>
              <div style="padding: 8px; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: 6px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">TDS (Sec 192)</div>
                <strong style="font-size: 0.85rem; color: var(--text-main);">Filed</strong>
              </div>
            </div>
          </div>
        </div>

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
              <div class="card-subtitle">Monday – Friday punctuality summary</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('attendance')">My Attendance</button>
          </div>
          <div class="card-body">
            <div class="grid" style="grid-template-columns: repeat(5, 1fr); gap: 8px; text-align: center;">
              <div style="padding: 12px 6px; background: var(--bg-hover); border-radius: 8px; border: 1px solid var(--border-main);">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">MON</div>
                <div style="display: flex; justify-content: center; margin: 4px 0;">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--success)"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </div>
                <span class="badge badge-success" style="font-size: 0.65rem;">On Time</span>
              </div>
              <div style="padding: 12px 6px; background: var(--bg-hover); border-radius: 8px; border: 1px solid var(--border-main);">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">TUE</div>
                <div style="display: flex; justify-content: center; margin: 4px 0;">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--success)"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </div>
                <span class="badge badge-success" style="font-size: 0.65rem;">On Time</span>
              </div>
              <div style="padding: 12px 6px; background: var(--bg-hover); border-radius: 8px; border: 1px solid var(--border-main);">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">WED</div>
                <div style="display: flex; justify-content: center; margin: 4px 0;">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--success)"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </div>
                <span class="badge badge-success" style="font-size: 0.65rem;">On Time</span>
              </div>
              <div style="padding: 12px 6px; background: var(--bg-hover); border-radius: 8px; border: 1px solid var(--border-main);">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">THU</div>
                <div style="display: flex; justify-content: center; margin: 4px 0;">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--success)"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                </div>
                <span class="badge badge-success" style="font-size: 0.65rem;">On Time</span>
              </div>
              <div style="padding: 12px 6px; background: var(--primary-light); border-radius: 8px; border: 1px solid var(--primary);">
                <div style="font-size: 0.75rem; color: var(--primary); font-weight: 800;">FRI (TODAY)</div>
                <div style="display: flex; justify-content: center; margin: 4px 0;">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--primary)"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <span class="badge badge-primary" style="font-size: 0.65rem;">Active</span>
              </div>
            </div>
            <div class="flex items-center justify-between" style="margin-top: 14px; font-size: 0.8rem; color: var(--text-secondary);">
              <span>Target Work Hours: <strong>45h / week</strong></span>
              <span>Avg Punctuality: <strong style="color: var(--success);">100%</strong></span>
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
      if (typeof ESSView !== 'undefined' && ESSView.updateTimecardUI) {
        ESSView.updateTimecardUI();
      }

      // Fetch dynamic leave balances (PL & CL)
      const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      const balances = await leaveService.getEmployeeBalances(employeeId);
      const plBalEl = document.getElementById('emp-dash-pl-bal');
      const plSubEl = document.getElementById('emp-dash-pl-sub');
      const clBalEl = document.getElementById('emp-dash-cl-bal');
      const clSubEl = document.getElementById('emp-dash-cl-sub');

      if (plBalEl) plBalEl.textContent = `${(balances.PL || balances.AL)?.available ?? 18} Days`;
      if (plSubEl) plSubEl.textContent = `${(balances.PL || balances.AL)?.used ?? 0} Used • ${(balances.PL || balances.AL)?.pending ?? 0} Pending`;
      if (clBalEl) clBalEl.textContent = `${balances.CL?.available ?? 12} Days`;
      if (clSubEl) clSubEl.textContent = `${balances.CL?.used ?? 0} Used • ${balances.CL?.pending ?? 0} Pending`;

      // Fetch announcements
      const announcements = await announcementService.getAnnouncements(null, 3);
      const annBody = document.getElementById('emp-announcements-body');
      if (annBody) {
        if (!announcements || announcements.length === 0) {
          annBody.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No new company notices published.</div>`;
        } else {
          annBody.innerHTML = `
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
              ${announcements.map(ann => `
                <div class="announcement-card" style="padding: 16px; background: var(--bg-hover); border-radius: var(--radius-md); border: 1px solid var(--border-main);">
                  <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                    <span class="badge badge-primary" style="font-size: 0.7rem;">${ann.tag || 'Notice'}</span>
                    <span class="announcement-date" style="font-size: 0.75rem; color: var(--text-muted);">${ann.date || 'Today'}</span>
                  </div>
                  <div class="announcement-title" style="font-weight: 700; color: var(--text-main); font-size: 0.95rem; margin-bottom: 4px;">${ann.title}</div>
                  <div class="announcement-desc" style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${ann.content || ann.description || ''}</div>
                </div>
              `).join('')}
            </div>
          `;
        }
      }
    } catch (e) {
      console.error('Error rendering employee dashboard:', e);
    }
  }
};

window.EmployeeDashboardView = EmployeeDashboardView;
