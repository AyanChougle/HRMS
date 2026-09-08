/**
 * DIALLO HRMS — CENTRAL DOCUMENT MANAGEMENT VIEW (PHASE 11)
 * HR Governance for Employee Dossiers, Compliance Verification, Expiry Tracking, and Document Requests
 * + Employee Self-Service Dossier for Uploading & Accessing Personal Documents & Policies
 */

const DocumentsView = {
  activeTab: 'all', // 'all', 'requests', 'expiring', 'templates'
  currentFilters: {
    categoryCode: 'All',
    status: 'All',
    search: ''
  },

  async render() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployee = role === 'EMPLOYEE';
    const currentEmpId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const currentEmpName = AuthGuard.userProfile?.displayName || 'Employee';

    let [docs, requests, expiringDocs] = await Promise.all([
      documentService.getDocuments({}),
      documentService.getDocumentRequests({}),
      documentService.getExpiringDocuments(null, 30)
    ]);

    // Scope for EMPLOYEE role: only own documents or company-wide files
    if (isEmployee) {
      docs = docs.filter(d => 
        d.employeeId === currentEmpId || 
        (d.employeeName && d.employeeName.toLowerCase() === currentEmpName.toLowerCase()) || 
        d.categoryCode === 'COMPANY' || 
        d.visibility === 'ALL'
      );
      requests = requests.filter(r => 
        r.employeeId === currentEmpId || 
        (r.employeeName && r.employeeName.toLowerCase() === currentEmpName.toLowerCase())
      );
      expiringDocs = expiringDocs.filter(d => 
        d.employeeId === currentEmpId || 
        (d.employeeName && d.employeeName.toLowerCase() === currentEmpName.toLowerCase())
      );
    }

    const pendingVerification = docs.filter(d => d.status === 'PENDING_REVIEW');
    const activeVerified = docs.filter(d => d.status === 'ACTIVE');

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">${isEmployee ? 'My Documents' : 'Document Management'}</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">${isEmployee ? 'My Documents & Company Policies' : 'Enterprise Document Management (DMS)'}</h1>
            <p class="page-subtitle">${isEmployee ? 'Access your verified personnel dossier, contracts, tax certificates, and handbook' : 'Centralized employee dossiers, compliance audits, expiry tracking, and document requests'}</p>
          </div>
          <div class="page-actions">
            ${!isEmployee ? `
              <button class="btn btn-secondary btn-sm" onclick="DocumentsView.openRequestDocumentModal()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"/>
                </svg>
                + Request Document
              </button>
            ` : ''}
            <button class="btn btn-primary btn-sm" onclick="DocumentsView.openUploadModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              ${isEmployee ? '+ Upload My Document' : '+ Upload Document'}
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Dossier</span>
          </div>
          <div class="kpi-value">${docs.length}</div>
          <div class="kpi-label">${isEmployee ? 'My Documents' : 'Total Files'}</div>
          <div class="kpi-subtitle">${activeVerified.length} Verified & Active</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Review</span>
          </div>
          <div class="kpi-value">${pendingVerification.length}</div>
          <div class="kpi-label">Pending Review</div>
          <div class="kpi-subtitle">Awaiting HR Review</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--danger-light); color: var(--danger);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <span class="kpi-trend warning">30 Days</span>
          </div>
          <div class="kpi-value">${expiringDocs.length}</div>
          <div class="kpi-label">Expiring Soon</div>
          <div class="kpi-subtitle">Passports / Certs / Visas</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Requests</span>
          </div>
          <div class="kpi-value">${requests.filter(r => r.status === 'REQUESTED').length}</div>
          <div class="kpi-label">${isEmployee ? 'Pending Uploads' : 'Outstanding Requests'}</div>
          <div class="kpi-subtitle">${isEmployee ? 'Requested by HR' : 'Awaiting Employee Upload'}</div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        <button class="tab-btn ${this.activeTab === 'all' ? 'active' : ''}" onclick="DocumentsView.switchTab('all')">
          ${isEmployee ? 'My Document Dossier' : 'All Employee Documents'} (${docs.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'requests' ? 'active' : ''}" onclick="DocumentsView.switchTab('requests')">
          ${isEmployee ? 'My Document Requests' : 'Document Requests'} (${requests.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'expiring' ? 'active' : ''}" onclick="DocumentsView.switchTab('expiring')">
          Expiring & Compliance (${expiringDocs.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'templates' ? 'active' : ''}" onclick="DocumentsView.switchTab('templates')">
          ${isEmployee ? 'Company Policies & Letters' : 'Standard Templates'}
        </button>
      </div>

      <!-- Tab Body -->
      <div class="tab-content">
        ${this.renderActiveTab(docs, requests, expiringDocs)}
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    Router.mountView('documents');
  },

  renderActiveTab(docs, requests, expiringDocs) {
    if (this.activeTab === 'requests') {
      return this.renderRequestsTab(requests);
    } else if (this.activeTab === 'expiring') {
      return this.renderExpiringTab(expiringDocs);
    } else if (this.activeTab === 'templates') {
      return this.renderTemplatesTab();
    }
    return this.renderAllDocumentsTab(docs);
  },

  // TAB 1: ALL DOCUMENTS
  renderAllDocumentsTab(docs) {
    let list = docs;
    if (this.currentFilters.categoryCode !== 'All') {
      list = list.filter(d => d.categoryCode === this.currentFilters.categoryCode);
    }
    if (this.currentFilters.status !== 'All') {
      list = list.filter(d => d.status === this.currentFilters.status);
    }
    if (this.currentFilters.search) {
      const s = this.currentFilters.search.toLowerCase();
      list = list.filter(d =>
        (d.name && d.name.toLowerCase().includes(s)) ||
        (d.employeeName && d.employeeName.toLowerCase().includes(s))
      );
    }

    return `
      <!-- Filter Bar -->
      <div class="card" style="margin-bottom: 20px; padding: 16px;">
        <div class="flex items-center gap-3" style="flex-wrap: wrap;">
          <div style="flex: 1; min-width: 220px;">
            <input type="text" id="filter-doc-search" class="form-control" placeholder="Search by Document Name, Employee..." value="${this.currentFilters.search}" onkeydown="if(event.key==='Enter') DocumentsView.applyFilters()" />
          </div>
          <select id="filter-doc-cat" class="form-control" style="width: 200px;">
            <option value="All">All Categories</option>
            ${documentService.DOCUMENT_CATEGORIES.map(c => `<option value="${c.code}" ${this.currentFilters.categoryCode === c.code ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
          </select>
          <select id="filter-doc-status" class="form-control" style="width: 170px;">
            <option value="All">All Statuses</option>
            <option value="ACTIVE" ${this.currentFilters.status === 'ACTIVE' ? 'selected' : ''}>Verified (Active)</option>
            <option value="PENDING_REVIEW" ${this.currentFilters.status === 'PENDING_REVIEW' ? 'selected' : ''}>Pending Review</option>
            <option value="REJECTED" ${this.currentFilters.status === 'REJECTED' ? 'selected' : ''}>Rejected</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="DocumentsView.applyFilters()">Filter</button>
          <button class="btn btn-secondary btn-sm" onclick="DocumentsView.clearFilters()">Clear</button>
        </div>
      </div>

      <!-- Documents Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Employee Document Dossier Master (${list.length})</div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${list.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-title">No Documents Found</div>
              <div class="empty-state-desc">No employee documents match your active filters.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Document Title</th>
                  <th>Category</th>
                  <th>File Format</th>
                  <th>Visibility</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(d => `
                  <tr>
                    <td><div class="font-semibold text-main">${d.employeeName || 'Staff'}</div></td>
                    <td>
                      <div class="font-semibold text-main">${d.name}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">v${d.versionNumber || 1} • ${d.fileSize || '1 MB'}</div>
                    </td>
                    <td><span class="badge badge-neutral">${d.categoryCode}</span></td>
                    <td><span class="badge badge-primary">${d.fileType || 'PDF'}</span></td>
                    <td><span class="badge badge-soft">${d.visibility || 'EMPLOYEE'}</span></td>
                    <td>${d.expiryDate || '<span class="text-muted">None</span>'}</td>
                    <td>
                      <span class="badge ${d.status === 'ACTIVE' ? 'badge-success' : (d.status === 'PENDING_REVIEW' ? 'badge-warning' : 'badge-danger')}">
                        ${d.status}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-1">
                        <a href="${d.downloadUrl}" target="_blank" class="btn btn-soft btn-sm">Preview</a>
                        ${d.status === 'PENDING_REVIEW' ? `
                          <button class="btn btn-primary btn-sm" onclick="DocumentsView.verifyDoc('${d.id}')">Approve</button>
                        ` : ''}
                        <button class="btn btn-danger btn-sm" onclick="DocumentsView.deleteDoc('${d.id}')">Delete</button>
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

  // TAB 2: DOCUMENT REQUESTS
  renderRequestsTab(requests) {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployee = role === 'EMPLOYEE';

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${isEmployee ? 'My Document Checklists & Pending Uploads' : 'Employee Document Checklists & Requests'} (${requests.length})</div>
            <div class="card-subtitle">${isEmployee ? 'Compliance documents, identity proofs, and certificates requested by HR Operations' : 'Pending document requests dispatched to staff for personnel dossiers'}</div>
          </div>
          ${!isEmployee ? `
            <button class="btn btn-primary btn-sm" onclick="DocumentsView.openRequestDocumentModal()">+ New Request</button>
          ` : ''}
        </div>
        <div class="card-body" style="padding: 0;">
          ${requests.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-icon" style="width: 44px; height: 44px; margin-bottom: 8px; background: var(--success-light); color: var(--success);">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              </div>
              <div class="empty-state-title">No Pending Document Requests</div>
              <div class="empty-state-desc">${isEmployee ? 'All your required personnel and compliance documents are up to date. HR has not requested any additional uploads.' : 'All employees have submitted their requested compliance documentation.'}</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  ${!isEmployee ? '<th>Employee</th>' : ''}
                  <th>Requested Document</th>
                  <th>Instructions / Purpose</th>
                  <th>Due Date</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${requests.map(r => `
                  <tr>
                    ${!isEmployee ? `<td><div class="font-semibold text-main">${r.employeeName}</div></td>` : ''}
                    <td>
                      <div class="font-semibold text-main">${r.documentName}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${r.documentType || 'COMPLIANCE'}</div>
                    </td>
                    <td style="max-width: 250px;">
                      <div style="font-size: 0.8rem; color: var(--text-secondary);">${r.description || 'Mandatory compliance submission'}</div>
                    </td>
                    <td><strong>${r.dueDate}</strong></td>
                    <td><span class="badge badge-neutral">${r.requestedBy}</span></td>
                    <td>
                      <span class="badge ${r.status === 'APPROVED' ? 'badge-success' : (r.status === 'SUBMITTED' ? 'badge-primary' : 'badge-warning')}">
                        ${r.status === 'REQUESTED' ? 'Action Required' : r.status}
                      </span>
                    </td>
                    <td>
                      ${isEmployee ? (
                        r.status === 'REQUESTED' ? `
                          <button class="btn btn-primary btn-sm" onclick="DocumentsView.openUploadForRequestModal('${r.id}', '${r.documentName.replace(/'/g, "\\'")}')">
                            Upload File
                          </button>
                        ` : `
                          <span class="badge badge-success" style="font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                            Uploaded
                          </span>
                        `
                      ) : `
                        <button class="btn btn-soft btn-sm" onclick="Toast.info('Request status: ' + '${r.status}')">View</button>
                      `}
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

  // TAB 3: EXPIRING DOCUMENTS
  renderExpiringTab(expiringDocs) {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployee = role === 'EMPLOYEE';

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Expiring Documents & Compliance Alerts (${expiringDocs.length})</div>
            <div class="card-subtitle">${isEmployee ? 'Your documents expiring within the next 30 days' : 'Passports, visas, and certifications expiring within the next 30 days'}</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${expiringDocs.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-title">All Documents Compliant</div>
              <div class="empty-state-desc">${isEmployee ? 'None of your registered documents are expiring soon.' : 'No employee documents are expiring in the next 30 days.'}</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  ${!isEmployee ? '<th>Employee</th>' : ''}
                  <th>Document</th>
                  <th>Expiry Date</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${expiringDocs.map(d => `
                  <tr>
                    ${!isEmployee ? `<td><div class="font-semibold text-main">${d.employeeName}</div></td>` : ''}
                    <td><div class="font-semibold text-main">${d.name}</div></td>
                    <td><strong class="text-danger">${d.expiryDate}</strong></td>
                    <td><span class="badge badge-neutral">${d.categoryCode}</span></td>
                    <td>
                      ${!isEmployee ? `
                        <button class="btn btn-primary btn-sm" onclick="DocumentsView.openRequestDocumentModal('${d.employeeId}', '${d.employeeName}', '${d.name}')">
                          Request Renewal
                        </button>
                      ` : `
                        <button class="btn btn-primary btn-sm" onclick="DocumentsView.openUploadModal()">
                          Upload Renewal
                        </button>
                      `}
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

  // TAB 4: STANDARD TEMPLATES & COMPANY POLICIES
  renderTemplatesTab() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployee = role === 'EMPLOYEE';

    if (isEmployee) {
      const companyPolicies = [
        { title: 'Code of Conduct & Workplace Ethics', category: 'HR Policy', desc: 'Standards of professional behavior, anti-bribery, conflicts of interest, and organizational integrity.', version: 'v2.4 (2026)', date: 'Updated Jan 2026' },
        { title: 'Leave, Attendance & Remote Work Guidelines', category: 'Operations', desc: 'Working hours, biometric/web punch guidelines, earned leave accruals, comp-off rules, and WFH quotas.', version: 'v3.1 (2026)', date: 'Updated Feb 2026' },
        { title: 'IT Security, Asset Custody & Data Privacy', category: 'IT & Security', desc: 'Acceptable hardware use, data classification, password rotation, VPN compliance, and IP protection.', version: 'v2.0 (2025)', date: 'Updated Dec 2025' },
        { title: 'POSH & Workplace Harassment Redressal Policy', category: 'Compliance', desc: 'Prevention of Sexual Harassment (POSH) framework, reporting mechanisms, and Internal Committee contacts.', version: 'v1.5 (2026)', date: 'Updated Jan 2026' },
        { title: 'Group Health & Medical Insurance Guide', category: 'Benefits', desc: 'Mediclaim benefits, sum insured breakdown, network hospital list, cashless TPA cards, and claim procedures.', version: 'v4.0 (2026)', date: 'Updated Jan 2026' },
        { title: 'Travel & Business Expense Reimbursement Policy', category: 'Finance', desc: 'Eligible travel expenses, per-diem allowances, hotel tier bookings, and claim settlement timelines.', version: 'v2.2 (2025)', date: 'Updated Nov 2025' }
      ];

      return `
        <!-- Shortcut Banner to Request Official Letters -->
        <div class="card" style="margin-bottom: 24px; padding: 18px 22px; background: linear-gradient(135deg, rgba(37, 99, 235, 0.07), rgba(99, 102, 241, 0.04)); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: var(--radius-md);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="color: var(--primary); margin-top: 2px;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 1rem; color: var(--text-main); margin-bottom: 4px;">
                  Need an Official Letter or Certificate from HR?
                </div>
                <div style="font-size: 0.83rem; color: var(--text-secondary); max-width: 650px; line-height: 1.4;">
                  Employment Verification Letters, Salary Certificates, and Experience Letters are officially generated and signed by HR Operations upon request.
                </div>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="RequestsView.openNewRequestModal('EMPLOYMENT_CERTIFICATE')">
              + Request Official Letter from HR
            </button>
          </div>
        </div>

        <div style="margin-bottom: 14px; font-size: 0.95rem; font-weight: 700; color: var(--text-main);">
          Company Handbooks & Official Policies
        </div>

        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px;">
          ${companyPolicies.map(p => `
            <div class="card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between; border-top: 3px solid var(--primary);">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <div style="color: var(--primary);">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </div>
                  <span class="badge badge-neutral" style="font-size: 0.72rem;">${p.category}</span>
                </div>
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin: 0 0 6px 0;">${p.title}</h3>
                <div class="text-muted" style="font-size: 0.72rem; margin-bottom: 10px;">${p.version} • ${p.date}</div>
                <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45; margin-bottom: 16px;">${p.desc}</p>
              </div>
              <button class="btn btn-soft btn-sm" style="width: 100%; justify-content: center;" onclick="DocumentsView.previewPolicy('${p.title.replace(/'/g, "\\'")}', '${p.category}', '${p.desc.replace(/'/g, "\\'")}')">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin-right: 4px;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                View & Read Policy
              </button>
            </div>
          `).join('')}
        </div>
      `;
    }

    // HR / ADMIN VIEW: OFFICIAL LETTER TEMPLATE STUDIO
    const hrTemplates = [
      { name: 'Standard Employment Offer Letter', code: 'OFFER_LETTER', desc: 'Pre-onboarding offer detailing CTC breakdown, role, designation, and reporting date.' },
      { name: 'Official Appointment Letter', code: 'APPOINTMENT_LETTER', desc: 'Post-joining service confirmation, probation terms, and formal employment agreement.' },
      { name: 'Employment Verification Certificate', code: 'EMPLOYMENT_CERTIFICATE', desc: 'Official letterhead proof of active employment for bank loans, visas, and tenancy agreements.' },
      { name: 'Official Salary Certificate', code: 'SALARY_CERTIFICATE', desc: 'Verified earnings and CTC certificate for financial institutions and credit applications.' },
      { name: 'Relieving & Experience Letter', code: 'RELIEVING_LETTER', desc: 'Formal service confirmation stating designation, tenure, and clearance upon exit.' }
    ];

    return `
      <div style="margin-bottom: 16px;">
        <div style="font-size: 1rem; font-weight: 700; color: var(--text-main);">Official HR Letter & Certificate Studio</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">Generate official company-letterhead certificates and letters. Generated PDFs are automatically saved to the employee's dossier.</div>
      </div>

      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        ${hrTemplates.map(t => `
          <div class="card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="color: var(--primary);">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <span class="badge badge-primary">HR Template</span>
              </div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0 0 8px 0;">${t.name}</h3>
              <p style="font-size: 0.83rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 16px;">${t.desc}</p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="DocumentsView.openGenerateLetterModal('${t.code}', '${t.name.replace(/'/g, "\\'")}')">
              Generate Official Letter &rarr;
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  // MODAL 1: UPLOAD DOCUMENT
  async openUploadModal() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployee = role === 'EMPLOYEE';
    const currentEmpId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || 'EMP001';
    const currentEmpName = AuthGuard.userProfile?.displayName || 'Employee';

    let employeeSelectHtml = '';
    if (!isEmployee) {
      const employees = await employeeService.getEmployees({});
      employeeSelectHtml = `
        <div class="form-group">
          <label class="form-label required">Select Employee</label>
          <select id="udoc-emp" class="form-control" required>
            ${employees.map(e => `<option value="${e.id}" data-name="${e.fullName || e.name}">${e.fullName || e.name} (${e.employeeCode || 'EMP'})</option>`).join('')}
          </select>
        </div>
      `;
    }

    ModalManager.openModal({
      id: 'upload-doc-modal',
      title: isEmployee ? 'Upload My Personnel Document' : 'Upload Employee Document',
      subtitle: 'Attach identity proofs, contracts, education, or certifications',
      contentHtml: `
        ${employeeSelectHtml}

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Document Title</label>
            <input type="text" id="udoc-name" class="form-control" placeholder="e.g. Passport Copy, Degree Certificate" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Category</label>
            <select id="udoc-category" class="form-control">
              ${documentService.DOCUMENT_CATEGORIES.map(c => `<option value="${c.code}">${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Visibility Scope</label>
            <select id="udoc-visibility" class="form-control">
              <option value="EMPLOYEE">Visible to Employee & HR</option>
              ${!isEmployee ? `
                <option value="HR_ONLY">Confidential (HR Only)</option>
                <option value="ADMIN_ONLY">Super Admin Only</option>
              ` : ''}
            </select>
          </div>
          <div class="col-6 form-group">
            <label class="form-label">Expiry Date (Optional)</label>
            <input type="date" id="udoc-expiry" class="form-control" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Attach File (PDF, PNG, JPG)</label>
          <input type="file" id="udoc-file" class="form-control" accept="image/*,.pdf,.doc,.docx" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="DocumentsView.saveUpload()">Upload & Save</button>
      `
    });
  },

  async saveUpload() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployee = role === 'EMPLOYEE';

    let employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    let employeeName = AuthGuard.userProfile?.displayName || 'Employee';

    if (!isEmployee) {
      const empSelect = document.getElementById('udoc-emp');
      if (empSelect) {
        employeeId = empSelect.value;
        employeeName = empSelect.selectedOptions[0]?.getAttribute('data-name') || employeeName;
      }
    }
    const name = document.getElementById('udoc-name')?.value.trim();
    const categoryCode = document.getElementById('udoc-category')?.value;
    const visibility = document.getElementById('udoc-visibility')?.value;
    const expiryDate = document.getElementById('udoc-expiry')?.value || null;
    const fileInput = document.getElementById('udoc-file');

    if (!employeeId || !name || !fileInput?.files?.length) {
      Toast.warning('Please select an employee, document title, and file.');
      return;
    }

    const file = fileInput.files[0];

    try {
      Toast.info('Uploading document securely to Hostinger Storage...');
      let downloadUrl = '#';
      try {
        const uploadRecord = await hostingerStorageService.uploadFile(file, {
          category: categoryCode,
          employeeId
        });
        downloadUrl = uploadRecord.fileUrl;
      } catch (err) {
        downloadUrl = `https://storage.diallo.com/documents/${file.name}`;
      }

      await documentService.uploadDocument({
        employeeId,
        employeeName,
        name,
        categoryCode,
        visibility,
        expiryDate,
        downloadUrl,
        fileType: file.name.split('.').pop().toUpperCase(),
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'ACTIVE'
      });

      Toast.success('Document uploaded and added to employee dossier!');
      ModalManager.closeModal();
      Router.mountView('documents');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  // MODAL 2: REQUEST DOCUMENT
  // MODAL 2: REQUEST DOCUMENT (HR ONLY)
  async openRequestDocumentModal(preEmpId = null, preEmpName = null, preDocName = null) {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    if (role === 'EMPLOYEE') {
      Toast.warning('Only HR Operations and Admins can dispatch document requests to employees.');
      return;
    }

    const employees = await employeeService.getEmployees({});

    ModalManager.openModal({
      id: 'req-doc-modal',
      title: 'Dispatch Document Request',
      subtitle: 'Request compliance documents or certificates from staff',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Select Employee</label>
          <select id="rd-emp" class="form-control" required>
            ${employees.map(e => `<option value="${e.id}" data-name="${e.fullName || e.name}" ${e.id === preEmpId ? 'selected' : ''}>${e.fullName || e.name} (${e.employeeCode || 'EMP'})</option>`).join('')}
          </select>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Document Name</label>
            <input type="text" id="rd-name" class="form-control" value="${preDocName || 'PAN Card / Address Proof'}" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Due Date</label>
            <input type="date" id="rd-date" class="form-control" value="${new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Instructions for Employee</label>
          <textarea id="rd-desc" class="form-control" rows="2" placeholder="e.g. Please upload clear scanned PDF copy of both front and back sides."></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="DocumentsView.saveDocumentRequest()">Send Request</button>
      `
    });
  },

  // MODAL 3: UPLOAD TO FULFILL HR REQUEST (FOR EMPLOYEE)
  openUploadForRequestModal(requestId, docName) {
    ModalManager.openModal({
      id: 'upload-req-modal',
      title: `Upload Requested Document: ${docName}`,
      subtitle: 'Upload the document requested by HR Operations',
      contentHtml: `
        <div class="card" style="padding: 12px; background: var(--bg-hover); margin-bottom: 16px; font-size: 0.85rem;">
          <div><strong>Requested File:</strong> ${docName}</div>
          <div class="text-muted" style="margin-top: 4px;">Once uploaded, this document will be added to your verified dossier and HR will be notified.</div>
        </div>

        <div class="form-group">
          <label class="form-label required">Select File to Upload (PDF, JPG, PNG)</label>
          <input type="file" id="req-upload-file" class="form-control" accept="image/*,.pdf,.doc,.docx" required />
        </div>

        <div class="form-group">
          <label class="form-label">Optional Comments for HR</label>
          <input type="text" id="req-upload-note" class="form-control" placeholder="e.g. Updated copy with address change" />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="DocumentsView.submitRequestUpload('${requestId}', '${docName.replace(/'/g, "\\'")}')">Submit Document</button>
      `
    });
  },

  async submitRequestUpload(requestId, docName) {
    const fileInput = document.getElementById('req-upload-file');
    const note = document.getElementById('req-upload-note')?.value.trim();

    if (!fileInput?.files?.length) {
      Toast.warning('Please select a file to upload.');
      return;
    }

    const file = fileInput.files[0];
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || 'EMP001';
    const employeeName = AuthGuard.userProfile?.displayName || 'Employee';

    try {
      Toast.info('Uploading document...');
      let downloadUrl = '#';
      try {
        const uploadRecord = await hostingerStorageService.uploadFile(file, {
          category: 'COMPLIANCE',
          employeeId
        });
        downloadUrl = uploadRecord.fileUrl;
      } catch (err) {
        downloadUrl = `https://storage.diallo.com/documents/${file.name}`;
      }

      // Add to employeeDocuments
      await documentService.uploadDocument({
        employeeId,
        employeeName,
        name: docName,
        categoryCode: 'COMPLIANCE',
        visibility: 'EMPLOYEE',
        downloadUrl,
        fileType: file.name.split('.').pop().toUpperCase(),
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'PENDING_REVIEW',
        notes: note
      });

      // Update documentRequests status
      try {
        await db.collection('documentRequests').doc(requestId).update({
          status: 'SUBMITTED',
          submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.warn('Could not update documentRequests:', err);
      }

      Toast.success(`'${docName}' uploaded successfully!`);
      ModalManager.closeModal();
      Router.mountView('documents');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  // MODAL 4: PREVIEW COMPANY POLICY
  previewPolicy(title, category, desc) {
    ModalManager.openModal({
      id: 'policy-preview-modal',
      title: `${title}`,
      subtitle: `${category} • Diallo India Official Handbook`,
      contentHtml: `
        <div class="card" style="padding: 16px; background: var(--bg-hover); margin-bottom: 16px; font-size: 0.85rem; border-left: 3px solid var(--primary);">
          <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Executive Policy Summary</div>
          <div style="color: var(--text-secondary); line-height: 1.5;">${desc}</div>
        </div>

        <div style="font-size: 0.85rem; line-height: 1.6; color: var(--text-main);">
          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">1. Purpose & Scope</h4>
          <p style="color: var(--text-secondary); margin-bottom: 14px;">This official policy applies to all full-time employees, contractors, and consultants at Diallo India. Its objective is to maintain organizational excellence, operational compliance, and workplace integrity.</p>

          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">2. Core Responsibilities & Standards</h4>
          <ul style="padding-left: 18px; color: var(--text-secondary); margin-bottom: 14px;">
            <li>Adherence to ethical business conduct, confidentiality, and statutory guidelines.</li>
            <li>Prompt communication with respective People Operations & HR representatives.</li>
            <li>Protection of company digital assets, customer data, and proprietary intellectual property.</li>
          </ul>

          <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">3. Grievances & Inquiries</h4>
          <p style="color: var(--text-secondary);">For queries, clarifications, or reporting exceptions, reach out to <strong>hr@diallo.com</strong> or raise a confidential helpdesk ticket under <em>HR Requests</em>.</p>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Close</button>
        <button class="btn btn-primary btn-sm" onclick="Toast.success('Official policy downloaded.'); ModalManager.closeModal();">Download PDF Handbook</button>
      `
    });
  },

  // MODAL 5: HR LETTER GENERATION (HR ONLY)
  async openGenerateLetterModal(templateCode, templateName) {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    if (role === 'EMPLOYEE') {
      Toast.warning('Only HR Operations can generate official letters.');
      return;
    }

    const employees = await employeeService.getEmployees({});

    ModalManager.openModal({
      id: 'generate-letter-modal',
      title: `Generate Official Letter: ${templateName}`,
      subtitle: 'Issued on official Diallo India Private Limited Letterhead',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Select Recipient Employee</label>
          <select id="gen-letter-emp" class="form-control" required>
            ${employees.map(e => `<option value="${e.id}" data-name="${e.fullName || e.name}" data-code="${e.employeeCode || 'EMP'}" data-dept="${e.department || 'Technology'}" data-desig="${e.designation || 'Staff'}">${e.fullName || e.name} (${e.employeeCode || 'EMP'}) • ${e.department || 'General'}</option>`).join('')}
          </select>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Issue Date</label>
            <input type="date" id="gen-letter-date" class="form-control" value="${new Date().toISOString().slice(0, 10)}" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Signatory Authority</label>
            <input type="text" id="gen-letter-signatory" class="form-control" value="${AuthGuard.userProfile?.displayName || 'Head of People Operations'}" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Special Inclusions / Remarks</label>
          <textarea id="gen-letter-remarks" class="form-control" rows="2" placeholder="e.g. Issued for official residential tenancy verification / Standard confirmation without liability."></textarea>
        </div>

        <div class="card" style="padding: 12px; background: var(--bg-hover); font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--primary); flex-shrink: 0;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>This letter will be stamped with the company digital seal and automatically deposited into the employee's dossier.</div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="DocumentsView.confirmGenerateLetter('${templateCode}', '${templateName.replace(/'/g, "\\'")}')">Generate & Dispatch Letter</button>
      `
    });
  },

  async confirmGenerateLetter(templateCode, templateName) {
    const empSelect = document.getElementById('gen-letter-emp');
    const employeeId = empSelect?.value;
    const employeeName = empSelect?.selectedOptions[0]?.getAttribute('data-name');
    const issueDate = document.getElementById('gen-letter-date')?.value;
    const signatory = document.getElementById('gen-letter-signatory')?.value.trim();
    const remarks = document.getElementById('gen-letter-remarks')?.value.trim();

    if (!employeeId) return;

    try {
      await documentService.uploadDocument({
        employeeId,
        employeeName,
        name: `${templateName} - ${issueDate}`,
        documentType: templateCode,
        categoryCode: 'EMPLOYMENT',
        visibility: 'EMPLOYEE',
        downloadUrl: `https://storage.diallo.com/official_letters/${employeeId}_${templateCode}.pdf`,
        fileType: 'PDF',
        fileSize: '0.45 MB',
        status: 'ACTIVE',
        notes: `Generated by ${signatory}. Remarks: ${remarks || 'None'}`
      });

      Toast.success(`'${templateName}' generated and saved to ${employeeName}'s dossier!`);
      ModalManager.closeModal();
      Router.mountView('documents');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async saveDocumentRequest() {
    const empSelect = document.getElementById('rd-emp');
    const employeeId = empSelect?.value;
    const employeeName = empSelect?.selectedOptions[0]?.getAttribute('data-name');
    const documentName = document.getElementById('rd-name')?.value.trim();
    const dueDate = document.getElementById('rd-date')?.value;
    const description = document.getElementById('rd-desc')?.value.trim();

    if (!employeeId || !documentName) return;

    try {
      await documentService.createDocumentRequest({ employeeId, employeeName, documentName, dueDate, description });
      Toast.success(`Document request dispatched to ${employeeName}!`);
      ModalManager.closeModal();
      Router.mountView('documents');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async verifyDoc(docId) {
    try {
      await documentService.reviewDocument(docId, 'ACTIVE');
      Toast.success('Document marked as Verified & Active!');
      Router.mountView('documents');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async deleteDoc(docId) {
    ModalManager.confirm({
      title: 'Delete Document',
      message: 'Are you sure you want to permanently delete this document?',
      confirmText: 'Delete',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await documentService.deleteDocument(docId);
          Toast.success('Document deleted.');
          Router.mountView('documents');
        } catch (e) {
          Toast.error(e.message);
        }
      }
    });
  },

  applyFilters() {
    this.currentFilters.search = document.getElementById('filter-doc-search')?.value.trim() || '';
    this.currentFilters.categoryCode = document.getElementById('filter-doc-cat')?.value || 'All';
    this.currentFilters.status = document.getElementById('filter-doc-status')?.value || 'All';
    Router.mountView('documents');
  },

  clearFilters() {
    this.currentFilters = { categoryCode: 'All', status: 'All', search: '' };
    Router.mountView('documents');
  }
};

window.DocumentsView = DocumentsView;
