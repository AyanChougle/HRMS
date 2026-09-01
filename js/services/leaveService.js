/**
 * DIALLO HRMS — PRODUCTION LEAVE MANAGEMENT SERVICE (PHASE 6)
 * Leave Applications, Working-Day Deductions, Quota Ledgers, Anti-Self Approval, and Attendance Integration
 */

const leaveService = {
  // 1. DYNAMIC WORKING-DAY CALCULATION
  // Calculates net working days between start & end date excluding holidays and weekly offs
  async calculateLeaveDays(startDateStr, endDateStr, isHalfDay = false, companyId = 'comp_diallo_india') {
    if (!startDateStr || !endDateStr) return 0;
    if (isHalfDay) return 0.5;

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (start > end) return 0;

    try {
      const [holidays, settings] = await Promise.all([
        attendanceSettingsService.getHolidays(companyId),
        attendanceSettingsService.getSettings(companyId)
      ]);

      const holidayDates = new Set(holidays.map(h => h.date));
      const weeklyOffs = new Set(settings.weeklyOffDays || ['Sunday']);

      let workingDays = 0;
      const cur = new Date(start);

      while (cur <= end) {
        const dateString = cur.toISOString().slice(0, 10);
        const dayName = cur.toLocaleDateString('en-US', { weekday: 'long' });

        // If not a weekly off and not a registered holiday, count as working leave day
        if (!weeklyOffs.has(dayName) && !holidayDates.has(dateString)) {
          workingDays++;
        }
        cur.setDate(cur.getDate() + 1);
      }

      return workingDays;
    } catch (e) {
      console.warn('Working days calculation fallback:', e);
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, diffDays);
    }
  },

  // 2. CHECK CONFLICTING OVERLAPPING LEAVE
  async checkLeaveConflict(employeeId, startDate, endDate, excludeDocId = null) {
    try {
      const snapshot = await db.collection('leaveRequests')
        .where('employeeId', '==', employeeId)
        .where('status', 'in', ['PENDING', 'APPROVED'])
        .get();

      for (const doc of snapshot.docs) {
        if (excludeDocId && doc.id === excludeDocId) continue;
        const d = doc.data();
        if (startDate <= d.endDate && endDate >= d.startDate) {
          return { hasConflict: true, conflictLeave: d };
        }
      }
      return { hasConflict: false };
    } catch (e) {
      console.warn('Leave conflict check warning:', e);
      return { hasConflict: false };
    }
  },

  // 3. GET OR INITIALIZE EMPLOYEE LEAVE BALANCES FOR A GIVEN YEAR
  async getEmployeeBalances(employeeId, year = 2026, companyId = 'comp_diallo_india') {
    try {
      const balanceDocId = `${employeeId}_${year}`;
      const doc = await db.collection('leaveBalances').doc(balanceDocId).get();

      if (doc.exists) {
        return doc.data().balances || {};
      }

      // Initialize default statutory quota balances for the employee
      const leaveTypes = await leavePolicyService.getLeaveTypes(companyId);
      const initialBalances = {};

      leaveTypes.forEach(lt => {
        initialBalances[lt.code] = {
          leaveTypeId: lt.id,
          code: lt.code,
          name: lt.name,
          allocated: lt.annualQuota,
          used: 0,
          pending: 0,
          available: lt.annualQuota,
          carriedForward: 0
        };
      });

      const payload = {
        employeeId,
        companyId,
        year,
        balances: initialBalances,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('leaveBalances').doc(balanceDocId).set(payload);
      return initialBalances;
    } catch (e) {
      console.warn('Could not fetch leave balances:', e);
      return {
        AL: { code: 'AL', name: 'Annual Leave', allocated: 18, used: 0, available: 18 },
        CL: { code: 'CL', name: 'Casual Leave', allocated: 12, used: 0, available: 12 },
        SL: { code: 'SL', name: 'Sick Leave', allocated: 12, used: 0, available: 12 }
      };
    }
  },

  // 4. APPLY FOR LEAVE
  async applyLeave(leaveData) {
    try {
      const employeeId = leaveData.employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      const companyId = leaveData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const year = new Date(leaveData.startDate).getFullYear() || 2026;

      // Verify active employee
      const emp = await employeeService.getEmployee(employeeId);
      if (emp && emp.employmentStatus !== 'ACTIVE' && emp.employmentStatus !== 'ON_NOTICE') {
        throw new Error(`Cannot apply for leave. Employee account is '${emp.employmentStatus}'.`);
      }

      // Check date conflicts
      const conflict = await this.checkLeaveConflict(employeeId, leaveData.startDate, leaveData.endDate);
      if (conflict.hasConflict) {
        throw new Error(`Overlapping leave request already exists from ${conflict.conflictLeave.startDate} to ${conflict.conflictLeave.endDate}.`);
      }

      // Calculate working days
      const numberOfDays = await this.calculateLeaveDays(leaveData.startDate, leaveData.endDate, leaveData.halfDay, companyId);
      if (numberOfDays <= 0) {
        throw new Error('Selected date range contains 0 working days (all selected days are weekly offs or holidays).');
      }

      // Check balance availability
      const balances = await this.getEmployeeBalances(employeeId, year, companyId);
      const leaveCode = leaveData.type || leaveData.leaveTypeCode || 'AL';
      const quota = balances[leaveCode];

      if (quota && quota.available < numberOfDays && leaveCode !== 'LWP') {
        throw new Error(`Insufficient leave balance. You have ${quota.available} days available for ${quota.name}, but requested ${numberOfDays} days.`);
      }

      const payload = {
        employeeId,
        employeeCode: emp?.employeeCode || 'EMP-0001',
        employeeName: emp?.fullName || emp?.name || leaveData.employeeName || 'Staff',
        companyId,
        branchId: emp?.branchId || 'branch_mumbai',
        departmentId: emp?.departmentId || '',
        department: emp?.department || 'General',
        managerId: emp?.managerId || '',
        manager: emp?.manager || '',
        leaveTypeCode: leaveCode,
        leaveTypeName: quota?.name || leaveData.leaveTypeName || 'Leave',
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        numberOfDays,
        halfDay: !!leaveData.halfDay,
        halfDayType: leaveData.halfDayType || null, // FIRST_HALF, SECOND_HALF
        reason: leaveData.reason,
        status: 'PENDING', // PENDING, APPROVED, REJECTED, CANCELLED
        attachmentUrl: leaveData.attachmentUrl || null,
        requestedBy: AuthGuard.userProfile?.displayName || 'Employee',
        requestedById: AuthGuard.currentUser?.uid || employeeId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('leaveApplications').add(payload);
      payload.id = docRef.id;

      // Register in approvalRequests queue
      await approvalService.createApprovalRequest({
        employee: payload.employeeName,
        referenceId: docRef.id,
        type: `${payload.leaveTypeName} (${numberOfDays} Days)`,
        detail: `${payload.startDate} to ${payload.endDate}: ${payload.reason}`,
        status: 'PENDING',
        companyId: payload.companyId,
        metadata: { leaveId: docRef.id, employeeId, numberOfDays, leaveCode }
      });

      await auditService.log('LEAVE_REQUESTED', 'LEAVE', 'leaveApplications', docRef.id, payload);
      return payload;
    } catch (err) {
      console.error('Error applying for leave:', err);
      throw err;
    }
  },

  // 5. APPROVE LEAVE REQUEST (WITH ANTI-SELF-APPROVAL AND ATTENDANCE INTEGRATION)
  async approveLeave(leaveId) {
    try {
      const currentUserId = AuthGuard.currentUser?.uid;
      const leaveDoc = await db.collection('leaveApplications').doc(leaveId).get();
      if (!leaveDoc.exists) throw new Error('Leave application not found');

      const leave = leaveDoc.data();
      if (leave.status !== 'PENDING') {
        throw new Error(`Leave application is already ${leave.status}.`);
      }

      // Enforce anti-self-approval
      if (leave.requestedById === currentUserId && AuthGuard.userProfile?.roleId !== 'SUPER_ADMIN') {
        throw new Error('Security Violation: You cannot approve your own leave request.');
      }

      const year = new Date(leave.startDate).getFullYear() || 2026;
      const balanceDocId = `${leave.employeeId}_${year}`;

      // Update Leave Balances in Firestore
      const balanceRef = db.collection('leaveBalances').doc(balanceDocId);
      const balanceDoc = await balanceRef.get();
      if (balanceDoc.exists) {
        const balances = balanceDoc.data().balances || {};
        const code = leave.leaveTypeCode || 'AL';
        if (balances[code]) {
          balances[code].used = (balances[code].used || 0) + leave.numberOfDays;
          balances[code].available = Math.max(0, balances[code].allocated - balances[code].used);
          await balanceRef.update({ balances, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        }
      }

      // Update Leave Status to APPROVED
      await db.collection('leaveApplications').doc(leaveId).update({
        status: 'APPROVED',
        approvedBy: AuthGuard.userProfile?.displayName || 'Manager',
        approvedById: currentUserId,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Synchronize with attendanceRecords (mark dates as ON_LEAVE)
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const cur = new Date(start);

      while (cur <= end) {
        const dateStr = cur.toISOString().slice(0, 10);
        const recordId = `${leave.employeeId}_${dateStr}`;
        const recordRef = db.collection('attendanceRecords').doc(recordId);
        const recDoc = await recordRef.get();

        if (!recDoc.exists || recDoc.data().status === 'ABSENT') {
          await recordRef.set({
            employeeId: leave.employeeId,
            employeeName: leave.employeeName,
            companyId: leave.companyId,
            date: dateStr,
            checkIn: '—',
            checkOut: '—',
            status: 'ON_LEAVE',
            notes: `Approved ${leave.leaveTypeName}`,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
        cur.setDate(cur.getDate() + 1);
      }

      await auditService.log('LEAVE_APPROVED', 'LEAVE', 'leaveApplications', leaveId, { approvedBy: AuthGuard.userProfile?.displayName });
      return true;
    } catch (err) {
      console.error('Error approving leave:', err);
      throw err;
    }
  },

  // 6. REJECT LEAVE REQUEST
  async rejectLeave(leaveId, reason = 'Rejected by Approver') {
    try {
      await db.collection('leaveApplications').doc(leaveId).update({
        status: 'REJECTED',
        rejectionReason: reason,
        rejectedBy: AuthGuard.userProfile?.displayName || 'Approver',
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('LEAVE_REJECTED', 'LEAVE', 'leaveApplications', leaveId, { reason });
      return true;
    } catch (err) {
      console.error('Error rejecting leave:', err);
      throw err;
    }
  },

  // 7. CANCEL UPCOMING APPROVED LEAVE (RESTORES DEDUCTED BALANCE)
  async cancelLeave(leaveId) {
    try {
      const leaveDoc = await db.collection('leaveApplications').doc(leaveId).get();
      if (!leaveDoc.exists) throw new Error('Leave application not found');

      const leave = leaveDoc.data();
      const year = new Date(leave.startDate).getFullYear() || 2026;
      const balanceDocId = `${leave.employeeId}_${year}`;

      // Restore balance if previously approved
      if (leave.status === 'APPROVED') {
        const balanceRef = db.collection('leaveBalances').doc(balanceDocId);
        const balanceDoc = await balanceRef.get();
        if (balanceDoc.exists) {
          const balances = balanceDoc.data().balances || {};
          const code = leave.leaveTypeCode || 'AL';
          if (balances[code]) {
            balances[code].used = Math.max(0, (balances[code].used || 0) - leave.numberOfDays);
            balances[code].available = Math.max(0, balances[code].allocated - balances[code].used);
            await balanceRef.update({ balances, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
          }
        }
      }

      await db.collection('leaveApplications').doc(leaveId).update({
        status: 'CANCELLED',
        cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('LEAVE_CANCELLED', 'LEAVE', 'leaveApplications', leaveId, { cancelledBy: AuthGuard.userProfile?.displayName });
      return true;
    } catch (err) {
      console.error('Error cancelling leave:', err);
      throw err;
    }
  },

  // 8. GET LEAVE REQUESTS WITH MULTI-FILTERS
  async getLeaveRequests(filters = {}) {
    try {
      let query = db.collection('leaveApplications');

      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.employeeId) query = query.where('employeeId', '==', filters.employeeId);
      if (filters.managerId) query = query.where('managerId', '==', filters.managerId);
      if (filters.status && filters.status !== 'All Status') query = query.where('status', '==', filters.status);
      if (filters.leaveTypeCode && filters.leaveTypeCode !== 'All Types') query = query.where('leaveTypeCode', '==', filters.leaveTypeCode);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error getting leave requests:', err);
      return [];
    }
  },

  // 9. COMPUTE TODAY'S LEAVE METRICS FOR DASHBOARDS
  async getLeaveDashboardSummary(companyId = 'comp_diallo_india') {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const snapshot = await db.collection('leaveApplications').where('companyId', '==', companyId).get();

      let onLeaveToday = 0;
      let pendingRequests = 0;
      let approvedCount = 0;
      let rejectedCount = 0;

      snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (d.status === 'PENDING') pendingRequests++;
        else if (d.status === 'APPROVED') {
          approvedCount++;
          if (todayStr >= d.startDate && todayStr <= d.endDate) {
            onLeaveToday++;
          }
        } else if (d.status === 'REJECTED') {
          rejectedCount++;
        }
      });

      return { onLeaveToday, pendingRequests, approvedCount, rejectedCount };
    } catch (e) {
      return { onLeaveToday: 0, pendingRequests: 0, approvedCount: 0, rejectedCount: 0 };
    }
  }
};

window.leaveService = leaveService;
