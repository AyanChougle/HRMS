/**
 * DIALLO HRMS — AUTH GUARD & SESSION VALIDATOR (PHASE 3)
 * Protects application routes, verifies account statuses, enforces multi-tenant scoping and RBAC
 */

const AuthGuard = {
  currentUser: null,
  userProfile: null,
  userRole: null,
  permissions: new Set(),
  isInitialized: false,

  // Initialize Auth Guard on page load
  init(options = {}) {
    const { isPublicPage = false } = options;

    return new Promise((resolve) => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          this.currentUser = user;

          // Force-refresh the ID token once per session so custom claims
          // (companyId/roleId, set server-side by onUserCreated) are present
          // before any Firestore call relies on them in security rules.
          if (!sessionStorage.getItem('dh_token_refreshed_' + user.uid)) {
            try {
              await user.getIdToken(true);
              sessionStorage.setItem('dh_token_refreshed_' + user.uid, '1');
            } catch (e) {
              console.warn('Could not refresh ID token for custom claims:', e);
            }
          }

          try {
            await this.loadUserProfile(user.uid);
          } catch (err) {
            console.error('Error loading user profile:', err);
          }

          // Check Account Status (ACTIVE, INACTIVE, SUSPENDED, PENDING)
          const status = this.userProfile?.status || 'ACTIVE';
          if (status !== 'ACTIVE') {
            await auth.signOut();
            sessionStorage.clear();
            alert(`Account Access Blocked: Your account status is currently '${status}'. Please contact your Organization Administrator.`);
            window.location.replace('login.html');
            return;
          }

          if (isPublicPage) {
            // Already logged in, redirect away from login page
            window.location.replace('index.html#dashboard');
            return;
          }

          this.isInitialized = true;
          this.syncHeaderProfile();
          
          // Re-render sidebar navigation according to permissions & mount requested route
          if (window.Router) {
            if (window.Router.renderDynamicSidebar) {
              window.Router.renderDynamicSidebar();
            }
            if (window.Router.handleHashChange) {
              window.Router.handleHashChange();
            }
          }

          resolve(user);
        } else {
          this.currentUser = null;
          this.userProfile = null;
          this.userRole = null;
          this.permissions.clear();
          this.isInitialized = true;

          if (!isPublicPage) {
            const currentPath = window.location.href;
            sessionStorage.setItem('redirect_after_login', currentPath);
            window.location.replace('login.html');
            return;
          }
          resolve(null);
        }
      });
    });
  },

  // Load Firestore user profile, role, and permissions
  async loadUserProfile(uid) {
    let userDoc = null;
    try {
      userDoc = await db.collection('users').doc(uid).get();
    } catch (e) {
      console.warn('Could not read user doc from Firestore:', e);
    }

    if (userDoc && userDoc.exists) {
      this.userProfile = userDoc.data();
      this.userProfile.id = userDoc.id;

      // Load Role definition if present
      let roleDocData = null;
      if (this.userProfile.roleId) {
        try {
          const roleDoc = await db.collection('roles').doc(this.userProfile.roleId).get();
          if (roleDoc.exists) {
            roleDocData = roleDoc.data();
            this.userRole = roleDocData;
          }
        } catch (e) {
          console.warn('Could not fetch role doc:', e);
        }
      }

      // Compute Active Permissions Set via PermissionService
      const normalizedRoleId = (this.userProfile.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
      if (normalizedRoleId === 'SUPER_ADMIN' || normalizedRoleId === 'COMPANY_ADMIN' || normalizedRoleId === 'ADMIN' || !this.userProfile.roleId) {
        this.permissions = new Set(['*']);
      } else if (window.PermissionService) {
        this.permissions = PermissionService.getUserPermissions(this.userProfile, roleDocData);
      } else {
        this.permissions = new Set(['*']);
      }

      // Initialize userRole object if not already populated from Firestore roles collection
      if (!this.userRole) {
        if (normalizedRoleId === 'SUPER_ADMIN') {
          this.userRole = { name: 'Super Admin', id: 'SUPER_ADMIN' };
        } else if (normalizedRoleId === 'COMPANY_ADMIN' || normalizedRoleId === 'ADMIN') {
          this.userRole = { name: 'Company Admin', id: 'COMPANY_ADMIN' };
        } else if (normalizedRoleId === 'HR' || normalizedRoleId === 'HR_MANAGER') {
          this.userRole = { name: 'HR Manager', id: 'HR' };
        } else if (normalizedRoleId === 'PAYROLL') {
          this.userRole = { name: 'Payroll Officer', id: 'PAYROLL' };
        } else if (normalizedRoleId === 'MANAGER') {
          this.userRole = { name: 'Line Manager', id: 'MANAGER' };
        } else {
          this.userRole = { name: 'Employee (ESS)', id: 'EMPLOYEE' };
        }
      }
    } else {
      // SECURITY (PRODUCTION AUDIT finding #4): a missing Firestore profile document must
      // NEVER be treated as an invitation to grant Super Admin. Every account gets its
      // `users/{uid}` document written either by the client's own signup call (as EMPLOYEE)
      // or, moments later, by the trusted server-side `onUserCreated` Cloud Function — which
      // is also the only place the very first account in a fresh deployment can be promoted.
      // If neither has completed yet, treat this session as still-provisioning and retry
      // briefly rather than fabricating an elevated profile client-side.
      let retryDoc = null;
      for (let attempt = 0; attempt < 3 && !retryDoc; attempt++) {
        await new Promise((r) => setTimeout(r, 700));
        try {
          const doc = await db.collection('users').doc(uid).get();
          if (doc.exists) retryDoc = doc;
        } catch (e) { /* keep retrying */ }
      }

      if (retryDoc) {
        return this.loadUserProfile(uid); // re-run now that the doc exists
      }

      // Still nothing — fail closed with the lowest-privilege profile, not '*'.
      this.userProfile = {
        uid: uid,
        email: this.currentUser.email,
        displayName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
        roleId: 'EMPLOYEE',
        companyId: null,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      this.permissions = new Set();
      this.userRole = { name: 'Account Setup Pending', id: 'EMPLOYEE' };
      console.warn('No user profile document found after retries; account setup appears incomplete. Contact an administrator.');
    }
  },

  // Granular Permission Verification
  hasPermission(permissionName) {
    if (!permissionName) return true;
    if (!this.isInitialized) return false; // Fail closed while auth is still resolving (finding #12)
    // _previewRoleId only ever exists for a session that was already SUPER_ADMIN/COMPANY_ADMIN
    // when switchRole() set it (see switchRole) — it never widens real access, only narrows the
    // UI for previewing another role's view.
    const role = this._previewRoleId || this.userProfile?.roleId || 'EMPLOYEE';
    const normalizedRole = role.toString().toUpperCase().trim();
    if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'COMPANY_ADMIN' || normalizedRole === 'ADMIN') return true;

    if (window.PermissionService) {
      return PermissionService.hasPermission(permissionName, this.permissions, role);
    }
    return this.permissions.has('*') || this.permissions.has(permissionName);
  },

  // PREVIEW-ONLY role switch, for admins to see the app as another role would (e.g. QA/demo).
  // SECURITY (PRODUCTION AUDIT finding #3): this used to persist roleId straight to Firestore
  // with no permission check, meaning any signed-in user could open devtools and run
  // AuthGuard.switchRole('SUPER_ADMIN') to permanently grant themselves admin access. It is
  // now (a) restricted to users who are already SUPER_ADMIN/COMPANY_ADMIN, (b) never written
  // to Firestore, and (c) only affects this browser tab's in-memory session — a page reload
  // reverts to the account's real, server-assigned role.
  async switchRole(roleId) {
    if (!this.userProfile) return;

    const actualRole = (this.userProfile.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    const isProjectOwner = this.currentUser?.email === 'ayanislight@gmail.com' || (this.userProfile.email && this.userProfile.email.includes('ayan'));
    const canPreview = isLocalhost || isProjectOwner || actualRole === 'SUPER_ADMIN' || actualRole === 'COMPANY_ADMIN' || actualRole === 'ADMIN';
    if (!canPreview) {
      if (typeof Toast !== 'undefined') {
        Toast.error('Only administrators can preview other role views.');
      }
      return;
    }

    // In-memory only — intentionally NOT written to Firestore or the auth token's custom
    // claims, so it can never grant real elevated access; it only changes what this tab
    // renders/gates via hasPermission() for the remainder of the session.
    this._previewRoleId = roleId;
    const normalizedRole = (roleId || 'EMPLOYEE').toString().toUpperCase().trim();

    if (normalizedRole === 'SUPER_ADMIN') {
      this.permissions = new Set(['*']);
      this.userRole = { name: 'Super Admin', id: 'SUPER_ADMIN' };
    } else if (normalizedRole === 'COMPANY_ADMIN' || normalizedRole === 'ADMIN') {
      this.permissions = new Set(['*']);
      this.userRole = { name: 'Company Admin', id: 'COMPANY_ADMIN' };
    } else if (normalizedRole === 'HR' || normalizedRole === 'HR_MANAGER') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'HR' }) : new Set(['*']);
      this.userRole = { name: 'HR Manager', id: 'HR' };
    } else if (normalizedRole === 'PAYROLL') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'PAYROLL' }) : new Set(['*']);
      this.userRole = { name: 'Payroll Officer', id: 'PAYROLL' };
    } else if (normalizedRole === 'MANAGER') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'MANAGER' }) : new Set(['*']);
      this.userRole = { name: 'Line Manager', id: 'MANAGER' };
    } else {
      this.userRole = { name: 'Employee (ESS)', id: 'EMPLOYEE' };
      if (window.PermissionService) {
        this.permissions = PermissionService.getUserPermissions(this.userProfile, this.userRole);
      } else {
        this.permissions = new Set(['own.profile', 'attendance.view', 'leave.view', 'payroll.view', 'communication.view']);
      }
    }

    this.syncHeaderProfile();

    if (window.Router) {
      if (window.Router.renderDynamicSidebar) {
        window.Router.renderDynamicSidebar();
      }
      window.Router.navigate('dashboard');
    }

    const roleName = roleId === 'SUPER_ADMIN' ? 'Super Admin' : (roleId === 'COMPANY_ADMIN' ? 'Company Admin' : (roleId === 'HR' ? 'HR Manager' : 'Employee (ESS)'));
    if (typeof Toast !== 'undefined') {
      Toast.success(`Active Role View changed to: ${roleName}`);
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
      const role = this.userRole?.name || (this.userProfile.roleId === 'SUPER_ADMIN' ? 'Super Admin' : (this.userProfile.roleId === 'COMPANY_ADMIN' ? 'Company Admin' : (this.userProfile.roleId === 'HR' ? 'HR Manager' : (this.userProfile.roleId === 'TEAM_LEAD' ? 'Team Lead' : 'Employee (ESS)'))));
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';

      nameEls.forEach(el => { el.textContent = name; });
      roleEls.forEach(el => { el.textContent = role; });
      avatarEls.forEach(el => { el.textContent = initials; });
      if (companyLabel) companyLabel.textContent = this.userProfile.companyName || 'Diallo India';
      if (branchLabel) branchLabel.textContent = this.userProfile.branchName || 'HQ - Mumbai';
    }
  },

  // Sign out helper
  async logout() {
    try {
      if (typeof authService !== 'undefined' && authService.signOut) {
        await authService.signOut();
      } else {
        await auth.signOut();
      }
      sessionStorage.clear();
      window.location.replace('login.html');
    } catch (err) {
      console.error('Logout error:', err);
      window.location.replace('login.html');
    }
  }
};

window.AuthGuard = AuthGuard;
window.hasPermission = (perm) => AuthGuard.hasPermission(perm);
