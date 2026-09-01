/**
 * DIALLO HRMS — LEAVE POLICY & SCHEME SERVICE (PHASE 6)
 * Manages statutory leave schemes, annual quotas, carry forward rules, and policy configurations
 */

const leavePolicyService = {
  // Built-in Default Indian Leave Schemes
  DEFAULT_LEAVE_TYPES: [
    { code: 'AL', name: 'Annual / Privilege Leave (PL)', annualQuota: 18, paid: true, carryForwardAllowed: true, maxCarryForward: 10, allowHalfDay: true, encashmentAllowed: true, description: 'Statutory annual earned leave under Factories / Shops & Est. Act' },
    { code: 'CL', name: 'Casual Leave (CL)', annualQuota: 12, paid: true, carryForwardAllowed: false, maxCarryForward: 0, allowHalfDay: true, encashmentAllowed: false, description: 'Short unplanned personal absences and emergencies' },
    { code: 'SL', name: 'Sick Leave (SL)', annualQuota: 12, paid: true, carryForwardAllowed: true, maxCarryForward: 15, allowHalfDay: true, encashmentAllowed: false, description: 'Medical recovery leave. Certificate required > 2 consecutive days' },
    { code: 'ML', name: 'Maternity Leave (ML)', annualQuota: 182, paid: true, carryForwardAllowed: false, maxCarryForward: 0, allowHalfDay: false, encashmentAllowed: false, description: '26 weeks paid maternity leave under Maternity Benefit Act 2017' },
    { code: 'PL_PAT', name: 'Paternity Leave', annualQuota: 15, paid: true, carryForwardAllowed: false, maxCarryForward: 0, allowHalfDay: false, encashmentAllowed: false, description: 'Paid paternity support leave for new fathers' },
    { code: 'LWP', name: 'Leave Without Pay (LWP)', annualQuota: 365, paid: false, carryForwardAllowed: false, maxCarryForward: 0, allowHalfDay: true, encashmentAllowed: false, description: 'Approved unpaid absence once paid leave quotas are exhausted' }
  ],

  // Get all active leave types for a company
  async getLeaveTypes(companyId = 'comp_diallo_india') {
    try {
      const snapshot = await db.collection('leaveTypes')
        .where('companyId', '==', companyId)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // Initialize default leave types in Firestore if empty
      for (const t of this.DEFAULT_LEAVE_TYPES) {
        await db.collection('leaveTypes').add({
          ...t,
          companyId,
          status: 'ACTIVE',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      const freshSnap = await db.collection('leaveTypes').where('companyId', '==', companyId).get();
      return freshSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Could not fetch leave types, using defaults:', e);
      return this.DEFAULT_LEAVE_TYPES.map((t, idx) => ({ id: `type_${idx}`, ...t }));
    }
  },

  // Create custom leave type
  async createLeaveType(data) {
    try {
      const payload = {
        code: data.code.toUpperCase(),
        name: data.name,
        annualQuota: Number(data.annualQuota) || 12,
        paid: data.paid !== false,
        carryForwardAllowed: !!data.carryForwardAllowed,
        maxCarryForward: Number(data.maxCarryForward) || 0,
        allowHalfDay: !!data.allowHalfDay,
        encashmentAllowed: !!data.encashmentAllowed,
        description: data.description || '',
        companyId: data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('leaveTypes').add(payload);
      await auditService.log('LEAVE_TYPE_CREATED', 'LEAVE', 'leaveTypes', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating leave type:', e);
      throw e;
    }
  }
};

window.leavePolicyService = leavePolicyService;
