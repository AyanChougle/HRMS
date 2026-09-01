/**
 * DIALLO HRMS — ORGANIZATION & COMPANY ADMINISTRATION SERVICE (PHASE 15)
 * Centralized Enterprise Master managing Company Profiles, Multi-Company Isolation,
 * Branches, Departments, Designations, Shifts, Holidays, Leave Types, Policies,
 * Work Locations, and Organization Change History.
 */

const organizationService = {
  DEFAULT_COMPANY_ID: 'comp_diallo_india',

  // 1. COMPANY PROFILE & REGIONAL SETTINGS
  async getCompany(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const doc = await db.collection('companies').doc(companyId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      // Seed default company if missing
      const defaultCompany = {
        name: 'Diallo India Private Limited',
        legalName: 'Diallo India Private Limited',
        code: 'DIALLO-IN',
        registrationNumber: 'U72900MH2024PTC123456',
        taxGstNumber: '27AABCD1234E1Z5',
        cin: 'U72900MH2024PTC123456',
        pan: 'AABCD1234E',
        industry: 'Information Technology & Software Services',
        website: 'https://diallo-hrms.com',
        email: 'admin@diallo-hrms.com',
        phone: '+91 22 6123 4567',
        address: 'B-Wing, 8th Floor, BKC Financial Tower, Bandra Kurla Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400051',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12-hour',
        weekStartDay: 'Monday',
        financialYearStart: '01/04',
        defaultLanguage: 'English',
        logoUrl: '',
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('companies').doc(companyId).set(defaultCompany);
      return { id: companyId, ...defaultCompany };
    } catch (err) {
      console.error('Error fetching company profile:', err);
      return null;
    }
  },

  async updateCompany(companyId, updateData) {
    try {
      const payload = {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('companies').doc(companyId).update(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('COMPANY_UPDATED', 'ORGANIZATION', 'companies', companyId, updateData);
      }
      return true;
    } catch (err) {
      console.error('Error updating company profile:', err);
      throw err;
    }
  },

  async uploadCompanyLogo(companyId, file) {
    try {
      const uploadRecord = await hostingerStorageService.uploadFile(file, {
        category: 'COMPANY_DOCUMENTS',
        companyId
      });
      const logoUrl = uploadRecord.fileUrl;
      await this.updateCompany(companyId, { logoUrl });
      return logoUrl;
    } catch (err) {
      console.error('Error uploading company logo:', err);
      throw err;
    }
  },

  // 2. BRANCH MANAGEMENT
  async getBranches(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('branches')
        .where('companyId', '==', companyId)
        .get();
      
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length === 0) {
        // Seed default branches
        const defaults = [
          {
            name: 'HQ - Mumbai',
            code: 'BOM-01',
            address: 'BKC Financial Center, Bandra East',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            postalCode: '400051',
            phone: '+91 22 6123 4567',
            email: 'mumbai@diallo-hrms.com',
            timezone: 'Asia/Kolkata',
            status: 'ACTIVE',
            companyId
          },
          {
            name: 'Bengaluru Tech Park',
            code: 'BLR-02',
            address: 'Outer Ring Road, Bellandur',
            city: 'Bengaluru',
            state: 'Karnataka',
            country: 'India',
            postalCode: '560103',
            phone: '+91 80 4123 7890',
            email: 'bengaluru@diallo-hrms.com',
            timezone: 'Asia/Kolkata',
            status: 'ACTIVE',
            companyId
          },
          {
            name: 'Delhi NCR Hub',
            code: 'DEL-03',
            address: 'Cyber City, Phase 2',
            city: 'Gurugram',
            state: 'Haryana',
            country: 'India',
            postalCode: '122002',
            phone: '+91 124 456 7890',
            email: 'delhi@diallo-hrms.com',
            timezone: 'Asia/Kolkata',
            status: 'ACTIVE',
            companyId
          }
        ];
        for (const b of defaults) {
          const docRef = await db.collection('branches').add({
            ...b,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          list.push({ id: docRef.id, ...b });
        }
      }
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (err) {
      console.error('Error fetching branches:', err);
      return [];
    }
  },

  async createBranch(data) {
    try {
      const companyId = data.companyId || this.DEFAULT_COMPANY_ID;
      // Duplicate code check
      const codeCheck = await db.collection('branches')
        .where('companyId', '==', companyId)
        .where('code', '==', data.code.toUpperCase())
        .get();
      if (!codeCheck.empty) {
        throw new Error(`Branch code "${data.code}" is already in use.`);
      }

      const payload = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || 'India',
        postalCode: data.postalCode || '',
        phone: data.phone || '',
        email: data.email || '',
        managerId: data.managerId || '',
        managerName: data.managerName || '',
        timezone: data.timezone || 'Asia/Kolkata',
        status: data.status || 'ACTIVE',
        companyId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('branches').add(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('BRANCH_CREATED', 'ORGANIZATION', 'branches', docRef.id, payload);
      }
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating branch:', err);
      throw err;
    }
  },

  async updateBranch(id, data) {
    try {
      const payload = {
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('branches').doc(id).update(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('BRANCH_UPDATED', 'ORGANIZATION', 'branches', id, data);
      }
      return true;
    } catch (err) {
      console.error('Error updating branch:', err);
      throw err;
    }
  },

  async deactivateBranch(id) {
    return this.updateBranch(id, { status: 'INACTIVE' });
  },

  // 3. DEPARTMENT & SUB-DEPARTMENT MANAGEMENT
  async getDepartments(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('departments')
        .where('companyId', '==', companyId)
        .get();
      
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length === 0) {
        const defaults = [
          { name: 'Engineering', code: 'ENG', description: 'Software Architecture & Development', parentDepartmentId: '', status: 'ACTIVE', companyId },
          { name: 'Human Resources', code: 'HR', description: 'Talent Acquisition, Payroll & People Ops', parentDepartmentId: '', status: 'ACTIVE', companyId },
          { name: 'Finance & Accounts', code: 'FIN', description: 'Treasury, Invoicing & Tax Compliance', parentDepartmentId: '', status: 'ACTIVE', companyId },
          { name: 'Sales & Marketing', code: 'SALES', description: 'Enterprise Accounts & Growth', parentDepartmentId: '', status: 'ACTIVE', companyId },
          { name: 'Operations & IT', code: 'OPS', description: 'Infrastructure, Security & Admin', parentDepartmentId: '', status: 'ACTIVE', companyId }
        ];
        for (const d of defaults) {
          const docRef = await db.collection('departments').add({
            ...d,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          list.push({ id: docRef.id, ...d });
        }
      }
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (err) {
      console.error('Error fetching departments:', err);
      return [];
    }
  },

  async createDepartment(data) {
    try {
      const companyId = data.companyId || this.DEFAULT_COMPANY_ID;
      const codeCheck = await db.collection('departments')
        .where('companyId', '==', companyId)
        .where('code', '==', data.code.toUpperCase())
        .get();
      if (!codeCheck.empty) {
        throw new Error(`Department code "${data.code}" is already in use.`);
      }

      const payload = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description || '',
        headEmployeeId: data.headEmployeeId || '',
        headEmployeeName: data.headEmployeeName || '',
        parentDepartmentId: data.parentDepartmentId || '',
        status: data.status || 'ACTIVE',
        companyId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('departments').add(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('DEPARTMENT_CREATED', 'ORGANIZATION', 'departments', docRef.id, payload);
      }
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating department:', err);
      throw err;
    }
  },

  async updateDepartment(id, data) {
    try {
      // Circular hierarchy check
      if (data.parentDepartmentId && data.parentDepartmentId === id) {
        throw new Error('A department cannot be its own parent department.');
      }
      const payload = {
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('departments').doc(id).update(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('DEPARTMENT_UPDATED', 'ORGANIZATION', 'departments', id, data);
      }
      return true;
    } catch (err) {
      console.error('Error updating department:', err);
      throw err;
    }
  },

  // 4. DESIGNATION & JOB LEVELS
  async getJobLevels(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('jobLevels')
        .where('companyId', '==', companyId)
        .get();
      
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length === 0) {
        const defaults = [
          { rank: 1, name: 'Executive / Junior', code: 'L1', description: 'Entry-level individual contributor', companyId },
          { rank: 2, name: 'Associate / Mid-Level', code: 'L2', description: 'Mid-level specialist', companyId },
          { rank: 3, name: 'Senior / Lead', code: 'L3', description: 'Senior expert and team mentor', companyId },
          { rank: 4, name: 'Principal / Manager', code: 'L4', description: 'Domain leader or people manager', companyId },
          { rank: 5, name: 'Director / Head', code: 'L5', description: 'Department leader and strategist', companyId },
          { rank: 6, name: 'Executive / C-Level', code: 'L6', description: 'Company officer and board level', companyId }
        ];
        for (const lvl of defaults) {
          const docRef = await db.collection('jobLevels').add({
            ...lvl,
            status: 'ACTIVE',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          list.push({ id: docRef.id, ...lvl, status: 'ACTIVE' });
        }
      }
      return list.sort((a, b) => (a.rank || 0) - (b.rank || 0));
    } catch (err) {
      console.error('Error fetching job levels:', err);
      return [];
    }
  },

  async createJobLevel(data) {
    try {
      const payload = {
        rank: Number(data.rank) || 1,
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description || '',
        companyId: data.companyId || this.DEFAULT_COMPANY_ID,
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('jobLevels').add(payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating job level:', err);
      throw err;
    }
  },

  async getDesignations(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('designations')
        .where('companyId', '==', companyId)
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (err) {
      console.error('Error fetching designations:', err);
      return [];
    }
  },

  async createDesignation(data) {
    try {
      const companyId = data.companyId || this.DEFAULT_COMPANY_ID;
      const codeCheck = await db.collection('designations')
        .where('companyId', '==', companyId)
        .where('code', '==', data.code.toUpperCase())
        .get();
      if (!codeCheck.empty) {
        throw new Error(`Designation code "${data.code}" already exists.`);
      }

      const payload = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description || '',
        levelId: data.levelId || '',
        levelName: data.levelName || '',
        departmentId: data.departmentId || '',
        departmentName: data.departmentName || '',
        status: data.status || 'ACTIVE',
        companyId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('designations').add(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('DESIGNATION_CREATED', 'ORGANIZATION', 'designations', docRef.id, payload);
      }
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating designation:', err);
      throw err;
    }
  },

  async updateDesignation(id, data) {
    try {
      const payload = {
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('designations').doc(id).update(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('DESIGNATION_UPDATED', 'ORGANIZATION', 'designations', id, data);
      }
      return true;
    } catch (err) {
      console.error('Error updating designation:', err);
      throw err;
    }
  },

  // 5. SHIFT MASTER & OVERNIGHT SHIFTS
  async getShifts(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('shifts')
        .where('companyId', '==', companyId)
        .get();
      
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length === 0) {
        const defaults = [
          { name: 'General Day Shift', code: 'GEN', startTime: '09:00', endTime: '18:00', breakDuration: 60, gracePeriod: 15, workingHours: 8, isOvernight: false, status: 'ACTIVE', companyId },
          { name: 'Morning Early Shift', code: 'MORN', startTime: '06:00', endTime: '15:00', breakDuration: 60, gracePeriod: 15, workingHours: 8, isOvernight: false, status: 'ACTIVE', companyId },
          { name: 'Afternoon Shift', code: 'AFTN', startTime: '14:00', endTime: '23:00', breakDuration: 60, gracePeriod: 15, workingHours: 8, isOvernight: false, status: 'ACTIVE', companyId },
          { name: 'Night / Overnight Shift', code: 'NIGHT', startTime: '22:00', endTime: '07:00', breakDuration: 60, gracePeriod: 15, workingHours: 8, isOvernight: true, status: 'ACTIVE', companyId }
        ];
        for (const s of defaults) {
          const docRef = await db.collection('shifts').add({
            ...s,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          list.push({ id: docRef.id, ...s });
        }
      }
      return list;
    } catch (err) {
      console.error('Error fetching shifts:', err);
      return [];
    }
  },

  async createShift(data) {
    try {
      const companyId = data.companyId || this.DEFAULT_COMPANY_ID;
      const isOvernight = data.isOvernight || (data.endTime < data.startTime);

      let workingHours = Number(data.workingHours);
      if (!workingHours) {
        // Calculate diff in hours
        const [sh, sm] = data.startTime.split(':').map(Number);
        const [eh, em] = data.endTime.split(':').map(Number);
        let startMins = sh * 60 + sm;
        let endMins = eh * 60 + em;
        if (endMins < startMins) endMins += 24 * 60; // Next day
        const netMins = endMins - startMins - (Number(data.breakDuration) || 60);
        workingHours = Number((netMins / 60).toFixed(1));
      }

      const payload = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        startTime: data.startTime,
        endTime: data.endTime,
        breakDuration: Number(data.breakDuration) || 60,
        gracePeriod: Number(data.gracePeriod) || 15,
        workingHours,
        isOvernight,
        status: data.status || 'ACTIVE',
        companyId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('shifts').add(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('SHIFT_CREATED', 'ORGANIZATION', 'shifts', docRef.id, payload);
      }
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating shift:', err);
      throw err;
    }
  },

  async updateShift(id, data) {
    try {
      const isOvernight = data.isOvernight || (data.endTime && data.startTime && data.endTime < data.startTime);
      const payload = {
        ...data,
        isOvernight,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('shifts').doc(id).update(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('SHIFT_UPDATED', 'ORGANIZATION', 'shifts', id, data);
      }
      return true;
    } catch (err) {
      console.error('Error updating shift:', err);
      throw err;
    }
  },

  // 6. HOLIDAY CALENDAR & MANAGEMENT
  async getHolidays(companyId = this.DEFAULT_COMPANY_ID, year = new Date().getFullYear()) {
    try {
      const snap = await db.collection('holidays')
        .where('companyId', '==', companyId)
        .get();
      
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length === 0) {
        const defaults = [
          { name: 'Republic Day', date: `${year}-01-26`, type: 'PUBLIC', branchIds: ['ALL'], description: 'National Holiday', status: 'ACTIVE', companyId },
          { name: 'Holi', date: `${year}-03-25`, type: 'PUBLIC', branchIds: ['ALL'], description: 'Festival of Colors', status: 'ACTIVE', companyId },
          { name: 'Independence Day', date: `${year}-08-15`, type: 'PUBLIC', branchIds: ['ALL'], description: 'National Holiday', status: 'ACTIVE', companyId },
          { name: 'Gandhi Jayanti', date: `${year}-10-02`, type: 'PUBLIC', branchIds: ['ALL'], description: 'National Holiday', status: 'ACTIVE', companyId },
          { name: 'Diwali (Laxmi Pujan)', date: `${year}-11-01`, type: 'PUBLIC', branchIds: ['ALL'], description: 'Festival of Lights', status: 'ACTIVE', companyId },
          { name: 'Christmas Day', date: `${year}-12-25`, type: 'PUBLIC', branchIds: ['ALL'], description: 'Christmas', status: 'ACTIVE', companyId },
          { name: 'Maharashtra Day', date: `${year}-05-01`, type: 'REGIONAL', branchIds: ['BOM-01'], description: 'State Holiday for Mumbai Branch', status: 'ACTIVE', companyId }
        ];
        for (const h of defaults) {
          const docRef = await db.collection('holidays').add({
            ...h,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          list.push({ id: docRef.id, ...h });
        }
      }
      return list.sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      console.error('Error fetching holidays:', err);
      return [];
    }
  },

  async createHoliday(data) {
    try {
      const companyId = data.companyId || this.DEFAULT_COMPANY_ID;
      const payload = {
        name: data.name.trim(),
        date: data.date,
        type: data.type || 'PUBLIC',
        branchIds: data.branchIds && data.branchIds.length > 0 ? data.branchIds : ['ALL'],
        description: data.description || '',
        status: 'ACTIVE',
        companyId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('holidays').add(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('HOLIDAY_CREATED', 'ORGANIZATION', 'holidays', docRef.id, payload);
      }
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating holiday:', err);
      throw err;
    }
  },

  async deleteHoliday(id) {
    try {
      await db.collection('holidays').doc(id).delete();
      if (typeof auditService !== 'undefined') {
        await auditService.log('HOLIDAY_DELETED', 'ORGANIZATION', 'holidays', id, {});
      }
      return true;
    } catch (err) {
      console.error('Error deleting holiday:', err);
      throw err;
    }
  },

  // 7. LEAVE TYPES MASTER
  async getLeaveTypes(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('leaveTypes')
        .where('companyId', '==', companyId)
        .get();
      
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length === 0) {
        const defaults = [
          { name: 'Annual / Privilege Leave', code: 'AL', paid: true, annualAllocation: 18, carryForwardAllowed: true, maximumCarryForward: 10, requiresDocument: false, requiresApproval: true, status: 'ACTIVE', companyId },
          { name: 'Casual Leave', code: 'CL', paid: true, annualAllocation: 12, carryForwardAllowed: false, maximumCarryForward: 0, requiresDocument: false, requiresApproval: true, status: 'ACTIVE', companyId },
          { name: 'Sick / Medical Leave', code: 'SL', paid: true, annualAllocation: 10, carryForwardAllowed: true, maximumCarryForward: 5, requiresDocument: true, requiresApproval: true, status: 'ACTIVE', companyId },
          { name: 'Maternity Leave', code: 'ML', paid: true, annualAllocation: 180, carryForwardAllowed: false, maximumCarryForward: 0, requiresDocument: true, requiresApproval: true, status: 'ACTIVE', companyId },
          { name: 'Paternity Leave', code: 'PL', paid: true, annualAllocation: 15, carryForwardAllowed: false, maximumCarryForward: 0, requiresDocument: false, requiresApproval: true, status: 'ACTIVE', companyId },
          { name: 'Leave Without Pay', code: 'LWP', paid: false, annualAllocation: 0, carryForwardAllowed: false, maximumCarryForward: 0, requiresDocument: false, requiresApproval: true, status: 'ACTIVE', companyId }
        ];
        for (const lt of defaults) {
          const docRef = await db.collection('leaveTypes').add({
            ...lt,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          list.push({ id: docRef.id, ...lt });
        }
      }
      return list;
    } catch (err) {
      console.error('Error fetching leave types:', err);
      return [];
    }
  },

  async createLeaveType(data) {
    try {
      const payload = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        paid: data.paid !== false,
        annualAllocation: Number(data.annualAllocation) || 0,
        carryForwardAllowed: !!data.carryForwardAllowed,
        maximumCarryForward: Number(data.maximumCarryForward) || 0,
        requiresDocument: !!data.requiresDocument,
        requiresApproval: data.requiresApproval !== false,
        description: data.description || '',
        status: 'ACTIVE',
        companyId: data.companyId || this.DEFAULT_COMPANY_ID,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('leaveTypes').add(payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating leave type:', err);
      throw err;
    }
  },

  // 8. HR POLICIES & ACKNOWLEDGEMENT
  async getPolicies(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('policies')
        .where('companyId', '==', companyId)
        .get();
      
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length === 0) {
        const defaults = [
          { title: 'Employee Code of Conduct', category: 'COMPLIANCE', version: 'v2.0', description: 'Enterprise ethical guidelines, confidentiality, and anti-harassment standards', effectiveDate: '2026-01-01', status: 'PUBLISHED', companyId },
          { title: 'Hybrid & Remote Work Policy', category: 'WORKPLACE', version: 'v1.4', description: 'Guidelines for telecommuting, working hours, and cybersecurity hygiene', effectiveDate: '2026-01-01', status: 'PUBLISHED', companyId },
          { title: 'Travel & Expense Reimbursement Policy', category: 'FINANCE', version: 'v3.1', description: 'Daily allowances, lodging limits, and receipt upload deadlines', effectiveDate: '2026-04-01', status: 'PUBLISHED', companyId },
          { title: 'Information Security & Device Custody', category: 'IT', version: 'v2.2', description: 'Hardware asset care, password protocols, and data protection rules', effectiveDate: '2026-01-01', status: 'PUBLISHED', companyId }
        ];
        for (const p of defaults) {
          const docRef = await db.collection('policies').add({
            ...p,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          list.push({ id: docRef.id, ...p });
        }
      }
      return list;
    } catch (err) {
      console.error('Error fetching policies:', err);
      return [];
    }
  },

  async createPolicy(data, file = null) {
    try {
      const companyId = data.companyId || this.DEFAULT_COMPANY_ID;
      let documentUrl = '';
      let documentName = '';

      if (file) {
        const uploadRecord = await hostingerStorageService.uploadFile(file, {
          category: 'COMPANY_POLICY',
          companyId
        });
        documentUrl = uploadRecord.fileUrl;
        documentName = file.name;
      }

      const payload = {
        title: data.title.trim(),
        category: data.category || 'GENERAL',
        description: data.description || '',
        version: data.version || 'v1.0',
        effectiveDate: data.effectiveDate || new Date().toISOString().split('T')[0],
        documentUrl,
        documentName,
        status: data.status || 'PUBLISHED',
        createdBy: AuthGuard.userProfile?.displayName || 'HR Administration',
        companyId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('policies').add(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('POLICY_CREATED', 'ORGANIZATION', 'policies', docRef.id, payload);
      }
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating policy:', err);
      throw err;
    }
  },

  // 9. WORK LOCATIONS & EMPLOYMENT TYPES
  async getWorkLocations(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('workLocations')
        .where('companyId', '==', companyId)
        .get();
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length === 0) {
        const defaults = [
          { name: 'Mumbai Head Office', type: 'OFFICE', address: 'BKC, Mumbai', timezone: 'Asia/Kolkata', status: 'ACTIVE', companyId },
          { name: 'Bengaluru Tech Hub', type: 'OFFICE', address: 'Bellandur, Bengaluru', timezone: 'Asia/Kolkata', status: 'ACTIVE', companyId },
          { name: 'Remote — India', type: 'REMOTE', address: 'Work From Anywhere (India)', timezone: 'Asia/Kolkata', status: 'ACTIVE', companyId },
          { name: 'Hybrid Workforce', type: 'HYBRID', address: 'Designated Branch Hybrid', timezone: 'Asia/Kolkata', status: 'ACTIVE', companyId }
        ];
        for (const loc of defaults) {
          const docRef = await db.collection('workLocations').add({
            ...loc,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          list.push({ id: docRef.id, ...loc });
        }
      }
      return list;
    } catch (err) {
      console.error('Error fetching work locations:', err);
      return [];
    }
  },

  async createWorkLocation(data) {
    try {
      const payload = {
        name: data.name.trim(),
        type: data.type || 'OFFICE',
        address: data.address || '',
        timezone: data.timezone || 'Asia/Kolkata',
        status: 'ACTIVE',
        companyId: data.companyId || this.DEFAULT_COMPANY_ID,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('workLocations').add(payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Error creating work location:', err);
      throw err;
    }
  },

  // 10. RECORD ORGANIZATION CHANGE HISTORY (Effective Dates)
  async recordOrgChange(employeeId, employeeName, changeType, fromVal, toVal, effectiveDate = null) {
    try {
      const payload = {
        employeeId,
        employeeName,
        changeType,
        fromValue: fromVal,
        toValue: toVal,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        changedBy: AuthGuard.userProfile?.displayName || 'System Admin',
        companyId: AuthGuard.userProfile?.companyId || this.DEFAULT_COMPANY_ID,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('organizationHistory').add(payload);
    } catch (e) {
      console.warn('Could not record org change history:', e);
    }
  }
};

window.organizationService = organizationService;
