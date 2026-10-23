
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
    } else if (
      roleId === "MANAGER" ||
      roleId === "OPERATIONS_MANAGER" ||
      roleId === "OPS" ||
      roleId === "PROCESS_OWNER" ||
      roleId === "COMPLIANCE" ||
      roleId === "TEAM_LEAD" ||
      roleId.includes("MANAGER") ||
      roleId.includes("LEAD") ||
      roleId.includes("OWNER")
    ) {
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
