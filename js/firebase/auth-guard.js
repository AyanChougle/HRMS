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

  // Canonical 7-Role Resolver: Maps any legacy role string to one of the 7 canonical roles.
  // Designation and Department are NEVER used to infer or elevate permissions.
  resolveCanonicalRole(roleId, designation, email) {
    const cleanRole = (roleId || '').toString().toUpperCase().trim();
    if (['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'].includes(cleanRole)) return 'ADMIN';
    if (['HR', 'HR_MANAGER'].includes(cleanRole)) return 'HR';
    if (['OPS', 'OPERATIONS_MANAGER', 'PROCESS_OWNER'].includes(cleanRole)) return 'OPS';
    if (cleanRole === 'COMPLIANCE') return 'COMPLIANCE';
    if (cleanRole === 'MANAGER') return 'MANAGER';
    if (['TL', 'TEAM_LEAD'].includes(cleanRole)) return 'TL';

    // All employee designations (Relationship Manager, Digital Marketing, Sales Executive, Trainee, etc.) are strictly EMPLOYEE
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
          // Check for active fallback session (Hostinger MySQL authenticated user)
          let fallbackSession = null;
          try {
            const raw = sessionStorage.getItem('dh_user_session') || localStorage.getItem('dh_user_session');
            if (raw) fallbackSession = JSON.parse(raw);
          } catch (e) {}

          if (fallbackSession && fallbackSession.email && (fallbackSession.status || 'ACTIVE').toUpperCase() === 'ACTIVE') {
            const resolvedRole = this.resolveCanonicalRole(fallbackSession.roleId, fallbackSession.designation, fallbackSession.email);
            fallbackSession.roleId = resolvedRole;
            try {
              sessionStorage.setItem('dh_user_session', JSON.stringify(fallbackSession));
              localStorage.setItem('dh_user_session', JSON.stringify(fallbackSession));
            } catch (_) {}

            this.currentUser = {
              uid: fallbackSession.uid,
              email: fallbackSession.email,
              displayName: fallbackSession.displayName || fallbackSession.email.split('@')[0],
              getIdToken: async () => 'mysql-session-token'
            };

            this.userProfile = {
              uid: fallbackSession.uid,
              id: fallbackSession.uid,
              email: fallbackSession.email,
              displayName: fallbackSession.displayName,
              roleId: resolvedRole,
              department: fallbackSession.department || 'Operations',
              designation: fallbackSession.designation || 'Staff',
              companyId: fallbackSession.companyId || 'comp_diallo_india',
              companyName: fallbackSession.companyName || 'Diallo India Private Limited',
              branchId: fallbackSession.branchId || 'branch_ghansoli',
              branchName: fallbackSession.branchName || 'Ghansoli - Navi Mumbai',
              employeeId: fallbackSession.employeeCode || fallbackSession.uid,
              employeeCode: fallbackSession.employeeCode || '',
              status: fallbackSession.status || 'ACTIVE'
            };

            const normalizedRoleId = resolvedRole;
            if (['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(normalizedRoleId)) {
              this.permissions = new Set(['*']);
              this.userRole = { name: this.getRoleLabel(normalizedRoleId), id: normalizedRoleId };
            } else if (window.PermissionService) {
              this.permissions = PermissionService.getUserPermissions(this.userProfile);
              this.userRole = { name: this.getRoleLabel(normalizedRoleId), id: normalizedRoleId };
            } else {
              this.permissions = new Set(['*']);
              this.userRole = { name: this.getRoleLabel(normalizedRoleId), id: normalizedRoleId };
            }

            if (isPublicPage) {
              window.location.replace('index.html#dashboard');
              return;
            }

            this.isInitialized = true;
            this.syncHeaderProfile();

            if (window.Router) {
              if (window.Router.renderDynamicSidebar) window.Router.renderDynamicSidebar();
              if (window.Router.handleHashChange) window.Router.handleHashChange();
            }

            resolve(this.currentUser);
            return;
          }

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

  // Load Firestore user profile, role, and permissions (with self-healing fallback & MySQL cross-hydration)
  async loadUserProfile(uid) {
    const userEmail = (this.currentUser?.email || '').toLowerCase().trim();
    const isMasterAdmin = (userEmail === 'ayan@tradeforwealth.co.in' || userEmail === 'ayanislight@gmail.com');
    let userDoc = null;

    try {
      userDoc = await db.collection('users').doc(uid).get();
    } catch (e) {
      console.warn('Could not read user doc from Firestore:', e);
    }

    if (userDoc && userDoc.exists) {
      this.userProfile = userDoc.data() || {};
      this.userProfile.id = userDoc.id;
    } else {
      this.userProfile = {
        uid: uid,
        id: uid,
        email: userEmail,
        displayName: this.currentUser?.displayName || (userEmail ? userEmail.split('@')[0] : 'User'),
        roleId: isMasterAdmin ? 'SUPER_ADMIN' : 'EMPLOYEE',
        status: 'ACTIVE'
      };
    }

    // -------------------------------------------------------------------------
    // CRITICAL: Cross-hydrate official profile from Hostinger MySQL API &
    // Firestore employees collection (ensures Managers, Ops, HR, TLs get
    // their true assigned role, designation, department, and employeeCode)
    // -------------------------------------------------------------------------
    let mysqlData = null;
    let employeeDocData = null;

    // 1. Check Hostinger MySQL users or employees by email / code / uid
    if (typeof apiClient !== 'undefined') {
      try {
        const uRes = await apiClient.get('users.php');
        if (uRes && uRes.success && Array.isArray(uRes.users)) {
          mysqlData = uRes.users.find(u => 
            (u.email && u.email.toLowerCase().trim() === userEmail) ||
            (u.uid && u.uid === uid) ||
            (this.userProfile.employeeCode && u.employee_code === this.userProfile.employeeCode) ||
            (this.userProfile.displayName && u.display_name && u.display_name.toLowerCase().trim() === this.userProfile.displayName.toLowerCase().trim())
          );
        }
        if (!mysqlData) {
          const empRes = await apiClient.get('employees.php');
          if (empRes && empRes.success && Array.isArray(empRes.employees)) {
            mysqlData = empRes.employees.find(e => 
              (e.work_email && e.work_email.toLowerCase().trim() === userEmail) ||
              (e.email && e.email.toLowerCase().trim() === userEmail) ||
              (e.id && e.id === uid) ||
              (this.userProfile.employeeCode && e.employee_code === this.userProfile.employeeCode) ||
              (this.userProfile.displayName && e.full_name && e.full_name.toLowerCase().trim() === this.userProfile.displayName.toLowerCase().trim())
            );
          }
        }
      } catch (sqlErr) {
        console.warn('[AuthGuard] MySQL hydration notice:', sqlErr.message);
      }
    }

    // 2. Check Firestore employees collection by email
    try {
      if (typeof db !== 'undefined' && userEmail) {
        const empSnap = await db.collection('employees').where('workEmail', '==', userEmail).get();
        if (!empSnap.empty) {
          const sorted = [...empSnap.docs].sort((a, b) => {
            const ad = a.data() || {}, bd = b.data() || {};
            const aIsMgr = /manager|lead|trainer/i.test(ad.designation || '');
            const bIsMgr = /manager|lead|trainer/i.test(bd.designation || '');
            if (aIsMgr && !bIsMgr) return -1;
            if (bIsMgr && !aIsMgr) return 1;
            return (bd.employeeCode || '').localeCompare(ad.employeeCode || '');
          });
          employeeDocData = { id: sorted[0].id, ...sorted[0].data() };
        } else {
          const empSnap2 = await db.collection('employees').where('email', '==', userEmail).get();
          if (!empSnap2.empty) {
            employeeDocData = { id: empSnap2.docs[0].id, ...empSnap2.docs[0].data() };
          }
        }
      }
    } catch (fsErr) {
      console.warn('[AuthGuard] Firestore employee fetch notice:', fsErr);
    }

    // 3. Populate missing/authoritative fields
    const desig = mysqlData?.designation || employeeDocData?.designation || this.userProfile.designation || '';
    const dept = mysqlData?.department || employeeDocData?.department || this.userProfile.department || 'Operations';
    const empCode = mysqlData?.employee_code || employeeDocData?.employeeCode || this.userProfile.employeeCode || '';
    const resolvedUid = mysqlData?.uid || this.currentUser?.uid || uid;
    const empId = employeeDocData?.id || (mysqlData?.uid ? mysqlData.uid : (typeof mysqlData?.id === 'string' && !/^\d+$/.test(mysqlData.id) ? mysqlData.id : (this.userProfile.employeeId || resolvedUid)));
    const dispName = mysqlData?.display_name || mysqlData?.full_name || employeeDocData?.fullName || this.userProfile.displayName || this.currentUser?.displayName;

    this.userProfile.designation = desig;
    this.userProfile.department = dept;
    this.userProfile.employeeCode = empCode;
    this.userProfile.employeeId = empId;
    if (dispName) this.userProfile.displayName = dispName;
    if (!this.userProfile.companyId) this.userProfile.companyId = 'comp_diallo_india';
    if (!this.userProfile.companyName) this.userProfile.companyName = 'Diallo India Private Limited';
    if (!this.userProfile.branchId) this.userProfile.branchId = 'branch_ghansoli';
    if (!this.userProfile.branchName) this.userProfile.branchName = 'Ghansoli - Navi Mumbai';
    if (!this.userProfile.status) this.userProfile.status = mysqlData?.status || employeeDocData?.status || 'ACTIVE';

    // 4. Resolve the TRUE canonical role:
    let candidateRole = this.userProfile.roleId;
    if (isMasterAdmin) {
      candidateRole = 'SUPER_ADMIN';
    } else {
      // Prioritize explicit non-default role from MySQL or Employee record
      const sqlRole = (mysqlData?.role_id || '').toUpperCase().trim();
      const empRole = (employeeDocData?.roleId || '').toUpperCase().trim();
      if (sqlRole && sqlRole !== 'EMPLOYEE') {
        candidateRole = sqlRole;
      } else if (empRole && empRole !== 'EMPLOYEE') {
        candidateRole = empRole;
      } else if (!candidateRole || candidateRole === 'EMPLOYEE') {
        // Resolve canonical role from designation
        candidateRole = this.resolveCanonicalRole(candidateRole, desig, userEmail);
      }
    }
    this.userProfile.roleId = candidateRole;

    // 5. Persist the healed/hydrated role & details into Firestore users collection
    try {
      if (typeof db !== 'undefined' && uid) {
        await db.collection('users').doc(uid).set({
          uid: uid,
          email: userEmail,
          displayName: this.userProfile.displayName,
          roleId: this.userProfile.roleId,
          designation: this.userProfile.designation,
          department: this.userProfile.department,
          employeeCode: this.userProfile.employeeCode,
          employeeId: this.userProfile.employeeId,
          companyId: this.userProfile.companyId,
          companyName: this.userProfile.companyName,
          status: this.userProfile.status,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } catch (upErr) {
      console.warn('[AuthGuard] Could not persist hydrated profile to Firestore:', upErr);
    }

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
      this.userRole = { name: this.getRoleLabel(normalizedRoleId), id: normalizedRoleId };
    }

    // Ensure matching employee record in employees collection
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
      this._actualRoleId = this.resolveCanonicalRole(this.userProfile.roleId, this.userProfile.designation, this.userProfile.email);
    }
    const isMasterAdmin = this.currentUser?.email === 'ayanislight@gmail.com';
    const canPreview = isMasterAdmin || this._actualRoleId === 'ADMIN' || this._actualRoleId === 'SUPER_ADMIN';
    if (!canPreview) {
      if (typeof Toast !== 'undefined') {
        Toast.error('Only the Administrator can preview different role views.');
      }
      return;
    }

    // In-memory only preview
    const canonical = this.resolveCanonicalRole(roleId);
    this._previewRoleId = canonical;
    this.userProfile.roleId = canonical;

    const headerSwitcher = document.getElementById('header-role-switcher');
    if (headerSwitcher) headerSwitcher.value = canonical;
    const popoverSwitcher = document.getElementById('popover-role-switcher');
    if (popoverSwitcher) popoverSwitcher.value = canonical;

    if (canonical === 'ADMIN') {
      this.permissions = new Set(['*']);
      this.userRole = { name: 'Admin', id: 'ADMIN' };
    } else if (canonical === 'HR') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'HR' }) : new Set(['*']);
      this.userRole = { name: 'HR', id: 'HR' };
    } else if (canonical === 'OPS') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'OPS' }) : new Set(['people.view', 'team.*', 'attendance.view', 'leave.view', 'performance.view', 'compliance.view', 'ess.view', 'approvals.view', 'approvals.approve']);
      this.userRole = { name: 'OPS', id: 'OPS' };
    } else if (canonical === 'COMPLIANCE') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'COMPLIANCE' }) : new Set(['compliance.*', 'documents.view', 'reports.view', 'attendance.view', 'leave.view', 'ess.view']);
      this.userRole = { name: 'Compliance', id: 'COMPLIANCE' };
    } else if (canonical === 'MANAGER') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'MANAGER' }) : new Set(['people.view', 'team.*', 'performance.view', 'attendance.view', 'leave.view', 'ess.view', 'approvals.view', 'approvals.approve']);
      this.userRole = { name: 'Manager', id: 'MANAGER' };
    } else if (canonical === 'TL') {
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'TL' }) : new Set(['people.view', 'team.view', 'performance.view', 'attendance.view', 'leave.view', 'ess.view']);
      this.userRole = { name: 'TL', id: 'TL' };
    } else {
      this.userRole = { name: 'Employee', id: 'EMPLOYEE' };
      this.permissions = window.PermissionService ? PermissionService.getUserPermissions({ roleId: 'EMPLOYEE' }) : new Set([
        'own.profile', 'attendance.view', 'attendance.punch', 'leave.view', 'leave.create',
        'performance.view', 'expenses.view', 'expenses.create', 'assets.view',
        'documents.view', 'requests.view', 'requests.create', 'communication.view', 'reports.view'
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
      HR_MANAGER: 'HR Manager',
      MANAGER: 'Manager',
      OPERATIONS_MANAGER: 'Operations Manager',
      TEAM_LEAD: 'Team Leader',
      RELATIONSHIP_MANAGER: 'Relationship Manager',
      MENTOR_TRAINER: 'Mentor / Trainer',
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
        HR_MANAGER: 'HR Manager',
      MANAGER: 'Manager',
      OPERATIONS_MANAGER: 'Operations Manager',
        TEAM_LEAD: 'Team Leader',
        RELATIONSHIP_MANAGER: 'Relationship Manager',
        MENTOR_TRAINER: 'Mentor / Trainer',
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
      const isMasterAdmin = this.currentUser?.email === 'ayanislight@gmail.com';
      const isSuperAdmin = actualRole === 'ADMIN' || actualRole === 'SUPER_ADMIN' || isMasterAdmin;
      const canSwitchRoles = isSuperAdmin;

      const permItem = document.getElementById('dropdown-permissions-item');
      if (permItem) {
        permItem.style.display = (rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN') ? 'flex' : 'none';
      }

      const settingsItem = document.getElementById('dropdown-settings-item');
      if (settingsItem) {
        settingsItem.style.display = (rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'COMPANY_ADMIN') ? 'flex' : 'none';
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
      try {
        sessionStorage.removeItem('dh_user_session');
        localStorage.removeItem('dh_user_session');
        sessionStorage.clear();
      } catch (_) {}
      window.location.replace('login.html');
    } catch (err) {
      console.error('Logout error:', err);
      try {
        sessionStorage.removeItem('dh_user_session');
        localStorage.removeItem('dh_user_session');
        sessionStorage.clear();
      } catch (_) {}
      window.location.replace('login.html');
    }
  }
};

window.AuthGuard = AuthGuard;
window.hasPermission = (perm) => AuthGuard.hasPermission(perm);
