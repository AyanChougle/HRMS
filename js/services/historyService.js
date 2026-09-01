/**
 * DIALLO HRMS — EMPLOYEE TIMELINE & HISTORY SERVICE (PHASE 4)
 * Tracks career milestones, department transfers, promotions, status changes, and manager updates
 */

const historyService = {
  // Record a career or employment event
  async logChange(employeeId, companyId, type, description, oldValue = null, newValue = null) {
    try {
      const payload = {
        employeeId,
        companyId: companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        type, // e.g. 'DEPARTMENT_CHANGED', 'DESIGNATION_CHANGED', 'STATUS_CHANGED', 'MANAGER_CHANGED'
        description,
        oldValue: oldValue || null,
        newValue: newValue || null,
        changedBy: AuthGuard.userProfile?.displayName || AuthGuard.currentUser?.email || 'System Admin',
        changedById: AuthGuard.currentUser?.uid || 'system',
        changedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      const docRef = await db.collection('employeeHistory').add(payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.warn('Could not record employee history:', err);
      return null;
    }
  },

  // Get chronological history for an employee
  async getEmployeeHistory(employeeId) {
    try {
      const snapshot = await db.collection('employeeHistory')
        .where('employeeId', '==', employeeId)
        .orderBy('changedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      // Fallback query if index is building
      try {
        const fallbackSnapshot = await db.collection('employeeHistory')
          .where('employeeId', '==', employeeId)
          .get();
        return fallbackSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      } catch (e) {
        console.error('Error fetching employee history:', e);
        return [];
      }
    }
  }
};

window.historyService = historyService;
