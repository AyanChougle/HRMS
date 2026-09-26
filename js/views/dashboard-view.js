/**
 * DIALLO HRMS — SMART DASHBOARD DISPATCHER (PHASE 3)
 * Dynamically routes to AdminDashboardView, ManagerDashboardView, or EmployeeDashboardView based on authenticated role
 */

const DashboardView = {
  getRoleView() {
    const roleId = (
      AuthGuard._previewRoleId ||
      AuthGuard.userProfile?.roleId ||
      "EMPLOYEE"
    )
      .toString()
      .toUpperCase()
      .trim();

    if (
      roleId === "SUPER_ADMIN" ||
      roleId === "COMPANY_ADMIN" ||
      roleId === "ADMIN" ||
      roleId === "HR" ||
      roleId === "HR_MANAGER" ||
      roleId === "PAYROLL"
    ) {
      return window.AdminDashboardView;
    } else if (roleId === "MENTOR_TRAINER" || roleId === "TRAINER" || roleId === "MENTOR") {
      return window.TrainerDashboardView || window.ManagerDashboardView;
    } else if (roleId === "MANAGER" || roleId === "OPERATIONS_MANAGER" || roleId === "TEAM_LEAD") {
      return window.ManagerDashboardView;
    } else {
      return window.EmployeeDashboardView;
    }
  },

  async render() {
    const view = this.getRoleView();
    if (view && typeof view.render === "function") {
      return await view.render();
    }
    return window.AdminDashboardView.render();
  },

  async postRender() {
    const view = this.getRoleView();
    if (view && typeof view.postRender === "function") {
      await view.postRender();
    }
  },
};

window.DashboardView = DashboardView;
