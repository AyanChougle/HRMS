/**
 * DIALLO HRMS — MASTER HR POLICIES & COMPLIANCE VIEW
 * Core suite featuring:
 * 1. Master HR Policies & Rules (Company Timings, Shift Rules, 25 Compliance Requirements)
 * 2. Deductions List (UL, Sandwich Leave, Late Marks, Break Deductions explained simply)
 * 3. Employee Grievance Helpdesk & Resolution
 * Strictly 0 emojis. Uses simple, polished English throughout.
 */

const ComplianceView = {
  activeTab: 'policies',

  async render() {
    const rawRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    const isHRorAdmin = rawRole === 'SUPER_ADMIN' || rawRole === 'COMPANY_ADMIN' || rawRole === 'HR_MANAGER' || rawRole === 'HR';
    const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';
    const currentEmployeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;

    let grievances = [];
    try {
      if (typeof hrService !== 'undefined' && hrService.getGrievances) {
        grievances = await hrService.getGrievances(companyId, isHRorAdmin ? null : currentEmployeeId);
      }
    } catch (e) {
      console.warn('[ComplianceView] Error loading grievances:', e);
      grievances = [];
    }

    const pendingGrievances = grievances.filter(g => g.status !== 'RESOLVED').length;

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Master HR Policies &amp; Compliance</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Master HR Policies &amp; Compliance</h1>
            <p class="page-subtitle">Official company shift timings, biometric attendance rules, salary deductions schedule, 25 compliance requirements, and employee grievances</p>
          </div>
          <div class="page-actions">
            <a href="tel:9372868617" class="btn btn-secondary btn-sm" title="Call HR Helpline">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span>HR Helpline: 9372868617</span>
            </a>
            <button class="btn btn-primary btn-sm" onclick="ComplianceView.openSubmitGrievanceModal()">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>+ Submit Grievance</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Top Summary Metrics Grid -->
      <div class="kpi-grid">
        <div class="kpi-card" onclick="ComplianceView.switchTab('policies')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Active</span>
          </div>
          <div class="kpi-value">100% Enforced</div>
          <div class="kpi-label">Master HR Policies</div>
          <div class="kpi-subtitle">Diallo India (Ghansoli Mahape)</div>
        </div>

        <div class="kpi-card" onclick="ComplianceView.switchTab('policies')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Daily Shift</span>
          </div>
          <div class="kpi-value">8h Work + 1h Break</div>
          <div class="kpi-label">Shift: 10:00 AM – 07:00 PM</div>
          <div class="kpi-subtitle">6 Days / Week (Monday – Saturday)</div>
        </div>

        <div class="kpi-card" onclick="ComplianceView.switchTab('deductions')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Transparent Rules</span>
          </div>
          <div class="kpi-value">6 Clear Rules</div>
          <div class="kpi-label">Salary Deductions List</div>
          <div class="kpi-subtitle">UL: 2 Days | Sandwich: 3 Days | Late Mark: 4th = Half Day</div>
        </div>

        <div class="kpi-card" onclick="ComplianceView.switchTab('grievances')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
              </svg>
            </div>
            <span class="kpi-trend ${pendingGrievances > 0 ? 'neutral' : 'positive'}">${pendingGrievances} Pending</span>
          </div>
          <div class="kpi-value">${grievances.length} Total</div>
          <div class="kpi-label">Grievance Helpdesk</div>
          <div class="kpi-subtitle">Confidential HR Dispute Resolution</div>
        </div>
      </div>

      <!-- Navigation Tabs: Strictly 3 Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px; overflow-x: auto; white-space: nowrap;">
        <button class="tab-btn ${this.activeTab === 'policies' ? 'active' : ''}" onclick="ComplianceView.switchTab('policies')">
          Master HR Policies &amp; Rules
        </button>
        <button class="tab-btn ${this.activeTab === 'deductions' ? 'active' : ''}" onclick="ComplianceView.switchTab('deductions')">
          Deductions List
        </button>
        <button class="tab-btn ${this.activeTab === 'grievances' ? 'active' : ''}" onclick="ComplianceView.switchTab('grievances')">
          Grievances (${grievances.length})
        </button>
      </div>

      <!-- Active Tab Container -->
      <div class="tab-content">
        ${await this.renderActiveTab(grievances, isHRorAdmin, currentEmployeeId, companyId)}
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    Router.mountView('compliance');
  },

  async renderActiveTab(grievances, isHRorAdmin, currentEmployeeId, companyId) {
    switch (this.activeTab) {
      case 'deductions':
        return this.renderDeductionsTab();
      case 'grievances':
        return this.renderGrievancesTab(grievances, isHRorAdmin);
      case 'policies':
      default:
        return this.renderPoliciesTab();
    }
  },

  // 1. MASTER HR POLICIES & COMPANY OVERVIEW TAB
  renderPoliciesTab() {
    const policies = (typeof complianceService !== 'undefined' && complianceService.getMasterPolicies) 
      ? complianceService.getMasterPolicies() 
      : {};

    const overview = policies.companyOverview || {
      name: 'Diallo % (Diallo India Private Limited)',
      location: 'Ghansoli Mahape, Navi Mumbai',
      workingDays: '6 Days (Monday to Saturday)',
      workingHours: '9 Hours (10:00 AM – 07:00 PM)',
      weeklyOff: 'Sunday and Declared Government Holidays',
      hrContact: '9372868617'
    };

    const timings = policies.timingsAndDressCode || {
      officeTimings: '10:00 AM to 07:00 PM',
      dressCode: 'Monday to Wednesday: Formal | Thursday to Saturday: Casual'
    };

    const att = policies.attendanceRules || {};
    const guidelines = policies.tradingComplianceGuidelines || [];

    return `
      <!-- Company Overview Hero Header -->
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(37,99,235,0.06), rgba(15,23,42,0.02)); border: 1px solid var(--border-main);">
        <div class="card-body" style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span class="badge badge-primary" style="font-weight: 700;">COMPANY OVERVIEW • MASTER FORMAT</span>
                <span class="badge badge-success">Official Policy</span>
              </div>
              <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin: 0 0 6px 0;">${overview.name}</h2>
              <div style="font-size: 0.95rem; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span><strong>Location:</strong> ${overview.location}</span>
              </div>
            </div>

            <!-- HR Contact Card -->
            <div style="background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md); padding: 14px 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              <div>
                <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">HR Official Helpline</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary); font-family: var(--font-family-mono);">${overview.hrContact}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Direct Assistance &amp; Queries</div>
              </div>
            </div>
          </div>

          <!-- Quick Metrics Ribbon -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border-main);">
            <div>
              <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Working Days</div>
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${overview.workingDays}</div>
            </div>
            <div>
              <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Shift Duration</div>
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${overview.workingHours}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">8h Core Work • 1h Break</div>
            </div>
            <div>
              <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Weekly Off</div>
              <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${overview.weeklyOff}</div>
            </div>
            <div>
              <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Dress Code</div>
              <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-main);">${timings.dressCode}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Core Policies Grid (Explained in Simple English) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px; margin-bottom: 24px;">
        
        <!-- 1. Office Timings & Biometric Rules -->
        <div class="card">
          <div class="card-header" style="border-left: 4px solid var(--primary);">
            <div>
              <div class="card-title">Office Timings &amp; Attendance Rules</div>
              <div class="card-subtitle">Daily punctuality standards and reporting policies</div>
            </div>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-main);">
                <span class="text-muted">Standard Working Hours:</span>
                <strong style="color: var(--text-main);">10:00 AM to 07:00 PM (9 Hours Total)</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-main);">
                <span class="text-muted">Morning Grace Period:</span>
                <strong style="color: var(--success);">10:00 AM to 10:10 AM (10 Minutes)</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-main);">
                <span class="text-muted">Late Mark Recorded From:</span>
                <strong style="color: #d97706;">10:10:01 AM onwards</strong>
              </div>
              <div style="background: rgba(217, 119, 6, 0.08); border-left: 3px solid #d97706; padding: 10px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; line-height: 1.45;">
                <strong>Late Mark Allowance:</strong> You receive up to <strong>3 late marks per month</strong> without any salary deduction. Starting from the <strong>4th late mark</strong> in the same month, a <strong>Half-Day salary deduction</strong> applies.
              </div>
              <div style="background: rgba(220, 38, 38, 0.08); border-left: 3px solid var(--danger); padding: 10px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; line-height: 1.45;">
                <strong>Reporting After 11:10 AM:</strong> Arriving after 11:10 AM is automatically recorded as a <strong>Half Day</strong>, and half-day salary is deducted.
              </div>
              <div style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.5; margin-top: 4px;">
                <strong>Attendance Lockout:</strong> When you punch out for the day, your attendance locks until <strong>09:30 AM next working morning</strong>. Any correction requests must be emailed on the next working day with Reporting Manager approval.
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Break Timings & Target Hours -->
        <div class="card">
          <div class="card-header" style="border-left: 4px solid var(--success);">
            <div>
              <div class="card-title">Daily Break Timings &amp; 8h Core Work</div>
              <div class="card-subtitle">Break entitlement and work duration tracking</div>
            </div>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-main);">
                <span class="text-muted">Total Break Allowance:</span>
                <strong style="color: var(--primary);">1 Hour (60 Minutes) Total per day</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-main);">
                <span class="text-muted">Target Productive Work:</span>
                <strong style="color: var(--success);">8 Hours Core Productive Time</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-main);">
                <span class="text-muted">Full Shift Duration:</span>
                <strong style="color: var(--text-main);">9 Hours Elapsed (10:00 AM – 07:00 PM)</strong>
              </div>
              <div style="background: rgba(37, 99, 235, 0.08); border-left: 3px solid var(--primary); padding: 10px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; line-height: 1.45;">
                <strong>Break Structure:</strong> The 1-hour break can be divided between lunch and short refreshment breaks during the shift.
              </div>
              <div style="background: rgba(220, 38, 38, 0.08); border-left: 3px solid var(--danger); padding: 10px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; line-height: 1.45;">
                <strong>Excess Breaks:</strong> If total break time exceeds 1 hour (60 minutes), the timer border changes to alert status, productive work drops below 8 hours, and non-worked hours are subject to salary adjustment.
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Leave Application & Approval Rules -->
        <div class="card">
          <div class="card-header" style="border-left: 4px solid #d97706;">
            <div>
              <div class="card-title">Leave Application &amp; Approval Process</div>
              <div class="card-subtitle">Advance notice requirements and leave policies</div>
            </div>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-main);">
                <span class="text-muted">Notice for 1-Day Leave:</span>
                <strong style="color: var(--text-main);">Apply at least 24 hours in advance</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-main);">
                <span class="text-muted">Notice for Multi-Day Leave:</span>
                <strong style="color: var(--text-main);">Apply at least 3 days in advance</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-main);">
                <span class="text-muted">Applicable Leave Type:</span>
                <strong style="color: var(--primary);">Paid Leave (PL)</strong>
              </div>
              <div style="background: rgba(220, 38, 38, 0.08); border-left: 3px solid var(--danger); padding: 10px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; line-height: 1.45;">
                <strong>Unauthorized Leave (UL):</strong> Taking leave without informing or without prior approval from HR and Reporting Manager is marked as UL. <strong>2 Days of salary will be deducted</strong> for every unauthorized day.
              </div>
              <div style="background: rgba(217, 119, 6, 0.08); border-left: 3px solid #d97706; padding: 10px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; line-height: 1.45;">
                <strong>Sandwich Leave Rule:</strong> Taking leave on Saturday and Monday (or before and after a Sunday/holiday) causes the intervening holiday to count as leave, resulting in <strong>3 Days of salary deduction</strong>.
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Workplace Conduct, Privacy & Exit Policy -->
        <div class="card">
          <div class="card-header" style="border-left: 4px solid #8b5cf6;">
            <div>
              <div class="card-title">Conduct, Data Privacy &amp; Resignation</div>
              <div class="card-subtitle">Professional ethics, data security, and notice period rules</div>
            </div>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.88rem; line-height: 1.45;">
              <div>
                <strong style="color: var(--text-main);">Workplace Discipline:</strong>
                <span style="color: var(--text-secondary);"> All staff must treat colleagues and clients with respect. Rudeness, abusive language, discrimination, and harassment carry immediate zero-tolerance disciplinary action.</span>
              </div>
              <div>
                <strong style="color: var(--text-main);">Client &amp; Company Confidentiality:</strong>
                <span style="color: var(--text-secondary);"> Never share client contact numbers, trade data, internal documents, or financial information with outside parties or unauthorized colleagues.</span>
              </div>
              <div>
                <strong style="color: var(--text-main);">Personal Mobile Usage:</strong>
                <span style="color: var(--text-secondary);"> Limit personal phone use during working hours. Photography or videography of office computer screens and confidential material is strictly forbidden.</span>
              </div>
              <div style="background: var(--bg-hover); padding: 10px 12px; border-radius: var(--radius-sm);">
                <strong style="color: var(--text-main);">Notice Period &amp; Exit:</strong>
                <div style="color: var(--text-secondary); margin-top: 4px;">
                  - Service under 6 months: <strong>15 days notice period</strong>.<br>
                  - Service 6 months or above: <strong>30 days notice period</strong>.<br>
                  - Full &amp; Final (F&amp;F) settlement and Relieving/Experience Letter are processed after 60 days following complete asset return.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Diallo Official Compliance Guidelines (25 Mandatory Requirements) -->
      <div class="card" id="compliance-guidelines-section">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--primary);">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span>Diallo Official Compliance Guidelines (25 Mandatory Requirements)</span>
            </div>
            <div class="card-subtitle">Regulatory standards, trade levels protocol, customer communication rules, and ethical standards</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="compliance-search-input" class="form-control form-control-sm" placeholder="Search guidelines..." style="width: 220px;" oninput="ComplianceView.filterGuidelines(this.value)" />
          </div>
        </div>
        <div class="table-container">
          <table class="data-table" id="compliance-guidelines-table">
            <thead>
              <tr>
                <th style="width: 70px; text-align: center;">Sr. No.</th>
                <th style="width: 240px;">Compliance Category</th>
                <th>Guideline / Requirement</th>
              </tr>
            </thead>
            <tbody>
              ${guidelines.map(g => `
                <tr class="guideline-row" data-category="${g.category.toLowerCase()}" data-text="${g.guideline.toLowerCase()}">
                  <td style="font-weight: 700; color: var(--text-muted); text-align: center;">${g.id}</td>
                  <td>
                    <span class="badge badge-primary" style="font-size: 0.82rem; font-weight: 600;">${g.category}</span>
                  </td>
                  <td style="color: var(--text-main); font-size: 0.88rem; line-height: 1.5; font-weight: 500;">
                    ${g.guideline}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 2. DEDUCTIONS LIST TAB
  renderDeductionsTab() {
    const policies = (typeof complianceService !== 'undefined' && complianceService.getMasterPolicies) 
      ? complianceService.getMasterPolicies() 
      : {};

    const deductions = policies.deductionsList || [
      {
        id: 'UL',
        title: 'Unauthorized Leave (UL)',
        penalty: '2 Days Salary Deduction per occurrence',
        condition: 'Absence without prior written notification or approval from HR / Reporting Manager.',
        explanation: 'Failing to report to work without prior approval is recorded as Unauthorized Leave (UL). Each unauthorized day results in exactly 2 days of salary deduction. Repeated occurrences will result in disciplinary action up to immediate termination.',
        severity: 'HIGH'
      },
      {
        id: 'SANDWICH',
        title: 'Sandwich Leave Policy',
        penalty: '3 Days Salary Deduction',
        condition: 'Taking leave on both Saturday and Monday, or bridging Sunday / official holidays with unsanctioned leave.',
        explanation: 'When leave is taken on both the day preceding and following a weekly off (Saturday and Monday), the intervening Sunday is legally counted as leave, resulting in a total of 3 days of salary deduction.',
        severity: 'HIGH'
      },
      {
        id: 'LATE_MARK',
        title: 'Late Marks (Punctuality Penalty)',
        penalty: '4th Late Mark = Half-Day Salary Deduction',
        condition: 'Reporting to work between 10:10:01 AM and 11:10:00 AM (past the 10-minute grace period).',
        explanation: 'Up to 3 late marks in a single calendar month are permitted as grace with zero penalty. From the 4th late mark onwards in the same month, each late mark incurs a Half-Day (0.5 day) salary deduction.',
        severity: 'MEDIUM'
      },
      {
        id: 'CUTOFF_LATE',
        title: 'Reporting After 11:10 AM',
        penalty: 'Automatic Half-Day Salary Deduction',
        condition: 'Punching in past 11:10:00 AM (more than 70 minutes after official shift start).',
        explanation: 'Arrival after 11:10 AM is automatically categorized as Half-Day work. The afternoon shift must still be completed until 07:00 PM.',
        severity: 'MEDIUM'
      },
      {
        id: 'EXCESS_BREAK',
        title: 'Excessive Breaks (>60 Minutes)',
        penalty: 'Non-Work Hour Deduction & Timecard Correction',
        condition: 'Taking more than 1 hour (60 minutes) total break time during the 10:00 AM to 07:00 PM shift.',
        explanation: 'The daily shift consists of 8 hours of productive work and 1 hour of break. Any break time exceeding 60 minutes reduces productive work below 8 hours and is subject to proportional pay deduction or attendance warnings.',
        severity: 'LOW'
      },
      {
        id: 'EARLY_EXIT',
        title: 'Early Departure Without Permission',
        penalty: 'Half-Day Salary Deduction',
        condition: 'Punching out before 07:00 PM without prior manager authorization or half-day approval.',
        explanation: 'Employees must complete their full shift until 07:00 PM. Leaving early without authorization triggers an early departure violation.',
        severity: 'MEDIUM'
      }
    ];

    return `
      <!-- Header Banner -->
      <div class="card" style="margin-bottom: 24px; border-left: 4px solid var(--danger); background: linear-gradient(135deg, rgba(220,38,38,0.04), rgba(15,23,42,0.01));">
        <div class="card-body" style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span class="badge badge-danger" style="font-weight: 700;">OFFICIAL SALARY DEDUCTIONS SCHEDULE</span>
                <span class="badge badge-neutral">Enforced Monthly</span>
              </div>
              <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-main); margin: 0 0 6px 0;">Salary Deductions &amp; Attendance Penalties</h2>
              <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 650px; line-height: 1.5; margin: 0;">
                All salary deductions at Diallo India Private Limited are governed strictly by transparent, objective attendance records. Review the official rules below to understand how Unauthorized Leaves, Sandwich Leaves, Late Marks, and Break Times affect monthly compensation.
              </p>
            </div>
            <div style="background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md); padding: 14px 20px; text-align: right;">
              <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">Payroll &amp; Attendance Support</div>
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--primary); font-family: var(--font-family-mono);">9372868617</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">Direct HR Queries &amp; Adjustments</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Deductions Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 18px; margin-bottom: 24px;">
        ${deductions.map(d => `
          <div class="card" style="border-top: 4px solid ${d.severity === 'HIGH' ? 'var(--danger)' : (d.severity === 'MEDIUM' ? '#d97706' : 'var(--primary)')};">
            <div class="card-header" style="padding-bottom: 10px;">
              <div>
                <div class="card-title" style="font-size: 1.05rem;">${d.title}</div>
                <div style="font-size: 0.85rem; font-weight: 700; color: ${d.severity === 'HIGH' ? 'var(--danger)' : (d.severity === 'MEDIUM' ? '#d97706' : 'var(--primary)')}; margin-top: 4px;">
                  Penalty: ${d.penalty}
                </div>
              </div>
              <span class="badge ${d.severity === 'HIGH' ? 'badge-danger' : (d.severity === 'MEDIUM' ? 'badge-warning' : 'badge-primary')}">${d.severity}</span>
            </div>
            <div class="card-body">
              <div style="margin-bottom: 12px; font-size: 0.85rem;">
                <strong style="color: var(--text-main);">Trigger Condition:</strong>
                <div style="color: var(--text-secondary); margin-top: 2px;">${d.condition}</div>
              </div>
              <div style="background: var(--bg-hover); padding: 10px 12px; border-radius: var(--radius-sm); font-size: 0.835rem; color: var(--text-main); line-height: 1.45;">
                ${d.explanation}
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Summary Deductions Comparison Matrix -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Salary Deductions Reference Matrix</div>
            <div class="card-subtitle">Quick reference of violation triggers, salary deduction impacts, and allowed grace</div>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">Sr.</th>
                <th>Deduction Name</th>
                <th>Violation / Trigger</th>
                <th>Salary Deduction Impact</th>
                <th>Grace / Exception Allowance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 700; color: var(--text-muted); text-align: center;">1</td>
                <td><strong style="color: var(--danger);">Unauthorized Leave (UL)</strong></td>
                <td>Absence without prior notice or HR approval</td>
                <td><span class="badge badge-danger">2 Days Salary Deduction</span></td>
                <td>None (Requires advance approval)</td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--text-muted); text-align: center;">2</td>
                <td><strong style="color: #b45309;">Sandwich Leave Rule</strong></td>
                <td>Leave on both Saturday and Monday (spanning Sunday/holiday)</td>
                <td><span class="badge badge-danger">3 Days Salary Deduction</span></td>
                <td>Intervening Sunday treated as leave</td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--text-muted); text-align: center;">3</td>
                <td><strong style="color: #d97706;">Late Marks (10:10 AM – 11:10 AM)</strong></td>
                <td>Reporting past 10:10 AM grace window</td>
                <td><span class="badge badge-warning">4th Late Mark = Half-Day Deduction</span></td>
                <td>1st to 3rd late marks in month are free</td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--text-muted); text-align: center;">4</td>
                <td><strong style="color: #d97706;">Late Arrival Past 11:10 AM</strong></td>
                <td>Reporting more than 70 minutes after shift start</td>
                <td><span class="badge badge-warning">Automatic Half-Day Deduction</span></td>
                <td>None (Marked as Half Day automatically)</td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--text-muted); text-align: center;">5</td>
                <td><strong style="color: var(--primary);">Excess Break Duration</strong></td>
                <td>Total break time exceeds 60 minutes</td>
                <td><span class="badge badge-neutral">Non-Work Hours Reduction</span></td>
                <td>60 Minutes total break included in 9h shift</td>
              </tr>
              <tr>
                <td style="font-weight: 700; color: var(--text-muted); text-align: center;">6</td>
                <td><strong style="color: #d97706;">Early Departure Before 07:00 PM</strong></td>
                <td>Punching out before shift end without prior approval</td>
                <td><span class="badge badge-warning">Half-Day Deduction</span></td>
                <td>Must be pre-approved by Reporting Manager</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 3. GRIEVANCES TAB
  renderGrievancesTab(grievances, isHRorAdmin) {
    return `
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div class="card-title">Employee Grievance Helpdesk (${grievances.length})</div>
            <div class="card-subtitle">Confidential workplace, payroll, and interpersonal dispute resolution channel</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ComplianceView.openSubmitGrievanceModal()">+ Submit Grievance</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Grievance Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Submitted On</th>
                <th>Status</th>
                <th>Resolution Notes</th>
                ${isHRorAdmin ? '<th>Action</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${grievances.length === 0 ? `
                <tr><td colspan="${isHRorAdmin ? 7 : 6}" class="text-center text-muted" style="padding: 32px;">No grievances submitted.</td></tr>
              ` : grievances.map(g => `
                <tr>
                  <td>
                    <div class="font-semibold text-main">${g.title}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${g.description?.slice(0, 60)}...</div>
                  </td>
                  <td><span class="badge badge-neutral">${g.category || 'General'}</span></td>
                  <td>
                    <span class="badge ${g.priority === 'URGENT' ? 'badge-danger' : (g.priority === 'HIGH' ? 'badge-warning' : 'badge-neutral')}">
                      ${g.priority || 'NORMAL'}
                    </span>
                  </td>
                  <td>${g.submittedAt ? new Date(g.submittedAt.seconds ? g.submittedAt.seconds * 1000 : g.submittedAt).toLocaleDateString() : 'Recent'}</td>
                  <td>
                    <span class="badge ${g.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}">
                      ${g.status || 'SUBMITTED'}
                    </span>
                  </td>
                  <td><span class="text-muted" style="font-size: 0.8rem;">${g.resolutionNotes || 'In review by HR Ethics Committee'}</span></td>
                  ${isHRorAdmin ? `
                    <td>
                      ${g.status !== 'RESOLVED' ? `
                        <button class="btn btn-soft btn-sm" onclick="ComplianceView.openResolveGrievanceModal('${g.id}')">Resolve</button>
                      ` : '<span class="text-muted" style="font-size: 0.8rem;">Closed</span>'}
                    </td>
                  ` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  filterGuidelines(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#compliance-guidelines-table .guideline-row');
    rows.forEach(r => {
      const cat = r.getAttribute('data-category') || '';
      const text = r.getAttribute('data-text') || '';
      if (!q || cat.includes(q) || text.includes(q)) {
        r.style.display = '';
      } else {
        r.style.display = 'none';
      }
    });
  },

  // GRIEVANCE MODALS
  openSubmitGrievanceModal() {
    ModalManager.openModal({
      id: 'submit-grievance-modal',
      title: 'Submit Confidential Grievance',
      subtitle: 'Report a workplace, compensation, or organizational issue securely',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Grievance Subject</label>
          <input type="text" id="gr-title" class="form-control" placeholder="Brief subject..." required />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label required">Category</label>
            <select id="gr-cat" class="form-control">
              <option value="WORKPLACE_ENVIRONMENT" selected>Workplace Environment</option>
              <option value="PAYROLL_EXPENSE">Payroll &amp; Reimbursements</option>
              <option value="MANAGEMENT_RELATION">Management &amp; Interpersonal</option>
              <option value="POLICY_CONCERN">Policy Interpretation</option>
              <option value="OTHER">Other Query</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Priority</label>
            <select id="gr-pri" class="form-control">
              <option value="NORMAL" selected>Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Detailed Description</label>
          <textarea id="gr-desc" class="form-control" rows="4" placeholder="Provide factual description and dates of the concern..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitGrievance()">Submit Grievance</button>
      `
    });
  },

  async submitGrievance() {
    const title = document.getElementById('gr-title')?.value;
    const description = document.getElementById('gr-desc')?.value;
    if (!title || !description) {
      Toast.error('Please provide title and description.');
      return;
    }

    try {
      if (typeof hrService !== 'undefined' && hrService.createGrievance) {
        await hrService.createGrievance({
          title,
          description,
          category: document.getElementById('gr-cat')?.value || 'WORKPLACE_ENVIRONMENT',
          priority: document.getElementById('gr-pri')?.value || 'NORMAL'
        });
      }
      Toast.success('Grievance logged securely with HR Ethics Committee.');
      ModalManager.closeModal('submit-grievance-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openResolveGrievanceModal(id) {
    ModalManager.openModal({
      id: 'resolve-grievance-modal',
      title: 'Resolve &amp; Close Grievance',
      subtitle: 'Provide formal committee resolution notes',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Formal Resolution Summary</label>
          <textarea id="gr-res-notes" class="form-control" rows="3" placeholder="Corrective actions taken and committee conclusion..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitResolveGrievance('${id}')">Finalize Resolution</button>
      `
    });
  },

  async submitResolveGrievance(id) {
    const notes = document.getElementById('gr-res-notes')?.value;
    if (!notes) {
      Toast.error('Please enter resolution summary.');
      return;
    }

    try {
      if (typeof hrService !== 'undefined' && hrService.resolveGrievance) {
        await hrService.resolveGrievance(id, notes);
      }
      Toast.success('Grievance closed with formal resolution.');
      ModalManager.closeModal('resolve-grievance-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  }
};

window.ComplianceView = ComplianceView;
