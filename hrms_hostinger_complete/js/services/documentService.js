
const documentService = {
  // Document Categories
  DOCUMENT_CATEGORIES: [
    { code: 'IDENTITY', name: 'Identity & Address Proof' },
    { code: 'EMPLOYMENT', name: 'Employment Contracts & Offers' },
    { code: 'PAYROLL', name: 'Statutory & Tax Documents' },
    { code: 'EDUCATION', name: 'Education & Degree Certificates' },
    { code: 'EXPERIENCE', name: 'Previous Experience & Relieving Letters' },
    { code: 'COMPLIANCE', name: 'Certifications & Compliance' },
    { code: 'COMPANY', name: 'Company Policies & Handbook' },
    { code: 'OTHER', name: 'Miscellaneous Files' }
  ],

  // 1. GET DOCUMENTS (Scoped by Employee or Company)
  async getDocuments(filters = {}) {
    try {
      // 1. Primary: Hostinger MySQL API
      if (typeof apiClient !== 'undefined') {
        try {
          const params = {};
          if (filters.employeeId) params.employee_id = filters.employeeId;
          if (filters.categoryCode && filters.categoryCode !== 'All') params.category = filters.categoryCode;
          const resp = await apiClient.get('documents.php', params);
          if (resp && resp.success && Array.isArray(resp.documents)) {
            return resp.documents.map(d => ({
              id: d.id,
              name: d.title || d.file_name || 'Document',
              title: d.title || d.file_name || 'Document',
              categoryCode: d.category || 'OTHER',
              categoryName: d.category || 'Other',
              downloadUrl: d.file_url || '#',
              fileUrl: d.file_url || '#',
              storagePath: d.file_path || '',
              fileType: d.file_type || 'PDF',
              fileSize: d.file_size ? `${(d.file_size / 1024).toFixed(1)} KB` : '1.0 MB',
              employeeId: d.employee_id,
              employeeCode: d.employee_code || '',
              employeeName: d.employee_name || 'Staff',
              uploadedBy: d.uploaded_by || 'HR Admin',
              status: d.status || 'ACTIVE',
              uploadedAt: d.created_at,
              createdAt: d.created_at
            }));
          }
        } catch (apiErr) {
          console.warn('[documentService] MySQL fetch notice:', apiErr.message);
        }
      }
      return [];
    } catch (e) {
      console.warn('Error fetching employee documents:', e);
      return [];
    }
  },

  // 2. UPLOAD & REGISTER DOCUMENT
  async uploadDocument(data) {
    try {
      const companyId = data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const employeeId = data.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || '';
      const employeeCode = data.employeeCode || AuthGuard.userProfile?.employeeCode || '';
      const employeeName = data.employeeName || AuthGuard.userProfile?.displayName || 'Employee';

      const payload = {
        companyId,
        employeeId,
        employeeCode,
        employeeName,
        name: data.name || data.title || 'Document',
        documentType: data.documentType || 'OFFER_LETTER',
        categoryCode: data.categoryCode || data.category || 'IDENTITY',
        downloadUrl: data.downloadUrl || data.fileUrl || '#',
        storagePath: data.storagePath || `documents/${employeeId}/${Date.now()}_${data.name || 'file'}`,
        fileType: data.fileType || 'PDF',
        fileSize: data.fileSize || '1.2 MB',
        uploadedBy: AuthGuard.userProfile?.displayName || 'Employee',
        visibility: data.visibility || 'EMPLOYEE',
        versionNumber: Number(data.versionNumber) || 1,
        isCurrent: true,
        expiryDate: data.expiryDate || null,
        status: data.status || 'ACTIVE',
        notes: data.notes || '',
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // 1. Primary: Save to Hostinger MySQL
      if (typeof apiClient !== 'undefined') {
        try {
          const resp = await apiClient.post('documents.php', {
            employee_id: employeeId,
            employee_code: employeeCode,
            category: payload.categoryCode,
            title: payload.name,
            file_name: data.fileName || payload.name,
            file_path: payload.storagePath,
            file_url: payload.downloadUrl,
            file_type: payload.fileType,
            file_size: parseInt(payload.fileSize, 10) || 1024
          });
          if (resp && resp.id) payload.id = resp.id;
        } catch (apiErr) {
          console.warn('[documentService] MySQL upload error, falling back:', apiErr.message);
        }
      }

      if (!payload.id) {
        payload.id = 'doc_' + Date.now();
      }

      await auditService.log('DOCUMENT_UPLOADED', 'DOCUMENTS', 'employeeDocuments', String(payload.id), payload).catch(() => {});
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
      const reqId = 'dreq_' + Date.now();
      const payload = {
        id: reqId,
        companyId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        documentType: data.documentType || 'PAN_CARD',
        documentName: data.documentName || 'Identity Proof',
        description: data.description || 'Please provide updated copy for compliance audit',
        requestedBy: AuthGuard.userProfile?.displayName || 'HR Operations',
        dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        status: 'REQUESTED'
      };

      if (window.notificationService && notificationService.createNotification) {
        await notificationService.createNotification({
          companyId,
          employeeId: data.employeeId,
          type: 'DOCUMENT_REQUEST',
          title: `Action Required: Upload ${payload.documentName}`,
          message: `HR Operations has requested your ${payload.documentName}. Due by ${payload.dueDate}.`,
          relatedModule: 'documents',
          relatedId: reqId
        }).catch(() => {});
      }

      if (typeof auditService !== 'undefined' && auditService.log) {
        await auditService.log('DOCUMENT_REQUEST_CREATED', 'DOCUMENTS', 'documentRequests', reqId, payload).catch(() => {});
      }
      return payload;
    } catch (err) {
      throw err;
    }
  },

  // 5. GET DOCUMENT REQUESTS
  async getDocumentRequests(filters = {}) {
    return [];
  },

  // 6. APPROVE OR REJECT DOCUMENT
  async reviewDocument(docId, newStatus, rejectionReason = '') {
    try {
      if (typeof apiClient !== 'undefined') {
        await apiClient.post('documents.php?action=review', {
          id: docId,
          status: newStatus,
          rejectionReason
        });
      }
      if (typeof auditService !== 'undefined' && auditService.log) {
        await auditService.log(`DOCUMENT_${newStatus}`, 'DOCUMENTS', 'documents', String(docId), { newStatus, rejectionReason }).catch(() => {});
      }
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 7. DELETE DOCUMENT
  async deleteDocument(docId) {
    try {
      if (typeof apiClient !== 'undefined') {
        try {
          await apiClient.delete(`documents.php?id=${encodeURIComponent(docId)}`);
        } catch (_) {}
      }
      if (typeof auditService !== 'undefined' && auditService.log) {
        await auditService.log('DOCUMENT_DELETED', 'DOCUMENTS', 'employeeDocuments', String(docId), {}).catch(() => {});
      }
      return true;
    } catch (e) {
      throw e;
    }
  }
};

window.documentService = documentService;
