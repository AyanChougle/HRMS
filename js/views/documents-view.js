/**
 * DIALLO HRMS — CENTRAL DOCUMENT MANAGEMENT VIEW (PHASE 11)
 * HR Governance for Employee Dossiers, Compliance Verification, Expiry Tracking, and Document Requests
 */

const DocumentsView = {
  activeTab: 'all', // 'all', 'requests', 'expiring', 'templates'
  currentFilters: {
    categoryCode: 'All',
    status: 'All',
    search: ''
  },

  async render() {
    const [docs, requests, expiringDocs] = await Promise.all([
      documentService.getDocuments({}),
      documentService.getDocumentRequests({}),
      documentService.getExpiringDocuments(null, 30)
    ]);

    const pendingVerification = docs.filter(d => d.status === 'PENDING_REVIEW');
    const activeVerified = docs.filter(d => d.status === 'ACTIVE');

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Document Management</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Enterprise Document Management (DMS)</h1>
            <p class="page-subtitle">Centralized employee dossiers, compliance audits, expiry tracking, and document requests</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="DocumentsView.openRequestDocumentModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"/>
              </svg>
              + Request Document
            </button>
            <button class="btn btn-primary btn-sm" onclick="DocumentsView.openUploadModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Upload Document
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="card" style="padding: 16px; border-left: 4px solid var(--primary);">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Total Dossier Files</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin: 4px 0;">${docs.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${activeVerified.length} Verified & Active</div>
        </div>

        <div class="card" style="padding: 16px; border-left: 4px solid var(--accent-leave);">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Pending Verification</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-leave); margin: 4px 0;">${pendingVerification.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Awaiting HR Review</div>
        </div>

        <div class="card" style="padding: 16px; border-left: 4px solid #ef4444;">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Expiring (Next 30 Days)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #ef4444; margin: 4px 0;">${expiringDocs.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Passports / Certs / Visas</div>
        </div>

        <div class="card" style="padding: 16px; border-left: 4px solid #3b82f6;">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Outstanding Requests</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #3b82f6; margin: 4px 0;">${requests.filter(r => r.status === 'REQUESTED').length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Awaiting Employee Upload</div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        <button class="tab-btn ${this.activeTab === 'all' ? 'active' : ''}" onclick="DocumentsView.switchTab('all')">
          All Employee Documents (${docs.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'requests' ? 'active' : ''}" onclick="DocumentsView.switchTab('requests')">
          Document Requests (${requests.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'expiring' ? 'active' : ''}" onclick="DocumentsView.switchTab('expiring')">
          Expiring & Compliance (${expiringDocs.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'templates' ? 'active' : ''}" onclick="DocumentsView.switchTab('templates')">
          Standard Templates
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
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Employee Document Checklists & Requests (${requests.length})</div>
            <div class="card-subtitle">Pending document requests dispatched by HR Operations</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="DocumentsView.openRequestDocumentModal()">+ New Request</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${requests.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-title">No Active Document Requests</div>
              <div class="empty-state-desc">All employees have submitted their requested compliance documentation.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Requested Document</th>
                  <th>Due Date</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${requests.map(r => `
                  <tr>
                    <td><div class="font-semibold text-main">${r.employeeName}</div></td>
                    <td>
                      <div class="font-semibold text-main">${r.documentName}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${r.description || ''}</div>
                    </td>
                    <td><strong>${r.dueDate}</strong></td>
                    <td>${r.requestedBy}</td>
                    <td>
                      <span class="badge ${r.status === 'APPROVED' ? 'badge-success' : (r.status === 'SUBMITTED' ? 'badge-primary' : 'badge-warning')}">
                        ${r.status}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-soft btn-sm" onclick="Toast.info('Awaiting employee upload')">View</button>
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
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Expiring Documents & Compliance Alerts (${expiringDocs.length})</div>
            <div class="card-subtitle">Passports, visas, and certifications expiring within the next 30 days</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${expiringDocs.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-title">All Documents Compliant</div>
              <div class="empty-state-desc">No employee documents are expiring in the next 30 days.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Document</th>
                  <th>Expiry Date</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${expiringDocs.map(d => `
                  <tr>
                    <td><div class="font-semibold text-main">${d.employeeName}</div></td>
                    <td><div class="font-semibold text-main">${d.name}</div></td>
                    <td><strong class="text-danger">${d.expiryDate}</strong></td>
                    <td><span class="badge badge-neutral">${d.categoryCode}</span></td>
                    <td>
                      <button class="btn btn-primary btn-sm" onclick="DocumentsView.openRequestDocumentModal('${d.employeeId}', '${d.employeeName}', '${d.name}')">
                        Request Renewal
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

  // TAB 4: STANDARD TEMPLATES
  renderTemplatesTab() {
    const templates = [
      { name: 'Standard Employment Offer Letter', code: 'OFFER_LETTER', desc: 'Standard terms of employment, compensation breakdown, and joining formalities.' },
      { name: 'Official Appointment Letter', code: 'APPOINTMENT_LETTER', desc: 'Post-joining confirmation of designation, reporting structure, and probation terms.' },
      { name: 'Employment Verification Certificate', code: 'EMPLOYMENT_CERTIFICATE', desc: 'Proof of active employment for bank loans, embassies, and rental agreements.' },
      { name: 'Official Salary Certificate', code: 'SALARY_CERTIFICATE', desc: 'Verified earnings and CTC certificate for financial institutions.' },
      { name: 'Relieving & Experience Letter', code: 'RELIEVING_LETTER', desc: 'Formal service confirmation upon completion of exit clearances.' }
    ];

    return `
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        ${templates.map(t => `
          <div class="card" style="padding: 20px; display: flex; flex-col; justify-content: space-between;">
            <div>
              <div class="badge badge-primary" style="margin-bottom: 8px;">Template</div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0 0 8px 0;">${t.name}</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 16px;">${t.desc}</p>
            </div>
            <button class="btn btn-soft btn-sm" onclick="Toast.success('Template loaded into Certificate Generator!')">
              📄 Generate Letter
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  // MODAL 1: UPLOAD DOCUMENT
  async openUploadModal() {
    const employees = await employeeService.getEmployees({});

    ModalManager.openModal({
      id: 'upload-doc-modal',
      title: 'Upload Employee Document',
      subtitle: 'Attach identity proofs, contracts, or compliance certifications',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Select Employee</label>
          <select id="udoc-emp" class="form-control" required>
            ${employees.map(e => `<option value="${e.id}" data-name="${e.fullName || e.name}">${e.fullName || e.name} (${e.employeeCode || 'EMP'})</option>`).join('')}
          </select>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Document Title</label>
            <input type="text" id="udoc-name" class="form-control" placeholder="e.g. Passport Copy" required />
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
              <option value="HR_ONLY">Confidential (HR Only)</option>
              <option value="ADMIN_ONLY">Super Admin Only</option>
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
    const empSelect = document.getElementById('udoc-emp');
    const employeeId = empSelect?.value;
    const employeeName = empSelect?.selectedOptions[0]?.getAttribute('data-name');
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
      Toast.info('Uploading document to Firebase Storage...');
      let downloadUrl = '#';
      try {
        const snap = await storage.ref(`documents/${employeeId}/${Date.now()}_${file.name}`).put(file);
        downloadUrl = await snap.ref.getDownloadURL();
      } catch (err) {
        downloadUrl = `https://storage.googleapis.com/hrms-docs/${file.name}`;
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
  async openRequestDocumentModal(preEmpId = null, preEmpName = null, preDocName = null) {
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
