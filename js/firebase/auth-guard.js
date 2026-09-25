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
    const isMasterAdmin = userEmail === 'ayanislight@gmail.com';
    let userDoc = null;

    try {
      userDoc = await db.collection('users').doc(uid).get();
    } catch (e) {
      console.warn('Could not read user doc from Firestore:', e);
    }

    if (userDoc && userDoc.exists) {
      this.userProfile = userDoc.data() || {};
      this.userProfile.id = userDoc.id;

      // Ensure essential tenancy and status defaults while strictly preserving assigned role
      if (!this.userProfile.companyId) this.userProfile.companyId = 'comp_diallo_india';
      if (!this.userProfile.companyName) this.userProfile.companyName = 'Diallo India Private Limited';
      if (!this.userProfile.branchId) this.userProfile.branchId = 'branch_mumbai';
      if (!this.userProfile.branchName) this.userProfile.branchName = 'HQ - Mumbai';
      if (!this.userProfile.status) this.userProfile.status = 'ACTIVE';
      if (!this.userProfile.roleId) this.userProfile.roleId = isMasterAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE';

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
        } else if (normalizedRoleId === 'MANAGER') {
          this.userRole = { name: 'Manager', id: 'MANAGER' };
        } else if (normalizedRoleId === 'TEAM_LEAD' || normalizedRoleId === 'TL') {
          this.userRole = { name: 'Team Leader', id: 'TEAM_LEAD' };
        } else if (normalizedRoleId === 'MENTOR') {
          this.userRole = { name: 'Mentor', id: 'MENTOR' };
        } else if (normalizedRoleId === 'TRAINER') {
          this.userRole = { name: 'Trainer', id: 'TRAINER' };
        } else if (normalizedRoleId === 'TRAINEE') {
          this.userRole = { name: 'Trainee', id: 'TRAINEE' };
        } else {
          this.userRole = { name: 'Employee', id: 'EMPLOYEE' };
        }
      }
    } else {
      // Self-heal: user exists in Firebase Auth but has no Firestore profile document yet
      const roleId = isMasterAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE';
      const displayName = this.currentUser?.displayName || (userEmail ? userEmail.split('@')[0] : 'User');
      let employeeId = null;

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

    // Ensure every user who logs in has a matching official employee record in employees collection
    try {
      await this.ensureEmployeeProfile(uid, userEmail, this.userProfile);
    } catch (e) {
      console.warn('Could not auto-provision employee profile for logged in user:', e);
    }
  },

  // Ensure logged-in user has an official employee record in employees collection
  async ensureEmployeeProfile(uid, userEmail, profile) {
    if (!uid) return;
    const email = (userEmail || '').toLowerCase().trim();

    try {
      let empDoc = null;
      // 1. Direct doc lookup by employeeId if present
      if (profile?.employeeId) {
        try {
          const doc = await db.collection('employees').doc(profile.employeeId).get();
          if (doc.exists) empDoc = { id: doc.id, ...doc.data() };
        } catch (e) {}
      }

      // 2. Direct doc lookup by UID
      if (!empDoc) {
        try {
          const doc = await db.collection('employees').doc(uid).get();
          if (doc.exists) empDoc = { id: doc.id, ...doc.data() };
        } catch (e) {}
      }

      // 3. Query by userId
      if (!empDoc) {
        try {
          const snap = await db.collection('employees').where('userId', '==', uid).limit(1).get();
          if (!snap.empty) empDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
        } catch (e) {}
      }

      // 4. Query by workEmail / email
      if (!empDoc && email) {
        try {
          const snap = await db.collection('employees').where('workEmail', '==', email).limit(1).get();
          if (!snap.empty) {
            empDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
          } else {
            const snap2 = await db.collection('employees').where('email', '==', email).limit(1).get();
            if (!snap2.empty) empDoc = { id: snap2.docs[0].id, ...snap2.docs[0].data() };
          }
        } catch (e) {}
      }

      if (empDoc) {
        // Sync userId and email on employee doc if missing
        const empUpdates = {};
        if (empDoc.userId !== uid) empUpdates.userId = uid;
        if (!empDoc.workEmail && email) {
          empUpdates.workEmail = email;
          empUpdates.email = email;
        }
        if (Object.keys(empUpdates).length > 0) {
          await db.collection('employees').doc(empDoc.id).set(empUpdates, { merge: true });
        }

        // Sync employeeId and employeeCode back to user profile & users collection doc
        const userUpdates = {};
        if (profile.employeeId !== empDoc.id) userUpdates.employeeId = empDoc.id;
        if (profile.employeeCode !== empDoc.employeeCode && empDoc.employeeCode) userUpdates.employeeCode = empDoc.employeeCode;
        if (Object.keys(userUpdates).length > 0) {
          await db.collection('users').doc(uid).set(userUpdates, { merge: true });
          if (this.userProfile) Object.assign(this.userProfile, userUpdates);
        }
      } else {
        // Automatically make them employee too!
        let nextCode = 'EMP-0001';
        try {
          if (window.employeeService && employeeService.getNextEmployeeCode) {
            nextCode = await employeeService.getNextEmployeeCode(profile?.companyId || 'comp_diallo_india');
          }
        } catch (e) {}

        const fullName = (profile?.displayName || (email ? email.split('@')[0] : 'Employee')).trim();
        const nameParts = fullName.split(' ');
        const roleId = (profile?.roleId || 'EMPLOYEE').toUpperCase().trim();
        let dept = profile?.department || 'Engineering';
        let desig = profile?.designation || 'Software Engineer';
        if (roleId === 'SUPER_ADMIN') {
          dept = 'Executive Office';
          desig = 'Super Administrator';
        } else if (roleId === 'COMPANY_ADMIN' || roleId === 'ADMIN') {
          dept = 'Executive Office';
          desig = 'Company Administrator';
        } else if (roleId === 'HR' || roleId === 'HR_MANAGER') {
          dept = 'Human Resources';
          desig = 'HR Manager';
        } else if (roleId === 'MANAGER') {
          dept = 'Operations';
          desig = 'Operations Manager';
        }

        const newEmp = {
          employeeCode: nextCode,
          firstName: nameParts[0] || fullName,
          lastName: nameParts.slice(1).join(' ') || '',
          fullName,
          name: fullName,
          userId: uid,
          workEmail: email,
          email: email,
          personalEmail: email,
          phone: profile?.phone || '',
          roleId,
          department: dept,
          designation: desig,
          companyId: profile?.companyId || 'comp_diallo_india',
          companyName: profile?.companyName || 'Diallo India Private Limited',
          branchId: profile?.branchId || 'branch_mumbai',
          branchName: profile?.branchName || 'HQ - Mumbai',
          location: profile?.branchName || 'HQ - Mumbai',
          employmentStatus: profile?.status || 'ACTIVE',
          status: profile?.status || 'ACTIVE',
          employmentType: 'Full Time',
          dateOfJoining: new Date().toISOString().slice(0, 10),
          joiningDate: new Date().toISOString().slice(0, 10),
          probationStatus: 'Completed',
          salary: '₹65,000/mo',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('employees').doc(uid).set(newEmp, { merge: true });
        await db.collection('users').doc(uid).set({
          employeeId: uid,
          employeeCode: nextCode
        }, { merge: true });

        if (this.userProfile) {
          this.userProfile.employeeId = uid;
          this.userProfile.employeeCode = nextCode;
        }
      }
    } catch (err) {
      console.warn('ensureEmployeeProfile error:', err);
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
    const isMasterAdmin = this.currentUser?.email === 'ayanislight@gmail.com';
    const canPreview = isMasterAdmin || this._actualRoleId === 'SUPER_ADMIN' || (this.userProfile?.roleId || '').toString().toUpperCase() === 'SUPER_ADMIN';
    if (!canPreview) {
      if (typeof Toast !== 'undefined') {
        Toast.error('Only the Super Administrator can preview different role views.');
      }
      return;
    }

    // In-memory only — intentionally NOT written to Firestore or the auth token's custom
    // claims, so it can never grant real elevated access; it only changes what this tab
    // renders/gates via hasPermission() for the remainder of the session.
    this._previewRoleId = roleId;
    const normalizedRole = (roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    this.userProfile.roleId = normalizedRole;

    const headerSwitcher = document.getElementById('header-role-switcher');
    if (headerSwitcher) headerSwitcher.value = normalizedRole;
    const popoverSwitcher = document.getElementById('popover-role-switcher');
    if (popoverSwitcher) popoverSwitcher.value = normalizedRole;

    if (normalizedRole === 'SUPER_ADMIN') {
      this.permissions = new Set(['*']);
      this.userRole = { name: 'Super Admin', id: 'SUPER_ADMIN' };
    } else if (normalizedRole === 'COMPANY_ADMIN' || normalizedRole === 'ADMIN') {
      this.permissions = new Set(['*']);
      this.userRole = { name: 'Company Admin', id: 'COMPANY_ADMIN' };
    } else if (normalizedRole === 'HR' || normalizedRole === 'HR_MANAGER') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'HR' }) : new Set(['*']);
      this.userRole = { name: 'HR Manager', id: 'HR' };
    } else if (normalizedRole === 'MANAGER') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'MANAGER' }) : new Set(['team.*', 'performance.view', 'attendance.view', 'leave.view', 'ess.view']);
      this.userRole = { name: 'Manager', id: 'MANAGER' };
    } else if (normalizedRole === 'TEAM_LEAD' || normalizedRole === 'TL') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'TEAM_LEAD' }) : new Set(['team.view', 'performance.view', 'attendance.view', 'leave.view', 'ess.view']);
      this.userRole = { name: 'Team Leader', id: 'TEAM_LEAD' };
    } else if (normalizedRole === 'MENTOR') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'MENTOR' }) : new Set(['training.*', 'performance.view', 'attendance.view', 'leave.view', 'ess.view']);
      this.userRole = { name: 'Mentor', id: 'MENTOR' };
    } else if (normalizedRole === 'TRAINER') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'TRAINER' }) : new Set(['training.*', 'performance.view', 'attendance.punch', 'attendance.view', 'leave.view', 'leave.create', 'own.profile']);
      this.userRole = { name: 'Trainer', id: 'TRAINER' };
    } else if (normalizedRole === 'TRAINEE') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'TRAINEE' }) : new Set(['training.view', 'training.submit', 'attendance.punch', 'attendance.view', 'leave.view', 'leave.create', 'own.profile']);
      this.userRole = { name: 'Trainee', id: 'TRAINEE' };
    } else {
      this.userRole = { name: 'Employee', id: 'EMPLOYEE' };
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'EMPLOYEE' }) : new Set([
        'own.profile', 'attendance.view', 'attendance.punch', 'leave.view', 'leave.create',
        'performance.view', 'expenses.view', 'expenses.create', 'assets.view',
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

    const roleLabels = {
      SUPER_ADMIN: 'Super Admin',
      COMPANY_ADMIN: 'Company Admin',
      HR: 'HR Manager',
      HR_MANAGER: 'HR Manager',
      MANAGER: 'Manager',
      TEAM_LEAD: 'Team Leader',
      MENTOR: 'Mentor',
      TRAINER: 'Trainer',
      TRAINEE: 'Trainee',
      EMPLOYEE: 'Employee'
    };
    const roleName = roleLabels[roleId] || 'Employee';
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
      const roleMap = {
        SUPER_ADMIN: 'Super Admin',
        COMPANY_ADMIN: 'Company Admin',
        HR: 'HR Manager',
        HR_MANAGER: 'HR Manager',
        MANAGER: 'Manager',
        TEAM_LEAD: 'Team Leader',
        MENTOR: 'Mentor',
        TRAINER: 'Trainer',
        TRAINEE: 'Trainee',
        EMPLOYEE: 'Employee'
      };
      const role = this.userRole?.name || roleMap[this.userProfile.roleId] || 'Employee';
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';

      nameEls.forEach(el => { el.textContent = name; });
      roleEls.forEach(el => { el.textContent = role; });
      avatarEls.forEach(el => { el.textContent = initials; });
      if (companyLabel) companyLabel.textContent = this.userProfile.companyName || 'Diallo India';
      if (branchLabel) branchLabel.textContent = this.userProfile.branchName || 'HQ - Mumbai';

      // Hide or show admin-only actions in the profile popover
      const rawRole = (this.userProfile.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
      const actualRole = (this._actualRoleId || rawRole).toString().toUpperCase().trim();
      const isSuperAdmin = actualRole === 'SUPER_ADMIN';
      const isMasterAdmin = this.currentUser?.email === 'ayanislight@gmail.com';
      const canSwitchRoles = isSuperAdmin || isMasterAdmin;

      const permItem = document.getElementById('dropdown-permissions-item');
      if (permItem) {
        permItem.style.display = (rawRole === 'SUPER_ADMIN') ? 'flex' : 'none';
      }

      const settingsItem = document.getElementById('dropdown-settings-item');
      if (settingsItem) {
        settingsItem.style.display = (rawRole === 'SUPER_ADMIN' || rawRole === 'COMPANY_ADMIN') ? 'flex' : 'none';
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
