/**
 * DIALLO HRMS — FIREBASE STORAGE SERVICE
 * Handles document and avatar uploads with Firestore metadata records
 */

const storageService = {
  // Upload an employee document (Aadhaar, PAN, Resume, Contract)
  async uploadEmployeeDocument(employeeId, file, documentType = 'GENERAL') {
    try {
      if (!file) throw new Error('No file provided for upload');

      const timestamp = Date.now();
      const safeFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storagePath = `employees/${employeeId}/documents/${safeFileName}`;

      const storageRef = storage.ref().child(storagePath);
      const snapshot = await storageRef.put(file);
      const downloadUrl = await snapshot.ref.getDownloadURL();

      const docMetadata = {
        employeeId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        documentType,
        storagePath,
        downloadUrl,
        uploadedBy: AuthGuard.currentUser ? AuthGuard.currentUser.uid : 'SYSTEM',
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('employeeDocuments').add(docMetadata);
      docMetadata.id = docRef.id;

      await auditService.log('DOCUMENT_UPLOADED', 'PEOPLE', 'employeeDocuments', docRef.id, { employeeId, fileName: file.name, documentType });
      return docMetadata;
    } catch (err) {
      console.error('Document upload error:', err);
      throw err;
    }
  },

  // Upload Employee Profile Avatar
  async uploadProfileAvatar(employeeId, file) {
    try {
      if (!file) throw new Error('No avatar file provided');

      const storagePath = `employees/${employeeId}/profile/avatar_${Date.now()}`;
      const storageRef = storage.ref().child(storagePath);
      const snapshot = await storageRef.put(file);
      const downloadUrl = await snapshot.ref.getDownloadURL();

      // Update employee record with avatar URL
      await db.collection('employees').doc(employeeId).update({
        avatarUrl: downloadUrl,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return downloadUrl;
    } catch (err) {
      console.error('Avatar upload error:', err);
      throw err;
    }
  },

  // Fetch all documents for an employee
  async getEmployeeDocuments(employeeId) {
    try {
      const snapshot = await db.collection('employeeDocuments')
        .where('employeeId', '==', employeeId)
        .orderBy('uploadedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching employee documents:', err);
      return [];
    }
  }
};

window.storageService = storageService;
