/**
 * DIALLO HRMS — ATTENDANCE SETTINGS & POLICY SERVICE (PHASE 5)
 * Manages company-wide attendance rules, shifts, grace periods, weekly offs, and holidays
 */

const attendanceSettingsService = {
  // Default fallback settings
  DEFAULT_SETTINGS: {
    timezone: 'Asia/Kolkata',
    defaultStartTime: '09:00',
    defaultEndTime: '18:00',
    graceMinutes: 15,
    minimumHalfDayMinutes: 240, // 4 hours
    minimumFullDayMinutes: 480, // 8 hours
    overtimeAfterMinutes: 480,  // 8 hours
    weeklyOffDays: ['Sunday'],
    status: 'ACTIVE'
  },

  // Get settings for a company
  async getSettings(companyId = 'comp_diallo_india') {
    try {
      const doc = await db.collection('attendanceSettings').doc(companyId).get();
      if (doc.exists) {
        return { ...this.DEFAULT_SETTINGS, ...doc.data() };
      }
      return this.DEFAULT_SETTINGS;
    } catch (e) {
      console.warn('Could not fetch attendance settings, using defaults:', e);
      return this.DEFAULT_SETTINGS;
    }
  },

  // Update company attendance settings
  async updateSettings(companyId = 'comp_diallo_india', newSettings) {
    try {
      const payload = {
        ...newSettings,
        updatedBy: AuthGuard.userProfile?.displayName || 'HR Admin',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('attendanceSettings').doc(companyId).set(payload, { merge: true });
      await auditService.log('ATTENDANCE_SETTING_CHANGED', 'ATTENDANCE', 'attendanceSettings', companyId, newSettings);
      return true;
    } catch (e) {
      console.error('Error saving attendance settings:', e);
      throw e;
    }
  },

  // 1. HOLIDAYS CRUD
  async getHolidays(companyId = 'comp_diallo_india') {
    try {
      const snapshot = await db.collection('holidays')
        .where('companyId', '==', companyId)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Could not fetch holidays:', e);
      return [];
    }
  },

  async createHoliday(holidayData) {
    try {
      const payload = {
        companyId: holidayData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        branchId: holidayData.branchId || 'All',
        name: holidayData.name,
        date: holidayData.date,
        type: holidayData.type || 'NATIONAL', // NATIONAL, COMPANY, OPTIONAL
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('holidays').add(payload);
      await auditService.log('HOLIDAY_CREATED', 'ATTENDANCE', 'holidays', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating holiday:', e);
      throw e;
    }
  },

  // 2. SHIFTS CRUD
  async getShifts(companyId = 'comp_diallo_india') {
    try {
      const snapshot = await db.collection('shifts')
        .where('companyId', '==', companyId)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Could not fetch shifts:', e);
      return [];
    }
  },

  async createShift(shiftData) {
    try {
      const payload = {
        companyId: shiftData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        name: shiftData.name,
        startTime: shiftData.startTime || '09:00',
        endTime: shiftData.endTime || '18:00',
        breakMinutes: Number(shiftData.breakMinutes) || 60,
        graceMinutes: Number(shiftData.graceMinutes) || 15,
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('shifts').add(payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating shift:', e);
      throw e;
    }
  }
};

window.attendanceSettingsService = attendanceSettingsService;
