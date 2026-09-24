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

  // Calculate Tenure-Based Paid Leave (PL) Quota according to Diallo HR Policy:
  // - Below 6 months tenure: 0 Paid Leaves total (0 PL/month)
  // - Above 6 months tenure (6–12 months): 12 Total Paid Leaves (1 PL/month max)
  // - Above 1 year tenure (>12 months): 18 Total Paid Leaves (3 PL/month max)
  // - Leaves CANNOT be carried forward to next year.
  calculatePaidLeaveQuota(joiningDate, asOfDate = new Date()) {
    if (!joiningDate) {
      return {
        allocated: 18,
        monthlyQuota: 3,
        tenureMonths: 24,
        carryForwardAllowed: false,
        maxCarryForward: 0,
        ruleBadge: '18 Paid Leaves (3/mo)',
        ruleExplanation: 'Tenure > 1 year completed • 18 Total PL (3 PL/mo max, no carry-forward)'
      };
    }

    const join = new Date(joiningDate);
    if (isNaN(join.getTime())) {
      return {
        allocated: 18,
        monthlyQuota: 3,
        tenureMonths: 24,
        carryForwardAllowed: false,
        maxCarryForward: 0,
        ruleBadge: '18 Paid Leaves (3/mo)',
        ruleExplanation: 'Tenure > 1 year completed • 18 Total PL (3 PL/mo max, no carry-forward)'
      };
    }

    const now = new Date(asOfDate);

    // Completed tenure in months
    let tenureMonths = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
    if (now.getDate() < join.getDate()) {
      tenureMonths -= 1;
    }
    tenureMonths = Math.max(0, tenureMonths);

    // 1. Below 6 months tenure: 0 Paid Leaves
    if (tenureMonths < 6) {
      return {
        allocated: 0,
        monthlyQuota: 0,
        tenureMonths,
        carryForwardAllowed: false,
        maxCarryForward: 0,
        ruleBadge: '0 Paid Leaves',
        ruleExplanation: `Tenure under 6 months (${tenureMonths}m completed) • 0 PL total (Eligible after 6 months)`
      };
    }

    // 2. Above 6 months and up to 1 year: 12 Total Paid Leaves, 1 PL per month
    if (tenureMonths < 12) {
      return {
        allocated: 12,
        monthlyQuota: 1,
        tenureMonths,
        carryForwardAllowed: false,
        maxCarryForward: 0,
        ruleBadge: '12 Paid Leaves (1/mo)',
        ruleExplanation: `Tenure 6m–1yr (${tenureMonths}m completed) • 12 Total PL (1 PL/month max, no carry-forward)`
      };
    }

    // 3. Above 1 year tenure: 18 Total Paid Leaves, 3 PL per month
    return {
      allocated: 18,
      monthlyQuota: 3,
      tenureMonths,
      carryForwardAllowed: false,
      maxCarryForward: 0,
      ruleBadge: '18 Paid Leaves (3/mo)',
      ruleExplanation: `Tenure > 1 year completed (${Math.floor(tenureMonths / 12)}y ${tenureMonths % 12}m) • 18 Total PL (3 PL/month max, no carry-forward)`
    };
  },

  // Normalize leave code to standard statutory bucket (PL or LWP)
  normalizeLeaveCode(typeStr) {
    if (!typeStr) return 'PL';
    const s = String(typeStr).toUpperCase().trim();
    if (s === 'LWP' || s === 'UNPAID' || s.includes('WITHOUT') || s.includes('LOSS')) {
      return 'LWP';
    }
    return 'PL';
  },

  // 3. GET DYNAMIC EMPLOYEE LEAVE BALANCES FOR A GIVEN YEAR (SINGLE PAID LEAVE SCHEME)
  async getEmployeeBalances(employeeId, year = 2026, companyId = 'comp_diallo_india') {
    try {
      let joiningDate = AuthGuard.userProfile?.dateOfJoining || AuthGuard.userProfile?.joiningDate || '2025-01-15';
      if (employeeId) {
        try {
          const emp = await employeeService.getEmployee(employeeId);
          if (emp && (emp.dateOfJoining || emp.joiningDate || emp.createdAt)) {
            joiningDate = emp.dateOfJoining || emp.joiningDate || emp.createdAt;
          }
        } catch (_) {}
      }

      const quotaInfo = this.calculatePaidLeaveQuota(joiningDate);
      const plAllocated = quotaInfo.allocated;
      const monthlyQuota = quotaInfo.monthlyQuota;

      let plUsed = 0;
      let plPending = 0;
      let lwpUsed = 0;
      let plUsedThisMonth = 0;
      let plPendingThisMonth = 0;

      const currentYear = year || new Date().getFullYear();
      const currentMonth = new Date().getMonth(); // 0-indexed

      // Query leaveApplications to compute dynamic counters
      if (employeeId) {
        const snap = await db.collection('leaveApplications')
          .where('employeeId', '==', employeeId)
          .get();

        snap.docs.forEach(doc => {
          const d = doc.data();
          if (d.status === 'REJECTED' || d.status === 'CANCELLED') return;

          const days = Number(d.numberOfDays) || 1;
          const code = this.normalizeLeaveCode(d.leaveTypeCode || d.type || d.leaveTypeName);
          const lDate = new Date(d.startDate);
          const isCurrentYear = !isNaN(lDate.getTime()) ? lDate.getFullYear() === currentYear : true;
          const isCurrentMonth = !isNaN(lDate.getTime()) ? (lDate.getFullYear() === currentYear && lDate.getMonth() === currentMonth) : false;

          if (code === 'LWP') {
            if (d.status === 'APPROVED' && isCurrentYear) {
              lwpUsed += days;
            }
          } else {
            // All paid leave categories map to the single Paid Leave pool
            if (isCurrentYear) {
              if (d.status === 'APPROVED') {
                plUsed += days;
              } else if (d.status === 'PENDING') {
                plPending += days;
              }
            }
            if (isCurrentMonth) {
              if (d.status === 'APPROVED') {
                plUsedThisMonth += days;
              } else if (d.status === 'PENDING') {
                plPendingThisMonth += days;
              }
            }
          }
        });
      }

      const balances = {
        PL: {
          code: 'PL',
          name: 'Paid Leave (PL)',
          allocated: plAllocated,
          used: plUsed,
          pending: plPending,
          available: Math.max(0, plAllocated - plUsed),
          monthlyQuota: monthlyQuota,
          usedThisMonth: plUsedThisMonth,
          pendingThisMonth: plPendingThisMonth,
          availableThisMonth: Math.max(0, monthlyQuota - (plUsedThisMonth + plPendingThisMonth)),
          carryForwardAllowed: false,
          maxCarryForward: 0,
          quotaInfo: quotaInfo
        },
        AL: {
          code: 'PL',
          name: 'Paid Leave (PL)',
          allocated: plAllocated,
          used: plUsed,
          pending: plPending,
          available: Math.max(0, plAllocated - plUsed),
          monthlyQuota: monthlyQuota,
          usedThisMonth: plUsedThisMonth,
          pendingThisMonth: plPendingThisMonth,
          availableThisMonth: Math.max(0, monthlyQuota - (plUsedThisMonth + plPendingThisMonth)),
          carryForwardAllowed: false,
          maxCarryForward: 0,
          quotaInfo: quotaInfo
        },
        LWP: {
          code: 'LWP',
          name: 'Unpaid Leave (Loss of Pay)',
          allocated: 0,
          used: lwpUsed,
          pending: 0,
          available: 999,
          carryForwardAllowed: false,
          maxCarryForward: 0,
          quotaInfo: { ruleBadge: 'Unpaid Leave', ruleExplanation: 'Salary deduction applies for unpaid absences' }
        }
      };

      return balances;
    } catch (e) {
      console.warn('Could not fetch leave balances:', e);
      return {
        PL: { code: 'PL', name: 'Paid Leave (PL)', allocated: 18, monthlyQuota: 3, used: 0, pending: 0, available: 18, carryForwardAllowed: false, maxCarryForward: 0, quotaInfo: { ruleBadge: '18 Paid Leaves', ruleExplanation: 'Standard annual quota (3 PL/mo max)' } },
        AL: { code: 'PL', name: 'Paid Leave (PL)', allocated: 18, monthlyQuota: 3, used: 0, pending: 0, available: 18, carryForwardAllowed: false, maxCarryForward: 0, quotaInfo: { ruleBadge: '18 Paid Leaves', ruleExplanation: 'Standard annual quota (3 PL/mo max)' } },
        LWP: { code: 'LWP', name: 'Unpaid Leave (Loss of Pay)', allocated: 0, used: 0, pending: 0, available: 999, carryForwardAllowed: false, maxCarryForward: 0, quotaInfo: { ruleBadge: 'Unpaid Leave' } }
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
      const leaveCode = this.normalizeLeaveCode(leaveData.type || leaveData.leaveTypeCode || 'PL');

      if (leaveCode !== 'LWP') {
        const quota = balances.PL;
        if (!quota || quota.allocated === 0) {
          throw new Error('Employees with tenure under 6 months have 0 Paid Leaves allocated. You may submit an Unpaid Leave (Loss of Pay) request.');
        }
        if (quota.available < numberOfDays) {
          throw new Error(`Insufficient Paid Leave balance. You have ${quota.available} Paid Leaves available (${quota.quotaInfo?.ruleExplanation || ''}), but requested ${numberOfDays} days. You may submit an Unpaid Leave (LWP) request if required.`);
        }

        // Monthly Quota Check for the month being requested
        const reqDate = new Date(leaveData.startDate);
        const reqYear = reqDate.getFullYear();
        const reqMonth = reqDate.getMonth();
        const maxPerMonth = quota.monthlyQuota || (quota.allocated > 12 ? 3 : 1);

        let monthDaysAlreadyUsed = 0;
        const appsSnap = await db.collection('leaveApplications')
          .where('employeeId', '==', employeeId)
          .get();

        appsSnap.docs.forEach(doc => {
          const d = doc.data();
          if (d.status === 'REJECTED' || d.status === 'CANCELLED') return;
          const c = this.normalizeLeaveCode(d.leaveTypeCode || d.type || d.leaveTypeName);
          if (c === 'PL') {
            const lDate = new Date(d.startDate);
            if (!isNaN(lDate.getTime()) && lDate.getFullYear() === reqYear && lDate.getMonth() === reqMonth) {
              monthDaysAlreadyUsed += (Number(d.numberOfDays) || 1);
            }
          }
        });

        if (monthDaysAlreadyUsed + numberOfDays > maxPerMonth) {
          const monthName = reqDate.toLocaleString('en-US', { month: 'long' });
          throw new Error(`Monthly Paid Leave limit exceeded. Per policy, your tenure allows up to ${maxPerMonth} Paid Leave(s) per month. You already have ${monthDaysAlreadyUsed} day(s) taken/pending for ${monthName} ${reqYear}, and requested ${numberOfDays} day(s). (Max: ${maxPerMonth} PL/month).`);
        }
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
      return snapshot.docs.map(doc => {
        const d = doc.data();
        const code = this.normalizeLeaveCode(d.leaveTypeCode || d.type || d.leaveTypeName);
        const name = code === 'LWP' ? 'Unpaid Leave (LWP)' : 'Paid Leave (PL)';
        return {
          id: doc.id,
          ...d,
          leaveTypeCode: d.leaveTypeCode || code,
          leaveTypeName: (d.leaveTypeName && d.leaveTypeName !== 'Leave') ? d.leaveTypeName : name
        };
      });
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
