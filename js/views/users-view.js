/**
 * DIALLO HRMS — USER ACCESS & ROLE MANAGEMENT (PHASE 3)
 * Full user census, role assignments, account status toggles, and audit trail
 */

const UsersView = {
  async render() {
    let users = [];
    try {
      users = await userService.getUsers();
    } catch (e) {
      console.warn("Could not fetch users list:", e);
    }

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <a href="#admin">Admin</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">User Management</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">User Accounts & Access Matrix</h1>
            <p class="page-subtitle">Manage organization users, role assignments (RBAC), and account lifecycle states</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="UsersView.openAddUserModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add User Profile
            </button>
          </div>
        </div>
      </div>

      <!-- Users Census Table Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Registered User Profiles (${users.length})</div>
            <div class="card-subtitle">Active authentication profiles stored in Cloud Firestore</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Role ID</th>
                <th>Company / Entity</th>
                <th>Branch Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                users.length === 0
                  ? `
                <tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">No user accounts found.</td></tr>
              `
                  : users
                      .map(
                        (u) => `
                <tr id="user-row-${u.uid || u.id}">
                  <td>
                    <div class="user-cell">
                      <div class="user-cell-avatar">${(u.displayName || u.email || "US").substring(0, 2).toUpperCase()}</div>
                      <div class="user-cell-info">
                        <span class="user-cell-name font-semibold">${u.displayName || "Unnamed User"}</span>
                        <span class="user-cell-code">${u.email || "-"}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge ${u.roleId === "SUPER_ADMIN" ? "badge-primary" : u.roleId === "HR" ? "badge-success" : "badge-neutral"}">
                      ${u.roleId || "EMPLOYEE"}
                    </span>
                  </td>
                  <td><span class="font-medium text-main">${u.companyName || u.companyId || "Diallo India"}</span></td>
                  <td>${u.branchName || u.branchId || "HQ - Mumbai"}</td>
                  <td>
                    <span class="badge ${u.status === "ACTIVE" ? "badge-success" : u.status === "SUSPENDED" ? "badge-danger" : "badge-warning"}">
                      <span class="badge-dot"></span> ${u.status || "ACTIVE"}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-1">
                      <button class="btn btn-soft btn-sm" onclick="UsersView.openEditRoleModal('${u.uid || u.id}', '${u.displayName || u.email}', '${u.roleId}')">Change Role</button>
                      <button class="btn btn-secondary btn-sm" onclick="UsersView.toggleUserStatus('${u.uid || u.id}', '${u.displayName || u.email}', '${u.status}')">
                        ${u.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              `,
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  openAddUserModal() {
    ModalManager.openModal({
      id: "add-user-modal",
      title: "Create User Profile",
      subtitle: "Register a new authenticated user profile in Cloud Firestore",
      contentHtml: `
        <form id="new-user-form">
          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Display Name</label>
              <input type="text" id="usr-name" class="form-control" placeholder="e.g. Priya Patel" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Official Email Address</label>
              <input type="email" id="usr-email" class="form-control" placeholder="priya@company.com" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Account Role</label>
              <select id="usr-role" class="form-control">
                <option value="SUPER_ADMIN">Super Administrator</option>
                <option value="COMPANY_ADMIN">Company Administrator</option>
                <option value="HR" selected>HR Administrator</option>
                <option value="PAYROLL">Payroll Officer</option>
                <option value="MANAGER">Line Manager</option>
                <option value="EMPLOYEE">Employee (Self Service)</option>
              </select>
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Status</label>
              <select id="usr-status" class="form-control">
                <option value="ACTIVE" selected>ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="UsersView.saveNewUser()">Save User</button>
      `,
    });
  },

  async saveNewUser() {
    const name = document.getElementById("usr-name")?.value.trim();
    const email = document.getElementById("usr-email")?.value.trim();
    const roleId = document.getElementById("usr-role")?.value;
    const status = document.getElementById("usr-status")?.value;

    if (!name || !email) return;

    try {
      const docRef = await db.collection("users").add({
        displayName: name,
        email,
        roleId,
        status,
        companyId: "comp_diallo_india",
        companyName: "Diallo India Private Limited",
        branchId: "branch_mumbai",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      await auditService.log("USER_CREATED", "USERS", "users", docRef.id, {
        email,
        roleId,
        status,
      });
      Toast.success(`Created user profile for ${name}`);
      ModalManager.closeModal();
      Router.mountView("users");
    } catch (err) {
      Toast.error(`Failed to save user: ${err.message}`);
    }
  },

  openEditRoleModal(uid, name, currentRole) {
    ModalManager.openModal({
      id: "edit-role-modal",
      title: `Change Role: ${name}`,
      subtitle: "Assign a new system role and permission set",
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Select New Role</label>
          <select id="update-role-select" class="form-control">
            <option value="SUPER_ADMIN" ${currentRole === "SUPER_ADMIN" ? "selected" : ""}>Super Administrator</option>
            <option value="COMPANY_ADMIN" ${currentRole === "COMPANY_ADMIN" ? "selected" : ""}>Company Administrator</option>
            <option value="HR" ${currentRole === "HR" ? "selected" : ""}>HR Administrator</option>
            <option value="PAYROLL" ${currentRole === "PAYROLL" ? "selected" : ""}>Payroll Officer</option>
            <option value="MANAGER" ${currentRole === "MANAGER" ? "selected" : ""}>Line Manager</option>
            <option value="EMPLOYEE" ${currentRole === "EMPLOYEE" ? "selected" : ""}>Employee (Self Service)</option>
          </select>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="UsersView.saveRoleChange('${uid}', '${name}')">Update Role</button>
      `,
    });
  },

  async saveRoleChange(uid, name) {
    const newRole = document.getElementById("update-role-select")?.value;
    if (!newRole) return;

    try {
      await db.collection("users").doc(uid).update({
        roleId: newRole,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      await auditService.log("USER_ROLE_CHANGED", "USERS", "users", uid, {
        newRole,
      });
      Toast.success(`Updated role for ${name} to ${newRole}`);
      ModalManager.closeModal();
      Router.mountView("users");
    } catch (err) {
      Toast.error(`Role update failed: ${err.message}`);
    }
  },

  async toggleUserStatus(uid, name, currentStatus) {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await db.collection("users").doc(uid).update({
        status: nextStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      await auditService.log("USER_STATUS_CHANGED", "USERS", "users", uid, {
        status: nextStatus,
      });
      Toast.success(`Set ${name}'s status to ${nextStatus}`);
      Router.mountView("users");
    } catch (err) {
      Toast.error(`Status change failed: ${err.message}`);
    }
  },
};

window.UsersView = UsersView;
