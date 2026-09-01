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

    const nodeMap = new Map();
    const roots = [];

    // Initialize nodes
    list.forEach(emp => {
      nodeMap.set(emp.id, {
        id: emp.id,
        name: emp.fullName || emp.name || 'Unnamed',
        designation: emp.designation || 'Staff',
        department: emp.department || 'General',
        branch: emp.branch || emp.branchName || 'HQ',
        email: emp.email || emp.workEmail || '',
        avatar: emp.avatar || '',
        managerId: emp.managerId || emp.reportingManagerId || '',
        children: []
      });
    });

    // Build parent-child relationships with loop protection
    const visited = new Set();

    nodeMap.forEach(node => {
      if (node.managerId && nodeMap.has(node.managerId) && node.managerId !== node.id) {
        const managerNode = nodeMap.get(node.managerId);
        // Prevent cycle
        if (!this._isDescendant(node.id, managerNode, nodeMap)) {
          managerNode.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
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
