/**
 * DIALLO HRMS — PERFORMANCE CYCLE MANAGEMENT SERVICE (PHASE 8)
 * Manages appraisal cycle lifecycles, deadlines, and state transitions
 */

const performanceCycleService = {
  // Built-in Default Annual Cycle
  DEFAULT_CYCLE: {
    name: '2026 Annual Performance Review',
    type: 'ANNUAL',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    goalStartDate: '2026-01-01',
    goalEndDate: '2026-03-31',
    selfReviewStart: '2026-09-01',
    selfReviewEnd: '2026-09-15',
    managerReviewStart: '2026-09-16',
    managerReviewEnd: '2026-09-30',
    status: 'ACTIVE' // ACTIVE, SELF_REVIEW, MANAGER_REVIEW, HR_REVIEW, COMPLETED, ARCHIVED
  },

  async getCycles(companyId = 'comp_diallo_india') {
    try {
      const snapshot = await db.collection('performanceCycles')
        .where('companyId', '==', companyId)
        .orderBy('createdAt', 'desc')
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // Initialize default cycle if empty
      const payload = {
        ...this.DEFAULT_CYCLE,
        companyId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: 'HR Administration'
      };

      const docRef = await db.collection('performanceCycles').add(payload);
      return [{ id: docRef.id, ...payload }];
    } catch (e) {
      console.warn('Error fetching performance cycles, using fallback:', e);
      return [{ id: 'cycle_2026_annual', ...this.DEFAULT_CYCLE }];
    }
  },

  async getActiveCycle(companyId = 'comp_diallo_india') {
    const cycles = await this.getCycles(companyId);
    return cycles.find(c => c.status === 'ACTIVE' || c.status === 'SELF_REVIEW' || c.status === 'MANAGER_REVIEW') || cycles[0];
  },

  async createCycle(cycleData) {
    try {
      const payload = {
        name: cycleData.name,
        type: cycleData.type || 'ANNUAL',
        startDate: cycleData.startDate,
        endDate: cycleData.endDate,
        goalStartDate: cycleData.goalStartDate || cycleData.startDate,
        goalEndDate: cycleData.goalEndDate || cycleData.endDate,
        selfReviewStart: cycleData.selfReviewStart,
        selfReviewEnd: cycleData.selfReviewEnd,
        managerReviewStart: cycleData.managerReviewStart,
        managerReviewEnd: cycleData.managerReviewEnd,
        companyId: cycleData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: AuthGuard.userProfile?.displayName || 'HR Admin'
      };

      const docRef = await db.collection('performanceCycles').add(payload);
      await auditService.log('PERFORMANCE_CYCLE_CREATED', 'PERFORMANCE', 'performanceCycles', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating performance cycle:', e);
      throw e;
    }
  },

  async updateCycleStatus(cycleId, newStatus) {
    try {
      await db.collection('performanceCycles').doc(cycleId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await auditService.log('PERFORMANCE_CYCLE_STATUS_CHANGED', 'PERFORMANCE', 'performanceCycles', cycleId, { newStatus });
      return true;
    } catch (e) {
      console.error('Error updating cycle status:', e);
      throw e;
    }
  }
};

window.performanceCycleService = performanceCycleService;
