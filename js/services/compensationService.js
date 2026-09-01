/**
 * DIALLO HRMS — EMPLOYEE COMPENSATION & SALARY STRUCTURE SERVICE (PHASE 7)
 * Manages salary structures, employee CTC assignments, versioned compensation history, and bank profiles
 */

const compensationService = {
  // 1. GET ACTIVE COMPENSATION FOR AN EMPLOYEE
  async getEmployeeCompensation(employeeId) {
    try {
      const doc = await db.collection('employeeCompensations').doc(employeeId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }

      // Fallback: If not yet defined, construct from employee master record
      const emp = await employeeService.getEmployee(employeeId);
      const rawSalary = emp?.salary ? parseInt(emp.salary.replace(/[^0-9]/g, '')) || 50000 : 50000;
      const monthlyGross = rawSalary;
      const annualCTC = monthlyGross * 12;

      return {
        id: employeeId,
        employeeId,
        companyId: emp?.companyId || 'comp_diallo_india',
        monthlyGross,
        annualCTC,
        currency: 'INR',
        currencySymbol: '₹',
        salaryStructureId: 'struct_standard_inr',
        salaryStructureName: 'Standard CTC (Wage Code 2026)',
        effectiveFrom: emp?.dateOfJoining || '2026-01-01',
        status: 'ACTIVE'
      };
    } catch (e) {
      console.warn('Error fetching compensation:', e);
      return null;
    }
  },

  // 2. SET / REVISE EMPLOYEE COMPENSATION (PRESERVING VERSIONED HISTORY)
  async updateCompensation(employeeId, newCompData) {
    try {
      const currentComp = await this.getEmployeeCompensation(employeeId);
      const companyId = newCompData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';

      // 1. Log previous compensation to history ledger
      if (currentComp) {
        await db.collection('compensationHistory').add({
          employeeId,
          companyId,
          annualCTC: currentComp.annualCTC,
          monthlyGross: currentComp.monthlyGross,
          currency: currentComp.currency || 'INR',
          effectiveFrom: currentComp.effectiveFrom || '2026-01-01',
          effectiveTo: newCompData.effectiveFrom || new Date().toISOString().slice(0, 10),
          revisedBy: AuthGuard.userProfile?.displayName || 'HR Admin',
          revisedAt: firebase.firestore.FieldValue.serverTimestamp(),
          reason: newCompData.reason || 'Annual Appraisal / Increment'
        });
      }

      // 2. Write new active compensation record
      const monthlyGross = Number(newCompData.monthlyGross) || Math.round(Number(newCompData.annualCTC) / 12);
      const annualCTC = Number(newCompData.annualCTC) || monthlyGross * 12;

      const payload = {
        employeeId,
        companyId,
        monthlyGross,
        annualCTC,
        currency: newCompData.currency || 'INR',
        currencySymbol: newCompData.currency === 'USD' ? '$' : '₹',
        salaryStructureId: newCompData.salaryStructureId || 'struct_standard_inr',
        salaryStructureName: newCompData.salaryStructureName || 'Standard CTC (Wage Code 2026)',
        effectiveFrom: newCompData.effectiveFrom || new Date().toISOString().slice(0, 10),
        status: 'ACTIVE',
        updatedBy: AuthGuard.userProfile?.displayName || 'HR Admin',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('employeeCompensations').doc(employeeId).set(payload, { merge: true });

      // Update employee display salary in directory
      await db.collection('employees').doc(employeeId).set({
        salary: `${payload.currencySymbol}${monthlyGross.toLocaleString('en-IN')}/mo`
      }, { merge: true });

      await auditService.log('COMPENSATION_UPDATED', 'PAYROLL', 'employeeCompensations', employeeId, payload);
      return payload;
    } catch (err) {
      console.error('Error updating compensation:', err);
      throw err;
    }
  },

  // 3. GET COMPENSATION REVISION HISTORY
  async getCompensationHistory(employeeId) {
    try {
      const snapshot = await db.collection('compensationHistory')
        .where('employeeId', '==', employeeId)
        .orderBy('revisedAt', 'desc')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Could not fetch compensation history:', e);
      return [];
    }
  },

  // 4. GET ALL EMPLOYEE COMPENSATIONS FOR PAYROLL ROSTER
  async getAllCompensations(companyId = 'comp_diallo_india') {
    try {
      const snapshot = await db.collection('employeeCompensations')
        .where('companyId', '==', companyId)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  }
};

window.compensationService = compensationService;
