/**
 * DIALLO HRMS — EMPLOYEE REQUESTS GOVERNANCE VIEW (PHASE 11)
 * HR / Admin Workflow Hub for Reviewing Profile Changes, Certificate Requests, and Helpdesk Tickets
 */

const RequestsView = {
  currentFilters: {
    status: 'All',
    requestType: 'All',
    search: ''
  },

  async render() {
    const requests = await employeeRequestService.getRequests({});

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
        (r.description && r.description.toLowerCase().includes(s))
      );
    }

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
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="card" style="padding: 16px; border-left: 4px solid var(--accent-leave);">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Pending Review</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-leave); margin: 4px 0;">${pending.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Awaiting Action</div>
        </div>

        <div class="card" style="padding: 16px; border-left: 4px solid #10b981;">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Completed & Resolved</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #10b981; margin: 4px 0;">${completed.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Approved & Generated</div>
        </div>

        <div class="card" style="padding: 16px; border-left: 4px solid #ef4444;">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Declined / Rejected</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #ef4444; margin: 4px 0;">${rejected.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">With Feedback</div>
        </div>

        <div class="card" style="padding: 16px; border-left: 4px solid var(--primary);">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Total Tickets</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin: 4px 0;">${requests.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">All Lifetime Requests</div>
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
            ${employeeRequestService.REQUEST_TYPES.map(t => `<option value="${t.code}" ${this.currentFilters.requestType === t.code ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('')}
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
                      <span class="badge ${r.status === 'COMPLETED' ? 'badge-success' : (r.status === 'SUBMITTED' ? 'badge-warning' : 'badge-danger')}">
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

  async openRequestDetailsModal(requestId) {
    const requests = await employeeRequestService.getRequests({});
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    const timeline = await employeeRequestService.getRequestTimeline(requestId);

    ModalManager.openModal({
      id: 'req-details-modal',
      title: `Request Details: ${req.requestTypeName}`,
      subtitle: `Submitted by ${req.employeeName}`,
      contentHtml: `
        <div class="card" style="padding: 14px; background: var(--bg-hover); margin-bottom: 16px;">
          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
            <div><strong>Employee:</strong> ${req.employeeName}</div>
            <div><strong>Status:</strong> <span class="badge badge-primary">${req.status}</span></div>
            <div><strong>Request Type:</strong> ${req.requestTypeName}</div>
            <div><strong>Assigned Department:</strong> ${req.assignedTo || 'HR Operations'}</div>
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
          <div class="card" style="padding: 12px; border-left: 3px solid #10b981; margin-bottom: 16px;">
            <div style="font-size: 0.8rem; color: var(--text-secondary);">HR Resolution Summary:</div>
            <div style="font-size: 0.85rem;">${req.resolutionNotes}</div>
          </div>
        ` : ''}

        <div style="margin-top: 16px;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--primary); margin-bottom: 10px;">Audit History & Timeline</h4>
          <div class="flex flex-col gap-2">
            ${timeline.map(t => `
              <div style="padding: 8px 12px; background: var(--bg-surface); border-left: 2px solid var(--primary); font-size: 0.8rem; border-radius: 0 4px 4px 0;">
                <div class="flex justify-between text-muted">
                  <strong>${t.action}</strong>
                  <span>${t.performedBy || 'System'}</span>
                </div>
                <div>${t.comments || ''}</div>
              </div>
            `).join('')}
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
    if (!reason) return;

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
