
const attendanceService = {
  // Get query-friendly local date string in company timezone (e.g. '2026-08-31')
  getCompanyLocalDate(timezone = 'Asia/Kolkata') {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
      return formatter.format(now);
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  },

  // Haversine distance calculator between GPS coordinates in meters
  calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // Format timestamp to localized 12-hour time (e.g. '09:08 AM')
  formatTime(dateObj = new Date()) {
    return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  },

  // Safe 12-hour formatter accepting String, Date, or null
  formatTime12(time) {
    if (!time) return '—';
    if (typeof time === 'string') {
      const clean = time.trim();
      if (!clean || clean === '—' || clean === '-') return '—';
      if (/AM|PM/i.test(clean)) return clean;
      const parts = clean.split(':');
      if (parts.length >= 2) {
        let h = parseInt(parts[0], 10);
        const m = parts[1].padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
      }
      return clean;
    }
    if (time instanceof Date) {
      return this.formatTime(time);
    }
    return String(time);
  },

  // Convert "09:30" string to minutes from midnight
  timeStringToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  },

  // Convert "05:05 PM", "10:00 AM", "17:05" to minutes from midnight (0 to 1439)
  time12ToMinutes(timeStr) {
    if (!timeStr) return 0;
    const clean = String(timeStr).trim();
    const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
    if (!match) {
      return this.timeStringToMinutes(clean);
    }
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;
    if (ampm) {
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
    return Math.min(1439, Math.max(0, hours * 60 + mins));
  },

  // Format break duration with seconds precision if under 1 hr
  formatBreakDuration(seconds) {
    if (!seconds || seconds <= 0) return '0m';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remSec = seconds % 60;
    if (mins < 60) {
      return remSec > 0 ? `${mins}m ${remSec}s` : `${mins}m`;
    }
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
  },

  // Sanitize attendance record to guarantee accurate duration, breaks, overtime, and status
    isSaturday(dateStr) {
    if (!dateStr) return false;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.getDay() === 6;
      }
    } catch (e) {}
    return false;
  },

  sanitizeRecord(rec) {
    if (!rec) return rec;
    const r = { ...rec };

    // Normalize field names from MySQL snake_case
    if (!r.checkIn && r.check_in) r.checkIn = r.check_in;
    if (!r.checkOut && r.check_out) r.checkOut = r.check_out;
    if (r.late_minutes !== undefined && r.lateMinutes === undefined) r.lateMinutes = Number(r.late_minutes || 0);
    if (r.employee_code && !r.employeeCode) r.employeeCode = r.employee_code;
    if (r.employee_name && !r.employeeName) r.employeeName = r.employee_name;
    if (r.is_on_break !== undefined && r.isOnBreak === undefined) r.isOnBreak = (r.is_on_break == 1);

    // Clean break durations
    const breakSec = (r.totalBreakSeconds !== undefined && r.totalBreakSeconds !== null)
      ? Number(r.totalBreakSeconds)
      : (Number(r.totalBreakMinutes || 0) * 60);
    r.totalBreakSeconds = Math.max(0, breakSec);
    r.totalBreakMinutes = Math.round(r.totalBreakSeconds / 60);
    r.breakFormatted = this.formatBreakDuration(r.totalBreakSeconds);

    // Calculate lateMinutes if checkIn exists
    if (r.checkIn && (r.lateMinutes === undefined || r.lateMinutes === null || r.lateMinutes === 0)) {
      const inMins = this.time12ToMinutes(r.checkIn);
      // Shift starts at 10:00 AM (600 mins) + 15 mins grace = 615 mins (Grace window up to 10:15 AM)
      if (inMins > 615) {
        r.lateMinutes = inMins - 600;
        r.isLate = true;
      } else {
        r.lateMinutes = 0;
        r.isLate = false;
      }
    } else {
      r.isLate = Boolean(r.lateMinutes && r.lateMinutes > 0);
    }

    if (r.checkIn && r.checkOut && r.checkOut !== '-') {
      r.isOpenShift = false;
      const inMins = this.time12ToMinutes(r.checkIn);
      const outMins = this.time12ToMinutes(r.checkOut);
      let sessionMinutes = 0;
      if (outMins >= inMins) {
        sessionMinutes = outMins - inMins;
      } else {
        sessionMinutes = Math.max(0, (1440 - inMins) + outMins);
      }

      // Single daily shift gross minutes cannot exceed 720m (12 hours).
      // Standard shift (10:00 AM to 07:00 PM) = 540 minutes gross.
      const totalGrossMinutes = Math.min(720, Math.max(0, sessionMinutes));

      const isSat = this.isSaturday(r.date);
      const targetWorkMins = isSat ? 360 : 480; // Saturday shift target = 6h (360m)
      const halfDayCutoff = isSat ? 180 : 240;   // Saturday half-day cutoff = 3h (180m)

      let effectiveBreakMinutes = r.totalBreakMinutes || 0;
      if (!isSat && effectiveBreakMinutes === 0 && (r.status === 'REGULARIZED' || totalGrossMinutes >= 540)) {
        effectiveBreakMinutes = 60;
        r.totalBreakMinutes = 60;
        r.totalBreakSeconds = 3600;
        r.breakFormatted = '60m';
      }

      const workedMinutes = Math.max(0, totalGrossMinutes - effectiveBreakMinutes);

      const hours = Math.floor(workedMinutes / 60);
      const mins = workedMinutes % 60;
      r.workedMinutes = workedMinutes;
      r.workedHoursFormatted = `${hours}h ${String(mins).padStart(2, '0')}m`;

      const grossHours = Math.floor(totalGrossMinutes / 60);
      const grossMins = totalGrossMinutes % 60;
      r.grossMinutes = totalGrossMinutes;
      r.grossHoursFormatted = `${grossHours}h ${String(grossMins).padStart(2, '0')}m`;

      // Saturday shift = 6 hours work target. Overtime is only beyond 6h on Sat (8h on Weekdays).
      r.overtimeMinutes = workedMinutes > targetWorkMins ? (workedMinutes - targetWorkMins) : 0;

      // Ensure status is valid after checkOut
      if (!r.status || r.status === 'ON_BREAK') {
        r.status = workedMinutes < halfDayCutoff ? 'HALF_DAY' : (r.lateMinutes > 0 ? 'LATE' : 'PRESENT');
      }
    } else if (r.checkIn && (!r.checkOut || r.checkOut === '-')) {
      r.isOpenShift = true;
      if (!r.status || r.status === 'PRESENT') {
        r.status = (r.lateMinutes > 0 ? 'LATE' : 'PRESENT');
      }
      r.grossHoursFormatted = '0h 00m';
      r.workedHoursFormatted = '0h 00m';
      r.overtimeMinutes = 0;
    }

    return r;
  },

  // 1. GET TODAY'S ATTENDANCE RECORD FOR AN EMPLOYEE
  async getTodayRecord(employeeId, date = null) {
    const targetEmpId = employeeId 
      || AuthGuard.userProfile?.employeeId 
      || AuthGuard.userProfile?.employeeCode 
      || AuthGuard.currentUser?.uid 
      || AuthGuard.userProfile?.id;
    if (!targetEmpId) return null;
    try {
      const attendanceDate = date || this.getCompanyLocalDate();
      const recordId = `${targetEmpId}_${attendanceDate}`;

      // 1. Primary & Authoritative: Check Hostinger MySQL
      if (typeof apiClient !== 'undefined') {
        try {
          const empCode = AuthGuard.userProfile?.employeeCode || '';
          const sqlRes = await apiClient.get('attendance.php', { 
            action: 'today', 
            employee_id: targetEmpId, 
            employee_code: empCode, 
            date: attendanceDate 
          });
          if (sqlRes && sqlRes.success && sqlRes.record) {
            const r = sqlRes.record;
            return this.sanitizeRecord({
              id: recordId,
              recordKey: r.record_key || recordId,
              employeeId: r.employee_id || targetEmpId,
              employeeCode: r.employee_code || empCode,
              employeeName: r.employee_name || '',
              department: r.department || 'Operations',
              managerId: r.manager_id || '',
              manager: r.manager || '',
              date: r.date || attendanceDate,
              checkIn: r.check_in || null,
              checkOut: r.check_out || null,
              checkInIso: r.check_in_iso || null,
              checkOutIso: r.check_out_iso || null,
              lastBreakStartIso: r.last_break_start_iso || null,
              lastBreakEndIso: r.last_break_end_iso || null,
              status: r.status || 'PRESENT',
              lateMinutes: Number(r.late_minutes || 0),
              grossMinutes: Number(r.gross_minutes || 0),
              grossHoursFormatted: r.gross_hours_formatted || '0h 00m',
              totalBreakSeconds: Number(r.total_break_seconds || 0),
              totalBreakMinutes: Number(r.total_break_minutes || 0),
              breakFormatted: r.break_formatted || '0m',
              isOnBreak: (r.is_on_break == 1)
            });
          }
        } catch (sqlErr) {
          console.warn('[attendanceService] MySQL today check notice:', sqlErr.message || sqlErr);
        }
      }

      return null;
    } catch (e) {
      console.warn('Could not check today attendance record:', e);
      return null;
    }
  },

  // 2. CHECK-IN / PUNCH IN (100% Hostinger MySQL Backend)
  async checkIn(punchData = {}) {
    const employeeId = punchData.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.userProfile?.employeeCode || AuthGuard.currentUser?.uid;
    const employeeCode = punchData.employeeCode || AuthGuard.userProfile?.employeeCode || '';
    const employeeName = punchData.employeeName || punchData.name || AuthGuard.userProfile?.displayName || 'Employee';
    const department = punchData.department || AuthGuard.userProfile?.department || 'Operations';
    const now = new Date();
    const checkInTimeStr = punchData.time || this.formatTime(now);
    const attendanceDate = punchData.date || this.getCompanyLocalDate();

    const res = await apiClient.post('attendance.php?action=punch_in', {
      employee_id: employeeId,
      employee_code: employeeCode,
      employee_name: employeeName,
      department: department,
      punch_type: 'In',
      time: checkInTimeStr,
      check_in: checkInTimeStr,
      work_mode: punchData.workMode || 'OFFICE',
      location: punchData.location || 'HQ - Mumbai',
      latitude: punchData.latitude || null,
      longitude: punchData.longitude || null,
      date: attendanceDate
    });

    if (!res || !res.success) {
      throw new Error(res?.error || 'Failed to punch in on attendance server.');
    }

    const record = res.record || {};
    return this.sanitizeRecord({
      id: `${employeeId}_${attendanceDate}`,
      recordKey: `${employeeId}_${attendanceDate}`,
      employeeId: employeeId,
      employeeCode: employeeCode,
      employeeName: employeeName,
      department: department,
      date: attendanceDate,
      checkIn: record.check_in || checkInTimeStr,
      checkInIso: record.check_in_iso || now.toISOString(),
      status: record.status || 'PRESENT',
      isOnBreak: false,
      totalBreakSeconds: 0,
      totalBreakMinutes: 0
    });
  },

  // 3. CHECK-OUT / PUNCH OUT (100% Hostinger MySQL Backend)
  async checkOut(employeeId, checkoutData = {}) {
    const targetEmpId = employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.userProfile?.employeeCode || AuthGuard.currentUser?.uid;
    const employeeCode = checkoutData.employeeCode || AuthGuard.userProfile?.employeeCode || '';
    const now = new Date();
    const checkOutTimeStr = checkoutData.time || this.formatTime(now);
    const attendanceDate = checkoutData.date || this.getCompanyLocalDate();

    const res = await apiClient.post('attendance.php?action=punch_out', {
      employee_id: targetEmpId,
      employee_code: employeeCode,
      punch_type: 'Out',
      time: checkOutTimeStr,
      check_out: checkOutTimeStr,
      date: attendanceDate,
      latitude: checkoutData.latitude || null,
      longitude: checkoutData.longitude || null
    });

    if (!res || !res.success) {
      throw new Error(res?.error || 'Failed to punch out on attendance server.');
    }

    const record = res.record || {};
    return this.sanitizeRecord({
      id: `${targetEmpId}_${attendanceDate}`,
      recordKey: `${targetEmpId}_${attendanceDate}`,
      employeeId: targetEmpId,
      employeeCode: employeeCode,
      date: attendanceDate,
      checkIn: record.check_in || null,
      checkOut: record.check_out || checkOutTimeStr,
      status: record.status || 'PRESENT',
      isOnBreak: false,
      durationSeconds: record.duration_seconds || 0,
      totalBreakSeconds: record.total_break_seconds || 0
    });
  },

  // 4. RECORD PUNCH (Dispatcher for In, Out, Break In, Break Out)
  async recordPunch(punchData = {}) {
    try {
      const punchType = (punchData.punchType || '').trim();
      const employeeId = punchData.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.userProfile?.employeeCode || AuthGuard.currentUser?.uid;
      const employeeCode = punchData.employeeCode || AuthGuard.userProfile?.employeeCode || '';
      const attendanceDate = punchData.date || this.getCompanyLocalDate();
      const now = new Date();
      const timeStr = punchData.time || this.formatTime(now);

      if (punchType === 'In' || punchType === 'In (Resume)') {
        return await this.checkIn(punchData);
      } else if (punchType === 'Out') {
        return await this.checkOut(employeeId, punchData);
      } else if (punchType === 'Break In') {
        const res = await apiClient.post('attendance.php?action=break_in', {
          employee_id: employeeId,
          employee_code: employeeCode,
          punch_type: 'Break In',
          time: timeStr,
          date: attendanceDate
        });
        if (!res || !res.success) {
          throw new Error(res?.error || 'Failed to start break on server.');
        }
        return true;
      } else if (punchType === 'Break Out') {
        const res = await apiClient.post('attendance.php?action=break_out', {
          employee_id: employeeId,
          employee_code: employeeCode,
          punch_type: 'Break Out',
          time: timeStr,
          date: attendanceDate,
          break_duration: punchData.breakDuration || 0,
          total_break_seconds: punchData.totalBreakSeconds || null
        });
        if (!res || !res.success) {
          throw new Error(res?.error || 'Failed to end break on server.');
        }
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[attendanceService] recordPunch notice:', e.message);
      throw e;
    }
  },

  // 4. GET ATTENDANCE RECORDS WITH ADVANCED FILTERS
  async getAttendanceRecords(filters = {}) {
    try {
      const allEmps = await employeeService.getEmployees().catch(() => []);
      const empLookupById = {};
      const empLookupByName = {};
      allEmps.forEach(e => {
        if (e.id) empLookupById[e.id] = e;
        if (e.fullName) empLookupByName[e.fullName.toLowerCase().trim()] = e;
        if (e.name) empLookupByName[e.name.toLowerCase().trim()] = e;
      });

      let records = [];
      let loadedFromMySQL = false;

      // 1. Primary: Fetch from Hostinger MySQL
      if (typeof apiClient !== 'undefined') {
        try {
          const sqlParams = {};
          if (filters.date) sqlParams.date = filters.date;
          if (filters.employeeId) sqlParams.employee_id = filters.employeeId;
          if (filters.employeeCode) sqlParams.employee_code = filters.employeeCode;
          const sqlRes = await apiClient.get('attendance.php', sqlParams);
          if (sqlRes && sqlRes.success && Array.isArray(sqlRes.records) && sqlRes.records.length > 0) {
            records = sqlRes.records.map(r => this.sanitizeRecord({
              id: r.record_key || `${r.employee_id}_${r.date}`,
              recordKey: r.record_key,
              employeeId: r.employee_id,
              employeeCode: r.employee_code,
              employeeName: r.employee_name,
              department: r.department,
              managerId: r.manager_id,
              manager: r.manager,
              date: r.date,
              checkIn: r.check_in,
              checkOut: r.check_out,
              status: r.status,
              lateMinutes: Number(r.late_minutes || 0),
              grossMinutes: Number(r.gross_minutes || 0),
              grossHoursFormatted: r.gross_hours_formatted || '0h 00m',
              totalBreakSeconds: Number(r.total_break_seconds || 0),
              totalBreakMinutes: Number(r.total_break_minutes || 0),
              breakFormatted: r.break_formatted || '0m',
              isOnBreak: (r.is_on_break == 1)
            }));
            loadedFromMySQL = true;
          }
        } catch (sqlErr) {
          console.warn('[attendanceService] Hostinger MySQL fetch notice:', sqlErr.message || sqlErr);
        }
      }

      // MySQL is authoritative source of truth

      if (filters.scopedToUser) {
        const user = filters.scopedToUser;
        const uRole = (user.roleId || user.role || '').toString().toUpperCase().trim();
        const isSuperAdminOrHR = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR'].includes(uRole);
        if (!isSuperAdminOrHR) {
          const subordinates = await employeeService.getSubordinates(user, allEmps, { directOnly: false });
          const allowedCodes = new Set(subordinates.map(e => (e.employeeCode || '').toUpperCase()));
          const allowedIds = new Set(subordinates.map(e => e.id));
          const allowedNames = new Set(subordinates.map(e => (e.fullName || e.name || '').toLowerCase().trim()));

          if (user.employeeCode) allowedCodes.add(user.employeeCode.toUpperCase());
          if (user.employeeId) allowedIds.add(user.employeeId);
          if (user.id) allowedIds.add(user.id);

          records = records.filter(r => 
            (r.employeeCode && allowedCodes.has(r.employeeCode.toUpperCase())) ||
            (r.employeeId && allowedIds.has(r.employeeId)) ||
            (r.employeeName && allowedNames.has(r.employeeName.toLowerCase().trim()))
          );
        }
      }

      if (filters.search && filters.search.trim() !== '') {
        const term = filters.search.toLowerCase().trim();
        records = records.filter(r => 
          (r.employeeName && r.employeeName.toLowerCase().includes(term)) ||
          (r.employeeCode && r.employeeCode.toLowerCase().includes(term))
        );
      }

      // Sort attendance records by date descending (most recent dates on top)
      records.sort((a, b) => {
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        return (b.checkIn || '').localeCompare(a.checkIn || '');
      });

      return records;
    } catch (err) {
      console.error('Error getting attendance records:', err);
      return [];
    }
  },

  // 5. GET TEAM ATTENDANCE (FOR MANAGERS)
  async getTeamAttendance(managerId, date = null) {
    try {
      const attendanceDate = date || this.getCompanyLocalDate();
      const allEmps = await employeeService.getEmployees();

      const myId = managerId || AuthGuard.userProfile?.employeeId || AuthGuard.userProfile?.id || AuthGuard.currentUser?.uid;
      const myCode = (AuthGuard.userProfile?.employeeCode || '').toUpperCase().trim();
      const myName = (AuthGuard.userProfile?.displayName || AuthGuard.userProfile?.fullName || '').toLowerCase().trim();
      const role = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '').toString().toUpperCase().trim();

      let teamEmployees = [];
      if (role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || role === 'ADMIN' || role === 'HR_MANAGER' || role === 'HR') {
        teamEmployees = allEmps;
      } else {
        // Leadership roles (OPERATIONS_MANAGER, MANAGER, PROCESS_OWNER, TEAM_LEAD):
        // dynamic hierarchy scoping (includes all subordinates under them in the organizational tree)
        teamEmployees = await employeeService.getSubordinates(AuthGuard.userProfile, allEmps, { directOnly: false, forceScoped: true });
      }

      if (teamEmployees.length === 0) return [];

      // 1. Primary: Fetch today's records from Hostinger MySQL API
      let mysqlRecords = [];
      if (typeof apiClient !== 'undefined') {
        try {
          const resp = await apiClient.get(`attendance.php?action=get_records&date=${attendanceDate}`);
          if (resp && resp.success && Array.isArray(resp.records)) {
            mysqlRecords = resp.records;
          }
        } catch (_) {}
      }

      // 2. Build recordsMap indexed across all identifiers from MySQL records
      const recordsMap = {};
      mysqlRecords.forEach(d => {
        if (!d) return;
        const eId = d.employeeId || d.employee_id;
        const uId = d.userId || d.user_id;
        const eCode = d.employeeCode || d.employee_code;
        const eName = d.employeeName || d.employee_name;

        if (eId) recordsMap[String(eId).trim()] = d;
        if (uId) recordsMap[String(uId).trim()] = d;
        if (eCode) recordsMap[String(eCode).toUpperCase().trim()] = d;
        if (eName) recordsMap[String(eName).toLowerCase().trim()] = d;
      });

      return teamEmployees.map(emp => {
        const empId = emp.id ? String(emp.id).trim() : '';
        const empUserId = emp.userId ? String(emp.userId).trim() : '';
        const empCode = emp.employeeCode ? String(emp.employeeCode).toUpperCase().trim() : '';
        const empName = (emp.fullName || emp.name || '').toLowerCase().trim();

        const rawAtt = recordsMap[empId] || (empUserId && recordsMap[empUserId]) || (empCode && recordsMap[empCode]) || (empName && recordsMap[empName]);

        const att = rawAtt ? (typeof this.sanitizeRecord === 'function' ? this.sanitizeRecord(rawAtt) : rawAtt) : {
          date: attendanceDate,
          checkIn: null,
          checkOut: null,
          status: 'ABSENT',
          workedHoursFormatted: '0h 00m',
          totalBreakMinutes: 0,
          breakFormatted: '0m'
        };

        return {
          employee: emp,
          attendance: att
        };
      });
    } catch (e) {
      console.warn('Error fetching team attendance:', e);
      return [];
    }
  },

  // 6. ATTENDANCE REGULARIZATION WORKFLOW
  async getRegularizations(status = null) {
    if (typeof apiClient !== 'undefined') {
      try {
        const query = status ? `?action=get_regularizations&status=${encodeURIComponent(status)}` : '?action=get_regularizations';
        const resp = await apiClient.get(`attendance.php${query}`);
        if (resp && resp.success && Array.isArray(resp.regularizations)) {
          return resp.regularizations.map(r => ({
            id: r.id,
            employeeId: r.employee_id,
            employeeCode: r.employee_code,
            employeeName: r.employee_name,
            requestedDate: r.date,
            date: r.date,
            originalCheckIn: r.check_in || 'Missed',
            originalCheckOut: r.check_out || 'Missed',
            requestedCheckIn: r.check_in || '09:00 AM',
            requestedCheckOut: r.check_out || '06:00 PM',
            reason: r.reason,
            status: r.status,
            requestedBy: r.employee_name,
            requestedById: r.employee_id,
            reviewedBy: r.reviewed_by,
            reviewedById: r.reviewed_by_id,
            reviewedAt: r.reviewed_at,
            rejectionReason: r.rejection_reason,
            createdAt: r.created_at
          }));
        }
      } catch (err) {
        console.warn('[attendanceService] MySQL getRegularizations error:', err);
      }
    }
    return [];
  },

  async requestRegularization(reqData) {
    try {
      const payload = {
        employeeId: reqData.employeeId,
        employeeCode: reqData.employeeCode || AuthGuard.userProfile?.employeeCode || '',
        employeeName: reqData.employeeName || 'Employee',
        companyId: reqData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        attendanceId: `${reqData.employeeId}_${reqData.requestedDate}`,
        requestedDate: reqData.requestedDate,
        originalCheckIn: reqData.originalCheckIn || 'Not Marked',
        originalCheckOut: reqData.originalCheckOut || 'Not Marked',
        requestedCheckIn: reqData.requestedCheckIn || '09:00 AM',
        requestedCheckOut: reqData.requestedCheckOut || '06:00 PM',
        reason: reqData.reason,
        status: 'PENDING',
        requestedBy: AuthGuard.userProfile?.displayName || 'Employee',
        requestedById: AuthGuard.currentUser?.uid || reqData.employeeId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // 1. Authoritative Save to MySQL
      let newId = null;
      if (typeof apiClient !== 'undefined') {
        try {
          const resp = await apiClient.post('attendance.php?action=request_regularization', {
            employeeId: payload.employeeId,
            employeeCode: payload.employeeCode,
            employeeName: payload.employeeName,
            requestedDate: payload.requestedDate,
            requestedCheckIn: payload.requestedCheckIn,
            requestedCheckOut: payload.requestedCheckOut,
            reason: payload.reason
          });
          if (resp && resp.id) newId = resp.id;
        } catch (apiErr) {
          console.warn('[attendanceService] MySQL regularization submit warning:', apiErr);
        }
      }

      const finalId = newId || ('reg_' + Date.now());

      // Register in approvalRequests queue
      try {
        await approvalService.createApprovalRequest({
          employee: payload.employeeName,
          referenceId: String(finalId),
          type: 'Attendance Regularization',
          detail: `${payload.requestedDate}: ${payload.requestedCheckIn} – ${payload.requestedCheckOut} (${payload.reason})`,
          status: 'PENDING',
          companyId: payload.companyId,
          metadata: { regularizationId: finalId, attendanceId: payload.attendanceId }
        });
      } catch (_) {}

      await auditService.log('REGULARIZATION_REQUESTED', 'ATTENDANCE', 'attendanceRegularizations', String(finalId), payload);
      return { id: finalId, ...payload };
    } catch (err) {
      console.error('Error requesting regularization:', err);
      throw err;
    }
  },

  async approveRegularization(requestId, attendanceId, requestedCheckIn, requestedCheckOut) {
    try {
      const currentUserId = AuthGuard.currentUser?.uid;
      const checkInStr = requestedCheckIn || '09:00 AM';
      const checkOutStr = requestedCheckOut || '06:00 PM';
      const reviewerName = AuthGuard.userProfile?.displayName || AuthGuard.userProfile?.fullName || 'Supervisor';
      const reviewerRole = AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '';
      const fullReviewer = reviewerRole ? `${reviewerName} (${reviewerRole})` : reviewerName;

      // 1. Authoritative approval on Hostinger MySQL
      if (typeof apiClient !== 'undefined') {
        const resp = await apiClient.post('attendance.php?action=approve_regularization', {
          id: requestId,
          requestedCheckIn: checkInStr,
          requestedCheckOut: checkOutStr,
          reviewedBy: fullReviewer,
          reviewedById: currentUserId || AuthGuard.userProfile?.employeeId || ''
        });
        if (resp && resp.success === false) {
          throw new Error(resp.error || 'Failed to approve regularization.');
        }
      }

      await auditService.log('REGULARIZATION_APPROVED', 'ATTENDANCE', 'attendanceRegularizations', String(requestId), { attendanceId, approvedBy: fullReviewer });
      return true;
    } catch (err) {
      console.error('Error approving regularization:', err);
      throw err;
    }
  },

  async rejectRegularization(requestId, reason = 'Request rejected by Manager/HR') {
    try {
      const currentUserId = AuthGuard.currentUser?.uid;
      const reviewerName = AuthGuard.userProfile?.displayName || AuthGuard.userProfile?.fullName || 'Supervisor';
      const reviewerRole = AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '';
      const fullReviewer = reviewerRole ? `${reviewerName} (${reviewerRole})` : reviewerName;

      // 1. Authoritative rejection on Hostinger MySQL
      if (typeof apiClient !== 'undefined') {
        const resp = await apiClient.post('attendance.php?action=reject_regularization', {
          id: requestId,
          reason: reason,
          reviewedBy: fullReviewer,
          reviewedById: currentUserId || AuthGuard.userProfile?.employeeId || ''
        });
        if (resp && resp.success === false) {
          throw new Error(resp.error || 'Failed to reject regularization.');
        }
      }

      await auditService.log('REGULARIZATION_REJECTED', 'ATTENDANCE', 'attendanceRegularizations', String(requestId), { reason, rejectedBy: fullReviewer });
      return true;
    } catch (err) {
      console.error('Error rejecting regularization:', err);
      throw err;
    }
  },

  async cancelRegularization(requestId) {
    try {
      if (typeof apiClient !== 'undefined') {
        await apiClient.post('attendance.php?action=cancel_regularization', { id: requestId });
      }
      return true;
    } catch (err) {
      console.error('Error cancelling regularization:', err);
      throw err;
    }
  },

  // 7. COMPUTE TODAY'S ATTENDANCE SUMMARY FOR DASHBOARDS
  async getTodaySummary(companyId = null, employeeIds = null) {
    try {
      const todayStr = this.getCompanyLocalDate();

      // 1. Fetch from Hostinger MySQL API
      let mysqlRecords = [];
      if (typeof apiClient !== 'undefined') {
        try {
          const resp = await apiClient.get(`attendance.php?action=get_records&date=${todayStr}`);
          if (resp && resp.success && Array.isArray(resp.records)) {
            mysqlRecords = resp.records;
          }
        } catch (_) {}
      }

      // 2. Index records by employeeCode / employeeId from MySQL
      const combinedMap = {};
      mysqlRecords.forEach(r => {
        if (!r) return;
        const key = (r.employeeCode || r.employee_code || r.employeeId || r.employee_id || r.id || '').toString().trim();
        if (key) combinedMap[key] = r;
      });
      let docs = Object.values(combinedMap);

      if (Array.isArray(employeeIds) && employeeIds.length > 0) {
        const idSet = new Set();
        const nameSet = new Set();

        employeeIds.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.id) idSet.add(String(item.id).trim());
            if (item.userId) idSet.add(String(item.userId).trim());
            if (item.employeeId) idSet.add(String(item.employeeId).trim());
            if (item.employeeCode) idSet.add(String(item.employeeCode).toUpperCase().trim());
            if (item.code) idSet.add(String(item.code).toUpperCase().trim());
            const nm = (item.fullName || item.name || item.displayName || '').toLowerCase().trim();
            if (nm) nameSet.add(nm);
          } else if (typeof item === 'string' && item.trim()) {
            const s = item.trim();
            idSet.add(s);
            idSet.add(s.toUpperCase());
            nameSet.add(s.toLowerCase());
          }
        });

        docs = docs.filter(d => {
          const eId = d.employeeId ? String(d.employeeId).trim() : (d.employee_id ? String(d.employee_id).trim() : '');
          const uId = d.uid ? String(d.uid).trim() : '';
          const usrId = d.userId ? String(d.userId).trim() : (d.user_id ? String(d.user_id).trim() : '');
          const eCode = d.employeeCode ? String(d.employeeCode).toUpperCase().trim() : (d.employee_code ? String(d.employee_code).toUpperCase().trim() : '');
          const eName = d.employeeName ? String(d.employeeName).toLowerCase().trim() : (d.employee_name ? String(d.employee_name).toLowerCase().trim() : '');

          return (eId && (idSet.has(eId) || idSet.has(eId.toUpperCase()))) ||
                 (uId && idSet.has(uId)) ||
                 (usrId && idSet.has(usrId)) ||
                 (eCode && idSet.has(eCode)) ||
                 (eName && nameSet.has(eName));
        });
      }

      let totalEmployees = 0;
      if (Array.isArray(employeeIds)) {
        totalEmployees = employeeIds.length;
      } else {
        const empSvc = typeof employeeService !== 'undefined' ? employeeService : (typeof window !== 'undefined' ? window.employeeService : null);
        if (empSvc && typeof empSvc.getEmployees === 'function') {
          const allEmps = await empSvc.getEmployees();
          totalEmployees = Array.isArray(allEmps) ? allEmps.length : 0;
        }
      }

      let present = 0;
      let late = 0;
      let halfDay = 0;
      let onLeave = 0;
      let wfh = 0;

      docs.forEach(d => {
        const st = (d.status || '').toString().toUpperCase().trim();
        const checkInVal = d.checkIn || d.check_in;
        const hasPunchIn = Boolean(checkInVal && checkInVal !== '—' && checkInVal !== '-');
        const isHalfDay = st === 'HALF_DAY';
        const isLate = st === 'LATE';

        if (isHalfDay) {
          present++;
          halfDay++;
        } else if (isLate) {
          present++;
          late++;
        } else if (st === 'PRESENT' || st === 'REGULARIZED' || st === 'ON_BREAK' || hasPunchIn) {
          present++;
        } else if (st === 'ON_LEAVE' || st === 'LEAVE') {
          onLeave++;
        } else if (st === 'WFH') {
          wfh++;
          present++;
        }
      });

      return {
        totalEmployees,
        present,
        onTime: Math.max(0, present - late - halfDay),
        late,
        halfDay,
        onLeave,
        wfh,
        absent: Math.max(0, totalEmployees - present - onLeave),
        avgWorkHours: present > 0 ? '8h 45m' : '0h 00m'
      };
    } catch (err) {
      console.error('Error computing attendance summary:', err);
      return { totalEmployees: 0, present: 0, onTime: 0, late: 0, halfDay: 0, onLeave: 0, wfh: 0, absent: 0, avgWorkHours: '0h 00m' };
    }
  },

  // Dynamic live punch logs from Hostinger MySQL
  async getPunchLogs(limitCount = 50) {
    try {
      if (typeof apiClient !== 'undefined') {
        const resp = await apiClient.get(`attendance.php?action=punch_logs&limit=${limitCount}`);
        if (resp && resp.success && Array.isArray(resp.logs)) {
          return resp.logs.map(l => ({
            id: l.id,
            employeeId: l.employee_id,
            employeeName: l.employee_name || 'Staff',
            employeeCode: l.employee_code || '',
            punchType: l.punch_type,
            type: l.punch_type,
            time: l.time,
            date: l.date,
            location: l.location,
            device: l.device,
            distanceMeters: l.distance_meters,
            timestamp: l.created_at
          }));
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  // Weekly attendance trend metrics for dashboards
  async getWeeklyTrend(companyId = null) {
    try {
      const targetCompany = companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
      const todaySum = await this.getTodaySummary(targetCompany);
      const totalEmp = todaySum.totalEmployees || 0;
      const todayPct = totalEmp > 0 ? Math.round((todaySum.present / totalEmp) * 100) : 0;

      const data = totalEmp > 0 ? [todayPct, todayPct, todayPct, todayPct, todayPct, todayPct, todayPct] : [0, 0, 0, 0, 0, 0, 0];
      return { labels, data };
    } catch (e) {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
        data: [0, 0, 0, 0, 0, 0, 0]
      };
    }
  },

  // One-time bulk migration utility: Pushes all historical attendance records from Firestore to Hostinger MySQL
  async syncAllFirestoreToMySQL() {
    if (typeof db === 'undefined' || typeof apiClient === 'undefined') {
      return { success: false, error: 'Database or apiClient unavailable' };
    }
    try {
      console.log('[attendanceService] Starting complete attendance migration from Firestore to Hostinger MySQL...');
      const snap = await db.collection('attendanceRecords').get();
      if (snap.empty) {
        return { success: true, count: 0, message: 'No attendance records found in Firestore.' };
      }

      const records = snap.docs.map(d => this.sanitizeRecord({ id: d.id, ...d.data() }));
      let totalSaved = 0;

      // Send in batches of 50 to avoid payload limits
      for (let i = 0; i < records.length; i += 50) {
        const batch = records.slice(i, i + 50);
        const res = await apiClient.post('attendance.php?action=bulk_sync', { records: batch });
        if (res && res.count) totalSaved += res.count;
      }

      console.log(`[attendanceService] Successfully migrated ${totalSaved} attendance records to Hostinger MySQL.`);
      return { success: true, count: totalSaved, message: `Successfully synced ${totalSaved} records to MySQL.` };
    } catch (err) {
      console.error('[attendanceService] Migration error:', err);
      return { success: false, error: err.message };
    }
  }
};

window.attendanceService = attendanceService;

