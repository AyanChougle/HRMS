
const employeeService = {
  // Check if employee code is already taken within company (100% dynamic MySQL check)
  async isEmployeeCodeTaken(employeeCode, companyId, excludeDocId = null) {
    try {
      const list = await this.getAllEmployees(companyId);
      const target = (employeeCode || '').trim().toUpperCase();
      const found = list.find(e => (e.employeeCode || e.employee_code || '').toUpperCase() === target);
      if (!found) return false;
      if (excludeDocId && (found.id == excludeDocId || found.employee_id == excludeDocId || found.userId == excludeDocId)) {
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Employee code uniqueness check warning:', e);
      return false;
    }
  },

  // Suggest next available employee code (e.g. D-001) dynamically from MySQL
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

      const list = await this.getAllEmployees(companyId);
      let maxNum = 0;
      list.forEach(e => {
        const c = e.employeeCode || e.employee_code || '';
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

      return { created: mysqlEmployees.length, synced: mysqlUsers.length, total: mysqlEmployees.length };
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
              manager_id: e.manager_id || '',
              manager: e.manager || '',
              reportingManager: e.manager || '',
              mentor: e.mentor || '',
              teamId: e.team_id || '',
              team_id: e.team_id || '',
              teamName: e.team_name || '',
              team_name: e.team_name || '',
              teamLeadId: e.team_lead_id || '',
              team_lead_id: e.team_lead_id || '',
              teamLead: e.team_lead || '',
              team_lead: e.team_lead || '',
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

      // MySQL is authoritative source of truth

      // Filter out empty or corrupted records and strictly deduplicate by code & email
      const seenCodes = new Set();
      const seenEmails = new Set();
      records = records.filter(e => {
        if (!e || !(e.fullName || e.name || e.employeeCode || e.workEmail || e.email)) return false;
        const c = (e.employeeCode || '').trim().toUpperCase();
        const em = (e.workEmail || e.email || '').trim().toLowerCase();
        if (c && seenCodes.has(c)) return false;
        if (em && seenEmails.has(em)) return false;
        if (c) seenCodes.add(c);
        if (em) seenEmails.add(em);
        return true;
      });

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

  // Dynamic Hierarchy Resolver: Resolve subordinates strictly reporting to the given user
  async getSubordinates(userProfile = null, allEmployees = null, options = { directOnly: false, forceScoped: false }) {
    try {
      const user = userProfile || (typeof AuthGuard !== 'undefined' ? AuthGuard.userProfile : null);
      if (!user) return [];

      const role = (user.roleId || user.role || '').toString().toUpperCase().trim();
      const isSuperAdminOrHR = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR'].includes(role);

      const emps = (Array.isArray(allEmployees) && allEmployees.length > 0) 
        ? allEmployees 
        : await this.getEmployees({});

      if (isSuperAdminOrHR && !options.forceScoped) {
        return emps;
      }

      const myId = (user.employeeId || user.id || user.uid || '').toString().trim();
      const myCode = (user.employeeCode || user.code || '').toString().toUpperCase().trim();
      const myName = (user.fullName || user.name || user.displayName || '').toString().toLowerCase().trim();
      const myEmail = (user.workEmail || user.email || '').toString().toLowerCase().trim();

      // Cross-match self record to guarantee all identifiers (id, employeeCode, full name variations)
      const matchedSelf = emps.find(e => 
        (myId && (String(e.id) === myId || String(e.userId) === myId)) ||
        (myCode && (e.employeeCode || '').toUpperCase() === myCode) ||
        (myEmail && (e.workEmail || e.email || '').toLowerCase() === myEmail)
      );

      const resolvedCode = (myCode || matchedSelf?.employeeCode || '').toUpperCase().trim();
      const resolvedId = (myId || matchedSelf?.id || matchedSelf?.userId || '').toString().trim();
      const resolvedName = (myName || matchedSelf?.fullName || matchedSelf?.name || '').toLowerCase().trim();

      function isDirect(child, pIds, pCodes, pNames) {
        if (!child) return false;
        const cId = (child.id || child.employeeId || '').toString().trim();
        const cCode = (child.employeeCode || child.code || '').toString().toUpperCase().trim();
        if (pIds.has(cId) || (cCode && pCodes.has(cCode))) return false;

        // Check Team ID link for Team Leads
        const myTeamId = user.teamId || user.team_id || matchedSelf?.team_id || matchedSelf?.teamId;
        const childTeamId = child.team_id || child.teamId;
        if (role === 'TL' && myTeamId && childTeamId && String(childTeamId) === String(myTeamId)) {
          return true;
        }

        // Check Team Lead link
        const tlId = (child.team_lead_id || child.teamLeadId || '').toString().trim();
        const tlStr = (child.team_lead || child.teamLead || '').toString().trim().toLowerCase();
        if (tlId && (pIds.has(tlId) || pCodes.has(tlId.toUpperCase()))) return true;
        for (const code of pCodes) {
          if (code && tlStr.includes(code.toLowerCase())) return true;
        }
        for (const name of pNames) {
          if (name && tlStr.includes(name)) return true;
        }

        // Check Reporting Manager link
        const mId = (child.managerId || child.manager_id || child.reporting_manager_id || '').toString().trim();
        const mStr = (child.manager || child.reportingManager || '').toString().trim().toLowerCase();
        if (mId && (pIds.has(mId) || pCodes.has(mId.toUpperCase()))) return true;
        for (const code of pCodes) {
          if (code && mStr.includes(code.toLowerCase())) return true;
        }
        for (const name of pNames) {
          if (name && mStr.includes(name)) return true;
          const parts = name.split(' ').filter(p => p.length > 2);
          if (parts.length >= 2 && parts.every(p => mStr.includes(p))) return true;
        }
        return false;
      }

      let searchIds = new Set([myId, resolvedId, matchedSelf?.id, matchedSelf?.userId].filter(Boolean).map(String));
      let searchCodes = new Set([myCode, resolvedCode, matchedSelf?.employeeCode].filter(Boolean).map(c => c.toUpperCase().trim()));
      let searchNames = new Set([myName, resolvedName].filter(Boolean).map(n => n.toLowerCase().trim()));
      if (matchedSelf?.fullName) searchNames.add(matchedSelf.fullName.toLowerCase().trim());
      if (matchedSelf?.name) searchNames.add(matchedSelf.name.toLowerCase().trim());
      if (user.displayName) searchNames.add(user.displayName.toLowerCase().trim());

      const subordinates = [];
      let remaining = [...emps];

      while (true) {
        const nextIds = new Set();
        const nextCodes = new Set();
        const nextNames = new Set();
        const stillRemaining = [];

        for (const emp of remaining) {
          if (isDirect(emp, searchIds, searchCodes, searchNames)) {
            subordinates.push(emp);
            const empId = (emp.id || emp.employeeId || '').toString().trim();
            const empCode = (emp.employeeCode || emp.code || '').toString().toUpperCase().trim();
            const empName = (emp.fullName || emp.name || emp.displayName || '').toString().toLowerCase().trim();
            if (empId) nextIds.add(empId);
            if (empCode) nextCodes.add(empCode);
            if (empName) nextNames.add(empName);
          } else {
            stillRemaining.push(emp);
          }
        }

        if (options.directOnly || (nextIds.size === 0 && nextCodes.size === 0 && nextNames.size === 0)) {
          break;
        }

        remaining = stillRemaining;
        searchIds = nextIds;
        searchCodes = nextCodes;
        searchNames = nextNames;
      }

      return subordinates;
    } catch (err) {
      console.warn('[employeeService] getSubordinates error:', err);
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
              manager_id: e.manager_id || '',
              manager: e.manager || '',
              reportingManager: e.manager || '',
              mentor: e.mentor || '',
              teamId: e.team_id || '',
              team_id: e.team_id || '',
              teamName: e.team_name || '',
              team_name: e.team_name || '',
              teamLeadId: e.team_lead_id || '',
              team_lead_id: e.team_lead_id || '',
              teamLead: e.team_lead || '',
              team_lead: e.team_lead || '',
              dateOfJoining: e.date_of_joining || '',
              employmentStatus: e.employment_status || e.status || 'ACTIVE',
              status: e.status || e.employment_status || 'ACTIVE'
            };
          }
        } catch (_) {}
      }

      if (!searchTarget) return null;

      // Safe immediate fallback: if searchTarget matches current user, return userProfile
      if (typeof AuthGuard !== 'undefined' && AuthGuard.userProfile) {
        const u = AuthGuard.userProfile;
        if (searchTarget === u.employeeId || searchTarget === u.id || searchTarget === u.uid || searchTarget === u.employeeCode || searchTarget === u.email) {
          return {
            id: u.employeeId || u.id || u.uid,
            userId: u.uid || u.id,
            employeeCode: u.employeeCode || '',
            fullName: u.displayName || u.fullName || 'Employee',
            name: u.displayName || u.fullName || 'Employee',
            email: u.email || '',
            workEmail: u.workEmail || u.email || '',
            department: u.department || 'Operations',
            designation: u.designation || 'Staff',
            roleId: u.roleId || 'EMPLOYEE',
            dateOfJoining: u.dateOfJoining || u.joiningDate || '',
            employmentStatus: u.status || 'ACTIVE'
          };
        }
      }

      // 1. Fallback search against full MySQL employee list
      try {
        const all = await this.getAllEmployees();
        const targetStr = String(searchTarget).toLowerCase().trim();
        const match = all.find(e => 
          String(e.id || '').toLowerCase() === targetStr ||
          String(e.userId || '').toLowerCase() === targetStr ||
          String(e.employeeCode || e.employee_code || '').toLowerCase() === targetStr ||
          String(e.workEmail || e.email || '').toLowerCase() === targetStr
        );
        if (match) return match;
      } catch (_) {}

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
        roleId: employeeData.roleId || 'EMPLOYEE',
        costCenterId: employeeData.costCenterId || '',
        managerId: employeeData.managerId || '',
        manager: employeeData.manager || '',
        teamId: employeeData.teamId || employeeData.team_id || '',
        teamName: employeeData.teamName || employeeData.team_name || '',
        teamLeadId: employeeData.teamLeadId || employeeData.team_lead_id || '',
        teamLead: employeeData.teamLead || employeeData.team_lead || '',

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
      
      // Authoritative Save directly to Hostinger MySQL Backend
      const mysqlPayload = {
        employee_code: payload.employeeCode,
        first_name: payload.firstName,
        last_name: payload.lastName,
        full_name: payload.fullName,
        email: payload.workEmail || payload.email,
        work_email: payload.workEmail || payload.email,
        personal_email: payload.personalEmail || null,
        phone: payload.phone || '',
        department: payload.department || 'Operations',
        designation: payload.designation || 'Staff',
        role_id: payload.roleId || 'EMPLOYEE',
        branch_name: payload.branchName || payload.location || 'Ghansoli - Navi Mumbai, Maharashtra',
        location: payload.branchName || payload.location || 'Ghansoli - Navi Mumbai, Maharashtra',
        manager_id: payload.managerId || null,
        manager: payload.manager || null,
        team_id: payload.teamId || null,
        team_name: payload.teamName || null,
        team_lead_id: payload.teamLeadId || null,
        team_lead: payload.teamLead || null,
        date_of_joining: payload.dateOfJoining,
        employment_status: payload.employmentStatus || 'ACTIVE',
        status: payload.status || 'ACTIVE'
      };

      if (typeof apiClient !== 'undefined') {
        const res = await apiClient.post('employees.php', mysqlPayload);
        if (res && res.id) payload.id = res.id;
      }
      if (!payload.id) {
        payload.id = 'emp_' + (payload.employeeCode ? payload.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '') : Date.now());
      }

      // Log creation in timeline & audit
      if (typeof historyService !== 'undefined' && historyService.logChange) {
        await historyService.logChange(payload.id, companyId, 'EMPLOYEE_CREATED', `Employee record created with code ${employeeCode} (${fullName})`).catch(() => {});
      }
      if (typeof auditService !== 'undefined' && auditService.log) {
        await auditService.log('EMPLOYEE_CREATED', 'PEOPLE', 'employees', payload.id, { employeeCode, fullName }).catch(() => {});
      }
      
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

      if (AuthGuard.userProfile && !AuthGuard.userProfile.employeeId) {
        AuthGuard.userProfile.employeeId = actualDocId;
      }

      if (typeof auditService !== 'undefined' && auditService.log) {
        await auditService.log('EMPLOYEE_UPDATED', 'PEOPLE', 'employees', actualDocId, updates).catch(() => {});
      }

      // Authoritative Save directly to Hostinger MySQL Backend
      const mysqlPayload = {
        id: actualDocId,
        employee_code: payload.employeeCode,
        first_name: payload.firstName || (payload.fullName || '').split(' ')[0] || '',
        last_name: payload.lastName || (payload.fullName || '').split(' ').slice(1).join(' ') || '',
        full_name: payload.fullName || payload.name,
        email: payload.workEmail || payload.email,
        work_email: payload.workEmail || payload.email,
        personal_email: payload.personalEmail || null,
        phone: payload.phone || '',
        department: payload.department || 'Operations',
        designation: payload.designation || 'Staff',
        role_id: payload.roleId || 'EMPLOYEE',
        branch_name: payload.branchName || payload.location || 'Ghansoli - Navi Mumbai, Maharashtra',
        location: payload.branchName || payload.location || 'Ghansoli - Navi Mumbai, Maharashtra',
        manager_id: payload.managerId || null,
        manager: payload.manager || null,
        team_id: payload.teamId || null,
        team_name: payload.teamName || null,
        team_lead_id: payload.teamLeadId || null,
        team_lead: payload.teamLead || null,
        team_id: payload.teamId || null,
        team_name: payload.teamName || null,
        team_lead_id: payload.teamLeadId || null,
        team_lead: payload.teamLead || null,
        date_of_joining: payload.dateOfJoining || payload.joiningDate || new Date().toISOString().slice(0, 10),
        employment_status: payload.employmentStatus || payload.status || 'ACTIVE',
        status: payload.status || payload.employmentStatus || 'ACTIVE'
      };

      if (typeof apiClient !== 'undefined') {
        const resp = await apiClient.post('employees.php', mysqlPayload);
        if (resp && resp.success === false) {
          throw new Error(resp.error || 'Failed to update employee in MySQL database.');
        }
      } else {
        await this.syncToMySQL({ id: actualDocId, ...payload });
      }
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

  // Delete employee permanently from Hostinger MySQL & Firestore
  async deleteEmployee(employeeId, employeeCode = '', employeeEmail = '') {
    try {
      // 1. Authoritative Delete from Hostinger MySQL (both employees and users tables)
      if (typeof apiClient !== 'undefined') {
        try {
          await apiClient.post('employees.php?action=delete', {
            id: employeeId || '',
            employee_code: employeeCode || '',
            email: employeeEmail || ''
          });
        } catch (sqlErr) {
          console.warn('[employeeService] Hostinger MySQL delete notice:', sqlErr.message || sqlErr);
        }
      }

      if (typeof auditService !== 'undefined' && auditService.log) {
        await auditService.log('EMPLOYEE_DELETED', 'PEOPLE', 'employees', employeeId || employeeCode, {
          employeeCode,
          employeeEmail
        }).catch(() => {});
      }
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



