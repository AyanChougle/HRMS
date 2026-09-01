/**
 * DIALLO HRMS — PRODUCTION PAYROLL & SALARY PROCESSING ENGINE (PHASE 7)
 * Batch Calculation Engine, Attendance & Leave Integration, Approval & Locking, Immutable Records, and Payslips
 */

const payrollService = {
  // 1. GET ALL PAYROLL PERIODS
  async getPayrollPeriods(companyId = 'comp_diallo_india') {
    try {
      const snapshot = await db.collection('payrollPeriods')
        .where('companyId', '==', companyId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('Error fetching payroll periods:', err);
      return [];
    }
  },

  async getPayrollPeriod(periodId) {
    try {
      const doc = await db.collection('payrollPeriods').doc(periodId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (e) {
      return null;
    }
  },

  // 2. CREATE PAYROLL PERIOD (DRAFT)
  async createPayrollPeriod(periodData) {
    try {
      const companyId = periodData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const periodId = `period_${periodData.name.replace(/\s+/g, '_').toLowerCase()}`;

      const payload = {
        name: periodData.name, // e.g. "August 2026"
        month: periodData.name,
        companyId,
        startDate: periodData.startDate, // e.g. "2026-08-01"
        endDate: periodData.endDate,     // e.g. "2026-08-31"
        payDate: periodData.payDate || '5th of next month',
        status: 'DRAFT', // DRAFT, PROCESSING, REVIEW, APPROVED, LOCKED
        employeeCount: 0,
        totalGross: '₹0.00',
        totalGrossNum: 0,
        totalDeductions: '₹0.00',
        totalDeductionsNum: 0,
        totalNet: '₹0.00',
        totalNetNum: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: AuthGuard.userProfile?.displayName || 'Payroll Admin'
      };

      await db.collection('payrollPeriods').doc(periodId).set(payload, { merge: true });
      await auditService.log('PAYROLL_PERIOD_CREATED', 'PAYROLL', 'payrollPeriods', periodId, payload);
      return { id: periodId, ...payload };
    } catch (err) {
      console.error('Error creating payroll period:', err);
      throw err;
    }
  },

  // 3. EXECUTE BATCH PAYROLL CALCULATION (INTEGRATING EMPLOYEES, COMPENSATION, ATTENDANCE, AND LEAVE)
  async processPayrollPeriod(periodId) {
    try {
      const period = await this.getPayrollPeriod(periodId);
      if (!period) throw new Error('Payroll period not found');
      if (period.status === 'LOCKED') throw new Error('Cannot process a LOCKED payroll period.');

      const companyId = period.companyId || 'comp_diallo_india';
      const settings = await payrollSettingsService.getSettings(companyId);
      const employees = await employeeService.getEmployees({ status: 'ACTIVE' });

      if (employees.length === 0) throw new Error('No active employees found to process payroll.');

      let totalGrossSum = 0;
      let totalDeductionsSum = 0;
      let totalNetSum = 0;
      const batchRecords = [];

      for (const emp of employees) {
        // A. Load Employee Compensation
        const comp = await compensationService.getEmployeeCompensation(emp.id);
        const monthlyGross = comp?.monthlyGross || 50000;

        // B. Query Attendance Records for Period
        const attRecords = await attendanceService.getAttendanceRecords({
          employeeId: emp.id,
          companyId
        });

        let presentDays = 0;
        let lateMinutesTotal = 0;
        let overtimeMinutesTotal = 0;

        attRecords.forEach(r => {
          if (r.date >= period.startDate && r.date <= period.endDate) {
            if (r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'REGULARIZED') presentDays++;
            lateMinutesTotal += (r.lateMinutes || 0);
            overtimeMinutesTotal += (r.overtimeMinutes || 0);
          }
        });

        // C. Query Leave Applications for Period
        const leaves = await leaveService.getLeaveRequests({ employeeId: emp.id, companyId });
        let paidLeaveDays = 0;
        let lwpDays = 0; // Unpaid leave

        leaves.forEach(l => {
          if (l.status === 'APPROVED' && l.startDate >= period.startDate && l.endDate <= period.endDate) {
            if (l.leaveTypeCode === 'LWP') lwpDays += (l.numberOfDays || 0);
            else paidLeaveDays += (l.numberOfDays || 0);
          }
        });

        const standardWorkingDays = settings.standardWorkingDays || 26;
        const absentDays = Math.max(0, standardWorkingDays - (presentDays + paidLeaveDays + lwpDays));

        // D. Calculate Earnings & Deductions via Statutory Engine
        const breakdown = StatutoryEngine.calculateSalaryStructure(monthlyGross, true, emp.location || 'Maharashtra');

        // Overtime Earnings: (Monthly Gross / (26 * 8)) * 1.5 * Overtime Hours
        const hourlyRate = monthlyGross / (standardWorkingDays * 8);
        const overtimeHours = overtimeMinutesTotal / 60;
        const overtimePay = Math.round(hourlyRate * 1.5 * overtimeHours);

        // LOP / Unpaid Leave Deduction: (Monthly Gross / 26) * LWP Days
        const lwpDeduction = Math.round((monthlyGross / standardWorkingDays) * lwpDays);

        const grossPay = breakdown.gross + overtimePay;
        const totalDeductions = breakdown.deductions.totalDeductions + lwpDeduction;
        const netPay = Math.max(0, grossPay - totalDeductions);

        totalGrossSum += grossPay;
        totalDeductionsSum += totalDeductions;
        totalNetSum += netPay;

        // E. Prepare Immutable Snapshots
        const recordId = `${periodId}_${emp.id}`;
        const recordPayload = {
          periodId,
          periodName: period.name,
          employeeId: emp.id,
          companyId,
          branchId: emp.branchId || 'branch_mumbai',
          departmentId: emp.departmentId || '',
          employeeSnapshot: {
            employeeCode: emp.employeeCode || emp.id,
            fullName: emp.fullName || emp.name,
            designation: emp.designation || 'Staff',
            department: emp.department || 'Engineering',
            pan: emp.pan || 'ABCDE1234F',
            uan: emp.uan || '100987654321',
            location: emp.location || 'HQ - Mumbai'
          },
          salarySnapshot: {
            monthlyGross,
            basic: breakdown.earnings.basic,
            hra: breakdown.earnings.hra,
            specialAllowance: breakdown.earnings.specialAllowance,
            conveyance: breakdown.earnings.conveyance + breakdown.earnings.medicalAllowance
          },
          attendanceSnapshot: {
            standardWorkingDays,
            presentDays,
            paidLeaveDays,
            lwpDays,
            absentDays,
            overtimeHours: overtimeHours.toFixed(1),
            overtimeMinutes: overtimeMinutesTotal
          },
          earnings: {
            basic: breakdown.earnings.basic,
            hra: breakdown.earnings.hra,
            specialAllowance: breakdown.earnings.specialAllowance,
            conveyance: breakdown.earnings.conveyance + breakdown.earnings.medicalAllowance,
            overtimePay,
            grossPay
          },
          deductions: {
            epfEmployee: breakdown.deductions.epfEmployee,
            esicEmployee: breakdown.deductions.esicEmployee,
            professionalTax: breakdown.deductions.professionalTax,
            tds: breakdown.deductions.tds,
            lwpDeduction,
            totalDeductions
          },
          employerContributions: breakdown.employerContributions,
          netPay,
          netInWords: StatutoryEngine.amountToWords(netPay),
          currency: 'INR',
          currencySymbol: '₹',
          status: 'PROCESSED',
          flag: (absentDays > 5 || lwpDays > 2) ? 'FLAGGED_ATTENDANCE' : 'NORMAL',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('payrollRecords').doc(recordId).set(recordPayload);
        batchRecords.push(recordPayload);
      }

      // F. Update Period Totals & Status to REVIEW
      const periodUpdates = {
        employeeCount: employees.length,
        totalGross: `₹${totalGrossSum.toLocaleString('en-IN')}.00`,
        totalGrossNum: totalGrossSum,
        totalDeductions: `₹${totalDeductionsSum.toLocaleString('en-IN')}.00`,
        totalDeductionsNum: totalDeductionsSum,
        totalNet: `₹${totalNetSum.toLocaleString('en-IN')}.00`,
        totalNetNum: totalNetSum,
        status: 'REVIEW',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('payrollPeriods').doc(periodId).update(periodUpdates);
      await auditService.log('PAYROLL_BATCH_PROCESSED', 'PAYROLL', 'payrollPeriods', periodId, periodUpdates);

      return { periodId, ...periodUpdates, recordsCount: batchRecords.length };
    } catch (err) {
      console.error('Error processing batch payroll:', err);
      throw err;
    }
  },

  // 4. APPROVE PAYROLL PERIOD (WITH ANTI-SELF-APPROVAL RULE)
  async approvePayrollPeriod(periodId) {
    try {
      const currentUserId = AuthGuard.currentUser?.uid;
      const period = await this.getPayrollPeriod(periodId);
      if (!period) throw new Error('Payroll period not found');

      if (period.createdBy === AuthGuard.userProfile?.displayName && AuthGuard.userProfile?.roleId !== 'SUPER_ADMIN') {
        throw new Error('Security Violation: You cannot approve a payroll cycle you initiated.');
      }

      await db.collection('payrollPeriods').doc(periodId).update({
        status: 'APPROVED',
        approvedBy: AuthGuard.userProfile?.displayName || 'Payroll Manager',
        approvedById: currentUserId,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('PAYROLL_APPROVED', 'PAYROLL', 'payrollPeriods', periodId, { approvedBy: AuthGuard.userProfile?.displayName });
      return true;
    } catch (err) {
      console.error('Error approving payroll:', err);
      throw err;
    }
  },

  // 5. LOCK PAYROLL PERIOD (FREEZES IMMUTABLE SALARY RECORDS)
  async lockPayrollPeriod(periodId) {
    try {
      await db.collection('payrollPeriods').doc(periodId).update({
        status: 'LOCKED',
        lockedBy: AuthGuard.userProfile?.displayName || 'Finance Controller',
        lockedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('PAYROLL_LOCKED', 'PAYROLL', 'payrollPeriods', periodId, { lockedBy: AuthGuard.userProfile?.displayName });
      return true;
    } catch (err) {
      console.error('Error locking payroll:', err);
      throw err;
    }
  },

  // 6. GET ITEMIZED PAYROLL RECORDS FOR A PERIOD
  async getPayrollRecords(periodId, filters = {}) {
    try {
      let query = db.collection('payrollRecords').where('periodId', '==', periodId);
      if (filters.employeeId) query = query.where('employeeId', '==', filters.employeeId);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching payroll records:', e);
      return [];
    }
  },

  // 7. GET PAYSLIPS FOR A SPECIFIC EMPLOYEE (SELF-SERVICE)
  async getPayslipsForEmployee(employeeId) {
    try {
      const snapshot = await db.collection('payrollRecords')
        .where('employeeId', '==', employeeId)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  }
};

window.payrollService = payrollService;
