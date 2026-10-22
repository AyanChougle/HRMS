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
        { code: 'GNS-01', name: 'Ghansoli - Navi Mumbai', city: 'Navi Mumbai', state: 'Maharashtra', country: 'India', companyId: targetCompany, status: 'ACTIVE' }
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
        { id: 'b_gns', code: 'GNS-01', name: 'Ghansoli - Navi Mumbai', city: 'Navi Mumbai', state: 'Maharashtra' }
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

  // 5. DYNAMIC SMART ORGANIZATION HIERARCHY TREE
  buildOrgTree(employees = []) {
    if (!employees || employees.length === 0) return [];

    const nodeMap = new Map();
    const nameIndex = new Map();

    // 1. Index all employees
    employees.forEach(emp => {
      const id = emp.id || ('emp_' + (emp.employeeCode || Math.random().toString(36).slice(2, 7)));
      const fullName = (emp.fullName || emp.name || 'Unnamed').trim();
      const node = {
        ...emp,
        id,
        name: fullName,
        fullName,
        designation: emp.designation || 'Staff',
        department: emp.department || 'Operations',
        branch: emp.branch || emp.branchName || 'HQ',
        managerName: (emp.manager || emp.reportingManager || '').trim(),
        managerId: emp.managerId || '',
        children: []
      };
      nodeMap.set(id, node);

      // Index by employee code
      if (emp.employeeCode) {
        nameIndex.set(emp.employeeCode.toUpperCase().trim(), id);
      }

      // Index by full name, variations, initials
      const clean = fullName.toLowerCase();
      nameIndex.set(clean, id);
      const parts = clean.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        const first = parts[0];
        const last = parts[parts.length - 1];
        const lastInit = last[0];
        nameIndex.set(`${first} ${lastInit}`, id);
        nameIndex.set(`${first}.${lastInit}`, id);
        nameIndex.set(`${first} ${last}`, id);
        nameIndex.set(`${first}.${last}`, id);
        if (parts.length > 2) {
          nameIndex.set(`${first} ${parts[1]}`, id);
        }
      }
      if (parts.length > 0 && !nameIndex.has(parts[0])) {
        nameIndex.set(parts[0], id);
      }
    });

    // 2. Identify top unlinked managers referenced by employees
    const missingMap = new Map();
    employees.forEach(emp => {
      const m = (emp.manager || emp.reportingManager || '').trim();
      if (!m) return;
      const clean = m.toLowerCase();
      const cleanDot = clean.replace('.', ' ');
      if (!nameIndex.has(clean) && !nameIndex.has(cleanDot)) {
        missingMap.set(clean, m);
      }
    });

    // If Akash T (Managing Director) is referenced, auto-anchor as Apex Executive Node
    let apexId = null;
    if (missingMap.has('akash t') || missingMap.has('akash')) {
      apexId = 'emp_apex_akash';
      const apexNode = {
        id: apexId,
        employeeCode: 'DIR-001',
        name: 'Akash T',
        fullName: 'Akash T',
        designation: 'Managing Director / Leadership',
        department: 'Executive Management',
        branch: 'Headquarters',
        status: 'ACTIVE',
        children: []
      };
      nodeMap.set(apexId, apexNode);
      nameIndex.set('akash t', apexId);
      nameIndex.set('akash', apexId);
    }

    // Link Jiya Hr -> HR Lead (Jagruti Saroj) or Rushikesh B or Apex
    if (missingMap.has('jiya hr') || missingMap.has('jiya')) {
      const hrLeadId = nameIndex.get('jagruti amarnath saroj') || nameIndex.get('rushikesh b') || apexId;
      if (hrLeadId) {
        nameIndex.set('jiya hr', hrLeadId);
        nameIndex.set('jiya', hrLeadId);
      }
    }

    // Link Adinath Jamadar -> Sales Lead (Adil Khan) or Arshad M or Apex
    if (missingMap.has('adinath jamadar') || missingMap.has('adinath')) {
      const salesLeadId = nameIndex.get('adil khan') || nameIndex.get('arshad m') || apexId;
      if (salesLeadId) {
        nameIndex.set('adinath jamadar', salesLeadId);
        nameIndex.set('adinath', salesLeadId);
      }
    }

    // 3. Connect hierarchy with cycle prevention
    const isDescendant = (candidateId, current, visited = new Set()) => {
      if (!current || !current.id) return false;
      if (current.id === candidateId) return true;
      if (visited.has(current.id)) return false;
      visited.add(current.id);
      if (!current.parentManagerId || !nodeMap.has(current.parentManagerId)) return false;
      return isDescendant(candidateId, nodeMap.get(current.parentManagerId), visited);
    };

    const roots = [];
    nodeMap.forEach(node => {
      let mId = node.managerId;
      if (!mId && node.managerName) {
        const codeMatch = node.managerName.match(/\(([^)]+)\)/);
        if (codeMatch && codeMatch[1]) {
          mId = nameIndex.get(codeMatch[1].toUpperCase().trim());
        }
        if (!mId) {
          const clean = node.managerName.toLowerCase().trim();
          mId = nameIndex.get(clean) || nameIndex.get(clean.replace('.', ' '));
        }
      }

      if (mId && nodeMap.has(mId) && mId !== node.id) {
        const parent = nodeMap.get(mId);
        if (!isDescendant(node.id, parent)) {
          node.parentManagerId = mId;
          parent.children.push(node);
          return;
        }
      }

      roots.push(node);
    });

    return roots;
  }
};

window.orgService = orgService;
