/**
 * DIALLO HRMS — COMPANY & BRANCH MANAGEMENT SERVICE
 * Handles multi-tenant company legal entities and branch locations in Firestore
 */

const companyService = {
  // Get all registered companies
  async getCompanies() {
    try {
      const snapshot = await db.collection('companies').orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error getting companies:', err);
      return [];
    }
  },

  // Get specific company
  async getCompany(companyId) {
    try {
      const doc = await db.collection('companies').doc(companyId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (err) {
      console.error('Error getting company:', err);
      return null;
    }
  },

  // Create new legal entity
  async createCompany(companyData) {
    try {
      const newRef = db.collection('companies').doc();
      const payload = {
        ...companyData,
        status: companyData.status || 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await newRef.set(payload);
      await auditService.log('COMPANY_CREATED', 'ADMIN', 'companies', newRef.id, payload);
      return { id: newRef.id, ...payload };
    } catch (err) {
      console.error('Error creating company:', err);
      throw err;
    }
  },

  // Update legal entity
  async updateCompany(companyId, updateData) {
    try {
      const payload = {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('companies').doc(companyId).update(payload);
      await auditService.log('COMPANY_UPDATED', 'ADMIN', 'companies', companyId, updateData);
      return true;
    } catch (err) {
      console.error('Error updating company:', err);
      throw err;
    }
  },

  async deleteCompany(companyId) {
    try {
      await db.collection('companies').doc(companyId).delete();
      await auditService.log('COMPANY_DELETED', 'ADMIN', 'companies', companyId, {});
      return true;
    } catch (err) {
      console.error('Error deleting company:', err);
      throw err;
    }
  },

  // Branches
  async getBranches(companyId = null) {
    try {
      let query = db.collection('branches');
      if (companyId) {
        query = query.where('companyId', '==', companyId);
      }
      const snapshot = await query.orderBy('name', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error getting branches:', err);
      return [];
    }
  },

  async createBranch(branchData) {
    try {
      const newRef = db.collection('branches').doc();
      const payload = {
        ...branchData,
        status: branchData.status || 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await newRef.set(payload);
      await auditService.log('BRANCH_CREATED', 'ADMIN', 'branches', newRef.id, payload);
      return { id: newRef.id, ...payload };
    } catch (err) {
      console.error('Error creating branch:', err);
      throw err;
    }
  }
};

window.companyService = companyService;
