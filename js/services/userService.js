/**
 * DIALLO HRMS — USER & ROLE MANAGEMENT SERVICE
 * Manages Firestore user profiles, custom roles, and permissions
 */

const userService = {
  // Get user profile by UID
  async getUserProfile(uid) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (err) {
      console.error('Error getting user profile:', err);
      throw err;
    }
  },

  // Update user profile
  async updateUserProfile(uid, updateData) {
    try {
      const oldDoc = await this.getUserProfile(uid);
      const dataToSave = {
        ...updateData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(uid).update(dataToSave);
      await auditService.log('USER_UPDATED', 'USERS', 'users', uid, {}, oldDoc, dataToSave);
      return true;
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  },

  // Fetch all users (for Admin User Management)
  async getAllUsers(companyId = null) {
    try {
      let query = db.collection('users');
      if (companyId) {
        query = query.where('companyId', '==', companyId);
      }
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching users:', err);
      return [];
    }
  },

  async getUsers(companyId = null) {
    return this.getAllUsers(companyId);
  },

  // Roles Collection
  async getRoles() {
    try {
      const snapshot = await db.collection('roles').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching roles:', err);
      return [];
    }
  },

  // Create or Update Role
  async saveRole(roleId, roleData) {
    try {
      const dataToSave = {
        ...roleData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('roles').doc(roleId).set(dataToSave, { merge: true });
      await auditService.log('ROLE_SAVED', 'ROLES', 'roles', roleId, roleData);
      return true;
    } catch (err) {
      console.error('Error saving role:', err);
      throw err;
    }
  }
};

window.userService = userService;
