/**
 * DIALLO HRMS — CENTRALIZED AUDIT SERVICE (PHASE 18)
 * Enterprise-grade append-only audit trail logging for all sensitive,
 * administrative, compensation, and security actions.
 */

const auditService = {
  DEFAULT_COMPANY_ID: 'comp_diallo_india',

  /**
   * Log an auditable event to Firestore (append-only)
   */
  async log(action, resourceType, resourceId, details = {}, severity = 'INFO', result = 'SUCCESS') {
    try {
      const user = AuthGuard.currentUser;
      const profile = AuthGuard.userProfile;
      const companyId = profile?.companyId || this.DEFAULT_COMPANY_ID;

      const operationId = `OP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const payload = {
        companyId,
        actorUserId: user?.uid || 'SYSTEM',
        actorEmail: user?.email || profile?.email || 'system@diallo.local',
        actorName: profile?.displayName || profile?.fullName || 'System User',
        actorRole: profile?.roleId || 'SYSTEM',
        action,
        resourceType,
        resourceId: String(resourceId || ''),
        severity, // 'INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        result,   // 'SUCCESS', 'DENIED', 'FAILED'
        operationId,
        metadata: typeof details === 'object' ? details : { message: String(details) },
        userAgent: navigator.userAgent?.substring(0, 100) || 'Browser Client',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('auditLogs').add(payload);
      return operationId;
    } catch (err) {
      console.warn('Non-blocking audit log failure:', err);
      return null;
    }
  },

  /**
   * Fetch audit logs with multi-factor filtering
   */
  async getAuditLogs(companyId = this.DEFAULT_COMPANY_ID, filters = {}) {
    try {
      let query = db.collection('auditLogs').where('companyId', '==', companyId);

      if (filters.action) {
        query = query.where('action', '==', filters.action);
      }
      if (filters.severity) {
        query = query.where('severity', '==', filters.severity);
      }
      if (filters.actorRole) {
        query = query.where('actorRole', '==', filters.actorRole);
      }

      const snap = await query.orderBy('timestamp', 'desc').limit(filters.limit || 50).get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching audit logs:', e);
      return [];
    }
  },

  /**
   * Specifically fetch sensitive access logs (Salary, Grievances, HR Cases)
   */
  async getSensitiveAccessLogs(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('auditLogs')
        .where('companyId', '==', companyId)
        .where('severity', 'in', ['MEDIUM', 'HIGH', 'CRITICAL'])
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching sensitive access logs:', e);
      return [];
    }
  }
};

window.auditService = auditService;
