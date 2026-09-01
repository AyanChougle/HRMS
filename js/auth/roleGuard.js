/**
 * DIALLO HRMS — ROLE GUARD & ACCESS CONTROLLER (PHASE 3)
 * Protects view routing, enforces RBAC, and handles 403 access-denied fallbacks
 */

const RoleGuard = {
  // Validate if active session has required roles
  requireRole(allowedRoles) {
    const userRole = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    
    if (userRole === 'SUPER_ADMIN') return true;

    const rolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const isPermitted = rolesList.includes(userRole);

    if (!isPermitted) {
      console.warn(`[RoleGuard] Access denied for role '${userRole}'. Required:`, rolesList);
      this.handleAccessDenied();
      return false;
    }
    return true;
  },

  // Validate if active session has required permission
  requirePermission(permissionName) {
    const hasAccess = AuthGuard.hasPermission(permissionName);
    if (!hasAccess) {
      console.warn(`[RoleGuard] Access denied for permission '${permissionName}'`);
      this.handleAccessDenied();
      return false;
    }
    return true;
  },

  // Fallback view when user lacks permission
  handleAccessDenied() {
    const mainContent = document.getElementById('main-content-viewport');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <div class="empty-state animate-fade-in" style="padding: 60px 20px; max-width: 520px; margin: 40px auto; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
        <div class="empty-state-icon" style="width: 56px; height: 56px; margin-bottom: 16px; background: rgba(220, 38, 38, 0.1); color: var(--danger);">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Access Denied (403)</h2>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 24px; line-height: 1.5;">
          You do not have the required role or permissions to access this page. If you believe this is an error, please contact your Organization Administrator.
        </p>
        <div class="flex justify-center gap-3">
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('dashboard')">Return to My Dashboard</button>
        </div>
      </div>
    `;
  }
};

window.RoleGuard = RoleGuard;
