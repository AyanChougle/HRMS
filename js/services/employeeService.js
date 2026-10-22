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
      let prefix = 'D-';
      let digits = 3;
      try {
        if (typeof settingsService !== 'undefined') {
          const cfg = await settingsService.getCompanySettings(companyId);
          if (cfg && cfg.codeSeries) {
            prefix = cfg.codeSeries.employeeCodePrefix || 'D-';
            digits = Number(cfg.codeSeries.employeeCodeDigits) || 3;
          }
        }
      } catch (e) {}

      const snapshot = await db.collection('employees').where('companyId', '==', companyId).get();
      let maxNum = 0;
      snapshot.docs.forEach(d => {
        const c = d.data().employeeCode;
        if (c && c.toUpperCase().startsWith(prefix.toUpperCase())) {
          const numStr = c.substring(prefix.length);
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      return `${prefix}${String(maxNum + 1).padStart(digits, '0')}`;
    } catch (e) {
      return 'D-001';
    }
  },

  _lastUserSyncTime: 0,

  // Synchronize registered Firestore users from users collection into official employee roster
  async syncUsersToEmployees(force = false) {
    const now = Date.now();
    if (!force && this._lastUserSyncTime && (now - this._lastUserSyncTime < 30000)) {
      return { created: 0, synced: 0, cached: true };
    }
    this._lastUserSyncTime = now;

    try {
      let createdCount = 0;
      let syncedCount = 0;

      // 1. Fetch from Hostinger MySQL users.php and employees.php
      let mysqlEmployees = [];
      let mysqlUsers = [];
      if (typeof apiClient !== 'undefined') {
        try {
          const empResp = await apiClient.get('employees.php');
          if (empResp && empResp.success && Array.isArray(empResp.employees)) {
            mysqlEmployees = empResp.employees;
          }
          const userResp = await apiClient.get('users.php');
          if (userResp && userResp.success && Array.isArray(userResp.users)) {
            mysqlUsers = userResp.users;
          }
        } catch (e) {
          console.warn('[syncUsersToEmployees] MySQL fetch notice:', e.message);
        }
      }

      // 2. Fetch existing Firestore employees and users
      const empSnap = (typeof db !== 'undefined') ? await db.collection('employees').get() : { docs: [] };
      const existingEmployees = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const existingIds = new Set(existingEmployees.map(e => e.id));

      // 3. Upsert MySQL employees into Firestore employees collection
      if (typeof db !== 'undefined') {
        for (const me of mysqlEmployees) {
          const id = me.id;
          const payload = {
            userId: me.user_id || id,
            employeeCode: me.employee_code || '',
            firstName: me.first_name || '',
            lastName: me.last_name || '',
            fullName: me.full_name || `${me.first_name || ''} ${me.last_name || ''}`.trim(),
            name: me.full_name || `${me.first_name || ''} ${me.last_name || ''}`.trim(),
            workEmail: me.work_email || me.email || '',
            email: me.email || me.work_email || '',
            phone: me.phone || '',
            companyId: me.company_id || 'comp_diallo_india',
            companyName: me.company_name || 'Diallo India Private Limited',
            branchName: me.branch_name || 'Ghansoli - Navi Mumbai, Maharashtra',
            location: me.location || 'Ghansoli - Navi Mumbai, Maharashtra',
            department: me.department || 'Operations',
            designation: me.designation || 'Associate',
            gradeId: me.grade_id || 'G2',
            roleId: me.role_id || 'EMPLOYEE',
            managerId: me.manager_id || null,
            manager: me.manager || null,
            mentor: me.mentor || null,
            dateOfJoining: me.date_of_joining || '',
            employmentStatus: me.employment_status || me.status || 'ACTIVE',
            status: me.status || me.employment_status || 'ACTIVE'
          };

          await db.collection('employees').doc(String(id)).set(payload, { merge: true });
          if (!existingIds.has(id)) {
            createdCount++;
            existingIds.add(id);
          } else {
            syncedCount++;
          }
        }

        // 4. Also upsert MySQL users into Firestore users collection
        for (const mu of mysqlUsers) {
          const uid = mu.uid || String(mu.id);
          await db.collection('users').doc(uid).set({
            uid: uid,
            employeeCode: mu.employee_code || '',
            displayName: mu.display_name || `${mu.first_name || ''} ${mu.last_name || ''}`.trim(),
            firstName: mu.first_name || '',
            lastName: mu.last_name || '',
            email: mu.email || '',
            phone: mu.phone || '',
            roleId: mu.role_id || 'EMPLOYEE',
            department: mu.department || 'Operations',
            designation: mu.designation || 'Associate',
            status: mu.status || 'ACTIVE'
          }, { merge: true });
        }
      }

      const total = mysqlEmployees.length || (createdCount + syncedCount);
      return { created: createdCount, synced: syncedCount, total };
    } catch (err) {
      console.warn('Error syncing users to employees:', err);
      return { created: 0, synced: 0, error: err.message };
    }
  },

  // Get employee list with multi-attribute filtering and pagination (MySQL First, Firestore Fallback)
  async getEmployees(filters = {}, pagination = null) {
    try {
      let records = [];
      let loadedFromMySQL = false;

      // 1. Primary: Fetch dynamically from Hostinger MySQL API if available
      if (typeof apiClient !== 'undefined') {
        try {
          const resp = await apiClient.get('employees.php');
          if (resp && resp.success && Array.isArray(resp.employees) && resp.employees.length > 0) {
            records = resp.employees.map(e => ({
              id: e.id,
              userId: e.user_id || e.id,
              employeeCode: e.employee_code || '',
              firstName: e.first_name || '',
              lastName: e.last_name || '',
              fullName: e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
              name: e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
              email: e.email || e.work_email || '',
              workEmail: e.work_email || e.email || '',
              personalEmail: e.personal_email || null,
              phone: e.phone || '',
              profilePhotoUrl: e.profile_photo_url || null,
              companyId: e.company_id || 'comp_diallo_india',
              companyName: e.company_name || 'Diallo India Private Limited',
              branchId: e.branch_id || 'branch_mumbai',
              branchName: e.branch_name || 'Ghansoli - Navi Mumbai, Maharashtra',
              location: e.location || 'Ghansoli - Navi Mumbai, Maharashtra',
              department: e.department || 'Operations',
              designation: e.designation || 'Associate',
              gradeId: e.grade_id || 'G2',
              roleId: e.role_id || 'EMPLOYEE',
              role: e.role_id || 'EMPLOYEE',
              managerId: e.manager_id || '',
              manager: e.manager || '',
              reportingManager: e.manager || '',
              mentor: e.mentor || '',
              dateOfJoining: e.date_of_joining || '',
              employmentStatus: e.employment_status || e.status || 'ACTIVE',
              status: e.status || e.employment_status || 'ACTIVE'
            }));
            loadedFromMySQL = true;
          }
        } catch (apiErr) {
          console.warn('[EmployeeService] MySQL fetch notice, fallback to Firestore:', apiErr.message);
        }
      }

      // 2. Secondary: Fallback to Firestore if MySQL was empty or failed
      if (!loadedFromMySQL && typeof db !== 'undefined') {
        let query = db.collection('employees');
        const snapshot = await query.get();
        records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (loadedFromMySQL && typeof db !== 'undefined') {
        // Also merge any Firestore-only records that might not be in MySQL yet
        try {
          const snapshot = await db.collection('employees').get();
          const existingCodes = new Set(records.map(r => (r.employeeCode || '').toUpperCase().trim()));
          const existingIds = new Set(records.map(r => r.id));
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const code = (data.employeeCode || '').toUpperCase().trim();
            if (!existingIds.has(doc.id) && (!code || !existingCodes.has(code))) {
              records.push({ id: doc.id, ...data });
            }
          });
        } catch (_) {}
      }

      // Filter out empty or corrupted records
      records = records.filter(e => e && (e.fullName || e.name || e.employeeCode || e.workEmail || e.email));

      // Client-side filtering for search & attributes
      if (filters.companyId) {
        records = records.filter(e => e.companyId === filters.companyId);
      }
      if (filters.department && filters.department !== 'All Departments') {
        const dTarget = filters.department.toLowerCase().trim();
        records = records.filter(e => (e.department || '').toLowerCase().trim() === dTarget);
      }
      if (filters.employmentStatus && filters.employmentStatus !== 'All Status') {
        records = records.filter(e => (e.employmentStatus || e.status) === filters.employmentStatus);
      }
      if (filters.status && filters.status !== 'All') {
        records = records.filter(e => (e.employmentStatus || e.status) === filters.status);
      }
      if (filters.branchId && filters.branchId !== 'All Branches') {
        records = records.filter(e => e.branchId === filters.branchId || (e.branchName && e.branchName.includes(filters.branchId)));
      }
      if (filters.managerId) {
        records = records.filter(e => e.managerId === filters.managerId);
      }
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
      // 0. Search in Hostinger MySQL API first if available
      if (typeof apiClient !== 'undefined') {
        try {
          const resp = await apiClient.get('employees.php', { id: searchTarget });
          if (resp && resp.success && resp.employee) {
            const e = resp.employee;
            return {
              id: e.id,
              userId: e.user_id || e.id,
              employeeCode: e.employee_code || '',
              firstName: e.first_name || '',
              lastName: e.last_name || '',
              fullName: e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
              name: e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
              email: e.email || e.work_email || '',
              workEmail: e.work_email || e.email || '',
              phone: e.phone || '',
              department: e.department || 'Operations',
              designation: e.designation || 'Associate',
              gradeId: e.grade_id || 'G2',
              roleId: e.role_id || 'EMPLOYEE',
              role: e.role_id || 'EMPLOYEE',
              managerId: e.manager_id || '',
              manager: e.manager || '',
              mentor: e.mentor || '',
              dateOfJoining: e.date_of_joining || '',
              employmentStatus: e.employment_status || e.status || 'ACTIVE',
              status: e.status || e.employment_status || 'ACTIVE'
            };
          }
        } catch (_) {}
      }

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

      Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
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
      // await onboardingService.generateDefaultTasksForEmployee(payload);

      await auditService.log('EMPLOYEE_CREATED', 'PEOPLE', 'employees', docRef.id, { employeeCode, fullName });
        await this.syncToMySQL(payload);
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
        const snap = await db.collection('employees').doc(actualDocId).get();
        if (snap.exists) await this.syncToMySQL(snap.data());
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
  },

  // Sync core employee details to Hostinger MySQL Database (both employees and users tables)
  async syncToMySQL(employeeData) {
    try {
      const code = employeeData.employeeCode || '';
      const email = employeeData.workEmail || employeeData.email || employeeData.personalEmail || '';
      const fullName = employeeData.fullName || employeeData.name || '';
      
      if (!code || !email || !fullName) return;

      const payload = {
        id: employeeData.id || ('emp_' + code.toLowerCase().replace(/[^a-z0-9]/g, '')),
        employee_code: code,
        first_name: employeeData.firstName || fullName.split(/\s+/)[0] || '',
        last_name: employeeData.lastName || fullName.split(/\s+/).slice(1).join(' ') || '',
        full_name: fullName,
        email: email,
        work_email: email,
        phone: employeeData.phone || '',
        department: employeeData.department || 'Operations',
        designation: employeeData.designation || 'Associate',
        role_id: employeeData.roleId || 'EMPLOYEE',
        manager_id: employeeData.managerId || null,
        manager: employeeData.manager || null,
        mentor: employeeData.mentor || null,
        date_of_joining: employeeData.dateOfJoining || employeeData.joiningDate || new Date().toISOString().slice(0, 10),
        employment_status: employeeData.employmentStatus || employeeData.status || 'ACTIVE'
      };

      if (typeof apiClient !== 'undefined') {
        await apiClient.post('employees.php', payload);
      } else {
        await fetch('https://hrmstfw.com/hostinger_backend/employees.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      console.warn('Could not sync employee to MySQL backend:', err);
    }
  },

  // Bulk sync all employees and users from Firestore to Hostinger MySQL
  async syncAllEmployeesToMySQL() {
    try {
      const snap = await db.collection('employees').get();
      const userSnap = await db.collection('users').get();

      const employees = [];
      snap.docs.forEach(doc => {
        const e = doc.data();
        const fullName = e.fullName || e.name || '';
        employees.push({
          id: doc.id,
          employeeCode: e.employeeCode || '',
          fullName: fullName,
          firstName: e.firstName || fullName.split(/\s+/)[0] || '',
          lastName: e.lastName || fullName.split(/\s+/).slice(1).join(' ') || '',
          workEmail: e.workEmail || e.email || '',
          email: e.email || e.workEmail || '',
          phone: e.phone || '',
          department: e.department || 'Operations',
          designation: e.designation || 'Associate',
          roleId: e.roleId || 'EMPLOYEE',
          managerId: e.managerId || null,
          manager: e.manager || null,
          mentor: e.mentor || null,
          dateOfJoining: e.dateOfJoining || e.joiningDate || new Date().toISOString().slice(0, 10),
          employmentStatus: e.employmentStatus || e.status || 'ACTIVE'
        });
      });

      const users = [];
      userSnap.docs.forEach(doc => {
        const u = doc.data();
        const name = u.displayName || u.fullName || u.name || '';
        users.push({
          uid: doc.id,
          employeeCode: u.employeeCode || '',
          email: u.email || '',
          displayName: name,
          firstName: u.firstName || name.split(/\s+/)[0] || '',
          lastName: u.lastName || name.split(/\s+/).slice(1).join(' ') || '',
          phone: u.phone || '',
          roleId: u.roleId || 'EMPLOYEE',
          department: u.department || 'Operations',
          designation: u.designation || 'Associate',
          status: u.status || 'ACTIVE'
        });
      });

      let res;
      try {
        if (typeof apiClient !== 'undefined') {
          res = await apiClient.post('migrate_from_firebase.php', { employees, users });
        } else {
          const r = await fetch('https://hrmstfw.com/hostinger_backend/migrate_from_firebase.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employees, users })
          });
          res = await r.json();
        }
      } catch (bulkErr) {
        console.warn('Bulk migrate endpoint failed, falling back to direct individual sync via employees.php:', bulkErr);
        let count = 0;
        for (const emp of employees) {
          try {
            await this.syncToMySQL(emp);
            count++;
          } catch (_) {}
        }
        res = { success: true, message: `Directly synced ${count} employees to MySQL`, migrated_counts: { employees: count, users: count } };
      }
      return res;
    } catch (err) {
      console.error('Error syncing all employees to MySQL:', err);
      throw err;
    }
  }
};

window.employeeService = employeeService;



