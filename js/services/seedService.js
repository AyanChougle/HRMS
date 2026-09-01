/**
 * DIALLO HRMS — FIREBASE DATABASE SEED & BOOTSTRAP SERVICE
 * Automatically populates initial Indian corporate structure, roles, and permissions on first run
 */

const seedService = {
  // Checks if database needs initial seeding
  async bootstrapIfEmpty() {
    try {
      const companiesSnap = await db.collection('companies').limit(1).get();
      if (companiesSnap.empty) {
        console.log('⚡ Initializing Diallo HRMS Indian Corporate Setup in Firestore...');
        await this.seedAll();
        console.log('✓ Firestore Database Seed Completed.');
      }
    } catch (err) {
      console.warn('Bootstrap check note:', err);
    }
  },

  async seedAll() {
    const batch = db.batch();

    // 1. Roles & Granular Permissions
    const roles = [
      {
        id: 'SUPER_ADMIN',
        name: 'Super Administrator',
        description: 'Complete cross-company system access',
        permissions: ['*'],
        status: 'ACTIVE'
      },
      {
        id: 'COMPANY_ADMIN',
        name: 'Company Administrator',
        description: 'Full administrative access for the assigned legal entity',
        permissions: ['people.*', 'attendance.*', 'leave.*', 'payroll.*', 'reports.*', 'admin.view', 'admin.manage', 'communication.*'],
        status: 'ACTIVE'
      },
      {
        id: 'HR',
        name: 'HR Manager',
        description: 'Employee onboarding, attendance, leave approvals, and organization management',
        permissions: ['people.view', 'people.create', 'people.edit', 'attendance.*', 'leave.*', 'reports.view', 'communication.*'],
        status: 'ACTIVE'
      },
      {
        id: 'PAYROLL',
        name: 'Payroll Officer',
        description: 'Salary structures, monthly disbursement processing, and tax filings',
        permissions: ['payroll.view', 'payroll.process', 'reports.view', 'people.view'],
        status: 'ACTIVE'
      },
      {
        id: 'MANAGER',
        name: 'Line Manager',
        description: 'Team attendance oversight and leave approvals',
        permissions: ['attendance.view', 'leave.view', 'leave.approve', 'people.view'],
        status: 'ACTIVE'
      },
      {
        id: 'EMPLOYEE',
        name: 'Employee (ESS)',
        description: 'Self-service timecard, punch logs, leave applications, and payslip download',
        permissions: ['ess.view', 'leave.create', 'attendance.punch'],
        status: 'ACTIVE'
      }
    ];

    roles.forEach(role => {
      const ref = db.collection('roles').doc(role.id);
      batch.set(ref, {
        ...role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    // 2. Default Indian Legal Entities
    const defaultCompanyRef = db.collection('companies').doc('comp_diallo_india');
    batch.set(defaultCompanyRef, {
      name: 'Diallo India Private Limited',
      legalName: 'Diallo India Private Limited',
      code: 'DIPL',
      country: 'India',
      cin: 'U72900MH2026PTC123456',
      pan: 'AAACD1234E',
      gstin: '27AAACD1234E1Z5',
      status: 'ACTIVE',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 3. Indian Regional Hubs
    const branches = [
      { id: 'branch_mumbai', companyId: 'comp_diallo_india', name: 'HQ - Mumbai', city: 'Mumbai (BKC)', state: 'Maharashtra', timezone: 'IST (UTC+5:30)', status: 'ACTIVE' },
      { id: 'branch_bengaluru', companyId: 'comp_diallo_india', name: 'Bengaluru Tech Hub', city: 'Bengaluru (Whitefield)', state: 'Karnataka', timezone: 'IST (UTC+5:30)', status: 'ACTIVE' },
      { id: 'branch_delhi', companyId: 'comp_diallo_india', name: 'Delhi NCR Office', city: 'Gurugram (Cyber City)', state: 'Haryana', timezone: 'IST (UTC+5:30)', status: 'ACTIVE' },
      { id: 'branch_hyderabad', companyId: 'comp_diallo_india', name: 'Hyderabad Innovation Center', city: 'Hyderabad (HITEC City)', state: 'Telangana', timezone: 'IST (UTC+5:30)', status: 'ACTIVE' }
    ];

    branches.forEach(b => {
      const ref = db.collection('branches').doc(b.id);
      batch.set(ref, {
        ...b,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    // 4. Default Departments
    const departments = [
      { name: 'Engineering & Technology', code: 'ENG', head: 'CTO', members: 0, budget: '₹0' },
      { name: 'Human Resources & Talent', code: 'HRD', head: 'HR Lead', members: 0, budget: '₹0' },
      { name: 'Finance, Accounts & Taxation', code: 'FIN', head: 'CFO', members: 0, budget: '₹0' },
      { name: 'Operations & Logistics', code: 'OPS', head: 'Operations Lead', members: 0, budget: '₹0' },
      { name: 'Sales & Marketing', code: 'MKT', head: 'Sales VP', members: 0, budget: '₹0' },
      { name: 'Legal & Secretarial Compliance', code: 'LGL', head: 'Legal Counsel', members: 0, budget: '₹0' }
    ];

    departments.forEach(d => {
      const ref = db.collection('departments').doc();
      batch.set(ref, {
        ...d,
        companyId: 'comp_diallo_india',
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    // 5. Leave Types
    const leaveTypes = [
      { id: 'lt_pl', name: 'Privilege / Earned Leave (PL/EL)', quota: 18, carryForward: 30, color: '#2563eb' },
      { id: 'lt_cl', name: 'Casual Leave (CL)', quota: 12, carryForward: 0, color: '#0891b2' },
      { id: 'lt_sl', name: 'Sick / Medical Leave (SL)', quota: 12, carryForward: 0, color: '#16a34a' },
      { id: 'lt_ml', name: 'Maternity Leave (ML)', quota: 182, carryForward: 0, color: '#db2777' },
      { id: 'lt_pl_paternity', name: 'Paternity Leave (PL)', quota: 15, carryForward: 0, color: '#4f46e5' },
      { id: 'lt_co', name: 'Compensatory Off (Comp-Off)', quota: 6, carryForward: 2, color: '#ea580c' }
    ];

    leaveTypes.forEach(lt => {
      const ref = db.collection('leaveTypes').doc(lt.id);
      batch.set(ref, {
        ...lt,
        companyId: 'comp_diallo_india',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  }
};

window.seedService = seedService;
