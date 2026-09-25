/**
 * DIALLO HRMS — SUPER ADMIN ROLE & PAGE VISIBILITY MANAGER VIEW
 * Allows Super Admin to configure exactly which navigation pages are visible and accessible per role.
 */

const RolePermissionsView = {
  selectedRole: 'HR',

  async render() {
    // Only Super Admin can access this page
    const userRole = (AuthGuard.userProfile?.roleId || '').toUpperCase().trim();
    if (userRole !== 'SUPER_ADMIN') {
      return `
        <div class="card p-6 text-center" style="max-width: 600px; margin: 40px auto;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--danger-light); color: var(--danger); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Super Admin Access Restricted</h2>
          <p style="color: var(--text-secondary); margin-bottom: 20px;">Role and visible pages governance is reserved strictly for Super Administrators.</p>
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('dashboard')">Return to Dashboard</button>
        </div>
      `;
    }

    const rolesList = [
      { id: 'SUPER_ADMIN', name: 'Super Administrator', desc: 'Root administrator with full access to all settings and modules' },
      { id: 'COMPANY_ADMIN', name: 'Company Administrator', desc: 'Enterprise management for legal entity' },
      { id: 'HR', name: 'HR Manager', desc: 'Employee onboarding, attendance, leave approval, and compliance' },
      { id: 'TRAINER', name: 'Corporate Trainer (Mentor)', desc: '7-day module tracking, assessments, and floor handover' },
      { id: 'TRAINEE', name: 'Graduate Trainee / Intern', desc: '7-day modules, mentor contact, company policy, and daily punches' },
      { id: 'EMPLOYEE', name: 'Employee (ESS)', desc: 'General staff self-service workspace' }
    ];

    const allPages = roleAccessService.PAGES;
    const currentAllowed = roleAccessService.getVisiblePagesForRole(this.selectedRole);

    // Group pages by category
    const categories = {};
    allPages.forEach(p => {
      if (!categories[p.category]) categories[p.category] = [];
      categories[p.category].push(p);
    });

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <a href="#settings">Settings</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Role & Page Visibility Manager</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Role & Visible Pages Governance</h1>
            <p class="page-subtitle">Configure exactly which navigation pages and modules each login role can see and access</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="RolePermissionsView.resetToDefaults()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset to Policy Defaults</span>
            </button>
            <button class="btn btn-primary btn-sm" onclick="RolePermissionsView.savePermissions()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Visibility Settings</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Role Selector Tabs -->
      <div class="card animate-fade-in" style="margin-bottom: 24px; padding: 18px 20px;">
        <div style="font-size: 0.78rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; letter-spacing: 0.05em;">
          Select Role to Configure
        </div>
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
          ${rolesList.map(r => `
            <button 
              type="button" 
              class="btn ${this.selectedRole === r.id ? 'btn-primary' : 'btn-secondary'}" 
              style="padding: 10px 14px; flex-direction: column; align-items: flex-start; text-align: left; height: auto; border-radius: var(--radius-md);" 
              onclick="RolePermissionsView.selectRole('${r.id}')"
            >
              <span style="font-size: 0.95rem; font-weight: 700;">${r.name}</span>
              <span style="font-size: 0.72rem; opacity: 0.85; margin-top: 2px;">Role ID: ${r.id}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Active Role Overview & Quick Toggles -->
      <div class="card animate-fade-in" style="margin-bottom: 24px;">
        <div class="card-header">
          <div>
            <div class="card-title">Configuring: ${rolesList.find(r => r.id === this.selectedRole)?.name || this.selectedRole}</div>
            <div class="card-subtitle">${rolesList.find(r => r.id === this.selectedRole)?.desc || ''}</div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-ghost btn-sm" onclick="RolePermissionsView.toggleAll(true)">Select All</button>
            <button class="btn btn-ghost btn-sm" onclick="RolePermissionsView.toggleAll(false)">Deselect All</button>
          </div>
        </div>

        <div class="card-body">
          <form id="role-permissions-form" onsubmit="event.preventDefault(); RolePermissionsView.savePermissions();">
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
              ${Object.entries(categories).map(([catName, pages]) => `
                <div style="background: var(--bg-hover); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-main);">
                  <div style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--primary); margin-bottom: 12px; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-light); padding-bottom: 6px;">
                    ${catName}
                  </div>
                  <div class="flex flex-col gap-2">
                    ${pages.map(p => {
                      const isTraineePerf = this.selectedRole === 'TRAINEE' && p.key === 'performance';
                      const isChecked = !isTraineePerf && currentAllowed.includes(p.key);
                      return `
                        <label style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 6px; ${isTraineePerf ? 'opacity: 0.5; cursor: not-allowed;' : 'cursor: pointer;'} transition: all 0.15s ease;">
                          <div class="flex items-center gap-3">
                            <span style="color: var(--primary); display: flex;">
                              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${p.icon}" />
                              </svg>
                            </span>
                            <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);">
                              ${p.label} ${isTraineePerf ? '<small style="color: var(--text-muted); font-weight: 400; margin-left: 4px;">(Not for Trainees)</small>' : ''}
                            </span>
                          </div>
                          <input type="checkbox" name="page-permission" value="${p.key}" ${isChecked ? 'checked' : ''} ${isTraineePerf ? 'disabled' : ''} style="width: 18px; height: 18px; cursor: ${isTraineePerf ? 'not-allowed' : 'pointer'}; accent-color: var(--primary);" />
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="flex justify-end gap-3" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-main);">
              <button type="button" class="btn btn-secondary btn-lg" onclick="RolePermissionsView.resetToDefaults()">Reset to Policy Defaults</button>
              <button type="button" class="btn btn-primary btn-lg" onclick="RolePermissionsView.savePermissions()">Save Permissions for ${this.selectedRole}</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  selectRole(roleId) {
    this.selectedRole = roleId;
    Router.navigate('role-permissions');
  },

  toggleAll(checked) {
    const checkboxes = document.querySelectorAll('input[name="page-permission"]');
    checkboxes.forEach(cb => { cb.checked = checked; });
  },

  async savePermissions() {
    try {
      const checkboxes = document.querySelectorAll('input[name="page-permission"]:checked');
      const selectedPages = Array.from(checkboxes).map(cb => cb.value);

      // Always ensure dashboard is included
      if (!selectedPages.includes('dashboard')) {
        selectedPages.unshift('dashboard');
      }

      // Trainees cannot have performance & appraisals
      const finalPages = this.selectedRole === 'TRAINEE'
        ? selectedPages.filter(p => p !== 'performance')
        : selectedPages;

      await roleAccessService.saveRolePermissions(this.selectedRole, finalPages);
      Toast.success(`Visible pages updated successfully for role: ${this.selectedRole}`);
    } catch (e) {
      Toast.error('Failed to save role permissions: ' + e.message);
    }
  },

  async resetToDefaults() {
    if (!confirm(`Reset visible pages for ${this.selectedRole} to the official Diallo HR policy default?`)) {
      return;
    }
    try {
      await roleAccessService.resetRoleToDefault(this.selectedRole);
      Toast.success(`Permissions for ${this.selectedRole} reset to company policy defaults.`);
      Router.navigate('role-permissions');
    } catch (e) {
      Toast.error('Could not reset permissions: ' + e.message);
    }
  }
};

window.RolePermissionsView = RolePermissionsView;
