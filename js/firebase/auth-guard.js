/**
 * DIALLO HRMS — AUTH GUARD & SESSION VALIDATOR
 * 100% Hostinger MySQL & PHP Backend — Zero Firebase Dependency
 * Enforces Strict 7 Canonical Roles and Route Access Control
 */

const AuthGuard = {
  currentUser: null,
  userProfile: null,
  userRole: null,
  permissions: new Set(),
  isInitialized: false,

  // Canonical 7-Role Resolver: Maps any legacy role string to one of the 7 canonical roles.
  resolveCanonicalRole(roleId, designation, email) {
    const cleanRole = (roleId || '').toString().toUpperCase().trim();
    if (['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'].includes(cleanRole)) return 'ADMIN';
    if (['HR', 'HR_MANAGER'].includes(cleanRole)) return 'HR';
    if (['OPS', 'OPERATIONS_MANAGER', 'PROCESS_OWNER'].includes(cleanRole)) return 'OPS';
    if (cleanRole === 'COMPLIANCE') return 'COMPLIANCE';
    if (cleanRole === 'MANAGER') return 'MANAGER';
    if (['TL', 'TEAM_LEAD'].includes(cleanRole)) return 'TL';

    // Strict 7-role policy: all staff are EMPLOYEE
    return 'EMPLOYEE';
  },

  getRoleLabel(roleId) {
    const r = (roleId || '').toString().toUpperCase().trim();
    const map = {
      ADMIN: 'Admin',
      SUPER_ADMIN: 'Admin',
      COMPANY_ADMIN: 'Admin',
      HR: 'HR',
      HR_MANAGER: 'HR',
      OPS: 'OPS',
      OPERATIONS_MANAGER: 'OPS',
      PROCESS_OWNER: 'OPS',
      COMPLIANCE: 'Compliance',
      MANAGER: 'Manager',
      TL: 'TL',
      TEAM_LEAD: 'TL',
      EMPLOYEE: 'Employee'
    };
    return map[r] || 'Employee';
  },

  getPermissionsForRole(roleId) {
    const r = this.resolveCanonicalRole(roleId);
    if (r === 'ADMIN') {
      return new Set(['*']);
    }
    if (r === 'HR') {
      return new Set([
        'people.*', 'attendance.*', 'leave.*', 'recruitment.*', 'compliance.*',
        'expenses.*', 'assets.*', 'performance.*', 'documents.*', 'requests.*',
        'reports.*', 'users.manage', 'ess'
      ]);
    }
    if (r === 'OPS') {
      return new Set([
        'people.view', 'attendance.view', 'leave.view', 'performance.view',
        'compliance.view', 'requests.view', 'communication.view', 'reports.view', 'ess'
      ]);
    }
    if (r === 'COMPLIANCE') {
      return new Set([
        'compliance.*', 'documents.view', 'reports.view', 'attendance.view',
        'leave.view', 'communication.view', 'requests.view', 'ess'
      ]);
    }
    if (r === 'MANAGER') {
      return new Set([
        'people.view', 'attendance.view', 'leave.view', 'performance.view',
        'compliance.view', 'requests.view', 'communication.view', 'reports.view', 'ess'
      ]);
    }
    if (r === 'TL') {
      return new Set([
        'people.view', 'attendance.view', 'leave.view', 'performance.view',
        'compliance.view', 'requests.view', 'communication.view', 'reports.view', 'ess'
      ]);
    }
    // Default EMPLOYEE
    return new Set([
      'own.profile', 'attendance.view', 'attendance.punch', 'leave.view',
      'leave.create', 'performance.view', 'expenses.view', 'expenses.create',
      'assets.view', 'documents.view', 'requests.view', 'requests.create',
      'communication.view', 'reports.view', 'ess'
    ]);
  },

  // Initialize Auth Guard on page load
  async init(options = {}) {
    const { isPublicPage = false } = options;

    // 1. First, check cached local session for instant paint
    let cachedSession = null;
    try {
      const raw = sessionStorage.getItem('dh_user_session') || localStorage.getItem('dh_user_session');
      if (raw) cachedSession = JSON.parse(raw);
    } catch (_) {}

    if (cachedSession && cachedSession.email) {
      const resolvedRole = this.resolveCanonicalRole(cachedSession.roleId, cachedSession.designation, cachedSession.email);
      cachedSession.roleId = resolvedRole;
      this.currentUser = {
        uid: cachedSession.uid || `usr_${cachedSession.id}`,
        email: cachedSession.email,
        displayName: cachedSession.displayName || cachedSession.email.split('@')[0],
        getIdToken: async () => sessionStorage.getItem('dh_bearer_token') || 'mysql-session-token'
      };
      this.userProfile = cachedSession;
      this.userRole = { id: resolvedRole, name: this.getRoleLabel(resolvedRole) };
      this.permissions = this.getPermissionsForRole(resolvedRole);
      this.isInitialized = true;
      this.syncHeaderProfile();

      if (isPublicPage) {
        window.location.replace('index.html#dashboard');
        return this.currentUser;
      }
    }

    // 2. Validate session with Hostinger PHP Backend
    try {
      if (typeof authService !== 'undefined' && authService.checkSession) {
        const verifyRes = await authService.checkSession();
        if (verifyRes && verifyRes.success && verifyRes.user) {
          const u = verifyRes.user;
          const resolvedRole = this.resolveCanonicalRole(u.roleId, u.designation, u.email);
          u.roleId = resolvedRole;

          // Check account status
          const status = (u.status || 'ACTIVE').toUpperCase().trim();
          if (status === 'INACTIVE' || status === 'SUSPENDED') {
            await this.logout();
            alert(`Account Access Blocked: Your account status is currently '${status}'. Please contact HR administration.`);
            return null;
          }

          this.currentUser = {
            uid: u.uid || `usr_${u.id}`,
            email: u.email,
            displayName: u.displayName || u.email.split('@')[0],
            getIdToken: async () => sessionStorage.getItem('dh_bearer_token') || 'mysql-session-token'
          };
          this.userProfile = u;
          this.userRole = { id: resolvedRole, name: this.getRoleLabel(resolvedRole) };
          this.permissions = this.getPermissionsForRole(resolvedRole);
          this.isInitialized = true;
          this.syncHeaderProfile();

          if (isPublicPage) {
            window.location.replace('index.html#dashboard');
            return this.currentUser;
          }

          // Render dynamic navigation & mount active route
          if (window.Router) {
            if (window.Router.renderDynamicSidebar) window.Router.renderDynamicSidebar();
            if (window.Router.handleHashChange) window.Router.handleHashChange();
          }

          return this.currentUser;
        }
      }
    } catch (checkErr) {
      console.warn('[AuthGuard] Server session check note:', checkErr.message);
    }

    // If cached session was valid and server is temporarily unreachable, allow continued access
    if (this.currentUser && !isPublicPage) {
      if (window.Router) {
        if (window.Router.renderDynamicSidebar) window.Router.renderDynamicSidebar();
        if (window.Router.handleHashChange) window.Router.handleHashChange();
      }
      return this.currentUser;
    }

    // Unauthenticated state
    this.currentUser = null;
    this.userProfile = null;
    this.userRole = null;
    this.permissions.clear();
    this.isInitialized = true;

    if (!isPublicPage) {
      const currentPath = window.location.href;
      sessionStorage.setItem('redirect_after_login', currentPath);
      window.location.replace('login.html');
      return null;
    }

    return null;
  },

  // Granular Permission Verification
  hasPermission(permissionName) {
    if (!permissionName) return true;
    if (!this.isInitialized) return false;

    const role = this._previewRoleId || this.userProfile?.roleId || 'EMPLOYEE';
    const canonical = this.resolveCanonicalRole(role);
    if (canonical === 'ADMIN') return true;

    if (window.PermissionService) {
      return PermissionService.hasPermission(permissionName, this.permissions, canonical);
    }
    return this.permissions.has('*') || this.permissions.has(permissionName);
  },

  hasRole(role) {
    const active = this.resolveCanonicalRole(this._previewRoleId || this.userProfile?.roleId || 'EMPLOYEE');
    return active === this.resolveCanonicalRole(role);
  },

  hasAnyRole(roles = []) {
    const active = this.resolveCanonicalRole(this._previewRoleId || this.userProfile?.roleId || 'EMPLOYEE');
    return roles.map(r => this.resolveCanonicalRole(r)).includes(active);
  },

  isMasterAdmin() {
    return this.hasRole('ADMIN');
  },

  // Preview-only role switch for Admins
  async switchRole(roleId) {
    if (!this.userProfile) return;

    if (!this._actualRoleId) {
      this._actualRoleId = this.resolveCanonicalRole(this.userProfile.roleId, this.userProfile.designation, this.userProfile.email);
    }

    if (this._actualRoleId !== 'ADMIN') {
      if (typeof Toast !== 'undefined') {
        Toast.error('Only the Administrator can preview different role views.');
      }
      return;
    }

    const canonical = this.resolveCanonicalRole(roleId);
    this._previewRoleId = canonical;
    this.userProfile.roleId = canonical;
    this.userRole = { id: canonical, name: this.getRoleLabel(canonical) };
    this.permissions = this.getPermissionsForRole(canonical);

    const headerSwitcher = document.getElementById('header-role-switcher');
    if (headerSwitcher) headerSwitcher.value = canonical;
    const popoverSwitcher = document.getElementById('popover-role-switcher');
    if (popoverSwitcher) popoverSwitcher.value = canonical;

    this.syncHeaderProfile();

    if (window.Router) {
      if (window.Router.renderDynamicSidebar) window.Router.renderDynamicSidebar();
      window.Router.navigate('dashboard');
      if (window.location.hash === '#dashboard' && window.Router.handleHashChange) {
        window.Router.handleHashChange();
      }
    }

    if (typeof Toast !== 'undefined') {
      Toast.success(`Active Role View changed to: ${this.getRoleLabel(canonical)}`);
    }
  },

  // Sync user profile with header UI in index.html
  syncHeaderProfile() {
    const nameEls = document.querySelectorAll('.user-name-label');
    const roleEls = document.querySelectorAll('.user-role-label');
    const avatarEls = document.querySelectorAll('.user-profile-trigger .avatar-img, #profile-popover .avatar-img');
    const companyLabel = document.getElementById('current-company-label');
    const branchLabel = document.getElementById('current-branch-label');

    if (this.userProfile) {
      const name = this.userProfile.displayName || this.userProfile.fullName || this.currentUser?.email?.split('@')[0] || 'User';
      const role = this.userRole?.name || this.getRoleLabel(this.userProfile.roleId);
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DH';

      nameEls.forEach(el => { el.textContent = name; });
      roleEls.forEach(el => { el.textContent = role; });
      avatarEls.forEach(el => { el.textContent = initials; });
      if (companyLabel) companyLabel.textContent = this.userProfile.companyName || 'Diallo India';
      if (branchLabel) branchLabel.textContent = this.userProfile.branchName || 'Ghansoli - Navi Mumbai';

      const rawRole = this.resolveCanonicalRole(this.userProfile.roleId);
      const actualRole = this.resolveCanonicalRole(this._actualRoleId || rawRole);
      const canSwitchRoles = (actualRole === 'ADMIN');

      const permItem = document.getElementById('dropdown-permissions-item');
      if (permItem) {
        permItem.style.display = (rawRole === 'ADMIN') ? 'flex' : 'none';
      }

      const settingsItem = document.getElementById('dropdown-settings-item');
      if (settingsItem) {
        settingsItem.style.display = (rawRole === 'ADMIN') ? 'flex' : 'none';
      }

      const headerRoleWrapper = document.getElementById('header-role-wrapper');
      if (headerRoleWrapper) {
        headerRoleWrapper.style.display = canSwitchRoles ? 'inline-flex' : 'none';
        const headerSwitcher = document.getElementById('header-role-switcher');
        if (headerSwitcher) headerSwitcher.value = rawRole;
      }

      const popoverRoleWrapper = document.getElementById('popover-role-switcher-section');
      if (popoverRoleWrapper) {
        popoverRoleWrapper.style.display = canSwitchRoles ? 'block' : 'none';
        const popoverSwitcher = document.getElementById('popover-role-switcher');
        if (popoverSwitcher) popoverSwitcher.value = rawRole;
      }
    }
  },

  // Sign out helper
  async logout() {
    try {
      if (typeof authService !== 'undefined' && authService.signOut) {
        await authService.signOut();
      }
    } catch (_) {}

    try {
      sessionStorage.removeItem('dh_bearer_token');
      localStorage.removeItem('dh_bearer_token');
      sessionStorage.removeItem('dh_user_session');
      localStorage.removeItem('dh_user_session');
      sessionStorage.clear();
    } catch (_) {}

    this.currentUser = null;
    this.userProfile = null;
    this.userRole = null;
    this.permissions.clear();

    window.location.replace('login.html');
  }
};

window.AuthGuard = AuthGuard;
window.hasPermission = (perm) => AuthGuard.hasPermission(perm);
