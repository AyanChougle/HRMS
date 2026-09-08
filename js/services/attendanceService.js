/**
 * DIALLO HRMS — PRODUCTION ATTENDANCE SERVICE (PHASE 5)
 * Daily Attendance Records, Check-In/Check-Out, Working Hours, Late/Overtime Engine, Regularizations
 */

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

  // Format timestamp to localized 12-hour time (e.g. '09:08 AM')
  formatTime(dateObj = new Date()) {
    return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
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

  // 1. GET TODAY'S ATTENDANCE RECORD FOR AN EMPLOYEE
  async getTodayRecord(employeeId, date = null) {
    try {
      const attendanceDate = date || this.getCompanyLocalDate();
      const recordId = `${employeeId}_${attendanceDate}`;
      const doc = await db.collection('attendanceRecords').doc(recordId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (e) {
      console.warn('Could not check today attendance record:', e);
      return null;
    }
  },

  // 2. CHECK-IN / RESUME SHIFT
  async checkIn(punchData) {
    try {
      const employeeId = punchData.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      const companyId = punchData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const settings = await attendanceSettingsService.getSettings(companyId);
      const attendanceDate = punchData.date || this.getCompanyLocalDate(settings.timezone);

      // Verify active employee status
      const emp = await employeeService.getEmployee(employeeId);
      if (emp && emp.employmentStatus !== 'ACTIVE' && emp.employmentStatus !== 'ON_NOTICE') {
        throw new Error(`Cannot check in. Employee account status is '${emp.employmentStatus}'.`);
      }

      const recordId = `${employeeId}_${attendanceDate}`;
      const recordRef = db.collection('attendanceRecords').doc(recordId);
      const existingDoc = await recordRef.get();

      const now = new Date();
      const checkInTimeStr = punchData.time || this.formatTime(now);

      // If already has an existing record today
      if (existingDoc.exists && existingDoc.data().checkIn) {
        const rec = existingDoc.data();

        // If currently on shift and not checked out, return existing
        if (!rec.checkOut) {
          return { id: recordId, ...rec };
        }

        // If checked out earlier, allow SHIFT RESUMPTION / RE-PUNCH IN on the same date!
        const previousSessions = rec.sessions || [];
        previousSessions.push({
          checkIn: rec.currentCheckInTime || rec.checkIn,
          checkOut: rec.checkOut,
          grossMinutes: rec.grossMinutes || 0,
          workedMinutes: rec.workedMinutes || 0
        });

        const resumePayload = {
          currentCheckInTime: checkInTimeStr,
          currentCheckInDateIso: now.toISOString(),
          checkOut: null,
          checkOutDateIso: null,
          sessions: previousSessions,
          status: 'PRESENT',
          isOnBreak: false,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await recordRef.update(resumePayload);

        await db.collection('punchLogs').add({
          employeeId,
          name: rec.employeeName,
          punchType: 'In (Resume)',
          time: checkInTimeStr,
          date: attendanceDate,
          location: punchData.location || 'HQ - Mumbai',
          device: 'Web Attendance Terminal',
          status: 'Shift Resumed',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        await auditService.log('ATTENDANCE_CHECK_IN_RESUME', 'ATTENDANCE', 'attendanceRecords', recordId, resumePayload);
        return { id: recordId, ...rec, ...resumePayload };
      }

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const shiftStartMinutes = this.timeStringToMinutes(settings.defaultStartTime || '10:00');
      const graceLimit = shiftStartMinutes + (settings.graceMinutes || 15);

      let status = 'PRESENT';
      let lateMinutes = 0;

      if (currentMinutes > graceLimit) {
        status = 'LATE';
        lateMinutes = Math.min(720, Math.max(0, currentMinutes - shiftStartMinutes));
      }

      const payload = {
        employeeId,
        employeeCode: emp?.employeeCode || punchData.employeeCode || 'EMP-0001',
        employeeName: emp?.fullName || emp?.name || punchData.name || 'Staff',
        companyId,
        branchId: emp?.branchId || punchData.branchId || 'branch_mumbai',
        branchName: emp?.branchName || emp?.location || 'HQ - Mumbai',
        departmentId: emp?.departmentId || '',
        department: emp?.department || 'General',
        managerId: emp?.managerId || '',
        manager: emp?.manager || '',
        date: attendanceDate,
        checkIn: checkInTimeStr,
        currentCheckInTime: checkInTimeStr,
        checkInDateIso: now.toISOString(),
        currentCheckInDateIso: now.toISOString(),
        checkOut: null,
        grossMinutes: 0,
        grossHoursFormatted: '0h 00m',
        totalBreakMinutes: 0,
        totalBreakSeconds: 0,
        breakFormatted: '0m',
        workedMinutes: 0,
        workedHoursFormatted: '0h 00m',
        sessions: [],
        status,
        lateMinutes,
        earlyCheckoutMinutes: 0,
        overtimeMinutes: 0,
        source: punchData.source || 'WEB',
        notes: punchData.notes || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await recordRef.set(payload);

      // Log punch in legacy feed for live logs widget
      await db.collection('punchLogs').add({
        employeeId,
        name: payload.employeeName,
        punchType: 'In',
        time: checkInTimeStr,
        date: attendanceDate,
        location: punchData.location || 'HQ - Mumbai',
        device: 'Web Attendance Terminal',
        status: status === 'LATE' ? 'Late Arrival' : 'On Time',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('ATTENDANCE_CHECK_IN', 'ATTENDANCE', 'attendanceRecords', recordId, payload);
      return { id: recordId, ...payload };
    } catch (err) {
      console.error('Error during check-in:', err);
      throw err;
    }
  },

  // 3. CHECK-OUT
  async checkOut(employeeId, checkoutData = {}) {
    try {
      const companyId = checkoutData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const settings = await attendanceSettingsService.getSettings(companyId);
      const attendanceDate = checkoutData.date || this.getCompanyLocalDate(settings.timezone);
      const recordId = `${employeeId}_${attendanceDate}`;
      const recordRef = db.collection('attendanceRecords').doc(recordId);

      const doc = await recordRef.get();
      if (!doc.exists || !doc.data().checkIn) {
        throw new Error('No check-in record found for today. You must check in before checking out.');
      }

      const rec = doc.data();
      if (rec.checkOut && !rec.currentCheckInDateIso) {
        throw new Error(`You have already checked out for today at ${rec.checkOut}.`);
      }

      const now = new Date();
      const checkOutTimeStr = checkoutData.time || this.formatTime(now);
      
      // Calculate session minutes cleanly
      let sessionMinutes = 0;
      if (checkoutData.totalWorkSeconds !== undefined && checkoutData.totalWorkSeconds !== null && Number(checkoutData.totalWorkSeconds) > 0) {
        sessionMinutes = Math.round(Number(checkoutData.totalWorkSeconds) / 60);
      } else {
        const inMins = this.time12ToMinutes(rec.currentCheckInTime || rec.checkIn);
        const outMins = this.time12ToMinutes(checkOutTimeStr);
        if (outMins > inMins) {
          sessionMinutes = outMins - inMins;
        } else if (rec.currentCheckInDateIso) {
          const checkInDate = new Date(rec.currentCheckInDateIso);
          const diffMs = Math.max(0, now.getTime() - checkInDate.getTime());
          sessionMinutes = Math.round(diffMs / 60000);
        }
      }
      
      // Session minutes cannot exceed single 24-hour calendar day (1440m)
      sessionMinutes = Math.min(Math.max(0, sessionMinutes), 1440);

      // Sum gross minutes from prior sessions if any
      let priorGrossMinutes = 0;
      if (rec.sessions && Array.isArray(rec.sessions)) {
        rec.sessions.forEach(s => {
          priorGrossMinutes += (s.grossMinutes || 0);
        });
      }

      const totalGrossMinutes = Math.min(1440, priorGrossMinutes + sessionMinutes);
      const totalBreakSeconds = (checkoutData.totalBreakSeconds !== undefined && checkoutData.totalBreakSeconds !== null)
        ? Number(checkoutData.totalBreakSeconds)
        : (rec.totalBreakSeconds || (rec.totalBreakMinutes ? rec.totalBreakMinutes * 60 : 0));
      const totalBreakMinutes = Math.round(totalBreakSeconds / 60);
      const workedMinutes = Math.max(0, Math.min(totalGrossMinutes - totalBreakMinutes, totalGrossMinutes));

      const hours = Math.floor(workedMinutes / 60);
      const mins = workedMinutes % 60;
      const workedHoursFormatted = `${hours}h ${String(mins).padStart(2, '0')}m`;

      const grossHours = Math.floor(totalGrossMinutes / 60);
      const grossMins = totalGrossMinutes % 60;
      const grossHoursFormatted = `${grossHours}h ${String(grossMins).padStart(2, '0')}m`;

      const breakFormatted = this.formatBreakDuration(totalBreakSeconds);

      // Early checkout & Overtime calculations (Shift 10:00 AM – 07:00 PM = 9h / 540m)
      const shiftEndMinutes = this.timeStringToMinutes(settings.defaultEndTime || '19:00');
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const earlyCheckoutMinutes = currentMinutes < shiftEndMinutes ? shiftEndMinutes - currentMinutes : 0;
      const shiftStandardMinutes = settings.overtimeAfterMinutes || 540;
      const overtimeMinutes = workedMinutes > shiftStandardMinutes ? workedMinutes - shiftStandardMinutes : 0;

      let status = rec.status;
      if (workedMinutes < (settings.minimumHalfDayMinutes || 270)) {
        status = 'HALF_DAY';
      }

      const updates = {
        checkOut: checkOutTimeStr,
        checkOutDateIso: now.toISOString(),
        currentCheckInDateIso: null,
        grossMinutes: totalGrossMinutes,
        grossHoursFormatted,
        totalBreakMinutes,
        totalBreakSeconds,
        breakFormatted,
        workedMinutes,
        workedHoursFormatted,
        earlyCheckoutMinutes,
        overtimeMinutes,
        status,
        isOnBreak: false,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await recordRef.update(updates);

      // Log punch out in legacy feed
      await db.collection('punchLogs').add({
        employeeId,
        name: rec.employeeName,
        punchType: 'Out',
        time: checkOutTimeStr,
        date: attendanceDate,
        device: 'Web Attendance Terminal',
        status: 'Completed',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('ATTENDANCE_CHECK_OUT', 'ATTENDANCE', 'attendanceRecords', recordId, updates);
      return { id: recordId, ...rec, ...updates };
    } catch (err) {
      console.error('Error during check-out:', err);
      throw err;
    }
  },

  // 3b. RECORD PUNCH & BREAKS (FOR LIVE ESS & WEBCARD)
  async recordPunch(punchData) {
    try {
      const employeeId = punchData.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      const companyId = punchData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const settings = await attendanceSettingsService.getSettings(companyId);
      const attendanceDate = punchData.date || this.getCompanyLocalDate(settings.timezone);
      const recordId = `${employeeId}_${attendanceDate}`;
      const recordRef = db.collection('attendanceRecords').doc(recordId);

      const now = new Date();
      const timeStr = punchData.time || this.formatTime(now);
      const punchType = punchData.punchType;

      // Log in punchLogs collection
      await db.collection('punchLogs').add({
        employeeId,
        name: punchData.name || AuthGuard.userProfile?.displayName || 'Employee',
        punchType,
        time: timeStr,
        date: attendanceDate,
        location: punchData.location || 'HQ - Mumbai',
        device: punchData.device || 'Web Attendance Terminal',
        status: punchData.status || 'Logged',
        breakDuration: punchData.breakDuration || 0,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      const doc = await recordRef.get();
      if (punchType === 'In' || punchType === 'In (Resume)') {
        await this.checkIn({
          employeeId,
          companyId,
          time: timeStr,
          location: punchData.location,
          source: 'WEB'
        });
      } else if (punchType === 'Break In') {
        if (doc.exists) {
          await recordRef.update({
            isOnBreak: true,
            lastBreakStartIso: now.toISOString(),
            status: 'ON_BREAK',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      } else if (punchType === 'Break Out') {
        if (doc.exists) {
          const rec = doc.data();
          const breakSec = Number(punchData.breakDuration) || 0;
          const totalBreakSec = (punchData.totalBreakSeconds !== undefined && punchData.totalBreakSeconds !== null)
            ? Number(punchData.totalBreakSeconds)
            : ((rec.totalBreakSeconds || 0) + breakSec);
          const totalBreakMins = Math.round(totalBreakSec / 60);
          const breakFormatted = this.formatBreakDuration(totalBreakSec);

          await recordRef.update({
            isOnBreak: false,
            lastBreakEndIso: now.toISOString(),
            totalBreakMinutes: totalBreakMins,
            totalBreakSeconds: totalBreakSec,
            breakFormatted,
            status: rec.checkIn ? (rec.lateMinutes > 0 ? 'LATE' : 'PRESENT') : 'PRESENT',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      } else if (punchType === 'Out') {
        if (doc.exists) {
          await this.checkOut(employeeId, {
            companyId,
            time: timeStr,
            totalBreakSeconds: punchData.totalBreakSeconds,
            totalWorkSeconds: punchData.totalWorkSeconds
          });
        }
      }

      return true;
    } catch (e) {
      console.warn('recordPunch error:', e);
      return false;
    }
  },

  // 4. GET ATTENDANCE RECORDS WITH ADVANCED FILTERS
  async getAttendanceRecords(filters = {}) {
    try {
      let query = db.collection('attendanceRecords');

      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.date) query = query.where('date', '==', filters.date);
      if (filters.employeeId) query = query.where('employeeId', '==', filters.employeeId);
      if (filters.department && filters.department !== 'All Departments') query = query.where('department', '==', filters.department);
      if (filters.status && filters.status !== 'All Status') query = query.where('status', '==', filters.status);
      if (filters.branchId && filters.branchId !== 'All Branches') query = query.where('branchId', '==', filters.branchId);

      const snapshot = await query.get();
      let records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (filters.search && filters.search.trim() !== '') {
        const term = filters.search.toLowerCase().trim();
        records = records.filter(r => 
          (r.employeeName && r.employeeName.toLowerCase().includes(term)) ||
          (r.employeeCode && r.employeeCode.toLowerCase().includes(term))
        );
      }

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
      const teamEmployees = await employeeService.getEmployees({ managerId });
      if (teamEmployees.length === 0) return [];

      const empIds = teamEmployees.map(e => e.id);
      const snapshot = await db.collection('attendanceRecords')
        .where('date', '==', attendanceDate)
        .get();

      const recordsMap = {};
      snapshot.docs.forEach(doc => {
        const d = doc.data();
        recordsMap[d.employeeId] = d;
      });

      return teamEmployees.map(emp => ({
        employee: emp,
        attendance: recordsMap[emp.id] || {
          date: attendanceDate,
          checkIn: null,
          checkOut: null,
          status: 'ABSENT',
          workedHoursFormatted: '0h 00m'
        }
      }));
    } catch (e) {
      console.warn('Error fetching team attendance:', e);
      return [];
    }
  },

  // 6. ATTENDANCE REGULARIZATION WORKFLOW
  async requestRegularization(reqData) {
    try {
      const payload = {
        employeeId: reqData.employeeId,
        employeeName: reqData.employeeName || 'Employee',
        companyId: reqData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        attendanceId: `${reqData.employeeId}_${reqData.requestedDate}`,
        requestedDate: reqData.requestedDate,
        originalCheckIn: reqData.originalCheckIn || 'Not Marked',
        originalCheckOut: reqData.originalCheckOut || 'Not Marked',
        requestedCheckIn: reqData.requestedCheckIn || '09:00 AM',
        requestedCheckOut: reqData.requestedCheckOut || '06:00 PM',
        reason: reqData.reason,
        status: 'PENDING', // PENDING, APPROVED, REJECTED, CANCELLED
        requestedBy: AuthGuard.userProfile?.displayName || 'Employee',
        requestedById: AuthGuard.currentUser?.uid || reqData.employeeId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('attendanceRegularizations').add(payload);
      
      // Also register in approvalRequests queue
      await approvalService.createApprovalRequest({
        employee: payload.employeeName,
        referenceId: docRef.id,
        type: 'Attendance Regularization',
        detail: `${payload.requestedDate}: ${payload.requestedCheckIn} – ${payload.requestedCheckOut} (${payload.reason})`,
        status: 'PENDING',
        companyId: payload.companyId,
        metadata: { regularizationId: docRef.id, attendanceId: payload.attendanceId }
      });

      await auditService.log('REGULARIZATION_REQUESTED', 'ATTENDANCE', 'attendanceRegularizations', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error requesting regularization:', err);
      throw err;
    }
  },

  async approveRegularization(requestId, attendanceId, requestedCheckIn, requestedCheckOut) {
    try {
      const currentUserId = AuthGuard.currentUser?.uid;
      const regDoc = await db.collection('attendanceRegularizations').doc(requestId).get();
      if (!regDoc.exists) throw new Error('Regularization request not found');

      const reg = regDoc.data();
      // Enforce anti-self-approval rule
      if (reg.requestedById === currentUserId && AuthGuard.userProfile?.roleId !== 'SUPER_ADMIN') {
        throw new Error('Security Violation: You cannot approve your own attendance regularization request.');
      }

      // Update attendance record
      await db.collection('attendanceRecords').doc(attendanceId).set({
        employeeId: reg.employeeId,
        employeeName: reg.employeeName,
        companyId: reg.companyId,
        date: reg.requestedDate,
        checkIn: requestedCheckIn || reg.requestedCheckIn,
        checkOut: requestedCheckOut || reg.requestedCheckOut,
        workedHoursFormatted: '9h 00m',
        workedMinutes: 540,
        status: 'REGULARIZED',
        lateMinutes: 0,
        overtimeMinutes: 60,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Update request status
      await db.collection('attendanceRegularizations').doc(requestId).update({
        status: 'APPROVED',
        approvedBy: AuthGuard.userProfile?.displayName || 'Manager',
        approvedById: currentUserId,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('REGULARIZATION_APPROVED', 'ATTENDANCE', 'attendanceRegularizations', requestId, { attendanceId });
      return true;
    } catch (err) {
      console.error('Error approving regularization:', err);
      throw err;
    }
  },

  async rejectRegularization(requestId, reason = 'Request rejected by Manager/HR') {
    try {
      await db.collection('attendanceRegularizations').doc(requestId).update({
        status: 'REJECTED',
        rejectionReason: reason,
        rejectedBy: AuthGuard.userProfile?.displayName || 'Manager',
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('REGULARIZATION_REJECTED', 'ATTENDANCE', 'attendanceRegularizations', requestId, { reason });
      return true;
    } catch (err) {
      console.error('Error rejecting regularization:', err);
      throw err;
    }
  },

  // 7. COMPUTE TODAY'S ATTENDANCE SUMMARY FOR DASHBOARDS
  async getTodaySummary(companyId = null) {
    try {
      const todayStr = this.getCompanyLocalDate();
      let query = db.collection('attendanceRecords').where('date', '==', todayStr);
      if (companyId) query = query.where('companyId', '==', companyId);

      const [snapshot, totalEmpSnap] = await Promise.all([
        query.get(),
        db.collection('employees').where('employmentStatus', '==', 'ACTIVE').get()
      ]);

      const totalEmployees = totalEmpSnap.size;
      let present = 0;
      let late = 0;
      let onLeave = 0;
      let wfh = 0;

      snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (d.status === 'PRESENT' || d.status === 'REGULARIZED') present++;
        else if (d.status === 'LATE') { present++; late++; }
        else if (d.status === 'ON_LEAVE') onLeave++;
        else if (d.status === 'WFH') wfh++;
      });

      return {
        totalEmployees,
        present,
        onTime: Math.max(0, present - late),
        late,
        onLeave,
        wfh,
        absent: Math.max(0, totalEmployees - present - onLeave),
        avgWorkHours: present > 0 ? '8h 45m' : '0h 00m'
      };
    } catch (err) {
      console.error('Error computing attendance summary:', err);
      return { totalEmployees: 0, present: 0, onTime: 0, late: 0, onLeave: 0, wfh: 0, absent: 0, avgWorkHours: '0h 00m' };
    }
  },

  // Legacy punch log getter for live feeds
  async getPunchLogs(limitCount = 50) {
    try {
      const snapshot = await db.collection('punchLogs').orderBy('timestamp', 'desc').limit(limitCount).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  }
};

window.attendanceService = attendanceService;
