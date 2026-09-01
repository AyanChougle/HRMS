/**
 * DIALLO HRMS — DOCUMENT MANAGEMENT SERVICE (PHASE 11)
 * Manages Employee Dossiers, Document Verification, Versioning, Expiry Tracking, and Request Workflows
 */

const documentService = {
  // Document Categories
  DOCUMENT_CATEGORIES: [
    { code: 'IDENTITY', name: 'Identity & Address Proof', icon: '🪪' },
    { code: 'EMPLOYMENT', name: 'Employment Contracts & Offers', icon: '📝' },
    { code: 'PAYROLL', name: 'Statutory & Tax Documents', icon: '💰' },
    { code: 'EDUCATION', name: 'Education & Degree Certificates', icon: '🎓' },
    { code: 'EXPERIENCE', name: 'Previous Experience & Relieving Letters', icon: '🏢' },
    { code: 'COMPLIANCE', name: 'Certifications & Compliance', icon: '🛡️' },
    { code: 'COMPANY', name: 'Company Policies & Handbook', icon: '📘' },
    { code: 'OTHER', name: 'Miscellaneous Files', icon: '📁' }
  ],

  // 1. GET DOCUMENTS (Scoped by Employee or Company)
  async getDocuments(filters = {}) {
    try {
      let query = db.collection('employeeDocuments');
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.employeeId) query = query.where('employeeId', '==', filters.employeeId);
      if (filters.categoryCode && filters.categoryCode !== 'All') query = query.where('categoryCode', '==', filters.categoryCode);
      if (filters.status && filters.status !== 'All') query = query.where('status', '==', filters.status);

      const snapshot = await query.orderBy('uploadedAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching employee documents:', e);
      return [];
    }
  },

  // 2. UPLOAD & REGISTER DOCUMENT
  async uploadDocument(data) {
    try {
      const companyId = data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const employeeId = data.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || 'EMP001';
      const employeeName = data.employeeName || AuthGuard.userProfile?.displayName || 'Employee';

      const payload = {
        companyId,
        employeeId,
        employeeName,
        name: data.name || 'Document',
        documentType: data.documentType || 'OFFER_LETTER',
        categoryCode: data.categoryCode || 'IDENTITY',
        downloadUrl: data.downloadUrl || '#',
        storagePath: data.storagePath || `documents/${employeeId}/${Date.now()}_${data.name}`,
        fileType: data.fileType || 'PDF',
        fileSize: data.fileSize || '1.2 MB',
        uploadedBy: AuthGuard.userProfile?.displayName || 'Employee',
        visibility: data.visibility || 'EMPLOYEE', // EMPLOYEE, HR_ONLY, MANAGER, ADMIN_ONLY
        versionNumber: Number(data.versionNumber) || 1,
        isCurrent: true,
        expiryDate: data.expiryDate || null,
        status: data.status || 'ACTIVE', // ACTIVE, PENDING_REVIEW, EXPIRED, REJECTED
        notes: data.notes || '',
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('employeeDocuments').add(payload);
      payload.id = docRef.id;

      await auditService.log('DOCUMENT_UPLOADED', 'DOCUMENTS', 'employeeDocuments', docRef.id, payload);
      return payload;
    } catch (err) {
      console.error('Error uploading document:', err);
      throw err;
    }
  },

  // 3. GET EXPIRING DOCUMENTS (FOR HR AUDIT)
  async getExpiringDocuments(companyId = null, daysThreshold = 30) {
    try {
      const target = companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const docs = await this.getDocuments({ companyId: target });
      const now = new Date();
      const future = new Date(now.getTime() + daysThreshold * 86400000);

      return docs.filter(d => {
        if (!d.expiryDate) return false;
        const exp = new Date(d.expiryDate);
        return exp >= now && exp <= future;
      });
    } catch (e) {
      return [];
    }
  },

  // 4. CREATE DOCUMENT REQUEST (HR -> Employee)
  async createDocumentRequest(data) {
    try {
      const companyId = data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const payload = {
        companyId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        documentType: data.documentType || 'PAN_CARD',
        documentName: data.documentName || 'Identity Proof',
        description: data.description || 'Please provide updated copy for compliance audit',
        requestedBy: AuthGuard.userProfile?.displayName || 'HR Operations',
        dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: 'REQUESTED', // REQUESTED, SUBMITTED, APPROVED, REJECTED
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('documentRequests').add(payload);
      payload.id = docRef.id;

      // Notify Employee
      if (window.notificationService) {
        await notificationService.createNotification({
          companyId,
          employeeId: data.employeeId,
          type: 'DOCUMENT_REQUEST',
          title: `Action Required: Upload ${payload.documentName}`,
          message: `HR Operations has requested your ${payload.documentName}. Due by ${payload.dueDate}.`,
          relatedModule: 'documents',
          relatedId: docRef.id
        });
      }

      await auditService.log('DOCUMENT_REQUEST_CREATED', 'DOCUMENTS', 'documentRequests', docRef.id, payload);
      return payload;
    } catch (err) {
      throw err;
    }
  },

  // 5. GET DOCUMENT REQUESTS
  async getDocumentRequests(filters = {}) {
    try {
      let query = db.collection('documentRequests');
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.employeeId) query = query.where('employeeId', '==', filters.employeeId);
      if (filters.status && filters.status !== 'All') query = query.where('status', '==', filters.status);

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  // 6. APPROVE OR REJECT DOCUMENT
  async reviewDocument(docId, newStatus, rejectionReason = '') {
    try {
      const payload = {
        status: newStatus,
        reviewedBy: AuthGuard.userProfile?.displayName || 'HR Compliance',
        reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
        rejectionReason: newStatus === 'REJECTED' ? rejectionReason : null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('employeeDocuments').doc(docId).update(payload);
      await auditService.log(`DOCUMENT_${newStatus}`, 'DOCUMENTS', 'employeeDocuments', docId, payload);
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 7. DELETE DOCUMENT
  async deleteDocument(docId) {
    try {
      await db.collection('employeeDocuments').doc(docId).delete();
      await auditService.log('DOCUMENT_DELETED', 'DOCUMENTS', 'employeeDocuments', docId, {});
      return true;
    } catch (e) {
      throw e;
    }
  }
};

window.documentService = documentService;
