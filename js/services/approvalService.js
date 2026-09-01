/**
 * DIALLO HRMS — APPROVALS SERVICE
 * Unified queue for Leave, Regularization, Reimbursement, and Loan approvals in Firestore
 */

const approvalService = {
  // Get all pending approvals for the dashboard Action Center
  async getPendingApprovals(companyId = null) {
    try {
      let query = db.collection('approvalRequests').where('status', '==', 'PENDING');
      if (companyId) {
        query = query.where('companyId', '==', companyId);
      }
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
      return [];
    }
  },

  // Create approval request
  async createApprovalRequest(requestData) {
    try {
      const payload = {
        type: requestData.type || 'LEAVE',
        referenceId: requestData.referenceId || requestData.refId || (requestData.metadata ? (requestData.metadata.regularizationId || requestData.metadata.leaveId || '') : '') || '',
        employee: requestData.employee || requestData.employeeName || 'Employee',
        companyId: requestData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        detail: requestData.detail || requestData.details || '',
        status: requestData.status || 'PENDING',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (requestData.metadata) {
        payload.metadata = requestData.metadata;
      }

      const docRef = await db.collection('approvalRequests').add(payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating approval request:', err);
      throw err;
    }
  },

  // Resolve an approval request directly
  async resolveApproval(requestId, newStatus, comment = '') {
    try {
      const payload = {
        status: newStatus,
        comment,
        resolvedBy: AuthGuard.currentUser?.uid || 'SYSTEM',
        resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('approvalRequests').doc(requestId).update(payload);
      await auditService.log(`APPROVAL_${newStatus}`, 'APPROVALS', 'approvalRequests', requestId, payload);
      return true;
    } catch (err) {
      console.error('Error resolving approval:', err);
      throw err;
    }
  },

  // Resolve by reference ID (e.g. when leave is approved from Leave module)
  async resolveByReferenceId(referenceId, newStatus) {
    try {
      const snapshot = await db.collection('approvalRequests')
        .where('referenceId', '==', referenceId)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: newStatus,
          resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
    } catch (err) {
      console.warn('Error resolving approval by ref id:', err);
    }
  }
};

window.approvalService = approvalService;
