
/**
 * HRMS Live Presence v3
 * Browser presence only. The desktop agent owns system presence.
 */
const presenceService = {
  heartbeatTimer: null,
  staleAfterMs: 90000,

  employeeId() {
    return AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
  },
  companyId() {
    return AuthGuard.userProfile?.companyId || 'comp_diallo_india';
  },

  async heartbeat(status = document.visibilityState === 'visible' ? 'ACTIVE' : 'HIDDEN') {
    const employeeId = this.employeeId();
    const companyId = this.companyId();
    if (!employeeId || !companyId || !window.db) return;

    try {
      const ref = db.collection('employeePresence').doc(employeeId);
      await ref.set({
        employeeId, companyId,
        employeeName: AuthGuard.userProfile?.displayName || AuthGuard.userProfile?.name || AuthGuard.currentUser?.displayName || 'Employee',
        browserStatus: status,
        browserLastHeartbeatAt: firebase.firestore.FieldValue.serverTimestamp(),
        browserClientTimestamp: new Date().toISOString(),
        source: 'WEB',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Presence heartbeat warning:', e);
    }
  },

  start() {
    this.stop();
    this.heartbeat();
    this.heartbeatTimer = setInterval(() => this.heartbeat(), 30000);
    window.addEventListener('focus', () => this.heartbeat('ACTIVE'));
    window.addEventListener('blur', () => this.heartbeat('HIDDEN'));
    document.addEventListener('visibilitychange', () =>
      this.heartbeat(document.visibilityState === 'visible' ? 'ACTIVE' : 'HIDDEN')
    );
    window.addEventListener('beforeunload', () => {
      // Best-effort only. Closing a browser cannot be reliably observed server-side.
      this.heartbeat('DISCONNECTING');
    });
  },

  stop() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }
};

window.presenceService = presenceService;
