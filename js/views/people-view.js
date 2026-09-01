/**
 * DIALLO HRMS — PEOPLE & EMPLOYEE MANAGEMENT MODULE (PHASE 4)
 * Comprehensive People Dashboard, 8-Tab Employee Profile, Dynamic Org Chart, Org Masters, Onboarding & Exits
 */

const PeopleView = {
  activeTab: 'directory',
  currentFilters: {},

  async renderHub() {
    return this.renderEmployees();
  },

  // 1. MAIN EMPLOYEES DIRECTORY & PEOPLE DASHBOARD
  async renderEmployees() {
    let employees = [];
    let departments = [];
    let branches = [];
    let onboardingTasks = [];
    let exits = [];

    try {
      [employees, departments, branches, onboardingTasks, exits] = await Promise.all([
        employeeService.getEmployees(this.currentFilters),
        departmentService.getDepartments(),
        orgService.getBranches(),
        onboardingService.getTasks(),
        exitService.getExits()
      ]);
    } catch (e) {
      console.warn('Could not load people directory data:', e);
    }

    const total = employees.length;
    const active = employees.filter(e => e.employmentStatus === 'ACTIVE').length;
    const onNotice = employees.filter(e => e.employmentStatus === 'ON_NOTICE').length;
    const inactive = employees.filter(e => e.employmentStatus === 'INACTIVE' || e.employmentStatus === 'TERMINATED' || e.employmentStatus === 'RESIGNED').length;
    const newJoiners = employees.filter(e => e.employmentType === 'Probation' || e.probationStatus === 'Active').length;
    const pendingOnboarding = onboardingTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
    const pendingExits = exits.filter(x => x.status === 'NOTICE_PERIOD' || x.status === 'CLEARANCE').length;

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">People</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">People & Workforce Management</h1>
            <p class="page-subtitle">Centralized employee records, organization structure, onboarding, and separation workflows</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="PeopleView.exportCSV()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export CSV
            </button>
            <button class="btn btn-primary btn-sm" onclick="Forms.openEmployeeModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Employee
            </button>
          </div>
        </div>
      </div>

      <!-- People Dashboard KPI Metric Summary -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Total</span>
          </div>
          <div class="kpi-value">${total}</div>
          <div class="kpi-label">Total Headcount</div>
          <div class="kpi-subtitle">${active} Active Staff</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Onboarding</span>
          </div>
          <div class="kpi-value">${newJoiners}</div>
          <div class="kpi-label">New Joiners</div>
          <div class="kpi-subtitle">${pendingOnboarding} Tasks Pending</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend warning">Notice</span>
          </div>
          <div class="kpi-value">${onNotice}</div>
          <div class="kpi-label">Notice Period</div>
          <div class="kpi-subtitle">${pendingExits} Exit Clearances</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--danger-light); color: var(--danger);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Separated</span>
          </div>
          <div class="kpi-value">${inactive}</div>
          <div class="kpi-label">Inactive / Exited</div>
          <div class="kpi-subtitle">Historical records</div>
        </div>
      </div>

      <!-- Navigation Sub-Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        <button class="tab-btn ${this.activeTab === 'directory' ? 'active' : ''}" onclick="PeopleView.switchTab('directory')">Employee Directory</button>
        <button class="tab-btn ${this.activeTab === 'orgchart' ? 'active' : ''}" onclick="PeopleView.switchTab('orgchart')">Organization Chart</button>
        <button class="tab-btn ${this.activeTab === 'onboarding' ? 'active' : ''}" onclick="PeopleView.switchTab('onboarding')">Onboarding (${pendingOnboarding})</button>
        <button class="tab-btn ${this.activeTab === 'exits' ? 'active' : ''}" onclick="PeopleView.switchTab('exits')">Separations (${pendingExits})</button>
        <button class="tab-btn ${this.activeTab === 'masters' ? 'active' : ''}" onclick="PeopleView.switchTab('masters')">Org Masters</button>
      </div>

      <!-- TAB CONTAINER -->
      <div id="people-tab-content">
        ${this.renderTabContent(employees, departments, branches, onboardingTasks, exits)}
      </div>
    `;
  },

  renderTabContent(employees, departments, branches, onboardingTasks, exits) {
    if (this.activeTab === 'orgchart') {
      return this.renderOrgChartTab(employees);
    } else if (this.activeTab === 'onboarding') {
      return this.renderOnboardingTab(onboardingTasks, employees);
    } else if (this.activeTab === 'exits') {
      return this.renderExitsTab(exits, employees);
    } else if (this.activeTab === 'masters') {
      return this.renderOrgMastersTab(departments, branches);
    }
    return this.renderDirectoryTab(employees, departments);
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    Router.navigate('employees');
  },

  // A. EMPLOYEE DIRECTORY TAB
  renderDirectoryTab(employees, departments) {
    return `
      <!-- Search & Filters Toolbar -->
      <div class="card" style="margin-bottom: 20px; padding: 16px;">
        <div class="flex items-center gap-3" style="flex-wrap: wrap;">
          <div style="flex: 1; min-width: 240px; position: relative;">
            <input type="text" id="filter-emp-search" class="form-control" placeholder="Search by Code, Name, Email, Phone..." value="${this.currentFilters.search || ''}" onkeydown="if(event.key==='Enter') PeopleView.applyFilters()" />
          </div>

          <select id="filter-emp-dept" class="form-control" style="width: 180px;">
            <option value="All Departments">All Departments</option>
            ${departments.map(d => `
              <option value="${d.name}" ${this.currentFilters.department === d.name ? 'selected' : ''}>${d.name}</option>
            `).join('')}
          </select>

          <select id="filter-emp-status" class="form-control" style="width: 150px;">
            <option value="All Status">All Status</option>
            <option value="ACTIVE" ${this.currentFilters.employmentStatus === 'ACTIVE' ? 'selected' : ''}>Active</option>
            <option value="ON_NOTICE" ${this.currentFilters.employmentStatus === 'ON_NOTICE' ? 'selected' : ''}>On Notice</option>
            <option value="INACTIVE" ${this.currentFilters.employmentStatus === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
          </select>

          <select id="filter-emp-branch" class="form-control" style="width: 170px;">
            <option value="All Branches">All Branches</option>
            <option value="HQ - Mumbai" ${this.currentFilters.branchId === 'HQ - Mumbai' ? 'selected' : ''}>HQ - Mumbai</option>
            <option value="Bengaluru Tech Park" ${this.currentFilters.branchId === 'Bengaluru Tech Park' ? 'selected' : ''}>Bengaluru Tech Park</option>
            <option value="Delhi Regional" ${this.currentFilters.branchId === 'Delhi Regional' ? 'selected' : ''}>Delhi Regional</option>
          </select>

          <button class="btn btn-primary btn-sm" onclick="PeopleView.applyFilters()">Apply</button>
          <button class="btn btn-secondary btn-sm" onclick="PeopleView.clearFilters()">Clear</button>
        </div>
      </div>

      <!-- Employees Data Table Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Employee Census (${employees.length})</div>
            <div class="card-subtitle">Official records in Cloud Firestore</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Forms.openEmployeeModal()">+ Onboard Employee</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${employees.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-icon" style="width: 48px; height: 48px; margin-bottom: 12px; background: var(--primary-light); color: var(--primary);">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div class="empty-state-title">No Employees Found</div>
              <div class="empty-state-desc">No employee records match the active search or filter criteria.</div>
              <button class="btn btn-soft btn-sm" onclick="Forms.openEmployeeModal()">+ Add New Employee</button>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Branch Location</th>
                  <th>Reporting Manager</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${employees.map(emp => `
                  <tr>
                    <td class="font-bold text-main" style="font-family: monospace;">${emp.employeeCode || 'EMP-0000'}</td>
                    <td>
                      <div class="user-cell">
                        <div class="user-cell-avatar">${(emp.fullName || emp.name || 'EM').substring(0, 2).toUpperCase()}</div>
                        <div class="user-cell-info">
                          <span class="user-cell-name font-semibold" style="cursor: pointer; color: var(--primary);" onclick="PeopleView.openEmployeeDrawer('${emp.id}')">${emp.fullName || emp.name}</span>
                          <span class="user-cell-code">${emp.workEmail || emp.email || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td><span class="font-medium text-main">${emp.department || 'General'}</span></td>
                    <td>${emp.designation || 'Staff'}</td>
                    <td>${emp.branchName || emp.location || 'HQ - Mumbai'}</td>
                    <td><span class="text-secondary">${emp.manager || 'Top Level'}</span></td>
                    <td>${emp.dateOfJoining || emp.joiningDate || '-'}</td>
                    <td>
                      <span class="badge ${emp.employmentStatus === 'ACTIVE' ? 'badge-success' : (emp.employmentStatus === 'ON_NOTICE' ? 'badge-warning' : 'badge-neutral')}">
                        <span class="badge-dot"></span> ${emp.employmentStatus || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-1">
                        <button class="btn btn-soft btn-sm" onclick="PeopleView.openEmployeeDrawer('${emp.id}')" title="View 8-Tab Profile">View</button>
                        <button class="btn btn-secondary btn-sm" onclick="Forms.openEmployeeModal('${emp.id}')" title="Edit Details">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="PeopleView.confirmDeleteEmployee('${emp.id}', '${emp.fullName || emp.name}')" title="Delete">Delete</button>
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

  applyFilters() {
    this.currentFilters = {
      search: document.getElementById('filter-emp-search')?.value.trim() || '',
      department: document.getElementById('filter-emp-dept')?.value || 'All Departments',
      employmentStatus: document.getElementById('filter-emp-status')?.value || 'All Status',
      branchId: document.getElementById('filter-emp-branch')?.value || 'All Branches'
    };
    Router.navigate('employees');
  },

  clearFilters() {
    this.currentFilters = {};
    const s = document.getElementById('filter-emp-search'); if (s) s.value = '';
    const d = document.getElementById('filter-emp-dept'); if (d) d.value = 'All Departments';
    const st = document.getElementById('filter-emp-status'); if (st) st.value = 'All Status';
    const b = document.getElementById('filter-emp-branch'); if (b) b.value = 'All Branches';
    Router.navigate('employees');
  },

  // B. DYNAMIC 8-TAB EMPLOYEE PROFILE DRAWER
  async openEmployeeDrawer(employeeId) {
    try {
      const emp = await employeeService.getEmployee(employeeId);
      if (!emp) {
        Toast.error('Employee record not found.');
        return;
      }

      const [history, docs] = await Promise.all([
        historyService.getEmployeeHistory(employeeId),
        storageService.getEmployeeDocuments(employeeId)
      ]);

      const contentHtml = `
        <div class="employee-profile-container">
          <!-- Profile Header Card -->
          <div class="card" style="padding: 20px; margin-bottom: 20px; background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-hover) 100%);">
            <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 16px;">
              <div class="flex items-center gap-4">
                <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; border: 3px solid var(--border-main);">
                  ${(emp.fullName || emp.name || 'EM').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0;">${emp.fullName || emp.name}</h2>
                  <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    <strong style="font-family: monospace; color: var(--primary);">${emp.employeeCode || 'EMP-0000'}</strong> • ${emp.designation || 'Staff'} • ${emp.department || 'General'}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge ${emp.employmentStatus === 'ACTIVE' ? 'badge-success' : 'badge-warning'}" style="font-size: 0.85rem; padding: 6px 12px;">
                  <span class="badge-dot"></span> ${emp.employmentStatus || 'ACTIVE'}
                </span>
                <button class="btn btn-secondary btn-sm" onclick="Forms.openEmployeeModal('${emp.id}')">Edit Profile</button>
              </div>
            </div>
          </div>

          <!-- 8 Profile Tabs Navigation -->
          <div class="tabs-nav" style="margin-bottom: 20px;">
            <button type="button" class="tab-btn active" onclick="PeopleView.switchProfileSubTab('ptab-overview')">Overview</button>
            <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-employment')">Employment</button>
            <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-personal')">Personal</button>
            <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-contact')">Contact</button>
            <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-org')">Organization</button>
            <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-docs')">Documents (${docs.length})</button>
            <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-history')">Timeline (${history.length})</button>
            <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-access')">Access & Portal</button>
          </div>

          <!-- 1. OVERVIEW TAB -->
          <div id="ptab-overview" class="profile-subtab-pane">
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="card" style="padding: 16px;">
                <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--primary); margin-bottom: 12px;">Core Details</h4>
                <div class="flex flex-col gap-2" style="font-size: 0.85rem;">
                  <div class="flex justify-between"><span>Work Email:</span><strong>${emp.workEmail || emp.email || '-'}</strong></div>
                  <div class="flex justify-between"><span>Phone Number:</span><strong>${emp.phone || '-'}</strong></div>
                  <div class="flex justify-between"><span>Date of Joining:</span><strong>${emp.dateOfJoining || emp.joiningDate || '-'}</strong></div>
                  <div class="flex justify-between"><span>Employment Type:</span><strong>${emp.employmentType || 'Full Time'}</strong></div>
                </div>
              </div>

              <div class="card" style="padding: 16px;">
                <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--accent-leave); margin-bottom: 12px;">Organization Mapping</h4>
                <div class="flex flex-col gap-2" style="font-size: 0.85rem;">
                  <div class="flex justify-between"><span>Department:</span><strong>${emp.department || 'General'}</strong></div>
                  <div class="flex justify-between"><span>Designation:</span><strong>${emp.designation || 'Staff'}</strong></div>
                  <div class="flex justify-between"><span>Branch:</span><strong>${emp.branchName || emp.location || 'HQ - Mumbai'}</strong></div>
                  <div class="flex justify-between"><span>Reporting Manager:</span><strong>${emp.manager || 'None (Top Level)'}</strong></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. EMPLOYMENT TAB -->
          <div id="ptab-employment" class="profile-subtab-pane" style="display: none;">
            <div class="card" style="padding: 16px;">
              <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.85rem;">
                <div><strong>Employee Code:</strong> ${emp.employeeCode || '-'}</div>
                <div><strong>Grade:</strong> ${emp.gradeId || 'G2'}</div>
                <div><strong>Probation Status:</strong> ${emp.probationStatus || 'Completed'}</div>
                <div><strong>Notice Period:</strong> ${emp.noticePeriodDays || 30} Days</div>
                <div><strong>Salary / CTC:</strong> ${emp.salary || '₹65,000/mo'}</div>
                <div><strong>UAN / PF No:</strong> ${emp.uan || '-'}</div>
              </div>
            </div>
          </div>

          <!-- 3. PERSONAL TAB -->
          <div id="ptab-personal" class="profile-subtab-pane" style="display: none;">
            <div class="card" style="padding: 16px;">
              <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.85rem;">
                <div><strong>Date of Birth:</strong> ${emp.dateOfBirth || '-'}</div>
                <div><strong>Gender:</strong> ${emp.gender || 'Not Specified'}</div>
                <div><strong>PAN Number:</strong> ${emp.pan || '-'}</div>
              </div>
            </div>
          </div>

          <!-- 4. CONTACT TAB -->
          <div id="ptab-contact" class="profile-subtab-pane" style="display: none;">
            <div class="card" style="padding: 16px;">
              <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.85rem;">
                <div><strong>Work Email:</strong> ${emp.workEmail || emp.email || '-'}</div>
                <div><strong>Personal Email:</strong> ${emp.personalEmail || '-'}</div>
                <div><strong>Primary Phone:</strong> ${emp.phone || '-'}</div>
                <div><strong>Alternate Phone:</strong> ${emp.alternatePhone || '-'}</div>
                <div style="grid-column: span 2;"><strong>Address:</strong> ${emp.address || '-'}, ${emp.city || 'Mumbai'}, ${emp.state || 'Maharashtra'} - ${emp.postalCode || '400051'}</div>
              </div>
            </div>
          </div>

          <!-- 5. ORGANIZATION TAB -->
          <div id="ptab-org" class="profile-subtab-pane" style="display: none;">
            <div class="card" style="padding: 16px;">
              <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--primary); margin-bottom: 8px;">Reporting Hierarchy</h4>
              <div style="font-size: 0.85rem; padding: 12px; background: var(--bg-hover); border-radius: 6px; margin-bottom: 12px;">
                <strong>Reporting Manager:</strong> ${emp.manager || 'None (Reports to Board / Top Level)'}
              </div>
            </div>
          </div>

          <!-- 6. DOCUMENTS TAB -->
          <div id="ptab-docs" class="profile-subtab-pane" style="display: none;">
            <div class="card" style="padding: 16px;">
              <div class="flex items-center justify-between" style="margin-bottom: 16px;">
                <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--primary); margin: 0;">Employee Dossier</h4>
                <div class="flex items-center gap-2">
                  <input type="file" id="file-upload-input-${emp.id}" style="display: none;" onchange="PeopleView.uploadDocument('${emp.id}')" />
                  <button class="btn btn-primary btn-sm" onclick="document.getElementById('file-upload-input-${emp.id}').click()">+ Upload Document</button>
                </div>
              </div>

              <div id="drawer-docs-list">
                ${docs.length === 0 ? `
                  <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No documents uploaded for this employee dossier.</div>
                ` : `
                  <div class="flex flex-col gap-2">
                    ${docs.map(d => `
                      <div class="flex items-center justify-between" style="padding: 10px 14px; border: 1px solid var(--border-light); border-radius: 6px;">
                        <div>
                          <div class="font-semibold text-main" style="font-size: 0.85rem;">${d.documentName || d.fileName}</div>
                          <div class="text-muted" style="font-size: 0.75rem;">${d.documentType || 'General'} • Uploaded by ${d.uploadedBy || 'HR'}</div>
                        </div>
                        <a href="${d.downloadUrl || '#'}" target="_blank" class="btn btn-soft btn-sm">Download</a>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            </div>
          </div>

          <!-- 7. ACTIVITY & TIMELINE TAB -->
          <div id="ptab-history" class="profile-subtab-pane" style="display: none;">
            <div class="card" style="padding: 16px;">
              <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--primary); margin-bottom: 12px;">Career Timeline & Audit Trail</h4>
              ${history.length === 0 ? `
                <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No career milestone changes recorded.</div>
              ` : `
                <div class="flex flex-col gap-3">
                  ${history.map(h => `
                    <div style="padding: 10px 14px; border-left: 3px solid var(--primary); background: var(--bg-hover); border-radius: 0 6px 6px 0;">
                      <div class="flex justify-between" style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px;">
                        <span>${h.type}</span>
                        <span>${h.createdAt ? new Date(h.createdAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <div class="font-medium text-main" style="font-size: 0.85rem;">${h.description}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">Changed by ${h.changedBy || 'Admin'}</div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- 8. ACCESS & PORTAL TAB -->
          <div id="ptab-access" class="profile-subtab-pane" style="display: none;">
            <div class="card" style="padding: 16px;">
              <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--primary); margin-bottom: 12px;">Self-Service Portal Login Account</h4>
              <div class="flex items-center justify-between" style="padding: 12px; background: var(--bg-hover); border-radius: 6px;">
                <div>
                  <div class="font-semibold text-main" style="font-size: 0.85rem;">Employee Portal Access</div>
                  <div class="text-muted" style="font-size: 0.75rem;">Allows employee to log in to Diallo HRMS ESS portal using work email (${emp.workEmail || emp.email})</div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="Toast.success('Portal login active for ${emp.workEmail || emp.email}')">Active</button>
              </div>
            </div>
          </div>
        </div>
      `;

      ModalManager.openModal({
        id: 'employee-profile-modal',
        title: `Employee Profile: ${emp.fullName || emp.name}`,
        subtitle: `${emp.employeeCode} • ${emp.designation}`,
        size: 'lg',
        contentHtml,
        footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close Profile</button>`
      });
    } catch (e) {
      Toast.error(`Could not open profile: ${e.message}`);
    }
  },

  switchProfileSubTab(tabId) {
    document.querySelectorAll('.profile-subtab-pane').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#employee-profile-modal .tab-btn').forEach(btn => btn.classList.remove('active'));

    const tab = document.getElementById(tabId);
    if (tab) tab.style.display = 'block';

    const btn = Array.from(document.querySelectorAll('#employee-profile-modal .tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
    if (btn) btn.classList.add('active');
  },

  async uploadDocument(employeeId) {
    const input = document.getElementById(`file-upload-input-${employeeId}`);
    const file = input?.files[0];
    if (!file) return;

    try {
      Toast.info('Uploading document to Firebase Storage...');
      await storageService.uploadEmployeeDocument(employeeId, file, 'IDENTITY', file.name);
      Toast.success('Document uploaded and linked to employee dossier!');
      this.openEmployeeDrawer(employeeId);
    } catch (e) {
      Toast.error(`Upload failed: ${e.message}`);
    }
  },

  confirmDeactivate(employeeId, empName) {
    ModalManager.confirm({
      title: 'Deactivate Employee Record',
      message: `Are you sure you want to deactivate ${empName}? This preserves historical HR & payroll records while updating status to INACTIVE.`,
      confirmText: 'Deactivate',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        await employeeService.deactivateEmployee(employeeId);
        Router.navigate('employees');
      }
    });
  },

  // C. DYNAMIC ORGANIZATION CHART TAB
  renderOrgChartTab(employees) {
    const tree = orgService.buildOrgTree(employees);

    const renderNode = (node) => `
      <div class="org-node" style="display: inline-block; margin: 8px; vertical-align: top; text-align: center;">
        <div class="card" style="padding: 12px 16px; min-width: 180px; display: inline-block; cursor: pointer;" onclick="PeopleView.openEmployeeDrawer('${node.id}')">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary-light); color: var(--primary); margin: 0 auto 6px auto; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem;">
            ${(node.fullName || node.name || 'EM').substring(0, 2).toUpperCase()}
          </div>
          <div class="font-bold text-main" style="font-size: 0.85rem;">${node.fullName || node.name}</div>
          <div class="text-secondary" style="font-size: 0.75rem;">${node.designation || 'Staff'}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); font-family: monospace;">${node.employeeCode || ''}</div>
        </div>
        ${node.children && node.children.length > 0 ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 2px dashed var(--border-main); display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
            ${node.children.map(renderNode).join('')}
          </div>
        ` : ''}
      </div>
    `;

    return `
      <div class="card" style="padding: 24px; overflow-x: auto; text-align: center;">
        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 20px;">Diallo Organization Hierarchy Tree</h3>
        ${tree.length === 0 ? `
          <div style="padding: 30px; color: var(--text-muted);">No employees registered to build hierarchy tree.</div>
        ` : `
          <div style="display: inline-flex; justify-content: center; gap: 24px;">
            ${tree.map(renderNode).join('')}
          </div>
        `}
      </div>
    `;
  },

  // D. ONBOARDING WORKFLOW TAB
  renderOnboardingTab(tasks, employees) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">New Joiner Onboarding Checklists (${tasks.length})</div>
            <div class="card-subtitle">Document verification, IT equipment issuance, and orientation tracking</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="PeopleView.openCreateOnboardingTaskModal()">+ Add Task</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${tasks.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">All Onboarding Tasks Complete</div>
              <div class="empty-state-desc">No pending tasks for new joiners.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Employee</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${tasks.map(t => `
                  <tr>
                    <td class="font-semibold text-main">${t.title}</td>
                    <td>${t.employeeName || 'Staff'}</td>
                    <td>${t.assignedTo || 'HR'}</td>
                    <td>${t.dueDate || '-'}</td>
                    <td>
                      <span class="badge ${t.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}">
                        ${t.status}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-1">
                        ${t.status !== 'COMPLETED' ? `
                          <button class="btn btn-soft btn-sm" onclick="PeopleView.completeOnboardingTask('${t.id}')">Done</button>
                        ` : ''}
                        <button class="btn btn-secondary btn-sm" onclick="PeopleView.openEditOnboardingTaskModal('${t.id}', '${t.title}', '${t.assignedTo || 'HR Operations'}', '${t.dueDate || ''}', '${t.status}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="PeopleView.confirmDeleteOnboardingTask('${t.id}', '${t.title}')">Delete</button>
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

  openCreateOnboardingTaskModal() {
    ModalManager.openModal({
      id: 'create-onboarding-task-modal',
      title: 'Add Onboarding Task',
      subtitle: 'Assign a new checklist item for an employee',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Task Title</label>
          <input type="text" id="ob-task-title" class="form-control" placeholder="e.g. Issue Security Key & Laptop" required />
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Assigned Department / Lead</label>
            <input type="text" id="ob-task-assigned" class="form-control" value="IT Support" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Due Date</label>
            <input type="date" id="ob-task-date" class="form-control" value="${new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)}" required />
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PeopleView.saveNewOnboardingTask()">Save Task</button>
      `
    });
  },

  async saveNewOnboardingTask() {
    const title = document.getElementById('ob-task-title')?.value.trim();
    const assignedTo = document.getElementById('ob-task-assigned')?.value.trim();
    const dueDate = document.getElementById('ob-task-date')?.value;

    if (!title) return;

    try {
      await onboardingService.createTask({ title, assignedTo, dueDate });
      Toast.success(`Onboarding task '${title}' created!`);
      ModalManager.closeModal();
      this.switchTab('onboarding');
    } catch (e) {
      Toast.error(`Failed to create task: ${e.message}`);
    }
  },

  openEditOnboardingTaskModal(taskId, currentTitle, currentAssigned, currentDueDate, currentStatus) {
    ModalManager.openModal({
      id: 'edit-onboarding-task-modal',
      title: 'Edit Onboarding Task',
      subtitle: `Update task parameters`,
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Task Title</label>
          <input type="text" id="edit-ob-title" class="form-control" value="${currentTitle}" required />
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Assigned To</label>
            <input type="text" id="edit-ob-assigned" class="form-control" value="${currentAssigned}" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Due Date</label>
            <input type="date" id="edit-ob-date" class="form-control" value="${currentDueDate}" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Status</label>
          <select id="edit-ob-status" class="form-control">
            <option value="PENDING" ${currentStatus === 'PENDING' ? 'selected' : ''}>PENDING</option>
            <option value="IN_PROGRESS" ${currentStatus === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS</option>
            <option value="COMPLETED" ${currentStatus === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
          </select>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PeopleView.saveEditedOnboardingTask('${taskId}')">Update Task</button>
      `
    });
  },

  async saveEditedOnboardingTask(taskId) {
    const title = document.getElementById('edit-ob-title')?.value.trim();
    const assignedTo = document.getElementById('edit-ob-assigned')?.value.trim();
    const dueDate = document.getElementById('edit-ob-date')?.value;
    const status = document.getElementById('edit-ob-status')?.value;

    if (!title) return;

    try {
      await onboardingService.updateTask(taskId, { title, assignedTo, dueDate, status });
      Toast.success('Onboarding task updated!');
      ModalManager.closeModal();
      this.switchTab('onboarding');
    } catch (e) {
      Toast.error(`Update failed: ${e.message}`);
    }
  },

  confirmDeleteOnboardingTask(taskId, title) {
    ModalManager.confirm({
      title: 'Delete Onboarding Task',
      message: `Are you sure you want to permanently delete the onboarding task "${title}"?`,
      confirmText: 'Delete Task',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await onboardingService.deleteTask(taskId);
          Toast.success('Onboarding task deleted.');
          PeopleView.switchTab('onboarding');
        } catch (e) {
          Toast.error(`Delete failed: ${e.message}`);
        }
      }
    });
  },

  async completeOnboardingTask(taskId) {
    try {
      await onboardingService.updateTaskStatus(taskId, 'COMPLETED');
      Toast.success('Onboarding task marked as completed!');
      this.switchTab('onboarding');
    } catch (e) {
      Toast.error(`Update failed: ${e.message}`);
    }
  },

  // E. EXITS & SEPARATIONS TAB
  renderExitsTab(exits, employees) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Employee Separations & Clearances (${exits.length})</div>
            <div class="card-subtitle">Resignation notices, departmental clearances, and exit interviews</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${exits.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Active Separations</div>
              <div class="empty-state-desc">No employees are currently on notice period.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Exit Type</th>
                  <th>Notice Period</th>
                  <th>Last Working Day</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${exits.map(x => `
                  <tr>
                    <td class="font-semibold text-main">${x.employeeName || 'Staff'}</td>
                    <td>${x.exitType}</td>
                    <td>${x.noticePeriodDays || 30} Days</td>
                    <td>${x.lastWorkingDate || '-'}</td>
                    <td><span class="badge badge-warning">${x.status}</span></td>
                    <td>
                      <div class="flex items-center gap-1">
                        ${x.status !== 'COMPLETED' ? `
                          <button class="btn btn-soft btn-sm" onclick="PeopleView.finalizeExit('${x.id}', '${x.employeeId}')">Finalize</button>
                        ` : ''}
                        <button class="btn btn-secondary btn-sm" onclick="PeopleView.openEditExitModal('${x.id}', '${x.noticePeriodDays || 30}', '${x.lastWorkingDate || ''}', '${x.remarks || ''}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="PeopleView.confirmDeleteExit('${x.id}', '${x.employeeName || 'Staff'}')">Delete</button>
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

  openEditExitModal(exitId, currentNotice, currentLwd, currentRemarks) {
    ModalManager.openModal({
      id: 'edit-exit-modal',
      title: 'Edit Separation Record',
      subtitle: 'Update notice period and last working day parameters',
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Notice Period (Days)</label>
            <input type="number" id="edit-exit-notice" class="form-control" value="${currentNotice}" min="0" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Last Working Day</label>
            <input type="date" id="edit-exit-lwd" class="form-control" value="${currentLwd}" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Remarks & Notes</label>
          <textarea id="edit-exit-remarks" class="form-control" rows="2">${currentRemarks}</textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PeopleView.saveEditedExit('${exitId}')">Update Record</button>
      `
    });
  },

  async saveEditedExit(exitId) {
    const noticePeriodDays = Number(document.getElementById('edit-exit-notice')?.value) || 30;
    const lastWorkingDate = document.getElementById('edit-exit-lwd')?.value;
    const remarks = document.getElementById('edit-exit-remarks')?.value.trim();

    try {
      await exitService.updateExit(exitId, { noticePeriodDays, lastWorkingDate, remarks });
      Toast.success('Exit record updated!');
      ModalManager.closeModal();
      this.switchTab('exits');
    } catch (e) {
      Toast.error(`Update failed: ${e.message}`);
    }
  },

  confirmDeleteExit(exitId, employeeName) {
    ModalManager.confirm({
      title: 'Delete Separation Record',
      message: `Are you sure you want to delete the exit record for ${employeeName}?`,
      confirmText: 'Delete Record',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await exitService.deleteExit(exitId);
          Toast.success('Exit record deleted.');
          PeopleView.switchTab('exits');
        } catch (e) {
          Toast.error(`Delete failed: ${e.message}`);
        }
      }
    });
  },

  confirmDeleteEmployee(employeeId, empName) {
    ModalManager.confirm({
      title: 'Delete Employee Record',
      message: `Are you sure you want to permanently delete ${empName} from the Employee Directory? This action cannot be undone.`,
      confirmText: 'Delete Employee',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await employeeService.deleteEmployee(employeeId);
          Toast.success(`Employee ${empName} deleted permanently.`);
          Router.mountView('employees');
        } catch (e) {
          Toast.error(`Delete failed: ${e.message}`);
        }
      }
    });
  },

  async finalizeExit(exitId, employeeId) {
    try {
      await exitService.completeExit(exitId, employeeId);
      Toast.success('Exit separation finalized and employee deactivated.');
      this.switchTab('exits');
    } catch (e) {
      Toast.error(`Exit finalization failed: ${e.message}`);
    }
  },

  // F. ORG MASTERS TAB (Departments, Designations, Grades, Branches, Cost Centers)
  renderOrgMastersTab(departments = [], branches = []) {
    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Departments Master -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Departments (${departments.length})</div>
            <button class="btn btn-primary btn-sm" onclick="PeopleView.openAddDeptModal()">+ Add Dept</button>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Department Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${departments.length === 0 ? `
                  <tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">No departments configured.</td></tr>
                ` : departments.map(d => `
                  <tr>
                    <td class="font-bold" style="font-family: monospace;">${d.code || 'DEP'}</td>
                    <td class="font-semibold text-main">${d.name}</td>
                    <td><span class="badge badge-success">${d.status || 'ACTIVE'}</span></td>
                    <td>
                      <div class="flex items-center gap-1">
                        <button class="btn btn-soft btn-sm" onclick="PeopleView.openEditDeptModal('${d.id}', '${d.name}', '${d.code || ''}')">Edit</button>
                        <button class="btn btn-soft btn-sm" style="color: var(--danger);" onclick="PeopleView.deleteDepartment('${d.id}', '${d.name}')">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Branches Master -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Company Branches (${branches.length})</div>
            <button class="btn btn-primary btn-sm" onclick="PeopleView.openAddBranchModal()">+ Add Branch</button>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Branch Code</th>
                  <th>Location Name</th>
                  <th>City / State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${branches.length === 0 ? `
                  <tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">No branches configured.</td></tr>
                ` : branches.map(b => `
                  <tr>
                    <td class="font-bold" style="font-family: monospace;">${b.code || 'BR'}</td>
                    <td class="font-semibold text-main">${b.name}</td>
                    <td>${b.city || 'Mumbai'}, ${b.state || 'Maharashtra'}</td>
                    <td>
                      <div class="flex items-center gap-1">
                        <button class="btn btn-soft btn-sm" onclick="PeopleView.openEditBranchModal('${b.id}', '${b.code || ''}', '${b.name}', '${b.city || ''}', '${b.state || ''}')">Edit</button>
                        <button class="btn btn-soft btn-sm" style="color: var(--danger);" onclick="PeopleView.deleteBranch('${b.id}', '${b.name}')">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  openAddDeptModal() {
    ModalManager.openModal({
      id: 'add-dept-modal',
      title: 'Create Department',
      subtitle: 'Add a new business unit to the organization structure',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Department Name</label>
          <input type="text" id="nd-name" class="form-control" placeholder="e.g. Quality Assurance" required />
        </div>
        <div class="form-group">
          <label class="form-label required">Department Code</label>
          <input type="text" id="nd-code" class="form-control" placeholder="e.g. QA" style="text-transform: uppercase;" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PeopleView.saveDepartment()">Create Department</button>
      `
    });
  },

  openEditDeptModal(id, currentName, currentCode) {
    ModalManager.openModal({
      id: 'edit-dept-modal',
      title: `Edit Department: ${currentName}`,
      subtitle: 'Update business unit details in Firestore',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Department Name</label>
          <input type="text" id="ed-name" class="form-control" value="${currentName}" required />
        </div>
        <div class="form-group">
          <label class="form-label required">Department Code</label>
          <input type="text" id="ed-code" class="form-control" value="${currentCode}" style="text-transform: uppercase;" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PeopleView.updateDepartment('${id}')">Save Changes</button>
      `
    });
  },

  async saveDepartment() {
    const name = document.getElementById('nd-name')?.value.trim();
    const code = document.getElementById('nd-code')?.value.trim().toUpperCase();
    if (!name || !code) return;

    try {
      await departmentService.createDepartment({ name, code });
      Toast.success(`Created department '${name}'`);
      ModalManager.closeModal();
      this.switchTab('masters');
    } catch (e) {
      Toast.error(`Failed to create department: ${e.message}`);
    }
  },

  async updateDepartment(id) {
    const name = document.getElementById('ed-name')?.value.trim();
    const code = document.getElementById('ed-code')?.value.trim().toUpperCase();
    if (!name || !code) return;

    try {
      await departmentService.updateDepartment(id, { name, code });
      Toast.success(`Updated department '${name}'`);
      ModalManager.closeModal();
      this.switchTab('masters');
    } catch (e) {
      Toast.error(`Failed to update department: ${e.message}`);
    }
  },

  deleteDepartment(id, name) {
    ModalManager.confirm({
      title: 'Delete Department',
      message: `Are you sure you want to delete department "${name}"? This action removes the department from active lists.`,
      confirmText: 'Delete Department',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await departmentService.deleteDepartment(id);
          Toast.success(`Department "${name}" deleted.`);
          PeopleView.switchTab('masters');
        } catch (e) {
          Toast.error(`Delete failed: ${e.message}`);
        }
      }
    });
  },

  openAddBranchModal() {
    ModalManager.openModal({
      id: 'add-branch-modal',
      title: 'Create Branch Location',
      subtitle: 'Register a regional office or factory hub',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Branch Name</label>
          <input type="text" id="nb-name" class="form-control" placeholder="e.g. Hyderabad Development Center" required />
        </div>
        <div class="form-group">
          <label class="form-label required">Branch Code</label>
          <input type="text" id="nb-code" class="form-control" placeholder="e.g. HYD-01" style="text-transform: uppercase;" required />
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">City</label>
            <input type="text" id="nb-city" class="form-control" placeholder="Hyderabad" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">State</label>
            <input type="text" id="nb-state" class="form-control" placeholder="Telangana" required />
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PeopleView.saveBranch()">Save Branch</button>
      `
    });
  },

  openEditBranchModal(id, currentCode, currentName, currentCity, currentState) {
    ModalManager.openModal({
      id: 'edit-branch-modal',
      title: `Edit Branch: ${currentName}`,
      subtitle: 'Update branch location details in Firestore',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Branch Name</label>
          <input type="text" id="eb-name" class="form-control" value="${currentName}" required />
        </div>
        <div class="form-group">
          <label class="form-label required">Branch Code</label>
          <input type="text" id="eb-code" class="form-control" value="${currentCode}" style="text-transform: uppercase;" required />
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">City</label>
            <input type="text" id="eb-city" class="form-control" value="${currentCity}" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">State</label>
            <input type="text" id="eb-state" class="form-control" value="${currentState}" required />
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PeopleView.updateBranch('${id}')">Save Changes</button>
      `
    });
  },

  async saveBranch() {
    const name = document.getElementById('nb-name')?.value.trim();
    const code = document.getElementById('nb-code')?.value.trim().toUpperCase();
    const city = document.getElementById('nb-city')?.value.trim();
    const state = document.getElementById('nb-state')?.value.trim();
    if (!name) return;

    try {
      await orgService.createBranch({ name, code, city, state });
      Toast.success(`Created branch '${name}'`);
      ModalManager.closeModal();
      this.switchTab('masters');
    } catch (e) {
      Toast.error(`Failed to create branch: ${e.message}`);
    }
  },

  async updateBranch(id) {
    const name = document.getElementById('eb-name')?.value.trim();
    const code = document.getElementById('eb-code')?.value.trim().toUpperCase();
    const city = document.getElementById('eb-city')?.value.trim();
    const state = document.getElementById('eb-state')?.value.trim();
    if (!name) return;

    try {
      await orgService.updateBranch(id, { name, code, city, state });
      Toast.success(`Updated branch '${name}'`);
      ModalManager.closeModal();
      this.switchTab('masters');
    } catch (e) {
      Toast.error(`Failed to update branch: ${e.message}`);
    }
  },

  deleteBranch(id, name) {
    ModalManager.confirm({
      title: 'Delete Branch Location',
      message: `Are you sure you want to delete branch "${name}"? This action removes the branch from active locations.`,
      confirmText: 'Delete Branch',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await orgService.deleteBranch(id);
          Toast.success(`Branch "${name}" deleted.`);
          PeopleView.switchTab('masters');
        } catch (e) {
          Toast.error(`Delete failed: ${e.message}`);
        }
      }
    });
  },

  async exportCSV() {
    try {
      const employees = await employeeService.getEmployees(this.currentFilters);
      const headers = ['Employee Code', 'Full Name', 'Department', 'Designation', 'Branch', 'Reporting Manager', 'Joining Date', 'Status', 'Work Email', 'Phone'];
      const rows = employees.map(e => [
        `"${e.employeeCode || ''}"`,
        `"${e.fullName || e.name || ''}"`,
        `"${e.department || ''}"`,
        `"${e.designation || ''}"`,
        `"${e.branchName || e.location || ''}"`,
        `"${e.manager || ''}"`,
        `"${e.dateOfJoining || e.joiningDate || ''}"`,
        `"${e.employmentStatus || ''}"`,
        `"${e.workEmail || e.email || ''}"`,
        `"${e.phone || ''}"`
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Diallo_Employees_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Toast.success('Exported Employee Census CSV.');
    } catch (e) {
      Toast.error(`Export failed: ${e.message}`);
    }
  }
};

window.PeopleView = PeopleView;
