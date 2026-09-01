/**
 * DIALLO HRMS — PAYROLL & COMPENSATION MODULE (PHASE 7)
 * Batch Salary Processing, Attendance/Leave Reconciliation, Review/Approval/Locking, and Form 16 Payslips
 */

const PayrollView = {
  activeTab: 'cycles',
  selectedPeriodId: null,

  async renderHub() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployeeOnly = role === 'EMPLOYEE';
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;

    let cycles = [];
    let employees = [];

    try {
      [cycles, employees] = await Promise.all([
        payrollService.getPayrollPeriods(),
        employeeService.getEmployees({ status: 'ACTIVE' })
      ]);
    } catch (e) {
      console.warn('Payroll Hub data load warning:', e);
    }

    if (!this.selectedPeriodId && cycles.length > 0) {
      this.selectedPeriodId = cycles[0].id;
    }

    // Compute KPI sums across periods
    let totalGrossSum = 0;
    let totalNetSum = 0;
    let lockedCount = 0;
    cycles.forEach(c => {
      totalGrossSum += (c.totalGrossNum || 0);
      totalNetSum += (c.totalNetNum || 0);
      if (c.status === 'LOCKED') lockedCount++;
    });

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Payroll</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Payroll & Compensation Management</h1>
            <p class="page-subtitle">Monthly salary disbursements, attendance/leave reconciliations, EPF, ESIC, State PT, and Form-16 payslips</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="PayrollView.openCtcCalculatorModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              CTC Calculator
            </button>
            ${!isEmployeeOnly ? `
              <button class="btn btn-primary btn-sm" onclick="PayrollView.openRunPayrollWizard()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Run Monthly Payroll
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Payroll KPI Metrics -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Enrolled</span>
          </div>
          <div class="kpi-value">${employees.length} Staff</div>
          <div class="kpi-label">Active Workforce</div>
          <div class="kpi-subtitle">Eligible for salary run</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Total CTC</span>
          </div>
          <div class="kpi-value">₹${totalGrossSum.toLocaleString('en-IN')}</div>
          <div class="kpi-label">Total Gross Processed</div>
          <div class="kpi-subtitle">Across active batches</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Disbursed</span>
          </div>
          <div class="kpi-value">₹${totalNetSum.toLocaleString('en-IN')}</div>
          <div class="kpi-label">Net Take-Home Paid</div>
          <div class="kpi-subtitle">Bank transfers</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">${lockedCount} Locked</span>
          </div>
          <div class="kpi-value">${cycles.length} Cycles</div>
          <div class="kpi-label">Payroll Periods</div>
          <div class="kpi-subtitle">Batch audit records</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        ${!isEmployeeOnly ? `
          <button class="tab-btn ${this.activeTab === 'cycles' ? 'active' : ''}" onclick="PayrollView.switchTab('cycles')">Payroll Cycles & Runs</button>
          <button class="tab-btn ${this.activeTab === 'review' ? 'active' : ''}" onclick="PayrollView.switchTab('review')">Payroll Inspection & Review</button>
          <button class="tab-btn ${this.activeTab === 'comp' ? 'active' : ''}" onclick="PayrollView.switchTab('comp')">Employee Compensation (CTC)</button>
        ` : ''}
        <button class="tab-btn ${this.activeTab === 'payslips' || isEmployeeOnly ? 'active' : ''}" onclick="PayrollView.switchTab('payslips')">My Payslips</button>
        ${!isEmployeeOnly ? `
          <button class="tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" onclick="PayrollView.switchTab('settings')">Payroll Settings & Policy</button>
        ` : ''}
      </div>

      <!-- TAB CONTENT VIEWPORT -->
      <div id="payroll-tab-content">
        ${await this.renderTabContent(cycles, employees, role)}
      </div>
    `;
  },

  async renderTabContent(cycles, employees, role) {
    if (this.activeTab === 'payslips' || role === 'EMPLOYEE') {
      return await this.renderMyPayslipsTab();
    } else if (this.activeTab === 'review') {
      return await this.renderReviewTab(cycles);
    } else if (this.activeTab === 'comp') {
      return await this.renderCompensationTab(employees);
    } else if (this.activeTab === 'settings') {
      return await this.renderSettingsTab();
    }
    return await this.renderCyclesTab(cycles);
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    Router.navigate('payroll');
  },

  // 1. PAYROLL CYCLES & BATCHES TAB
  async renderCyclesTab(cycles) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Monthly Payroll Batches & Disbursements</div>
            <div class="card-subtitle">Verified calculation runs in Cloud Firestore with attendance & leave reconciliations</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="PayrollView.openRunPayrollWizard()">+ Run New Batch</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${cycles.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-icon" style="width: 44px; height: 44px; margin-bottom: 8px; background: var(--primary-light); color: var(--primary);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="empty-state-title">No Payroll Cycles Found</div>
              <div class="empty-state-desc">Click "Run New Batch" to compute salaries for the current period.</div>
              <button class="btn btn-primary btn-sm" style="margin-top: 12px;" onclick="PayrollView.openRunPayrollWizard()">+ Run First Payroll</button>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Payroll Month</th>
                  <th>Dates Range</th>
                  <th>Employees</th>
                  <th>Total Gross</th>
                  <th>Total Deductions</th>
                  <th>Net Disbursement</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${cycles.map(c => `
                  <tr>
                    <td class="font-bold text-main">${c.name || c.month}</td>
                    <td><span class="text-secondary" style="font-size: 0.8rem;">${c.startDate || '—'} to ${c.endDate || '—'}</span></td>
                    <td><strong>${c.employeeCount || c.employeesCount || 0} Staff</strong></td>
                    <td class="font-semibold text-main">${c.totalGross || '₹0.00'}</td>
                    <td class="font-semibold text-danger">-${c.totalDeductions || '₹0.00'}</td>
                    <td class="font-bold" style="color: var(--primary);">${c.totalNet || '₹0.00'}</td>
                    <td>
                      <span class="badge ${c.status === 'LOCKED' ? 'badge-primary' : (c.status === 'APPROVED' ? 'badge-success' : 'badge-warning')}">
                        <span class="badge-dot"></span> ${c.status}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-1">
                        <button class="btn btn-soft btn-sm" onclick="PayrollView.inspectPeriod('${c.id}')">Inspect</button>
                        ${c.status === 'REVIEW' || c.status === 'DRAFT' ? `
                          <button class="btn btn-primary btn-sm" onclick="PayrollView.approvePeriod('${c.id}')">Approve</button>
                        ` : (c.status === 'APPROVED' ? `
                          <button class="btn btn-secondary btn-sm" onclick="PayrollView.lockPeriod('${c.id}')">Lock Period</button>
                        ` : '<span class="text-muted" style="font-size: 0.75rem;">Locked</span>')}
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

  // 2. INSPECT & REVIEW ITEMIZED PAYROLL TAB
  async renderReviewTab(cycles) {
    if (cycles.length === 0) {
      return `<div class="card" style="padding: 40px; text-align: center;">No payroll cycles found to review.</div>`;
    }

    const records = await payrollService.getPayrollRecords(this.selectedPeriodId);

    return `
      <!-- Period Selector Dropdown -->
      <div class="card" style="margin-bottom: 20px; padding: 16px;">
        <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 12px;">
          <div class="flex items-center gap-3">
            <label class="form-label" style="margin-bottom: 0; font-weight: 700;">Select Payroll Cycle:</label>
            <select class="form-control" style="width: 240px;" onchange="PayrollView.changeSelectedPeriod(this.value)">
              ${cycles.map(c => `
                <option value="${c.id}" ${c.id === this.selectedPeriodId ? 'selected' : ''}>${c.name || c.month} (${c.status})</option>
              `).join('')}
            </select>
          </div>
          <div>
            <button class="btn btn-soft btn-sm" onclick="PayrollView.reprocessSelectedPeriod()">Reprocess Calculations</button>
          </div>
        </div>
      </div>

      <!-- Itemized Records Table -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Employee Calculation Ledgers (${records.length} Records)</div>
            <div class="card-subtitle">Itemized gross, deductions, attendance metrics, and net payout</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${records.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Records Found For This Period</div>
              <div class="empty-state-desc">Click "Reprocess Calculations" to generate itemized records.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Attendance / Leave</th>
                  <th>Monthly Gross</th>
                  <th>Deductions (EPF/PT/TDS)</th>
                  <th>Net Pay</th>
                  <th>Flag</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${records.map(r => `
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-cell-avatar">${(r.employeeSnapshot?.fullName || 'EM').substring(0, 2).toUpperCase()}</div>
                        <div class="user-cell-info">
                          <span class="user-cell-name font-semibold">${r.employeeSnapshot?.fullName || 'Staff'}</span>
                          <span class="user-cell-code font-bold" style="color: var(--primary);">${r.employeeSnapshot?.employeeCode || r.employeeId}</span>
                        </div>
                      </div>
                    </td>
                    <td><span class="font-medium text-main">${r.employeeSnapshot?.department || 'General'}</span></td>
                    <td>
                      <div style="font-size: 0.75rem;">
                        <strong>${r.attendanceSnapshot?.presentDays || 0}</strong> Present • 
                        <strong>${r.attendanceSnapshot?.paidLeaveDays || 0}</strong> Leave • 
                        <span class="text-danger font-semibold">${r.attendanceSnapshot?.lwpDays || 0} LOP</span>
                      </div>
                    </td>
                    <td><strong class="text-main">₹${(r.earnings?.grossPay || 0).toLocaleString('en-IN')}</strong></td>
                    <td><strong class="text-danger">-₹${(r.deductions?.totalDeductions || 0).toLocaleString('en-IN')}</strong></td>
                    <td><strong style="color: var(--success); font-size: 0.95rem;">₹${(r.netPay || 0).toLocaleString('en-IN')}</strong></td>
                    <td>
                      <span class="badge ${r.flag === 'NORMAL' ? 'badge-success' : 'badge-warning'}">
                        ${r.flag}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-soft btn-sm" onclick="PayrollView.viewRecordPayslip('${r.id}')">View Payslip</button>
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

  inspectPeriod(periodId) {
    this.selectedPeriodId = periodId;
    this.switchTab('review');
  },

  changeSelectedPeriod(periodId) {
    this.selectedPeriodId = periodId;
    Router.navigate('payroll');
  },

  async reprocessSelectedPeriod() {
    if (!this.selectedPeriodId) return;
    try {
      Toast.info('Reprocessing calculations from Attendance, Leave, and Compensation...');
      await payrollService.processPayrollPeriod(this.selectedPeriodId);
      Toast.success('Payroll calculations updated!');
      Router.navigate('payroll');
    } catch (e) {
      Toast.error(`Reprocessing failed: ${e.message}`);
    }
  },

  async approvePeriod(periodId) {
    try {
      await payrollService.approvePayrollPeriod(periodId);
      Toast.success('Payroll cycle approved!');
      Router.navigate('payroll');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async lockPeriod(periodId) {
    ModalManager.confirm({
      title: 'Lock Payroll Period',
      message: 'Are you sure you want to permanently lock this payroll cycle? Once locked, salary calculations become immutable.',
      confirmText: 'Lock Period',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await payrollService.lockPayrollPeriod(periodId);
          Toast.success('Payroll cycle locked successfully.');
          Router.navigate('payroll');
        } catch (e) {
          Toast.error(`Lock failed: ${e.message}`);
        }
      }
    });
  },

  // 3. EMPLOYEE SELF-SERVICE PAYSLIPS TAB
  async renderMyPayslipsTab() {
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const payslips = await payrollService.getPayslipsForEmployee(employeeId);

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">My Official Payslips & Form 16 Statements</div>
            <div class="card-subtitle">Monthly salary slips with verified EPF, ESIC, State PT, and TDS withholdings</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${payslips.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Payslips Available</div>
              <div class="empty-state-desc">Your monthly payslip will appear here once payroll is processed by HR.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Payroll Month</th>
                  <th>Gross Salary</th>
                  <th>Total Deductions</th>
                  <th>Net Take-Home</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${payslips.map(p => `
                  <tr>
                    <td class="font-bold text-main">${p.periodName || 'Monthly Payout'}</td>
                    <td><strong>₹${(p.earnings?.grossPay || 0).toLocaleString('en-IN')}</strong></td>
                    <td class="text-danger">-₹${(p.deductions?.totalDeductions || 0).toLocaleString('en-IN')}</td>
                    <td><strong style="color: var(--success); font-size: 1rem;">₹${(p.netPay || 0).toLocaleString('en-IN')}</strong></td>
                    <td><span class="badge badge-success">DISBURSED</span></td>
                    <td>
                      <button class="btn btn-primary btn-sm" onclick="PayrollView.viewRecordPayslip('${p.id}')">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        View / Print
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

  // 4. EMPLOYEE COMPENSATION MASTER TAB
  async renderCompensationTab(employees) {
    const compensations = await compensationService.getAllCompensations();
    const compMap = {};
    compensations.forEach(c => { compMap[c.employeeId] = c; });

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Employee CTC & Salary Masters</div>
            <div class="card-subtitle">Active compensation packages, structure assignments, and versioned increment histories</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Designation</th>
                <th>Monthly Gross</th>
                <th>Annual CTC</th>
                <th>Structure</th>
                <th>Effective From</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${employees.map(emp => {
                const comp = compMap[emp.id] || {
                  monthlyGross: emp.salary ? parseInt(emp.salary.replace(/[^0-9]/g, '')) || 50000 : 50000,
                  annualCTC: (emp.salary ? parseInt(emp.salary.replace(/[^0-9]/g, '')) || 50000 : 50000) * 12,
                  salaryStructureName: 'Standard CTC (Wage Code 2026)',
                  effectiveFrom: emp.dateOfJoining || '2026-01-01'
                };

                return `
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-cell-avatar">${(emp.fullName || emp.name).substring(0, 2).toUpperCase()}</div>
                        <div class="user-cell-info">
                          <span class="user-cell-name font-semibold">${emp.fullName || emp.name}</span>
                          <span class="user-cell-code font-bold" style="color: var(--primary);">${emp.employeeCode || emp.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>${emp.designation || 'Staff'}</td>
                    <td><strong class="text-main">₹${comp.monthlyGross.toLocaleString('en-IN')}/mo</strong></td>
                    <td><strong style="color: var(--primary);">₹${comp.annualCTC.toLocaleString('en-IN')}/yr</strong></td>
                    <td><span class="badge badge-neutral">${comp.salaryStructureName}</span></td>
                    <td>${comp.effectiveFrom}</td>
                    <td>
                      <button class="btn btn-soft btn-sm" onclick="PayrollView.openUpdateCompensationModal('${emp.id}', '${emp.fullName || emp.name}', ${comp.monthlyGross})">Revise Salary</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openUpdateCompensationModal(employeeId, name, currentMonthlyGross) {
    ModalManager.openModal({
      id: 'update-comp-modal',
      title: `Revise Compensation: ${name}`,
      subtitle: 'Updates active salary and logs an immutable version in Compensation History',
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">New Monthly Gross (INR ₹)</label>
            <input type="number" id="new-comp-monthly" class="form-control" value="${currentMonthlyGross}" oninput="document.getElementById('new-comp-ctc').value = this.value * 12" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Annual CTC (INR ₹)</label>
            <input type="number" id="new-comp-ctc" class="form-control" value="${currentMonthlyGross * 12}" readonly style="background: var(--bg-hover);" />
          </div>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Effective Date</label>
            <input type="date" id="new-comp-date" class="form-control" value="${new Date().toISOString().slice(0, 10)}" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Revision Reason</label>
            <select id="new-comp-reason" class="form-control">
              <option value="Annual Performance Appraisal">Annual Performance Appraisal</option>
              <option value="Promotion / Grade Elevation">Promotion / Grade Elevation</option>
              <option value="Market Correction / Retention">Market Correction / Retention</option>
            </select>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PayrollView.saveCompensationRevision('${employeeId}')">Save Salary Revision</button>
      `
    });
  },

  async saveCompensationRevision(employeeId) {
    const monthlyGross = Number(document.getElementById('new-comp-monthly')?.value) || 0;
    const annualCTC = Number(document.getElementById('new-comp-ctc')?.value) || 0;
    const effectiveFrom = document.getElementById('new-comp-date')?.value;
    const reason = document.getElementById('new-comp-reason')?.value;

    if (!monthlyGross || !effectiveFrom) return;

    try {
      await compensationService.updateCompensation(employeeId, { monthlyGross, annualCTC, effectiveFrom, reason });
      Toast.success('Compensation updated and history versioned.');
      ModalManager.closeModal();
      this.switchTab('comp');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  // 5. PAYROLL SETTINGS TAB
  async renderSettingsTab() {
    const settings = await payrollSettingsService.getSettings();

    return `
      <div class="card" style="max-width: 680px; margin: 0 auto; padding: 24px;">
        <div class="card-header" style="padding: 0 0 16px 0; border-bottom: 1px solid var(--border-main); margin-bottom: 20px;">
          <div>
            <div class="card-title">Corporate Payroll Rules & Policy</div>
            <div class="card-subtitle">Working days calculation method, overtime rules, and deduction policies</div>
          </div>
        </div>

        <form id="payroll-settings-form" onsubmit="event.preventDefault(); PayrollView.saveSettings()">
          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Base Currency</label>
              <select id="pset-currency" class="form-control">
                <option value="INR" ${settings.currency === 'INR' ? 'selected' : ''}>INR (₹) — Indian Rupee</option>
                <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>USD ($) — US Dollar</option>
                <option value="AED" ${settings.currency === 'AED' ? 'selected' : ''}>AED (AED) — UAE Dirham</option>
              </select>
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Working Days Method</label>
              <select id="pset-working-days" class="form-control">
                <option value="FIXED_DAYS" ${settings.workingDaysMethod === 'FIXED_DAYS' ? 'selected' : ''}>Fixed 26 Days (Factories Act Standard)</option>
                <option value="ACTUAL_WORKING_DAYS" ${settings.workingDaysMethod === 'ACTUAL_WORKING_DAYS' ? 'selected' : ''}>Actual Working Days in Month</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Overtime Multiplier</label>
              <input type="number" id="pset-ot-mult" class="form-control" value="${settings.overtimeRateMultiplier || 1.5}" step="0.1" min="1.0" max="3.0" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Unpaid Leave (LOP) Deduction</label>
              <select id="pset-lop" class="form-control">
                <option value="true" ${settings.unpaidLeaveDeductionEnabled ? 'selected' : ''}>Enabled (Deduct Gross/26 per day)</option>
                <option value="false" ${!settings.unpaidLeaveDeductionEnabled ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-3" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-main);">
            <button type="submit" class="btn btn-primary btn-sm">Save Payroll Policy</button>
          </div>
        </form>
      </div>
    `;
  },

  async saveSettings() {
    const currency = document.getElementById('pset-currency')?.value;
    const workingDaysMethod = document.getElementById('pset-working-days')?.value;
    const overtimeRateMultiplier = Number(document.getElementById('pset-ot-mult')?.value) || 1.5;
    const unpaidLeaveDeductionEnabled = document.getElementById('pset-lop')?.value === 'true';

    try {
      await payrollSettingsService.updateSettings('comp_diallo_india', {
        currency,
        workingDaysMethod,
        overtimeRateMultiplier,
        unpaidLeaveDeductionEnabled
      });
      Toast.success('Payroll policy settings updated.');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  // 6. RUN PAYROLL BATCH WIZARD MODAL
  async openRunPayrollWizard() {
    const employees = await employeeService.getEmployees({ status: 'ACTIVE' });
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const year = new Date().getFullYear();
    const monthIndex = new Date().getMonth();
    const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const endDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${lastDay}`;

    ModalManager.openModal({
      id: 'run-payroll-wizard-modal',
      title: `Run Monthly Payroll — ${currentMonth}`,
      subtitle: 'Reconciles real Attendance, Leave (LOP), Overtime, and Statutory Withholdings',
      size: 'lg',
      contentHtml: `
        <div class="card" style="padding: 16px; margin-bottom: 16px; background: var(--bg-hover);">
          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
            <div><strong>Active Staff Enrolled:</strong> ${employees.length} Employees</div>
            <div><strong>Pay Date:</strong> 5th of next month</div>
            <div><strong>Period Start:</strong> ${startDate}</div>
            <div><strong>Period End:</strong> ${endDate}</div>
          </div>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-secondary);">
          Executing this batch will calculate itemized basic pay, HRA, overtime allowances, unpaid leave (LOP) deductions, EPF, ESIC, State PT, and projected TDS withholdings into immutable records in Cloud Firestore.
        </p>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" id="btn-exec-payroll-batch" onclick="PayrollView.executeBatchRun('${currentMonth}', '${startDate}', '${endDate}')">Process Payroll Batch</button>
      `
    });
  },

  async executeBatchRun(monthName, startDate, endDate) {
    const btn = document.getElementById('btn-exec-payroll-batch');
    if (btn) { btn.disabled = true; btn.textContent = 'Processing calculations...'; }

    try {
      const period = await payrollService.createPayrollPeriod({
        name: monthName,
        startDate,
        endDate
      });

      await payrollService.processPayrollPeriod(period.id);
      Toast.success(`Payroll for ${monthName} successfully calculated and ready for review!`);
      ModalManager.closeModal();
      this.selectedPeriodId = period.id;
      this.switchTab('review');
    } catch (e) {
      Toast.error(`Execution failed: ${e.message}`);
      if (btn) { btn.disabled = false; btn.textContent = 'Process Payroll Batch'; }
    }
  },

  // 7. VIEW OFFICIAL FORM-16 PAYSLIP MODAL
  async viewRecordPayslip(recordId) {
    try {
      const doc = await db.collection('payrollRecords').doc(recordId).get();
      if (!doc.exists) throw new Error('Payroll record not found');
      const r = doc.data();

      const contentHtml = `
        <div id="printable-payslip-container" style="background: #fff; color: #1e293b; padding: 24px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: sans-serif;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #2563eb; margin-bottom: 16px;">
            <div>
              <h2 style="font-size: 1.3rem; font-weight: 800; color: #1e293b; margin: 0 0 4px 0;">DIALLO INDIA PRIVATE LIMITED</h2>
              <div style="font-size: 0.75rem; color: #64748b;">
                <strong>CIN:</strong> U72900MH2026PTC123456 | <strong>PAN:</strong> AAACD1234E | <strong>GSTIN:</strong> 27AAACD1234E1Z5<br/>
                Regd Office: BKC Innovation Tower, Bandra Kurla Complex, Mumbai, Maharashtra - 400051
              </div>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background: #2563eb; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">
                Payslip — ${r.periodName || 'Monthly Statement'}
              </span>
            </div>
          </div>

          <!-- Employee Details Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.825rem; background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
            <div><strong>Employee Name:</strong> ${r.employeeSnapshot?.fullName || 'Staff'}</div>
            <div><strong>Employee Code:</strong> ${r.employeeSnapshot?.employeeCode || r.employeeId}</div>
            <div><strong>Designation:</strong> ${r.employeeSnapshot?.designation || 'Staff'}</div>
            <div><strong>Department:</strong> ${r.employeeSnapshot?.department || 'General'}</div>
            <div><strong>PAN Number:</strong> ${r.employeeSnapshot?.pan || 'ABCDE1234F'}</div>
            <div><strong>UAN / PF No:</strong> ${r.employeeSnapshot?.uan || '100987654321'}</div>
            <div><strong>Attendance Summary:</strong> ${r.attendanceSnapshot?.presentDays || 0} Present / ${r.attendanceSnapshot?.paidLeaveDays || 0} Leave / ${r.attendanceSnapshot?.lwpDays || 0} LOP</div>
            <div><strong>Bank A/C:</strong> HDFC Bank ••••••4589</div>
          </div>

          <!-- Earnings and Deductions Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 0.825rem; margin-bottom: 16px;">
            <thead>
              <tr style="background: #e2e8f0; color: #1e293b;">
                <th style="padding: 8px; text-align: left; border: 1px solid #cbd5e1; width: 35%;">Earnings</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #cbd5e1; width: 15%;">Amount (₹)</th>
                <th style="padding: 8px; text-align: left; border: 1px solid #cbd5e1; width: 35%;">Deductions</th>
                <th style="padding: 8px; text-align: right; border: 1px solid #cbd5e1; width: 15%;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Basic Salary (50%)</td>
                <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${(r.earnings?.basic || 0).toLocaleString('en-IN')}.00</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Provident Fund (EPF 12%)</td>
                <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${(r.deductions?.epfEmployee || 0).toLocaleString('en-IN')}.00</td>
              </tr>
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">House Rent Allowance (HRA)</td>
                <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${(r.earnings?.hra || 0).toLocaleString('en-IN')}.00</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Employee State Insurance (ESIC)</td>
                <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${(r.deductions?.esicEmployee || 0).toLocaleString('en-IN')}.00</td>
              </tr>
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Special Allowance</td>
                <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${(r.earnings?.specialAllowance || 0).toLocaleString('en-IN')}.00</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Professional Tax (State PT)</td>
                <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${(r.deductions?.professionalTax || 0).toLocaleString('en-IN')}.00</td>
              </tr>
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Overtime / Allowances</td>
                <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${((r.earnings?.overtimePay || 0) + (r.earnings?.conveyance || 0)).toLocaleString('en-IN')}.00</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Income Tax TDS / LOP Deductions</td>
                <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${((r.deductions?.tds || 0) + (r.deductions?.lwpDeduction || 0)).toLocaleString('en-IN')}.00</td>
              </tr>
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td style="padding: 8px; border: 1px solid #cbd5e1;">Total Gross Earnings</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #cbd5e1; color: #2563eb;">₹${(r.earnings?.grossPay || 0).toLocaleString('en-IN')}.00</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">Total Deductions</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #cbd5e1; color: #dc2626;">₹${(r.deductions?.totalDeductions || 0).toLocaleString('en-IN')}.00</td>
              </tr>
            </tbody>
          </table>

          <!-- Net Salary Box -->
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <div style="font-size: 0.75rem; color: #15803d; text-transform: uppercase; font-weight: 700;">Net Payout Amount</div>
              <div style="font-size: 0.8rem; color: #334155;"><strong>In Words:</strong> ${r.netInWords || 'Rupees Only'}</div>
            </div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #16a34a;">
              ₹${(r.netPay || 0).toLocaleString('en-IN')}.00
            </div>
          </div>

          <div style="font-size: 0.7rem; color: #94a3b8; text-align: center;">
            This is a system generated computer document and does not require a physical signature. Diallo HRMS Cloud Suite.
          </div>
        </div>
      `;

      ModalManager.openModal({
        id: 'record-payslip-modal',
        title: `Official Payslip: ${r.employeeSnapshot?.fullName || 'Staff'}`,
        subtitle: `Monthly Statement — ${r.periodName || ''}`,
        size: 'lg',
        contentHtml,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" data-modal-close>Close</button>
          <button class="btn btn-primary btn-sm" onclick="PayrollView.printPayslip()">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print / Save as PDF
          </button>
        `
      });
    } catch (e) {
      Toast.error(e.message);
    }
  },

  printPayslip() {
    const printContent = document.getElementById('printable-payslip-container')?.outerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Diallo HRMS — Employee Payslip</title>
          <style>
            body { margin: 20px; font-family: system-ui, -apple-system, sans-serif; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  },

  openCtcCalculatorModal() {
    ModalManager.openModal({
      id: 'ctc-calc-modal',
      title: 'Indian CTC & Salary Breakdown Calculator',
      subtitle: 'Compliant with Indian Wage Code (Basic >= 50%), EPF, ESIC, State PT, and Section 192 TDS',
      size: 'lg',
      contentHtml: `
        <div class="form-row" style="margin-bottom: 16px;">
          <div class="col-6 form-group">
            <label class="form-label required">Monthly Gross Salary (INR ₹)</label>
            <input type="number" id="calc-monthly-gross" class="form-control" value="65000" oninput="PayrollView.runLiveCalculation()" />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Work Location / State</label>
            <select id="calc-state" class="form-control" onchange="PayrollView.runLiveCalculation()">
              <option value="Maharashtra" selected>Maharashtra (Mumbai / Pune - PT ₹200/mo)</option>
              <option value="Karnataka">Karnataka (Bengaluru - PT ₹200/mo)</option>
              <option value="Telangana">Telangana (Hyderabad - PT ₹200/mo)</option>
              <option value="Delhi">Delhi NCR (PT Exempt)</option>
            </select>
          </div>
        </div>

        <div id="calc-results-container" class="card" style="padding: 16px; background: var(--bg-hover);"></div>
      `,
      footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close</button>`
    });

    setTimeout(() => { this.runLiveCalculation(); }, 50);
  },

  runLiveCalculation() {
    const gross = Number(document.getElementById('calc-monthly-gross')?.value) || 0;
    const state = document.getElementById('calc-state')?.value || 'Maharashtra';
    const container = document.getElementById('calc-results-container');
    if (!container) return;

    const b = StatutoryEngine.calculateSalaryStructure(gross, true, state);

    container.innerHTML = `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--primary); margin-bottom: 8px;">Earnings Structure</h4>
          <div style="font-size: 0.825rem; display: flex; flex-direction: column; gap: 4px;">
            <div class="flex justify-between"><span>Basic Pay (50%):</span><strong>₹${b.earnings.basic.toLocaleString('en-IN')}</strong></div>
            <div class="flex justify-between"><span>HRA (50% of Basic):</span><strong>₹${b.earnings.hra.toLocaleString('en-IN')}</strong></div>
            <div class="flex justify-between"><span>Special Allowance:</span><strong>₹${b.earnings.specialAllowance.toLocaleString('en-IN')}</strong></div>
            <div class="flex justify-between"><span>Conveyance + Medical:</span><strong>₹${(b.earnings.conveyance + b.earnings.medicalAllowance).toLocaleString('en-IN')}</strong></div>
            <div class="flex justify-between" style="border-top: 1px solid var(--border-main); padding-top: 4px; color: var(--primary);">
              <span>Total Monthly Gross:</span><strong>₹${b.gross.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        <div>
          <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--danger); margin-bottom: 8px;">Statutory Deductions</h4>
          <div style="font-size: 0.825rem; display: flex; flex-direction: column; gap: 4px;">
            <div class="flex justify-between"><span>EPF (Employee 12%):</span><strong>-₹${b.deductions.epfEmployee.toLocaleString('en-IN')}</strong></div>
            <div class="flex justify-between"><span>ESIC (Employee 0.75%):</span><strong>-₹${b.deductions.esicEmployee.toLocaleString('en-IN')}</strong></div>
            <div class="flex justify-between"><span>Professional Tax (PT):</span><strong>-₹${b.deductions.professionalTax.toLocaleString('en-IN')}</strong></div>
            <div class="flex justify-between"><span>Projected Monthly TDS:</span><strong>-₹${b.deductions.tds.toLocaleString('en-IN')}</strong></div>
            <div class="flex justify-between" style="border-top: 1px solid var(--border-main); padding-top: 4px; color: var(--danger);">
              <span>Total Deductions:</span><strong>-₹${b.deductions.totalDeductions.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-main);">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Take-Home Net Salary</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--success);">₹${b.netSalary.toLocaleString('en-IN')}/mo</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Annual Cost to Company (CTC)</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--primary);">₹${b.annualCtc.toLocaleString('en-IN')}/yr</div>
        </div>
      </div>
    `;
  }
};

window.PayrollView = PayrollView;
