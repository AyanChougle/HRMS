/**
 * DIALLO HRMS — AUDIT LOGGING SERVICE
 * Immutable tracking of system actions, mutations, and compliance events
 */

const auditService = {
  // Record an audit log entry
  async log(action, module, collection, documentId, details = {}, oldData = null, newData = null) {
    try {
      const user = AuthGuard.currentUser;
      const userProfile = AuthGuard.userProfile;

      const entry = {
        action,
        module,
        collection,
        documentId: documentId || null,
        actorUserId: user ? user.uid : 'SYSTEM',
        actorEmail: user ? user.email : 'system@diallo.in',
        actorName: userProfile ? (userProfile.displayName || userProfile.fullName) : 'System',
        companyId: userProfile?.companyId || 'comp_diallo_india',
        branchId: userProfile?.branchId || 'branch_mumbai',
        details: details || {},
        oldData: oldData ? this.sanitize(oldData) : null,
        newData: newData ? this.sanitize(newData) : null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        clientTimestamp: new Date().toISOString()
      };

      await db.collection('auditLogs').add(entry);
    } catch (err) {
      console.warn('Audit logging failed (non-blocking):', err);
    }
  },

  // Strip sensitive passwords or tokens before logging
  sanitize(data) {
    if (!data || typeof data !== 'object') return data;
    const clean = { ...data };
    delete clean.password;
    delete clean.confirmPassword;
    delete clean.token;
    delete clean.secret;
    return clean;
  },

  // Fetch recent audit logs for Admin / Governance
  async getAuditLogs(limitCount = 50) {
    try {
      const snapshot = await db.collection('auditLogs')
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      return [];
    }
  }
};

window.auditService = auditService;
