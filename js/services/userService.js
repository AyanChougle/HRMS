/**
 * DIALLO HRMS — USER & ROLE MANAGEMENT SERVICE
 * Manages Firestore user profiles, credentials, custom roles, and cross-sync with employees
 */

const userService = {
  // Master 8 Official Roles Hierarchy
  ROLES: [
    { id: 'SUPER_ADMIN', name: 'Super Administrator', badge: 'badge-primary', color: '#7c3aed', desc: 'Full root access to all system functions & settings' },
    { id: 'HR_MANAGER', name: 'HR Manager', badge: 'badge-success', color: '#059669', desc: 'Full HR ops, recruitment, onboarding, leave & timecards' },
    { id: 'MANAGER', name: 'Line Manager', badge: 'badge-info', color: '#2563eb', desc: 'Team oversight, approvals, performance & attendance' },
    { id: 'OPERATIONS_MANAGER', name: 'Operations Manager', badge: 'badge-info', color: '#0284c7', desc: 'Operational workflow oversight, teams & shift management' },
    { id: 'TEAM_LEAD', name: 'Team Leader', badge: 'badge-info', color: '#4f46e5', desc: 'Shift leadership, daily roster, team reviews & sign-offs' },
    { id: 'RELATIONSHIP_MANAGER', name: 'Relationship Manager', badge: 'badge-info', color: '#0891b2', desc: 'Client relations, accounts, portfolio & operations management' },
    { id: 'MENTOR_TRAINER', name: 'Mentor / Trainer', badge: 'badge-warning', color: '#d97706', desc: 'Training curriculum, module evaluations & trainee guidance' },
    { id: 'TRAINEE', name: 'Graduate Trainee', badge: 'badge-warning', color: '#ea580c', desc: 'Restricted access strictly to 7-day training & punch-in' },
    { id: 'EMPLOYEE', name: 'Employee (Self Service)', badge: 'badge-neutral', color: '#475569', desc: 'Standard self-service profile, timecard, leaves & requests' }
  ],

  // Get user profile by UID
  async getUserProfile(uid) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (err) {
      console.error('Error getting user profile:', err);
      throw err;
    }
  },

  // Update user profile
  async updateUserProfile(uid, updateData) {
    try {
      const oldDoc = await this.getUserProfile(uid);
      const dataToSave = {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(uid).set(dataToSave, { merge: true });
      await auditService.log('USER_UPDATED', 'USERS', 'users', uid, {}, oldDoc, dataToSave);
      return true;
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  },

  // Comprehensive User & Role Update: Syncs 'users' and 'employees' collections
  async updateUserAndRole(uid, { displayName, roleId, department, designation, phone, status, employeeCode }) {
    try {
      const userRef = db.collection('users').doc(uid);
      const userSnap = await userRef.get();
      const currentData = userSnap.exists ? userSnap.data() : {};
      const email = currentData.email || '';

      const userUpdates = {
        displayName: displayName || currentData.displayName || 'Unnamed User',
        roleId: roleId || currentData.roleId || 'EMPLOYEE',
        status: status || currentData.status || 'ACTIVE',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      if (department) userUpdates.department = department;
      if (designation) userUpdates.designation = designation;
      if (phone) userUpdates.phone = phone;
      if (employeeCode) userUpdates.employeeCode = employeeCode;

      // 1. Update Firestore 'users' document
      await userRef.set(userUpdates, { merge: true });

      // 2. Cross-sync to Firestore 'employees' document
      let matchedEmpId = currentData.employeeId || null;
      if (!matchedEmpId) {
        // Try to locate by UID or workEmail
        try {
          const empByUid = await db.collection('employees').doc(uid).get();
          if (empByUid.exists) {
            matchedEmpId = uid;
          } else if (email) {
            const empByEmail = await db.collection('employees').where('workEmail', '==', email.toLowerCase().trim()).limit(1).get();
            if (!empByEmail.empty) matchedEmpId = empByEmail.docs[0].id;
          }
        } catch (e) {
          console.warn('Could not locate employee record for sync:', e);
        }
      }

      if (matchedEmpId) {
        const empUpdates = {
          fullName: userUpdates.displayName,
          name: userUpdates.displayName,
          roleId: userUpdates.roleId,
          role: userUpdates.roleId,
          employmentStatus: userUpdates.status,
          status: userUpdates.status,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (department) empUpdates.department = department;
        if (designation) empUpdates.designation = designation;
        if (phone) empUpdates.phone = phone;
        if (employeeCode) empUpdates.employeeCode = employeeCode;

        await db.collection('employees').doc(matchedEmpId).set(empUpdates, { merge: true });
      }

      // 3. Keep Hostinger MySQL backend synchronized (if live)
      if (typeof employeeService !== 'undefined' && typeof employeeService.syncToMySQL === 'function') {
        employeeService.syncToMySQL({
          employeeCode: employeeCode || currentData.employeeCode || 'D-00001',
          workEmail: email,
          fullName: userUpdates.displayName,
          roleId: userUpdates.roleId
        }).catch(() => {});
      }

      // 4. If current logged-in user modified themselves, update AuthGuard in memory
      if (window.AuthGuard && AuthGuard.currentUser?.uid === uid && AuthGuard.userProfile) {
        AuthGuard.userProfile.displayName = userUpdates.displayName;
        AuthGuard.userProfile.roleId = userUpdates.roleId;
        if (department) AuthGuard.userProfile.department = department;
        if (designation) AuthGuard.userProfile.designation = designation;
        if (AuthGuard.refreshNavbar) AuthGuard.refreshNavbar();
      }

      await auditService.log('USER_ROLE_CHANGED', 'USERS', 'users', uid, {
        displayName: userUpdates.displayName,
        email,
        newRole: userUpdates.roleId,
        status: userUpdates.status
      });

      return { success: true, message: `Successfully updated ${userUpdates.displayName}'s role to ${userUpdates.roleId}` };
    } catch (err) {
      console.error('Error updating user and role:', err);
      throw err;
    }
  },

  // Send Password Reset Link to user's login ID
  async sendPasswordReset(email) {
    if (!email) throw new Error('Email address is required.');
    if (typeof authService !== 'undefined' && typeof authService.sendPasswordReset === 'function') {
      return await authService.sendPasswordReset(email);
    }
    const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'https://hrmstfw.com';
    const actionCodeSettings = {
      url: `${origin}/reset-password.html`,
      handleCodeInApp: true
    };
    try {
      await firebase.auth().sendPasswordResetEmail(email, actionCodeSettings);
    } catch (settingsErr) {
      if (settingsErr.code === 'auth/unauthorized-continue-uri') {
        await firebase.auth().sendPasswordResetEmail(email);
      } else {
        throw settingsErr;
      }
    }
    return { success: true, message: `Password reset link sent to ${email}` };
  },

  // Fetch all users enriched with Employee directory metadata
  async getAllUsers(companyId = null) {
    try {
      let userQuery = db.collection('users');
      if (companyId) userQuery = userQuery.where('companyId', '==', companyId);

      const [usersSnap, empsSnap] = await Promise.all([
        userQuery.get().catch(() => ({ docs: [] })),
        db.collection('employees').get().catch(() => ({ docs: [] }))
      ]);

      const empByEmail = new Map();
      const empByUid = new Map();
      empsSnap.docs.forEach(d => {
        const data = d.data() || {};
        const emp = { id: d.id, ...data };
        if (data.workEmail) empByEmail.set(data.workEmail.toLowerCase().trim(), emp);
        if (data.email) empByEmail.set(data.email.toLowerCase().trim(), emp);
        if (data.userId) empByUid.set(data.userId, emp);
        empByUid.set(d.id, emp);
      });

      const usersList = usersSnap.docs.map(doc => {
        const u = { id: doc.id, uid: doc.id, ...doc.data() };
        const uEmail = (u.email || '').toLowerCase().trim();
        const matchedEmp = empByUid.get(u.uid) || empByEmail.get(uEmail);

        return {
          ...u,
          employeeId: u.employeeId || matchedEmp?.id || null,
          employeeCode: u.employeeCode || matchedEmp?.employeeCode || matchedEmp?.code || '—',
          department: u.department || matchedEmp?.department || 'General',
          designation: u.designation || matchedEmp?.designation || 'Staff',
          phone: u.phone || matchedEmp?.phone || matchedEmp?.mobile || '—',
          roleId: u.roleId || matchedEmp?.roleId || 'EMPLOYEE',
          status: u.status || matchedEmp?.status || matchedEmp?.employmentStatus || 'ACTIVE',
          hasEmployeeDoc: !!matchedEmp
        };
      });

      // Sort with Super Admins on top, then alphabetical by Display Name
      usersList.sort((a, b) => {
        if (a.roleId === 'SUPER_ADMIN' && b.roleId !== 'SUPER_ADMIN') return -1;
        if (b.roleId === 'SUPER_ADMIN' && a.roleId !== 'SUPER_ADMIN') return 1;
        return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
      });

      return usersList;
    } catch (err) {
      console.error('Error fetching enriched users:', err);
      return [];
    }
  },

  async getUsers(companyId = null) {
    return this.getAllUsers(companyId);
  },

  // Roles Collection
  async getRoles() {
    try {
      const snapshot = await db.collection('roles').get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      return this.ROLES;
    } catch (err) {
      console.warn('Using default roles list:', err);
      return this.ROLES;
    }
  },

  // Create or Update Role
  async saveRole(roleId, roleData) {
    try {
      const dataToSave = {
        ...roleData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('roles').doc(roleId).set(dataToSave, { merge: true });
      await auditService.log('ROLE_SAVED', 'ROLES', 'roles', roleId, roleData);
      return true;
    } catch (err) {
      console.error('Error saving role:', err);
      throw err;
    }
  }
};

window.userService = userService;
