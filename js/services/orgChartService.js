/**
 * DIALLO HRMS — ORG CHART & HIERARCHY ENGINE (PHASE 15)
 * Dynamic hierarchical organization trees, manager teams, and circular hierarchy validation.
 */

const orgChartService = {
  // Build dynamic organization tree from employees list
  getOrganizationTree(employees, filterDeptId = null, filterBranchId = null) {
    let list = [...employees];
    if (filterDeptId && filterDeptId !== 'ALL') {
      list = list.filter(e => e.departmentId === filterDeptId || e.department === filterDeptId);
    }
    if (filterBranchId && filterBranchId !== 'ALL') {
      list = list.filter(e => e.branchId === filterBranchId || e.branch === filterBranchId);
    }

    if (window.orgService && typeof window.orgService.buildOrgTree === 'function') {
      return window.orgService.buildOrgTree(list);
    }

    return list;
  },

  _isDescendant(potentialAncestorId, currentNode, nodeMap) {
    if (!currentNode) return false;
    if (currentNode.id === potentialAncestorId) return true;
    if (!currentNode.managerId || !nodeMap.has(currentNode.managerId)) return false;
    return this._isDescendant(potentialAncestorId, nodeMap.get(currentNode.managerId), nodeMap);
  },

  // Get specific manager's direct team
  getManagerTeam(managerId, employees) {
    return employees.filter(e => (e.managerId === managerId || e.reportingManagerId === managerId) && e.id !== managerId);
  }
};

window.orgChartService = orgChartService;
