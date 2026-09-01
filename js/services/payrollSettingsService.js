/**
 * DIALLO HRMS — PAYROLL SETTINGS & POLICY SERVICE (PHASE 7)
 * Manages currency, working-day calculation methods, overtime rules, and deduction policies
 */

const payrollSettingsService = {
  DEFAULT_SETTINGS: {
    currency: 'INR',
    currencySymbol: '₹',
    payFrequency: 'MONTHLY',
    workingDaysMethod: 'FIXED_DAYS', // FIXED_DAYS (26), ACTUAL_WORKING_DAYS, CALENDAR_DAYS
    standardWorkingDays: 26,
    overtimeEnabled: true,
    overtimeRateMultiplier: 1.5, // 1.5x hourly rate
    unpaidLeaveDeductionEnabled: true,
    autoApproveThreshold: 0,
    lockRequired: true,
    status: 'ACTIVE'
  },

  async getSettings(companyId = 'comp_diallo_india') {
    try {
      const doc = await db.collection('payrollSettings').doc(companyId).get();
      if (doc.exists) {
        return { ...this.DEFAULT_SETTINGS, ...doc.data() };
      }
      return this.DEFAULT_SETTINGS;
    } catch (e) {
      console.warn('Could not fetch payroll settings, using defaults:', e);
      return this.DEFAULT_SETTINGS;
    }
  },

  async updateSettings(companyId = 'comp_diallo_india', newSettings) {
    try {
      const payload = {
        ...newSettings,
        updatedBy: AuthGuard.userProfile?.displayName || 'Payroll Admin',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('payrollSettings').doc(companyId).set(payload, { merge: true });
      await auditService.log('PAYROLL_SETTING_CHANGED', 'PAYROLL', 'payrollSettings', companyId, newSettings);
      return true;
    } catch (e) {
      console.error('Error saving payroll settings:', e);
      throw e;
    }
  }
};

window.payrollSettingsService = payrollSettingsService;
