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
    status: 'ACTIVE',

    // Company-Wide Statutory Funds Configuration
    statutory: {
      pfEnabled: true,                 // Master toggle for whole company PF
      pfEmployeeRate: 12,              // 12% Employee EPF
      pfEmployerRate: 3.67,            // 3.67% Employer EPF
      epsEmployerRate: 8.33,           // 8.33% Employer Pension Scheme (EPS)
      pfAdminRate: 0.5,                // 0.5% Admin Charges
      edliRate: 0.5,                   // 0.5% EDLI Insurance
      pfWageCeiling: 15000,            // ₹15,000 / month
      pfCeilingRestricted: true,       // true: Cap at ₹15,000, false: Apply on full basic
      includeEmployerPfInCtc: true,

      esicEnabled: true,               // Master toggle for whole company ESIC
      esicWageCeiling: 21000,          // ₹21,000 / month
      esicEmployeeRate: 0.75,          // 0.75%
      esicEmployerRate: 3.25,          // 3.25%

      ptEnabled: true,                 // Master toggle for Professional Tax
      lwfEnabled: true,                // Labour Welfare Fund
      lwfMonthlyAmount: 20,            // ₹20 / month
      gratuityEnabled: true,           // Gratuity Act
      gratuityRate: 4.81               // 4.81% of Basic
    }
  },

  async getSettings(companyId = 'comp_diallo_india') {
    try {
      const doc = await db.collection('payrollSettings').doc(companyId).get();
      if (doc.exists) {
        const data = doc.data();
        const merged = {
          ...this.DEFAULT_SETTINGS,
          ...data,
          statutory: {
            ...this.DEFAULT_SETTINGS.statutory,
            ...(data.statutory || {})
          }
        };
        if (window.StatutoryEngine && merged.statutory) {
          window.StatutoryEngine.updateConfig(merged.statutory);
        }
        return merged;
      }
      return this.DEFAULT_SETTINGS;
    } catch (e) {
      console.warn('Could not fetch payroll settings, using defaults:', e);
      return this.DEFAULT_SETTINGS;
    }
  },

  async getStatutorySettings(companyId = 'comp_diallo_india') {
    const settings = await this.getSettings(companyId);
    return settings.statutory || this.DEFAULT_SETTINGS.statutory;
  },

  async updateStatutorySettings(companyId = 'comp_diallo_india', statutorySettings) {
    try {
      const payload = {
        statutory: {
          ...this.DEFAULT_SETTINGS.statutory,
          ...statutorySettings
        },
        updatedBy: AuthGuard.userProfile?.displayName || AuthGuard.currentUser?.email || 'Admin',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('payrollSettings').doc(companyId).set(payload, { merge: true });
      if (window.StatutoryEngine) {
        window.StatutoryEngine.updateConfig(payload.statutory);
      }
      await auditService.log('STATUTORY_FUNDS_CONFIG_UPDATED', 'PAYROLL', 'payrollSettings', companyId, statutorySettings);
      return true;
    } catch (e) {
      console.error('Error updating statutory funds settings:', e);
      throw e;
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
      if (newSettings.statutory && window.StatutoryEngine) {
        window.StatutoryEngine.updateConfig(newSettings.statutory);
      }
      await auditService.log('PAYROLL_SETTING_CHANGED', 'PAYROLL', 'payrollSettings', companyId, newSettings);
      return true;
    } catch (e) {
      console.error('Error saving payroll settings:', e);
      throw e;
    }
  }
};

window.payrollSettingsService = payrollSettingsService;
