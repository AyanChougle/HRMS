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
      
      const existingCodes = new Set();
      snapshot.docs.forEach(d => {
        const c = d.data().employeeCode;
        if (c) existingCodes.add(c.trim().toUpperCase());
      });

      let count = snapshot.size + 1;
      while (existingCodes.has(`EMP-${String(count).padStart(4, '0')}`)) {
        count++;
      }
      return `EMP-${String(count).padStart(4, '0')}`;
    } catch (e) {
      return `EMP-0001`;
    }
  },

  _lastUserSyncTime: 0,

  // Synchronize registered Firestore users from users collection into official employee roster
  async syncUsersToEmployees(force = false) {
    const now = Date.now();
    // Cache for 30 seconds unless explicitly forced
    if (!force && this._lastUserSyncTime && (now - this._lastUserSyncTime < 30000)) {
      return { created: 0, synced: 0, cached: true };
    }
    this._lastUserSyncTime = now;

    try {
      if (typeof db === 'undefined') return { created: 0, synced: 0 };

      const usersSnap = await db.collection('users').get();
      if (usersSnap.empty) return { created: 0, synced: 0 };

      const empSnap = await db.collection('employees').get();
      const existingEmployees = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const empByUid = new Map();
      const empByEmail = new Map();
      const empCodes = new Set();

      existingEmployees.forEach(emp => {
        if (emp.id) empByUid.set(emp.id, emp);
        if (emp.userId) empByUid.set(emp.userId, emp);
        const wEmail = (emp.workEmail || emp.email || '').toLowerCase().trim();
        if (wEmail) empByEmail.set(wEmail, emp);
        const pEmail = (emp.personalEmail || '').toLowerCase().trim();
        if (pEmail) empByEmail.set(pEmail, emp);
        if (emp.employeeCode) empCodes.add(emp.employeeCode.trim().toUpperCase());
      });

      let nextCodeNum = existingEmployees.length + 1;
      const getNextCode = () => {
        while (empCodes.has(`EMP-${String(nextCodeNum).padStart(4, '0')}`)) {
          nextCodeNum++;
        }
        const code = `EMP-${String(nextCodeNum).padStart(4, '0')}`;
        empCodes.add(code);
        return code;
      };

      let createdCount = 0;
      let syncedCount = 0;

      for (const uDoc of usersSnap.docs) {
        const u = uDoc.data() || {};
        const uid = uDoc.id;
        const email = (u.email || '').toLowerCase().trim();

        // Skip demo/test email domains
        if (email.endsWith('@example.com') || email.endsWith('@demo.com')) continue;

        let matchedEmp = empByUid.get(uid) || (email ? empByEmail.get(email) : null);
        if (u.employeeId && !matchedEmp) {
          matchedEmp = existingEmployees.find(e => e.id === u.employeeId);
        }

        if (matchedEmp) {
          // Keep UID and email linked on employee record
          const empUpdates = {};
          if (!matchedEmp.userId || matchedEmp.userId !== uid) {
            empUpdates.userId = uid;
          }
          if (!matchedEmp.workEmail && email) {
            empUpdates.workEmail = email;
            empUpdates.email = email;
          }
          if (Object.keys(empUpdates).length > 0) {
            await db.collection('employees').doc(matchedEmp.id).set(empUpdates, { merge: true });
          }

          // Keep employeeId & employeeCode linked on users doc
          if (u.employeeId !== matchedEmp.id || !u.employeeCode) {
            await db.collection('users').doc(uid).set({
              employeeId: matchedEmp.id,
              employeeCode: matchedEmp.employeeCode || u.employeeCode || ''
            }, { merge: true });
          }
          syncedCount++;
        } else {
          // Provision new employee record for this database user
          const employeeCode = u.employeeCode || getNextCode();
          const fullName = (u.displayName || (email ? email.split('@')[0] : 'Employee')).trim();
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || fullName;
          const lastName = nameParts.slice(1).join(' ') || '';

          const roleId = (u.roleId || 'EMPLOYEE').toUpperCase().trim();
          let dept = u.department || 'Engineering';
          let desig = u.designation || 'Software Engineer';
          if (roleId === 'SUPER_ADMIN') {
            dept = 'Executive Office';
            desig = 'Super Administrator';
          } else if (roleId === 'COMPANY_ADMIN' || roleId === 'ADMIN') {
            dept = 'Executive Office';
            desig = 'Company Administrator';
          } else if (roleId === 'HR' || roleId === 'HR_MANAGER') {
            dept = 'Human Resources';
            desig = 'HR Manager';
          } else if (roleId === 'MANAGER') {
            dept = 'Operations';
            desig = 'Operations Manager';
          }

          const newEmp = {
            employeeCode,
            firstName,
            lastName,
            fullName,
            name: fullName,
            userId: uid,
            workEmail: email,
            email: email,
            personalEmail: email,
            phone: u.phone || '',
            roleId,
            department: dept,
            designation: desig,
            companyId: u.companyId || 'comp_diallo_india',
            companyName: u.companyName || 'Diallo India Private Limited',
            branchId: u.branchId || 'branch_mumbai',
            branchName: u.branchName || 'HQ - Mumbai',
            location: u.branchName || 'HQ - Mumbai',
            employmentStatus: u.status || 'ACTIVE',
            status: u.status || 'ACTIVE',
            employmentType: 'Full Time',
            dateOfJoining: new Date().toISOString().slice(0, 10),
            joiningDate: new Date().toISOString().slice(0, 10),
            probationStatus: 'Completed',
            salary: '₹65,000/mo',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };

          await db.collection('employees').doc(uid).set(newEmp, { merge: true });
          await db.collection('users').doc(uid).set({
            employeeId: uid,
            employeeCode
          }, { merge: true });

          empByUid.set(uid, { id: uid, ...newEmp });
          if (email) empByEmail.set(email, { id: uid, ...newEmp });
          createdCount++;
        }
      }

      return { created: createdCount, synced: syncedCount };
    } catch (err) {
      console.warn('Error syncing users to employees:', err);
      return { created: 0, synced: 0, error: err.message };
    }
  },

  // Get employee list with multi-attribute filtering and pagination
  async getEmployees(filters = {}, pagination = null) {
    try {
      // Auto-synchronize registered database users to official employee collection
      try {
        await this.syncUsersToEmployees();
      } catch (syncErr) {
        console.warn('Background user-employee sync warning:', syncErr);
      }

      let query = db.collection('employees');

      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.department && filters.department !== 'All Departments') query = query.where('department', '==', filters.department);
      if (filters.employmentStatus && filters.employmentStatus !== 'All Status') query = query.where('employmentStatus', '==', filters.employmentStatus);
      if (filters.status && filters.status !== 'All') query = query.where('employmentStatus', '==', filters.status);
      if (filters.branchId && filters.branchId !== 'All Branches') query = query.where('branchId', '==', filters.branchId);
      if (filters.employmentType && filters.employmentType !== 'All Types') query = query.where('employmentType', '==', filters.employmentType);
      if (filters.managerId) query = query.where('managerId', '==', filters.managerId);
      if (filters.teamLeaderId) query = query.where('teamLeaderId', '==', filters.teamLeaderId);
      if (filters.operationsManagerId) query = query.where('operationsManagerId', '==', filters.operationsManagerId);
      if (filters.mentorTrainerId) query = query.where('mentorTrainerId', '==', filters.mentorTrainerId);

      const activeRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || '').toString().toUpperCase().trim();
      const currentEmpId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid || '';
      const currentEmpCode = AuthGuard.userProfile?.employeeCode || '';
      const currentEmpName = AuthGuard.userProfile?.displayName || AuthGuard.userProfile?.fullName || '';

      if (activeRole === 'TEAM_LEAD' && !filters.bypassScope) {
        // Enforce strict Team Leader scope
        if (currentEmpId) {
          query = query.where('teamLeaderId', '==', currentEmpId);
        }
      }

      const snapshot = await query.get();
      let records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Blacklist of legacy demo employee IDs and names to strictly purge & exclude
      const demoCodes = new Set([
        'EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005', 'EMP006', 'EMP007', 'EMP008',
        'EMP009', 'EMP010', 'EMP011', 'EMP012', 'EMP013', 'EMP014', 'EMP015', 'EMP016',
        'EMP017', 'EMP018', 'EMP019', 'EMP020', 'EMP021', 'EMP022', 'EMP023', 'EMP024', 'EMP025'
      ]);
      const demoNames = new Set([
        'Vikram Sharma', 'Priya Nair', 'Rahul Mehta', 'Sneha Kulkarni', 'Amitabh Verma',
        'Ananya Deshmukh', 'Rohan Gupta', 'Pooja Iyer', 'Karan Malhotra', 'Divya Patel',
        'Arjun Rao', 'Neha Joshi', 'Siddharth Saxena', 'Kavita Reddy', 'Manish Pandey',
        'Ritu Chopra', 'Deepak Mishra', 'Shweta Tiwari', 'Gaurav Bhatia', 'Sunita Rao',
        'Naveen Kumar', 'Meera Nambiar'
      ]);

      const legitimateRecords = [];
      records.forEach(e => {
        const code = (e.employeeCode || '').toUpperCase().trim();
        const name = (e.fullName || e.name || '').trim();
        const email = (e.workEmail || e.email || '').toLowerCase().trim();
        const isDemo = demoCodes.has(code) || demoNames.has(name) || email.endsWith('@example.com') || email.endsWith('@demo.com');
        if (isDemo) {
          if (e.id) {
            db.collection('employees').doc(e.id).delete().catch(() => {});
          }
        } else {
          legitimateRecords.push(e);
        }
      });
      records = legitimateRecords;

      if (activeRole === 'TEAM_LEAD' && !filters.bypassScope) {
        records = records.filter(e => {
          if (!e.teamLeaderId) return false;
          return e.teamLeaderId === currentEmpId || e.teamLeaderId === currentEmpCode || e.teamLeaderId === currentEmpName;
        });
      }

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

  // Get all employees (alias for getEmployees)
  async getAllEmployees(companyId = null) {
    if (companyId) {
      return this.getEmployees({ companyId });
    }
    return this.getEmployees();
  },

  // Get single employee by ID, userId, employeeCode, or Email
  async getEmployee(employeeId) {
    try {
      const searchTarget = employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      if (!searchTarget) return null;

      // 1. Search directly by Firestore Doc ID
      try {
        const doc = await db.collection('employees').doc(searchTarget).get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() };
        }
      } catch (e) {
        // Continue fallback search
      }

      // 2. Search by userId
      try {
        const uidSnap = await db.collection('employees').where('userId', '==', searchTarget).limit(1).get();
        if (!uidSnap.empty) {
          return { id: uidSnap.docs[0].id, ...uidSnap.docs[0].data() };
        }
      } catch (e) {}

      // 3. Search by employeeCode
      try {
        const codeSnap = await db.collection('employees').where('employeeCode', '==', searchTarget).limit(1).get();
        if (!codeSnap.empty) {
          return { id: codeSnap.docs[0].id, ...codeSnap.docs[0].data() };
        }
      } catch (e) {}

      // 4. Search by Work / Personal / Generic Email
      const emailTarget = (typeof searchTarget === 'string' && searchTarget.includes('@')) ? searchTarget : AuthGuard.currentUser?.email;
      if (emailTarget) {
        try {
          const workEmailSnap = await db.collection('employees').where('workEmail', '==', emailTarget).limit(1).get();
          if (!workEmailSnap.empty) {
            return { id: workEmailSnap.docs[0].id, ...workEmailSnap.docs[0].data() };
          }
          const pEmailSnap = await db.collection('employees').where('personalEmail', '==', emailTarget).limit(1).get();
          if (!pEmailSnap.empty) {
            return { id: pEmailSnap.docs[0].id, ...pEmailSnap.docs[0].data() };
          }
        } catch (e) {}
      }

      // 5. Fallback check for current authenticated user's UID
      if (AuthGuard.currentUser?.uid && AuthGuard.currentUser.uid !== searchTarget) {
        try {
          const curUidSnap = await db.collection('employees').where('userId', '==', AuthGuard.currentUser.uid).limit(1).get();
          if (!curUidSnap.empty) {
            return { id: curUidSnap.docs[0].id, ...curUidSnap.docs[0].data() };
          }
        } catch (e) {}
      }

      return null;
    } catch (err) {
      console.error('Error getting employee:', err);
      return null;
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

  // Update employee with automated delta tracking & resilient upsert
  async updateEmployee(employeeId, updates) {
    try {
      const targetId = employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
      let currentDoc = await this.getEmployee(targetId);

      const actualDocId = currentDoc?.id || (targetId && !targetId.startsWith('EMP-') ? targetId : AuthGuard.currentUser?.uid) || 'emp_' + Date.now();
      const companyId = currentDoc?.companyId || updates.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';

      // Check code uniqueness if changing
      if (updates.employeeCode && currentDoc && updates.employeeCode !== currentDoc.employeeCode) {
        const isTaken = await this.isEmployeeCodeTaken(updates.employeeCode, companyId, actualDocId);
        if (isTaken) {
          throw new Error(`Employee Code '${updates.employeeCode}' is already in use.`);
        }
      }

      // Track timeline changes if currentDoc exists
      if (currentDoc) {
        if (updates.department && updates.department !== currentDoc.department) {
          await historyService.logChange(actualDocId, companyId, 'DEPARTMENT_CHANGED', `Transferred department`, currentDoc.department, updates.department);
        }
        if (updates.designation && updates.designation !== currentDoc.designation) {
          await historyService.logChange(actualDocId, companyId, 'DESIGNATION_CHANGED', `Promoted / Role updated`, currentDoc.designation, updates.designation);
        }
        if (updates.manager && updates.manager !== currentDoc.manager) {
          await historyService.logChange(actualDocId, companyId, 'MANAGER_CHANGED', `Reporting manager updated`, currentDoc.manager, updates.manager);
        }
        if (updates.employmentStatus && updates.employmentStatus !== currentDoc.employmentStatus) {
          await historyService.logChange(actualDocId, companyId, 'STATUS_CHANGED', `Status changed to ${updates.employmentStatus}`, currentDoc.employmentStatus, updates.employmentStatus);
        }
      }

      const payload = {
        ...updates,
        userId: currentDoc?.userId || AuthGuard.currentUser?.uid || actualDocId,
        companyId: companyId,
        employeeCode: updates.employeeCode || currentDoc?.employeeCode || AuthGuard.userProfile?.employeeCode || 'EMP-001',
        fullName: updates.fullName || updates.name || currentDoc?.fullName || currentDoc?.name || AuthGuard.userProfile?.displayName || 'Employee',
        name: updates.fullName || updates.name || currentDoc?.fullName || currentDoc?.name || AuthGuard.userProfile?.displayName || 'Employee',
        updatedBy: AuthGuard.userProfile?.displayName || AuthGuard.currentUser?.email || 'HR Admin',
        updatedById: AuthGuard.currentUser?.uid || 'admin',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (!currentDoc) {
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        payload.employmentStatus = payload.employmentStatus || 'ACTIVE';
        payload.status = payload.status || 'ACTIVE';
        payload.branchName = payload.branchName || 'HQ - Mumbai';
        payload.department = payload.department || 'Technology';
        payload.designation = payload.designation || 'Software Engineer';
      }

      await db.collection('employees').doc(actualDocId).set(payload, { merge: true });

      if (AuthGuard.userProfile) {
        AuthGuard.userProfile.employeeId = actualDocId;
      }

      await auditService.log('EMPLOYEE_UPDATED', 'PEOPLE', 'employees', actualDocId, updates);
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
