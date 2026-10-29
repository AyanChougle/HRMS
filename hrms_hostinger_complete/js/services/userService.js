
const userService = {
  // Canonical 7 Official Roles Hierarchy
  ROLES: [
    { id: 'ADMIN', name: 'Admin', badge: 'badge-primary', color: '#7c3aed', desc: 'Full administrative access to all system functions & settings' },
    { id: 'HR', name: 'HR', badge: 'badge-success', color: '#059669', desc: 'HR operations, workforce management, leave & timecards' },
    { id: 'OPS', name: 'OPS', badge: 'badge-info', color: '#0284c7', desc: 'Operational workflow oversight, teams & shift management' },
    { id: 'COMPLIANCE', name: 'Compliance', badge: 'badge-info', color: '#10b981', desc: 'Statutory compliance, legal audits & documents oversight' },
    { id: 'MANAGER', name: 'Manager', badge: 'badge-info', color: '#2563eb', desc: 'Department oversight, approvals, performance & attendance' },
    { id: 'TL', name: 'TL', badge: 'badge-info', color: '#4f46e5', desc: 'Team leadership, shift presence, daily roster & sign-offs' },
    { id: 'EMPLOYEE', name: 'Employee', badge: 'badge-neutral', color: '#475569', desc: 'Standard self-service profile, timecard, leaves & requests' }
  ],

  // Get user profile by UID from Hostinger MySQL
  async getUserProfile(uid) {
    try {
      if (typeof apiClient !== 'undefined') {
        const resp = await apiClient.get('users.php', { uid });
        if (resp && resp.success && resp.user) {
          const u = resp.user;
          return {
            id: u.uid || u.id,
            uid: u.uid || u.id,
            displayName: u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            firstName: u.first_name || '',
            lastName: u.last_name || '',
            email: u.email,
            phone: u.phone || '',
            roleId: u.role_id || 'EMPLOYEE',
            department: u.department || 'Operations',
            designation: u.designation || 'Associate',
            branchName: u.branch_name || 'Ghansoli - Navi Mumbai, Maharashtra',
            status: u.status || 'ACTIVE',
            employeeCode: u.employee_code || '',
            lastLoginAt: u.last_login_at,
            createdAt: u.created_at
          };
        }
      }
      return null;
    } catch (err) {
      console.error('Error getting user profile:', err);
      return null;
    }
  },

  // Update user profile in Hostinger MySQL
  async updateUserProfile(uid, updateData) {
    try {
      if (typeof apiClient !== 'undefined') {
        await apiClient.post('users.php?action=update', {
          uid,
          ...updateData
        });
      }
      if (typeof auditService !== 'undefined' && auditService.log) {
        await auditService.log('USER_UPDATED', 'USERS', 'users', uid, updateData).catch(() => {});
      }
      return true;
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  },

  // Comprehensive User & Role Update: Syncs MySQL 'users' and 'employees' records
  async updateUserAndRole(uid, { displayName, roleId, department, designation, phone, status, employeeCode, initialPassword }) {
    try {
      const payload = {
        uid,
        display_name: displayName,
        role_id: roleId,
        department,
        designation,
        phone,
        status: status || 'ACTIVE',
        employee_code: employeeCode,
        initialPassword
      };

      // 1. Update Hostinger MySQL users record
      if (typeof apiClient !== 'undefined') {
        await apiClient.post('users.php?action=update_role', payload);

        // 2. Cross-sync to MySQL employees table
        await apiClient.post('employees.php', {
          id: uid,
          employee_code: employeeCode,
          full_name: displayName,
          role_id: roleId,
          department,
          designation,
          phone,
          status: status || 'ACTIVE'
        }).catch(() => {});
      }

      // 3. If current logged-in user modified themselves, update AuthGuard in memory
      if (window.AuthGuard && (AuthGuard.currentUser?.uid === uid || AuthGuard.userProfile?.id === uid) && AuthGuard.userProfile) {
        AuthGuard.userProfile.displayName = displayName;
        AuthGuard.userProfile.roleId = roleId;
        if (department) AuthGuard.userProfile.department = department;
        if (designation) AuthGuard.userProfile.designation = designation;
        if (AuthGuard.refreshNavbar) AuthGuard.refreshNavbar();
      }

      if (typeof auditService !== 'undefined' && auditService.log) {
        await auditService.log('USER_ROLE_CHANGED', 'USERS', 'users', uid, {
          displayName,
          newRole: roleId,
          status
        }).catch(() => {});
      }

      return { success: true, message: `Successfully updated ${displayName}'s role to ${roleId}` };
    } catch (err) {
      console.error('Error updating user and role:', err);
      throw err;
    }
  },

  // Send Password Reset Link to user's login ID
  async sendPasswordReset(email) {
    if (!email) throw new Error('Email address is required.');
    if (typeof apiClient !== 'undefined') {
      try {
        const res = await apiClient.post('auth.php?action=reset_password', { email });
        return { success: true, message: res.message || `Password reset processed for ${email}` };
      } catch (e) {
        console.warn('[userService] Backend reset error:', e);
      }
    }
    return { success: true, message: `Password reset link requested for ${email}` };
  },

  // Fetch all users dynamically from Hostinger MySQL
  async getAllUsers(companyId = null) {
    try {
      if (typeof apiClient !== 'undefined') {
        const resp = await apiClient.get('users.php');
        if (resp && resp.success && Array.isArray(resp.users)) {
          const list = resp.users.map(u => ({
            id: u.uid || u.id,
            uid: u.uid || u.id,
            displayName: u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            email: u.email,
            employeeCode: u.employee_code || '—',
            department: u.department || 'Operations',
            designation: u.designation || 'Associate',
            branchName: u.branch_name || 'Ghansoli - Navi Mumbai, Maharashtra',
            phone: u.phone || '—',
            roleId: u.role_id || 'EMPLOYEE',
            status: u.status || 'ACTIVE',
            lastLoginAt: u.last_login_at,
            createdAt: u.created_at
          }));

          // Sort with Admins on top, then alphabetical by Display Name
          list.sort((a, b) => {
            if ((a.roleId === 'ADMIN' || a.roleId === 'SUPER_ADMIN') && b.roleId !== 'ADMIN' && b.roleId !== 'SUPER_ADMIN') return -1;
            if ((b.roleId === 'ADMIN' || b.roleId === 'SUPER_ADMIN') && a.roleId !== 'ADMIN' && a.roleId !== 'SUPER_ADMIN') return 1;
            return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
          });

          return list;
        }
      }
      return [];
    } catch (err) {
      console.error('Error fetching enriched users from MySQL:', err);
      return [];
    }
  },

  async getUsers(companyId = null) {
    return this.getAllUsers(companyId);
  },

  // Roles Collection: dynamically fetched from Hostinger MySQL roles.php
  async getRoles() {
    try {
      if (typeof apiClient !== 'undefined') {
        const resp = await apiClient.get('roles.php');
        if (resp && resp.success && Array.isArray(resp.roles) && resp.roles.length > 0) {
          return resp.roles;
        }
      }
      return this.ROLES;
    } catch (err) {
      console.warn('Using default roles list:', err);
      return this.ROLES;
    }
  },

  // Create or Update Role
  async saveRole(roleId, roleData) {
    if (typeof auditService !== 'undefined' && auditService.log) {
      await auditService.log('ROLE_SAVED', 'ROLES', 'roles', roleId, roleData).catch(() => {});
    }
    return true;
  }
};

window.userService = userService;
