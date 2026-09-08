/**
 * DIALLO HRMS — EMPLOYEE REQUESTS GOVERNANCE VIEW (PHASE 11)
 * HR / Admin Workflow Hub for Reviewing Profile Changes, Certificate Requests, and Helpdesk Tickets
 * + Employee Self-Service Helpdesk for Submitting & Tracking Requests
 */

const RequestsView = {
  currentFilters: {
    status: 'All',
    requestType: 'All',
    search: ''
  },

  async render() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployee = role === 'EMPLOYEE';
    const currentEmpId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const currentEmpName = AuthGuard.userProfile?.displayName || 'Employee';

    // Fetch requests: scoped to employee if EMPLOYEE role, or all requests for HR/Admin
    let requests = [];
    try {
      if (isEmployee) {
        requests = await employeeRequestService.getRequests({ employeeId: currentEmpId });
        if (requests.length === 0) {
          const allDocs = await employeeRequestService.getRequests({});
          requests = allDocs.filter(r => r.employeeId === currentEmpId || (r.employeeName && r.employeeName.toLowerCase() === currentEmpName.toLowerCase()));
        }
      } else {
        requests = await employeeRequestService.getRequests({});
      }
    } catch (e) {
      console.warn('Error fetching requests:', e);
      requests = [];
    }

    const pending = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW');
    const completed = requests.filter(r => r.status === 'COMPLETED' || r.status === 'APPROVED');
    const rejected = requests.filter(r => r.status === 'REJECTED');

    let list = requests;
    if (this.currentFilters.status !== 'All') {
      list = list.filter(r => r.status === this.currentFilters.status);
    }
    if (this.currentFilters.requestType !== 'All') {
      list = list.filter(r => r.requestType === this.currentFilters.requestType);
    }
    if (this.currentFilters.search) {
      const s = this.currentFilters.search.toLowerCase();
      list = list.filter(r =>
        (r.employeeName && r.employeeName.toLowerCase().includes(s)) ||
        (r.title && r.title.toLowerCase().includes(s)) ||
        (r.description && r.description.toLowerCase().includes(s)) ||
        (r.requestTypeName && r.requestTypeName.toLowerCase().includes(s))
      );
    }

    if (isEmployee) {
      return this.renderEmployeeView(requests, list, pending, completed, rejected);
    }

    return this.renderAdminView(requests, list, pending, completed, rejected);
  },

  // ==========================================
  // EMPLOYEE VIEW (SELF-SERVICE HELPDESK)
  // ==========================================
  renderEmployeeView(allRequests, list, pending, completed, rejected) {
    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">My HR Requests</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">My HR Requests & Helpdesk Tickets</h1>
            <p class="page-subtitle">Submit and track requests for official certificates, bank/address updates, and HR inquiries</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="RequestsView.openNewRequestModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Raise HR Request
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Action Cards / Common Requests -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 24px;">
        <div class="card" style="padding: 16px; border-top: 3px solid #2563eb; cursor: pointer; transition: all 0.2s;" onclick="RequestsView.openNewRequestModal('EMPLOYMENT_CERTIFICATE')">
          <div style="color: var(--primary); margin-bottom: 8px;">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 4px; color: var(--text-main);">Employment Letter</h4>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 10px;">Verification letter for bank loans, visas & tenancy.</p>
          <span class="btn btn-soft btn-xs" style="width: 100%; text-align: center;">Request Letter &rarr;</span>
        </div>

        <div class="card" style="padding: 16px; border-top: 3px solid #10b981; cursor: pointer; transition: all 0.2s;" onclick="RequestsView.openNewRequestModal('SALARY_CERTIFICATE')">
          <div style="color: var(--success); margin-bottom: 8px;">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 4px; color: var(--text-main);">Salary Certificate</h4>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 10px;">Official earnings & CTC certification for credit/tax.</p>
          <span class="btn btn-soft btn-xs" style="width: 100%; text-align: center;">Request Certificate &rarr;</span>
        </div>

        <div class="card" style="padding: 16px; border-top: 3px solid #8b5cf6; cursor: pointer; transition: all 0.2s;" onclick="RequestsView.openNewRequestModal('BANK_DETAILS_CHANGE')">
          <div style="color: var(--accent-performance); margin-bottom: 8px;">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>
          </div>
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 4px; color: var(--text-main);">Bank Details Update</h4>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 10px;">Update your salary disbursement bank account / IFSC.</p>
          <span class="btn btn-soft btn-xs" style="width: 100%; text-align: center;">Update Bank &rarr;</span>
        </div>

        <div class="card" style="padding: 16px; border-top: 3px solid #f59e0b; cursor: pointer; transition: all 0.2s;" onclick="RequestsView.openNewRequestModal('GENERAL_HR_QUERY')">
          <div style="color: var(--warning); margin-bottom: 8px;">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 4px; color: var(--text-main);">General HR Support</h4>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 10px;">Ask HR questions regarding policies, leave, or benefits.</p>
          <span class="btn btn-soft btn-xs" style="width: 100%; text-align: center;">Ask HR &rarr;</span>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">In Review</span>
          </div>
          <div class="kpi-value">${pending.length}</div>
          <div class="kpi-label">Pending Review</div>
          <div class="kpi-subtitle">Assigned to HR Operations</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Approved</span>
          </div>
          <div class="kpi-value">${completed.length}</div>
          <div class="kpi-label">Completed & Resolved</div>
          <div class="kpi-subtitle">Approved by HR</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--danger-light); color: var(--danger);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Declined</span>
          </div>
          <div class="kpi-value">${rejected.length}</div>
          <div class="kpi-label">Declined / Needs Info</div>
          <div class="kpi-subtitle">Feedback Provided</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">All</span>
          </div>
          <div class="kpi-value">${allRequests.length}</div>
          <div class="kpi-label">Total Requests</div>
          <div class="kpi-subtitle">Lifetime Tickets</div>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="card" style="margin-bottom: 20px; padding: 16px;">
        <div class="flex items-center gap-3" style="flex-wrap: wrap;">
          <div style="flex: 1; min-width: 220px;">
            <input type="text" id="filter-req-search" class="form-control" placeholder="Search my requests..." value="${this.currentFilters.search}" onkeydown="if(event.key==='Enter') RequestsView.applyFilters()" />
          </div>
          <select id="filter-req-type" class="form-control" style="width: 220px;">
            <option value="All">All Request Types</option>
            ${employeeRequestService.REQUEST_TYPES.map(t => `<option value="${t.code}" ${this.currentFilters.requestType === t.code ? 'selected' : ''}>${t.name}</option>`).join('')}
          </select>
          <select id="filter-req-status" class="form-control" style="width: 170px;">
            <option value="All">All Statuses</option>
            <option value="SUBMITTED" ${this.currentFilters.status === 'SUBMITTED' ? 'selected' : ''}>Pending</option>
            <option value="COMPLETED" ${this.currentFilters.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
            <option value="REJECTED" ${this.currentFilters.status === 'REJECTED' ? 'selected' : ''}>Rejected</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="RequestsView.applyFilters()">Filter</button>
          <button class="btn btn-secondary btn-sm" onclick="RequestsView.clearFilters()">Clear</button>
        </div>
      </div>

      <!-- My Requests Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">My Submitted Requests (${list.length})</div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${list.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div style="font-size: 2.5rem; margin-bottom: 12px;">📂</div>
              <div class="empty-state-title">No Requests Found</div>
              <div class="empty-state-desc">You haven't submitted any HR requests yet or none match your filter.</div>
              <button class="btn btn-primary btn-sm" style="margin-top: 14px;" onclick="RequestsView.openNewRequestModal()">+ Submit First Request</button>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Request Type</th>
                  <th>Request Title & Details</th>
                  <th>Submitted On</th>
                  <th>Status</th>
                  <th>HR Resolution / Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(r => `
                  <tr>
                    <td>
                      <span class="badge badge-neutral" style="font-weight: 600;">${r.requestTypeName || r.requestType}</span>
                    </td>
                    <td style="max-width: 320px;">
                      <div class="font-semibold text-main" style="font-size: 0.88rem;">${r.title}</div>
                      ${r.requestedValue ? `
                        <div style="font-size: 0.75rem; color: var(--primary); margin-top: 2px;">
                          <strong>Requested Change:</strong> ${r.requestedValue}
                        </div>
                      ` : ''}
                      ${r.description ? `<div class="text-muted text-truncate" style="font-size: 0.75rem; margin-top: 2px;">${r.description}</div>` : ''}
                    </td>
                    <td>${r.createdAt ? new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}</td>
                    <td>
                      <span class="badge ${r.status === 'COMPLETED' || r.status === 'APPROVED' ? 'badge-success' : (r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW' ? 'badge-warning' : 'badge-danger')}">
                        ${r.status === 'SUBMITTED' ? 'PENDING' : r.status}
                      </span>
                    </td>
                    <td style="max-width: 250px;">
                      ${r.resolutionNotes ? `
                        <div style="font-size: 0.8rem; color: #059669; font-weight: 500;">${r.resolutionNotes}</div>
                      ` : (r.rejectionReason ? `
                        <div style="font-size: 0.8rem; color: #dc2626;">${r.rejectionReason}</div>
                      ` : `<span class="text-muted" style="font-size: 0.78rem;">Awaiting HR review</span>`)}
                    </td>
                    <td>
                      <button class="btn btn-soft btn-sm" onclick="RequestsView.openRequestDetailsModal('${r.id}')">View Details</button>
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

  // ==========================================
  // ADMIN / HR MASTER QUEUE VIEW
  // ==========================================
  renderAdminView(requests, list, pending, completed, rejected) {
    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Employee Requests</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Employee Requests & Helpdesk Queue</h1>
            <p class="page-subtitle">Process employee profile updates, bank detail changes, certificates, and HR inquiries</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="RequestsView.openNewRequestModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Create Request
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Review</span>
          </div>
          <div class="kpi-value">${pending.length}</div>
          <div class="kpi-label">Pending Review</div>
          <div class="kpi-subtitle">Awaiting Action</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Resolved</span>
          </div>
          <div class="kpi-value">${completed.length}</div>
          <div class="kpi-label">Completed</div>
          <div class="kpi-subtitle">Approved & Generated</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--danger-light); color: var(--danger);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Declined</span>
          </div>
          <div class="kpi-value">${rejected.length}</div>
          <div class="kpi-label">Declined / Rejected</div>
          <div class="kpi-subtitle">With Feedback</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Total</span>
          </div>
          <div class="kpi-value">${requests.length}</div>
          <div class="kpi-label">Total Tickets</div>
          <div class="kpi-subtitle">All Lifetime Requests</div>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="card" style="margin-bottom: 20px; padding: 16px;">
        <div class="flex items-center gap-3" style="flex-wrap: wrap;">
          <div style="flex: 1; min-width: 220px;">
            <input type="text" id="filter-req-search" class="form-control" placeholder="Search by Employee Name, Title..." value="${this.currentFilters.search}" onkeydown="if(event.key==='Enter') RequestsView.applyFilters()" />
          </div>
          <select id="filter-req-type" class="form-control" style="width: 220px;">
            <option value="All">All Request Types</option>
            ${employeeRequestService.REQUEST_TYPES.map(t => `<option value="${t.code}" ${this.currentFilters.requestType === t.code ? 'selected' : ''}>${t.name}</option>`).join('')}
          </select>
          <select id="filter-req-status" class="form-control" style="width: 170px;">
            <option value="All">All Statuses</option>
            <option value="SUBMITTED" ${this.currentFilters.status === 'SUBMITTED' ? 'selected' : ''}>Pending</option>
            <option value="COMPLETED" ${this.currentFilters.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
            <option value="REJECTED" ${this.currentFilters.status === 'REJECTED' ? 'selected' : ''}>Rejected</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="RequestsView.applyFilters()">Filter</button>
          <button class="btn btn-secondary btn-sm" onclick="RequestsView.clearFilters()">Clear</button>
        </div>
      </div>

      <!-- Requests Queue Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Employee Requests Master Queue (${list.length})</div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${list.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-title">No Requests Found</div>
              <div class="empty-state-desc">No tickets match the selected filter criteria.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Request Type</th>
                  <th>Request Title & Change</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(r => `
                  <tr>
                    <td>
                      <div class="font-semibold text-main">${r.employeeName}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${r.department || 'Staff'}</div>
                    </td>
                    <td><span class="badge badge-neutral">${r.requestTypeName || r.requestType}</span></td>
                    <td style="max-width: 280px;">
                      <div class="font-semibold text-main" style="font-size: 0.85rem;">${r.title}</div>
                      ${r.requestedValue ? `
                        <div style="font-size: 0.75rem; color: var(--primary);">
                          <strong>Requested Value:</strong> ${r.requestedValue}
                        </div>
                      ` : ''}
                      ${r.description ? `<div class="text-muted text-truncate" style="font-size: 0.75rem;">${r.description}</div>` : ''}
                    </td>
                    <td>${r.createdAt ? new Date(r.createdAt.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleDateString() : 'Recent'}</td>
                    <td>
                      <span class="badge ${r.status === 'COMPLETED' || r.status === 'APPROVED' ? 'badge-success' : (r.status === 'SUBMITTED' ? 'badge-warning' : 'badge-danger')}">
                        ${r.status}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-1">
                        <button class="btn btn-soft btn-sm" onclick="RequestsView.openRequestDetailsModal('${r.id}')">View</button>
                        ${r.status === 'SUBMITTED' ? `
                          <button class="btn btn-primary btn-sm" onclick="RequestsView.openApproveModal('${r.id}', '${r.employeeName}', '${r.requestTypeName}')">Approve</button>
                          <button class="btn btn-danger btn-sm" onclick="RequestsView.openRejectModal('${r.id}')">Reject</button>
                        ` : ''}
                      </div>
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

  // ==========================================
  // MODAL: CREATE / RAISE NEW REQUEST
  // ==========================================
  async openNewRequestModal(preselectedType = 'EMPLOYMENT_CERTIFICATE') {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployee = role === 'EMPLOYEE';

    let employeeSelectHtml = '';
    if (!isEmployee) {
      const employees = await employeeService.getEmployees({});
      employeeSelectHtml = `
        <div class="form-group">
          <label class="form-label required">Select Employee</label>
          <select id="nr-emp" class="form-control" required>
            ${employees.map(e => `<option value="${e.id}" data-name="${e.fullName || e.name}">${e.fullName || e.name} (${e.employeeCode || 'EMP'})</option>`).join('')}
          </select>
        </div>
      `;
    }

    ModalManager.openModal({
      id: 'new-request-modal',
      title: 'Raise New HR Request',
      subtitle: 'Submit official requests for certificates, profile corrections, or general queries',
      contentHtml: `
        ${employeeSelectHtml}

        <div class="form-group">
          <label class="form-label required">Request Type</label>
          <select id="nr-type" class="form-control" onchange="RequestsView.handleTypeChange(this.value)">
            ${employeeRequestService.REQUEST_TYPES.map(t => `<option value="${t.code}" ${t.code === preselectedType ? 'selected' : ''}>${t.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Request Title</label>
          <input type="text" id="nr-title" class="form-control" placeholder="e.g. Request for Employment Verification Letter" required />
        </div>

        <div id="nr-change-fields" style="display: none;">
          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label">Current Value (on record)</label>
              <input type="text" id="nr-current-val" class="form-control" placeholder="e.g. Old Address or Old Account No." />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">New / Requested Value</label>
              <input type="text" id="nr-requested-val" class="form-control" placeholder="e.g. New Address / New Bank IFSC & A/C" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Detailed Reason / Purpose</label>
          <textarea id="nr-desc" class="form-control" rows="3" placeholder="Please specify details (e.g. Required for Bank Home Loan application, urgent processing requested)..." required></textarea>
        </div>

        <div class="card" style="padding: 12px; background: var(--bg-hover); font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--primary); flex-shrink: 0;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>Your request will be dispatched to HR Operations. Average turnaround time is 24-48 business hours.</div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" id="btn-submit-req" onclick="RequestsView.submitNewRequest()">Submit Request</button>
      `
    });

    // Auto-trigger type change to set default title and field visibility
    setTimeout(() => this.handleTypeChange(preselectedType), 50);
  },

  handleTypeChange(typeCode) {
    const titleInput = document.getElementById('nr-title');
    const changeFields = document.getElementById('nr-change-fields');

    const typeObj = employeeRequestService.REQUEST_TYPES.find(t => t.code === typeCode);
    if (titleInput && typeObj) {
      titleInput.value = `Request: ${typeObj.name}`;
    }

    if (changeFields) {
      if (['ADDRESS_CHANGE', 'BANK_DETAILS_CHANGE', 'PROFILE_CHANGE'].includes(typeCode)) {
        changeFields.style.display = 'block';
      } else {
        changeFields.style.display = 'none';
      }
    }
  },

  async submitNewRequest() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployee = role === 'EMPLOYEE';

    let employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    let employeeName = AuthGuard.userProfile?.displayName || 'Employee';

    if (!isEmployee) {
      const empSelect = document.getElementById('nr-emp');
      if (empSelect) {
        employeeId = empSelect.value;
        employeeName = empSelect.selectedOptions[0]?.getAttribute('data-name') || employeeName;
      }
    }

    const requestType = document.getElementById('nr-type')?.value;
    const title = document.getElementById('nr-title')?.value.trim();
    const description = document.getElementById('nr-desc')?.value.trim();
    const currentValue = document.getElementById('nr-current-val')?.value.trim() || '';
    const requestedValue = document.getElementById('nr-requested-val')?.value.trim() || '';

    if (!title || !description) {
      Toast.warning('Please enter a request title and description.');
      return;
    }

    const btn = document.getElementById('btn-submit-req');
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Submitting...';
    }

    try {
      await employeeRequestService.createRequest({
        employeeId,
        employeeName,
        requestType,
        title,
        description,
        currentValue,
        requestedValue
      });

      Toast.success('HR Request submitted successfully!');
      ModalManager.closeModal();
      Router.mountView('requests');
    } catch (err) {
      Toast.error(err.message || 'Failed to submit request');
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Submit Request';
      }
    }
  },

  // ==========================================
  // MODAL: VIEW DETAILS & TIMELINE
  // ==========================================
  async openRequestDetailsModal(requestId) {
    const requests = await employeeRequestService.getRequests({});
    const req = requests.find(r => r.id === requestId);
    if (!req) {
      Toast.error('Request not found.');
      return;
    }

    const timeline = await employeeRequestService.getRequestTimeline(requestId);

    ModalManager.openModal({
      id: 'req-details-modal',
      title: `Request Details: ${req.requestTypeName || req.requestType}`,
      subtitle: `Submitted by ${req.employeeName}`,
      contentHtml: `
        <div class="card" style="padding: 14px; background: var(--bg-hover); margin-bottom: 16px;">
          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
            <div><strong>Employee:</strong> ${req.employeeName}</div>
            <div><strong>Status:</strong> <span class="badge ${req.status === 'COMPLETED' || req.status === 'APPROVED' ? 'badge-success' : (req.status === 'SUBMITTED' ? 'badge-warning' : 'badge-danger')}">${req.status}</span></div>
            <div><strong>Request Type:</strong> ${req.requestTypeName || req.requestType}</div>
            <div><strong>Assigned To:</strong> ${req.assignedTo || 'HR Operations'}</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Employee Note / Reason</label>
          <div class="card" style="padding: 10px; font-size: 0.85rem;">${req.description || 'None provided'}</div>
        </div>

        ${req.requestedValue ? `
          <div class="card" style="padding: 12px; margin-bottom: 16px; border-left: 3px solid var(--primary);">
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Requested Value Change:</div>
            <strong style="font-size: 0.95rem; color: var(--primary);">${req.requestedValue}</strong>
          </div>
        ` : ''}

        ${req.resolutionNotes ? `
          <div class="card" style="padding: 12px; border-left: 3px solid #10b981; margin-bottom: 16px; background: #ecfdf5;">
            <div style="font-size: 0.8rem; color: #065f46; font-weight: 700;">HR Resolution Summary:</div>
            <div style="font-size: 0.85rem; color: #047857; margin-top: 4px;">${req.resolutionNotes}</div>
          </div>
        ` : ''}

        ${req.rejectionReason ? `
          <div class="card" style="padding: 12px; border-left: 3px solid #ef4444; margin-bottom: 16px; background: #fef2f2;">
            <div style="font-size: 0.8rem; color: #991b1b; font-weight: 700;">Decline Reason:</div>
            <div style="font-size: 0.85rem; color: #b91c1c; margin-top: 4px;">${req.rejectionReason}</div>
          </div>
        ` : ''}

        <div style="margin-top: 16px;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--primary); margin-bottom: 10px; font-weight: 700;">Audit History & Timeline</h4>
          <div class="flex flex-col gap-2">
            ${timeline.length > 0 ? timeline.map(t => `
              <div style="padding: 8px 12px; background: var(--bg-surface); border-left: 2px solid var(--primary); font-size: 0.8rem; border-radius: 0 4px 4px 0;">
                <div class="flex justify-between text-muted">
                  <strong>${t.action}</strong>
                  <span>${t.performedBy || 'System'}</span>
                </div>
                <div>${t.comments || ''}</div>
              </div>
            `).join('') : `
              <div style="padding: 8px; font-size: 0.8rem; color: var(--text-muted);">Request logged in central tracking.</div>
            `}
          </div>
        </div>
      `,
      footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close</button>`
    });
  },

  openApproveModal(requestId, empName, typeName) {
    ModalManager.openModal({
      id: 'approve-req-modal',
      title: `Approve & Resolve Request`,
      subtitle: `${typeName} for ${empName}`,
      contentHtml: `
        <div class="form-group">
          <label class="form-label">Resolution Summary / Notes</label>
          <textarea id="app-req-notes" class="form-control" rows="3" placeholder="e.g. Verified and updated official record. Employment certificate generated."></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="RequestsView.confirmApprove('${requestId}')">Approve Request</button>
      `
    });
  },

  async confirmApprove(requestId) {
    const notes = document.getElementById('app-req-notes')?.value.trim();
    try {
      await employeeRequestService.approveRequest(requestId, notes);
      Toast.success('Request approved and resolved successfully!');
      ModalManager.closeModal();
      Router.mountView('requests');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openRejectModal(requestId) {
    ModalManager.openModal({
      id: 'reject-req-modal',
      title: 'Decline Employee Request',
      subtitle: 'Mandatory feedback required for employee audit',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Reason for Rejection</label>
          <textarea id="rej-req-reason" class="form-control" rows="3" placeholder="Explain why the request cannot be approved..."></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-danger btn-sm" onclick="RequestsView.confirmReject('${requestId}')">Confirm Rejection</button>
      `
    });
  },

  async confirmReject(requestId) {
    const reason = document.getElementById('rej-req-reason')?.value.trim();
    if (!reason) {
      Toast.warning('Please enter a reason for rejection.');
      return;
    }

    try {
      await employeeRequestService.rejectRequest(requestId, reason);
      Toast.success('Employee request declined.');
      ModalManager.closeModal();
      Router.mountView('requests');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  applyFilters() {
    this.currentFilters.search = document.getElementById('filter-req-search')?.value.trim() || '';
    this.currentFilters.requestType = document.getElementById('filter-req-type')?.value || 'All';
    this.currentFilters.status = document.getElementById('filter-req-status')?.value || 'All';
    Router.mountView('requests');
  },

  clearFilters() {
    this.currentFilters = { requestType: 'All', status: 'All', search: '' };
    Router.mountView('requests');
  }
};

window.RequestsView = RequestsView;

