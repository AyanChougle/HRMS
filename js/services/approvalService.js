/**
 * DIALLO HRMS — APPROVALS & WORKFLOW EXECUTION SERVICE (PHASE 14)
 * Unified Approval Inbox, Decision Action Handlers, Resubmissions, Delegations, and Audit Logging
 */

const approvalService = {
  // 1. GET PENDING APPROVALS FOR LOGGED IN ACTOR / ROLE
  async getMyApprovals(filters = {}) {
    try {
      const companyId = filters.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const roleId = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
      const uid = AuthGuard.currentUser?.uid;

      let query = db.collection('approvalTasks').where('companyId', '==', companyId);

      if (filters.status && filters.status !== 'ALL') {
        query = query.where('status', '==', filters.status);
      } else {
        query = query.where('status', '==', 'PENDING');
      }

      const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (filters.module && filters.module !== 'ALL') {
        list = list.filter(t => t.module === filters.module);
      }

      return list;
    } catch (err) {
      console.warn('Error fetching my approvals:', err);
      return [];
    }
  },

  // 2. APPROVE TASK
  async approveTask(taskId, comments = '') {
    try {
      const actorId = AuthGuard.currentUser?.uid || 'USER';
      const actorName = AuthGuard.userProfile?.displayName || 'Approver';
      const actorRole = AuthGuard.userProfile?.roleId || 'MANAGER';

      const taskDoc = await db.collection('approvalTasks').doc(taskId).get();
      if (!taskDoc.exists) throw new Error('Approval task not found');
      const task = taskDoc.data();

      // Update task status
      await db.collection('approvalTasks').doc(taskId).update({
        status: 'APPROVED',
        resolvedBy: actorName,
        resolvedById: actorId,
        comments,
        resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Log history
      await db.collection('workflowHistory').add({
        workflowInstanceId: task.workflowInstanceId,
        stepId: task.stepId,
        stepName: task.stepName,
        action: 'APPROVED',
        fromStatus: 'PENDING',
        toStatus: 'APPROVED',
        actorId,
        actorName,
        actorRole,
        comment: comments || 'Approved without additional notes',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Advance to next step in workflow engine
      await workflowService.advanceWorkflow(task.workflowInstanceId, task.stepId, comments);

      await auditService.log('APPROVAL_APPROVED', 'WORKFLOWS', 'approvalTasks', taskId, { comments });
      return true;
    } catch (err) {
      console.error('Error approving task:', err);
      throw err;
    }
  },

  // 3. REJECT TASK (MANDATORY REASON)
  async rejectTask(taskId, mandatoryReason) {
    try {
      if (!mandatoryReason || mandatoryReason.trim().length < 5) {
        throw new Error('Please provide a specific reason for rejection (minimum 5 characters).');
      }

      const actorId = AuthGuard.currentUser?.uid || 'USER';
      const actorName = AuthGuard.userProfile?.displayName || 'Approver';
      const actorRole = AuthGuard.userProfile?.roleId || 'MANAGER';

      const taskDoc = await db.collection('approvalTasks').doc(taskId).get();
      if (!taskDoc.exists) throw new Error('Task not found');
      const task = taskDoc.data();

      await db.collection('approvalTasks').doc(taskId).update({
        status: 'REJECTED',
        rejectionReason: mandatoryReason,
        resolvedBy: actorName,
        resolvedById: actorId,
        resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Mark workflow instance as REJECTED
      await db.collection('workflowInstances').doc(task.workflowInstanceId).update({
        status: 'REJECTED',
        rejectionReason: mandatoryReason,
        resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Propagate rejection to original business module
      if (task.module === 'LEAVE' && window.leaveService) {
        await leaveService.updateLeaveStatus(task.recordId, 'REJECTED', mandatoryReason);
      } else if (task.module === 'EXPENSES' && window.expenseService) {
        await expenseService.reviewClaim(task.recordId, 'REJECTED', mandatoryReason);
      }

      // Log history
      await db.collection('workflowHistory').add({
        workflowInstanceId: task.workflowInstanceId,
        stepId: task.stepId,
        stepName: task.stepName,
        action: 'REJECTED',
        fromStatus: 'PENDING',
        toStatus: 'REJECTED',
        actorId,
        actorName,
        actorRole,
        comment: mandatoryReason,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Dispatch Notification
      if (window.notificationService) {
        await notificationService.createNotification({
          companyId: task.companyId,
          employeeId: task.employeeId,
          type: 'REQUEST_REJECTED',
          title: `${task.module} Request Rejected`,
          message: `Your request was rejected by ${actorName}. Reason: ${mandatoryReason}`,
          priority: 'HIGH',
          relatedModule: task.module.toLowerCase(),
          relatedId: task.recordId
        });
      }

      await auditService.log('APPROVAL_REJECTED', 'WORKFLOWS', 'approvalTasks', taskId, { mandatoryReason });
      return true;
    } catch (err) {
      console.error('Error rejecting task:', err);
      throw err;
    }
  },

  // 4. REQUEST CHANGES FROM EMPLOYEE
  async requestChanges(taskId, changeNotes) {
    try {
      const actorId = AuthGuard.currentUser?.uid || 'USER';
      const actorName = AuthGuard.userProfile?.displayName || 'Approver';
      const actorRole = AuthGuard.userProfile?.roleId || 'MANAGER';

      const taskDoc = await db.collection('approvalTasks').doc(taskId).get();
      if (!taskDoc.exists) throw new Error('Task not found');
      const task = taskDoc.data();

      await db.collection('approvalTasks').doc(taskId).update({
        status: 'CHANGES_REQUESTED',
        feedbackNotes: changeNotes,
        resolvedBy: actorName,
        resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await db.collection('workflowInstances').doc(task.workflowInstanceId).update({
        status: 'CHANGES_REQUESTED',
        feedbackNotes: changeNotes,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await db.collection('workflowHistory').add({
        workflowInstanceId: task.workflowInstanceId,
        stepId: task.stepId,
        stepName: task.stepName,
        action: 'CHANGES_REQUESTED',
        fromStatus: 'PENDING',
        toStatus: 'CHANGES_REQUESTED',
        actorId,
        actorName,
        actorRole,
        comment: changeNotes,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (window.notificationService) {
        await notificationService.createNotification({
          companyId: task.companyId,
          employeeId: task.employeeId,
          type: 'CHANGES_REQUESTED',
          title: `Action Required: Revisions Requested`,
          message: `${actorName} requested changes on your ${task.module} request: "${changeNotes}"`,
          priority: 'HIGH',
          relatedModule: task.module.toLowerCase(),
          relatedId: task.recordId
        });
      }

      return true;
    } catch (err) {
      console.error('Error requesting changes:', err);
      throw err;
    }
  },

  // 5. DELEGATE TASK TO ANOTHER USER
  async delegateTask(taskId, delegateUserId, delegateName, reason) {
    try {
      const actorId = AuthGuard.currentUser?.uid || 'USER';
      const actorName = AuthGuard.userProfile?.displayName || 'Approver';

      await db.collection('approvalTasks').doc(taskId).update({
        assignedTo: delegateUserId,
        assignedName: delegateName,
        isDelegated: true,
        delegatedBy: actorName,
        delegationReason: reason,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('APPROVAL_DELEGATED', 'WORKFLOWS', 'approvalTasks', taskId, { delegateUserId, delegateName, reason });
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 6. GET INSTANCE AUDIT TIMELINE
  async getWorkflowHistory(instanceId) {
    try {
      const snap = await db.collection('workflowHistory')
        .where('workflowInstanceId', '==', instanceId)
        .orderBy('createdAt', 'asc')
        .get();

      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      return [];
    }
  },

  // Backwards compatibility helper for Action Center
  async getPendingApprovals(companyId = null) {
    return this.getMyApprovals({ companyId, status: 'PENDING' });
  },

  async createApprovalRequest(data) {
    return data;
  }
};

window.approvalService = approvalService;
