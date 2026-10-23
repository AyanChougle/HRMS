
const departmentService = {
  // --- Departments ---
  async getDepartments(companyId = null) {
    try {
      // 1. Fetch dynamically from Hostinger MySQL API if available
      if (typeof apiClient !== 'undefined') {
        try {
          const resp = await apiClient.get('departments.php');
          if (resp && resp.success && Array.isArray(resp.departments) && resp.departments.length > 0) {
            return resp.departments.map(d => ({
              id: d.id,
              name: d.name,
              code: d.code,
              headName: d.head_name || '',
              description: d.description || '',
              status: d.status || 'ACTIVE',
              members: d.members || 0
            })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          }
        } catch (apiErr) {
          console.warn('[DepartmentService] MySQL fetch fallback to Firestore:', apiErr.message);
        }
      }

      // 2. Fallback to Firestore
      const targetCompany = companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const snap = await db.collection('departments').get();
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (list.length === 0) {
        const defaults = [
          { name: 'Engineering', code: 'ENG', status: 'ACTIVE', members: 0, companyId: targetCompany },
          { name: 'Human Resources', code: 'HR', status: 'ACTIVE', members: 0, companyId: targetCompany },
          { name: 'Finance & Accounts', code: 'FIN', status: 'ACTIVE', members: 0, companyId: targetCompany },
          { name: 'Sales & Marketing', code: 'SALES', status: 'ACTIVE', members: 0, companyId: targetCompany },
          { name: 'Operations & IT', code: 'OPS', status: 'ACTIVE', members: 0, companyId: targetCompany }
        ];
        for (const d of defaults) {
          try {
            const docRef = await db.collection('departments').add({
              ...d,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            list.push({ id: docRef.id, ...d });
          } catch(e) {}
        }
      }
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (err) {
      console.error('Error getting departments:', err);
      return [];
    }
  },

  async createDepartment(deptData) {
    try {
      if (typeof apiClient !== 'undefined') {
        try {
          await apiClient.post('departments.php', {
            name: deptData.name,
            code: deptData.code,
            head_name: deptData.headName || '',
            description: deptData.description || ''
          });
        } catch (_) {}
      }
      const newRef = db.collection('departments').doc();
      const companyId = deptData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const payload = {
        name: (deptData.name || '').trim(),
        code: (deptData.code || '').trim().toUpperCase(),
        companyId,
        status: deptData.status || 'ACTIVE',
        members: deptData.members || 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await newRef.set(payload);
      if (typeof auditService !== 'undefined' && auditService.log) {
        auditService.log('DEPARTMENT_CREATED', 'departments', newRef.id, { name: payload.name, code: payload.code }).catch(() => {});
      }
      return { id: newRef.id, ...payload };
    } catch (err) {
      console.error('Error creating department:', err);
      throw err;
    }
  },

  async updateDepartment(id, updateData) {
    try {
      if (typeof apiClient !== 'undefined') {
        try {
          await apiClient.post('departments.php', {
            id: id,
            name: updateData.name,
            code: updateData.code,
            head_name: updateData.headName || updateData.head_name || '',
            description: updateData.description || '',
            status: updateData.status || 'ACTIVE'
          });
        } catch (apiErr) {
          console.warn('[DepartmentService] MySQL update notice:', apiErr.message);
        }
      }
      const payload = {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('departments').doc(String(id)).set(payload, { merge: true });
      if (typeof auditService !== 'undefined' && auditService.log) {
        auditService.log('DEPARTMENT_UPDATED', 'departments', String(id), updateData).catch(() => {});
      }
      return true;
    } catch (err) {
      console.error('Error updating department:', err);
      throw err;
    }
  },

  async deactivateDepartment(id) {
    return this.updateDepartment(id, { status: 'INACTIVE' });
  },

  async deleteDepartment(id) {
    try {
      if (typeof apiClient !== 'undefined') {
        try {
          await apiClient.request(`departments.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        } catch (_) {}
      }
      await db.collection('departments').doc(String(id)).delete();
      if (typeof auditService !== 'undefined' && auditService.log) {
        auditService.log('DEPARTMENT_DELETED', 'departments', String(id), {}).catch(() => {});
      }
      return true;
    } catch (err) {
      console.error('Error deleting department:', err);
      throw err;
    }
  },

  // --- Designations ---
  async getDesignations(companyId = null) {
    try {
      let query = db.collection('designations');
      if (companyId) {
        query = query.where('companyId', '==', companyId);
      }
      const snapshot = await query.orderBy('title', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error getting designations:', err);
      return [];
    }
  },

  async createDesignation(data) {
    try {
      const newRef = db.collection('designations').doc();
      const payload = {
        ...data,
        status: data.status || 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await newRef.set(payload);
      await auditService.log('DESIGNATION_CREATED', 'ORGANIZATION', 'designations', newRef.id, payload);
      return { id: newRef.id, ...payload };
    } catch (err) {
      console.error('Error creating designation:', err);
      throw err;
    }
  },

  // --- Grades & Bands ---
  async getGrades(companyId = null) {
    try {
      let query = db.collection('grades');
      if (companyId) {
        query = query.where('companyId', '==', companyId);
      }
      const snapshot = await query.orderBy('code', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error getting grades:', err);
      return [];
    }
  },

  async createGrade(data) {
    try {
      const newRef = db.collection('grades').doc();
      const payload = {
        ...data,
        status: data.status || 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await newRef.set(payload);
      await auditService.log('GRADE_CREATED', 'ORGANIZATION', 'grades', newRef.id, payload);
      return { id: newRef.id, ...payload };
    } catch (err) {
      console.error('Error creating grade:', err);
      throw err;
    }
  },

  // --- Cost Centers ---
  async getCostCenters(companyId = null) {
    try {
      let query = db.collection('costCenters');
      if (companyId) {
        query = query.where('companyId', '==', companyId);
      }
      const snapshot = await query.orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error getting cost centers:', err);
      return [];
    }
  }
};

window.departmentService = departmentService;
