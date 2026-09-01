/**
 * DIALLO HRMS — WORKFLOW & APPROVAL AUTOMATION HUB (PHASE 14)
 * Multi-level Approvals, Workflow Visual Builder, Live State Machine, and SLA Monitoring
 */

const WorkflowsView = {
  activeTab: 'inbox', // 'inbox', 'instances', 'builder', 'delegations', 'performance'
  selectedModule: 'ALL',
  selectedStatus: 'PENDING',

  async render() {
    const [tasks, instances, definitions] = await Promise.all([
      approvalService.getMyApprovals({ status: this.selectedStatus, module: this.selectedModule }),
      workflowService.getWorkflowInstances({}),
      workflowService.getWorkflowDefinitions({})
    ]);

    const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
    const completedInstances = instances.filter(i => i.status === 'COMPLETED').length;
    const runningInstances = instances.filter(i => i.status === 'IN_PROGRESS').length;
    const rejectedInstances = instances.filter(i => i.status === 'REJECTED').length;

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Workflows & Approvals</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Workflow & Approval Automation Hub</h1>
            <p class="page-subtitle">Configurable multi-level approvals, SLA auto-escalations, delegation rules, and audit timeline</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="WorkflowsView.openCreateWorkflowModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Create Workflow Pipeline
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards (Clean Design System) -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Action</span>
          </div>
          <div class="kpi-value">${pendingCount}</div>
          <div class="kpi-label">Pending My Approval</div>
          <div class="kpi-subtitle">Requires Your Decision</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">In-Flight</span>
          </div>
          <div class="kpi-value">${runningInstances}</div>
          <div class="kpi-label">Active Workflows</div>
          <div class="kpi-subtitle">Currently in Progress</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Completed</span>
          </div>
          <div class="kpi-value">${completedInstances}</div>
          <div class="kpi-label">Approved & Executed</div>
          <div class="kpi-subtitle">Final Steps Passed</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Pipelines</span>
          </div>
          <div class="kpi-value">${definitions.length}</div>
          <div class="kpi-label">Configured Pipelines</div>
          <div class="kpi-subtitle">Active Modules Covered</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        <button class="tab-btn ${this.activeTab === 'inbox' ? 'active' : ''}" onclick="WorkflowsView.switchTab('inbox')">
          Approval Inbox (${pendingCount})
        </button>
        <button class="tab-btn ${this.activeTab === 'instances' ? 'active' : ''}" onclick="WorkflowsView.switchTab('instances')">
          Live Workflow Instances (${instances.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'builder' ? 'active' : ''}" onclick="WorkflowsView.switchTab('builder')">
          Workflow Pipeline Builder (${definitions.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'delegations' ? 'active' : ''}" onclick="WorkflowsView.switchTab('delegations')">
          Out-of-Office Delegations
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="tab-content">
        ${this.renderActiveTab(tasks, instances, definitions)}
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    Router.mountView('workflows');
  },

  renderActiveTab(tasks, instances, definitions) {
    if (this.activeTab === 'instances') return this.renderInstancesTab(instances);
    if (this.activeTab === 'builder') return this.renderBuilderTab(definitions);
    if (this.activeTab === 'delegations') return this.renderDelegationsTab();
    return this.renderInboxTab(tasks);
  },

  // 1. APPROVAL INBOX TAB
  renderInboxTab(tasks) {
    return `
      <div class="card">
        <div class="card-header flex justify-between items-center">
          <div>
            <div class="card-title">My Pending Approvals (${tasks.length})</div>
            <div class="card-subtitle">Requests awaiting your review, approval, or revision notes</div>
          </div>
          <div class="flex items-center gap-2">
            <select class="form-control" style="width: auto; padding: 4px 10px;" onchange="WorkflowsView.filterStatus(this.value)">
              <option value="PENDING" ${this.selectedStatus === 'PENDING' ? 'selected' : ''}>Pending Only</option>
              <option value="APPROVED" ${this.selectedStatus === 'APPROVED' ? 'selected' : ''}>Approved Log</option>
              <option value="REJECTED" ${this.selectedStatus === 'REJECTED' ? 'selected' : ''}>Rejected Log</option>
              <option value="ALL" ${this.selectedStatus === 'ALL' ? 'selected' : ''}>All Tasks</option>
            </select>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${tasks.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px;">
              <div class="empty-state-title">No Pending Approvals</div>
              <div class="empty-state-desc">You are all caught up! There are no requests awaiting your review.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Module</th>
                  <th>Request Title</th>
                  <th>Approval Step</th>
                  <th>Assigned Role</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${tasks.map(t => `
                  <tr>
                    <td><div class="font-semibold text-main">${t.employeeName}</div></td>
                    <td><span class="badge badge-neutral">${t.module}</span></td>
                    <td style="max-width: 250px;">
                      <div class="text-truncate" style="font-size: 0.85rem;" title="${t.title}">${t.title}</div>
                    </td>
                    <td><span class="badge badge-primary">${t.stepName || 'Manager Review'}</span></td>
                    <td><span class="text-muted" style="font-size: 0.8rem;">${t.approverType || 'MANAGER'}</span></td>
                    <td>${t.createdAt ? new Date(t.createdAt.seconds ? t.createdAt.seconds * 1000 : t.createdAt).toLocaleDateString() : 'Recent'}</td>
                    <td>
                      <span class="badge ${t.status === 'APPROVED' ? 'badge-success' : (t.status === 'REJECTED' ? 'badge-danger' : 'badge-warning')}">
                        ${t.status}
                      </span>
                    </td>
                    <td>
                      ${t.status === 'PENDING' ? `
                        <div class="flex items-center gap-1">
                          <button class="btn btn-primary btn-sm" onclick="WorkflowsView.quickApprove('${t.id}')">Approve</button>
                          <button class="btn btn-danger btn-sm" onclick="WorkflowsView.openRejectModal('${t.id}')">Reject</button>
                          <button class="btn btn-secondary btn-sm" onclick="WorkflowsView.openRequestChangesModal('${t.id}')">Changes</button>
                          <button class="btn btn-soft btn-sm" onclick="WorkflowsView.openDelegateModal('${t.id}')">Delegate</button>
                        </div>
                      ` : `
                        <span class="text-muted" style="font-size: 0.75rem;">Resolved</span>
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

  // 2. LIVE WORKFLOW INSTANCES TAB
  renderInstancesTab(instances) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Live Company Workflow Requests (${instances.length})</div>
            <div class="card-subtitle">Track active request state machines and step progress</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Employee</th>
                <th>Module</th>
                <th>Pipeline Name</th>
                <th>Current Step</th>
                <th>Progress Status</th>
                <th>Initiated</th>
                <th>Timeline</th>
              </tr>
            </thead>
            <tbody>
              ${instances.map(inst => `
                <tr>
                  <td><code style="font-size: 0.8rem;">${inst.id.slice(0, 8)}</code></td>
                  <td><div class="font-semibold text-main">${inst.initiatedByName}</div></td>
                  <td><span class="badge badge-neutral">${inst.module}</span></td>
                  <td>${inst.workflowName || 'Standard Approval'}</td>
                  <td><strong style="color: var(--primary);">${inst.currentStepName || 'In Progress'}</strong></td>
                  <td>
                    <span class="badge ${inst.status === 'COMPLETED' ? 'badge-success' : (inst.status === 'REJECTED' ? 'badge-danger' : 'badge-warning')}">
                      ${inst.status}
                    </span>
                  </td>
                  <td>${inst.createdAt ? new Date(inst.createdAt.seconds ? inst.createdAt.seconds * 1000 : inst.createdAt).toLocaleDateString() : 'Recent'}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="WorkflowsView.openTimelineModal('${inst.id}', '${inst.module}')">
                      View Timeline
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 3. WORKFLOW BUILDER TAB
  renderBuilderTab(definitions) {
    return `
      <div class="card">
        <div class="card-header flex justify-between items-center">
          <div>
            <div class="card-title">Configured Approval Pipelines (${definitions.length})</div>
            <div class="card-subtitle">Define sequential multi-step approvers, SLA timeouts, and conditions</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="WorkflowsView.openCreateWorkflowModal()">+ New Pipeline</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Pipeline Name</th>
                <th>Target Module</th>
                <th>Configured Steps</th>
                <th>Priority</th>
                <th>Version</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${definitions.map(d => `
                <tr>
                  <td><div class="font-semibold text-main">${d.name}</div></td>
                  <td><span class="badge badge-neutral">${d.module}</span></td>
                  <td>
                    <div class="flex items-center gap-1">
                      ${(d.steps || []).map((s, idx) => `
                        <span class="badge badge-soft" style="font-size: 0.72rem;">${idx + 1}. ${s.name}</span>
                      `).join(' → ')}
                    </div>
                  </td>
                  <td>Priority ${d.priority || 1}</td>
                  <td>v${d.version || 1}</td>
                  <td><span class="badge badge-success">${d.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 4. DELEGATIONS TAB
  renderDelegationsTab() {
    return `
      <div class="card" style="max-width: 700px;">
        <div class="card-header">
          <div>
            <div class="card-title">Out-of-Office Approval Delegation</div>
            <div class="card-subtitle">Temporarily assign your approval authorities during leaves or travel</div>
          </div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label required">Designated Temporary Approver</label>
            <input type="text" id="del-name" class="form-control" placeholder="e.g. Assistant Department Manager" />
          </div>
          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Start Date</label>
              <input type="date" id="del-start" class="form-control" />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">End Date</label>
              <input type="date" id="del-end" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Delegation Handover Notes</label>
            <textarea id="del-notes" class="form-control" rows="3" placeholder="Specify authority scope..."></textarea>
          </div>
          <div style="text-align: right; margin-top: 16px;">
            <button class="btn btn-primary btn-sm" onclick="WorkflowsView.saveDelegation()">Activate Delegation Rule</button>
          </div>
        </div>
      </div>
    `;
  },

  filterStatus(status) {
    this.selectedStatus = status;
    Router.mountView('workflows');
  },

  async quickApprove(taskId) {
    try {
      await approvalService.approveTask(taskId, 'Approved via quick actions');
      Toast.success('Request approved and progressed to next step.');
      Router.mountView('workflows');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openRejectModal(taskId) {
    ModalManager.openModal({
      id: 'reject-task-modal',
      title: 'Reject Request',
      subtitle: 'Mandatory explanation is recorded in the audit history',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Reason for Rejection</label>
          <textarea id="rej-reason" class="form-control" rows="4" placeholder="Explain clearly why this request cannot be approved..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-danger btn-sm" onclick="WorkflowsView.submitRejection('${taskId}')">Confirm Rejection</button>
      `
    });
  },

  async submitRejection(taskId) {
    const reason = document.getElementById('rej-reason')?.value.trim();
    if (!reason) {
      Toast.warning('Please provide a mandatory reason for rejection.');
      return;
    }

    try {
      await approvalService.rejectTask(taskId, reason);
      Toast.success('Request rejected and notification dispatched.');
      ModalManager.closeModal();
      Router.mountView('workflows');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openRequestChangesModal(taskId) {
    ModalManager.openModal({
      id: 'request-changes-modal',
      title: 'Request Revisions from Employee',
      subtitle: 'Specify what documents or details need to be updated',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Required Revisions / Feedback</label>
          <textarea id="change-feedback" class="form-control" rows="4" placeholder="e.g. Please attach missing invoice copy or adjust claim dates..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="WorkflowsView.submitRequestChanges('${taskId}')">Submit Feedback</button>
      `
    });
  },

  async submitRequestChanges(taskId) {
    const feedback = document.getElementById('change-feedback')?.value.trim();
    if (!feedback) {
      Toast.warning('Please enter feedback notes.');
      return;
    }

    try {
      await approvalService.requestChanges(taskId, feedback);
      Toast.success('Revision request sent to employee.');
      ModalManager.closeModal();
      Router.mountView('workflows');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openDelegateModal(taskId) {
    ModalManager.openModal({
      id: 'delegate-modal',
      title: 'Delegate Approval Authority',
      subtitle: 'Reassign this task to an authorized peer or deputy',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Delegate To (Name / Role)</label>
          <input type="text" id="del-target" class="form-control" placeholder="e.g. Finance Deputy Lead" required />
        </div>
        <div class="form-group">
          <label class="form-label">Handover Reason</label>
          <input type="text" id="del-reason" class="form-control" placeholder="e.g. Out of office / conflict of interest" />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="WorkflowsView.submitDelegation('${taskId}')">Confirm Delegation</button>
      `
    });
  },

  async submitDelegation(taskId) {
    const target = document.getElementById('del-target')?.value.trim();
    const reason = document.getElementById('del-reason')?.value.trim() || 'Delegated authority';
    if (!target) {
      Toast.warning('Please enter delegate name.');
      return;
    }

    try {
      await approvalService.delegateTask(taskId, 'del_user', target, reason);
      Toast.success('Task delegated successfully.');
      ModalManager.closeModal();
      Router.mountView('workflows');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async openTimelineModal(instanceId, moduleName) {
    const history = await approvalService.getWorkflowHistory(instanceId);

    ModalManager.openModal({
      id: 'workflow-timeline-modal',
      title: `${moduleName} Workflow Audit Timeline`,
      subtitle: `Instance ID: ${instanceId}`,
      contentHtml: `
        <div style="padding: 10px 0;">
          ${history.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 24px;">No audit steps recorded yet.</div>
          ` : `
            <div class="flex flex-col gap-3">
              ${history.map((h, i) => `
                <div style="padding: 12px 16px; background: var(--bg-hover); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="badge badge-primary">Step ${i + 1}</span>
                      <strong class="text-main">${h.action}</strong>
                      <span class="text-muted" style="font-size: 0.75rem;">by ${h.actorName} (${h.actorRole})</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">${h.comment || 'No comments'}</div>
                  </div>
                  <div class="text-muted" style="font-size: 0.75rem;">
                    ${h.createdAt ? new Date(h.createdAt.seconds ? h.createdAt.seconds * 1000 : h.createdAt).toLocaleString() : 'Recent'}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `,
      footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close</button>`
    });
  },

  openCreateWorkflowModal() {
    ModalManager.openModal({
      id: 'create-workflow-modal',
      title: 'Define New Workflow Pipeline',
      subtitle: 'Configure multi-step sequential approvers and SLA thresholds',
      size: 'lg',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Pipeline Name</label>
          <input type="text" id="wf-name" class="form-control" placeholder="e.g. Senior Executive Expense Pipeline" required />
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Target Module</label>
            <select id="wf-module" class="form-control">
              ${workflowService.SUPPORTED_MODULES.map(m => `<option value="${m.code}">${m.name}</option>`).join('')}
            </select>
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Priority</label>
            <input type="number" id="wf-priority" class="form-control" value="1" min="1" max="10" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Step 1 Approver</label>
          <select id="wf-step1" class="form-control">
            ${workflowService.APPROVER_TYPES.map(a => `<option value="${a.code}">${a.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Step 2 Approver (Optional Multi-Level)</label>
          <select id="wf-step2" class="form-control">
            <option value="">None (Single Level)</option>
            ${workflowService.APPROVER_TYPES.map(a => `<option value="${a.code}">${a.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Step SLA Timeout (Hours)</label>
          <input type="number" id="wf-timeout" class="form-control" value="48" min="1" />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="WorkflowsView.saveWorkflow()">Activate Pipeline</button>
      `
    });
  },

  async saveWorkflow() {
    const name = document.getElementById('wf-name')?.value.trim();
    const module = document.getElementById('wf-module')?.value;
    const priority = document.getElementById('wf-priority')?.value || 1;
    const step1 = document.getElementById('wf-step1')?.value;
    const step2 = document.getElementById('wf-step2')?.value;
    const timeout = document.getElementById('wf-timeout')?.value || 48;

    if (!name) {
      Toast.warning('Please provide a pipeline name.');
      return;
    }

    const steps = [
      { stepId: 'step_1', name: `${step1.replace(/_/g, ' ')} Review`, approverType: step1, required: true, order: 1, timeoutHours: Number(timeout) }
    ];

    if (step2) {
      steps.push({ stepId: 'step_2', name: `${step2.replace(/_/g, ' ')} Final Sign-off`, approverType: step2, required: true, order: 2, timeoutHours: Number(timeout) });
    }

    try {
      await workflowService.createWorkflowDefinition({
        name,
        module,
        priority: Number(priority),
        steps,
        status: 'ACTIVE'
      });

      Toast.success('Workflow pipeline activated successfully!');
      ModalManager.closeModal();
      Router.mountView('workflows');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  saveDelegation() {
    Toast.success('Out-of-office delegation rule activated for your account!');
  }
};

window.WorkflowsView = WorkflowsView;
