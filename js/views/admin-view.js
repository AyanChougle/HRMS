/**
 * DIALLO HRMS — COMPANY & ORGANIZATION ADMINISTRATION VIEW (PHASE 15)
 * Centralized Suite managing Company Profiles, Branches, Departments, Designations,
 * Shifts, Holidays, Policies, Leave Types, Work Locations, and System Configuration.
 */

const AdminView = {
  activeTab: 'company',

  async renderHub() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isAuthorized = role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || role === 'HR_MANAGER' || role === 'HR';

    if (!isAuthorized) {
      return `
        <div class="card" style="padding: 48px; text-align: center;">
          <h2 style="color: var(--danger); margin-bottom: 8px;">Access Restricted</h2>
          <p class="text-secondary">You do not have administrative privileges to manage organization configuration.</p>
        </div>
      `;
    }

    const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';

    let [company, branches, departments, designations, jobLevels, shifts, holidays, policies, leaveTypes, settings, employees] = await Promise.all([
      organizationService.getCompany(companyId),
      organizationService.getBranches(companyId),
      organizationService.getDepartments(companyId),
      organizationService.getDesignations(companyId),
      organizationService.getJobLevels(companyId),
      organizationService.getShifts(companyId),
      organizationService.getHolidays(companyId),
      organizationService.getPolicies(companyId),
      organizationService.getLeaveTypes(companyId),
      settingsService.getCompanySettings(companyId),
      employeeService.getAllEmployees(companyId)
    ]);

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Administration</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Company & Organization Administration</h1>
            <p class="page-subtitle">Configure legal entities, multi-branch architecture, departments, designations, shifts, holidays, and policies</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="AdminView.openQuickAddModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Quick Configuration
            </button>
          </div>
        </div>
      </div>

      <!-- Top Summary Metrics Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Network</span>
          </div>
          <div class="kpi-value">${branches.length}</div>
          <div class="kpi-label">Active Branches</div>
          <div class="kpi-subtitle">${branches.filter(b => b.status === 'ACTIVE').length} Operational Locations</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Structure</span>
          </div>
          <div class="kpi-value">${departments.length}</div>
          <div class="kpi-label">Departments</div>
          <div class="kpi-subtitle">${designations.length} Distinct Designations</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Roster</span>
          </div>
          <div class="kpi-value">${shifts.length}</div>
          <div class="kpi-label">Configured Shifts</div>
          <div class="kpi-subtitle">${shifts.filter(s => s.isOvernight).length} Overnight Shifts</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Governance</span>
          </div>
          <div class="kpi-value">${policies.length}</div>
          <div class="kpi-label">HR Policies</div>
          <div class="kpi-subtitle">${holidays.length} Annual Holidays</div>
        </div>
      </div>

      <!-- Navigation Tabs (10 Tabs) -->
      <div class="tabs-nav" style="margin-bottom: 20px; overflow-x: auto; white-space: nowrap;">
        <button class="tab-btn ${this.activeTab === 'company' ? 'active' : ''}" onclick="AdminView.switchTab('company')">
          Company Profile
        </button>
        <button class="tab-btn ${this.activeTab === 'branches' ? 'active' : ''}" onclick="AdminView.switchTab('branches')">
          Branches (${branches.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'departments' ? 'active' : ''}" onclick="AdminView.switchTab('departments')">
          Departments (${departments.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'designations' ? 'active' : ''}" onclick="AdminView.switchTab('designations')">
          Designations & Levels (${designations.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'shifts' ? 'active' : ''}" onclick="AdminView.switchTab('shifts')">
          Shifts & Hours (${shifts.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'holidays' ? 'active' : ''}" onclick="AdminView.switchTab('holidays')">
          Holiday Calendar (${holidays.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'policies' ? 'active' : ''}" onclick="AdminView.switchTab('policies')">
          HR Policies (${policies.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'leave-types' ? 'active' : ''}" onclick="AdminView.switchTab('leave-types')">
          Leave Types (${leaveTypes.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'orgchart' ? 'active' : ''}" onclick="AdminView.switchTab('orgchart')">
          Org Hierarchy Chart
        </button>
        <button class="tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" onclick="AdminView.switchTab('settings')">
          System Defaults
        </button>
      </div>

      <!-- Active Tab Container -->
      <div class="tab-content">
        ${this.renderActiveTab(company, branches, departments, designations, jobLevels, shifts, holidays, policies, leaveTypes, settings, employees)}
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    Router.mountView('admin');
  },

  renderActiveTab(company, branches, departments, designations, jobLevels, shifts, holidays, policies, leaveTypes, settings, employees) {
    switch (this.activeTab) {
      case 'branches': return this.renderBranchesTab(branches, employees);
      case 'departments': return this.renderDepartmentsTab(departments, employees);
      case 'designations': return this.renderDesignationsTab(designations, jobLevels, departments);
      case 'shifts': return this.renderShiftsTab(shifts, settings);
      case 'holidays': return this.renderHolidaysTab(holidays, branches);
      case 'policies': return this.renderPoliciesTab(policies);
      case 'leave-types': return this.renderLeaveTypesTab(leaveTypes);
      case 'orgchart': return this.renderOrgChartTab(employees, departments, branches);
      case 'settings': return this.renderSettingsTab(settings);
      default: return this.renderCompanyProfileTab(company, settings);
    }
  },

  // 1. COMPANY PROFILE TAB
  renderCompanyProfileTab(company, settings) {
    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Legal Entity Details -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Corporate Legal Identity</div>
              <div class="card-subtitle">Registered name, registration number, and tax details</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="AdminView.openEditCompanyModal()">Edit Profile</button>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3" style="font-size: 0.88rem;">
              <div class="flex justify-between">
                <span class="text-muted">Company Name:</span>
                <strong>${company.name || '-'}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Legal Registered Name:</span>
                <strong>${company.legalName || '-'}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Entity Code:</span>
                <code>${company.code || '-'}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">CIN / Registration No:</span>
                <code>${company.registrationNumber || company.cin || '-'}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Tax / GSTIN Number:</span>
                <code>${company.taxGstNumber || company.gstin || '-'}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Permanent Account No (PAN):</span>
                <code>${company.pan || '-'}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Industry Domain:</span>
                <span>${company.industry || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Regional, Timezone & Formatting -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Regional & Localization Formats</div>
              <div class="card-subtitle">Timezone, currency, date/time standards, and financial year</div>
            </div>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3" style="font-size: 0.88rem;">
              <div class="flex justify-between">
                <span class="text-muted">Default Timezone:</span>
                <strong>${company.timezone || 'Asia/Kolkata'}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Operating Currency:</span>
                <strong>${company.currency || 'INR'}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Display Date Format:</span>
                <code>${company.dateFormat || 'DD/MM/YYYY'}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Display Time Format:</span>
                <code>${company.timeFormat || '12-hour'}</code>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Week Starts On:</span>
                <strong>${company.weekStartDay || 'Monday'}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Financial Year Cycle:</span>
                <strong>1st April – 31st March (${company.financialYearStart || '01/04'})</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Official Contact:</span>
                <span>${company.email || '-'} • ${company.phone || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 2. BRANCHES TAB
  renderBranchesTab(branches, employees) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Operating Regional Branches (${branches.length})</div>
            <div class="card-subtitle">Physical office facilities, regional centers, and branch managers</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminView.openAddBranchModal()">+ Add Branch</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Branch Code</th>
                <th>City & State</th>
                <th>Timezone</th>
                <th>Contact Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${branches.map(b => `
                <tr>
                  <td>
                    <div class="font-semibold text-main">${b.name}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${b.address || ''}</div>
                  </td>
                  <td><code style="font-family: monospace; color: var(--primary);">${b.code}</code></td>
                  <td>${b.city || '-'}, ${b.state || '-'}</td>
                  <td><span class="badge badge-neutral">${b.timezone || 'Asia/Kolkata'}</span></td>
                  <td>${b.phone || '-'}</td>
                  <td>
                    <span class="badge ${b.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}">
                      ${b.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-1">
                      <button class="btn btn-soft btn-sm" onclick="AdminView.openEditBranchModal('${b.id}')">Edit</button>
                      ${b.status === 'ACTIVE' ? `
                        <button class="btn btn-secondary btn-sm" onclick="AdminView.toggleBranchStatus('${b.id}', 'INACTIVE')">Deactivate</button>
                      ` : `
                        <button class="btn btn-primary btn-sm" onclick="AdminView.toggleBranchStatus('${b.id}', 'ACTIVE')">Activate</button>
                      `}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 3. DEPARTMENTS TAB
  renderDepartmentsTab(departments, employees) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Departments & Sub-Divisions (${departments.length})</div>
            <div class="card-subtitle">Functional divisions, parent-child hierarchies, and designated department heads</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminView.openAddDepartmentModal()">+ Add Department</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Dept Code</th>
                <th>Department Head</th>
                <th>Parent Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${departments.map(d => {
                const parent = departments.find(p => p.id === d.parentDepartmentId);
                return `
                  <tr>
                    <td>
                      <div class="font-semibold text-main">${d.name}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${d.description || ''}</div>
                    </td>
                    <td><code style="font-family: monospace; color: var(--primary);">${d.code}</code></td>
                    <td>${d.headEmployeeName || 'Not Designated'}</td>
                    <td>${parent ? parent.name : 'Top Level'}</td>
                    <td>
                      <span class="badge ${d.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}">
                        ${d.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-soft btn-sm" onclick="AdminView.openEditDepartmentModal('${d.id}')">Edit</button>
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

  // 4. DESIGNATIONS & JOB LEVELS TAB
  renderDesignationsTab(designations, jobLevels, departments) {
    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Job Levels (L1 to L6) -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Standard Job Levels (${jobLevels.length})</div>
              <div class="card-subtitle">Career progression bands and seniority matrix</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="AdminView.openAddJobLevelModal()">+ Add Level</button>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Level Code</th>
                  <th>Level Title</th>
                  <th>Rank</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${jobLevels.map(l => `
                  <tr>
                    <td><code style="font-family: monospace; font-weight: 700; color: var(--primary);">${l.code}</code></td>
                    <td><strong>${l.name}</strong></td>
                    <td><span class="badge badge-neutral">Rank ${l.rank}</span></td>
                    <td><span class="text-muted" style="font-size: 0.8rem;">${l.description || '-'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Designations Master -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Job Designations (${designations.length})</div>
              <div class="card-subtitle">Functional titles and departmental associations</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="AdminView.openAddDesignationModal()">+ Add Designation</button>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                ${designations.map(d => `
                  <tr>
                    <td><strong>${d.name}</strong></td>
                    <td><code>${d.code}</code></td>
                    <td>${d.departmentName || d.departmentId || 'General'}</td>
                    <td><span class="badge badge-neutral">${d.levelName || d.levelId || 'L2'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // 5. SHIFTS & WORKING HOURS TAB
  renderShiftsTab(shifts, settings) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Work Shifts & Timings (${shifts.length})</div>
            <div class="card-subtitle">General, morning, afternoon, and overnight cross-midnight shifts</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminView.openAddShiftModal()">+ Add Shift</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Shift Name</th>
                <th>Shift Code</th>
                <th>Working Hours</th>
                <th>Break Time</th>
                <th>Grace Period</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${shifts.map(s => `
                <tr>
                  <td><strong>${s.name}</strong></td>
                  <td><code>${s.code}</code></td>
                  <td>
                    <span class="font-semibold">${s.startTime} – ${s.endTime}</span>
                    <span class="text-muted" style="font-size: 0.75rem; display: block;">${s.workingHours} Net Hours</span>
                  </td>
                  <td>${s.breakDuration || 60} Mins</td>
                  <td>${s.gracePeriod || 15} Mins</td>
                  <td>
                    <span class="badge ${s.isOvernight ? 'badge-warning' : 'badge-neutral'}">
                      ${s.isOvernight ? 'Overnight (Next Day)' : 'Standard Day'}
                    </span>
                  </td>
                  <td><span class="badge badge-success">${s.status || 'ACTIVE'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 6. HOLIDAY CALENDAR TAB
  renderHolidaysTab(holidays, branches) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Annual Holiday Schedule (${holidays.length} Holidays)</div>
            <div class="card-subtitle">Public, national, and branch-specific regional state holidays</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminView.openAddHolidayModal()">+ Add Holiday</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Holiday Title</th>
                <th>Date</th>
                <th>Type</th>
                <th>Applicable Branches</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${holidays.map(h => `
                <tr>
                  <td><strong>${h.name}</strong></td>
                  <td><code style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">${h.date}</code></td>
                  <td>
                    <span class="badge ${h.type === 'PUBLIC' ? 'badge-primary' : (h.type === 'REGIONAL' ? 'badge-warning' : 'badge-neutral')}">
                      ${h.type || 'PUBLIC'}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-neutral">
                      ${h.branchIds?.includes('ALL') ? 'All Company Branches' : (h.branchIds || []).join(', ')}
                    </span>
                  </td>
                  <td><span class="text-muted" style="font-size: 0.8rem;">${h.description || '-'}</span></td>
                  <td>
                    <button class="btn btn-danger btn-sm" onclick="AdminView.deleteHoliday('${h.id}')">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 7. HR POLICIES TAB
  renderPoliciesTab(policies) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Corporate Governance & HR Policies (${policies.length})</div>
            <div class="card-subtitle">Official policy documents, versioning history, and compliance circulars</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminView.openAddPolicyModal()">+ Publish Policy</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Policy Title</th>
                <th>Category</th>
                <th>Version</th>
                <th>Effective Date</th>
                <th>Status</th>
                <th>Attachment</th>
              </tr>
            </thead>
            <tbody>
              ${policies.map(p => `
                <tr>
                  <td>
                    <div class="font-semibold text-main">${p.title}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${p.description || ''}</div>
                  </td>
                  <td><span class="badge badge-neutral">${p.category}</span></td>
                  <td><code>${p.version}</code></td>
                  <td>${p.effectiveDate}</td>
                  <td><span class="badge badge-success">${p.status}</span></td>
                  <td>
                    ${p.documentUrl ? `
                      <a href="${p.documentUrl}" target="_blank" class="btn btn-soft btn-sm">Download PDF</a>
                    ` : '<span class="text-muted" style="font-size: 0.8rem;">Text Circular</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 8. LEAVE TYPES TAB
  renderLeaveTypesTab(leaveTypes) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Configured Leave Types & Statutory Quotas (${leaveTypes.length})</div>
            <div class="card-subtitle">Annual allocations, carry-forward caps, and document validation rules</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="AdminView.openAddLeaveTypeModal()">+ Add Leave Type</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Code</th>
                <th>Annual Quota</th>
                <th>Compensation</th>
                <th>Carry Forward</th>
                <th>Doctor Note</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${leaveTypes.map(lt => `
                <tr>
                  <td><strong>${lt.name}</strong></td>
                  <td><code>${lt.code}</code></td>
                  <td><strong>${lt.annualAllocation} Days / Year</strong></td>
                  <td><span class="badge ${lt.paid ? 'badge-success' : 'badge-warning'}">${lt.paid ? 'PAID' : 'UNPAID'}</span></td>
                  <td>${lt.carryForwardAllowed ? `Yes (Max ${lt.maximumCarryForward} Days)` : 'No'}</td>
                  <td>${lt.requiresDocument ? 'Mandatory' : 'Optional'}</td>
                  <td><span class="badge badge-success">${lt.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 9. ORG HIERARCHY CHART TAB
  renderOrgChartTab(employees, departments, branches) {
    const tree = orgChartService.getOrganizationTree(employees);

    const renderNode = (node) => `
      <div class="org-node" style="display: inline-block; margin: 8px; vertical-align: top; text-align: center;">
        <div class="card" style="padding: 12px 16px; min-width: 180px; display: inline-block; cursor: pointer; text-align: center;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary-light); color: var(--primary); margin: 0 auto 6px auto; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem;">
            ${(node.name || 'EM').substring(0, 2).toUpperCase()}
          </div>
          <div class="font-bold text-main" style="font-size: 0.85rem;">${node.name}</div>
          <div class="text-secondary" style="font-size: 0.75rem;">${node.designation}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${node.department}</div>
        </div>
        ${node.children && node.children.length > 0 ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 2px dashed var(--border-main); display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
            ${node.children.map(renderNode).join('')}
          </div>
        ` : ''}
      </div>
    `;

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Live Organization Reporting Hierarchy</div>
            <div class="card-subtitle">Real-time reporting relationships derived from employee database</div>
          </div>
        </div>
        <div class="card-body" style="overflow-x: auto; text-align: center; padding: 32px 16px; min-height: 400px; background: var(--bg-surface);">
          ${tree.length === 0 ? `
            <div class="empty-state">No employee hierarchy structure available.</div>
          ` : `
            <div style="display: inline-block; white-space: nowrap;">
              ${tree.map(renderNode).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  // 10. SYSTEM DEFAULTS & SETTINGS TAB
  renderSettingsTab(settings) {
    const att = settings?.attendance || {};
    const wd = settings?.workingDays || {};

    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Attendance Engine Defaults -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Attendance Policy Engine</div>
              <div class="card-subtitle">Default punch thresholds and grace periods</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="AdminView.saveAttendanceSettings()">Save Settings</button>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Grace Period (Minutes)</label>
              <input type="number" id="sett-grace" class="form-control" value="${att.gracePeriodMinutes ?? 15}" />
            </div>
            <div class="form-group">
              <label class="form-label">Half-Day Threshold (Hours)</label>
              <input type="number" id="sett-halfday" class="form-control" value="${att.halfDayThresholdHours ?? 4.5}" step="0.5" />
            </div>
            <div class="form-group">
              <label class="form-label">Full-Day Threshold (Hours)</label>
              <input type="number" id="sett-fullday" class="form-control" value="${att.fullDayThresholdHours ?? 8.0}" step="0.5" />
            </div>
            <div class="form-group">
              <label class="form-label">Overtime Minimum Threshold (Hours)</label>
              <input type="number" id="sett-ot" class="form-control" value="${att.overtimeThresholdHours ?? 9.0}" step="0.5" />
            </div>
          </div>
        </div>

        <!-- Organization Working Days -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Standard Operating Working Days</div>
              <div class="card-subtitle">Active business days for shift and payroll calculations</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="AdminView.saveWorkingDaysSettings()">Update Schedule</button>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3">
              ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => `
                <div class="flex justify-between items-center" style="padding: 6px 0; border-bottom: 1px solid var(--border-light);">
                  <span style="text-transform: capitalize; font-weight: 600;">${day}</span>
                  <label class="toggle-switch">
                    <input type="checkbox" id="wd-${day}" ${wd[day] ? 'checked' : ''} />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // MODALS
  openEditCompanyModal() {
    organizationService.getCompany().then(c => {
      ModalManager.openModal({
        id: 'edit-company-modal',
        title: 'Edit Corporate Profile',
        subtitle: 'Update company legal entity details and registrations',
        contentHtml: `
          <div class="form-group">
            <label class="form-label required">Company Name</label>
            <input type="text" id="cmp-name" class="form-control" value="${c.name || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label required">Legal Registered Name</label>
            <input type="text" id="cmp-legal" class="form-control" value="${c.legalName || ''}" required />
          </div>
          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">CIN / Registration No</label>
              <input type="text" id="cmp-cin" class="form-control" value="${c.registrationNumber || c.cin || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">GSTIN / Tax ID</label>
              <input type="text" id="cmp-gst" class="form-control" value="${c.taxGstNumber || ''}" />
            </div>
          </div>
          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">Work Email</label>
              <input type="email" id="cmp-email" class="form-control" value="${c.email || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="text" id="cmp-phone" class="form-control" value="${c.phone || ''}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Registered Office Address</label>
            <input type="text" id="cmp-address" class="form-control" value="${c.address || ''}" />
          </div>
          <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">City</label>
              <input type="text" id="cmp-city" class="form-control" value="${c.city || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">State</label>
              <input type="text" id="cmp-state" class="form-control" value="${c.state || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Postal Code</label>
              <input type="text" id="cmp-pin" class="form-control" value="${c.postalCode || ''}" />
            </div>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="AdminView.saveCompanyProfile()">Save Changes</button>
        `
      });
    });
  },

  async saveCompanyProfile() {
    const name = document.getElementById('cmp-name')?.value;
    const legalName = document.getElementById('cmp-legal')?.value;
    if (!name || !legalName) {
      Toast.error('Please fill in required company fields.');
      return;
    }

    try {
      await organizationService.updateCompany('comp_diallo_india', {
        name,
        legalName,
        registrationNumber: document.getElementById('cmp-cin')?.value || '',
        taxGstNumber: document.getElementById('cmp-gst')?.value || '',
        email: document.getElementById('cmp-email')?.value || '',
        phone: document.getElementById('cmp-phone')?.value || '',
        address: document.getElementById('cmp-address')?.value || '',
        city: document.getElementById('cmp-city')?.value || '',
        state: document.getElementById('cmp-state')?.value || '',
        postalCode: document.getElementById('cmp-pin')?.value || ''
      });
      Toast.success('Company profile updated successfully.');
      ModalManager.closeModal('edit-company-modal');
      Router.mountView('admin');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openAddBranchModal() {
    ModalManager.openModal({
      id: 'add-branch-modal',
      title: 'Add New Regional Branch',
      subtitle: 'Create a new operating facility or branch office',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Branch Name</label>
          <input type="text" id="br-name" class="form-control" placeholder="e.g. Hyderabad Tech Hub" required />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label required">Branch Code</label>
            <input type="text" id="br-code" class="form-control" placeholder="e.g. HYD-04" required />
          </div>
          <div class="form-group">
            <label class="form-label">Timezone</label>
            <input type="text" id="br-tz" class="form-control" value="Asia/Kolkata" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Physical Address</label>
          <input type="text" id="br-addr" class="form-control" placeholder="Street / Tower / Area" />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">City</label>
            <input type="text" id="br-city" class="form-control" placeholder="City" />
          </div>
          <div class="form-group">
            <label class="form-label">State</label>
            <input type="text" id="br-state" class="form-control" placeholder="State" />
          </div>
          <div class="form-group">
            <label class="form-label">Postal Code</label>
            <input type="text" id="br-pin" class="form-control" placeholder="PIN" />
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AdminView.saveNewBranch()">Create Branch</button>
      `
    });
  },

  async saveNewBranch() {
    const name = document.getElementById('br-name')?.value;
    const code = document.getElementById('br-code')?.value;
    if (!name || !code) {
      Toast.error('Branch Name and Code are required.');
      return;
    }

    try {
      await organizationService.createBranch({
        name,
        code,
        address: document.getElementById('br-addr')?.value || '',
        city: document.getElementById('br-city')?.value || '',
        state: document.getElementById('br-state')?.value || '',
        postalCode: document.getElementById('br-pin')?.value || '',
        timezone: document.getElementById('br-tz')?.value || 'Asia/Kolkata'
      });
      Toast.success('Branch created successfully.');
      ModalManager.closeModal('add-branch-modal');
      Router.mountView('admin');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async toggleBranchStatus(id, newStatus) {
    try {
      await organizationService.updateBranch(id, { status: newStatus });
      Toast.success(`Branch set to ${newStatus}.`);
      Router.mountView('admin');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openAddDepartmentModal() {
    organizationService.getDepartments().then(depts => {
      ModalManager.openModal({
        id: 'add-dept-modal',
        title: 'Add New Department',
        subtitle: 'Configure a functional division or sub-department',
        contentHtml: `
          <div class="form-group">
            <label class="form-label required">Department Name</label>
            <input type="text" id="dp-name" class="form-control" placeholder="e.g. Quality Assurance" required />
          </div>
          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label required">Department Code</label>
              <input type="text" id="dp-code" class="form-control" placeholder="e.g. QA" required />
            </div>
            <div class="form-group">
              <label class="form-label">Parent Department</label>
              <select id="dp-parent" class="form-control">
                <option value="">None (Top-Level Department)</option>
                ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description / Mandate</label>
            <textarea id="dp-desc" class="form-control" rows="2" placeholder="Responsibilities and scope"></textarea>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="AdminView.saveNewDepartment()">Create Department</button>
        `
      });
    });
  },

  async saveNewDepartment() {
    const name = document.getElementById('dp-name')?.value;
    const code = document.getElementById('dp-code')?.value;
    if (!name || !code) {
      Toast.error('Department Name and Code are required.');
      return;
    }

    try {
      await organizationService.createDepartment({
        name,
        code,
        parentDepartmentId: document.getElementById('dp-parent')?.value || '',
        description: document.getElementById('dp-desc')?.value || ''
      });
      Toast.success('Department created successfully.');
      ModalManager.closeModal('add-dept-modal');
      Router.mountView('admin');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openAddShiftModal() {
    ModalManager.openModal({
      id: 'add-shift-modal',
      title: 'Configure New Work Shift',
      subtitle: 'Define shift timings, breaks, grace periods, and overnight hours',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Shift Name</label>
          <input type="text" id="sh-name" class="form-control" placeholder="e.g. Twilight Shift" required />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label required">Shift Code</label>
            <input type="text" id="sh-code" class="form-control" placeholder="e.g. TWL" required />
          </div>
          <div class="form-group">
            <label class="form-label">Grace Period (Mins)</label>
            <input type="number" id="sh-grace" class="form-control" value="15" />
          </div>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label required">Start Time</label>
            <input type="time" id="sh-start" class="form-control" value="09:00" required />
          </div>
          <div class="form-group">
            <label class="form-label required">End Time</label>
            <input type="time" id="sh-end" class="form-control" value="18:00" required />
          </div>
          <div class="form-group">
            <label class="form-label">Break Duration (Mins)</label>
            <input type="number" id="sh-break" class="form-control" value="60" />
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AdminView.saveNewShift()">Save Shift</button>
      `
    });
  },

  async saveNewShift() {
    const name = document.getElementById('sh-name')?.value;
    const code = document.getElementById('sh-code')?.value;
    const startTime = document.getElementById('sh-start')?.value;
    const endTime = document.getElementById('sh-end')?.value;
    if (!name || !code || !startTime || !endTime) {
      Toast.error('Please fill in all required shift parameters.');
      return;
    }

    try {
      await organizationService.createShift({
        name,
        code,
        startTime,
        endTime,
        gracePeriod: document.getElementById('sh-grace')?.value || 15,
        breakDuration: document.getElementById('sh-break')?.value || 60
      });
      Toast.success('Shift configured successfully.');
      ModalManager.closeModal('add-shift-modal');
      Router.mountView('admin');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openAddHolidayModal() {
    organizationService.getBranches().then(branches => {
      ModalManager.openModal({
        id: 'add-holiday-modal',
        title: 'Add Official Holiday',
        subtitle: 'Schedule a public, national, or branch state holiday',
        contentHtml: `
          <div class="form-group">
            <label class="form-label required">Holiday Title</label>
            <input type="text" id="hol-name" class="form-control" placeholder="e.g. Dussehra / Vijayadashami" required />
          </div>
          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label required">Date</label>
              <input type="date" id="hol-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
            </div>
            <div class="form-group">
              <label class="form-label required">Holiday Type</label>
              <select id="hol-type" class="form-control">
                <option value="PUBLIC" selected>Public / National Holiday</option>
                <option value="COMPANY">Company Specific</option>
                <option value="REGIONAL">Regional State Holiday</option>
                <option value="OPTIONAL">Optional / Restricted</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Applicable Branch</label>
            <select id="hol-branch" class="form-control">
              <option value="ALL" selected>All Branches (Company-Wide)</option>
              ${branches.map(b => `<option value="${b.code}">${b.name} (${b.code})</option>`).join('')}
            </select>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="AdminView.saveNewHoliday()">Save Holiday</button>
        `
      });
    });
  },

  async saveNewHoliday() {
    const name = document.getElementById('hol-name')?.value;
    const date = document.getElementById('hol-date')?.value;
    if (!name || !date) {
      Toast.error('Please provide holiday name and date.');
      return;
    }

    try {
      const branchVal = document.getElementById('hol-branch')?.value || 'ALL';
      await organizationService.createHoliday({
        name,
        date,
        type: document.getElementById('hol-type')?.value || 'PUBLIC',
        branchIds: [branchVal]
      });
      Toast.success('Holiday added to organization calendar.');
      ModalManager.closeModal('add-holiday-modal');
      Router.mountView('admin');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async deleteHoliday(id) {
    ModalManager.confirm({
      title: 'Delete Holiday',
      message: 'Are you sure you want to remove this holiday from the calendar?',
      confirmText: 'Delete',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await organizationService.deleteHoliday(id);
          Toast.success('Holiday removed.');
          Router.mountView('admin');
        } catch (e) {
          Toast.error(e.message);
        }
      }
    });
  },

  async saveAttendanceSettings() {
    try {
      await settingsService.updateCompanySettings('comp_diallo_india', {
        attendance: {
          gracePeriodMinutes: Number(document.getElementById('sett-grace')?.value) || 15,
          halfDayThresholdHours: Number(document.getElementById('sett-halfday')?.value) || 4.5,
          fullDayThresholdHours: Number(document.getElementById('sett-fullday')?.value) || 8.0,
          overtimeThresholdHours: Number(document.getElementById('sett-ot')?.value) || 9.0,
          checkInRequired: true,
          checkOutRequired: true
        }
      });
      Toast.success('Attendance policy settings saved.');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async saveWorkingDaysSettings() {
    try {
      const days = {};
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(d => {
        days[d] = document.getElementById(`wd-${d}`)?.checked || false;
      });
      await settingsService.updateCompanySettings('comp_diallo_india', {
        workingDays: days
      });
      Toast.success('Operating working days updated.');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openQuickAddModal() {
    this.openAddBranchModal();
  }
};

window.AdminView = AdminView;
