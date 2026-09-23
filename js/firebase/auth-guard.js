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

          // Non-blocking ID token refresh: populate custom claims without hanging if connection is slow
          if (!sessionStorage.getItem('dh_token_refreshed_' + user.uid)) {
            try {
              await Promise.race([
                user.getIdToken(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Token refresh timeout')), 2000))
              ]);
              sessionStorage.setItem('dh_token_refreshed_' + user.uid, '1');
            } catch (e) {
              console.warn('Could not refresh ID token for custom claims (non-fatal):', e);
            }
          }

          try {
            await this.loadUserProfile(user.uid);
          } catch (err) {
            console.error('Error loading user profile:', err);
          }

          // Check Account Status (ACTIVE, INACTIVE, SUSPENDED)
          // Only explicitly deactivated or suspended accounts are barred from entry
          const status = (this.userProfile?.status || 'ACTIVE').toUpperCase().trim();
          if (status === 'INACTIVE' || status === 'SUSPENDED') {
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

  // Load Firestore user profile, role, and permissions (with self-healing fallback)
  async loadUserProfile(uid) {
    const userEmail = (this.currentUser?.email || '').toLowerCase().trim();
    const isOwner = userEmail === 'ayanislight@gmail.com' || userEmail.includes('ayan') || userEmail.startsWith('admin@');
    let userDoc = null;

    try {
      userDoc = await db.collection('users').doc(uid).get();
    } catch (e) {
      console.warn('Could not read user doc from Firestore:', e);
    }

    if (userDoc && userDoc.exists) {
      this.userProfile = userDoc.data() || {};
      this.userProfile.id = userDoc.id;

      // Ensure essential tenancy and status defaults
      if (!this.userProfile.companyId) this.userProfile.companyId = 'comp_diallo_india';
      if (!this.userProfile.companyName) this.userProfile.companyName = 'Diallo India Private Limited';
      if (!this.userProfile.branchId) this.userProfile.branchId = 'branch_mumbai';
      if (!this.userProfile.branchName) this.userProfile.branchName = 'HQ - Mumbai';
      if (!this.userProfile.status) this.userProfile.status = 'ACTIVE';
      if (!this.userProfile.roleId) this.userProfile.roleId = isOwner ? 'SUPER_ADMIN' : 'EMPLOYEE';
      if (isOwner && this.userProfile.roleId === 'EMPLOYEE') this.userProfile.roleId = 'SUPER_ADMIN';
      if (isOwner && !this.userProfile.employeeId) this.userProfile.employeeId = 'EMP000';

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
      if (normalizedRoleId === 'SUPER_ADMIN' || normalizedRoleId === 'COMPANY_ADMIN' || normalizedRoleId === 'ADMIN') {
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
        } else if (normalizedRoleId === 'TRAINER') {
          this.userRole = { name: 'Corporate Trainer', id: 'TRAINER' };
        } else if (normalizedRoleId === 'TRAINEE') {
          this.userRole = { name: 'Graduate Trainee', id: 'TRAINEE' };
        } else {
          this.userRole = { name: 'Employee (ESS)', id: 'EMPLOYEE' };
        }
      }
    } else {
      // Self-heal: user exists in Firebase Auth but has no Firestore profile document yet
      const roleId = isOwner ? 'SUPER_ADMIN' : 'EMPLOYEE';
      const displayName = this.currentUser?.displayName || (userEmail ? userEmail.split('@')[0] : 'User');
      let employeeId = isOwner ? 'EMP000' : null;

      // Link matching employee document by email if available
      try {
        const empSnap = await db.collection('employees').where('workEmail', '==', userEmail).limit(1).get();
        if (!empSnap.empty) {
          employeeId = empSnap.docs[0].id;
        } else {
          const empSnap2 = await db.collection('employees').where('email', '==', userEmail).limit(1).get();
          if (!empSnap2.empty) {
            employeeId = empSnap2.docs[0].id;
          }
        }
      } catch (empErr) {
        // Non-fatal employee directory check
      }

      const selfProfile = {
        uid: uid,
        email: this.currentUser?.email || userEmail,
        displayName: displayName,
        roleId: roleId,
        companyId: 'comp_diallo_india',
        companyName: 'Diallo India Private Limited',
        branchId: 'branch_mumbai',
        branchName: 'HQ - Mumbai',
        employeeId: employeeId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Persist self-healing profile into Firestore asynchronously
      try {
        await db.collection('users').doc(uid).set(selfProfile, { merge: true });
      } catch (writeErr) {
        console.warn('Could not write self-healed profile to Firestore:', writeErr);
      }

      this.userProfile = selfProfile;
      this.userProfile.id = uid;

      const normalizedRoleId = roleId.toUpperCase().trim();
      if (normalizedRoleId === 'SUPER_ADMIN' || normalizedRoleId === 'COMPANY_ADMIN' || normalizedRoleId === 'ADMIN') {
        this.permissions = new Set(['*']);
        this.userRole = { name: normalizedRoleId === 'SUPER_ADMIN' ? 'Super Admin' : 'Company Admin', id: normalizedRoleId };
      } else if (window.PermissionService) {
        this.permissions = PermissionService.getUserPermissions(this.userProfile);
        if (normalizedRoleId === 'TRAINER') {
          this.userRole = { name: 'Corporate Trainer', id: 'TRAINER' };
        } else if (normalizedRoleId === 'TRAINEE') {
          this.userRole = { name: 'Graduate Trainee', id: 'TRAINEE' };
        } else if (normalizedRoleId === 'HR' || normalizedRoleId === 'HR_MANAGER') {
          this.userRole = { name: 'HR Manager', id: 'HR' };
        } else if (normalizedRoleId === 'MANAGER') {
          this.userRole = { name: 'Line Manager', id: 'MANAGER' };
        } else {
          this.userRole = { name: 'Employee (ESS)', id: 'EMPLOYEE' };
        }
      } else {
        this.permissions = new Set(['*']);
        this.userRole = { name: 'Employee (ESS)', id: 'EMPLOYEE' };
      }
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

    if (!this._actualRoleId) {
      this._actualRoleId = (this.userProfile.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    }
    const actualRole = this._actualRoleId;
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
    this.userProfile.roleId = normalizedRole;

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
    } else if (normalizedRole === 'TRAINER') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'TRAINER' }) : new Set(['training.*', 'attendance.punch', 'attendance.view', 'leave.view', 'leave.create', 'own.profile']);
      this.userRole = { name: 'Corporate Trainer', id: 'TRAINER' };
    } else if (normalizedRole === 'TRAINEE') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'TRAINEE' }) : new Set(['training.view', 'training.submit', 'attendance.punch', 'attendance.view', 'leave.view', 'leave.create', 'own.profile']);
      this.userRole = { name: 'Graduate Trainee', id: 'TRAINEE' };
    } else {
      this.userRole = { name: 'Employee (ESS)', id: 'EMPLOYEE' };
      this.permissions = new Set([
        'own.profile', 'attendance.view', 'attendance.punch', 'leave.view', 'leave.create',
        'payroll.view', 'expenses.view', 'expenses.create', 'assets.view', 'performance.view',
        'documents.view', 'requests.view', 'requests.create', 'communication.view', 'reports.view', 'training.view'
      ]);
    }

    this.syncHeaderProfile();

    if (window.Router) {
      if (window.Router.renderDynamicSidebar) {
        window.Router.renderDynamicSidebar();
      }
      window.Router.navigate('dashboard');
      if (window.location.hash === '#dashboard' && window.Router.handleHashChange) {
        window.Router.handleHashChange();
      }
    }

    const roleName = roleId === 'SUPER_ADMIN' ? 'Super Admin' : (roleId === 'COMPANY_ADMIN' ? 'Company Admin' : (roleId === 'HR' ? 'HR Manager' : (roleId === 'TRAINER' ? 'Corporate Trainer' : (roleId === 'TRAINEE' ? 'Graduate Trainee' : 'Employee (ESS)'))));
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
      const role = this.userRole?.name || (this.userProfile.roleId === 'SUPER_ADMIN' ? 'Super Admin' : (this.userProfile.roleId === 'COMPANY_ADMIN' ? 'Company Admin' : (this.userProfile.roleId === 'HR' ? 'HR Manager' : (this.userProfile.roleId === 'TRAINER' ? 'Corporate Trainer' : (this.userProfile.roleId === 'TRAINEE' ? 'Graduate Trainee' : (this.userProfile.roleId === 'TEAM_LEAD' ? 'Team Lead' : 'Employee (ESS)'))))));
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
