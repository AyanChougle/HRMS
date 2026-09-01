/**
 * DIALLO HRMS — SETTINGS & CONFIGURATION SERVICE (PHASE 15)
 * Centralized Service managing Company Settings, Attendance Settings,
 * Leave Settings, Payroll Settings, Document Settings, and System Defaults.
 */

const settingsService = {
  DEFAULT_COMPANY_ID: 'comp_diallo_india',

  async getCompanySettings(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const doc = await db.collection('companySettings').doc(companyId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }

      // Default system settings
      const defaults = {
        companyId,
        // Regional & Formatting
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        currencySymbol: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12-hour',
        weekStartDay: 'Monday',
        financialYearStart: '01/04',
        defaultLanguage: 'English',

        // Attendance Rules
        attendance: {
          checkInRequired: true,
          checkOutRequired: true,
          gracePeriodMinutes: 15,
          halfDayThresholdHours: 4.5,
          fullDayThresholdHours: 8.0,
          overtimeThresholdHours: 9.0,
          requireGeolocation: true,
          requireSelfie: false,
          enableWebPunch: true,
          regularizationAllowed: true,
          maxRegularizationsPerMonth: 3
        },

        // Working Days (Mon-Fri active, Sat-Sun off)
        workingDays: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },

        // Leave Configuration
        leave: {
          leaveYearCycle: 'CALENDAR_YEAR', // 'FINANCIAL_YEAR' or 'CALENDAR_YEAR'
          allowNegativeBalance: false,
          allowHalfDayLeave: true,
          requireDocumentForMedical: true,
          medicalLeaveDocThresholdDays: 2,
          autoEncashmentOnExit: true
        },

        // Payroll Configuration
        payroll: {
          frequency: 'MONTHLY',
          payDay: 30,
          calculateStatutoryPf: true,
          calculateStatutoryEsi: true,
          calculateStatutoryPt: true,
          allowReimbursementClaims: true
        },

        // Document Verification Configuration
        documents: {
          requireGovtId: true,
          requireAddressProof: true,
          requireEducationalDocs: true,
          requirePreviousRelievingLetter: false,
          expiryReminderDays: 30
        },

        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('companySettings').doc(companyId).set(defaults);
      return { id: companyId, ...defaults };
    } catch (err) {
      console.error('Error getting company settings:', err);
      return null;
    }
  },

  async updateCompanySettings(companyId, updateData) {
    try {
      const payload = {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('companySettings').doc(companyId).set(payload, { merge: true });
      if (typeof auditService !== 'undefined') {
        await auditService.log('SETTINGS_UPDATED', 'SETTINGS', 'companySettings', companyId, updateData);
      }
      return true;
    } catch (err) {
      console.error('Error updating company settings:', err);
      throw err;
    }
  }
};

window.settingsService = settingsService;
