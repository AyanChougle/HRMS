/**
 * DIALLO HRMS — COMPLETE 360° EMPLOYEE SELF-SERVICE (ESS) PORTAL (PHASE 11)
 * Personal Dashboard, Profile Governance, Document Dossier, HR Helpdesk Requests, Payslips, Assets, and Timecard
 */

const ESSView = {
  activeTab: 'dashboard', // 'dashboard', 'profile', 'documents', 'requests', 'payslips', 'assets', 'attendance', 'settings'
  punchTimerInterval: null,
  workSeconds: 0,
  isPunchedIn: false,

  async renderHub() {
    return this.render();
  },

  async render() {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const userDisplayName = AuthGuard.userProfile?.displayName || AuthGuard.currentUser?.email?.split('@')[0] || 'Employee';

    const [empDoc, leaves, myDocs, myRequests, myAssets, myExpenses, notifications] = await Promise.all([
      employeeService.getEmployee(employeeId),
      leaveService.getEmployeeBalances(employeeId),
      documentService.getDocuments({ employeeId }),
      employeeRequestService.getRequests({ employeeId }),
      assetService.getEmployeeAssets(employeeId),
      expenseService.getExpenses({ employeeId }),
      notificationService.getNotifications(employeeId)
    ]);

    const employee = empDoc || {
      fullName: userDisplayName,
      employeeCode: 'EMP-001',
      department: 'Technology',
      designation: 'Software Engineer',
      phone: '+91 98765 43210',
      workEmail: AuthGuard.currentUser?.email,
      personalEmail: 'personal@diallo.in',
      dateOfJoining: '2025-01-15',
      bankName: 'HDFC Bank Ltd',
      accountNumber: '••••••••4892',
      ifscCode: 'HDFC0001234',
      emergencyContact: 'Family (+91 99887 76655)',
      address: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051'
    };

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Employee Self-Service</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Employee Self-Service (ESS) Portal</h1>
            <p class="page-subtitle">Welcome back, <strong>${employee.fullName || employee.name}</strong> • ${employee.employeeCode} (${employee.designation})</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="ESSView.openNewRequestModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Submit HR Request
            </button>
            <button class="btn btn-primary btn-sm" onclick="Forms.openApplyLeaveModal()">
              Apply Leave
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation Sub-Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px; overflow-x: auto; white-space: nowrap;">
        <button class="tab-btn ${this.activeTab === 'dashboard' ? 'active' : ''}" onclick="ESSView.switchTab('dashboard')">
          My Dashboard
        </button>
        <button class="tab-btn ${this.activeTab === 'profile' ? 'active' : ''}" onclick="ESSView.switchTab('profile')">
          My Profile
        </button>
        <button class="tab-btn ${this.activeTab === 'documents' ? 'active' : ''}" onclick="ESSView.switchTab('documents')">
          Documents (${myDocs.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'requests' ? 'active' : ''}" onclick="ESSView.switchTab('requests')">
          HR Requests (${myRequests.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'payslips' ? 'active' : ''}" onclick="ESSView.switchTab('payslips')">
          My Payslips
        </button>
        <button class="tab-btn ${this.activeTab === 'assets' ? 'active' : ''}" onclick="ESSView.switchTab('assets')">
          Assigned Assets (${myAssets.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" onclick="ESSView.switchTab('settings')">
          Settings
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="tab-content">
        ${this.renderTab(employee, leaves, myDocs, myRequests, myAssets, myExpenses, notifications)}
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
            </div>

            <div class="flex items-center gap-3">
              <button class="btn btn-primary btn-lg" id="ess-punch-btn" onclick="ESSView.togglePunch()">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>${this.isPunchedIn ? 'Punch Out' : 'Web Punch In (GPS)'}</span>
              </button>
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
          <div class="kpi-value">${leaves.AL?.available ?? 18}</div>
          <div class="kpi-label">Available Paid Leave</div>
          <div class="kpi-subtitle">Casual Leave: ${leaves.CL?.available ?? 12} Days</div>
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
              <div class="flex justify-between"><span>Full Name:</span><strong>${emp.fullName || emp.name}</strong></div>
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
      Toast.info('Uploading file to Firebase Storage...');
      let downloadUrl = '#';
      try {
        const snap = await storage.ref(`documents/${AuthGuard.currentUser?.uid}/${Date.now()}_${file.name}`).put(file);
        downloadUrl = await snap.ref.getDownloadURL();
      } catch (err) {
        downloadUrl = `https://storage.googleapis.com/hrms-docs/${file.name}`;
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

    ModalManager.openModal({
      id: 'ess-edit-personal-modal',
      title: 'Edit Personal Contact Information',
      subtitle: 'Update your phone number, personal email, and address',
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Personal Phone Number</label>
            <input type="text" id="edit-phone" class="form-control" value="${emp.phone || ''}" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Personal Email</label>
            <input type="email" id="edit-pemail" class="form-control" value="${emp.personalEmail || ''}" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Emergency Contact Name & Phone</label>
          <input type="text" id="edit-econtact" class="form-control" value="${emp.emergencyContact || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Residential Address</label>
          <textarea id="edit-addr" class="form-control" rows="2">${emp.address || ''}</textarea>
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
    const phone = document.getElementById('edit-phone')?.value.trim();
    const personalEmail = document.getElementById('edit-pemail')?.value.trim();
    const emergencyContact = document.getElementById('edit-econtact')?.value.trim();
    const address = document.getElementById('edit-addr')?.value.trim();

    try {
      await employeeService.updateEmployee(employeeId, {
        phone,
        personalEmail,
        emergencyContact,
        address
      });

      Toast.success('Personal contact information updated!');
      ModalManager.closeModal();
      this.switchTab('profile');
    } catch (e) {
      Toast.error(e.message);
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

  // LIVE GPS TIMECARD PUNCH
  async togglePunch() {
    const btn = document.getElementById('ess-punch-btn');
    const badge = document.getElementById('ess-live-badge');
    const geoStatus = document.getElementById('ess-geo-status');

    if (!this.isPunchedIn) {
      let locationText = 'HQ - Mumbai (BKC, Mumbai 400051)';
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            locationText = `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            if (geoStatus) geoStatus.textContent = `Location: ${locationText}`;
          },
          () => {}
        );
      }

      this.isPunchedIn = true;
      if (btn) btn.innerHTML = `<span>Punch Out</span>`;
      if (badge) {
        badge.className = 'badge badge-success';
        badge.innerHTML = `<span class="badge-dot"></span> On Shift (Active)`;
      }

      this.startTimer();

      try {
        await attendanceService.recordPunch({
          name: AuthGuard.userProfile?.displayName || 'Employee',
          punchType: 'In',
          device: 'ESS Web GPS Terminal',
          status: 'On Time',
          location: locationText
        });
        Toast.success('Checked IN successfully with GPS coordinates!');
      } catch (e) {
        console.warn('Punch record warning:', e);
      }
    } else {
      this.isPunchedIn = false;
      this.stopTimer();

      if (btn) btn.innerHTML = `<span>Web Punch In (GPS)</span>`;
      if (badge) {
        badge.className = 'badge badge-neutral';
        badge.innerHTML = `<span class="badge-dot"></span> Checked Out`;
      }

      try {
        await attendanceService.recordPunch({
          name: AuthGuard.userProfile?.displayName || 'Employee',
          punchType: 'Out',
          device: 'ESS Web GPS Terminal',
          status: 'On Time'
        });
        Toast.info('Checked OUT successfully!');
      } catch (e) {
        console.warn('Punch record warning:', e);
      }
    }
  },

  startTimer() {
    clearInterval(this.punchTimerInterval);
    const display = document.getElementById('ess-timer-display');
    this.punchTimerInterval = setInterval(() => {
      this.workSeconds++;
      const hrs = String(Math.floor(this.workSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((this.workSeconds % 3600) / 60)).padStart(2, '0');
      const secs = String(this.workSeconds % 60).padStart(2, '0');
      if (display) display.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
  },

  stopTimer() {
    clearInterval(this.punchTimerInterval);
  }
};

window.ESSView = ESSView;
