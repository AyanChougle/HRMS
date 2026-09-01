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
      if (this.userProfile.roleId === 'SUPER_ADMIN') {
        this.permissions = new Set(['*']);
      } else if (window.PermissionService) {
        this.permissions = PermissionService.getUserPermissions(this.userProfile, roleDocData);
      } else {
        this.permissions = new Set(['*']);
      }
    } else {
      // First-time Superadmin Profile
      this.userProfile = {
        uid: uid,
        email: this.currentUser.email,
        displayName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
        roleId: 'SUPER_ADMIN',
        companyId: 'comp_diallo_india',
        companyName: 'Diallo India Private Limited',
        branchId: 'branch_mumbai',
        branchName: 'HQ - Mumbai',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      this.permissions = new Set(['*']);
    }
  },

  // Granular Permission Verification
  hasPermission(permissionName) {
    if (!permissionName) return true;
    if (!this.isInitialized) return true; // Auth still resolving, will re-verify on init
    const role = this.userProfile?.roleId || 'EMPLOYEE';
    if (role === 'SUPER_ADMIN') return true;

    if (window.PermissionService) {
      return PermissionService.hasPermission(permissionName, this.permissions, role);
    }
    return this.permissions.has('*') || this.permissions.has(permissionName);
  },

  // Sync user profile with header UI in index.html
  syncHeaderProfile() {
    const nameEl = document.querySelector('.user-name-label');
    const roleEl = document.querySelector('.user-role-label');
    const avatarEl = document.querySelector('.user-profile-trigger .avatar-img');
    const companyLabel = document.getElementById('current-company-label');
    const branchLabel = document.getElementById('current-branch-label');

    if (this.userProfile) {
      const name = this.userProfile.displayName || this.userProfile.fullName || this.currentUser?.email?.split('@')[0] || 'User';
      const role = this.userRole?.name || this.userProfile.roleId || 'Staff';
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';

      if (nameEl) nameEl.textContent = name;
      if (roleEl) roleEl.textContent = role;
      if (avatarEl) avatarEl.textContent = initials;
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
