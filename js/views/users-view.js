/**
 * DIALLO HRMS — USER ACCESS & ROLE MANAGEMENT (HOSTINGER MYSQL BACKED)
 * Full user census, role assignments, account lifecycle states, and credentials
 */

const UsersView = {
  currentUsers: [],
  currentFilters: {
    search: '',
    role: 'All',
    status: 'All'
  },

  async render() {
    let users = [];
    try {
      // 1. Fetch dynamically from Hostinger MySQL API
      if (typeof apiClient !== 'undefined') {
        const res = await apiClient.get('users.php').catch(() => null);
        if (res && res.success && Array.isArray(res.users) && res.users.length > 0) {
          users = res.users.map(u => ({
            id: u.uid || u.id,
            uid: u.uid || u.id,
            displayName: u.display_name || u.displayName || 'Unnamed User',
            email: u.email || '—',
            employeeCode: u.employee_code || u.employeeCode || '—',
            roleId: u.role_id || u.roleId || 'EMPLOYEE',
            department: u.department || 'Operations',
            designation: u.designation || 'Associate',
            branchName: u.branch_name || 'Ghansoli - Navi Mumbai, Maharashtra',
            status: u.status || 'ACTIVE',
            lastLoginAt: u.last_login_at || null,
            createdAt: u.created_at || null
          }));
        }
      }

      // 2. Fallback to Firestore / userService if MySQL returned empty
      if (users.length === 0 && typeof userService !== 'undefined') {
        users = await userService.getAllUsers();
      }
    } catch (e) {
      console.warn("Could not fetch users list:", e);
    }

    this.currentUsers = users;

    const roleCounts = {
      total: users.length,
      superAdmin: users.filter(u => u.roleId === 'SUPER_ADMIN').length,
      hr: users.filter(u => u.roleId === 'HR_MANAGER').length,
      management: users.filter(u => ['MANAGER', 'OPERATIONS_MANAGER', 'TEAM_LEAD'].includes(u.roleId)).length,
      trainee: users.filter(u => u.roleId === 'TRAINEE').length,
      employee: users.filter(u => u.roleId === 'EMPLOYEE' || !u.roleId).length,
      active: users.filter(u => u.status === 'ACTIVE').length
    };

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <a href="#settings">Administration</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">User Accounts & Logins</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">User Accounts & Role Governance</h1>
            <p class="page-subtitle">Inspect login IDs, assign system roles (RBAC), and manage credentials connected to Hostinger MySQL</p>
          </div>
          <div class="page-actions flex items-center gap-2">
            <button class="btn btn-secondary btn-sm" onclick="UsersView.syncAllToHostinger()">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <span>Sync All to Hostinger DB</span>
            </button>
            <button class="btn btn-primary btn-sm" onclick="Router.navigate('create-employee')">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>+ Create New Login</span>
            </button>
          </div>
        </div>
      </div>

      <!-- User Role Distribution KPI Cards -->
      <div class="grid animate-fade-in" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="card p-4">
          <div class="text-muted" style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase;">Total Login Accounts</div>
          <div class="flex items-baseline justify-between mt-2">
            <span style="font-size: 1.8rem; font-weight: 800; color: var(--text-main);">${roleCounts.total}</span>
            <span class="badge badge-success">${roleCounts.active} Active</span>
          </div>
        </div>

        <div class="card p-4">
          <div class="text-muted" style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase;">Super Administrators</div>
          <div class="flex items-baseline justify-between mt-2">
            <span style="font-size: 1.8rem; font-weight: 800; color: #7c3aed;">${roleCounts.superAdmin}</span>
            <span class="badge badge-primary">Full Root</span>
          </div>
        </div>

        <div class="card p-4">
          <div class="text-muted" style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase;">HR & Management</div>
          <div class="flex items-baseline justify-between mt-2">
            <span style="font-size: 1.8rem; font-weight: 800; color: #059669;">${roleCounts.hr + roleCounts.management}</span>
            <span class="badge badge-info">${roleCounts.hr} HR • ${roleCounts.management} Mgr</span>
          </div>
        </div>

        <div class="card p-4">
          <div class="text-muted" style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase;">Employees & Trainees</div>
          <div class="flex items-baseline justify-between mt-2">
            <span style="font-size: 1.8rem; font-weight: 800; color: #2563eb;">${roleCounts.employee + roleCounts.trainee}</span>
            <span class="badge badge-neutral">${roleCounts.employee} Staff • ${roleCounts.trainee} Trainee</span>
          </div>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="card p-3 mb-4 animate-fade-in">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-1" style="min-width: 260px;">
            <div style="position: relative; width: 100%;">
              <input type="text" id="user-search-input" class="form-control" placeholder="Search by name, login email, employee code, department..." 
                oninput="UsersView.handleSearch(this.value)" style="padding-left: 36px;" />
              <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <select id="user-role-filter" class="form-control form-control-sm" style="width: 170px;" onchange="UsersView.handleRoleFilter(this.value)">
              <option value="All">All Roles</option>
              <option value="SUPER_ADMIN">Super Administrator</option>
              <option value="HR_MANAGER">HR Manager</option>
              <option value="MANAGER">Manager</option>
              <option value="OPERATIONS_MANAGER">Operations Manager</option>
              <option value="TEAM_LEAD">Team Leader</option>
              <option value="MENTOR_TRAINER">Mentor / Trainer</option>
              <option value="TRAINEE">Graduate Trainee</option>
              <option value="EMPLOYEE">Employee (Self Service)</option>
            </select>

            <select id="user-status-filter" class="form-control form-control-sm" style="width: 130px;" onchange="UsersView.handleStatusFilter(this.value)">
              <option value="All">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Users Census Table Card -->
      <div class="card animate-fade-in">
        <div class="card-header flex items-center justify-between">
          <div>
            <div class="card-title">Authorized Login Accounts (<span id="user-display-count">${users.length}</span>)</div>
            <div class="card-subtitle">Active authentication credentials, designated system roles, and status states</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0; overflow-x: auto;">
          <table class="data-table" id="users-data-table">
            <thead>
              <tr>
                <th style="min-width: 220px;">User / Login ID</th>
                <th>Employee Code</th>
                <th>Department & Designation</th>
                <th>Assigned Role</th>
                <th>Status</th>
                <th style="text-align: right; min-width: 190px;">Actions</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              ${this.renderTableRows(users)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  getRoleBadge(roleId) {
    const map = {
      SUPER_ADMIN: { label: 'Super Admin', style: 'background: rgba(124, 58, 237, 0.12); color: #7c3aed; border: 1px solid rgba(124, 58, 237, 0.3);' },
      HR_MANAGER: { label: 'HR Manager', style: 'background: rgba(5, 150, 105, 0.12); color: #059669; border: 1px solid rgba(5, 150, 105, 0.3);' },
      MANAGER: { label: 'Manager', style: 'background: rgba(37, 99, 235, 0.12); color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.3);' },
      OPERATIONS_MANAGER: { label: 'Ops Manager', style: 'background: rgba(2, 132, 199, 0.12); color: #0284c7; border: 1px solid rgba(2, 132, 199, 0.3);' },
      TEAM_LEAD: { label: 'Team Leader', style: 'background: rgba(79, 70, 229, 0.12); color: #4f46e5; border: 1px solid rgba(79, 70, 229, 0.3);' },
      MENTOR_TRAINER: { label: 'Mentor / Trainer', style: 'background: rgba(217, 119, 6, 0.12); color: #d97706; border: 1px solid rgba(217, 119, 6, 0.3);' },
      TRAINEE: { label: 'Graduate Trainee', style: 'background: rgba(234, 88, 12, 0.12); color: #ea580c; border: 1px solid rgba(234, 88, 12, 0.3);' },
      EMPLOYEE: { label: 'Employee', style: 'background: rgba(100, 116, 139, 0.12); color: #475569; border: 1px solid rgba(100, 116, 139, 0.3);' }
    };
    const r = map[roleId] || { label: roleId || 'Employee', style: 'background: #f1f5f9; color: #475569;' };
    return `<span class="badge" style="font-weight: 700; font-size: 0.74rem; padding: 3px 8px; border-radius: 6px; ${r.style}">${r.label}</span>`;
  },

  renderTableRows(users) {
    if (!users || users.length === 0) {
      return `<tr><td colspan="6" style="text-align: center; padding: 32px; color: var(--text-muted);">No login accounts match your criteria.</td></tr>`;
    }

    return users.map(u => `
      <tr id="user-row-${u.uid || u.id}">
        <td>
          <div class="user-cell">
            <div class="user-cell-avatar" style="background: var(--primary-light); color: var(--primary); font-weight: 700;">
              ${(u.displayName || u.email || "US").substring(0, 2).toUpperCase()}
            </div>
            <div class="user-cell-info">
              <span class="user-cell-name font-semibold text-main">${u.displayName || "Unnamed User"}</span>
              <div class="flex items-center gap-1">
                <span class="user-cell-code font-mono" style="font-size: 0.75rem; color: var(--text-secondary);">${u.email || "—"}</span>
                <button type="button" class="btn btn-ghost btn-sm" onclick="UsersView.copyText('${u.email}')" title="Copy Login Email" style="padding: 1px 4px;">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                </button>
              </div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-neutral font-mono font-bold" style="font-size: 0.76rem;">${u.employeeCode || '—'}</span>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-main);">${u.department || 'Operations'}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${u.designation || 'Associate'}</div>
        </td>
        <td>
          ${this.getRoleBadge(u.roleId)}
        </td>
        <td>
          <span class="badge ${u.status === 'ACTIVE' ? 'badge-success' : u.status === 'SUSPENDED' ? 'badge-danger' : 'badge-warning'}">
            <span class="badge-dot"></span> ${u.status || 'ACTIVE'}
          </span>
        </td>
        <td style="text-align: right;">
          <div class="flex items-center justify-end gap-1">
            <button class="btn btn-primary btn-sm" onclick="UsersView.openEditModal('${u.uid || u.id}')" title="Edit Role & Details">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <span>Edit Role</span>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="UsersView.triggerPasswordReset('${u.email}', '${u.displayName}')" title="Send Password Reset Email">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="UsersView.toggleStatus('${u.uid || u.id}', '${u.displayName}', '${u.status}')" title="${u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}">
              <span style="color: ${u.status === 'ACTIVE' ? '#dc2626' : '#16a34a'}; font-weight: 600; font-size: 0.75rem;">
                ${u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              </span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  handleSearch(val) {
    this.currentFilters.search = (val || '').toLowerCase().trim();
    this.applyFilters();
  },

  handleRoleFilter(role) {
    this.currentFilters.role = role;
    this.applyFilters();
  },

  handleStatusFilter(status) {
    this.currentFilters.status = status;
    this.applyFilters();
  },

  applyFilters() {
    const s = this.currentFilters.search;
    const r = this.currentFilters.role;
    const st = this.currentFilters.status;

    const filtered = this.currentUsers.filter(u => {
      const matchSearch = !s || (
        (u.displayName && u.displayName.toLowerCase().includes(s)) ||
        (u.email && u.email.toLowerCase().includes(s)) ||
        (u.employeeCode && u.employeeCode.toLowerCase().includes(s)) ||
        (u.department && u.department.toLowerCase().includes(s)) ||
        (u.designation && u.designation.toLowerCase().includes(s))
      );
      const matchRole = r === 'All' || u.roleId === r;
      const matchStatus = st === 'All' || u.status === st;
      return matchSearch && matchRole && matchStatus;
    });

    const body = document.getElementById('users-table-body');
    const countSpan = document.getElementById('user-display-count');
    if (body) body.innerHTML = this.renderTableRows(filtered);
    if (countSpan) countSpan.textContent = filtered.length;
  },

  openEditModal(uid) {
    const user = this.currentUsers.find(u => (u.uid === uid || u.id === uid));
    if (!user) { Toast.error('User profile not found.'); return; }

    const roles = [
      { id: 'SUPER_ADMIN', name: 'Super Administrator' },
      { id: 'HR_MANAGER', name: 'HR Manager' },
      { id: 'MANAGER', name: 'Manager' },
      { id: 'OPERATIONS_MANAGER', name: 'Operations Manager' },
      { id: 'TEAM_LEAD', name: 'Team Leader' },
      { id: 'MENTOR_TRAINER', name: 'Mentor / Trainer' },
      { id: 'TRAINEE', name: 'Graduate Trainee' },
      { id: 'EMPLOYEE', name: 'Employee (Self Service)' }
    ];

    const departments = [
      'Digital Team', 'Operations', 'Sales', 'Real Estate', 'Car Rental', 'Compliance', 'Training', 'Human Resources'
    ];

    ModalManager.openModal({
      id: 'edit-user-modal',
      title: `Edit User & Role: ${user.displayName}`,
      subtitle: `Login ID: ${user.email} • Code: ${user.employeeCode || '—'}`,
      size: 'md',
      contentHtml: `
        <form id="edit-user-form" onsubmit="event.preventDefault(); UsersView.saveUserEdit('${user.uid || user.id}');">
          <div class="form-group mb-3">
            <label class="form-label required">Full Name / Display Name</label>
            <input type="text" id="edit-usr-name" class="form-control" value="${user.displayName || ''}" required />
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Official Email / Login ID</label>
            <input type="email" id="edit-usr-email" class="form-control" value="${user.email || ''}" readonly disabled style="background: var(--bg-hover); font-family: monospace;" />
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Primary account authentication address.</div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label required">Assigned System Role (RBAC)</label>
            <select id="edit-usr-role" class="form-control" required>
              ${roles.map(r => `<option value="${r.id}" ${user.roleId === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
            </select>
          </div>

          <div class="grid mb-3" style="grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label required">Department</label>
              <select id="edit-usr-dept" class="form-control">
                ${departments.map(d => `<option value="${d}" ${user.department === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Designation / Title</label>
              <input type="text" id="edit-usr-desig" class="form-control" value="${user.designation || ''}" required />
            </div>
          </div>

          <div class="grid mb-3" style="grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" id="edit-usr-phone" class="form-control" value="${user.phone || ''}" placeholder="+91 ..." />
            </div>
            <div class="form-group">
              <label class="form-label required">Account Status</label>
              <select id="edit-usr-status" class="form-control">
                <option value="ACTIVE" ${user.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
                <option value="SUSPENDED" ${user.status === 'SUSPENDED' ? 'selected' : ''}>SUSPENDED</option>
                <option value="INACTIVE" ${user.status === 'INACTIVE' ? 'selected' : ''}>INACTIVE</option>
              </select>
            </div>
          </div>

          <div style="background: var(--bg-hover); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-light); margin-top: 8px;">
            <div class="flex items-center justify-between">
              <div>
                <strong style="font-size: 0.82rem;">Need to reset password?</strong>
                <div style="font-size: 0.74rem; color: var(--text-muted);">Send a password reset link directly to ${user.email}</div>
              </div>
              <button type="button" class="btn btn-soft btn-sm" onclick="UsersView.triggerPasswordReset('${user.email}', '${user.displayName}')">Send Reset Link</button>
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="UsersView.saveUserEdit('${user.uid || user.id}')">Save Changes</button>
      `
    });
  },

  async saveUserEdit(uid) {
    const name = document.getElementById('edit-usr-name')?.value.trim();
    const roleId = document.getElementById('edit-usr-role')?.value;
    const department = document.getElementById('edit-usr-dept')?.value;
    const designation = document.getElementById('edit-usr-desig')?.value.trim();
    const phone = document.getElementById('edit-usr-phone')?.value.trim();
    const status = document.getElementById('edit-usr-status')?.value;

    if (!name || !roleId) {
      Toast.error('Please enter name and select a role.');
      return;
    }

    try {
      Toast.info('Updating user profile and role across Hostinger and database...');

      // 1. Post to Hostinger MySQL backend
      if (typeof apiClient !== 'undefined') {
        await apiClient.post('users.php', {
          uid,
          display_name: name,
          role_id: roleId,
          department,
          designation,
          phone,
          status
        }).catch(err => console.warn('Hostinger MySQL user update:', err));
      }

      // 2. Cross-sync to Firestore userService
      if (typeof userService !== 'undefined' && typeof userService.updateUserAndRole === 'function') {
        await userService.updateUserAndRole(uid, {
          displayName: name,
          roleId,
          department,
          designation,
          phone,
          status
        });
      }

      Toast.success(`Successfully updated ${name}'s role to ${roleId}!`);
      ModalManager.closeModal();
      Router.mountView('users');
    } catch (err) {
      Toast.error(`Failed to update user: ${err.message}`);
    }
  },

  async triggerPasswordReset(email, name) {
    if (!email || email === '—') {
      Toast.error('User does not have a valid email address.');
      return;
    }

    if (!confirm(`Send password reset email to ${name || 'user'} (${email})?`)) return;

    try {
      // 1. Try Firebase Auth Reset
      if (typeof userService !== 'undefined' && typeof userService.sendPasswordReset === 'function') {
        await userService.sendPasswordReset(email);
        Toast.success(`Password reset link successfully sent to ${email}!`);
        return;
      }

      // 2. Fallback to Hostinger backend auth reset
      if (typeof apiClient !== 'undefined') {
        const res = await apiClient.post('auth.php?action=reset_password', { email });
        if (res && res.temporary_password) {
          alert(`Temporary password generated for ${email}:\n\n${res.temporary_password}\n\nPlease share this with the user.`);
          Toast.success('Temporary password generated.');
        }
      }
    } catch (err) {
      Toast.error(`Could not send password reset: ${err.message}`);
    }
  },

  async toggleStatus(uid, name, currentStatus) {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change ${name}'s status to ${nextStatus}?`)) return;

    try {
      if (typeof apiClient !== 'undefined') {
        await apiClient.post('users.php', { uid, status: nextStatus }).catch(() => {});
      }
      if (typeof userService !== 'undefined') {
        await userService.updateUserProfile(uid, { status: nextStatus });
      }
      Toast.success(`Set ${name}'s account status to ${nextStatus}.`);
      Router.mountView('users');
    } catch (err) {
      Toast.error(`Status change failed: ${err.message}`);
    }
  },

  async syncAllToHostinger() {
    if (!confirm('This will export all existing users and employees directly into your Hostinger MySQL database. Proceed?')) return;

    try {
      Toast.info('Connecting to Firebase and transferring records to Hostinger MySQL...');

      const [usersSnap, empsSnap] = await Promise.all([
        db.collection('users').get().catch(() => ({ docs: [] })),
        db.collection('employees').get().catch(() => ({ docs: [] }))
      ]);

      const payload = {
        users: usersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        employees: empsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      };

      if (typeof apiClient !== 'undefined') {
        const res = await apiClient.post('migrate_from_firebase.php', payload);
        if (res.success) {
          Toast.success(`Migrated ${res.migrated_counts?.users || 0} users and ${res.migrated_counts?.employees || 0} employees to Hostinger MySQL!`);
          Router.mountView('users');
          return;
        }
      }
      Toast.info('Sync completed.');
    } catch (err) {
      Toast.error(`Migration error: ${err.message}`);
    }
  },

  copyText(txt) {
    if (!txt || txt === '—') return;
    navigator.clipboard?.writeText(txt).then(() => {
      Toast.info(`Copied to clipboard: ${txt}`);
    }).catch(() => {});
  }
};

window.UsersView = UsersView;
