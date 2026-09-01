/**
 * DIALLO HRMS — SMART DASHBOARD DISPATCHER (PHASE 3)
 * Dynamically routes to AdminDashboardView, ManagerDashboardView, or EmployeeDashboardView based on authenticated role
 */

const DashboardView = {
  getRoleView() {
    const roleId = AuthGuard.userProfile?.roleId || 'EMPLOYEE';

    if (roleId === 'SUPER_ADMIN' || roleId === 'COMPANY_ADMIN' || roleId === 'HR' || roleId === 'PAYROLL') {
      return window.AdminDashboardView;
    } else if (roleId === 'MANAGER') {
      return window.ManagerDashboardView;
    } else {
      return window.EmployeeDashboardView;
    }
  },

  async render() {
    const view = this.getRoleView();
    if (view && typeof view.render === 'function') {
      return await view.render();
    }
    return window.AdminDashboardView.render();
  },

  async postRender() {
    const view = this.getRoleView();
    if (view && typeof view.postRender === 'function') {
      await view.postRender();
    }
  }
};

window.DashboardView = DashboardView;
