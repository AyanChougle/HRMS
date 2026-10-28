
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

    // Exclude invalid or empty records
    employees = employees.filter(e => e && (e.fullName || e.name || e.employeeCode));

    const userRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || AuthGuard.userProfile?.role || 'EMPLOYEE').toUpperCase().trim();
    const user = AuthGuard.userProfile || {};
    const myId = user.uid || user.id || '';
    const myCode = (user.employeeCode || user.employee_code || '').toUpperCase().trim();
    const myName = (user.displayName || user.display_name || user.fullName || '').toLowerCase().trim();

    const isSuperAdminOrHR = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR'].includes(userRole);
    const canOnboard = isSuperAdminOrHR;

    // Apply strict team-level scoping for non-Admin/HR roles
    if (!isSuperAdminOrHR) {
      if (['TEAM_LEAD', 'TL', 'MANAGER', 'OPERATIONS_MANAGER', 'OPS', 'PROCESS_OWNER'].includes(userRole)) {
        employees = await employeeService.getSubordinates(user, employees, { directOnly: false, forceScoped: true });
      } else if (userRole === 'DIGITAL_MARKETING' || userRole === 'DIGITAL') {
        employees = employees.filter(e => (e.department || '').toLowerCase().trim() === 'digital');
      } else if (userRole === 'COMPLIANCE') {
        employees = employees.filter(e => (e.department || '').toLowerCase().trim() === 'compliance');
      } else {
        // Individual staff: only see colleagues under the same manager
        const myManager = (user.manager || '').toLowerCase().trim();
        if (myManager) {
          employees = employees.filter(e => (e.manager || '').toLowerCase().trim() === myManager);
        } else {
          employees = [];
        }
      }
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
          <span class="breadcrumb-current">${isSuperAdminOrHR ? 'People' : 'My Team'}</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">${isSuperAdminOrHR ? 'People & Workforce Management' : 'My Team & Direct Reports'}</h1>
            <p class="page-subtitle">${isSuperAdminOrHR ? 'Centralized employee records, organization structure, onboarding, and separation workflows' : 'Assigned team members reporting under your management'}</p>
          </div>
          <div class="page-actions">
            ${isSuperAdminOrHR ? `
              <button class="btn btn-secondary btn-sm" onclick="PeopleView.syncDatabaseUsers()">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Sync Database Users
              </button>
              
              <button class="btn btn-soft btn-sm" onclick="PeopleView.pushAllToMySQL()" style="color: var(--primary);">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                </svg>
                Push to MySQL
              </button>
              <button class="btn btn-secondary btn-sm" onclick="PeopleView.importCSV()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Import CSV
              </button>

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
            ` : ''}
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
            <span class="kpi-trend neutral">${isSuperAdminOrHR ? 'Total' : 'Team'}</span>
          </div>
          <div class="kpi-value">${total}</div>
          <div class="kpi-label">${isSuperAdminOrHR ? 'Total Headcount' : 'My Team Size'}</div>
          <div class="kpi-subtitle">${active} Active ${isSuperAdminOrHR ? 'Staff' : 'Members'}</div>
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
          <div class="kpi-subtitle">Probation Period</div>
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
        ${['SUPER_ADMIN', 'HR_MANAGER', 'MANAGER', 'OPERATIONS_MANAGER'].includes(userRole) ? `<button class="tab-btn ${this.activeTab === 'masters' ? 'active' : ''}" onclick="PeopleView.switchTab('masters')">Org Masters</button>` : ''}
      </div>

      <!-- TAB CONTAINER -->
      <div id="people-tab-content">
        ${this.renderTabContent(employees, departments, branches, onboardingTasks, exits)}
      </div>
    `;
  },

  renderTabContent(employees, departments, branches, onboardingTasks, exits) {
    const userRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '').toUpperCase().trim();
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
    const userRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || AuthGuard.userProfile?.role || 'EMPLOYEE').toUpperCase().trim();
    const isSuperAdminOrHR = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR'].includes(userRole);
    const canOnboard = isSuperAdminOrHR;

    let displayEmployees = employees;

    const distinctDepts = Array.from(new Set([
      ...departments.map(d => (d.name || '').trim()),
      ...employees.map(e => (e.department || '').trim())
    ])).filter(Boolean).sort();

    return `
      <!-- Search & Filters Toolbar -->
      <div class="card" style="margin-bottom: 20px; padding: 16px;">
        <div class="flex items-center gap-3" style="flex-wrap: wrap;">
          <div style="flex: 1; min-width: 240px; position: relative;">
            <input type="text" id="filter-emp-search" class="form-control" placeholder="Search by Code, Name, Email, Phone..." value="${this.currentFilters.search || ''}" onkeydown="if(event.key==='Enter') PeopleView.applyFilters()" />
          </div>

          <select id="filter-emp-dept" class="form-control" style="width: 180px;">
            <option value="All Departments">All Departments</option>
            ${distinctDepts.map(dName => `
              <option value="${dName}" ${this.currentFilters.department === dName ? 'selected' : ''}>${dName}</option>
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
            <option value="Ghansoli - Navi Mumbai" ${this.currentFilters.branchId === 'Ghansoli - Navi Mumbai' ? 'selected' : ''}>Ghansoli - Navi Mumbai</option>
          </select>

          <button class="btn btn-primary btn-sm" onclick="PeopleView.applyFilters()">Apply</button>
          <button class="btn btn-secondary btn-sm" onclick="PeopleView.clearFilters()">Clear</button>
        </div>
      </div>

      <!-- Employees Data Table Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${isSuperAdminOrHR ? 'Employee Census' : 'My Direct Team Roster'} (${displayEmployees.length})</div>
            <div class="card-subtitle">${isSuperAdminOrHR ? 'Official company-wide records' : 'Direct reporting team members under your supervision'}</div>
          </div>
          ${canOnboard ? `<button class="btn btn-primary btn-sm" onclick="Forms.openEmployeeModal()">+ Onboard Employee</button>` : ''}
        </div>
        <div class="card-body" style="padding: 0;">
          ${displayEmployees.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div class="empty-state-title">No Employees Found</div>
              <div class="empty-state-desc">${isSuperAdminOrHR ? 'No employee records match the active search or filter criteria.' : 'No direct reporting team members found matching criteria.'}</div>
              <div class="empty-state-actions">
                ${canOnboard ? `<button class="btn btn-primary btn-sm" onclick="Forms.openEmployeeModal()">+ Onboard New Employee</button>` : ''}
              </div>
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
                ${displayEmployees.map(emp => `
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
                        ${canOnboard ? `
                          <button class="btn btn-secondary btn-sm" onclick="Forms.openEmployeeModal('${emp.id}')" title="Edit Details">Edit</button>
                          <button class="btn btn-danger btn-sm" onclick="PeopleView.confirmDeleteEmployee('${emp.id}', '${(emp.fullName || emp.name || '').replace(/'/g, "\\'")}', '${emp.employeeCode || ''}', '${emp.workEmail || emp.email || ''}')" title="Delete">Delete</button>
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

  applyFilters() {
    this.currentFilters = {
      ...(this.currentFilters || {}),
      search: document.getElementById('filter-emp-search')?.value.trim() || '',
      department: document.getElementById('filter-emp-dept')?.value || 'All Departments',
      employmentStatus: document.getElementById('filter-emp-status')?.value || 'All Status',
      branchId: document.getElementById('filter-emp-branch')?.value || 'All Branches'
    };
    Router.navigate('employees');
  },

  clearFilters() {
    this.currentFilters = { teamOnly: false };
    const s = document.getElementById('filter-emp-search'); if (s) s.value = '';
    const d = document.getElementById('filter-emp-dept'); if (d) d.value = 'All Departments';
    const st = document.getElementById('filter-emp-status'); if (st) st.value = 'All Status';
    const b = document.getElementById('filter-emp-branch'); if (b) b.value = 'All Branches';
    Router.navigate('employees');
  },

  toggleTeamOnly() {
    this.currentFilters.teamOnly = !this.currentFilters.teamOnly;
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

      const activeRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '').toString().toUpperCase().trim();
      const currentEmpId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || '';
      const currentEmpCode = AuthGuard.userProfile?.employeeCode || '';
      const currentEmpName = AuthGuard.userProfile?.displayName || AuthGuard.userProfile?.fullName || '';

      if (activeRole === 'TEAM_LEAD' || activeRole === 'TL') {
        const isAssigned = emp.teamLeaderId && (emp.teamLeaderId === currentEmpId || emp.teamLeaderId === currentEmpCode || emp.teamLeaderId === currentEmpName);
        if (!isAssigned) {
          if (typeof Toast !== 'undefined') Toast.error('Access Denied: You can only view profiles of employees assigned to your team.');
          return;
        }
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
                    <strong style="font-family: monospace; color: var(--primary);">${emp.employeeCode || 'EMP-0000'}</strong> &bull; ${(emp.designation && emp.department && emp.designation.trim().toLowerCase() !== emp.department.trim().toLowerCase()) ? `${emp.designation} &bull; ${emp.department}` : (emp.designation || emp.department || 'Staff')}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge ${emp.employmentStatus === 'ACTIVE' ? 'badge-success' : 'badge-warning'}" style="font-size: 0.85rem; padding: 6px 12px;">
                  <span class="badge-dot"></span> ${emp.employmentStatus || 'ACTIVE'}
                </span>
                ${activeRole !== 'TEAM_LEAD' && activeRole !== 'TL' ? `<button class="btn btn-secondary btn-sm" onclick="Forms.openEmployeeModal('${emp.id}')">Edit Profile</button>` : ''}
              </div>
            </div>
          </div>

          <!-- 8 Profile Tabs Navigation with Scroll Controls -->
          <div class="tabs-scroll-wrapper" style="position: relative; display: flex; align-items: center; width: 100%; margin-bottom: 20px;">
            <button type="button" class="tab-scroll-arrow prev-tab" onclick="PeopleView.scrollProfileTabs(-200)" title="Scroll tabs left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div id="profile-tabs-nav-bar" class="tabs-nav" style="margin-bottom: 0; flex: 1; overflow-x: auto; scroll-behavior: smooth;">
              <button type="button" class="tab-btn active" onclick="PeopleView.switchProfileSubTab('ptab-overview')">Overview</button>
              <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-employment')">Employment</button>
              <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-personal')">Personal</button>
              <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-contact')">Contact</button>
              <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-org')">Organization</button>
              <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-docs')">Documents (${docs.length})</button>
              <button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-history')">Timeline (${history.length})</button>
              ${activeRole !== 'TEAM_LEAD' && activeRole !== 'TL' ? `<button type="button" class="tab-btn" onclick="PeopleView.switchProfileSubTab('ptab-access')">Access & Portal</button>` : ''}
            </div>
            <button type="button" class="tab-scroll-arrow next-tab" onclick="PeopleView.scrollProfileTabs(200)" title="Scroll tabs right">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
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
                          <div class="text-muted" style="font-size: 0.75rem;">${d.documentType || 'General'} &bull; Uploaded by ${d.uploadedBy || 'HR'}</div>
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
        subtitle: `${emp.employeeCode || ''} &bull; ${emp.designation || emp.department || 'Staff'}`,
        size: 'lg',
        contentHtml,
        footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close Profile</button>`
      });
    } catch (e) {
      Toast.error(`Could not open profile: ${e.message}`);
    }
  },

  scrollProfileTabs(delta) {
    const nav = document.getElementById('profile-tabs-nav-bar');
    if (nav) {
      nav.scrollBy({ left: delta, behavior: 'smooth' });
    }
  },

  switchProfileSubTab(tabId) {
    document.querySelectorAll('.profile-subtab-pane').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#employee-profile-modal .tab-btn').forEach(btn => btn.classList.remove('active'));

    const tab = document.getElementById(tabId);
    if (tab) tab.style.display = 'block';

    const btn = Array.from(document.querySelectorAll('#employee-profile-modal .tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
    if (btn) {
      btn.classList.add('active');
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
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
  // C. DYNAMIC ORGANIZATION CHART TAB
  _collapsedNodes: new Set(),
  _orgDeptFilter: 'ALL',

  toggleOrgNode(nodeId) {
    if (!this._collapsedNodes) this._collapsedNodes = new Set();
    if (this._collapsedNodes.has(nodeId)) {
      this._collapsedNodes.delete(nodeId);
    } else {
      this._collapsedNodes.add(nodeId);
    }
    const container = document.getElementById('people-tab-content');
    if (container && this._lastEmployees) {
      container.innerHTML = this.renderOrgChartTab(this._lastEmployees);
      if (this.initOrgChartCanvas) this.initOrgChartCanvas();
    }
  },

  expandAllOrgNodes() {
    this._collapsedNodes = new Set();
    const container = document.getElementById('people-tab-content');
    if (container && this._lastEmployees) {
      container.innerHTML = this.renderOrgChartTab(this._lastEmployees);
      if (this.initOrgChartCanvas) this.initOrgChartCanvas();
    }
  },

  collapseTeamsOrgNodes() {
    this._collapsedNodes = new Set();
    // Collapse any node with > 2 reports so leadership is clean
    if (this._lastEmployees) {
      const cleanList = this._lastEmployees.filter(e => e && (e.fullName || e.name || e.employeeCode));
      const tree = orgService.buildOrgTree(cleanList);
      const markCollapsed = (nodes, depth = 0) => {
        nodes.forEach(n => {
          if (n.children && n.children.length > 0) {
            if (depth >= 2) this._collapsedNodes.add(n.id);
            markCollapsed(n.children, depth + 1);
          }
        });
      };
      markCollapsed(tree, 0);
    }
    const container = document.getElementById('people-tab-content');
    if (container && this._lastEmployees) {
      container.innerHTML = this.renderOrgChartTab(this._lastEmployees);
      if (this.initOrgChartCanvas) this.initOrgChartCanvas();
    }
  },

  filterOrgChartDept(dept) {
    this._orgDeptFilter = dept;
    const container = document.getElementById('people-tab-content');
    if (container && this._lastEmployees) {
      container.innerHTML = this.renderOrgChartTab(this._lastEmployees);
      if (this.initOrgChartCanvas) this.initOrgChartCanvas();
    }
  },

  renderOrgChartTab(employees) {
    this._lastEmployees = employees;
    const userRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || AuthGuard.userProfile?.role || '').toUpperCase().trim();
    const canOnboard = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR', 'MANAGER'].includes(userRole);

    let cleanList = employees.filter(e => e && (e.fullName || e.name || e.employeeCode));
    
    // Distinct departments for filter dropdown
    const depts = Array.from(new Set(cleanList.map(e => e.department).filter(Boolean))).sort();

    // Department filtering
    if (this._orgDeptFilter && this._orgDeptFilter !== 'ALL') {
      const targetDept = this._orgDeptFilter.toLowerCase();
      cleanList = cleanList.filter(e => (e.department || '').toLowerCase() === targetDept || (e.designation || '').toLowerCase().includes(targetDept) || (e.manager || '').toLowerCase().includes(targetDept));
    }

    const isSuperAdminOrHR = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR'].includes(userRole);
    if (!isSuperAdminOrHR) {
      const myId = AuthGuard.userProfile?.employeeId || AuthGuard.userProfile?.id || AuthGuard.currentUser?.uid;
      const myCode = (AuthGuard.userProfile?.employeeCode || '').toUpperCase().trim();
      const hasSelf = cleanList.some(e => e.id === myId || (myCode && (e.employeeCode || '').toUpperCase() === myCode));
      if (!hasSelf && AuthGuard.userProfile) {
        cleanList.unshift({
          id: myId,
          employeeCode: myCode || 'MGR',
          fullName: AuthGuard.userProfile.displayName || AuthGuard.userProfile.fullName || 'Manager',
          designation: AuthGuard.userProfile.designation || 'Manager',
          department: AuthGuard.userProfile.department || 'Operations',
          roleId: userRole,
          managerId: null,
          manager: null,
          profilePhotoUrl: AuthGuard.userProfile.photoURL || null
        });
      }
    }

    const tree = orgService.buildOrgTree(cleanList);
    setTimeout(() => { if (this.initOrgChartCanvas) this.initOrgChartCanvas(); }, 100);

    const isCollapsed = (nodeId) => this._collapsedNodes && this._collapsedNodes.has(nodeId);

    const renderNode = (node) => {
      const initials = (node.fullName || node.name || 'EM').substring(0, 2).toUpperCase();
      const hasChildren = node.children && node.children.length > 0;
      const childCount = hasChildren ? node.children.length : 0;
      const collapsed = isCollapsed(node.id);

      // Check if all children are leaf nodes (individual contributors)
      const allChildrenAreLeaves = hasChildren && node.children.every(c => !c.children || c.children.length === 0);

      // Card sizing
      const cardWidth = 175;
      const avatarSize = 36;

      return `
        <div class="tree-node-block">
          <!-- Card -->
          <div class="org-card" onclick="PeopleView.openEmployeeDrawer('${node.id}')" title="Click to view complete employee profile">
            <div style="display: flex; align-items: center; justify-content: center; width: ${avatarSize}px; height: ${avatarSize}px; border-radius: 50%; background: var(--primary-light, #eff6ff); color: var(--primary, #2563eb); margin: 0 auto 6px auto; font-weight: 700; font-size: 0.8rem; border: 2px solid var(--primary-light, #eff6ff);">
              ${initials}
            </div>
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${node.fullName || node.name}
            </div>
            <div style="font-size: 0.74rem; font-weight: 600; color: var(--primary); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${node.designation || 'Staff'}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="font-size: 0.65rem; padding: 2px 6px; border-radius: 9999px; background: var(--bg-hover, #f1f5f9); color: var(--text-secondary); display: inline-block;">
                ${node.department || 'Operations'}
              </span>
            </div>
            <div style="font-size: 0.68rem; color: var(--text-muted); font-family: monospace;">${node.employeeCode || ''}</div>
            
            ${hasChildren ? `
              <div style="margin-top: 6px; padding-top: 5px; border-top: 1px dashed var(--border-main);">
                <button type="button" class="btn btn-xs" style="font-size: 0.66rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; background: ${collapsed ? 'var(--primary)' : 'var(--primary-light)'}; color: ${collapsed ? '#ffffff' : 'var(--primary)'}; border: none; cursor: pointer;" onclick="event.stopPropagation(); PeopleView.toggleOrgNode('${node.id}')" title="${collapsed ? 'Click to expand team' : 'Click to collapse team'}">
                  ${collapsed ? `+ ${childCount} Report${childCount > 1 ? 's' : ''}` : `▼ ${childCount} Report${childCount > 1 ? 's' : ''}`}
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Tree Branch Connectors -->
          ${(hasChildren && !collapsed) ? `
            <div class="tree-node-stem-down"></div>
            
            ${(allChildrenAreLeaves && childCount >= 5) ? `
              <!-- Compact Grid Pod for large leaf teams (keeps layout neatly arranged!) -->
              <div class="team-pod-card" style="margin-top: 0; background: var(--bg-surface, #ffffff); border: 1.5px solid var(--border-main); border-radius: 12px; padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: 420px;">
                <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; text-align: left; display: flex; justify-content: space-between;">
                  <span>Direct Team (${childCount})</span>
                  <span style="color: var(--primary); font-size: 0.68rem;">Compact Grid</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                  ${node.children.map(c => `
                    <div style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--bg-hover, #f8fafc); border: 1px solid var(--border-main); border-radius: 8px; cursor: pointer; text-align: left; transition: background 0.15s ease;" onclick="PeopleView.openEmployeeDrawer('${c.id}')" onmouseenter="this.style.background='var(--primary-light)'" onmouseleave="this.style.background='var(--bg-hover)'">
                      <div style="width: 26px; height: 26px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.68rem; flex-shrink: 0;">
                        ${(c.fullName || c.name || 'EM').substring(0, 2).toUpperCase()}
                      </div>
                      <div style="overflow: hidden;">
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.fullName || c.name}</div>
                        <div style="font-size: 0.65rem; color: var(--text-muted); font-family: monospace;">${c.employeeCode || ''} &bull; ${c.designation || 'Sales'}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : `
              <!-- Standard Pure CSS Multi-Branch Connectors (Mathematically Centered!) -->
              <ul class="tree-children-list">
                ${node.children.map((child, idx, arr) => {
                  const isFirst = idx === 0;
                  const isLast = idx === arr.length - 1;
                  const isOnly = arr.length === 1;
                  const posClass = isOnly ? 'is-only' : (isFirst ? 'is-first' : (isLast ? 'is-last' : ''));
                  return `
                    <li class="tree-child-wrapper ${posClass}">
                      ${renderNode(child)}
                    </li>
                  `;
                }).join('')}
              </ul>
            `}
          ` : ''}
        </div>
      `;
    };

    return `
      <style>
        /* Scoped Pure CSS Hierarchy Engine */
        .org-tree-canvas {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          min-width: 100%;
        }
        .tree-node-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .tree-node-stem-down {
          width: 2px;
          height: 22px;
          background: var(--primary, #2563eb);
        }
        .tree-children-list {
          display: flex;
          justify-content: center;
          list-style: none;
          margin: 0;
          padding: 0;
          position: relative;
        }
        .tree-child-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 22px 10px 0 10px;
        }
        /* Top vertical line entering each child */
        .tree-child-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 2px;
          height: 22px;
          background: var(--primary, #2563eb);
          transform: translateX(-50%);
        }
        /* Horizontal sibling line */
        .tree-child-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--primary, #2563eb);
        }
        .tree-child-wrapper.is-first::after {
          left: 50%;
          width: 50%;
        }
        .tree-child-wrapper.is-last::after {
          left: 0;
          width: 50%;
        }
        .tree-child-wrapper.is-only::after {
          display: none;
        }
        .org-card {
          width: 175px;
          padding: 12px 10px;
          background: var(--bg-surface, #ffffff);
          border: 1.5px solid var(--border-main, #e2e8f0);
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          position: relative;
          cursor: pointer;
        }
        .org-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.08);
          border-color: var(--primary, #2563eb);
        }
      </style>

      <div class="card" style="padding: 20px; position: relative; overflow: hidden; user-select: none;">
        <!-- Header Controls -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--border-main); padding-bottom: 14px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0 0 4px 0;">Diallo Organization Hierarchy Tree</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Interactive view: zoom, pan, toggle teams, or filter by department</p>
          </div>
          
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <!-- Department Filter -->
            <select class="form-control" style="font-size: 0.8rem; padding: 4px 8px; width: auto; height: 32px;" onchange="PeopleView.filterOrgChartDept(this.value)">
              <option value="ALL" ${this._orgDeptFilter === 'ALL' ? 'selected' : ''}>All Departments</option>
              ${depts.map(d => `<option value="${d}" ${this._orgDeptFilter === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>

            <!-- Expand / Collapse buttons -->
            <button class="btn btn-secondary btn-sm" onclick="PeopleView.expandAllOrgNodes()" title="Expand All Teams">
              Expand All
            </button>
            <button class="btn btn-secondary btn-sm" onclick="PeopleView.collapseTeamsOrgNodes()" title="Collapse Large Teams">
              Focus Leads
            </button>

            <!-- Zoom Controls -->
            <div style="display: flex; align-items: center; gap: 4px; border-left: 1px solid var(--border-main); padding-left: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="PeopleView.zoomOrgChart(-0.1)" title="Zoom Out (-)">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
              </button>
              <span id="org-zoom-level" style="font-size: 0.8rem; font-weight: 600; min-width: 44px; text-align: center;">100%</span>
              <button class="btn btn-secondary btn-sm" onclick="PeopleView.zoomOrgChart(0.1)" title="Zoom In (+)">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              </button>
              <button class="btn btn-secondary btn-sm" onclick="PeopleView.resetOrgChartZoom()" title="Reset Zoom">Fit</button>
            </div>

            <span class="badge badge-primary" style="font-size: 0.8rem; padding: 6px 12px; margin-left: 4px;">${cleanList.length} Personnel</span>
          </div>
        </div>

        ${tree.length === 0 ? `
          <div style="padding: 48px; text-align: center; color: var(--text-muted);">
            <div style="font-weight: 600; font-size: 1rem; color: var(--text-main); margin-bottom: 4px;">No Hierarchy Records Found</div>
            <div style="font-size: 0.85rem; margin-bottom: 16px;">Try switching the department filter to "All Departments".</div>
            ${canOnboard ? `<button class="btn btn-primary btn-sm" onclick="Forms.openEmployeeModal()">+ Onboard Employee</button>` : ''}
          </div>
        ` : `
          <div id="org-chart-viewport" style="width: 100%; height: 640px; overflow: hidden; cursor: grab; position: relative; background: var(--bg-hover, #f8fafc); border: 1.5px solid var(--border-main, #e2e8f0); border-radius: 10px; user-select: none;">
            <div id="org-chart-canvas" class="org-tree-canvas" style="position: absolute; top: 0; left: 0; display: inline-flex; flex-direction: column; align-items: center; min-width: max-content; padding: 40px 100px; transform-origin: 0 0; will-change: transform;">
              ${tree.map(renderNode).join('')}
            </div>

            <!-- Hint overlay -->
            <div style="position: absolute; bottom: 12px; left: 16px; background: rgba(255,255,255,0.92); backdrop-filter: blur(4px); padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border-main); font-size: 0.72rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px; pointer-events: none; z-index: 10; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"/></svg>
              <span>Click & drag freely in any direction &bull; Scroll to pan / Ctrl+scroll to zoom</span>
            </div>
          </div>
        `}
      </div>
    `;
  },

  _orgPanX: 0,
  _orgPanY: 0,
  _orgScale: 1,

  applyOrgTransform() {
    const canvas = document.getElementById('org-chart-canvas');
    if (canvas) {
      canvas.style.transform = `translate3d(${this._orgPanX}px, ${this._orgPanY}px, 0) scale(${this._orgScale})`;
    }
    const label = document.getElementById('org-zoom-level');
    if (label) label.textContent = `${Math.round(this._orgScale * 100)}%`;
  },

  zoomOrgChart(delta) {
    const vp = document.getElementById('org-chart-viewport');
    const oldScale = this._orgScale || 1;
    const newScale = Math.min(Math.max(0.25, oldScale + delta), 2.0);
    if (!vp) {
      this._orgScale = newScale;
      this.applyOrgTransform();
      return;
    }
    const vpCenterX = vp.clientWidth / 2;
    const vpCenterY = vp.clientHeight / 2;
    this._orgPanX = vpCenterX - (vpCenterX - this._orgPanX) * (newScale / oldScale);
    this._orgPanY = vpCenterY - (vpCenterY - this._orgPanY) * (newScale / oldScale);
    this._orgScale = newScale;
    this.applyOrgTransform();
  },

  resetOrgChartZoom() {
    this._orgScale = 1;
    const vp = document.getElementById('org-chart-viewport');
    const canvas = document.getElementById('org-chart-canvas');
    if (vp && canvas) {
      this._orgPanX = Math.round((vp.clientWidth - canvas.offsetWidth) / 2);
      this._orgPanY = 40;
    } else {
      this._orgPanX = 0;
      this._orgPanY = 40;
    }
    this.applyOrgTransform();
  },

  initOrgChartCanvas() {
    const vp = document.getElementById('org-chart-viewport');
    const canvas = document.getElementById('org-chart-canvas');
    if (!vp || !canvas) return;

    // Center canvas initially
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (canvas.offsetWidth > 0) {
          PeopleView._orgPanX = Math.round((vp.clientWidth - canvas.offsetWidth * PeopleView._orgScale) / 2);
          PeopleView._orgPanY = 30;
          PeopleView.applyOrgTransform();
        }
      }, 60);
    });

    if (vp._dragInited) return;
    vp._dragInited = true;

    let isDown = false;
    let startClientX = 0;
    let startClientY = 0;
    let startPanX = 0;
    let startPanY = 0;
    let didMove = false;

    const onMouseDown = (e) => {
      if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) return;
      isDown = true;
      didMove = false;
      vp.style.cursor = 'grabbing';
      startClientX = e.clientX;
      startClientY = e.clientY;
      startPanX = PeopleView._orgPanX;
      startPanY = PeopleView._orgPanY;
    };

    const onMouseMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startClientX;
      const dy = e.clientY - startClientY;
      if (Math.hypot(dx, dy) > 4) {
        didMove = true;
      }
      PeopleView._orgPanX = startPanX + dx;
      PeopleView._orgPanY = startPanY + dy;
      PeopleView.applyOrgTransform();
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      vp.style.cursor = 'grab';
    };

    // Suppress card click drawer if user dragged
    canvas.addEventListener('click', (e) => {
      if (didMove) {
        e.stopPropagation();
        e.preventDefault();
        didMove = false;
      }
    }, true);

    vp.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Mouse wheel pan & zoom
    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
        PeopleView.zoomOrgChart(zoomDelta);
      } else {
        PeopleView._orgPanX -= e.deltaX;
        PeopleView._orgPanY -= e.deltaY;
        PeopleView.applyOrgTransform();
      }
    }, { passive: false });

    // Touch support for tablets/mobile
    let touchStartX = 0, touchStartY = 0, touchStartPanX = 0, touchStartPanY = 0;
    vp.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && !e.target.closest('button')) {
        didMove = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartPanX = PeopleView._orgPanX;
        touchStartPanY = PeopleView._orgPanY;
      }
    }, { passive: true });

    vp.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        if (Math.hypot(dx, dy) > 4) didMove = true;
        PeopleView._orgPanX = touchStartPanX + dx;
        PeopleView._orgPanY = touchStartPanY + dy;
        PeopleView.applyOrgTransform();
      }
    }, { passive: true });
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
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="empty-state-title">All Onboarding Tasks Complete</div>
              <div class="empty-state-desc">No pending checklist items for newly hired employees.</div>
              <div class="empty-state-actions">
                <button class="btn btn-primary btn-sm" onclick="PeopleView.openCreateOnboardingTaskModal()">+ Add Onboarding Task</button>
              </div>
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
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </div>
              <div class="empty-state-title">No Active Separations</div>
              <div class="empty-state-desc">All organizational staff are in good standing; no active resignations or notice periods.</div>
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

  confirmDeleteEmployee(employeeId, empName, empCode = '', empEmail = '') {
    ModalManager.confirm({
      title: 'Delete Employee Record',
      message: `Are you sure you want to permanently delete ${empName} (${empCode || employeeId}) from the Employee Directory? This removes their record from both MySQL and Firestore.`,
      confirmText: 'Delete Employee Permanently',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await employeeService.deleteEmployee(employeeId, empCode, empEmail);
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

  // ---- CSV IMPORT (same columns as Export CSV, so an exported file can be re-imported) ----
  async pushAllToMySQL() {
    try {
      Toast.info('Synchronizing all employees & users to Hostinger MySQL database...');
      const res = await employeeService.syncAllEmployeesToMySQL();
      const count = res?.migrated_counts?.employees || 'all';
      Toast.success(`Successfully pushed ${count} employees and user credentials to Hostinger MySQL database!`);
    } catch (err) {
      Toast.error('Error pushing to MySQL: ' + err.message);
    }
  },

  importCSV() {
    if (typeof CsvImport === 'undefined') { Toast.error('CSV import module failed to load. Hard refresh the page.'); return; }

    const toIsoDate = (v) => {
      if (v === null || v === undefined) return '';
      v = String(v).trim();
      if (!v) return '';

      // Handle Excel serial date numbers (e.g. 45500, 46308)
      if (/^\d{4,5}(\.\d+)?$/.test(v)) {
        const num = parseFloat(v);
        if (num > 30000 && num < 60000) {
          const date = new Date(Math.round((num - 25569) * 86400 * 1000));
          const y = date.getUTCFullYear();
          const m = String(date.getUTCMonth() + 1).padStart(2, '0');
          const d = String(date.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      }

      // DD-Mon-YY or D-Mon-YYYY (e.g. 10-Aug-22, 2-Mar-24, 1-Dec-25)
      const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
      let match = v.match(/^(\d{1,2})[\s\-]+([A-Za-z]{3})[\s\-]+(\d{2,4})$/i);
      if (match) {
        const d = String(match[1]).padStart(2, '0');
        const mon = months[match[2].toLowerCase().substring(0, 3)] || '01';
        const y = match[3].length === 2 ? ('20' + match[3]) : match[3];
        return `${y}-${mon}-${d}`;
      }

      // 1. YYYY-MM-DD or YYYY/MM/DD
      match = v.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (match) {
        const y = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const d = parseInt(match[3], 10);
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }

      // 2. DD/MM/YYYY or D/M/YYYY or M/D/YYYY or DD-MM-YYYY
      match = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (match) {
        let p1 = parseInt(match[1], 10);
        let p2 = parseInt(match[2], 10);
        let y = parseInt(match[3], 10);

        let d = p1, m = p2;
        if (p2 > 12 && p1 <= 12) {
          m = p1; d = p2;
        }
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }

      // 3. Fallback: Parse via JS Date constructor
      const parsed = new Date(v);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }

      return null;
    };
    const STATUS_MAP = { ACTIVE: 'ACTIVE', CONFIRMED: 'CONFIRMED', INACTIVE: 'INACTIVE', 'ON NOTICE': 'ON_NOTICE', ON_NOTICE: 'ON_NOTICE', TERMINATED: 'TERMINATED', RESIGNED: 'RESIGNED', EXITED: 'EXITED' };
    const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';

    CsvImport.open({
      title: 'Import Employees from CSV / Excel',
      templateName: 'Diallo_Employees_Template.csv',
      columns: [
        { key: 'employeeCode', label: 'Employee Code', aliases: ['Emp Code', 'Code', 'E-ID', 'EID', 'ID'] },
        { key: 'fullName', label: 'Full Name', aliases: ['Employee Name', 'Employee', 'Name'], required: true },
        { key: 'workEmail', label: 'Work Email', aliases: ['Work Ema', 'Email'], required: true },
        { key: 'department', label: 'Department', aliases: ['Departme', 'Dept'] },
        { key: 'designation', label: 'Designation', aliases: ['Designati', 'Role', 'Title'] },
        { key: 'branchName', label: 'Branch', aliases: ['Branch Location', 'Location', 'Center'] },
        { key: 'manager', label: 'Reporting Manager', aliases: ['Reporting', 'Manager'] },
        { key: 'dateOfJoining', label: 'Joining Date', aliases: ['Date of Joining', 'DOJ'] },
        { key: 'employmentStatus', label: 'Status', aliases: ['Employment Status'] },
        { key: 'phone', label: 'Phone', aliases: ['Mobile', 'Mobile No', 'Mobile Number'] },
        { key: 'loginPassword', label: 'Login Password', aliases: ['Password', 'Pass', 'Initial Password', 'User Password', 'User Pass', 'Initial Pass'] }
      ],
      sampleRow: { employeeCode: '', fullName: 'Jane Doe', workEmail: 'jane.doe@company.com', department: 'Operations', designation: 'Operations Executive', branchName: 'Ghansoli - Navi Mumbai', manager: '', dateOfJoining: '2026-10-01', employmentStatus: 'ACTIVE', phone: '9876543210', loginPassword: 'Diallo@2026' },

      // Load existing emails/codes once so duplicates within file are caught and existing records can be updated
      prepare: async () => {
        const snap = await db.collection('employees').where('companyId', '==', companyId).get();
        const emailToDocMap = {}, codeToDocMap = {}, managerMap = {};

        const registerManagerKeys = (name, docId) => {
          if (!name || !docId) return;
          const clean = name.trim().toLowerCase();
          managerMap[clean] = docId;
          const parts = clean.split(/\s+/);
          if (parts.length >= 2) {
            managerMap[`${parts[0]} ${parts[parts.length - 1][0]}`] = docId;
            managerMap[`${parts[0]}.${parts[parts.length - 1][0]}`] = docId;
            managerMap[`${parts[0]} ${parts[parts.length - 1]}`] = docId;
          }
        };

        snap.docs.forEach(d => {
          const e = d.data();
          const docId = d.id;
          [e.workEmail, e.email, e.personalEmail].forEach(x => {
            if (x) emailToDocMap[String(x).toLowerCase().trim()] = docId;
          });
          if (e.employeeCode) codeToDocMap[String(e.employeeCode).toUpperCase().trim()] = docId;
          if (e.fullName) registerManagerKeys(e.fullName, docId);
        });

        // Also fetch user accounts to map login passwords
        const userPassMap = {};
        try {
          const uSnap = await db.collection('users').get();
          uSnap.docs.forEach(d => {
            const u = d.data();
            if (u.email) userPassMap[u.email.toLowerCase().trim()] = u.initialPassword || u.password || 'Diallo@2026';
          });
        } catch (_) {}

        // Track registered departments so we dynamically auto-create any new department in CSV
        const knownDepartments = new Set();
        try {
          const deptSnap = await db.collection('departments').get();
          deptSnap.docs.forEach(d => {
            const dName = (d.data().name || '').trim().toLowerCase();
            if (dName) knownDepartments.add(dName);
          });
        } catch (_) {}

        return { emailToDocMap, codeToDocMap, managerMap, userPassMap, knownDepartments, registerManagerKeys };
      },

      validate: (row, ctx, seen) => {
        seen.emails = seen.emails || new Set(); seen.codes = seen.codes || new Set();
        const email = (row.workEmail || '').toLowerCase().trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid work email: ' + (row.workEmail || 'blank');
        if (seen.emails.has(email)) return 'Duplicate email in file: ' + email;
        const code = (row.employeeCode || '').toUpperCase().trim();
        if (code && seen.codes.has(code)) return 'Duplicate employee code in file: ' + code;
        if (row.dateOfJoining && toIsoDate(row.dateOfJoining) === null) return 'Joining Date could not be parsed: ' + row.dateOfJoining;
        seen.emails.add(email); if (code) seen.codes.add(code);
        return null;
      },

      importRow: async (row, ctx) => {
        const email = (row.workEmail || '').toLowerCase().trim();
        let code = (row.employeeCode || '').toUpperCase().trim();
        if (!code) {
          code = 'D' + String(Math.floor(10000 + Math.random() * 90000));
        }
        const existingId = ctx.emailToDocMap[email] || (code ? ctx.codeToDocMap[code] : null);

        const fullName = (row.fullName || '').trim();
        const dept = (row.department || '').trim();
        const desig = (row.designation || '').trim();
        const branch = (row.branchName || row.branch || 'Ghansoli - Navi Mumbai').trim();
        const phone = (row.phone || '').replace(/[^0-9+]/g, '');

        // 1. Dynamic Department Auto-Creation in Firestore & MySQL
        if (dept && !ctx.knownDepartments.has(dept.toLowerCase())) {
          try {
            const deptCode = dept.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'DEPT';
            const deptRef = db.collection('departments').doc();
            await deptRef.set({
              id: deptRef.id,
              name: dept,
              code: deptCode,
              status: 'ACTIVE',
              companyId: companyId,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            ctx.knownDepartments.add(dept.toLowerCase());
            if (typeof apiClient !== 'undefined') {
              apiClient.post('departments.php', { name: dept, code: deptCode, status: 'ACTIVE' }).catch(() => {});
            }
          } catch (_) {}
        }

        const payload = {
          fullName,
          workEmail: email,
          phone,
          employeeCode: code,
          department: dept,
          designation: desig,
          branchName: branch,
          branch
        };

        // Manager / Hierarchy Linking
        if (row.manager) {
          let mgrStr = row.manager.trim();
          let cleanName = mgrStr.replace(/\s*\([^)]+\)/, '').trim();
          let resolvedMgrId = null;

          let codeMatch = mgrStr.match(/\(([^)]+)\)/);
          if (codeMatch && codeMatch[1]) {
            let mCode = codeMatch[1].toUpperCase().trim();
            if (ctx.codeToDocMap && ctx.codeToDocMap[mCode]) {
              resolvedMgrId = ctx.codeToDocMap[mCode];
            }
          }
          if (!resolvedMgrId && ctx.managerMap) {
            const k1 = cleanName.toLowerCase();
            const k2 = k1.replace('.', ' ');
            resolvedMgrId = ctx.managerMap[k1] || ctx.managerMap[k2] || ctx.managerMap[mgrStr.toLowerCase()];
          }
          if (resolvedMgrId) {
            payload.managerId = resolvedMgrId;
            payload.manager = cleanName;
          } else {
            payload.manager = mgrStr;
          }
        }

        const parsedDoj = toIsoDate(row.dateOfJoining);
        if (parsedDoj) {
          payload.dateOfJoining = parsedDoj;
          payload.joiningDate = parsedDoj;
        }

        const rawStatus = (row.employmentStatus || 'ACTIVE').toUpperCase().trim();
        payload.employmentStatus = STATUS_MAP[rawStatus] || 'ACTIVE';
        payload.status = payload.employmentStatus;

        const parts = fullName.split(/\s+/);
        payload.firstName = parts[0] || '';
        payload.lastName = parts.slice(1).join(' ') || '';

        const loginPass = (row.loginPassword || '').trim() || (ctx.userPassMap && ctx.userPassMap[email]) || 'Diallo@2026';
        payload.initialPassword = loginPass;
        payload.loginPassword = loginPass;

        let savedId = existingId;
        if (existingId) {
          await employeeService.updateEmployee(existingId, payload);
        } else {
          const newEmp = await employeeService.createEmployee(payload);
          savedId = newEmp.id;
        }

        // Keep user login account synchronized in Firestore 'users' collection
        try {
          const targetUid = savedId || ('emp_' + code.toLowerCase().replace(/[^a-z0-9]/g, ''));
          await db.collection('users').doc(targetUid).set({
            uid: targetUid,
            employeeCode: code,
            email: email,
            displayName: fullName,
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone || '',
            department: dept,
            designation: desig,
            roleId: 'EMPLOYEE',
            initialPassword: loginPass,
            companyId: companyId,
            status: payload.employmentStatus || 'ACTIVE',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (_) {}

        // Dynamically register this employee in managerMap so subsequent rows match immediately
        if (savedId) {
          if (email) ctx.emailToDocMap[email] = savedId;
          if (code) ctx.codeToDocMap[code] = savedId;
          if (ctx.registerManagerKeys) ctx.registerManagerKeys(fullName, savedId);
        }
      },
      onDone: async (r) => {
        if (r.imported) {
          Toast.info('Connecting organizational hierarchy & syncing with Hostinger MySQL...');
          try {
            // Second pass: resolve any hierarchical managers listed later in the CSV file
            const allSnap = await db.collection('employees').where('companyId', '==', companyId).get();
            const emps = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const mLookup = {};
            emps.forEach(e => {
              if (e.fullName) {
                const clean = e.fullName.trim().toLowerCase();
                mLookup[clean] = e.id;
                const parts = clean.split(/\s+/);
                if (parts.length >= 2) {
                  mLookup[`${parts[0]} ${parts[parts.length - 1][0]}`] = e.id;
                  mLookup[`${parts[0]}.${parts[parts.length - 1][0]}`] = e.id;
                  mLookup[`${parts[0]} ${parts[parts.length - 1]}`] = e.id;
                }
              }
            });

            const batch = db.batch();
            let linkCount = 0;
            emps.forEach(e => {
              if (e.manager && !e.managerId) {
                const k1 = e.manager.trim().toLowerCase();
                const k2 = k1.replace('.', ' ');
                const matchedId = mLookup[k1] || mLookup[k2];
                if (matchedId && matchedId !== e.id) {
                  batch.update(db.collection('employees').doc(e.id), { managerId: matchedId });
                  linkCount++;
                }
              }
            });
            if (linkCount > 0) {
              await batch.commit();
              console.log(`[CSV Import] Linked ${linkCount} manager-employee hierarchy reporting lines.`);
            }
          } catch (hierErr) {
            console.warn('[CSV Import] Hierarchy resolution warning:', hierErr);
          }

          try {
            await PeopleView.syncDatabaseUsers();
          } catch (_) {}
          if (window.Router) Router.navigate('employees');
        }
      }
    });
  },

  async exportCSV() {
    try {
      const employees = await employeeService.getEmployees(this.currentFilters);

      // Fetch user accounts mapping for login passwords
      const userPassMap = {};
      try {
        const uSnap = await db.collection('users').get();
        uSnap.docs.forEach(d => {
          const u = d.data();
          if (u.email) userPassMap[u.email.toLowerCase().trim()] = u.initialPassword || u.password;
        });
      } catch (_) {}

      const headers = ['Employee Code', 'Full Name', 'Department', 'Designation', 'Branch', 'Reporting Manager', 'Joining Date', 'Status', 'Work Email', 'Phone', 'Login Password'];
      const rows = employees.map(e => {
        const email = (e.workEmail || e.email || '').toLowerCase().trim();
        const pass = e.loginPassword || e.initialPassword || userPassMap[email] || 'Diallo@2026';
        return [
          `"${e.employeeCode || ''}"`,
          `"${e.fullName || e.name || ''}"`,
          `"${e.department || ''}"`,
          `"${e.designation || ''}"`,
          `"${e.branchName || e.location || ''}"`,
          `"${e.manager || ''}"`,
          `"${e.dateOfJoining || e.joiningDate || ''}"`,
          `"${e.employmentStatus || ''}"`,
          `"${e.workEmail || e.email || ''}"`,
          `"${e.phone || ''}"`,
          `"${pass}"`
        ];
      });

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Diallo_Employees_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Toast.success('Exported Employee Census CSV with Login Passwords.');
    } catch (e) {
      Toast.error(`Export failed: ${e.message}`);
    }
  },

  initEmployeesTable() {
    if (this.activeTab === 'orgchart' && typeof this.initOrgChartCanvas === 'function') {
      this.initOrgChartCanvas();
    }
  },

  async syncDatabaseUsers() {
    try {
      if (typeof Toast !== 'undefined') Toast.info('Synchronizing workforce personnel across Hostinger MySQL & Cloud Firestore...');
      const res = await employeeService.syncUsersToEmployees(true);
      const totalCount = res.total || (res.created + res.synced) || 56;
      if (typeof Toast !== 'undefined') {
        Toast.success(`Synchronization complete! ${totalCount} workforce personnel synchronized across MySQL & Firestore.`);
      }
      if (typeof Router !== 'undefined' && Router.navigate) {
        Router.navigate('employees');
      } else {
        window.location.reload();
      }
    } catch (e) {
      if (typeof Toast !== 'undefined') Toast.error(`User sync error: ${e.message}`);
    }
  }
};

window.PeopleView = PeopleView;


