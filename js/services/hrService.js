/**
 * DIALLO HRMS — ADVANCED HR & LIFECYCLE SERVICE (PHASE 16)
 * Handles Employment Records, Probation Reviews, Promotions, Transfers,
 * Confidential Salary Revisions, HR Cases, Warnings, and Grievances.
 */

const hrService = {
  DEFAULT_COMPANY_ID: 'comp_diallo_india',

  // 1. EMPLOYMENT RECORDS & LIFECYCLE
  async getEmploymentRecord(employeeId) {
    try {
      const snap = await db.collection('employmentRecords')
        .where('employeeId', '==', employeeId)
        .limit(1)
        .get();
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
      return null;
    } catch (e) {
      console.warn('Error fetching employment record:', e);
      return null;
    }
  },

  async getEmploymentHistory(employeeId) {
    try {
      const snap = await db.collection('employmentHistory')
        .where('employeeId', '==', employeeId)
        .orderBy('effectiveFrom', 'desc')
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching employment history:', e);
      return [];
    }
  },

  // 2. PROBATION MANAGEMENT & CONFIRMATION
  async getProbations(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('probationRecords')
        .where('companyId', '==', companyId)
        .get();
      
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length === 0) {
        // Seed default probation tracking records for demo
        const employees = await employeeService.getAllEmployees(companyId);
        const probationEmps = employees.filter(e => e.status === 'PROBATION' || e.employmentStatus === 'PROBATION').slice(0, 4);
        if (probationEmps.length === 0 && employees.length > 0) {
          probationEmps.push(employees[0]);
        }

        const defaults = probationEmps.map((emp, i) => ({
          employeeId: emp.id,
          employeeName: emp.fullName || emp.name,
          employeeCode: emp.employeeCode || `EMP-00${i+1}`,
          department: emp.department || 'Engineering',
          designation: emp.designation || 'Software Engineer',
          startDate: '2026-06-01',
          expectedEndDate: '2026-09-01',
          durationMonths: 3,
          status: 'ACTIVE',
          reviewStatus: 'PENDING_HR_REVIEW',
          companyId
        }));

        for (const p of defaults) {
          const docRef = await db.collection('probationRecords').add({
            ...p,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          list.push({ id: docRef.id, ...p });
        }
      }
      return list;
    } catch (e) {
      console.error('Error fetching probations:', e);
      return [];
    }
  },

  async extendProbation(probationId, newEndDate, reason) {
    try {
      const payload = {
        expectedEndDate: newEndDate,
        status: 'EXTENDED',
        reviewStatus: 'PROBATION_EXTENDED',
        extensionReason: reason,
        extendedBy: AuthGuard.userProfile?.displayName || 'HR Manager',
        extendedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('probationRecords').doc(probationId).update(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('PROBATION_EXTENDED', 'HR', 'probationRecords', probationId, payload);
      }
      return true;
    } catch (e) {
      console.error('Error extending probation:', e);
      throw e;
    }
  },

  async completeProbation(probationId, employeeId, decision = 'CONFIRM', remarks = '') {
    try {
      const payload = {
        actualEndDate: new Date().toISOString().split('T')[0],
        status: decision === 'CONFIRM' ? 'COMPLETED' : (decision === 'EXTEND' ? 'EXTENDED' : 'FAILED'),
        reviewStatus: decision === 'CONFIRM' ? 'CONFIRMED' : (decision === 'EXTEND' ? 'EXTENDED' : 'TERMINATED'),
        decisionRemarks: remarks,
        confirmedBy: AuthGuard.userProfile?.displayName || 'HR Director',
        resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('probationRecords').doc(probationId).update(payload);

      if (decision === 'CONFIRM' && employeeId) {
        await db.collection('employees').doc(employeeId).update({
          status: 'ACTIVE',
          employmentStatus: 'CONFIRMED',
          confirmationDate: new Date().toISOString().split('T')[0]
        });
      }

      if (typeof auditService !== 'undefined') {
        await auditService.log('EMPLOYEE_CONFIRMED', 'HR', 'probationRecords', probationId, payload);
      }
      return true;
    } catch (e) {
      console.error('Error completing probation:', e);
      throw e;
    }
  },

  // 3. PROMOTION & TRANSFER MANAGEMENT
  async getPromotions(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('promotions')
        .where('companyId', '==', companyId)
        .orderBy('effectiveDate', 'desc')
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching promotions:', e);
      return [];
    }
  },

  async createPromotion(data) {
    try {
      const companyId = data.companyId || this.DEFAULT_COMPANY_ID;
      const payload = {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        oldDesignation: data.oldDesignation,
        newDesignation: data.newDesignation,
        oldLevel: data.oldLevel || 'L2',
        newLevel: data.newLevel || 'L3',
        department: data.department,
        effectiveDate: data.effectiveDate,
        reason: data.reason || 'Annual Performance Progression',
        approvedBy: AuthGuard.userProfile?.displayName || 'HR Management',
        status: 'APPROVED',
        companyId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('promotions').add(payload);

      // Update employee active record
      await db.collection('employees').doc(data.employeeId).update({
        designation: data.newDesignation,
        jobLevel: data.newLevel,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Record employment history
      await organizationService.recordOrgChange(
        data.employeeId,
        data.employeeName,
        'PROMOTION',
        data.oldDesignation,
        data.newDesignation,
        data.effectiveDate
      );

      if (typeof auditService !== 'undefined') {
        await auditService.log('EMPLOYEE_PROMOTED', 'HR', 'promotions', docRef.id, payload);
      }
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating promotion:', e);
      throw e;
    }
  },

  async getTransfers(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('transfers')
        .where('companyId', '==', companyId)
        .orderBy('effectiveDate', 'desc')
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching transfers:', e);
      return [];
    }
  },

  async createTransfer(data) {
    try {
      const companyId = data.companyId || this.DEFAULT_COMPANY_ID;
      const payload = {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        transferType: data.transferType || 'BRANCH_TRANSFER', // 'BRANCH_TRANSFER', 'DEPARTMENT_TRANSFER', 'MANAGER_TRANSFER'
        fromBranch: data.fromBranch || '',
        toBranch: data.toBranch || '',
        fromDepartment: data.fromDepartment || '',
        toDepartment: data.toDepartment || '',
        fromManager: data.fromManager || '',
        toManager: data.toManager || '',
        effectiveDate: data.effectiveDate,
        reason: data.reason || 'Organizational Realignment',
        approvedBy: AuthGuard.userProfile?.displayName || 'HR Operations',
        status: 'COMPLETED',
        companyId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('transfers').add(payload);

      // Update employee active record
      const updateData = {};
      if (data.toBranch) updateData.branch = data.toBranch;
      if (data.toDepartment) updateData.department = data.toDepartment;
      if (data.toManager) updateData.managerName = data.toManager;
      await db.collection('employees').doc(data.employeeId).update(updateData);

      // Record employment history
      await organizationService.recordOrgChange(
        data.employeeId,
        data.employeeName,
        data.transferType,
        `${data.fromBranch || data.fromDepartment || data.fromManager}`,
        `${data.toBranch || data.toDepartment || data.toManager}`,
        data.effectiveDate
      );

      if (typeof auditService !== 'undefined') {
        await auditService.log('EMPLOYEE_TRANSFERRED', 'HR', 'transfers', docRef.id, payload);
      }
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating transfer:', e);
      throw e;
    }
  },

  // 4. CONFIDENTIAL SALARY REVISION RECORDS
  async getSalaryHistory(employeeId, companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const role = AuthGuard.userProfile?.roleId;
      if (role !== 'SUPER_ADMIN' && role !== 'COMPANY_ADMIN' && role !== 'HR_MANAGER' && role !== 'FINANCE') {
        return [];
      }

      let query = db.collection('salaryHistory').where('companyId', '==', companyId);
      if (employeeId) {
        query = query.where('employeeId', '==', employeeId);
      }
      const snap = await query.orderBy('effectiveDate', 'desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching salary history:', e);
      return [];
    }
  },

  async recordSalaryRevision(data) {
    try {
      const companyId = data.companyId || this.DEFAULT_COMPANY_ID;
      const payload = {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        previousCtc: Number(data.previousCtc) || 0,
        revisedCtc: Number(data.revisedCtc) || 0,
        incrementPercentage: Number(data.incrementPercentage) || (((Number(data.revisedCtc) - Number(data.previousCtc)) / (Number(data.previousCtc) || 1)) * 100).toFixed(1),
        effectiveDate: data.effectiveDate,
        revisionReason: data.revisionReason || 'Annual Merit Increment',
        approvedBy: AuthGuard.userProfile?.displayName || 'Compensation Committee',
        companyId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('salaryHistory').add(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('SALARY_RECORD_CREATED', 'FINANCE', 'salaryHistory', docRef.id, {
          employeeId: data.employeeId,
          revisedCtc: data.revisedCtc
        });
      }
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error recording salary revision:', e);
      throw e;
    }
  },

  // 5. HR CASES & DISCIPLINARY WARNINGS
  async getHRCases(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('hrCases')
        .where('companyId', '==', companyId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Error fetching HR cases:', e);
      return [];
    }
  },

  async createHRCase(data) {
    try {
      const companyId = data.companyId || this.DEFAULT_COMPANY_ID;
      const payload = {
        title: data.title.trim(),
        employeeId: data.employeeId || '',
        employeeName: data.employeeName || 'Staff Member',
        employeeCode: data.employeeCode || '',
        caseType: data.caseType || 'DISCIPLINARY', // 'WARNING', 'DISCIPLINARY', 'PERFORMANCE', 'ATTENDANCE_ISSUE', 'POLICY_VIOLATION'
        priority: data.priority || 'MEDIUM', // 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
        severity: data.severity || 'LOW', // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        status: 'SUBMITTED', // 'SUBMITTED', 'IN_INVESTIGATION', 'HEARING_SCHEDULED', 'ACTION_TAKEN', 'CLOSED'
        assignedTo: data.assignedTo || AuthGuard.userProfile?.displayName || 'HR Lead',
        description: data.description || '',
        targetResolutionDays: Number(data.targetResolutionDays) || 5,
        companyId,
        createdBy: AuthGuard.userProfile?.displayName || 'HR Administration',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('hrCases').add(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('HR_CASE_CREATED', 'HR', 'hrCases', docRef.id, payload);
      }
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating HR case:', e);
      throw e;
    }
  },

  async updateHRCaseStatus(caseId, status, resolutionNotes = '') {
    try {
      const payload = {
        status,
        resolutionNotes,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      if (status === 'CLOSED') {
        payload.resolvedAt = firebase.firestore.FieldValue.serverTimestamp();
      }
      await db.collection('hrCases').doc(caseId).update(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('HR_CASE_UPDATED', 'HR', 'hrCases', caseId, payload);
      }
      return true;
    } catch (e) {
      console.error('Error updating HR case:', e);
      throw e;
    }
  },

  // 6. EMPLOYEE GRIEVANCE MANAGEMENT
  async getGrievances(companyId = this.DEFAULT_COMPANY_ID, employeeId = null) {
    try {
      let query = db.collection('grievances').where('companyId', '==', companyId);
      if (employeeId) {
        query = query.where('submittedByEmployeeId', '==', employeeId);
      }
      const snap = await query.orderBy('submittedAt', 'desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching grievances:', e);
      return [];
    }
  },

  async createGrievance(data) {
    try {
      const companyId = data.companyId || this.DEFAULT_COMPANY_ID;
      const payload = {
        title: data.title.trim(),
        category: data.category || 'WORKPLACE_ENVIRONMENT', // 'WORKPLACE_ENVIRONMENT', 'PAYROLL_EXPENSE', 'MANAGEMENT_RELATION', 'POLICY_CONCERN', 'OTHER'
        description: data.description || '',
        priority: data.priority || 'MEDIUM',
        status: 'SUBMITTED', // 'SUBMITTED', 'UNDER_REVIEW', 'IN_INVESTIGATION', 'RESOLVED', 'CLOSED'
        submittedByEmployeeId: AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid,
        submittedByName: AuthGuard.userProfile?.displayName || 'Anonymous Staff',
        companyId,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('grievances').add(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('GRIEVANCE_CREATED', 'HR', 'grievances', docRef.id, { title: data.title });
      }
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error submitting grievance:', e);
      throw e;
    }
  },

  async resolveGrievance(grievanceId, resolutionNotes) {
    try {
      const payload = {
        status: 'RESOLVED',
        resolutionNotes,
        resolvedBy: AuthGuard.userProfile?.displayName || 'HR Ethics Committee',
        resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('grievances').doc(grievanceId).update(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('GRIEVANCE_CLOSED', 'HR', 'grievances', grievanceId, payload);
      }
      return true;
    } catch (e) {
      console.error('Error resolving grievance:', e);
      throw e;
    }
  }
};

window.hrService = hrService;
