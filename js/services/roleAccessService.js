/**
 * DIALLO HRMS — ROLE & PAGE ACCESS CONFIGURATION SERVICE
 * Enables Super Admin to configure and enforce visible navigation pages per role.
 * Fallbacks cleanly to official Diallo HR policy defaults.
 */

const roleAccessService = {
  COLLECTION: 'systemConfig',
  DOC_ID: 'role_page_permissions',
  STORAGE_KEY: 'diallo_role_page_permissions_v4',

  // Master Registry of all system views and navigation pages
  PAGES: [
    { key: 'dashboard', label: 'Dashboard & Hub', category: 'Core', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { key: 'people', label: 'Employees & Organization', category: 'HR Operations', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { key: 'create-employee', label: 'Create Employee Login', category: 'Onboarding', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { key: 'training', label: '7-Day Training Modules', category: 'L&D & Training', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { key: 'attendance', label: 'Attendance & Late Marks', category: 'Core', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'leave', label: 'Leave Management', category: 'Core', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { key: 'compliance', label: 'Master HR Policies & Rules', category: 'Compliance', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { key: 'payroll', label: 'Payroll & Payslips', category: 'Finance', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'recruitment', label: 'Recruitment & ATS', category: 'Talent', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { key: 'expenses', label: 'Expense Claims', category: 'Finance', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { key: 'assets', label: 'IT Assets Management', category: 'Operations', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { key: 'performance', label: 'Performance & Appraisals', category: 'Talent', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z' },
    { key: 'documents', label: 'Documents & Dossiers', category: 'HR Operations', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'requests', label: 'HR Helpdesk Requests', category: 'HR Operations', icon: 'M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20' },
    { key: 'workflows', label: 'Workflows & Approvals', category: 'Operations', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { key: 'communication', label: 'Notice Board & Comms', category: 'Engagement', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    { key: 'reports', label: 'Reports & Analytics', category: 'Management', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'ess', label: 'My Profile (Self Service)', category: 'Self Service', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { key: 'role-permissions', label: 'Role & Page Visibility', category: 'Administration', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { key: 'settings', label: 'System Settings', category: 'Administration', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ],

  // Official Policy Defaults Per Role (Strict 8 Roles Hierarchy)
  DEFAULT_ROLE_PAGES: {
    SUPER_ADMIN: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave',
      'compliance', 'payroll', 'recruitment', 'expenses', 'assets', 'performance',
      'documents', 'requests', 'workflows', 'communication', 'reports', 'role-permissions',
      'settings', 'ess'
    ],
    COMPANY_ADMIN: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave',
      'compliance', 'payroll', 'recruitment', 'expenses', 'assets', 'performance',
      'documents', 'requests', 'workflows', 'communication', 'reports', 'settings', 'ess'
    ],
    ADMIN: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave',
      'compliance', 'payroll', 'recruitment', 'expenses', 'assets', 'performance',
      'documents', 'requests', 'workflows', 'communication', 'reports', 'settings', 'ess'
    ],
    HR_MANAGER: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave', 'payroll',
      'recruitment', 'compliance', 'documents', 'requests', 'communication', 'reports', 'ess'
    ],
    HR: [
      'dashboard', 'people', 'create-employee', 'training', 'attendance', 'leave', 'payroll',
      'recruitment', 'compliance', 'documents', 'requests', 'communication', 'reports', 'ess'
    ],
    MANAGER: [
      'dashboard', 'people', 'attendance', 'leave', 'performance', 'compliance',
      'workflows', 'requests', 'communication', 'reports', 'ess'
    ],
    TEAM_LEAD: [
      'dashboard', 'people', 'attendance', 'leave', 'performance', 'compliance',
      'workflows', 'requests', 'communication', 'reports', 'ess'
    ],
    MENTOR: [
      'dashboard', 'training', 'attendance', 'leave', 'performance', 'compliance',
      'documents', 'communication', 'ess'
    ],
    TRAINER: [
      'dashboard', 'training', 'create-employee', 'attendance', 'leave', 'performance',
      'compliance', 'documents', 'communication', 'ess'
    ],
    TRAINEE: [
      'dashboard', 'training', 'attendance', 'leave', 'performance', 'compliance',
      'documents', 'communication', 'ess'
    ],
    EMPLOYEE: [
      'dashboard', 'ess', 'attendance', 'leave', 'performance', 'compliance',
      'assets', 'documents', 'requests', 'communication'
    ]
  },

  cachedConfig: null,

  async init() {
    try {
      // Invalidate legacy cached permissions from old versions
      localStorage.removeItem('diallo_role_page_permissions_v1');
      localStorage.removeItem('diallo_role_page_permissions_v2');
      localStorage.removeItem('diallo_role_page_permissions_v3');
      const local = localStorage.getItem(this.STORAGE_KEY);
      if (local) {
        this.cachedConfig = JSON.parse(local);
      }
      // Async fetch latest from Firestore
      this.fetchFromFirestore().catch(() => {});
    } catch (_) {}
  },

  async fetchFromFirestore() {
    try {
      if (typeof db === 'undefined') return;
      const snap = await db.collection(this.COLLECTION).doc(this.DOC_ID).get();
      if (snap.exists) {
        const data = snap.data() || {};
        const sanitized = { ...data };
        // Strictly sanitize: Remove payroll from non-admin/HR roles and ensure performance is present
        ['EMPLOYEE', 'TRAINEE', 'MENTOR', 'TRAINER', 'TEAM_LEAD', 'MANAGER'].forEach(role => {
          if (Array.isArray(sanitized[role])) {
            sanitized[role] = sanitized[role].filter(p => p !== 'payroll' && p !== 'payslip-templates');
            if (!sanitized[role].includes('performance')) {
              sanitized[role].push('performance');
            }
          }
        });
        this.cachedConfig = sanitized;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cachedConfig));
      }
    } catch (e) {
      console.warn('[RoleAccess] Could not fetch Firestore configuration:', e);
    }
  },

  getVisiblePagesForRole(roleId) {
    const r = (roleId || 'EMPLOYEE').toUpperCase().trim();
    
    let pages = null;
    // Check custom configuration first
    if (this.cachedConfig && this.cachedConfig[r] && Array.isArray(this.cachedConfig[r])) {
      pages = [...this.cachedConfig[r]];
    } else if (this.DEFAULT_ROLE_PAGES[r]) {
      pages = [...this.DEFAULT_ROLE_PAGES[r]];
    } else if (r.includes('SUPER_ADMIN')) {
      pages = [...this.DEFAULT_ROLE_PAGES.SUPER_ADMIN];
    } else if (r.includes('COMPANY') || r.includes('ADMIN')) {
      pages = [...this.DEFAULT_ROLE_PAGES.COMPANY_ADMIN];
    } else if (r.includes('HR')) {
      pages = [...this.DEFAULT_ROLE_PAGES.HR];
    } else if (r.includes('MANAGER')) {
      pages = [...this.DEFAULT_ROLE_PAGES.MANAGER];
    } else if (r.includes('LEAD') || r.includes('TL')) {
      pages = [...this.DEFAULT_ROLE_PAGES.TEAM_LEAD];
    } else if (r.includes('MENTOR')) {
      pages = [...this.DEFAULT_ROLE_PAGES.MENTOR];
    } else if (r.includes('TRAIN') && !r.includes('TRAINEE')) {
      pages = [...this.DEFAULT_ROLE_PAGES.TRAINER];
    } else if (r.includes('TRAINEE') || r.includes('INTERN')) {
      pages = [...this.DEFAULT_ROLE_PAGES.TRAINEE];
    } else {
      pages = [...this.DEFAULT_ROLE_PAGES.EMPLOYEE];
    }

    const isHrOrAdmin = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'HR', 'HR_MANAGER'].includes(r);
    // Unconditional security: Non-admin/HR roles NEVER see payroll or payslip-templates
    if (!isHrOrAdmin) {
      pages = pages.filter(p => p !== 'payroll' && p !== 'payslip-templates');
    }

    // Operational roles (Employee, Trainee, Mentor, TL, Manager) ALWAYS see performance to view goals by Team Leader
    if (['EMPLOYEE', 'TRAINEE', 'MENTOR', 'TRAINER', 'TEAM_LEAD', 'MANAGER'].includes(r)) {
      if (!pages.includes('performance')) {
        pages.push('performance');
      }
    }

    return pages;
  },

  isRouteAllowed(roleId, routeKey) {
    const r = (roleId || 'EMPLOYEE').toUpperCase().trim();
    if (r === 'SUPER_ADMIN') return true;

    // Hard security check for payroll: Only HR and Super/Company Admin allowed
    const isHrOrAdmin = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'HR', 'HR_MANAGER'].includes(r);
    if (!isHrOrAdmin && (routeKey === 'payroll' || routeKey === 'payslip-templates')) {
      return false;
    }

    // Performance is allowed for all operational roles (employees, trainees, mentors, team leads, managers)
    if (routeKey === 'performance' && ['EMPLOYEE', 'TRAINEE', 'MENTOR', 'TRAINER', 'TEAM_LEAD', 'MANAGER', 'HR', 'HR_MANAGER', 'COMPANY_ADMIN'].includes(r)) {
      return true;
    }

    // Normalize sub-route aliases to their primary permission key
    let primaryKey = routeKey;
    if (['employees', 'departments', 'org-chart'].includes(routeKey)) {
      primaryKey = 'people';
    } else if (['payslip-templates', 'email-config'].includes(routeKey)) {
      primaryKey = 'payroll';
    } else if (['security', 'qa', 'deployment', 'users', 'admin'].includes(routeKey)) {
      primaryKey = 'settings';
    }

    const allowed = this.getVisiblePagesForRole(r);
    return allowed.includes(primaryKey);
  },

  async saveRolePermissions(roleId, pagesList) {
    try {
      const r = (roleId || 'EMPLOYEE').toUpperCase().trim();
      if (!this.cachedConfig) {
        this.cachedConfig = { ...this.DEFAULT_ROLE_PAGES };
      }
      this.cachedConfig[r] = pagesList;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cachedConfig));

      if (typeof db !== 'undefined') {
        await db.collection(this.COLLECTION).doc(this.DOC_ID).set(this.cachedConfig, { merge: true });
        if (typeof auditService !== 'undefined') {
          await auditService.log('ROLE_PERMISSIONS_UPDATED', 'SECURITY', 'systemConfig', this.DOC_ID, { roleId: r, pages: pagesList });
        }
      }

      // Re-render sidebar if currently active
      if (typeof Router !== 'undefined' && Router.renderDynamicSidebar) {
        Router.renderDynamicSidebar();
      }

      return true;
    } catch (e) {
      console.error('[RoleAccess] Failed to save role permissions:', e);
      throw e;
    }
  },

  async resetRoleToDefault(roleId) {
    const r = (roleId || 'EMPLOYEE').toUpperCase().trim();
    const defaults = this.DEFAULT_ROLE_PAGES[r] || this.DEFAULT_ROLE_PAGES.EMPLOYEE;
    await this.saveRolePermissions(r, defaults);
    return defaults;
  }
};

window.roleAccessService = roleAccessService;
roleAccessService.init();
