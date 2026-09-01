/**
 * DIALLO HRMS — ASSET MANAGEMENT & LIFECYCLE SERVICE (PHASE 10)
 * Manages Company Hardware/Software Registry, Custodian Checkouts, Returns, Maintenance, and Exit Clearances
 */

const assetService = {
  // Default Asset Categories
  DEFAULT_CATEGORIES: [
    { id: 'cat_lap', code: 'LAPTOP', name: 'Laptops & Workstations', prefix: 'DL-LAP', icon: '💻' },
    { id: 'cat_mon', code: 'MONITOR', name: 'Monitors & Displays', prefix: 'DL-MON', icon: '🖥️' },
    { id: 'cat_mob', code: 'MOBILE', name: 'Smartphones & Tablets', prefix: 'DL-MOB', icon: '📱' },
    { id: 'cat_acc', code: 'ACCESS_CARD', name: 'Access Cards & Keys', prefix: 'DL-ACC', icon: '💳' },
    { id: 'cat_veh', code: 'VEHICLE', name: 'Company Vehicles', prefix: 'DL-VEH', icon: '🚗' },
    { id: 'cat_fur', code: 'FURNITURE', name: 'Office Furniture & Chairs', prefix: 'DL-FUR', icon: '🪑' },
    { id: 'cat_net', code: 'NETWORKING', name: 'Networking & Servers', prefix: 'DL-NET', icon: '🌐' },
    { id: 'cat_lic', code: 'SOFTWARE_LICENSE', name: 'Software Licenses & SaaS', prefix: 'DL-LIC', icon: '🔑' },
    { id: 'cat_oth', code: 'OTHER', name: 'Other Equipment', prefix: 'DL-OTH', icon: '📦' }
  ],

  // 1. GET ASSET CATEGORIES
  async getCategories(companyId = null) {
    try {
      const targetCompany = companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const snapshot = await db.collection('assetCategories')
        .where('companyId', '==', targetCompany)
        .get();

      if (snapshot.empty) {
        for (const cat of this.DEFAULT_CATEGORIES) {
          await db.collection('assetCategories').doc(`${targetCompany}_${cat.code.toLowerCase()}`).set({
            ...cat,
            companyId: targetCompany,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        return this.DEFAULT_CATEGORIES;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      console.warn('Error fetching asset categories:', e);
      return this.DEFAULT_CATEGORIES;
    }
  },

  // 2. GET ASSETS (With Filter Options)
  async getAssets(filters = {}) {
    try {
      let query = db.collection('assets');
      if (filters.companyId) query = query.where('companyId', '==', filters.companyId);
      if (filters.status && filters.status !== 'All') query = query.where('status', '==', filters.status);
      if (filters.categoryCode && filters.categoryCode !== 'All') query = query.where('categoryCode', '==', filters.categoryCode);
      if (filters.currentEmployeeId) query = query.where('currentEmployeeId', '==', filters.currentEmployeeId);

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (filters.search && filters.search.trim()) {
        const s = filters.search.toLowerCase().trim();
        list = list.filter(a =>
          (a.name && a.name.toLowerCase().includes(s)) ||
          (a.assetTag && a.assetTag.toLowerCase().includes(s)) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(s)) ||
          (a.currentEmployeeName && a.currentEmployeeName.toLowerCase().includes(s))
        );
      }

      return list;
    } catch (e) {
      console.warn('Error fetching assets:', e);
      return [];
    }
  },

  // 3. REGISTER / ADD ASSET
  async createAsset(assetData) {
    try {
      const companyId = assetData.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';

      // Generate or validate unique Asset Tag
      const categoryCode = assetData.categoryCode || 'LAPTOP';
      const categoryObj = this.DEFAULT_CATEGORIES.find(c => c.code === categoryCode) || this.DEFAULT_CATEGORIES[0];
      
      let assetTag = assetData.assetTag?.trim();
      if (!assetTag) {
        const countSnap = await db.collection('assets').where('companyId', '==', companyId).get();
        const nextNum = String(countSnap.size + 1).padStart(4, '0');
        assetTag = `${categoryObj.prefix}-${nextNum}`;
      } else {
        // Tag uniqueness check
        const tagExists = await db.collection('assets')
          .where('companyId', '==', companyId)
          .where('assetTag', '==', assetTag)
          .get();
        if (!tagExists.empty) {
          throw new Error(`Asset Tag '${assetTag}' already exists. Please assign a unique tag.`);
        }
      }

      const payload = {
        companyId,
        assetTag,
        name: assetData.name || 'Enterprise Asset',
        categoryCode,
        categoryName: categoryObj.name,
        brand: assetData.brand || 'Dell / Apple',
        model: assetData.model || 'Standard Edition',
        serialNumber: assetData.serialNumber || `SN-${Date.now().toString().slice(-8)}`,
        purchaseDate: assetData.purchaseDate || new Date().toISOString().slice(0, 10),
        purchasePrice: Number(assetData.purchasePrice) || 50000,
        vendor: assetData.vendor || 'Authorized Distributor',
        warrantyExpiry: assetData.warrantyExpiry || '2028-12-31',
        branchName: assetData.branchName || 'HQ - Mumbai',
        location: assetData.location || 'Office Workstation Area',
        condition: assetData.condition || 'EXCELLENT', // NEW, EXCELLENT, GOOD, FAIR, DAMAGED, UNUSABLE
        status: 'AVAILABLE', // AVAILABLE, ASSIGNED, MAINTENANCE, DAMAGED, RETIRED, DISPOSED
        currentEmployeeId: null,
        currentEmployeeName: null,
        currentAssignmentId: null,
        notes: assetData.notes || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('assets').add(payload);
      payload.id = docRef.id;

      await auditService.log('ASSET_REGISTERED', 'ASSETS', 'assets', docRef.id, payload);
      return payload;
    } catch (err) {
      console.error('Error creating asset:', err);
      throw err;
    }
  },

  // 4. ASSIGN ASSET TO EMPLOYEE (CHECKOUT)
  async assignAsset(assetId, employeeData) {
    try {
      const assetDoc = await db.collection('assets').doc(assetId).get();
      if (!assetDoc.exists) throw new Error('Asset not found');

      const asset = assetDoc.data();
      if (asset.status === 'ASSIGNED') {
        throw new Error(`Asset '${asset.assetTag}' is already assigned to ${asset.currentEmployeeName}.`);
      }

      const assignmentPayload = {
        companyId: asset.companyId,
        assetId,
        assetTag: asset.assetTag,
        assetName: asset.name,
        employeeId: employeeData.employeeId,
        employeeName: employeeData.employeeName,
        employeeCode: employeeData.employeeCode || '',
        assignedBy: AuthGuard.userProfile?.displayName || 'IT Administrator',
        assignedAt: new Date().toISOString().slice(0, 10),
        expectedReturnDate: employeeData.expectedReturnDate || '2027-12-31',
        conditionAtAssignment: employeeData.condition || asset.condition || 'GOOD',
        notes: employeeData.notes || 'Issued for regular professional duties',
        status: 'ACTIVE', // ACTIVE, RETURNED
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const assignRef = await db.collection('assetAssignments').add(assignmentPayload);

      // Update Asset Master to ASSIGNED
      await db.collection('assets').doc(assetId).update({
        status: 'ASSIGNED',
        currentEmployeeId: employeeData.employeeId,
        currentEmployeeName: employeeData.employeeName,
        currentAssignmentId: assignRef.id,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('ASSET_ASSIGNED', 'ASSETS', 'assets', assetId, assignmentPayload);
      return assignRef.id;
    } catch (e) {
      console.error('Error assigning asset:', e);
      throw e;
    }
  },

  // 5. RETURN ASSET (CHECKIN & INSPECTION)
  async returnAsset(assetId, returnData) {
    try {
      const assetDoc = await db.collection('assets').doc(assetId).get();
      if (!assetDoc.exists) throw new Error('Asset not found');

      const asset = assetDoc.data();
      const returnCondition = returnData.condition || 'GOOD';
      const newStatus = (returnCondition === 'DAMAGED' || returnCondition === 'UNUSABLE') ? 'DAMAGED' : 'AVAILABLE';

      // 1. Record Return Event
      await db.collection('assetReturns').add({
        companyId: asset.companyId,
        assetId,
        assetTag: asset.assetTag,
        employeeId: asset.currentEmployeeId,
        employeeName: asset.currentEmployeeName,
        assignmentId: asset.currentAssignmentId || '',
        returnedBy: asset.currentEmployeeName,
        receivedBy: AuthGuard.userProfile?.displayName || 'IT Admin',
        returnDate: new Date().toISOString().slice(0, 10),
        condition: returnCondition,
        damageDescription: returnData.damageDescription || 'None',
        missingItems: returnData.missingItems || 'None',
        notes: returnData.notes || 'Checked-in cleanly',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 2. Mark previous assignment as RETURNED
      if (asset.currentAssignmentId) {
        await db.collection('assetAssignments').doc(asset.currentAssignmentId).update({
          status: 'RETURNED',
          returnedAt: new Date().toISOString().slice(0, 10)
        });
      }

      // 3. Reset Asset Master
      await db.collection('assets').doc(assetId).update({
        status: newStatus,
        condition: returnCondition,
        currentEmployeeId: null,
        currentEmployeeName: null,
        currentAssignmentId: null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('ASSET_RETURNED', 'ASSETS', 'assets', assetId, { returnCondition, newStatus });
      return true;
    } catch (e) {
      console.error('Error returning asset:', e);
      throw e;
    }
  },

  // 6. LOG MAINTENANCE / REPAIR TICKET
  async createMaintenanceRecord(data) {
    try {
      const payload = {
        companyId: data.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india',
        assetId: data.assetId,
        assetTag: data.assetTag,
        assetName: data.assetName,
        issue: data.issue || 'Routine Diagnostics',
        description: data.description || '',
        vendor: data.vendor || 'OEM Service Center',
        cost: Number(data.cost) || 0,
        startDate: data.startDate || new Date().toISOString().slice(0, 10),
        expectedCompletionDate: data.expectedCompletionDate || '2026-10-15',
        status: 'IN_PROGRESS', // REPORTED, IN_PROGRESS, COMPLETED
        reportedBy: AuthGuard.userProfile?.displayName || 'Employee',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('assetMaintenance').add(payload);

      // Set asset to MAINTENANCE status
      await db.collection('assets').doc(data.assetId).update({
        status: 'MAINTENANCE',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('MAINTENANCE_LOGGED', 'ASSETS', 'assetMaintenance', docRef.id, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  async completeMaintenance(maintenanceId, assetId, resolutionNotes = '', cost = 0) {
    try {
      await db.collection('assetMaintenance').doc(maintenanceId).update({
        status: 'COMPLETED',
        completedAt: new Date().toISOString().slice(0, 10),
        resolutionNotes,
        finalCost: Number(cost) || 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Restore asset to AVAILABLE
      await db.collection('assets').doc(assetId).update({
        status: 'AVAILABLE',
        condition: 'GOOD',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await auditService.log('MAINTENANCE_COMPLETED', 'ASSETS', 'assetMaintenance', maintenanceId, {});
      return true;
    } catch (e) {
      throw e;
    }
  },

  // 7. GET ACTIVE ASSIGNMENTS FOR EMPLOYEE
  async getEmployeeAssets(employeeId) {
    try {
      const snapshot = await db.collection('assets')
        .where('currentEmployeeId', '==', employeeId)
        .where('status', '==', 'ASSIGNED')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  // 8. GET VENDORS
  async getVendors(companyId = null) {
    try {
      const target = companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const snapshot = await db.collection('vendors').where('companyId', '==', target).get();
      if (snapshot.empty) {
        const defaults = [
          { name: 'Dell Enterprise India Pvt Ltd', contactPerson: 'Arun Verma', email: 'sales@dell.co.in', phone: '+91 22 6655 4400', category: 'Hardware' },
          { name: 'Apple Authorized Enterprise Reseller', contactPerson: 'Karan Mehra', email: 'business@applepartner.in', phone: '+91 22 4000 1100', category: 'Hardware' },
          { name: 'Urban Workspace & Ergonomics Ltd', contactPerson: 'Sanjay Kapoor', email: 'support@urbanwork.in', phone: '+91 80 2345 6789', category: 'Furniture' }
        ];
        for (const v of defaults) {
          await db.collection('vendors').add({ ...v, companyId: target, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        }
        return defaults;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
      return [];
    }
  },

  // 9. DELETE ASSET
  async deleteAsset(assetId) {
    try {
      await db.collection('assets').doc(assetId).delete();
      await auditService.log('ASSET_DELETED', 'ASSETS', 'assets', assetId, {});
      return true;
    } catch (e) {
      throw e;
    }
  }
};

window.assetService = assetService;
