/**
 * DIALLO HRMS — COMPLETE 360° EMPLOYEE SELF-SERVICE (ESS) PORTAL (PHASE 11)
 * Personal Dashboard, Profile Governance, Document Dossier, HR Helpdesk Requests, Payslips, Assets, and Timecard
 */

const ESSView = {
  activeTab: 'profile', // Default to clean profile dossier view
  punchTimerInterval: null,
  workSeconds: 0,
  isPunchedIn: false,
  isOnBreak: false,
  breakSeconds: 0,
  breakTimerInterval: null,
  totalBreakSeconds: 0,

  async renderHub() {
    return this.render();
  },

  async render() {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const userDisplayName = AuthGuard.userProfile?.displayName || AuthGuard.currentUser?.email?.split('@')[0] || 'Employee';

    const empDoc = await employeeService.getEmployee(employeeId);

    const employee = empDoc || {
      fullName: userDisplayName,
      employeeCode: AuthGuard.userProfile?.employeeCode || 'EMP-001',
      department: AuthGuard.userProfile?.department || 'Technology',
      designation: AuthGuard.userProfile?.designation || 'Software Engineer',
      phone: AuthGuard.userProfile?.phone || '+91 98765 43210',
      workEmail: AuthGuard.currentUser?.email || 'employee@diallo.in',
      personalEmail: AuthGuard.userProfile?.personalEmail || 'personal@diallo.in',
      dateOfJoining: AuthGuard.userProfile?.dateOfJoining || '2025-01-15',
      bankName: AuthGuard.userProfile?.bankName || 'HDFC Bank Ltd',
      accountNumber: AuthGuard.userProfile?.accountNumber || '••••••••4892',
      ifscCode: AuthGuard.userProfile?.ifscCode || 'HDFC0001234',
      panNumber: AuthGuard.userProfile?.panNumber || 'ABCDE1234F',
      uanNumber: AuthGuard.userProfile?.uanNumber || '101234567890',
      emergencyContact: AuthGuard.userProfile?.emergencyContact || 'Family (+91 99887 76655)',
      address: AuthGuard.userProfile?.address || 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
      branchName: AuthGuard.userProfile?.branchName || 'HQ - Mumbai'
    };

    const initials = (employee.fullName || userDisplayName).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EM';

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">My Profile</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">My Profile & Personal Dossier</h1>
            <p class="page-subtitle">Personal records, verified contact details, employment data and statutory accounts</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="ESSView.openNewRequestModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>+ Submit HR Request</span>
            </button>
            <button class="btn btn-primary btn-sm" onclick="ESSView.openEditPersonalModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
              <span>Edit Personal Info</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Profile Header Summary Banner -->
      <div class="card animate-fade-in" style="margin-bottom: 24px; padding: 24px;">
        <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 20px;">
          <div class="flex items-center gap-4">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-dark, #1d4ed8)); color: #fff; font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
              ${initials}
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--text-main); margin: 0;">${employee.fullName || employee.name}</h2>
                <span class="badge badge-success"><span class="badge-dot"></span> Active</span>
              </div>
              <div class="flex items-center gap-3" style="margin-top: 4px; font-size: 0.88rem; color: var(--text-secondary); flex-wrap: wrap;">
                <span>${employee.designation || 'Staff'}</span>
                <span>•</span>
                <span>${employee.department || 'General'}</span>
                <span>•</span>
                <span style="font-family: monospace; font-weight: 600; color: var(--primary);">${employee.employeeCode || 'EMP-001'}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-neutral" style="padding: 6px 12px; font-size: 0.8rem;">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin-right: 4px; display: inline-block; vertical-align: middle;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              ${employee.branchName || 'HQ - Mumbai'}
            </span>
            <span class="badge badge-neutral" style="padding: 6px 12px; font-size: 0.8rem;">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin-right: 4px; display: inline-block; vertical-align: middle;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Joined: ${employee.dateOfJoining || employee.joiningDate || 'Jan 2025'}
            </span>
          </div>
        </div>
      </div>

      <!-- Dossier Information Grid -->
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px;">
        <!-- Card 1: Personal & Contact Information -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Personal & Contact Details</div>
              <div class="card-subtitle">Direct self-service editable contact records</div>
            </div>
            <button class="btn btn-soft btn-sm" onclick="ESSView.openEditPersonalModal()">Edit Info</button>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3" style="font-size: 0.85rem;">
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Full Legal Name:</span>
                <strong class="text-main">${employee.fullName || employee.name}</strong>
              </div>
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Personal Phone:</span>
                <strong class="text-main">${employee.phone || '-'}</strong>
              </div>
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Personal Email:</span>
                <strong class="text-main">${employee.personalEmail || '-'}</strong>
              </div>
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Emergency Contact:</span>
                <strong class="text-main">${employee.emergencyContact || '-'}</strong>
              </div>
              <div class="flex justify-between items-start py-1">
                <span class="text-muted">Residential Address:</span>
                <strong class="text-main" style="max-width: 260px; text-align: right; line-height: 1.4;">${employee.address || '-'}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Official Employment & Organization -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Official Employment & Organization</div>
              <div class="card-subtitle">Managed by HR Operations (Requires Approval to Modify)</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="ESSView.openNewRequestModal('PROFILE_CHANGE')">Request Correction</button>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3" style="font-size: 0.85rem;">
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Employee Code:</span>
                <strong style="font-family: monospace; color: var(--primary);">${employee.employeeCode || 'EMP-001'}</strong>
              </div>
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Department:</span>
                <strong class="text-main">${employee.department || 'Technology'}</strong>
              </div>
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Designation / Role:</span>
                <strong class="text-main">${employee.designation || 'Software Engineer'}</strong>
              </div>
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Work Email:</span>
                <strong class="text-main">${employee.workEmail || AuthGuard.currentUser?.email || '-'}</strong>
              </div>
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Branch / Location:</span>
                <strong class="text-main">${employee.branchName || 'HQ - Mumbai'}</strong>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="text-muted">Employment Status:</span>
                <span class="badge badge-success"><span class="badge-dot"></span> ${employee.employmentStatus || 'ACTIVE'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3: Bank & Salary Account -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Bank & Salary Account</div>
              <div class="card-subtitle">Disbursement details for payroll direct deposit</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="ESSView.openNewRequestModal('BANK_DETAILS_CHANGE')">Update Bank Info</button>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3" style="font-size: 0.85rem;">
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Bank Name:</span>
                <strong class="text-main">${employee.bankName || 'HDFC Bank Ltd'}</strong>
              </div>
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Account Number:</span>
                <strong class="text-main" style="font-family: monospace;">${employee.accountNumber || '••••••••4892'}</strong>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="text-muted">IFSC Code:</span>
                <strong class="text-main" style="font-family: monospace;">${employee.ifscCode || 'HDFC0001234'}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 4: Statutory Identity & Compliance -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Statutory & Tax Identity</div>
              <div class="card-subtitle">Official tax and retirement accounts</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="ESSView.openNewRequestModal('PROFILE_CHANGE')">Update Identity</button>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3" style="font-size: 0.85rem;">
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Permanent Account Number (PAN):</span>
                <strong class="text-main" style="font-family: monospace;">${employee.panNumber || 'ABCDE1234F'}</strong>
              </div>
              <div class="flex justify-between items-center py-1" style="border-bottom: 1px solid var(--border-light);">
                <span class="text-muted">Universal Account Number (UAN / PF):</span>
                <strong class="text-main" style="font-family: monospace;">${employee.uanNumber || '101234567890'}</strong>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="text-muted">ESIC Insurance Number:</span>
                <strong class="text-main" style="font-family: monospace;">${employee.esicNumber || '31000123450000001'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    Router.mountView('ess');
  },

  renderTab(employee, leaves, myDocs, myRequests, myAssets, myExpenses, notifications) {
    if (this.activeTab === 'profile') return this.renderProfileTab(employee);
    if (this.activeTab === 'documents') return this.renderDocumentsTab(myDocs);
    if (this.activeTab === 'requests') return this.renderRequestsTab(myRequests);
    if (this.activeTab === 'payslips') return this.renderPayslipsTab(employee);
    if (this.activeTab === 'assets') return this.renderAssetsTab(myAssets);
    if (this.activeTab === 'settings') return this.renderSettingsTab(employee);
    return this.renderDashboardTab(employee, leaves, myDocs, myRequests, myAssets, myExpenses, notifications);
  },

  // 1. ESS DASHBOARD TAB
  renderDashboardTab(employee, leaves, myDocs, myRequests, myAssets, myExpenses, notifications) {
    const unreadNotifications = notifications.filter(n => !n.read);

    return `
      <!-- Top Geolocation Punch & Live Timer Banner -->
      <div class="card" style="margin-bottom: 24px; border: 1px solid var(--border-main);">
        <div class="card-header">
          <div>
            <div class="card-title">Live Geolocation Web Punch Terminal</div>
            <div class="card-subtitle">Authenticated as <strong>${employee.fullName || employee.name}</strong> • ${employee.branchName || 'HQ - Mumbai'}</div>
          </div>
          <span class="badge ${this.isPunchedIn ? 'badge-success' : 'badge-neutral'}" id="ess-live-badge">
            <span class="badge-dot"></span> ${this.isPunchedIn ? 'On Shift (Active)' : 'Checked Out'}
          </span>
        </div>
        <div class="card-body">
          <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 20px;">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Today's Shift Duration</div>
              <div style="font-size: 2.2rem; font-weight: 800; font-family: monospace; color: var(--primary);" id="ess-timer-display">
                00:00:00
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;" id="ess-geo-status">
                Location: HQ - Mumbai (BKC, Mumbai 400051)
              </div>
              <div style="font-size: 0.8rem; margin-top: 6px; display: flex; gap: 16px; align-items: center;">
                <span style="color: var(--text-muted);">Break: <strong style="font-family: monospace; color: ${this.isOnBreak ? 'var(--warning)' : 'var(--text-secondary)'};" id="ess-break-display">00:00</strong></span>
                <span style="color: var(--text-muted);">Total Break: <strong style="font-family: monospace;" id="ess-total-break-display">${Math.floor(this.totalBreakSeconds / 60)}m</strong></span>
              </div>
            </div>

            <div class="flex items-center gap-3" style="flex-wrap: wrap;">
              <button class="btn btn-primary btn-lg" id="ess-punch-btn" onclick="ESSView.togglePunch()">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>${this.isPunchedIn ? 'Punch Out' : 'Web Punch In (GPS)'}</span>
              </button>
              ${this.isPunchedIn ? `
              <button class="btn ${this.isOnBreak ? 'btn-warning' : 'btn-secondary'} btn-lg" id="ess-break-btn" onclick="ESSView.toggleBreak()">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${this.isOnBreak ? 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z'}"/>
                </svg>
                <span>${this.isOnBreak ? 'End Break' : 'Start Break'}</span>
              </button>
              ` : ''}
              <button class="btn btn-secondary btn-lg" onclick="Forms.openApplyLeaveModal()">
                <span>Apply Time-Off</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick 4 KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" onclick="Router.navigate('leave')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Balance</span>
          </div>
          <div class="kpi-value">${(leaves.PL || leaves.AL)?.available ?? 18}</div>
          <div class="kpi-label">Privilege Leave (PL)</div>
          <div class="kpi-subtitle">Casual Leave: ${leaves.CL?.available ?? 12} Days Available</div>
        </div>

        <div class="kpi-card" onclick="ESSView.switchTab('payslips')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Ready</span>
          </div>
          <div class="kpi-value">Available</div>
          <div class="kpi-label">Latest Payslip</div>
          <div class="kpi-subtitle">Direct Deposit Verified</div>
        </div>

        <div class="kpi-card" onclick="ESSView.switchTab('assets')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Custody</span>
          </div>
          <div class="kpi-value">${myAssets.length}</div>
          <div class="kpi-label">Assigned Devices</div>
          <div class="kpi-subtitle">Hardware Custodian</div>
        </div>

        <div class="kpi-card" onclick="ESSView.switchTab('requests')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Queue</span>
          </div>
          <div class="kpi-value">${myRequests.filter(r => r.status === 'SUBMITTED').length}</div>
          <div class="kpi-label">Active HR Requests</div>
          <div class="kpi-subtitle">Helpdesk & Certificates</div>
        </div>
      </div>

      <!-- Notifications & Activity Feed -->
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="card">
          <div class="card-header">
            <div class="card-title">My Notifications (${unreadNotifications.length} Unread)</div>
            ${unreadNotifications.length > 0 ? `<button class="btn btn-soft btn-sm" onclick="ESSView.markAllNotificationsRead()">Mark All Read</button>` : ''}
          </div>
          <div class="card-body" style="padding: 0;">
            ${notifications.length === 0 ? `
              <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No new notifications.</div>
            ` : `
              <div class="flex flex-col">
                ${notifications.slice(0, 5).map(n => `
                  <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-light); ${n.read ? 'opacity: 0.7;' : 'background: rgba(37, 99, 235, 0.04);'}">
                    <div class="flex justify-between items-center" style="margin-bottom: 4px;">
                      <strong class="font-semibold text-main" style="font-size: 0.85rem;">${n.title}</strong>
                      <span class="text-muted" style="font-size: 0.75rem;">${n.createdAt ? new Date(n.createdAt.seconds ? n.createdAt.seconds * 1000 : n.createdAt).toLocaleDateString() : 'Recent'}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${n.message}</div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Quick Self-Service Shortcuts</div>
          </div>
          <div class="card-body">
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
              <button class="btn btn-soft" style="padding: 14px; text-align: left; display: block;" onclick="Forms.openApplyLeaveModal()">
                <div style="font-weight: 700; font-size: 0.9rem;">Apply Leave</div>
                <div class="text-muted" style="font-size: 0.75rem;">Submit time-off request</div>
              </button>
              <button class="btn btn-soft" style="padding: 14px; text-align: left; display: block;" onclick="Router.navigate('expenses')">
                <div style="font-weight: 700; font-size: 0.9rem;">Claim Expense</div>
                <div class="text-muted" style="font-size: 0.75rem;">Submit reimbursement</div>
              </button>
              <button class="btn btn-soft" style="padding: 14px; text-align: left; display: block;" onclick="ESSView.openNewRequestModal('EMPLOYMENT_CERTIFICATE')">
                <div style="font-weight: 700; font-size: 0.9rem;">Request Certificate</div>
                <div class="text-muted" style="font-size: 0.75rem;">Salary / Employment Letter</div>
              </button>
              <button class="btn btn-soft" style="padding: 14px; text-align: left; display: block;" onclick="ESSView.openUploadDocModal()">
                <div style="font-weight: 700; font-size: 0.9rem;">Upload Document</div>
                <div class="text-muted" style="font-size: 0.75rem;">Add PAN / Degree / Cert</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 2. MY PROFILE TAB
  renderProfileTab(emp) {
    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Editable Personal Information -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Personal & Contact Details</div>
              <div class="card-subtitle">Self-service editable fields</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="ESSView.openEditPersonalModal()">Edit Personal Info</button>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3" style="font-size: 0.85rem;">
              <div class="flex justify-between"><span>Full Legal Name:</span><strong class="text-main">${emp.fullName || emp.name}</strong></div>
              <div class="flex justify-between"><span>Work / Primary Email:</span><strong class="text-main">${emp.workEmail || AuthGuard.currentUser?.email || '-'}</strong></div>
              <div class="flex justify-between"><span>Personal Phone:</span><strong>${emp.phone || '-'}</strong></div>
              <div class="flex justify-between"><span>Personal Email:</span><strong>${emp.personalEmail || '-'}</strong></div>
              <div class="flex justify-between"><span>Emergency Contact:</span><strong>${emp.emergencyContact || '-'}</strong></div>
              <div class="flex justify-between"><span>Residential Address:</span><strong style="max-width: 250px; text-align: right;">${emp.address || '-'}</strong></div>
            </div>
          </div>
        </div>

        <!-- Restricted Organization Details -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Official Employment & Organization</div>
              <div class="card-subtitle">Managed by HR Operations (Requires Approval to Modify)</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="ESSView.openNewRequestModal('PROFILE_CHANGE')">Request Correction</button>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3" style="font-size: 0.85rem;">
              <div class="flex justify-between"><span>Employee Code:</span><strong style="font-family: monospace; color: var(--primary);">${emp.employeeCode || 'EMP-001'}</strong></div>
              <div class="flex justify-between"><span>Department:</span><strong>${emp.department || 'General'}</strong></div>
              <div class="flex justify-between"><span>Designation:</span><strong>${emp.designation || 'Staff'}</strong></div>
              <div class="flex justify-between"><span>Branch Location:</span><strong>${emp.branchName || 'HQ - Mumbai'}</strong></div>
              <div class="flex justify-between"><span>Date of Joining:</span><strong>${emp.dateOfJoining || emp.joiningDate || '-'}</strong></div>
              <div class="flex justify-between"><span>Employment Status:</span><span class="badge badge-success">${emp.employmentStatus || 'ACTIVE'}</span></div>
            </div>
          </div>
        </div>

        <!-- Bank & Statutory Details -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Bank & Salary Account</div>
              <div class="card-subtitle">Disbursement details for payroll direct deposit</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="ESSView.openNewRequestModal('BANK_DETAILS_CHANGE')">Update Bank Info</button>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3" style="font-size: 0.85rem;">
              <div class="flex justify-between"><span>Bank Name:</span><strong>${emp.bankName || 'HDFC Bank Ltd'}</strong></div>
              <div class="flex justify-between"><span>Account Number:</span><strong>${emp.accountNumber || '••••••••4892'}</strong></div>
              <div class="flex justify-between"><span>IFSC Code:</span><strong>${emp.ifscCode || 'HDFC0001234'}</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 3. MY DOCUMENTS TAB
  renderDocumentsTab(docs) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">My Personal Document Dossier (${docs.length})</div>
            <div class="card-subtitle">Verified contracts, statutory identity proofs, and credentials</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ESSView.openUploadDocModal()">+ Upload Document</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${docs.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Documents Uploaded</div>
              <div class="empty-state-desc">You have not uploaded any documents to your dossier yet.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Category</th>
                  <th>Uploaded Date</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${docs.map(d => `
                  <tr>
                    <td>
                      <div class="font-semibold text-main">${d.name}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${d.fileType || 'PDF'} • ${d.fileSize || '1 MB'}</div>
                    </td>
                    <td><span class="badge badge-neutral">${d.categoryCode}</span></td>
                    <td>${d.uploadedAt ? new Date(d.uploadedAt.seconds ? d.uploadedAt.seconds * 1000 : d.uploadedAt).toLocaleDateString() : 'Recent'}</td>
                    <td>${d.expiryDate || '<span class="text-muted">None</span>'}</td>
                    <td><span class="badge badge-success">${d.status || 'ACTIVE'}</span></td>
                    <td>
                      <a href="${d.downloadUrl}" target="_blank" class="btn btn-soft btn-sm">Download</a>
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

  // 4. MY REQUESTS TAB
  renderRequestsTab(requests) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">My Submitted HR Requests (${requests.length})</div>
            <div class="card-subtitle">Track profile change requests, certificate requests, and helpdesk tickets</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ESSView.openNewRequestModal()">+ Submit New Request</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${requests.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Active Requests</div>
              <div class="empty-state-desc">You have no open tickets or certificate requests with HR.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Request Type</th>
                  <th>Title & Details</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>HR Notes</th>
                </tr>
              </thead>
              <tbody>
                ${requests.map(r => `
                  <tr>
                    <td><span class="badge badge-neutral">${r.requestTypeName}</span></td>
                    <td>
                      <div class="font-semibold text-main">${r.title}</div>
                      ${r.requestedValue ? `<div style="font-size: 0.75rem; color: var(--primary);">Change: ${r.requestedValue}</div>` : ''}
                    </td>
                    <td>${r.createdAt ? new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleDateString() : 'Recent'}</td>
                    <td>
                      <span class="badge ${r.status === 'COMPLETED' ? 'badge-success' : (r.status === 'SUBMITTED' ? 'badge-warning' : 'badge-danger')}">
                        ${r.status}
                      </span>
                    </td>
                    <td><span class="text-muted" style="font-size: 0.85rem;">${r.resolutionNotes || r.rejectionReason || 'In review by HR'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  // 5. MY PAYSLIPS TAB
  renderPayslipsTab(emp) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">My Official Payslips & Tax Statements</div>
            <div class="card-subtitle">Monthly earnings, deductions, and statutory compliance</div>
          </div>
        </div>
        <div class="card-body">
          <div class="card" style="padding: 20px; background: var(--bg-hover); margin-bottom: 20px;">
            <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 16px;">
              <div>
                <h3 style="font-size: 1.1rem; font-weight: 800; margin: 0 0 4px 0;">Latest Payslip — August 2026</h3>
                <div class="text-muted" style="font-size: 0.85rem;">Direct Deposit to ${emp.bankName || 'HDFC Bank'} • Paid on 31 Aug 2026</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="Router.navigate('payroll')">
                Download Full PDF Payslip
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 6. MY ASSETS TAB
  renderAssetsTab(assets) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Assigned Hardware & Equipment (${assets.length})</div>
            <div class="card-subtitle">Devices and access cards currently assigned in your custody</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${assets.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Devices Assigned</div>
              <div class="empty-state-desc">You do not have any company hardware assigned to your account.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Device Name</th>
                  <th>Serial Number</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${assets.map(a => `
                  <tr>
                    <td><strong style="font-family: monospace; color: var(--primary);">${a.assetTag}</strong></td>
                    <td>
                      <div class="font-semibold text-main">${a.name}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${a.brand || ''} ${a.model || ''}</div>
                    </td>
                    <td><code style="font-size: 0.8rem;">${a.serialNumber}</code></td>
                    <td><span class="badge badge-success">${a.condition || 'GOOD'}</span></td>
                    <td><span class="badge badge-primary">IN_CUSTODY</span></td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="ESSView.openReportDamageModal('${a.id}', '${a.assetTag}')">
                        Report Issue
                      </button>
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

  // 7. SETTINGS TAB
  renderSettingsTab(emp) {
    return `
      <div class="card" style="max-width: 600px;">
        <div class="card-header">
          <div class="card-title">Account Security & Settings</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Work Email (Account Login)</label>
            <input type="text" class="form-control" value="${AuthGuard.currentUser?.email}" disabled />
          </div>
          <div class="form-group">
            <label class="form-label">Theme Mode</label>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" onclick="ThemeManager.setTheme('light')">Light Mode</button>
              <button class="btn btn-secondary btn-sm" onclick="ThemeManager.setTheme('dark')">Dark Mode</button>
            </div>
          </div>
          <hr style="border: none; border-top: 1px solid var(--border-light); margin: 20px 0;" />
          <button class="btn btn-danger btn-sm" onclick="AuthGuard.signOut()">Sign Out of Session</button>
        </div>
      </div>
    `;
  },

  // MODAL 1: SUBMIT NEW HR REQUEST
  openNewRequestModal(preType = 'GENERAL_HR_QUERY') {
    ModalManager.openModal({
      id: 'ess-new-req-modal',
      title: 'Submit HR Request',
      subtitle: 'Request document certificates, address changes, or helpdesk queries',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Request Type</label>
          <select id="ess-req-type" class="form-control" onchange="ESSView.onReqTypeChange(this.value)">
            ${employeeRequestService.REQUEST_TYPES.map(t => `<option value="${t.code}" ${t.code === preType ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Subject / Title</label>
          <input type="text" id="ess-req-title" class="form-control" placeholder="e.g. Request for Employment Letter for Visa Application" required />
        </div>

        <div class="form-group" id="ess-req-val-group" style="display: none;">
          <label class="form-label required">Requested New Value</label>
          <input type="text" id="ess-req-val" class="form-control" placeholder="e.g. New Address / New Phone Number" />
        </div>

        <div class="form-group">
          <label class="form-label required">Details & Reason</label>
          <textarea id="ess-req-desc" class="form-control" rows="3" placeholder="Provide background context or specific requirements..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ESSView.saveNewRequest()">Submit Request</button>
      `
    });

    this.onReqTypeChange(preType);
  },

  onReqTypeChange(type) {
    const valGroup = document.getElementById('ess-req-val-group');
    if (valGroup) {
      valGroup.style.display = (type === 'PROFILE_CHANGE' || type === 'ADDRESS_CHANGE' || type === 'BANK_DETAILS_CHANGE') ? 'block' : 'none';
    }
  },

  async saveNewRequest() {
    const requestType = document.getElementById('ess-req-type')?.value;
    const title = document.getElementById('ess-req-title')?.value.trim();
    const requestedValue = document.getElementById('ess-req-val')?.value.trim();
    const description = document.getElementById('ess-req-desc')?.value.trim();

    if (!title || !description) {
      Toast.warning('Please provide a title and detailed reason.');
      return;
    }

    try {
      await employeeRequestService.createRequest({ requestType, title, requestedValue, description });
      Toast.success('HR Request submitted successfully!');
      ModalManager.closeModal();
      this.switchTab('requests');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  // MODAL 2: UPLOAD DOCUMENT
  openUploadDocModal() {
    ModalManager.openModal({
      id: 'ess-upload-doc-modal',
      title: 'Upload Document to Dossier',
      subtitle: 'Attach personal certificates, identity proofs, or credentials',
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Document Title</label>
            <input type="text" id="ess-doc-name" class="form-control" placeholder="e.g. Degree Certificate" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Category</label>
            <select id="ess-doc-cat" class="form-control">
              ${documentService.DOCUMENT_CATEGORIES.map(c => `<option value="${c.code}">${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Attach File (PDF, JPG, PNG)</label>
          <input type="file" id="ess-doc-file" class="form-control" accept="image/*,.pdf" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ESSView.saveUploadedDoc()">Upload Document</button>
      `
    });
  },

  async saveUploadedDoc() {
    const name = document.getElementById('ess-doc-name')?.value.trim();
    const categoryCode = document.getElementById('ess-doc-cat')?.value;
    const fileInput = document.getElementById('ess-doc-file');

    if (!name || !fileInput?.files?.length) {
      Toast.warning('Please provide a document title and file.');
      return;
    }

    const file = fileInput.files[0];

    try {
      Toast.info('Uploading file securely to Hostinger Storage...');
      let downloadUrl = '#';
      try {
        const uploadRecord = await hostingerStorageService.uploadFile(file, {
          category: categoryCode,
          employeeId: AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid
        });
        downloadUrl = uploadRecord.fileUrl;
      } catch (err) {
        downloadUrl = `https://storage.diallo.com/documents/${file.name}`;
      }

      await documentService.uploadDocument({
        name,
        categoryCode,
        downloadUrl,
        fileType: file.name.split('.').pop().toUpperCase(),
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'ACTIVE'
      });

      Toast.success('Document uploaded to your personal dossier!');
      ModalManager.closeModal();
      this.switchTab('documents');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  // MODAL 3: EDIT PERSONAL INFO
  async openEditPersonalModal() {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const emp = await employeeService.getEmployee(employeeId) || {};
    const defaultName = emp.fullName || emp.name || AuthGuard.userProfile?.displayName || '';
    const defaultWorkEmail = emp.workEmail || AuthGuard.currentUser?.email || '';

    ModalManager.openModal({
      id: 'ess-edit-personal-modal',
      title: 'Edit Personal & Profile Information',
      subtitle: 'Update your display name, contact email, phone number, and address',
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Full Legal / Display Name</label>
            <input type="text" id="edit-fullname" class="form-control" value="${defaultName}" placeholder="e.g. Omkar Tapshale" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label">Work / Primary Email</label>
            <input type="email" id="edit-wemail" class="form-control" value="${defaultWorkEmail}" placeholder="e.g. user@company.com" />
          </div>
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Personal Phone Number</label>
            <input type="text" id="edit-phone" class="form-control" value="${emp.phone || ''}" placeholder="+91 98765 43210" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label">Personal Email</label>
            <input type="email" id="edit-pemail" class="form-control" value="${emp.personalEmail || ''}" placeholder="e.g. personal@gmail.com" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Emergency Contact Name & Phone</label>
          <input type="text" id="edit-econtact" class="form-control" value="${emp.emergencyContact || ''}" placeholder="e.g. Parent / Spouse (+91 98765 00000)" />
        </div>
        <div class="form-group">
          <label class="form-label">Residential Address</label>
          <textarea id="edit-addr" class="form-control" rows="2" placeholder="Full postal residential address...">${emp.address || ''}</textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ESSView.savePersonalUpdates()">Save Changes</button>
      `
    });
  },

  async savePersonalUpdates() {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const userId = AuthGuard.currentUser?.uid;
    const fullName = document.getElementById('edit-fullname')?.value.trim();
    const workEmail = document.getElementById('edit-wemail')?.value.trim();
    const phone = document.getElementById('edit-phone')?.value.trim();
    const personalEmail = document.getElementById('edit-pemail')?.value.trim();
    const emergencyContact = document.getElementById('edit-econtact')?.value.trim();
    const address = document.getElementById('edit-addr')?.value.trim();

    if (!fullName) {
      Toast.error('Please enter your Full Legal Name.');
      return;
    }

    try {
      // 1. Update Employee Record in Firestore
      await employeeService.updateEmployee(employeeId, {
        fullName,
        name: fullName,
        workEmail: workEmail || AuthGuard.currentUser?.email || '',
        phone,
        personalEmail,
        emergencyContact,
        address
      });

      // 2. Update Firebase Auth Profile Display Name
      if (typeof auth !== 'undefined' && auth.currentUser) {
        try {
          await auth.currentUser.updateProfile({ displayName: fullName });
        } catch (authErr) {
          console.warn('Auth display name update warning:', authErr);
        }
      }

      // 3. Update Firestore Users document
      if (userId && typeof db !== 'undefined') {
        try {
          await db.collection('users').doc(userId).set({
            displayName: fullName,
            fullName,
            name: fullName,
            personalEmail: personalEmail || '',
            workEmail: workEmail || AuthGuard.currentUser?.email || '',
            phone: phone || ''
          }, { merge: true });
        } catch (dbErr) {
          console.warn('Users collection update warning:', dbErr);
        }
      }

      // 4. Update in-memory userProfile and sync header profile
      if (AuthGuard.userProfile) {
        AuthGuard.userProfile.displayName = fullName;
        AuthGuard.userProfile.fullName = fullName;
        AuthGuard.userProfile.name = fullName;
        AuthGuard.userProfile.personalEmail = personalEmail;
        if (workEmail) AuthGuard.userProfile.workEmail = workEmail;
      }
      AuthGuard.syncHeaderProfile();

      Toast.success('Profile and personal information updated successfully!');
      ModalManager.closeModal();
      this.switchTab('profile');
    } catch (e) {
      console.error('Error saving personal updates:', e);
      Toast.error(e.message || 'Failed to save changes.');
    }
  },

  openReportDamageModal(assetId, assetTag) {
    ModalManager.openModal({
      id: 'ess-damage-modal',
      title: `Report Hardware Issue: ${assetTag}`,
      subtitle: 'Notify IT support of defects, broken screens, or hardware failures',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Issue Description</label>
          <textarea id="ess-dmg-issue" class="form-control" rows="3" placeholder="Describe the physical damage or defect..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-danger btn-sm" onclick="ESSView.confirmReportDamage('${assetId}', '${assetTag}')">Submit Issue</button>
      `
    });
  },

  async confirmReportDamage(assetId, assetTag) {
    const issue = document.getElementById('ess-dmg-issue')?.value.trim();
    if (!issue) return;

    try {
      await assetService.createMaintenanceRecord({ assetId, assetTag, assetName: 'Employee Device', issue });
      Toast.success('Issue reported to IT Support.');
      ModalManager.closeModal();
      this.switchTab('assets');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async markAllNotificationsRead() {
    await notificationService.markAllAsRead();
    Toast.success('All notifications marked as read.');
    Router.mountView('ess');
  },

  // LIVE GPS TIMECARD & BREAK SYSTEM
  getTodayDateKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  initTimecard() {
    this.loadPersistedState();
    if (this.isPunchedIn && !this.isShiftCompletedToday) {
      this.startTimer();
      if (this.isOnBreak) {
        this.startBreakTimer();
      }
    }
  },

  async syncWithFirestore(todayRecord) {
    const today = this.getTodayDateKey();
    this.shiftDate = today;

    if (!todayRecord || !todayRecord.checkIn) {
      // Fresh shift day - no check-in exists in Firestore
      this.isPunchedIn = false;
      this.isOnBreak = false;
      this.isShiftCompletedToday = false;
      this.workSeconds = 0;
      this.totalBreakSeconds = 0;
      this.breakSeconds = 0;
      this.punchInTimestamp = null;
      this.punchOutTimestamp = null;
      this.breakStartTimestamp = null;
      this.stopTimer();
      this.stopBreakTimer();
    } else if (todayRecord.checkOut) {
      // Shift already completed and checked out in Firestore
      this.isPunchedIn = false;
      this.isOnBreak = false;
      this.isShiftCompletedToday = true;
      this.workSeconds = (todayRecord.workedMinutes || 0) * 60;
      this.totalBreakSeconds = (todayRecord.totalBreakSeconds !== undefined && todayRecord.totalBreakSeconds !== null)
        ? Number(todayRecord.totalBreakSeconds)
        : ((todayRecord.totalBreakMinutes || 0) * 60);
      this.breakSeconds = 0;
      this.stopTimer();
      this.stopBreakTimer();
    } else {
      // Currently checked in and shift is active
      this.isPunchedIn = true;
      this.isOnBreak = (todayRecord.status === 'ON_BREAK' || !!todayRecord.isOnBreak);
      this.isShiftCompletedToday = false;
      this.totalBreakSeconds = (todayRecord.totalBreakSeconds !== undefined && todayRecord.totalBreakSeconds !== null)
        ? Number(todayRecord.totalBreakSeconds)
        : ((todayRecord.totalBreakMinutes || 0) * 60);

      if (todayRecord.currentCheckInDateIso || todayRecord.checkInDateIso) {
        const inDate = new Date(todayRecord.currentCheckInDateIso || todayRecord.checkInDateIso);
        this.punchInTimestamp = inDate.getTime();
        const now = Date.now();
        const totalElapsed = Math.floor((now - this.punchInTimestamp) / 1000);
        this.workSeconds = Math.max(0, totalElapsed - this.totalBreakSeconds);
      }

      if (this.isOnBreak) {
        if (todayRecord.lastBreakStartIso) {
          this.breakStartTimestamp = new Date(todayRecord.lastBreakStartIso).getTime();
          this.breakSeconds = Math.max(0, Math.floor((Date.now() - this.breakStartTimestamp) / 1000));
        }
        this.startBreakTimer();
      } else {
        this.startTimer();
      }
    }

    this.savePersistedState();
    this.updateTimecardUI();
  },

  loadPersistedState() {
    try {
      const today = this.getTodayDateKey();
      const raw = localStorage.getItem('diallo_timecard_state');
      if (raw) {
        const state = JSON.parse(raw);
        // If state is from a previous day, auto-reset for the new day's 10:00 AM - 07:00 PM shift
        if (state.shiftDate && state.shiftDate !== today) {
          this.isPunchedIn = false;
          this.isOnBreak = false;
          this.isShiftCompletedToday = false;
          this.workSeconds = 0;
          this.totalBreakSeconds = 0;
          this.breakSeconds = 0;
          this.punchInTimestamp = null;
          this.punchOutTimestamp = null;
          this.breakStartTimestamp = null;
          this.shiftDate = today;
          this.savePersistedState();
          return;
        }

        this.shiftDate = state.shiftDate || today;
        this.isShiftCompletedToday = !!state.isShiftCompletedToday;
        this.isPunchedIn = this.isShiftCompletedToday ? false : !!state.isPunchedIn;
        this.isOnBreak = this.isPunchedIn ? !!state.isOnBreak : false;
        this.workSeconds = state.workSeconds || 0;
        this.totalBreakSeconds = state.totalBreakSeconds || 0;
        this.breakSeconds = this.isOnBreak ? (state.breakSeconds || 0) : 0;
        this.punchInTimestamp = state.punchInTimestamp || null;
        this.punchOutTimestamp = state.punchOutTimestamp || null;
        this.breakStartTimestamp = this.isOnBreak ? (state.breakStartTimestamp || null) : null;

        // If currently punched in, calculate true elapsed time
        if (this.isPunchedIn && this.punchInTimestamp && !this.isShiftCompletedToday) {
          const now = Date.now();
          const totalElapsed = Math.floor((now - this.punchInTimestamp) / 1000);
          
          if (this.isOnBreak && this.breakStartTimestamp) {
            this.breakSeconds = Math.floor((now - this.breakStartTimestamp) / 1000);
          }
          
          this.workSeconds = Math.max(0, totalElapsed - this.totalBreakSeconds - (this.isOnBreak ? this.breakSeconds : 0));
        }
      } else {
        this.shiftDate = today;
        this.isShiftCompletedToday = false;
        this.isPunchedIn = false;
        this.isOnBreak = false;
      }
    } catch (e) {
      console.warn('Could not load timecard state:', e);
    }
  },

  savePersistedState() {
    try {
      const today = this.getTodayDateKey();
      const state = {
        shiftDate: this.shiftDate || today,
        isShiftCompletedToday: !!this.isShiftCompletedToday,
        isPunchedIn: !this.isShiftCompletedToday && !!this.isPunchedIn,
        isOnBreak: !this.isShiftCompletedToday && this.isPunchedIn && !!this.isOnBreak,
        workSeconds: this.workSeconds || 0,
        totalBreakSeconds: this.totalBreakSeconds || 0,
        breakSeconds: (this.isPunchedIn && this.isOnBreak) ? (this.breakSeconds || 0) : 0,
        punchInTimestamp: this.punchInTimestamp || null,
        punchOutTimestamp: this.punchOutTimestamp || null,
        breakStartTimestamp: this.breakStartTimestamp || null
      };
      localStorage.setItem('diallo_timecard_state', JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save timecard state:', e);
    }
  },

  updateTimecardUI() {
    const hrs = String(Math.floor(this.workSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((this.workSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(this.workSeconds % 60).padStart(2, '0');
    const workTimeStr = `${hrs}:${mins}:${secs}`;

    const bMins = String(Math.floor(this.breakSeconds / 60)).padStart(2, '0');
    const bSecs = String(this.breakSeconds % 60).padStart(2, '0');
    const breakTimeStr = `${bMins}:${bSecs}`;
    
    // Accurate break duration format (e.g. 45s, 2m 15s, 15m)
    let totalBreakStr = '0m';
    if (this.totalBreakSeconds > 0) {
      if (this.totalBreakSeconds < 60) {
        totalBreakStr = `${this.totalBreakSeconds}s`;
      } else if (this.totalBreakSeconds < 3600) {
        const m = Math.floor(this.totalBreakSeconds / 60);
        const s = this.totalBreakSeconds % 60;
        totalBreakStr = s > 0 ? `${m}m ${s}s` : `${m}m`;
      } else {
        const h = Math.floor(this.totalBreakSeconds / 3600);
        const m = Math.floor((this.totalBreakSeconds % 3600) / 60);
        totalBreakStr = `${h}h ${m}m`;
      }
    }

    // Work timer displays
    ['ess-timer-display', 'emp-live-timer'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = workTimeStr;
    });

    // Break timer displays
    ['ess-break-display', 'emp-break-timer'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = breakTimeStr;
        el.style.color = (this.isPunchedIn && this.isOnBreak) ? 'var(--warning)' : 'var(--text-secondary)';
      }
    });

    // Total break displays
    ['ess-total-break-display', 'emp-total-break'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = totalBreakStr;
    });

    // Sub-status & Box highlight styling on dashboard
    const subStatusEl = document.getElementById('emp-timer-substatus');
    if (subStatusEl) {
      if (this.isShiftCompletedToday) {
        subStatusEl.textContent = 'Shift Completed for Today • Next shift tomorrow 10:00 AM – 07:00 PM';
        subStatusEl.style.color = 'var(--accent-leave)';
      } else if (!this.isPunchedIn) {
        subStatusEl.textContent = 'Shift Not Started • General Shift 10:00 AM – 07:00 PM';
        subStatusEl.style.color = 'var(--text-secondary)';
      } else if (this.isOnBreak) {
        subStatusEl.textContent = 'Timer Paused for Break';
        subStatusEl.style.color = 'var(--warning)';
      } else {
        subStatusEl.textContent = 'Active On Duty';
        subStatusEl.style.color = 'var(--primary)';
      }
    }

    const breakBadgeEl = document.getElementById('emp-break-badge-status');
    if (breakBadgeEl) {
      breakBadgeEl.className = (this.isPunchedIn && this.isOnBreak) ? 'badge badge-warning' : 'badge badge-neutral';
      breakBadgeEl.textContent = this.isShiftCompletedToday ? 'Shift Ended' : ((this.isPunchedIn && this.isOnBreak) ? 'Break in progress' : 'Break Idle');
    }

    const headerBreakBadge = document.getElementById('emp-header-break-badge');
    if (headerBreakBadge) {
      headerBreakBadge.innerHTML = (this.isPunchedIn && this.isOnBreak) ? '<span class="badge badge-warning" style="font-size: 0.75rem; animation: pulse 2s infinite; display: inline-flex; align-items: center; gap: 4px;"><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Break Active</span>' : '';
    }

    const breakBox = document.getElementById('emp-break-highlight-box');
    if (breakBox) {
      breakBox.style.background = (this.isPunchedIn && this.isOnBreak) ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-hover)';
      breakBox.style.borderColor = (this.isPunchedIn && this.isOnBreak) ? 'var(--warning)' : 'rgba(245, 158, 11, 0.3)';
    }

    const heroCard = document.getElementById('emp-timecard-hero-card');
    if (heroCard) {
      heroCard.style.borderColor = (this.isPunchedIn && this.isOnBreak) ? 'var(--warning)' : 'var(--primary-light)';
      heroCard.style.boxShadow = (this.isPunchedIn && this.isOnBreak) ? '0 0 16px rgba(245, 158, 11, 0.15)' : 'var(--shadow-sm)';
    }

    // Shift status badges
    ['ess-live-badge', 'emp-shift-badge'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (this.isShiftCompletedToday) {
          el.className = 'badge badge-success';
          el.innerHTML = '<span class="badge-dot"></span> Shift Completed (Today)';
        } else if (!this.isPunchedIn) {
          el.className = 'badge badge-neutral';
          el.innerHTML = '<span class="badge-dot"></span> Checked OUT';
        } else if (this.isOnBreak) {
          el.className = 'badge badge-warning';
          el.innerHTML = '<span class="badge-dot"></span> On Break (Paused)';
        } else {
          el.className = 'badge badge-success';
          el.innerHTML = '<span class="badge-dot"></span> On Shift (Active)';
        }
      }
    });

    // Punch buttons
    ['ess-punch-btn', 'emp-punch-btn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (this.isShiftCompletedToday) {
          el.className = 'btn btn-secondary btn-lg disabled';
          el.setAttribute('disabled', 'true');
          el.style.opacity = '0.75';
          el.style.cursor = 'not-allowed';
          el.innerHTML = `
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>Shift Completed Today</span>
          `;
        } else if (this.isPunchedIn) {
          el.className = 'btn btn-primary btn-lg';
          el.removeAttribute('disabled');
          el.style.opacity = '1';
          el.style.cursor = 'pointer';
          el.innerHTML = `
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Punch Out</span>
          `;
        } else {
          el.className = 'btn btn-primary btn-lg';
          el.removeAttribute('disabled');
          el.style.opacity = '1';
          el.style.cursor = 'pointer';
          el.innerHTML = `
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Web Punch In (GPS)</span>
          `;
        }
      }
    });

    // Break buttons
    ['ess-break-btn', 'emp-break-btn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (!this.isPunchedIn || this.isShiftCompletedToday) {
          el.style.display = 'none';
        } else {
          el.style.display = 'inline-flex';
          el.className = this.isOnBreak ? 'btn btn-warning btn-lg' : 'btn btn-secondary btn-lg';
          el.innerHTML = `
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${this.isOnBreak ? 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z'}"/>
            </svg>
            <span>${this.isOnBreak ? 'End Break' : 'Start Break'}</span>
          `;
        }
      }
    });
  },

  async togglePunch() {
    const today = this.getTodayDateKey();
    this.shiftDate = today;

    // Verify against fresh Firestore record
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    try {
      const todayRec = await attendanceService.getTodayRecord(employeeId, today);
      if (!todayRec || !todayRec.checkIn) {
        this.isShiftCompletedToday = false;
        this.isPunchedIn = false;
      } else if (todayRec.checkOut) {
        this.isShiftCompletedToday = true;
        this.isPunchedIn = false;
      } else {
        this.isShiftCompletedToday = false;
        this.isPunchedIn = true;
      }
    } catch (e) {
      console.warn('Could not check Firestore today record:', e);
    }

    if (this.isShiftCompletedToday) {
      Toast.warning('Shift completed for today! Your check-out has already been recorded. Next shift opens tomorrow at 10:00 AM.');
      return false;
    }

    if (!this.isPunchedIn) {
      let locationText = 'HQ - Mumbai (BKC, Mumbai 400051)';
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            locationText = `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            const geoStatus = document.getElementById('ess-geo-status');
            if (geoStatus) geoStatus.textContent = `Location: ${locationText}`;
          },
          () => {}
        );
      }

      this.isPunchedIn = true;
      this.isOnBreak = false;
      this.isShiftCompletedToday = false;
      this.shiftDate = today;
      this.workSeconds = 0;
      this.totalBreakSeconds = 0;
      this.breakSeconds = 0;
      this.punchInTimestamp = Date.now();
      this.punchOutTimestamp = null;
      this.breakStartTimestamp = null;

      this.startTimer();
      this.savePersistedState();
      this.updateTimecardUI();

      try {
        await attendanceService.recordPunch({
          name: AuthGuard.userProfile?.displayName || 'Employee',
          punchType: 'In',
          device: 'ESS Web GPS Terminal',
          status: 'On Time',
          location: locationText
        });
        Toast.success('Checked IN successfully! Daily shift started (10:00 AM – 07:00 PM).');
      } catch (e) {
        console.warn('Punch record warning:', e);
      }
      return true;
    } else {
      // Auto-end break if on break
      let endedBreakSec = 0;
      if (this.isOnBreak) {
        this.isOnBreak = false;
        endedBreakSec = this.breakSeconds || 0;
        this.totalBreakSeconds += endedBreakSec;
        this.breakSeconds = 0;
        this.stopBreakTimer();
      }

      const finalTotalBreakSec = this.totalBreakSeconds;
      this.isPunchedIn = false;
      this.isShiftCompletedToday = true;
      this.punchOutTimestamp = Date.now();
      this.breakStartTimestamp = null;
      this.stopTimer();
      this.savePersistedState();
      this.updateTimecardUI();

      try {
        await attendanceService.recordPunch({
          name: AuthGuard.userProfile?.displayName || 'Employee',
          punchType: 'Out',
          device: 'ESS Web GPS Terminal',
          status: 'Shift Completed',
          totalBreakSeconds: finalTotalBreakSec,
          breakDuration: endedBreakSec,
          totalWorkSeconds: this.workSeconds
        });
        Toast.info('Checked OUT successfully! Today’s shift completed. Check-in locked until tomorrow 10:00 AM.');
      } catch (e) {
        console.warn('Punch record warning:', e);
      }
      return true;
    }
  },

  startTimer() {
    clearInterval(this.punchTimerInterval);
    this.punchTimerInterval = setInterval(() => {
      if (!this.isOnBreak && !this.isShiftCompletedToday) {
        this.workSeconds++;
        this.updateTimecardUI();
      }
    }, 1000);
  },

  stopTimer() {
    clearInterval(this.punchTimerInterval);
  },

  // BREAK PUNCH IN/OUT
  async toggleBreak() {
    if (!this.isPunchedIn || this.isShiftCompletedToday) return;

    if (!this.isOnBreak) {
      // Start break
      this.isOnBreak = true;
      this.breakSeconds = 0;
      this.breakStartTimestamp = Date.now();

      this.startBreakTimer();
      this.savePersistedState();
      this.updateTimecardUI();

      try {
        await attendanceService.recordPunch({
          name: AuthGuard.userProfile?.displayName || 'Employee',
          punchType: 'Break In',
          device: 'ESS Web GPS Terminal',
          status: 'On Break'
        });
        Toast.info('Break started — work timer paused.');
      } catch (e) {
        console.warn('Break punch warning:', e);
      }
    } else {
      // End break
      const endedBreakSec = this.breakSeconds || 0;
      this.isOnBreak = false;
      this.totalBreakSeconds += endedBreakSec;
      this.breakSeconds = 0;
      this.breakStartTimestamp = null;

      this.stopBreakTimer();
      this.savePersistedState();
      this.updateTimecardUI();

      try {
        await attendanceService.recordPunch({
          name: AuthGuard.userProfile?.displayName || 'Employee',
          punchType: 'Break Out',
          device: 'ESS Web GPS Terminal',
          status: 'Back from Break',
          breakDuration: endedBreakSec,
          totalBreakSeconds: this.totalBreakSeconds
        });
        Toast.success('Break ended — work timer resumed!');
      } catch (e) {
        console.warn('Break punch warning:', e);
      }
    }
  },

  startBreakTimer() {
    clearInterval(this.breakTimerInterval);
    this.breakTimerInterval = setInterval(() => {
      if (this.isOnBreak && !this.isShiftCompletedToday) {
        this.breakSeconds++;
        this.updateTimecardUI();
      }
    }, 1000);
  },

  stopBreakTimer() {
    clearInterval(this.breakTimerInterval);
    this.breakSeconds = 0;
    this.updateTimecardUI();
  }
};

// Initialize timecard state on load
if (typeof ESSView !== 'undefined' && ESSView.initTimecard) {
  ESSView.initTimecard();
}

window.ESSView = ESSView;
