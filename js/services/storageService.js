/**
 * DIALLO HRMS — PRODUCTION FILE STORAGE SERVICE (PHASE 20)
 * Uses Hostinger Storage ONLY (Firebase Storage is disabled).
 */

const storageService = {
  // Upload an employee document (Aadhaar, PAN, Resume, Contract) to Hostinger
  async uploadEmployeeDocument(employeeId, file, documentType = 'GENERAL') {
    try {
      if (!file) throw new Error('No file provided for upload');
      const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      
      const record = await hostingerStorageService.uploadFile(file, {
        category: documentType,
        companyId,
        employeeId
      });

      return {
        id: record.id,
        employeeId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        documentType,
        storagePath: record.storagePath,
        downloadUrl: record.fileUrl,
        fileUrl: record.fileUrl,
        uploadedBy: record.uploadedBy,
        uploadedAt: record.createdAt
      };
    } catch (err) {
      console.error('Hostinger document upload error:', err);
      throw err;
    }
  },

  // Upload Employee Profile Avatar to Hostinger
  async uploadProfileAvatar(employeeId, file) {
    try {
      if (!file) throw new Error('No avatar file provided');
      const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';

      const record = await hostingerStorageService.uploadFile(file, {
        category: 'PROFILE_PHOTO',
        companyId,
        employeeId
      });

      // Update employee record with Hostinger avatar URL
      await db.collection('employees').doc(employeeId).update({
        avatarUrl: record.fileUrl,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return record.fileUrl;
    } catch (err) {
      console.error('Hostinger avatar upload error:', err);
      throw err;
    }
  },

  // Fetch all documents for an employee
  async getEmployeeDocuments(employeeId) {
    try {
      let snapshot;
      try {
        snapshot = await db.collection('employeeDocuments')
          .where('employeeId', '==', employeeId)
          .orderBy('uploadedAt', 'desc')
          .get();
      } catch (idxErr) {
        snapshot = await db.collection('employeeDocuments')
          .where('employeeId', '==', employeeId)
          .get();
      }

      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => {
        const tA = a.uploadedAt?.seconds ? a.uploadedAt.seconds * 1000 : (new Date(a.uploadedAt || 0).getTime() || 0);
        const tB = b.uploadedAt?.seconds ? b.uploadedAt.seconds * 1000 : (new Date(b.uploadedAt || 0).getTime() || 0);
        return tB - tA;
      });
      return list;
    } catch (err) {
      console.warn('Error fetching employee documents:', err);
      return [];
    }
  }
};

window.storageService = storageService;
