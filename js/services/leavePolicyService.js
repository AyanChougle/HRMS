/**
 * DIALLO HRMS — LEAVE POLICY & SCHEME SERVICE (PHASE 6)
 * Manages statutory leave schemes, annual quotas, carry forward rules, and policy configurations
 */

const leavePolicyService = {
  // Built-in Single Official Paid Leave Scheme & Unpaid Leave
  DEFAULT_LEAVE_TYPES: [
    { code: 'PL', name: 'Paid Leave (PL)', annualQuota: 18, monthlyQuota: 3, paid: true, carryForwardAllowed: false, maxCarryForward: 0, allowHalfDay: true, encashmentAllowed: true, description: 'Single official statutory Paid Leave (PL) scheme varying with employee tenure: <6mo = 0 PL, 6mo–1yr = 12 total PL (1 PL/mo), >1yr = 18 total PL (3 PL/mo). Cannot be carried forward to next year.' },
    { code: 'LWP', name: 'Unpaid Leave (Loss of Pay)', annualQuota: 0, monthlyQuota: 0, paid: false, carryForwardAllowed: false, maxCarryForward: 0, allowHalfDay: true, encashmentAllowed: false, description: 'Unpaid leave / leave without pay' }
  ],

  // Get all active leave types for a company
  async getLeaveTypes(companyId = 'comp_diallo_india') {
    // Return only the single official Paid Leave scheme and Unpaid Leave as per policy
    return this.DEFAULT_LEAVE_TYPES.map((t, idx) => ({ id: `type_${t.code}`, ...t }));
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
