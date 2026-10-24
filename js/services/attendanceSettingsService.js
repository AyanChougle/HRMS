// ==============================================================================
// DIALLO HRMS — ATTENDANCE SETTINGS, HOLIDAYS & SHIFTS SERVICE
// 100% Hostinger MySQL & PHP Backend (Zero Firebase Dependencies)
// ==============================================================================

const attendanceSettingsService = {
  // Default fallback settings (General Shift 10:00 AM – 07:00 PM IST)
  DEFAULT_SETTINGS: {
    timezone: 'Asia/Kolkata',
    defaultStartTime: '10:00',
    defaultEndTime: '19:00',
    graceMinutes: 10, // Grace period up to 10:10 AM (late mark starts 10:10:01 AM)
    halfDayAfterTime: '11:10', // Reporting after 11:10 AM marked as Half Day
    halfDayAfterMinutes: 70, // 70 mins from 10:00 AM = 11:10 AM
    lateMarksAllowed: 3, // Up to 3 late marks no deduction; 4th onwards = Half Day deduction
    minimumHalfDayMinutes: 270, // 4.5 hours
    minimumFullDayMinutes: 540, // 9 hours
    overtimeAfterMinutes: 540,  // 9 hours (OT starts after 9h on shift)
    weeklyOffDays: ['Sunday'],
    workingDaysPerWeek: 6,
    sandwichLeaveDeductionDays: 3,
    unauthorizedLeaveDeductionDays: 2,
    geofence: {
      enabled: true,
      address: 'Office Premises (GPS: 19.075975, 72.87738)',
      mapsUrl: 'https://www.google.com/maps?q=19.075975,72.87738',
      latitude: 19.075975,
      longitude: 72.87738,
      radiusMeters: 60
    },
    status: 'ACTIVE'
  },

  // Get settings for a company
  async getSettings(companyId = 'comp_diallo_india') {
    return this.DEFAULT_SETTINGS;
  },

  // Update company attendance settings
  async updateSettings(companyId = 'comp_diallo_india', newSettings) {
    if (typeof auditService !== 'undefined') {
      await auditService.log('ATTENDANCE_SETTING_CHANGED', 'ATTENDANCE', 'attendanceSettings', companyId, newSettings);
    }
    return true;
  },

  // 1. HOLIDAYS CRUD (100% Hostinger MySQL)
  async getHolidays(companyId = 'comp_diallo_india') {
    try {
      if (typeof apiClient !== 'undefined') {
        const res = await apiClient.get('attendance.php', { action: 'holidays' });
        if (res && res.success && Array.isArray(res.holidays)) {
          return res.holidays.map(h => ({
            id: h.id,
            name: h.name,
            date: h.date,
            type: h.type || 'NATIONAL',
            status: h.status || 'ACTIVE'
          }));
        }
      }
      return [];
    } catch (e) {
      console.warn('[attendanceSettingsService] Could not fetch holidays from MySQL:', e);
      return [];
    }
  },

  async createHoliday(holidayData) {
    try {
      if (typeof apiClient !== 'undefined') {
        const res = await apiClient.post('attendance.php?action=create_holiday', {
          name: holidayData.name,
          date: holidayData.date,
          type: holidayData.type || 'NATIONAL'
        });
        if (res && res.success) {
          if (typeof auditService !== 'undefined') {
            await auditService.log('HOLIDAY_CREATED', 'ATTENDANCE', 'holidays', holidayData.date, holidayData);
          }
          return { success: true, ...holidayData };
        }
        throw new Error(res?.error || 'Failed to save holiday');
      }
      return holidayData;
    } catch (e) {
      console.error('[attendanceSettingsService] Error creating holiday:', e);
      throw e;
    }
  },

  // 2. SHIFTS CRUD (100% Hostinger MySQL)
  async getShifts(companyId = 'comp_diallo_india') {
    try {
      if (typeof apiClient !== 'undefined') {
        const res = await apiClient.get('attendance.php', { action: 'shifts' });
        if (res && res.success && Array.isArray(res.shifts)) {
          return res.shifts.map(s => ({
            id: s.id,
            name: s.name,
            startTime: s.start_time,
            endTime: s.end_time,
            breakMinutes: Number(s.break_minutes) || 60,
            graceMinutes: Number(s.grace_minutes) || 10,
            status: s.status || 'ACTIVE'
          }));
        }
      }
      return [
        {
          id: 1,
          name: 'General Shift',
          startTime: '10:00',
          endTime: '19:00',
          breakMinutes: 60,
          graceMinutes: 10,
          status: 'ACTIVE'
        }
      ];
    } catch (e) {
      console.warn('[attendanceSettingsService] Could not fetch shifts from MySQL:', e);
      return [];
    }
  },

  async createShift(shiftData) {
    try {
      if (typeof apiClient !== 'undefined') {
        const res = await apiClient.post('attendance.php?action=create_shift', {
          name: shiftData.name,
          startTime: shiftData.startTime || '10:00',
          endTime: shiftData.endTime || '19:00',
          breakMinutes: Number(shiftData.breakMinutes) || 60,
          graceMinutes: Number(shiftData.graceMinutes) || 10
        });
        if (res && res.success) {
          return { success: true, ...shiftData };
        }
        throw new Error(res?.error || 'Failed to create shift');
      }
      return shiftData;
    } catch (e) {
      console.error('[attendanceSettingsService] Error creating shift:', e);
      throw e;
    }
  }
};

window.attendanceSettingsService = attendanceSettingsService;
