/**
 * DIALLO HRMS — EMPLOYEE EXIT & SEPARATION SERVICE (PHASE 4)
 * Manages resignation, termination, notice period tracking, and department clearances
 */

const exitService = {
  // Get all exit records
  async getExits(companyId = null) {
    try {
      let query = db.collection('employeeExits');
      if (companyId) query = query.where('companyId', '==', companyId);

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching exit records:', err);
      return [];
    }
  },

  // Initiate an employee exit
  async initiateExit(exitData) {
    try {
      const payload = {
        employeeId: exitData.employeeId,
        employeeCode: exitData.employeeCode || '',
        employeeName: exitData.employeeName || 'Employee',
        companyId: exitData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        exitType: exitData.exitType || 'RESIGNATION', // RESIGNATION, TERMINATION, RETIREMENT, CONTRACT_END, OTHER
        resignationDate: exitData.resignationDate || new Date().toISOString().slice(0, 10),
        lastWorkingDate: exitData.lastWorkingDate || '',
        noticePeriodDays: Number(exitData.noticePeriodDays) || 30,
        reason: exitData.reason || '',
        remarks: exitData.remarks || '',
        status: 'NOTICE_PERIOD', // INITIATED, NOTICE_PERIOD, CLEARANCE, COMPLETED, CANCELLED
        initiatedBy: AuthGuard.userProfile?.displayName || AuthGuard.currentUser?.email || 'HR Admin',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('employeeExits').add(payload);

      // Update employee status to ON_NOTICE
      await employeeService.updateEmployee(exitData.employeeId, {
        employmentStatus: 'ON_NOTICE'
      });

      // Log history
      await historyService.logChange(
        exitData.employeeId,
        payload.companyId,
        'STATUS_CHANGED',
        `Exit initiated (${payload.exitType}). Status set to ON_NOTICE. Last working day: ${payload.lastWorkingDate}`,
        'ACTIVE',
        'ON_NOTICE'
      );

      await auditService.log('EXIT_INITIATED', 'EXIT', 'employeeExits', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error initiating exit:', err);
      throw err;
    }
  },

  // Complete exit & deactivate employee
  async completeExit(exitId, employeeId, finalStatus = 'RESIGNED') {
    try {
      await db.collection('employeeExits').doc(exitId).update({
        status: 'COMPLETED',
        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await employeeService.updateEmployee(employeeId, {
        employmentStatus: finalStatus // RESIGNED, TERMINATED, RETIRED
      });

      await historyService.logChange(
        employeeId,
        AuthGuard.userProfile?.companyId,
        'STATUS_CHANGED',
        `Exit completed. Status updated to ${finalStatus}`,
        'ON_NOTICE',
        finalStatus
      );

      await auditService.log('EXIT_COMPLETED', 'EXIT', 'employeeExits', exitId, { employeeId, finalStatus });
      return true;
    } catch (err) {
      console.error('Error completing exit:', err);
      throw err;
    }
  },

  // Update exit record
  async updateExit(exitId, updateData) {
    try {
      const payload = {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('employeeExits').doc(exitId).update(payload);
      await auditService.log('EXIT_UPDATED', 'EXIT', 'employeeExits', exitId, updateData);
      return true;
    } catch (err) {
      console.error('Error updating exit record:', err);
      throw err;
    }
  },

  // Delete exit record
  async deleteExit(exitId) {
    try {
      await db.collection('employeeExits').doc(exitId).delete();
      await auditService.log('EXIT_DELETED', 'EXIT', 'employeeExits', exitId, {});
      return true;
    } catch (err) {
      console.error('Error deleting exit record:', err);
      throw err;
    }
  }
};

window.exitService = exitService;
