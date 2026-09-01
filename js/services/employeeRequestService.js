/**
 * DIALLO HRMS — EMPLOYEE REQUESTS SERVICE (PHASE 11)
 * Handles Employee Helpdesk Tickets, Profile/Bank Updates, Certificate Requests, and HR Approvals
 */

const employeeRequestService = {
  REQUEST_TYPES: [
    { code: 'PROFILE_CHANGE', name: 'Profile Information Update', approverRole: 'HR' },
    { code: 'ADDRESS_CHANGE', name: 'Residential Address Update', approverRole: 'HR' },
    { code: 'BANK_DETAILS_CHANGE', name: 'Salary Bank Account Update', approverRole: 'HR' },
    { code: 'EMPLOYMENT_CERTIFICATE', name: 'Employment Verification Letter', approverRole: 'HR' },
    { code: 'SALARY_CERTIFICATE', name: 'Official Salary Certificate', approverRole: 'HR' },
    { code: 'EXPERIENCE_LETTER', name: 'Experience & Relieving Letter', approverRole: 'HR' },
    { code: 'GENERAL_HR_QUERY', name: 'General HR Support & Query', approverRole: 'HR' }
  ],

  // 1. GET REQUESTS (Filtered by Employee, Company, or Status)
  async getRequests(filters = {}) {
    try {
      let query = db.collection('employeeRequests');
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.employeeId) query = query.where('employeeId', '==', filters.employeeId);
      if (filters.status && filters.status !== 'All') query = query.where('status', '==', filters.status);
      if (filters.requestType && filters.requestType !== 'All') query = query.where('requestType', '==', filters.requestType);

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching employee requests:', e);
      return [];
    }
  },

  // 2. SUBMIT NEW EMPLOYEE REQUEST
  async createRequest(reqData) {
    try {
      const companyId = reqData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const employeeId = reqData.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || 'EMP001';
      const employeeName = reqData.employeeName || AuthGuard.userProfile?.displayName || 'Employee';

      const typeObj = this.REQUEST_TYPES.find(t => t.code === reqData.requestType) || this.REQUEST_TYPES[0];

      const payload = {
        companyId,
        employeeId,
        employeeName,
        employeeCode: reqData.employeeCode || 'EMP-001',
        department: reqData.department || 'Technology',
        requestType: typeObj.code,
        requestTypeName: typeObj.name,
        title: reqData.title || typeObj.name,
        description: reqData.description || '',
        currentValue: reqData.currentValue || '',
        requestedValue: reqData.requestedValue || '',
        status: 'SUBMITTED', // SUBMITTED, UNDER_REVIEW, ACTION_REQUIRED, APPROVED, REJECTED, COMPLETED
        assignedTo: 'HR Operations',
        attachmentUrl: reqData.attachmentUrl || null,
        comments: '',
        resolutionNotes: '',
        generatedDocumentUrl: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        resolvedAt: null
      };

      const docRef = await db.collection('employeeRequests').add(payload);
      payload.id = docRef.id;

      // Log initial history step
      await db.collection('requestHistory').add({
        requestId: docRef.id,
        companyId,
        employeeId,
        action: 'SUBMITTED',
        comments: 'Request submitted by employee',
        performedBy: employeeName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Register in central Approvals queue
      await approvalService.createApprovalRequest({
        type: `HR Request: ${typeObj.name}`,
        referenceId: docRef.id,
        employee: employeeName,
        companyId,
        detail: payload.title,
        status: 'PENDING',
        metadata: { requestId: docRef.id, type: typeObj.code }
      });

      await auditService.log('HR_REQUEST_SUBMITTED', 'REQUESTS', 'employeeRequests', docRef.id, payload);
      return payload;
    } catch (err) {
      console.error('Error submitting employee request:', err);
      throw err;
    }
  },

  // 3. APPROVE & COMPLETE REQUEST (HR / Admin)
  async approveRequest(requestId, resolutionNotes = '', generatedDocUrl = null) {
    try {
      const docSnap = await db.collection('employeeRequests').doc(requestId).get();
      if (!docSnap.exists) throw new Error('Request not found');

      const req = docSnap.data();
      const approverName = AuthGuard.userProfile?.displayName || 'HR Lead';

      // If this is a profile update, automatically sync to Employee record!
      if (req.requestType === 'PROFILE_CHANGE' || req.requestType === 'ADDRESS_CHANGE' || req.requestType === 'BANK_DETAILS_CHANGE') {
        if (req.fieldName && req.requestedValue) {
          await employeeService.updateEmployee(req.employeeId, {
            [req.fieldName]: req.requestedValue
          });
        }
      }

      const payload = {
        status: 'COMPLETED',
        resolvedBy: approverName,
        resolutionNotes: resolutionNotes || 'Request approved and processed.',
        generatedDocumentUrl: generatedDocUrl || null,
        resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('employeeRequests').doc(requestId).update(payload);

      await db.collection('requestHistory').add({
        requestId,
        companyId: req.companyId,
        employeeId: req.employeeId,
        action: 'APPROVED_AND_COMPLETED',
        comments: payload.resolutionNotes,
        performedBy: approverName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Notify Employee
      if (window.notificationService) {
        await notificationService.createNotification({
          companyId: req.companyId,
          employeeId: req.employeeId,
          type: 'HR_REQUEST_UPDATE',
          title: `Request Resolved: ${req.title}`,
          message: `Your ${req.requestTypeName} has been approved and completed by HR.`,
          relatedModule: 'requests',
          relatedId: requestId
        });
      }

      await auditService.log('HR_REQUEST_COMPLETED', 'REQUESTS', 'employeeRequests', requestId, payload);
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 4. REJECT REQUEST
  async rejectRequest(requestId, rejectionReason) {
    try {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error('Rejection reason is mandatory.');
      }

      const docSnap = await db.collection('employeeRequests').doc(requestId).get();
      if (!docSnap.exists) throw new Error('Request not found');
      const req = docSnap.data();

      const reviewerName = AuthGuard.userProfile?.displayName || 'HR Operations';
      const payload = {
        status: 'REJECTED',
        resolvedBy: reviewerName,
        rejectionReason: rejectionReason.trim(),
        resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('employeeRequests').doc(requestId).update(payload);

      await db.collection('requestHistory').add({
        requestId,
        companyId: req.companyId,
        employeeId: req.employeeId,
        action: 'REJECTED',
        comments: rejectionReason.trim(),
        performedBy: reviewerName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Notify Employee
      if (window.notificationService) {
        await notificationService.createNotification({
          companyId: req.companyId,
          employeeId: req.employeeId,
          type: 'HR_REQUEST_UPDATE',
          title: `Request Declined: ${req.title}`,
          message: `Your request was declined: ${rejectionReason}`,
          relatedModule: 'requests',
          relatedId: requestId
        });
      }

      await auditService.log('HR_REQUEST_REJECTED', 'REQUESTS', 'employeeRequests', requestId, payload);
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 5. GET REQUEST TIMELINE
  async getRequestTimeline(requestId) {
    try {
      const snap = await db.collection('requestHistory')
        .where('requestId', '==', requestId)
        .orderBy('createdAt', 'asc')
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      return [];
    }
  }
};

window.employeeRequestService = employeeRequestService;
