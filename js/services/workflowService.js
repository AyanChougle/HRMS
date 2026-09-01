/**
 * DIALLO HRMS — WORKFLOW & APPROVAL AUTOMATION ENGINE (PHASE 14)
 * Configurable multi-step approval pipelines, conditional routing, auto-escalation, delegations, and audit history
 */

const workflowService = {
  // Supported Workflow Modules
  SUPPORTED_MODULES: [
    { code: 'LEAVE', name: 'Leave & Time-Off Requests' },
    { code: 'EXPENSES', name: 'Expense & Reimbursement Claims' },
    { code: 'ATTENDANCE', name: 'Attendance Regularization' },
    { code: 'DOCUMENTS', name: 'Document Verification' },
    { code: 'PROFILE_CHANGE', name: 'Employee Profile & Bank Updates' },
    { code: 'HR_REQUESTS', name: 'HR Helpdesk & Certificates' },
    { code: 'PAYROLL', name: 'Monthly Payroll Run Sign-Off' },
    { code: 'ASSETS', name: 'Asset Requisitions & Returns' },
    { code: 'RECRUITMENT', name: 'Job Requisition & Offer Releases' },
    { code: 'PERFORMANCE', name: 'Appraisal Reviews Sign-Off' }
  ],

  // Approver Types
  APPROVER_TYPES: [
    { code: 'REPORTING_MANAGER', name: 'Direct Reporting Manager' },
    { code: 'SECOND_LEVEL_MANAGER', name: 'Second Level Manager (L2)' },
    { code: 'HR', name: 'HR Operations' },
    { code: 'HR_MANAGER', name: 'HR Department Head' },
    { code: 'FINANCE', name: 'Finance & Accounts' },
    { code: 'COMPANY_ADMIN', name: 'Company Administrator' },
    { code: 'SUPER_ADMIN', name: 'Super Admin' }
  ],

  // 1. GET WORKFLOW DEFINITIONS
  async getWorkflowDefinitions(filters = {}) {
    try {
      const companyId = filters.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      let query = db.collection('workflowDefinitions').where('companyId', '==', companyId);

      if (filters.status && filters.status !== 'ALL') {
        query = query.where('status', '==', filters.status);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (list.length === 0) {
        list = await this.seedDefaultWorkflows(companyId);
      }

      return list;
    } catch (e) {
      console.warn('Error fetching workflow definitions:', e);
      return [];
    }
  },

  // 2. CREATE WORKFLOW DEFINITION
  async createWorkflowDefinition(data) {
    try {
      const companyId = data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const createdBy = AuthGuard.userProfile?.displayName || 'Admin';

      const payload = {
        companyId,
        name: data.name || 'Approval Workflow',
        module: data.module || 'LEAVE',
        trigger: data.trigger || `${data.module}_SUBMITTED`,
        status: data.status || 'ACTIVE', // DRAFT, ACTIVE, INACTIVE, ARCHIVED
        version: Number(data.version) || 1,
        priority: Number(data.priority) || 1,
        steps: data.steps || [
          {
            stepId: 'step_1',
            name: 'Manager Approval',
            type: 'APPROVAL',
            approverType: 'REPORTING_MANAGER',
            required: true,
            order: 1,
            timeoutHours: 48,
            conditions: []
          }
        ],
        createdBy,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('workflowDefinitions').add(payload);
      payload.id = docRef.id;

      await auditService.log('WORKFLOW_CREATED', 'WORKFLOWS', 'workflowDefinitions', docRef.id, payload);
      return payload;
    } catch (err) {
      console.error('Error creating workflow definition:', err);
      throw err;
    }
  },

  // 3. START WORKFLOW INSTANCE FOR A RECORD
  async startWorkflow(moduleCode, recordId, requestData) {
    try {
      const companyId = requestData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const initiatedBy = requestData.employeeId || AuthGuard.currentUser?.uid || 'EMP001';
      const initiatedByName = requestData.employeeName || AuthGuard.userProfile?.displayName || 'Employee';

      // Find active workflow for this module
      const defs = await this.getWorkflowDefinitions({ companyId, status: 'ACTIVE' });
      const activeWorkflow = defs.find(d => d.module === moduleCode) || defs[0];

      if (!activeWorkflow || !activeWorkflow.steps || activeWorkflow.steps.length === 0) {
        console.warn(`No active workflow found for ${moduleCode}, resolving directly.`);
        return null;
      }

      const firstStep = activeWorkflow.steps[0];

      const instancePayload = {
        companyId,
        workflowId: activeWorkflow.id,
        workflowName: activeWorkflow.name,
        workflowVersion: activeWorkflow.version || 1,
        module: moduleCode,
        recordId,
        initiatedBy,
        initiatedByName,
        currentStepId: firstStep.stepId,
        currentStepOrder: firstStep.order || 1,
        currentStepName: firstStep.name,
        status: 'IN_PROGRESS', // IN_PROGRESS, APPROVED, REJECTED, CHANGES_REQUESTED, COMPLETED
        revisionNumber: 1,
        requestDataSummary: requestData.title || requestData.description || `${moduleCode} Request`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const instRef = await db.collection('workflowInstances').add(instancePayload);
      instancePayload.id = instRef.id;

      // Create initial approval task for step 1
      await this.createApprovalTask(instRef.id, firstStep, moduleCode, recordId, requestData);

      // Log initial history step
      await db.collection('workflowHistory').add({
        workflowInstanceId: instRef.id,
        stepId: firstStep.stepId,
        stepName: firstStep.name,
        action: 'WORKFLOW_STARTED',
        fromStatus: 'PENDING',
        toStatus: 'IN_PROGRESS',
        actorId: initiatedBy,
        actorName: initiatedByName,
        actorRole: 'EMPLOYEE',
        comment: 'Request submitted into automated workflow',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return instancePayload;
    } catch (e) {
      console.error('Error starting workflow:', e);
      return null;
    }
  },

  // 4. CREATE APPROVAL TASK FOR A STEP
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
        title: reqData.title || `${moduleCode} Approval Required`,
        status: 'PENDING', // PENDING, APPROVED, REJECTED, CHANGES_REQUESTED, DELEGATED
        dueAt,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const taskRef = await db.collection('approvalTasks').add(taskPayload);
      taskPayload.id = taskRef.id;

      // Sync into approvalRequests for Action Center backwards compatibility
      await approvalService.createApprovalRequest({
        type: `${moduleCode}: ${step.name}`,
        referenceId: recordId,
        employee: reqData.employeeName || 'Staff',
        companyId,
        detail: reqData.title || `${step.name} for ${moduleCode}`,
        status: 'PENDING',
        metadata: { workflowTaskId: taskRef.id, workflowInstanceId: instanceId }
      });

      // Broadcast Notification to Approver Role
      if (window.notificationService) {
        await notificationService.createNotification({
          companyId,
          employeeId: reqData.employeeId,
          type: 'APPROVAL_ASSIGNED',
          title: `Action Required: ${step.name}`,
          message: `${reqData.employeeName || 'An employee'} submitted a ${moduleCode} request requiring your review.`,
          relatedModule: 'requests',
          relatedId: taskRef.id
        });
      }

      return taskPayload;
    } catch (e) {
      console.warn('Error creating approval task:', e);
      return null;
    }
  },

  // 5. EVALUATE NEXT STEP IN WORKFLOW
  async advanceWorkflow(instanceId, currentStepId, comments = '') {
    try {
      const instDoc = await db.collection('workflowInstances').doc(instanceId).get();
      if (!instDoc.exists) return;
      const instance = instDoc.data();

      const defDoc = await db.collection('workflowDefinitions').doc(instance.workflowId).get();
      const workflowDef = defDoc.exists ? defDoc.data() : null;

      if (!workflowDef || !workflowDef.steps) {
        await this.completeWorkflow(instanceId, instance);
        return;
      }

      const currentIndex = workflowDef.steps.findIndex(s => s.stepId === currentStepId);
      const nextStep = workflowDef.steps[currentIndex + 1];

      if (nextStep) {
        // Move to next step
        await db.collection('workflowInstances').doc(instanceId).update({
          currentStepId: nextStep.stepId,
          currentStepOrder: nextStep.order || (currentIndex + 2),
          currentStepName: nextStep.name,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await this.createApprovalTask(instanceId, nextStep, instance.module, instance.recordId, {
          companyId: instance.companyId,
          employeeId: instance.initiatedBy,
          employeeName: instance.initiatedByName,
          title: instance.requestDataSummary
        });
      } else {
        // All steps completed!
        await this.completeWorkflow(instanceId, instance);
      }
    } catch (e) {
      console.error('Error advancing workflow:', e);
    }
  },

  // 6. COMPLETE WORKFLOW & PROPAGATE TO CORE MODULE
  async completeWorkflow(instanceId, instance) {
    try {
      await db.collection('workflowInstances').doc(instanceId).update({
        status: 'COMPLETED',
        resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Propagate approved status to original collection
      if (instance.module === 'LEAVE' && window.leaveService) {
        await leaveService.updateLeaveStatus(instance.recordId, 'APPROVED');
      } else if (instance.module === 'EXPENSES' && window.expenseService) {
        await expenseService.reviewClaim(instance.recordId, 'APPROVED');
      } else if (instance.module === 'ATTENDANCE' && window.attendanceService) {
        await attendanceService.approveRegularization(instance.recordId);
      }

      // Notify employee
      if (window.notificationService) {
        await notificationService.createNotification({
          companyId: instance.companyId,
          employeeId: instance.initiatedBy,
          type: 'WORKFLOW_COMPLETED',
          title: `Request Approved & Completed`,
          message: `Your ${instance.module} request has completed all required approval steps.`,
          relatedModule: instance.module.toLowerCase(),
          relatedId: instance.recordId
        });
      }

      await auditService.log('WORKFLOW_COMPLETED', 'WORKFLOWS', 'workflowInstances', instanceId, { module: instance.module });
    } catch (e) {
      console.warn('Error completing workflow:', e);
    }
  },

  // 7. GET RUNNING WORKFLOW INSTANCES
  async getWorkflowInstances(filters = {}) {
    try {
      const companyId = filters.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      let query = db.collection('workflowInstances').where('companyId', '==', companyId);

      if (filters.status && filters.status !== 'ALL') {
        query = query.where('status', '==', filters.status);
      }

      const snap = await query.orderBy('createdAt', 'desc').limit(filters.limit || 50).get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      return [];
    }
  },

  // 8. SEED OUT-OF-THE-BOX STANDARD WORKFLOWS
  async seedDefaultWorkflows(companyId) {
    const defaultWorkflows = [
      {
        name: 'Standard Leave Approval Pipeline',
        module: 'LEAVE',
        status: 'ACTIVE',
        version: 1,
        priority: 1,
        steps: [
          { stepId: 'step_mgr', name: 'Reporting Manager Review', approverType: 'REPORTING_MANAGER', required: true, order: 1, timeoutHours: 24 },
          { stepId: 'step_hr', name: 'HR Operations Sign-Off', approverType: 'HR', required: true, order: 2, timeoutHours: 48 }
        ]
      },
      {
        name: 'Executive Expense Reimbursement Pipeline',
        module: 'EXPENSES',
        status: 'ACTIVE',
        version: 1,
        priority: 1,
        steps: [
          { stepId: 'step_mgr', name: 'Manager Cost Audit', approverType: 'REPORTING_MANAGER', required: true, order: 1, timeoutHours: 48 },
          { stepId: 'step_fin', name: 'Finance Settlement & Payout', approverType: 'FINANCE', required: true, order: 2, timeoutHours: 72 }
        ]
      },
      {
        name: 'Attendance Regularization Pipeline',
        module: 'ATTENDANCE',
        status: 'ACTIVE',
        version: 1,
        priority: 1,
        steps: [
          { stepId: 'step_mgr', name: 'Line Manager Verification', approverType: 'REPORTING_MANAGER', required: true, order: 1, timeoutHours: 24 }
        ]
      },
      {
        name: 'Employee Profile & Bank Update Pipeline',
        module: 'PROFILE_CHANGE',
        status: 'ACTIVE',
        version: 1,
        priority: 1,
        steps: [
          { stepId: 'step_hr', name: 'HR Compliance Verification', approverType: 'HR', required: true, order: 1, timeoutHours: 48 }
        ]
      }
    ];

    const results = [];
    for (const w of defaultWorkflows) {
      w.companyId = companyId;
      w.createdBy = 'System Initialization';
      w.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      w.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      const ref = await db.collection('workflowDefinitions').add(w);
      results.push({ id: ref.id, ...w });
    }
    return results;
  }
};

window.workflowService = workflowService;
