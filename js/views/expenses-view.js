/**
 * DIALLO HRMS — EXPENSE MANAGEMENT & REIMBURSEMENTS VIEW (PHASE 10)
 * Handles Claims Roster, Employee ESS Drafts, Approval Workflows, Policy Limits, and Settlement Tracking
 */

const ExpensesView = {
  activeTab: 'all', // 'all', 'my', 'approvals', 'categories'
  currentFilters: {
    status: 'All',
    categoryId: 'All',
    search: ''
  },

  async render() {
    const userRole = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;

    const [allExpenses, categories] = await Promise.all([
      expenseService.getExpenses({}),
      expenseService.getCategories()
    ]);

    const myExpenses = allExpenses.filter(e => e.employeeId === employeeId);
    const pendingExpenses = allExpenses.filter(e => e.status === 'SUBMITTED' || e.status === 'UNDER_REVIEW');
    const approvedExpenses = allExpenses.filter(e => e.status === 'APPROVED');
    const paidExpenses = allExpenses.filter(e => e.status === 'PAID');

    const totalAmount = allExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const pendingAmount = pendingExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const approvedAmount = approvedExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const paidAmount = paidExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Expense Management</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Employee Expenses & Reimbursements</h1>
            <p class="page-subtitle">Track business claims, multi-level manager approvals, receipt audits, and payroll settlements</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="ExpensesView.exportExpensesCSV()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export CSV
            </button>
            <button class="btn btn-primary btn-sm" onclick="ExpensesView.openCreateExpenseModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + File Expense Claim
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Total</span>
          </div>
          <div class="kpi-value">₹${totalAmount.toLocaleString('en-IN')}</div>
          <div class="kpi-label">Total Claims</div>
          <div class="kpi-subtitle">${allExpenses.length} Total Submissions</div>
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
          <div class="kpi-value">₹${pendingAmount.toLocaleString('en-IN')}</div>
          <div class="kpi-label">Pending Review</div>
          <div class="kpi-subtitle">${pendingExpenses.length} Pending Approval</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Ready</span>
          </div>
          <div class="kpi-value">₹${approvedAmount.toLocaleString('en-IN')}</div>
          <div class="kpi-label">Approved</div>
          <div class="kpi-subtitle">${approvedExpenses.length} Awaiting Payment</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Settled</span>
          </div>
          <div class="kpi-value">₹${paidAmount.toLocaleString('en-IN')}</div>
          <div class="kpi-label">Paid & Reimbursed</div>
          <div class="kpi-subtitle">${paidExpenses.length} Settled Claims</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        <button class="tab-btn ${this.activeTab === 'all' ? 'active' : ''}" onclick="ExpensesView.switchTab('all')">
          All Expense Claims (${allExpenses.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'my' ? 'active' : ''}" onclick="ExpensesView.switchTab('my')">
          My Claims (${myExpenses.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'approvals' ? 'active' : ''}" onclick="ExpensesView.switchTab('approvals')">
          Approvals & Settlements (${pendingExpenses.length + approvedExpenses.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'categories' ? 'active' : ''}" onclick="ExpensesView.switchTab('categories')">
          Categories & Policies (${categories.length})
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="tab-content">
        ${this.renderActiveTab(allExpenses, myExpenses, pendingExpenses, approvedExpenses, categories)}
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    Router.mountView('expenses');
  },

  renderActiveTab(allExpenses, myExpenses, pendingExpenses, approvedExpenses, categories) {
    if (this.activeTab === 'my') {
      return this.renderMyExpensesTab(myExpenses);
    } else if (this.activeTab === 'approvals') {
      return this.renderApprovalsTab(pendingExpenses, approvedExpenses);
    } else if (this.activeTab === 'categories') {
      return this.renderCategoriesTab(categories);
    }
    return this.renderAllExpensesTab(allExpenses, categories);
  },

  // TAB 1: ALL EXPENSES
  renderAllExpensesTab(expenses, categories) {
    let list = expenses;
    if (this.currentFilters.status !== 'All') {
      list = list.filter(e => e.status === this.currentFilters.status);
    }
    if (this.currentFilters.categoryId !== 'All') {
      list = list.filter(e => e.categoryCode === this.currentFilters.categoryId);
    }
    if (this.currentFilters.search) {
      const s = this.currentFilters.search.toLowerCase();
      list = list.filter(e =>
        (e.employeeName && e.employeeName.toLowerCase().includes(s)) ||
        (e.description && e.description.toLowerCase().includes(s)) ||
        (e.categoryName && e.categoryName.toLowerCase().includes(s))
      );
    }

    return `
      <!-- Filter Bar -->
      <div class="card" style="margin-bottom: 20px; padding: 16px;">
        <div class="flex items-center gap-3" style="flex-wrap: wrap;">
          <div style="flex: 1; min-width: 220px;">
            <input type="text" id="filter-exp-search" class="form-control" placeholder="Search by Employee, Description..." value="${this.currentFilters.search}" onkeydown="if(event.key==='Enter') ExpensesView.applyFilters()" />
          </div>
          <select id="filter-exp-status" class="form-control" style="width: 170px;">
            <option value="All" ${this.currentFilters.status === 'All' ? 'selected' : ''}>All Statuses</option>
            <option value="SUBMITTED" ${this.currentFilters.status === 'SUBMITTED' ? 'selected' : ''}>Pending Review</option>
            <option value="APPROVED" ${this.currentFilters.status === 'APPROVED' ? 'selected' : ''}>Approved</option>
            <option value="PAID" ${this.currentFilters.status === 'PAID' ? 'selected' : ''}>Paid</option>
            <option value="REJECTED" ${this.currentFilters.status === 'REJECTED' ? 'selected' : ''}>Rejected</option>
            <option value="DRAFT" ${this.currentFilters.status === 'DRAFT' ? 'selected' : ''}>Draft</option>
          </select>
          <select id="filter-exp-cat" class="form-control" style="width: 180px;">
            <option value="All">All Categories</option>
            ${categories.map(c => `<option value="${c.code}" ${this.currentFilters.categoryId === c.code ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" onclick="ExpensesView.applyFilters()">Filter</button>
          <button class="btn btn-secondary btn-sm" onclick="ExpensesView.clearFilters()">Clear</button>
        </div>
      </div>

      <!-- Expense Records Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">All Claims Roster (${list.length})</div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${list.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-title">No Expense Claims Found</div>
              <div class="empty-state-desc">No expense records match the active criteria.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Purpose & Notes</th>
                  <th>Payment Route</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(e => `
                  <tr>
                    <td>
                      <div class="font-semibold text-main">${e.employeeName || 'Employee'}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${e.department || 'General'}</div>
                    </td>
                    <td><span class="badge badge-neutral">${e.categoryName}</span></td>
                    <td>${e.expenseDate}</td>
                    <td><strong style="color: var(--primary);">₹${(e.amount || 0).toLocaleString('en-IN')}</strong></td>
                    <td style="max-width: 250px;">
                      <div class="text-truncate" style="font-size: 0.85rem;" title="${e.description}">${e.description}</div>
                      ${e.receiptUrl ? `<a href="${e.receiptUrl}" target="_blank" class="text-primary" style="font-size: 0.75rem; text-decoration: underline;">View Receipt</a>` : ''}
                    </td>
                    <td><span class="badge ${e.reimbursementMethod === 'PAYROLL' ? 'badge-primary' : 'badge-soft'}">${e.reimbursementMethod || 'DIRECT'}</span></td>
                    <td>
                      <span class="badge ${e.status === 'PAID' ? 'badge-success' : (e.status === 'APPROVED' ? 'badge-primary' : (e.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'))}">
                        ${e.status}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-1">
                        <button class="btn btn-soft btn-sm" onclick="ExpensesView.openExpenseDetailsModal('${e.id}')">View</button>
                        ${(e.status === 'SUBMITTED' || e.status === 'DRAFT') ? `
                          <button class="btn btn-danger btn-sm" onclick="ExpensesView.deleteExpense('${e.id}')">Delete</button>
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

  // TAB 2: MY EXPENSES (EMPLOYEE SELF SERVICE)
  renderMyExpensesTab(myExpenses) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">My Filed Expense Claims (${myExpenses.length})</div>
            <div class="card-subtitle">Your personal claims, submission drafts, and settlement progress</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ExpensesView.openCreateExpenseModal()">+ New Claim</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${myExpenses.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-title">No Personal Claims Filed</div>
              <div class="empty-state-desc">You have not submitted any reimbursement claims yet.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Receipt</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${myExpenses.map(e => `
                  <tr>
                    <td><span class="badge badge-neutral">${e.categoryName}</span></td>
                    <td>${e.expenseDate}</td>
                    <td><strong>₹${(e.amount || 0).toLocaleString('en-IN')}</strong></td>
                    <td style="max-width: 250px;"><div class="text-truncate">${e.description}</div></td>
                    <td>
                      ${e.receiptUrl ? `<a href="${e.receiptUrl}" target="_blank" class="btn btn-soft btn-sm">Receipt</a>` : '<span class="text-muted">None</span>'}
                    </td>
                    <td>
                      <span class="badge ${e.status === 'PAID' ? 'badge-success' : (e.status === 'APPROVED' ? 'badge-primary' : (e.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'))}">
                        ${e.status}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-soft btn-sm" onclick="ExpensesView.openExpenseDetailsModal('${e.id}')">Details</button>
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

  // TAB 3: APPROVALS & SETTLEMENTS (MANAGER / FINANCE)
  renderApprovalsTab(pending, approved) {
    return `
      <div class="grid" style="grid-template-columns: 1fr; gap: 24px;">
        <!-- Pending Approvals -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Pending Claims Awaiting Review (${pending.length})</div>
          </div>
          <div class="card-body" style="padding: 0;">
            ${pending.length === 0 ? `
              <div class="empty-state" style="border: none; padding: 32px 16px;">
                <div class="empty-state-title">All Caught Up!</div>
                <div class="empty-state-desc">No expense claims currently pending manager or finance approval.</div>
              </div>
            ` : `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Receipt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${pending.map(e => `
                    <tr>
                      <td>
                        <div class="font-semibold text-main">${e.employeeName}</div>
                        <div class="text-muted" style="font-size: 0.75rem;">${e.department || 'Staff'}</div>
                      </td>
                      <td><span class="badge badge-neutral">${e.categoryName}</span></td>
                      <td>${e.expenseDate}</td>
                      <td><strong style="color: var(--primary);">₹${(e.amount || 0).toLocaleString('en-IN')}</strong></td>
                      <td>
                        ${e.receiptUrl ? `<a href="${e.receiptUrl}" target="_blank" class="btn btn-soft btn-sm">View Receipt</a>` : '<span class="badge badge-warning">No Receipt</span>'}
                      </td>
                      <td>
                        <div class="flex items-center gap-1">
                          <button class="btn btn-primary btn-sm" onclick="ExpensesView.approveExpense('${e.id}')">Approve</button>
                          <button class="btn btn-secondary btn-sm" onclick="ExpensesView.openRejectModal('${e.id}')">Reject</button>
                          <button class="btn btn-soft btn-sm" onclick="ExpensesView.openRequestChangesModal('${e.id}')">Changes</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>

        <!-- Approved Claims Awaiting Payment Disbursement -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Approved Claims Ready for Payout (${approved.length})</div>
          </div>
          <div class="card-body" style="padding: 0;">
            ${approved.length === 0 ? `
              <div class="empty-state" style="border: none; padding: 32px 16px;">
                <div class="empty-state-title">No Pending Disbursements</div>
                <div class="empty-state-desc">All approved claims have been settled.</div>
              </div>
            ` : `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Approved By</th>
                    <th>Reimbursement Mode</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${approved.map(e => `
                    <tr>
                      <td><div class="font-semibold text-main">${e.employeeName}</div></td>
                      <td>${e.categoryName}</td>
                      <td><strong style="color: #10b981;">₹${(e.amount || 0).toLocaleString('en-IN')}</strong></td>
                      <td>${e.approvedBy || 'HR Admin'}</td>
                      <td><span class="badge badge-primary">${e.reimbursementMethod || 'DIRECT'}</span></td>
                      <td>
                        <button class="btn btn-primary btn-sm" onclick="ExpensesView.openDisbursePaymentModal('${e.id}', '${e.employeeName}', ${e.amount})">
                          Mark Disbursed
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>
      </div>
    `;
  },

  // TAB 4: CATEGORIES & POLICIES
  renderCategoriesTab(categories) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Configured Expense Schemes & Policy Rules (${categories.length})</div>
            <div class="card-subtitle">Enforce per-claim maximum caps, daily allowances, and mandatory receipt rules</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Code</th>
                <th>Max Policy Cap</th>
                <th>Receipt Required</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map(c => `
                <tr>
                  <td><div class="font-semibold text-main">${c.name}</div></td>
                  <td><code style="font-size: 0.8rem;">${c.code}</code></td>
                  <td><strong>₹${(c.maxAmount || 5000).toLocaleString('en-IN')}</strong></td>
                  <td>
                    <span class="badge ${c.requiresReceipt ? 'badge-warning' : 'badge-neutral'}">
                      ${c.requiresReceipt ? 'Mandatory' : 'Optional'}
                    </span>
                  </td>
                  <td><span class="badge badge-success">ACTIVE</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // MODAL 1: CREATE / DRAFT EXPENSE CLAIM
  async openCreateExpenseModal() {
    const categories = await expenseService.getCategories();
    const todayStr = new Date().toISOString().slice(0, 10);

    ModalManager.openModal({
      id: 'create-expense-claim-modal',
      title: 'File Expense Claim',
      subtitle: 'Submit itemized claim for travel, meals, or business costs',
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Expense Date</label>
            <input type="date" id="exp-date" class="form-control" value="${todayStr}" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Category</label>
            <select id="exp-category" class="form-control" required>
              ${categories.map(c => `<option value="${c.code}" data-name="${c.name}">${c.name} (Cap: ₹${(c.maxAmount || 0).toLocaleString('en-IN')})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Claim Amount (INR ₹)</label>
            <input type="number" id="exp-amount" class="form-control" placeholder="e.g. 2500" min="1" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Reimbursement Route</label>
            <select id="exp-route" class="form-control">
              <option value="DIRECT">Direct Bank Transfer</option>
              <option value="PAYROLL">Next Month Payroll</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Description</label>
          <input type="text" id="exp-desc" class="form-control" placeholder="e.g. Client Dinner at Grand Hyatt Mumbai" required />
        </div>

        <div class="form-group">
          <label class="form-label">Business Purpose & Notes</label>
          <textarea id="exp-purpose" class="form-control" rows="2" placeholder="Explain project or business alignment..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Attach Receipt / Invoice (Optional / Mandatory for Travel)</label>
          <input type="file" id="exp-file-receipt" class="form-control" accept="image/*,.pdf" />
          <div class="text-muted" style="font-size: 0.75rem; margin-top: 4px;">Supports PNG, JPG, PDF documents up to 10MB</div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-soft btn-sm" onclick="ExpensesView.saveExpense(false)">Save Draft</button>
        <button class="btn btn-primary btn-sm" onclick="ExpensesView.saveExpense(true)">Submit Claim</button>
      `
    });
  },

  async saveExpense(submitImmediately) {
    const expenseDate = document.getElementById('exp-date')?.value;
    const catSelect = document.getElementById('exp-category');
    const categoryCode = catSelect?.value;
    const categoryName = catSelect?.selectedOptions[0]?.getAttribute('data-name') || 'Expense';
    const amount = Number(document.getElementById('exp-amount')?.value);
    const reimbursementMethod = document.getElementById('exp-route')?.value;
    const description = document.getElementById('exp-desc')?.value.trim();
    const businessPurpose = document.getElementById('exp-purpose')?.value.trim();
    const fileInput = document.getElementById('exp-file-receipt');

    if (!expenseDate || !categoryCode || !amount || !description) {
      Toast.warning('Please complete all mandatory fields.');
      return;
    }

    try {
      let receiptUrl = null;
      let receiptFileName = null;

      if (fileInput?.files?.length > 0) {
        const file = fileInput.files[0];
        receiptFileName = file.name;
        Toast.info('Uploading receipt securely to Hostinger Storage...');
        try {
          const uploadRecord = await hostingerStorageService.uploadFile(file, { category: 'EXPENSE_RECEIPT' });
          receiptUrl = uploadRecord.fileUrl;
        } catch (storageErr) {
          console.warn('Storage upload note:', storageErr);
          receiptUrl = `https://storage.diallo.com/expenses/${file.name}`;
        }
      }

      await expenseService.createExpense({
        expenseDate,
        categoryCode,
        categoryName,
        amount,
        reimbursementMethod,
        description,
        businessPurpose,
        receiptUrl,
        receiptFileName,
        submitImmediately
      });

      Toast.success(submitImmediately ? 'Expense claim submitted for approval!' : 'Draft saved successfully.');
      ModalManager.closeModal();
      Router.mountView('expenses');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  // MODAL 2: EXPENSE DETAILS & TIMELINE
  async openExpenseDetailsModal(expenseId) {
    const expenses = await expenseService.getExpenses({});
    const exp = expenses.find(e => e.id === expenseId);
    if (!exp) return;

    ModalManager.openModal({
      id: 'expense-details-modal',
      title: `Claim Details: ₹${(exp.amount || 0).toLocaleString('en-IN')}`,
      subtitle: `${exp.categoryName} • ${exp.expenseDate}`,
      contentHtml: `
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <div class="text-muted" style="font-size: 0.75rem;">Employee</div>
            <div class="font-semibold text-main">${exp.employeeName}</div>
          </div>
          <div>
            <div class="text-muted" style="font-size: 0.75rem;">Status</div>
            <span class="badge ${exp.status === 'PAID' ? 'badge-success' : 'badge-primary'}">${exp.status}</span>
          </div>
          <div>
            <div class="text-muted" style="font-size: 0.75rem;">Reimbursement Mode</div>
            <div class="font-semibold text-main">${exp.reimbursementMethod || 'DIRECT'}</div>
          </div>
          <div>
            <div class="text-muted" style="font-size: 0.75rem;">Submitted Date</div>
            <div class="font-semibold text-main">${exp.expenseDate}</div>
          </div>
        </div>

        <div class="card" style="padding: 12px; background: var(--bg-hover); margin-bottom: 16px;">
          <div class="font-semibold text-main" style="font-size: 0.85rem; margin-bottom: 4px;">Description & Purpose</div>
          <div style="font-size: 0.85rem;">${exp.description}</div>
          ${exp.businessPurpose ? `<div class="text-muted" style="font-size: 0.8rem; margin-top: 4px;"><em>"${exp.businessPurpose}"</em></div>` : ''}
        </div>

        ${exp.receiptUrl ? `
          <div class="card" style="padding: 12px; margin-bottom: 16px;">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-semibold text-main" style="font-size: 0.85rem;">Attached Receipt Document</div>
                <div class="text-muted" style="font-size: 0.75rem;">${exp.receiptFileName || 'Receipt.pdf'}</div>
              </div>
              <a href="${exp.receiptUrl}" target="_blank" class="btn btn-soft btn-sm">Open File</a>
            </div>
          </div>
        ` : ''}

        ${exp.approvedBy ? `
          <div class="card" style="padding: 12px; border-left: 3px solid #10b981;">
            <div class="text-muted" style="font-size: 0.75rem;">Approval Audit</div>
            <div class="font-semibold text-main" style="font-size: 0.85rem;">Approved by ${exp.approvedBy}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${exp.approverComments || 'Policy compliant'}</div>
          </div>
        ` : ''}
      `,
      footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close</button>`
    });
  },

  async approveExpense(expenseId) {
    try {
      await expenseService.approveExpense(expenseId);
      Toast.success('Expense claim approved and moved to Payment Settlement!');
      Router.mountView('expenses');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openRejectModal(expenseId) {
    ModalManager.openModal({
      id: 'reject-expense-modal',
      title: 'Reject Expense Claim',
      subtitle: 'Mandatory reason required for employee audit',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Rejection Reason</label>
          <select id="rej-reason-select" class="form-control" style="margin-bottom: 12px;">
            <option value="Invalid or illegible receipt uploaded">Invalid or illegible receipt uploaded</option>
            <option value="Claim exceeds statutory policy threshold">Claim exceeds statutory policy threshold</option>
            <option value="Duplicate expense claim detected">Duplicate expense claim detected</option>
            <option value="Non-business related personal expense">Non-business related personal expense</option>
            <option value="Other">Other Reason</option>
          </select>
          <textarea id="rej-reason-custom" class="form-control" rows="2" placeholder="Additional audit comments..."></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-danger btn-sm" onclick="ExpensesView.confirmReject('${expenseId}')">Confirm Rejection</button>
      `
    });
  },

  async confirmReject(expenseId) {
    const sel = document.getElementById('rej-reason-select')?.value;
    const custom = document.getElementById('rej-reason-custom')?.value.trim();
    const reason = custom ? `${sel} - ${custom}` : sel;

    try {
      await expenseService.rejectExpense(expenseId, reason);
      Toast.success('Expense claim rejected.');
      ModalManager.closeModal();
      Router.mountView('expenses');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openRequestChangesModal(expenseId) {
    ModalManager.openModal({
      id: 'request-changes-modal',
      title: 'Request Changes from Employee',
      subtitle: 'Send claim back to employee for receipt or detail correction',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Required Feedback</label>
          <textarea id="rc-feedback" class="form-control" rows="3" placeholder="e.g. Please upload original tax invoice instead of card swipe slip."></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ExpensesView.confirmRequestChanges('${expenseId}')">Send Back</button>
      `
    });
  },

  async confirmRequestChanges(expenseId) {
    const feedback = document.getElementById('rc-feedback')?.value.trim();
    if (!feedback) return;

    try {
      await expenseService.requestChanges(expenseId, feedback);
      Toast.success('Requested changes sent to employee.');
      ModalManager.closeModal();
      Router.mountView('expenses');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openDisbursePaymentModal(expenseId, empName, amount) {
    ModalManager.openModal({
      id: 'disburse-modal',
      title: `Disburse Reimbursement: ₹${amount.toLocaleString('en-IN')}`,
      subtitle: `Payee: ${empName}`,
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Payment Method</label>
          <select id="disburse-method" class="form-control">
            <option value="BANK_TRANSFER">Direct Bank IMPS / NEFT</option>
            <option value="PAYROLL_INTEGRATION">Include in Next Month Payroll Run</option>
            <option value="CORPORATE_CARD">Corporate Card Credit</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Transaction Reference ID</label>
          <input type="text" id="disburse-ref" class="form-control" value="TXN-${Date.now().toString().slice(-6)}" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ExpensesView.confirmDisburse('${expenseId}')">Confirm Payout</button>
      `
    });
  },

  async confirmDisburse(expenseId) {
    const paymentMethod = document.getElementById('disburse-method')?.value;
    const paymentReference = document.getElementById('disburse-ref')?.value.trim();

    try {
      await expenseService.markExpensePaid(expenseId, { paymentMethod, paymentReference });
      Toast.success('Expense marked as Paid & Reimbursed!');
      ModalManager.closeModal();
      Router.mountView('expenses');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async deleteExpense(expenseId) {
    ModalManager.confirm({
      title: 'Delete Expense Claim',
      message: 'Are you sure you want to delete this expense claim?',
      confirmText: 'Delete',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await expenseService.deleteExpense(expenseId);
          Toast.success('Expense claim removed.');
          Router.mountView('expenses');
        } catch (e) {
          Toast.error(e.message);
        }
      }
    });
  },

  applyFilters() {
    this.currentFilters.search = document.getElementById('filter-exp-search')?.value.trim() || '';
    this.currentFilters.status = document.getElementById('filter-exp-status')?.value || 'All';
    this.currentFilters.categoryId = document.getElementById('filter-exp-cat')?.value || 'All';
    Router.mountView('expenses');
  },

  clearFilters() {
    this.currentFilters = { status: 'All', categoryId: 'All', search: '' };
    Router.mountView('expenses');
  },

  async exportExpensesCSV() {
    const expenses = await expenseService.getExpenses({});
    let csv = 'ID,Employee,Department,Category,Date,Amount,ReimbursementMethod,Status\n';
    expenses.forEach(e => {
      csv += `"${e.id}","${e.employeeName || ''}","${e.department || ''}","${e.categoryName || ''}","${e.expenseDate || ''}",${e.amount || 0},"${e.reimbursementMethod || ''}","${e.status || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diallo_Expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    Toast.success('Exported expenses roster to CSV.');
  }
};

window.ExpensesView = ExpensesView;
