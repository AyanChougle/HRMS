/**
 * DIALLO HRMS — ORGANIZATION STRUCTURE SERVICE
 * Manages Departments, Designations, Grades, and Cost Centers in Firestore
 */

const departmentService = {
  // --- Departments ---
  async getDepartments(companyId = null) {
    try {
      let query = db.collection('departments');
      if (companyId) {
        query = query.where('companyId', '==', companyId);
      }
      const snapshot = await query.orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error getting departments:', err);
      return [];
    }
  },

  async createDepartment(deptData) {
    try {
      const newRef = db.collection('departments').doc();
      const payload = {
        ...deptData,
        status: deptData.status || 'ACTIVE',
        members: deptData.members || 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await newRef.set(payload);
      await auditService.log('DEPARTMENT_CREATED', 'ORGANIZATION', 'departments', newRef.id, payload);
      return { id: newRef.id, ...payload };
    } catch (err) {
      console.error('Error creating department:', err);
      throw err;
    }
  },

  async updateDepartment(id, updateData) {
    try {
      const payload = {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('departments').doc(id).update(payload);
      await auditService.log('DEPARTMENT_UPDATED', 'ORGANIZATION', 'departments', id, updateData);
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
      await db.collection('departments').doc(id).delete();
      await auditService.log('DEPARTMENT_DELETED', 'ORGANIZATION', 'departments', id, {});
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
