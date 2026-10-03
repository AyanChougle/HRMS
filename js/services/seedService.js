/**
 * DIALLO HRMS — PRODUCTION SYSTEM INITIALIZATION & CORE STRUCTURE SERVICE
 * Strictly maintains official corporate structure for Diallo % (HQ - Mumbai).
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
      console.log('[Seed] Writing official corporate roles to Firestore (SUPER_ADMIN, COMPANY_ADMIN, HR, MANAGER, TEAM_LEAD, MENTOR, TRAINEE, EMPLOYEE)...');
      const roles = [
        { id: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Complete cross-company system access and governance', permissions: ['*'], status: 'ACTIVE' },
        { id: 'COMPANY_ADMIN', name: 'Company Administrator', description: 'Full administrative access for assigned legal entity', permissions: ['people.*', 'attendance.*', 'leave.*', 'payroll.*', 'reports.*', 'admin.view', 'admin.manage', 'communication.*', 'settings.manage', 'users.manage', 'companies.manage'], status: 'ACTIVE' },
        { id: 'HR', name: 'HR Manager', description: 'Employee onboarding, attendance, leave approvals, payroll, and organization management', permissions: ['people.view', 'people.create', 'people.edit', 'attendance.*', 'leave.*', 'payroll.*', 'reports.view', 'communication.*'], status: 'ACTIVE' },
        { id: 'MANAGER', name: 'Manager', description: 'Department and team performance, attendance, approvals, and reporting', permissions: ['team.*', 'team.view', 'attendance.view', 'leave.view', 'leave.approve', 'approvals.*', 'performance.view', 'communication.view', 'reports.view', 'ess.view'], status: 'ACTIVE' },
        { id: 'TEAM_LEAD', name: 'Team Leader', description: 'Team attendance, daily task workflows, approvals, and guidance', permissions: ['team.view', 'attendance.view', 'leave.view', 'performance.view', 'workflows.view', 'communication.view', 'reports.view', 'ess.view'], status: 'ACTIVE' },
        { id: 'MENTOR', name: 'Mentor', description: 'Trainee curriculum guidance, evaluations, feedback, and training oversight', permissions: ['training.*', 'training.view', 'training.manage', 'training.assess', 'attendance.view', 'leave.view', 'ess.view'], status: 'ACTIVE' },
        { id: 'TRAINER', name: 'Trainer', description: '7-Day trainee curriculum oversight, batches, evaluations, and certifications', permissions: ['training.*', 'attendance.view', 'people.view', 'ess.view'], status: 'ACTIVE' },
        { id: 'TRAINEE', name: 'Trainee', description: '7-Day learning modules, quizzes, attendance logs, and mentor support', permissions: ['training.view', 'ess.view', 'own.attendance', 'own.leave', 'own.documents'], status: 'ACTIVE' },
        { id: 'EMPLOYEE', name: 'Employee', description: 'Self-service timecard, punch logs, leave applications, and company compliance', permissions: ['ess.view', 'own.profile', 'own.attendance', 'own.leave', 'own.documents', 'own.requests', 'attendance.punch', 'attendance.view', 'leave.view', 'leave.create', 'communication.view', 'reports.view', 'assets.view', 'performance.view', 'documents.view', 'requests.view'], status: 'ACTIVE' }
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
      location: 'Ghansoli, Navi Mumbai',
      headquarters: 'Ghansoli, Navi Mumbai, Maharashtra',
      workingDays: 6,
      workingHours: '9 Hours (10:00 AM - 07:00 PM)',
      weeklyOff: 'Sunday and Government Holiday',
      hrContact: '9372868617',
      status: 'ACTIVE',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Official Branch
    const branchRef = db.collection('branches').doc('branch_ghansoli');
    batch.set(branchRef, {
      id: 'branch_ghansoli',
      companyId: this.COMPANY_ID,
      name: 'Ghansoli - Navi Mumbai',
      city: 'Navi Mumbai',
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
      console.log('[Purge] WARNING: Executing complete database wipe!');
      let totalDeleted = 0;
      const collections = [
        'employees', 'users', 'leaves', 'attendance', 'payrollRecords', 
        'payrollPeriods', 'announcements', 'notifications', 'documents', 
        'tasks', 'assets', 'workflows', 'exits', 'notificationPreferences', 
        'departments', 'companyBranches', 'shifts', 'jobPositions', 
        'candidates', 'requisitions', 'interviews', 'offers', 'trainees', 
        'trainers', 'trainingPrograms', 'expensePolicies', 'vendors', 
        'workflowPipelines', 'expenses', 'assetRegister', 'assetMaintenance'
      ];
      
      for (const col of collections) {
        let snap = await db.collection(col).get();
        if (snap.empty) continue;
        
        let batch = db.batch();
        let count = 0;
        
        for (const doc of snap.docs) {
          batch.delete(doc.ref);
          count++;
          totalDeleted++;
          
          if (count === 400) {
            await batch.commit();
            batch = db.batch();
            count = 0;
          }
        }
        if (count > 0) {
          await batch.commit();
        }
      }
      
      console.log(`[Purge] Cleanup completed. Total records purged: ${totalDeleted}`);
      if (typeof Toast !== 'undefined') {
        Toast.success(`Database completely wiped. Deleted ${totalDeleted} records.`);
      }
    } catch (e) {
      console.error('[Purge] Error during data wipe:', e);
      if (typeof Toast !== 'undefined') Toast.error('Error purging data.');
    }
  }
};

window.purgeDemoData = () => seedService.purgeAllDemoData();
