/**
 * DIALLO HRMS — PRODUCTION SYSTEM INITIALIZATION & CORE STRUCTURE SERVICE
 * Strictly maintains official corporate structure for Diallo % (Ghansoli Mahape).
 * Zero mock/demo datasets. Includes automated and on-demand legacy demo purge.
 */

const seedService = {
  COMPANY_ID: 'comp_diallo_india',

  // Ensure core corporate structure is set up without dumping any demo/mock data
  async bootstrapIfEmpty() {
    try {
      console.log('[Seed] Verifying system datasets across collections...');
      // 1. Ensure official roles exist in Firestore
      await this.checkAndSeedModule('roles', () => this.seedRoles());
      await this.checkAndSeedModule('companies', () => this.seedCoreStructure());
      // 2. Automatically sweep and purge legacy demo records from Firestore
      await this.purgeAllDemoData();
      console.log('[Seed] System dataset verification and cleanup complete.');
    } catch (err) {
      console.warn('[Seed] Bootstrap check warning:', err);
    }
  },

  async checkAndSeedModule(collectionName, seedFn) {
    try {
      const snap = await db.collection(collectionName).limit(1).get();
      if (snap.empty) {
        console.log(`[Seed] Collection '${collectionName}' is empty. Initializing core structure...`);
        await seedFn();
        console.log(`[Seed] Collection '${collectionName}' initialized successfully.`);
      }
    } catch (e) {
      console.warn(`[Seed] Could not check '${collectionName}':`, e);
    }
  },

  // System Initialization — ensures official Diallo facilities & 8 standardized departments
  async seedAll(force = false) {
    console.log('[Seed] Verifying core organizational facilities and departments...');
    await this.seedCoreStructure();
    console.log('[Seed] Core corporate structure verified.');
    if (typeof Toast !== 'undefined') {
      Toast.success('Core organizational structure and departments verified.');
    }
  },

  // 1. OFFICIAL CORPORATE ROLES (SUPER_ADMIN, COMPANY_ADMIN, HR, TRAINER, TRAINEE, EMPLOYEE)
  async seedRoles(force = false) {
    try {
      console.log('[Seed] Writing official corporate roles to Firestore (SUPER_ADMIN, COMPANY_ADMIN, HR, TRAINER, TRAINEE, EMPLOYEE)...');
      const roles = [
        { id: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Complete cross-company system access and governance', permissions: ['*'], status: 'ACTIVE' },
        { id: 'COMPANY_ADMIN', name: 'Company Administrator', description: 'Full administrative access for assigned legal entity', permissions: ['people.*', 'attendance.*', 'leave.*', 'payroll.*', 'reports.*', 'admin.view', 'admin.manage', 'communication.*', 'settings.manage', 'users.manage', 'companies.manage'], status: 'ACTIVE' },
        { id: 'HR', name: 'HR Manager', description: 'Employee onboarding, attendance, leave approvals, and organization management', permissions: ['people.view', 'people.create', 'people.edit', 'attendance.*', 'leave.*', 'reports.view', 'communication.*'], status: 'ACTIVE' },
        { id: 'TRAINER', name: 'Training Lead / Mentor', description: '7-Day trainee curriculum oversight, batches, evaluations, and certifications', permissions: ['training.*', 'attendance.view', 'people.view', 'ess.view'], status: 'ACTIVE' },
        { id: 'TRAINEE', name: 'Trainee Apprentice', description: '7-Day learning modules, quizzes, attendance logs, and mentor support', permissions: ['training.view', 'ess.view', 'own.attendance', 'own.leave', 'own.documents'], status: 'ACTIVE' },
        { id: 'EMPLOYEE', name: 'Employee (ESS)', description: 'Self-service timecard, punch logs, leave applications, and payslip download', permissions: ['ess.view', 'own.profile', 'own.attendance', 'own.leave', 'own.payslips', 'own.documents', 'own.expenses', 'own.requests', 'attendance.punch', 'attendance.view', 'leave.view', 'leave.create', 'payroll.view', 'communication.view', 'reports.view', 'expenses.view', 'assets.view', 'performance.view', 'documents.view', 'requests.view'], status: 'ACTIVE' }
      ];

      const batch = db.batch();
      roles.forEach(role => {
        const ref = db.collection('roles').doc(role.id);
        batch.set(ref, { ...role, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      });
      await batch.commit();
      console.log('[Seed] Official roles successfully committed to Firestore.');
      if (typeof Toast !== 'undefined') {
        Toast.success('Official roles (HR, Employee, Trainer, Super Admin) updated in database.');
      }
      return roles;
    } catch (e) {
      console.warn('[Seed] Could not seed roles:', e);
    }
  },

  // 2. CORE CORPORATE STRUCTURE (Diallo % Master Configuration)
  async seedCoreStructure() {
    await this.seedRoles();
    const batch = db.batch();

    // Official Company Master
    const compRef = db.collection('companies').doc(this.COMPANY_ID);
    batch.set(compRef, {
      name: 'Diallo India Private Limited',
      legalName: 'Diallo India Private Limited',
      brandName: 'Diallo %',
      code: 'DIPL',
      country: 'India',
      location: 'Ghansoli Mahape',
      headquarters: 'Ghansoli Mahape, Navi Mumbai',
      workingDays: 6,
      workingHours: '9 Hours (10:00 AM - 07:00 PM)',
      weeklyOff: 'Sunday and Government Holiday',
      hrContact: '9372868617',
      status: 'ACTIVE',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Official Branch
    const branchRef = db.collection('branches').doc('branch_mumbai');
    batch.set(branchRef, {
      id: 'branch_mumbai',
      companyId: this.COMPANY_ID,
      name: 'Diallo - Ghansoli Mahape',
      city: 'Navi Mumbai (Ghansoli Mahape)',
      state: 'Maharashtra',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 8 Official Standardized Departments
    const departments = [
      { id: 'dept_digital', name: 'Digital Team', code: 'DIG', head: 'Head of Digital', members: 0, budget: 'INR 15,00,000' },
      { id: 'dept_ops', name: 'Operations', code: 'OPS', head: 'Head of Operations', members: 0, budget: 'INR 25,00,000' },
      { id: 'dept_sales', name: 'Sales', code: 'SLS', head: 'Head of Sales', members: 0, budget: 'INR 30,00,000' },
      { id: 'dept_realestate', name: 'Real Estate', code: 'RES', head: 'Head of Real Estate', members: 0, budget: 'INR 20,00,000' },
      { id: 'dept_carrental', name: 'Car Rental', code: 'CAR', head: 'Head of Car Rental', members: 0, budget: 'INR 18,00,000' },
      { id: 'dept_compliance', name: 'Compliance', code: 'CMP', head: 'Head of Compliance', members: 0, budget: 'INR 12,00,000' },
      { id: 'dept_training', name: 'Training', code: 'TRN', head: 'Lead Corporate Trainer', members: 0, budget: 'INR 14,00,000' },
      { id: 'dept_hr', name: 'Human Resources', code: 'HRD', head: 'HR Manager', members: 0, budget: 'INR 15,00,000' }
    ];

    departments.forEach(d => {
      const ref = db.collection('departments').doc(d.id);
      batch.set(ref, { ...d, companyId: this.COMPANY_ID, status: 'ACTIVE' }, { merge: true });
    });

    // Official Leave Types (Privilege / Paid Leave)
    const leaveTypes = [
      { id: 'lt_pl', code: 'PL', name: 'Paid Leave (PL)', annualQuota: 18, quota: 18, carryForward: 30, color: '#2563eb' }
    ];

    leaveTypes.forEach(lt => {
      const ref = db.collection('leaveTypes').doc(lt.id);
      batch.set(ref, { ...lt, companyId: this.COMPANY_ID }, { merge: true });
    });

    await batch.commit();
  },

  // 2. PURGE ALL LEGACY DEMO DATA ACROSS FIRESTORE
  // Deletes all mock/demo staff records (EMP001-EMP025, fake trainees, fake tasks, etc.)
  async purgeAllDemoData() {
    try {
      console.log('[Purge] Starting comprehensive purge of legacy demo datasets from Firestore...');
      let totalDeleted = 0;

      // Known demo IDs
      const demoEmpIds = [];
      for (let i = 1; i <= 30; i++) {
        const num2 = String(i).padStart(2, '0');
        const num3 = String(i).padStart(3, '0');
        demoEmpIds.push(`EMP${num3}`);
        demoEmpIds.push(`EMP-${num2}`);
        demoEmpIds.push(`EMP-${num3}`);
        demoEmpIds.push(`EMP_${num3}`);
      }

      // 1. Purge Demo Employees
      const empSnap = await db.collection('employees').get();
      const empBatch = db.batch();
      let empBatchCount = 0;

      const demoNames = [
        'Vikram Sharma', 'Priya Nair', 'Rahul Mehta', 'Ananya Gupta', 'Arjun Patel',
        'Sneha Desai', 'Amit Kumar', 'Rohit Saxena', 'Tanvi Agarwal', 'Meera Iyer',
        'Kavya Menon', 'Pooja Verma', 'Varun Bhatt', 'Suresh Reddy', 'Naveen Singh',
        'Neha Pillai', 'Roshni Chatterjee', 'Siddharth Kapoor', 'Deepika Joshi',
        'Shreya Das', 'Karan Malhotra', 'Ishita Bose'
      ];

      empSnap.docs.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        const name = data.fullName || data.name || '';
        const isDemo = demoEmpIds.includes(id) ||
                       demoNames.includes(name) ||
                       id.startsWith('EMP00') ||
                       id.startsWith('EMP01') ||
                       id.startsWith('EMP02');

        if (isDemo) {
          empBatch.delete(doc.ref);
          empBatchCount++;
          totalDeleted++;
        }
      });

      if (empBatchCount > 0) {
        await empBatch.commit();
        console.log(`[Purge] Purged ${empBatchCount} demo employee records.`);
      }

      // 2. Purge Demo Trainees
      const trnSnap = await db.collection('trainees').get();
      const trnBatch = db.batch();
      let trnBatchCount = 0;
      trnSnap.docs.forEach(doc => {
        const id = doc.id;
        if (id.startsWith('TRN_EMP') || id.startsWith('TRN0')) {
          trnBatch.delete(doc.ref);
          trnBatchCount++;
          totalDeleted++;
        }
      });
      if (trnBatchCount > 0) {
        await trnBatch.commit();
        console.log(`[Purge] Purged ${trnBatchCount} demo trainee records.`);
      }

      // 3. Purge Demo Trainers
      const trainersSnap = await db.collection('trainers').get();
      const trainerBatch = db.batch();
      let trnCount = 0;
      trainersSnap.docs.forEach(doc => {
        if (doc.id.startsWith('TRN00')) {
          trainerBatch.delete(doc.ref);
          trnCount++;
          totalDeleted++;
        }
      });
      if (trnCount > 0) {
        await trainerBatch.commit();
      }

      // 4. Purge Demo Training Programs
      const prgSnap = await db.collection('trainingPrograms').get();
      const prgBatch = db.batch();
      let prgCount = 0;
      prgSnap.docs.forEach(doc => {
        if (doc.id.startsWith('PRG00')) {
          prgBatch.delete(doc.ref);
          prgCount++;
          totalDeleted++;
        }
      });
      if (prgCount > 0) {
        await prgBatch.commit();
      }

      // 5. Purge Demo Leave Applications & Balances
      const lvSnap = await db.collection('leaveApplications').get();
      const lvBatch = db.batch();
      let lvCount = 0;
      lvSnap.docs.forEach(doc => {
        if (doc.id.startsWith('LV00') || demoEmpIds.includes(doc.data().employeeId)) {
          lvBatch.delete(doc.ref);
          lvCount++;
          totalDeleted++;
        }
      });
      if (lvCount > 0) {
        await lvBatch.commit();
      }

      // 6. Purge Demo Expenses & Assets
      const expSnap = await db.collection('expenses').get();
      const expBatch = db.batch();
      let expCount = 0;
      expSnap.docs.forEach(doc => {
        if (doc.id.startsWith('EXP00') || demoEmpIds.includes(doc.data().employeeId)) {
          expBatch.delete(doc.ref);
          expCount++;
          totalDeleted++;
        }
      });
      if (expCount > 0) {
        await expBatch.commit();
      }

      const astSnap = await db.collection('assets').get();
      const astBatch = db.batch();
      let astCount = 0;
      astSnap.docs.forEach(doc => {
        if (doc.id.startsWith('AST00')) {
          astBatch.delete(doc.ref);
          astCount++;
          totalDeleted++;
        }
      });
      if (astCount > 0) {
        await astBatch.commit();
      }

      console.log(`[Purge] Cleanup completed. Total demo records purged: ${totalDeleted}`);
      if (typeof Toast !== 'undefined') {
        Toast.success(`Database cleaned. Purged ${totalDeleted} demo records successfully.`);
      }
      return totalDeleted;
    } catch (err) {
      console.error('[Purge] Error during demo purge:', err);
      if (typeof Toast !== 'undefined') {
        Toast.error(`Purge error: ${err.message}`);
      }
      throw err;
    }
  }
};

window.seedService = seedService;
window.seedRoles = () => seedService.seedRoles(true);
window.purgeDemoData = () => seedService.purgeAllDemoData();
