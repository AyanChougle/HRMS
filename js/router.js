/**
 * DIALLO HRMS — ROLE-AWARE SPA ROUTER (PHASE 3)
 * Dynamic role-based navigation sidebar & route-level permission guards
 */

const Router = {
  currentRoute: 'dashboard',
  routes: {
    dashboard: {
      requiredPerm: null, // Open to all authenticated
      render: () => DashboardView.render(),
      postRender: () => DashboardView.postRender && DashboardView.postRender()
    },
    people: {
      requiredPerm: 'people.view',
      render: () => PeopleView.renderHub()
    },
    employees: {
      requiredPerm: 'people.view',
      render: () => PeopleView.renderEmployees(),
      postRender: () => PeopleView.initEmployeesTable()
    },
    departments: {
      requiredPerm: 'people.view',
      render: () => PeopleView.renderDepartments()
    },
    attendance: {
      requiredPerm: 'attendance.view',
      render: () => AttendanceView.renderHub()
    },
    leave: {
      requiredPerm: 'leave.view',
      render: () => LeaveView.renderHub()
    },
    payroll: {
      requiredPerm: 'payroll.view',
      render: () => PayrollView.renderHub()
    },
    'payslip-templates': {
      requiredPerm: 'payroll.view',
      render: () => PayslipTemplatesView.render()
    },
    'email-config': {
      requiredPerm: 'settings.manage',
      render: () => EmailConfigView.render()
    },
    performance: {
      requiredPerm: 'performance.view',
      render: () => PerformanceView.renderHub()
    },
    training: {
      requiredPerm: null,
      render: () => window.TrainingView ? TrainingView.renderHub() : '<div class="card p-6">Loading Training...</div>'
    },
    recruitment: {
      requiredPerm: null,
      render: () => RecruitmentView.renderHub()
    },
    expenses: {
      requiredPerm: 'expenses.view',
      render: () => ExpensesView.render()
    },
    assets: {
      requiredPerm: null,
      render: () => AssetsView.render()
    },
    documents: {
      requiredPerm: null,
      render: () => DocumentsView.render()
    },
    requests: {
      requiredPerm: null,
      render: () => RequestsView.render()
    },
    ess: {
      requiredPerm: 'own.profile',
      render: () => ESSView.renderHub()
    },
    communication: {
      requiredPerm: 'communication.view',
      render: () => CommsView.renderHub()
    },
    reports: {
      requiredPerm: 'reports.view',
      render: () => ReportsView.renderHub()
    },
    workflows: {
      requiredPerm: null,
      render: () => WorkflowsView.render()
    },
    admin: {
      requiredPerm: 'companies.manage',
      render: () => window.MasterAdminView ? MasterAdminView.render() : AdminView.renderHub()
    },
    compliance: {
      requiredPerm: null,
      render: () => ComplianceView.render()
    },
    security: {
      requiredPerm: 'settings.manage',
      render: () => SecurityView.render()
    },
    qa: {
      requiredPerm: 'settings.manage',
      render: () => QAView.render()
    },
    deployment: {
      requiredPerm: 'settings.manage',
      render: () => DeploymentView.render()
    },
    users: {
      requiredPerm: 'users.manage',
      render: () => UsersView.render()
    },
    'create-employee': {
      requiredPerm: null,
      render: () => window.CreateEmployeeView ? CreateEmployeeView.render() : '<div class="card p-6">Loading Onboarding...</div>'
    },
    'role-permissions': {
      requiredPerm: null,
      render: () => window.RolePermissionsView ? RolePermissionsView.render() : '<div class="card p-6">Loading Role Governance...</div>'
    },
    settings: {
      requiredPerm: null,
      render: () => SettingsView.renderHub()
    }
  },

  init() {
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.renderDynamicSidebar();
    this.handleHashChange();
  },

  async handleHashChange() {
    const rawHash = window.location.hash.slice(1).trim();
    const route = rawHash.split('?')[0] || 'dashboard';

    if (this.routes[route]) {
      this.currentRoute = route;
    } else {
      this.currentRoute = 'dashboard';
    }

    await this.mountView(this.currentRoute);
    this.updateSidebarActive(this.currentRoute);
  },

  navigate(route) {
    document.querySelector('.app-container')?.classList.remove('mobile-sidebar-open');
    if (window.location.hash === `#${route}`) {
      this.handleHashChange();
    } else {
      window.location.hash = `#${route}`;
    }
  },

  async mountView(routeKey) {
    const mainContent = document.getElementById('main-content-viewport');
    if (!mainContent) return;

    const routeConfig = this.routes[routeKey];
    if (!routeConfig) return;

    // Check Role / Permission Guard
    if (routeConfig.requiredPerm && !AuthGuard.hasPermission(routeConfig.requiredPerm)) {
      RoleGuard.handleAccessDenied();
      return;
    }

    // Check Role / Page Visibility Guard
    const userRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    if (typeof roleAccessService !== 'undefined' && !roleAccessService.isRouteAllowed(userRole, routeKey)) {
      const isPayroll = routeKey === 'payroll' || routeKey === 'payslip-templates';
      mainContent.innerHTML = `
        <div class="card p-6 text-center" style="max-width: 600px; margin: 40px auto;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--danger-light); color: var(--danger); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Access Restricted</h2>
          <p style="color: var(--text-secondary); margin-bottom: 20px;">
            ${isPayroll 
              ? 'Payroll and compensation ledgers are strictly restricted to Super Admin and HR. To receive your official salary slip, please submit a request via HR Requests.' 
              : `This page is not enabled for your assigned role (${userRole}) as per organization policy.`}
          </p>
          <div class="flex justify-center gap-2">
            ${isPayroll ? `<button class="btn btn-primary btn-sm" onclick="Router.navigate('requests')">Go to HR Requests</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="Router.navigate('dashboard')">Return to Dashboard</button>
          </div>
        </div>
      `;
      return;
    }

    try {
      const html = await routeConfig.render();
      mainContent.innerHTML = html;
      window.scrollTo({ top: 0, behavior: 'instant' });

      document.querySelector('.app-container')?.classList.remove('mobile-sidebar-open');

      if (typeof routeConfig.postRender === 'function') {
        setTimeout(async () => {
          try {
            await routeConfig.postRender();
          } catch (postErr) {
            console.warn(`PostRender warning in ${routeKey}:`, postErr);
          }
        }, 0);
      }
    } catch (err) {
      console.error(`Error mounting view ${routeKey}:`, err);
      mainContent.innerHTML = `
        <div class="empty-state" style="padding: 40px;">
          <div class="empty-state-title text-danger">Failed to load view</div>
          <div class="empty-state-desc">${err.message}</div>
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('${routeKey}')">Retry</button>
        </div>
      `;
    }
  },

  // Dynamically render sidebar navigation items based on active role & Super Admin policy configuration
  renderDynamicSidebar() {
    const sidebarSection = document.querySelector('.app-sidebar .sidebar-nav-section');
    if (!sidebarSection) return;

    const rawRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    const role = rawRole;

    // Fetch allowed pages configured by Super Admin (falls back to official policy defaults)
    let allowedKeys = (typeof roleAccessService !== 'undefined')
      ? roleAccessService.getVisiblePagesForRole(role)
      : ['dashboard', 'attendance', 'leave', 'compliance', 'ess'];

    // Performance & Appraisals tab is strictly excluded for Trainee
    if (role === 'TRAINEE' || role.includes('TRAINEE')) {
      allowedKeys = allowedKeys.filter(k => k !== 'performance');
    }

    const allPages = (typeof roleAccessService !== 'undefined') ? roleAccessService.PAGES : [];

    const coreItems = [];
    const systemItems = [];

    allPages.forEach(p => {
      if (allowedKeys.includes(p.key)) {
        const item = { route: p.key, label: p.label, icon: p.icon };
        if (p.category === 'Administration' || p.key === 'settings' || p.key === 'role-permissions') {
          systemItems.push(item);
        } else {
          coreItems.push(item);
        }
      }
    });

    let roleBadgeTitle = 'My Workspace';
    if (role === 'SUPER_ADMIN') roleBadgeTitle = 'Super Admin Console';
    else if (role.includes('HR')) roleBadgeTitle = 'HR Management';
    else if (role === 'TRAINER') roleBadgeTitle = 'Trainer Workspace';
    else if (role === 'TRAINEE') roleBadgeTitle = 'Trainee Learning Track';
    else if (role === 'COMPANY_ADMIN') roleBadgeTitle = 'Admin Portal';

    const renderItems = (items) => items.map(item => `
      <a href="#${item.route}" class="nav-link ${this.currentRoute === item.route ? 'active' : ''}" data-route="${item.route}">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}" />
        </svg>
        <span class="nav-text">${item.label}</span>
      </a>
    `).join('');

    let html = `<div class="sidebar-section-title">${roleBadgeTitle}</div>${renderItems(coreItems)}`;
    if (systemItems.length > 0) {
      html += `<div class="sidebar-section-title" style="margin-top: 10px">Administration</div>${renderItems(systemItems)}`;
    }
    sidebarSection.innerHTML = html;
  },

  updateSidebarActive(routeKey) {
    let activeNavKey = routeKey;
    if (['departments'].includes(routeKey)) {
      activeNavKey = 'people';
    }

    const navLinks = document.querySelectorAll('.app-sidebar .nav-link');
    navLinks.forEach(link => {
      const linkTarget = link.getAttribute('data-route');
      if (linkTarget === activeNavKey) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
};

window.Router = Router;
