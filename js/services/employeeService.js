/**
 * DIALLO HRMS — PRODUCTION EMPLOYEE SERVICE (PHASE 4)
 * Comprehensive Employee Management, Uniqueness Checks, Auto-Code Generator, and History Tracking
 */

const employeeService = {
  // Check if employee code is already taken within company
  async isEmployeeCodeTaken(employeeCode, companyId, excludeDocId = null) {
    try {
      const snapshot = await db.collection('employees')
        .where('companyId', '==', companyId || 'comp_diallo_india')
        .where('employeeCode', '==', employeeCode.trim().toUpperCase())
        .get();

      if (snapshot.empty) return false;
      if (excludeDocId && snapshot.docs.length === 1 && snapshot.docs[0].id === excludeDocId) {
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Employee code uniqueness check warning:', e);
      return false;
    }
  },

  // Suggest next available employee code (e.g. EMP-0001)
  async getNextEmployeeCode(companyId = 'comp_diallo_india') {
    try {
      const snapshot = await db.collection('employees')
        .where('companyId', '==', companyId)
        .get();
      
      const count = snapshot.size + 1;
      return `EMP-${String(count).padStart(4, '0')}`;
    } catch (e) {
      return `EMP-0001`;
    }
  },

  // Get employee list with multi-attribute filtering and pagination
  async getEmployees(filters = {}, pagination = null) {
    try {
      let query = db.collection('employees');

      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.department && filters.department !== 'All Departments') query = query.where('department', '==', filters.department);
      if (filters.employmentStatus && filters.employmentStatus !== 'All Status') query = query.where('employmentStatus', '==', filters.employmentStatus);
      if (filters.status && filters.status !== 'All') query = query.where('employmentStatus', '==', filters.status);
      if (filters.branchId && filters.branchId !== 'All Branches') query = query.where('branchId', '==', filters.branchId);
      if (filters.employmentType && filters.employmentType !== 'All Types') query = query.where('employmentType', '==', filters.employmentType);
      if (filters.managerId) query = query.where('managerId', '==', filters.managerId);

      const snapshot = await query.get();
      let records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // In-memory text search filtering if provided (Code, Name, Email, Phone)
      if (filters.search && filters.search.trim() !== '') {
        const term = filters.search.toLowerCase().trim();
        records = records.filter(e => 
          (e.employeeCode && e.employeeCode.toLowerCase().includes(term)) ||
          (e.fullName && e.fullName.toLowerCase().includes(term)) ||
          (e.name && e.name.toLowerCase().includes(term)) ||
          (e.workEmail && e.workEmail.toLowerCase().includes(term)) ||
          (e.email && e.email.toLowerCase().includes(term)) ||
          (e.phone && e.phone.includes(term))
        );
      }

      return records;
    } catch (err) {
      console.error('Error fetching employees:', err);
      return [];
    }
  },

  // Get single employee by ID or employeeCode
  async getEmployee(employeeId) {
    try {
      const doc = await db.collection('employees').doc(employeeId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }

      // Try searching by employeeCode
      const querySnap = await db.collection('employees').where('employeeCode', '==', employeeId).limit(1).get();
      if (!querySnap.empty) {
        return { id: querySnap.docs[0].id, ...querySnap.docs[0].data() };
      }

      return null;
    } catch (err) {
      console.error('Error getting employee:', err);
      throw err;
    }
  },

  // Create new employee with validation & history log
  async createEmployee(employeeData) {
    try {
      const companyId = employeeData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const employeeCode = (employeeData.employeeCode || await this.getNextEmployeeCode(companyId)).trim().toUpperCase();

      // Verify code uniqueness
      const isTaken = await this.isEmployeeCodeTaken(employeeCode, companyId);
      if (isTaken) {
        throw new Error(`Employee Code '${employeeCode}' is already assigned to another staff member.`);
      }

      const firstName = (employeeData.firstName || '').trim();
      const middleName = (employeeData.middleName || '').trim();
      const lastName = (employeeData.lastName || '').trim();
      const fullName = employeeData.fullName || `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim() || employeeData.name || 'Unnamed Employee';

      const payload = {
        employeeCode,
        firstName,
        middleName,
        lastName,
        fullName,
        name: fullName,
        profilePhotoUrl: employeeData.profilePhotoUrl || '',

        // Organization
        companyId,
        companyName: employeeData.companyName || 'Diallo India Private Limited',
        branchId: employeeData.branchId || 'branch_mumbai',
        branchName: employeeData.branchName || employeeData.location || 'HQ - Mumbai',
        location: employeeData.location || employeeData.branchName || 'HQ - Mumbai',
        departmentId: employeeData.departmentId || '',
        department: employeeData.department || 'Engineering',
        designationId: employeeData.designationId || '',
        designation: employeeData.designation || 'Staff',
        gradeId: employeeData.gradeId || 'G2',
        costCenterId: employeeData.costCenterId || '',
        managerId: employeeData.managerId || '',
        manager: employeeData.manager || '',

        // Contact
        personalEmail: employeeData.personalEmail || '',
        workEmail: employeeData.workEmail || employeeData.email || '',
        email: employeeData.workEmail || employeeData.email || '',
        phone: employeeData.phone || '',
        alternatePhone: employeeData.alternatePhone || '',
        address: employeeData.address || '',
        city: employeeData.city || 'Mumbai',
        state: employeeData.state || 'Maharashtra',
        country: employeeData.country || 'India',
        postalCode: employeeData.postalCode || '400051',

        // Personal
        dateOfBirth: employeeData.dateOfBirth || '',
        gender: employeeData.gender || 'Not Specified',
        pan: employeeData.pan || '',
        uan: employeeData.uan || '',

        // Employment & Terms
        dateOfJoining: employeeData.dateOfJoining || employeeData.joiningDate || new Date().toISOString().slice(0, 10),
        joiningDate: employeeData.dateOfJoining || employeeData.joiningDate || new Date().toISOString().slice(0, 10),
        employmentType: employeeData.employmentType || employeeData.type || 'Full Time',
        employmentStatus: employeeData.employmentStatus || 'ACTIVE',
        status: employeeData.employmentStatus || 'ACTIVE',
        probationStatus: employeeData.probationStatus || 'Completed',
        probationEndDate: employeeData.probationEndDate || '',
        noticePeriodDays: Number(employeeData.noticePeriodDays) || 30,
        salary: employeeData.salary || '₹65,000/mo',

        // Metadata
        createdBy: AuthGuard.userProfile?.displayName || AuthGuard.currentUser?.email || 'HR Admin',
        createdById: AuthGuard.currentUser?.uid || 'admin',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('employees').add(payload);
      payload.id = docRef.id;

      // Log creation in timeline
      await historyService.logChange(
        docRef.id,
        companyId,
        'EMPLOYEE_CREATED',
        `Employee record created with code ${employeeCode} (${fullName})`
      );

      // Auto-generate onboarding checklist tasks
      await onboardingService.generateDefaultTasksForEmployee(payload);

      await auditService.log('EMPLOYEE_CREATED', 'PEOPLE', 'employees', docRef.id, { employeeCode, fullName });
      return payload;
    } catch (err) {
      console.error('Error creating employee:', err);
      throw err;
    }
  },

  // Update employee with automated delta tracking
  async updateEmployee(employeeId, updates) {
    try {
      const currentDoc = await this.getEmployee(employeeId);
      if (!currentDoc) throw new Error('Employee record not found');

      // Check code uniqueness if changing
      if (updates.employeeCode && updates.employeeCode !== currentDoc.employeeCode) {
        const isTaken = await this.isEmployeeCodeTaken(updates.employeeCode, currentDoc.companyId, employeeId);
        if (isTaken) {
          throw new Error(`Employee Code '${updates.employeeCode}' is already in use.`);
        }
      }

      // Track timeline changes
      if (updates.department && updates.department !== currentDoc.department) {
        await historyService.logChange(employeeId, currentDoc.companyId, 'DEPARTMENT_CHANGED', `Transferred department`, currentDoc.department, updates.department);
      }
      if (updates.designation && updates.designation !== currentDoc.designation) {
        await historyService.logChange(employeeId, currentDoc.companyId, 'DESIGNATION_CHANGED', `Promoted / Role updated`, currentDoc.designation, updates.designation);
      }
      if (updates.manager && updates.manager !== currentDoc.manager) {
        await historyService.logChange(employeeId, currentDoc.companyId, 'MANAGER_CHANGED', `Reporting manager updated`, currentDoc.manager, updates.manager);
      }
      if (updates.employmentStatus && updates.employmentStatus !== currentDoc.employmentStatus) {
        await historyService.logChange(employeeId, currentDoc.companyId, 'STATUS_CHANGED', `Status changed to ${updates.employmentStatus}`, currentDoc.employmentStatus, updates.employmentStatus);
      }

      const payload = {
        ...updates,
        updatedBy: AuthGuard.userProfile?.displayName || AuthGuard.currentUser?.email || 'HR Admin',
        updatedById: AuthGuard.currentUser?.uid || 'admin',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('employees').doc(employeeId).update(payload);
      await auditService.log('EMPLOYEE_UPDATED', 'PEOPLE', 'employees', employeeId, updates);
      return true;
    } catch (err) {
      console.error('Error updating employee:', err);
      throw err;
    }
  },

  // Deactivate employee
  async deactivateEmployee(employeeId, reason = 'Deactivated by HR') {
    try {
      await this.updateEmployee(employeeId, {
        employmentStatus: 'INACTIVE',
        status: 'INACTIVE',
        deactivationReason: reason
      });
      Toast.success('Employee record marked as INACTIVE.');
      return true;
    } catch (err) {
      Toast.error(`Deactivation failed: ${err.message}`);
      throw err;
    }
  },

  // Delete employee permanently
  async deleteEmployee(employeeId) {
    try {
      await db.collection('employees').doc(employeeId).delete();
      await auditService.log('EMPLOYEE_DELETED', 'PEOPLE', 'employees', employeeId, {});
      return true;
    } catch (err) {
      console.error('Error deleting employee:', err);
      throw err;
    }
  }
};

window.employeeService = employeeService;
