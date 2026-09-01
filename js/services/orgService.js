/**
 * DIALLO HRMS — ORGANIZATION STRUCTURE & ORG CHART SERVICE (PHASE 4)
 * Manages Designations, Grades (G1-G5), Cost Centers, Branches, and Dynamic Org Chart Hierarchy
 */

const orgService = {
  // 1. DESIGNATIONS
  async getDesignations(companyId = null) {
    try {
      let query = db.collection('designations');
      if (companyId) query = query.where('companyId', '==', companyId);
      const snapshot = await query.get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching designations:', e);
      return [];
    }
  },

  async createDesignation(data) {
    try {
      const payload = {
        name: data.name,
        code: (data.code || data.name.substring(0, 4)).toUpperCase(),
        departmentId: data.departmentId || '',
        departmentName: data.departmentName || '',
        gradeId: data.gradeId || 'G2',
        description: data.description || '',
        companyId: data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('designations').add(payload);
      await auditService.log('DESIGNATION_CREATED', 'ORGANIZATION', 'designations', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating designation:', e);
      throw e;
    }
  },

  // 2. GRADES (G1 - G5)
  async getGrades(companyId = null) {
    try {
      let query = db.collection('grades');
      if (companyId) query = query.where('companyId', '==', companyId);
      const snapshot = await query.get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching grades:', e);
      return [];
    }
  },

  async createGrade(data) {
    try {
      const payload = {
        name: data.name,
        code: data.code.toUpperCase(),
        level: Number(data.level) || 1,
        description: data.description || '',
        companyId: data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('grades').add(payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating grade:', e);
      throw e;
    }
  },

  // 3. COST CENTERS
  async getCostCenters(companyId = null) {
    try {
      let query = db.collection('costCenters');
      if (companyId) query = query.where('companyId', '==', companyId);
      const snapshot = await query.get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching cost centers:', e);
      return [];
    }
  },

  async createCostCenter(data) {
    try {
      const payload = {
        name: data.name,
        code: (data.code || data.name.substring(0, 3)).toUpperCase(),
        description: data.description || '',
        companyId: data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('costCenters').add(payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating cost center:', e);
      throw e;
    }
  },

  // 4. BRANCHES
  async getBranches(companyId = null) {
    try {
      const targetCompany = companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      let query = db.collection('branches').where('companyId', '==', targetCompany);
      const snapshot = await query.get();
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      // Seed initial default branches if empty
      const defaultBranches = [
        { code: 'BOM-01', name: 'HQ - Mumbai', city: 'Mumbai', state: 'Maharashtra', country: 'India', companyId: targetCompany, status: 'ACTIVE' },
        { code: 'BLR-01', name: 'Bengaluru Tech Park', city: 'Bengaluru', state: 'Karnataka', country: 'India', companyId: targetCompany, status: 'ACTIVE' },
        { code: 'DEL-01', name: 'Delhi Regional', city: 'New Delhi', state: 'Delhi NCR', country: 'India', companyId: targetCompany, status: 'ACTIVE' }
      ];

      for (const b of defaultBranches) {
        await db.collection('branches').add({
          ...b,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      const freshSnapshot = await db.collection('branches').where('companyId', '==', targetCompany).get();
      return freshSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching branches, using fallback:', e);
      return [
        { id: 'b_bom', code: 'BOM-01', name: 'HQ - Mumbai', city: 'Mumbai', state: 'Maharashtra' },
        { id: 'b_blr', code: 'BLR-01', name: 'Bengaluru Tech Park', city: 'Bengaluru', state: 'Karnataka' },
        { id: 'b_del', code: 'DEL-01', name: 'Delhi Regional', city: 'New Delhi', state: 'Delhi NCR' }
      ];
    }
  },

  async createBranch(data) {
    try {
      const payload = {
        name: data.name,
        code: (data.code || data.name.substring(0, 3)).toUpperCase(),
        address: data.address || '',
        city: data.city || 'Mumbai',
        state: data.state || 'Maharashtra',
        country: data.country || 'India',
        postalCode: data.postalCode || '400051',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        companyId: data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('branches').add(payload);
      await auditService.log('BRANCH_CREATED', 'ORGANIZATION', 'branches', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error creating branch:', e);
      throw e;
    }
  },

  async updateBranch(id, updateData) {
    try {
      const payload = {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('branches').doc(id).update(payload);
      await auditService.log('BRANCH_UPDATED', 'ORGANIZATION', 'branches', id, updateData);
      return true;
    } catch (e) {
      console.error('Error updating branch:', e);
      throw e;
    }
  },

  async deleteBranch(id) {
    try {
      await db.collection('branches').doc(id).delete();
      await auditService.log('BRANCH_DELETED', 'ORGANIZATION', 'branches', id, {});
      return true;
    } catch (e) {
      console.error('Error deleting branch:', e);
      throw e;
    }
  },

  // 5. DYNAMIC ORGANIZATION HIERARCHY TREE
  // Builds tree from employees array by linking managerId -> employee.id / employee.employeeCode
  buildOrgTree(employees = []) {
    if (!employees || employees.length === 0) return [];

    const map = {};
    const roots = [];

    // Index all employees
    employees.forEach(emp => {
      map[emp.id] = { ...emp, children: [] };
      if (emp.employeeCode) map[emp.employeeCode] = map[emp.id];
    });

    // Build hierarchy
    employees.forEach(emp => {
      const node = map[emp.id];
      const mgrId = emp.managerId || emp.manager;
      if (mgrId && map[mgrId] && map[mgrId] !== node) {
        map[mgrId].children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
};

window.orgService = orgService;
