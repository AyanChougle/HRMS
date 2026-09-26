const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/services/workflowService.js';
let c = fs.readFileSync(path, 'utf8');

const oldCreateTask = `  // 4. CREATE APPROVAL TASK FOR A STEP
  async createApprovalTask(instanceId, step, moduleCode, recordId, reqData) {
    try {
      const companyId = reqData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const timeoutHrs = step.timeoutHours || 48;
      const dueAt = new Date(Date.now() + timeoutHrs * 3600000).toISOString();

      const taskPayload = {
        companyId,
        workflowInstanceId: instanceId,
        module: moduleCode,
        recordId,
        stepId: step.stepId,
        stepName: step.name,
        approverType: step.approverType,
        assignedRole: step.approverType,
        employeeId: reqData.employeeId || 'EMP001',
        employeeName: reqData.employeeName || 'Staff',
        title: reqData.title || \`\${moduleCode} Approval Required\`,
        status: 'PENDING', // PENDING, APPROVED, REJECTED, CHANGES_REQUESTED, DELEGATED
        dueAt,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };`;

const newCreateTask = `  // 4. CREATE APPROVAL TASK FOR A STEP
  async createApprovalTask(instanceId, step, moduleCode, recordId, reqData) {
    try {
      const companyId = reqData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const timeoutHrs = step.timeoutHours || 48;
      const dueAt = new Date(Date.now() + timeoutHrs * 3600000).toISOString();

      let assignedTo = '';
      let assignedRole = step.approverType; // DIRECT_MANAGER, SECOND_LEVEL_MANAGER, HR, HR_MANAGER, etc.

      // Dynamic Hierarchy Resolution
      if (reqData.employeeId && (assignedRole === 'DIRECT_MANAGER' || assignedRole === 'SECOND_LEVEL_MANAGER')) {
        try {
          const empDoc = await db.collection('employees').doc(reqData.employeeId).get();
          if (empDoc.exists) {
            const emp = empDoc.data();
            
            if (assignedRole === 'DIRECT_MANAGER') {
              // Try Team Leader first, then Ops Manager, then Manager
              assignedTo = emp.teamLeaderId || emp.operationsManagerId || emp.managerId || '';
            } else if (assignedRole === 'SECOND_LEVEL_MANAGER') {
              assignedTo = emp.operationsManagerId || emp.managerId || '';
            }
          }
        } catch (e) {
          console.warn('Hierarchy lookup failed', e);
        }
      }

      const taskPayload = {
        companyId,
        workflowInstanceId: instanceId,
        module: moduleCode,
        recordId,
        stepId: step.stepId,
        stepName: step.name,
        approverType: step.approverType,
        assignedRole: assignedRole,
        assignedTo: assignedTo, // Dynamic target ID
        employeeId: reqData.employeeId || 'EMP001',
        employeeName: reqData.employeeName || 'Staff',
        title: reqData.title || \`\${moduleCode} Approval Required\`,
        status: 'PENDING', // PENDING, APPROVED, REJECTED, CHANGES_REQUESTED, DELEGATED
        dueAt,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };`;

c = c.replace(oldCreateTask, newCreateTask);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCHED workflowService.js createApprovalTask');
