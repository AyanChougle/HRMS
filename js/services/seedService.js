/**
 * DIALLO HRMS — PRODUCTION FIREBASE SEED & BOOTSTRAP SERVICE
 * Synchronizes realistic Indian corporate structures, employee rosters,
 * attendance logs, leave ledgers, payroll runs, ATS pipelines, expense claims,
 * IT asset inventories, performance OKRs, and document dossiers across all modules.
 */

const seedService = {
  COMPANY_ID: 'comp_diallo_india',

  // Ensure core corporate structure is set up without dumping demo/mock data
  async bootstrapIfEmpty() {
    try {
      console.log('[Seed] Verifying system datasets across collections...');
      await this.checkAndSeedModule('companies', () => this.seedCoreStructure());
      console.log('[Seed] System dataset verification complete.');
    } catch (err) {
      console.warn('[Seed] Bootstrap check warning:', err);
    }
  },

  async checkAndSeedModule(collectionName, seedFn) {
    try {
      const snap = await db.collection(collectionName).limit(1).get();
      if (snap.empty) {
        console.log(`[Seed] Collection '${collectionName}' is empty. Seeding realistic records...`);
        await seedFn();
        console.log(`[Seed] Collection '${collectionName}' seeded successfully.`);
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

  // 1. CORE CORPORATE STRUCTURE
  async seedCoreStructure() {
    const batch = db.batch();

    // Roles & Granular Permissions
    const roles = [
      { id: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Complete cross-company system access', permissions: ['*'], status: 'ACTIVE' },
      { id: 'COMPANY_ADMIN', name: 'Company Administrator', description: 'Full administrative access for assigned legal entity', permissions: ['people.*', 'attendance.*', 'leave.*', 'payroll.*', 'reports.*', 'admin.view', 'admin.manage', 'communication.*', 'settings.manage', 'users.manage', 'companies.manage'], status: 'ACTIVE' },
      { id: 'HR', name: 'HR Manager', description: 'Employee onboarding, attendance, leave approvals, and organization management', permissions: ['people.view', 'people.create', 'people.edit', 'attendance.*', 'leave.*', 'reports.view', 'communication.*'], status: 'ACTIVE' },
      { id: 'PAYROLL', name: 'Payroll Officer', description: 'Salary structures, monthly disbursement processing, and tax filings', permissions: ['payroll.view', 'payroll.process', 'reports.view', 'people.view'], status: 'ACTIVE' },
      { id: 'MANAGER', name: 'Line Manager', description: 'Team attendance oversight, approvals, and employee self-service', permissions: ['team.*', 'team.view', 'team.attendance', 'team.leave', 'team.approve', 'people.view', 'attendance.*', 'attendance.view', 'leave.*', 'leave.view', 'leave.approve', 'approvals.*', 'approvals.process', 'performance.*', 'requests.*', 'workflows.*', 'communication.*', 'reports.*', 'reports.view', 'own.profile', 'own.attendance', 'own.leave', 'own.payslips', 'own.documents', 'own.requests', 'own.expenses', 'ess.view'], status: 'ACTIVE' },
      { id: 'EMPLOYEE', name: 'Employee (ESS)', description: 'Self-service timecard, punch logs, leave applications, and payslip download', permissions: ['ess.view', 'own.profile', 'own.attendance', 'own.leave', 'own.payslips', 'own.documents', 'own.expenses', 'own.requests', 'attendance.punch', 'attendance.view', 'leave.view', 'leave.create', 'payroll.view', 'communication.view', 'reports.view', 'expenses.view', 'assets.view', 'performance.view', 'documents.view', 'requests.view'], status: 'ACTIVE' }
    ];

    roles.forEach(role => {
      const ref = db.collection('roles').doc(role.id);
      batch.set(ref, { ...role, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });

    // Default Company
    const compRef = db.collection('companies').doc(this.COMPANY_ID);
    batch.set(compRef, {
      name: 'Diallo India Private Limited',
      legalName: 'Diallo India Private Limited',
      code: 'DIPL',
      country: 'India',
      cin: 'U72900MH2026PTC123456',
      pan: 'AAACD1234E',
      gstin: '27AAACD1234E1Z5',
      status: 'ACTIVE',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Regional Branches & Facilities
    const branches = [
      { id: 'branch_mumbai', companyId: this.COMPANY_ID, name: 'Diallo - Ghansoli Mahape', city: 'Navi Mumbai (Ghansoli Mahape)', state: 'Maharashtra', timezone: 'Asia/Kolkata', status: 'ACTIVE' }
    ];

    branches.forEach(b => {
      const ref = db.collection('branches').doc(b.id);
      batch.set(ref, { ...b, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });

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

    // Leave Types
    const leaveTypes = [
      { id: 'lt_pl', code: 'PL', name: 'Privilege Leave (PL)', annualQuota: 18, quota: 18, carryForward: 30, color: '#2563eb' },
      { id: 'lt_cl', code: 'CL', name: 'Casual Leave (CL)', annualQuota: 12, quota: 12, carryForward: 0, color: '#0891b2' }
    ];

    leaveTypes.forEach(lt => {
      const ref = db.collection('leaveTypes').doc(lt.id);
      batch.set(ref, { ...lt, companyId: this.COMPANY_ID }, { merge: true });
    });

    await batch.commit();
  },

  // 2. EMPLOYEES DIRECTORY (25 Employees Spread Evenly Across 7 Departments)
  async seedEmployees() {
    const batch = db.batch();

    const employees = [
      // Current User / Developer Account
      { id: 'EMP000', employeeCode: 'EMP-001', firstName: 'Ayan', lastName: 'Chougle', fullName: 'Ayan Chougle', email: 'ayanislight@gmail.com', workEmail: 'ayanislight@gmail.com', department: 'Engineering & Technology', designation: 'Software Engineer', branchName: 'HQ - Mumbai', phone: '+91 7208533219', gender: 'Male', joinDate: '2024-01-15', dateOfJoining: '2024-01-15', salary: 1800000, basicSalary: 75000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABCDE1234F', uanNumber: '101234567890', esicNumber: '31000123450000001', bankName: 'HDFC Bank Ltd', accountNumber: '5010048923412', ifscCode: 'HDFC0001234' },

      // Leadership & Engineering
      { id: 'EMP001', employeeCode: 'EMP-002', firstName: 'Vikram', lastName: 'Sharma', fullName: 'Vikram Sharma', email: 'vikram.sharma@diallo.com', department: 'Engineering & Technology', designation: 'Chief Technology Officer', branchName: 'HQ - Mumbai', phone: '+91 98200 12345', gender: 'Male', joinDate: '2021-01-10', salary: 3600000, basicSalary: 150000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVPS1234A', uanNumber: '101234567801', esicNumber: '31000123450000002', bankName: 'HDFC Bank Ltd', accountNumber: '5010012345001', ifscCode: 'HDFC0001234' },
      { id: 'EMP005', employeeCode: 'EMP-003', firstName: 'Arjun', lastName: 'Patel', fullName: 'Arjun Patel', email: 'arjun.patel@diallo.com', department: 'Engineering & Technology', designation: 'Senior Software Engineer', branchName: 'Bengaluru Tech Hub', phone: '+91 98200 12349', gender: 'Male', joinDate: '2022-04-12', salary: 1800000, basicSalary: 75000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVAP1234B', uanNumber: '101234567805', esicNumber: '31000123450000005', bankName: 'ICICI Bank', accountNumber: '0011012345005', ifscCode: 'ICIC0000011' },
      { id: 'EMP006', employeeCode: 'EMP-004', firstName: 'Sneha', lastName: 'Desai', fullName: 'Sneha Desai', email: 'sneha.desai@diallo.com', department: 'Engineering & Technology', designation: 'Software Engineer', branchName: 'Bengaluru Tech Hub', phone: '+91 98200 12350', gender: 'Female', joinDate: '2023-07-01', salary: 1200000, basicSalary: 50000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVSD1234C', uanNumber: '101234567806', esicNumber: '31000123450000006', bankName: 'Axis Bank', accountNumber: '9120012345006', ifscCode: 'UTIB0000912' },
      { id: 'EMP011', employeeCode: 'EMP-005', firstName: 'Amit', lastName: 'Kumar', fullName: 'Amit Kumar', email: 'amit.kumar@diallo.com', department: 'Engineering & Technology', designation: 'Team Lead', branchName: 'Bengaluru Tech Hub', phone: '+91 98200 12355', gender: 'Male', joinDate: '2022-03-05', salary: 2000000, basicSalary: 83000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVAK1234D', uanNumber: '101234567811', esicNumber: '31000123450000011', bankName: 'HDFC Bank Ltd', accountNumber: '5010012345011', ifscCode: 'HDFC0001234' },
      { id: 'EMP015', employeeCode: 'EMP-006', firstName: 'Rohit', lastName: 'Saxena', fullName: 'Rohit Saxena', email: 'rohit.saxena@diallo.com', department: 'Engineering & Technology', designation: 'Software Engineer', branchName: 'Hyderabad Innovation Center', phone: '+91 98200 12359', gender: 'Male', joinDate: '2023-04-18', salary: 1100000, basicSalary: 45000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVRS1234E', uanNumber: '101234567815', esicNumber: '31000123450000015', bankName: 'State Bank of India', accountNumber: '2030012345015', ifscCode: 'SBIN0002030' },
      { id: 'EMP020', employeeCode: 'EMP-007', firstName: 'Tanvi', lastName: 'Agarwal', fullName: 'Tanvi Agarwal', email: 'tanvi.agarwal@diallo.com', department: 'Engineering & Technology', designation: 'Junior Engineer', branchName: 'Bengaluru Tech Hub', phone: '+91 98200 12364', gender: 'Female', joinDate: '2024-07-01', salary: 600000, basicSalary: 25000, employmentType: 'Probation', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVTA1234F', uanNumber: '101234567820', esicNumber: '31000123450000020', bankName: 'HDFC Bank Ltd', accountNumber: '5010012345020', ifscCode: 'HDFC0001234' },

      // Human Resources
      { id: 'EMP002', employeeCode: 'EMP-008', firstName: 'Priya', lastName: 'Nair', fullName: 'Priya Nair', email: 'priya.nair@diallo.com', department: 'Human Resources', designation: 'HR Manager', branchName: 'HQ - Mumbai', phone: '+91 98200 12346', gender: 'Female', joinDate: '2021-03-01', salary: 1800000, basicSalary: 75000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVPN1234G', uanNumber: '101234567802', esicNumber: '31000123450000002', bankName: 'Kotak Mahindra Bank', accountNumber: '4110012345002', ifscCode: 'KKBK0000411' },
      { id: 'EMP010', employeeCode: 'EMP-009', firstName: 'Meera', lastName: 'Iyer', fullName: 'Meera Iyer', email: 'meera.iyer@diallo.com', department: 'Human Resources', designation: 'HR Executive', branchName: 'Bengaluru Tech Hub', phone: '+91 98200 12354', gender: 'Female', joinDate: '2023-01-10', salary: 850000, basicSalary: 35000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVMI1234H', uanNumber: '101234567810', esicNumber: '31000123450000010', bankName: 'HDFC Bank Ltd', accountNumber: '5010012345010', ifscCode: 'HDFC0001234' },
      { id: 'EMP018', employeeCode: 'EMP-010', firstName: 'Kavya', lastName: 'Menon', fullName: 'Kavya Menon', email: 'kavya.menon@diallo.com', department: 'Human Resources', designation: 'HR Executive', branchName: 'HQ - Mumbai', phone: '+91 98200 12362', gender: 'Female', joinDate: '2024-03-01', salary: 750000, basicSalary: 31000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVKM1234I', uanNumber: '101234567818', esicNumber: '31000123450000018', bankName: 'ICICI Bank', accountNumber: '0011012345018', ifscCode: 'ICIC0000011' },

      // Finance & Taxation
      { id: 'EMP003', employeeCode: 'EMP-011', firstName: 'Rahul', lastName: 'Mehta', fullName: 'Rahul Mehta', email: 'rahul.mehta@diallo.com', department: 'Finance, Accounts & Taxation', designation: 'Senior Accountant', branchName: 'HQ - Mumbai', phone: '+91 98200 12347', gender: 'Male', joinDate: '2021-06-15', salary: 1600000, basicSalary: 66000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVRM1234J', uanNumber: '101234567803', esicNumber: '31000123450000003', bankName: 'HDFC Bank Ltd', accountNumber: '5010012345003', ifscCode: 'HDFC0001234' },
      { id: 'EMP014', employeeCode: 'EMP-012', firstName: 'Pooja', lastName: 'Verma', fullName: 'Pooja Verma', email: 'pooja.verma@diallo.com', department: 'Finance, Accounts & Taxation', designation: 'Accountant', branchName: 'HQ - Mumbai', phone: '+91 98200 12358', gender: 'Female', joinDate: '2023-02-14', salary: 900000, basicSalary: 37500, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVPV1234K', uanNumber: '101234567814', esicNumber: '31000123450000014', bankName: 'Axis Bank', accountNumber: '9120012345014', ifscCode: 'UTIB0000912' },
      { id: 'EMP023', employeeCode: 'EMP-013', firstName: 'Varun', lastName: 'Bhatt', fullName: 'Varun Bhatt', email: 'varun.bhatt@diallo.com', department: 'Finance, Accounts & Taxation', designation: 'Accountant', branchName: 'Delhi NCR Office', phone: '+91 98200 12367', gender: 'Male', joinDate: '2024-02-06', salary: 850000, basicSalary: 35000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVVB1234L', uanNumber: '101234567823', esicNumber: '31000123450000023', bankName: 'HDFC Bank Ltd', accountNumber: '5010012345023', ifscCode: 'HDFC0001234' },

      // Operations & Logistics
      { id: 'EMP009', employeeCode: 'EMP-014', firstName: 'Suresh', lastName: 'Reddy', fullName: 'Suresh Reddy', email: 'suresh.reddy@diallo.com', department: 'Operations & Logistics', designation: 'Senior Manager', branchName: 'Hyderabad Innovation Center', phone: '+91 98200 12353', gender: 'Male', joinDate: '2021-02-20', salary: 2100000, basicSalary: 87500, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVSR1234M', uanNumber: '101234567809', esicNumber: '31000123450000009', bankName: 'State Bank of India', accountNumber: '2030012345009', ifscCode: 'SBIN0002030' },
      { id: 'EMP013', employeeCode: 'EMP-015', firstName: 'Naveen', lastName: 'Singh', fullName: 'Naveen Singh', email: 'naveen.singh@diallo.com', department: 'Operations & Logistics', designation: 'Team Lead', branchName: 'Delhi NCR Office', phone: '+91 98200 12357', gender: 'Male', joinDate: '2022-11-15', salary: 1400000, basicSalary: 58000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVNS1234N', uanNumber: '101234567813', esicNumber: '31000123450000013', bankName: 'HDFC Bank Ltd', accountNumber: '5010012345013', ifscCode: 'HDFC0001234' },
      { id: 'EMP022', employeeCode: 'EMP-016', firstName: 'Neha', lastName: 'Pillai', fullName: 'Neha Pillai', email: 'neha.pillai@diallo.com', department: 'Operations & Logistics', designation: 'Manager', branchName: 'Bengaluru Tech Hub', phone: '+91 98200 12366', gender: 'Female', joinDate: '2022-05-20', salary: 1600000, basicSalary: 66000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVNP1234O', uanNumber: '101234567822', esicNumber: '31000123450000022', bankName: 'ICICI Bank', accountNumber: '0011012345022', ifscCode: 'ICIC0000011' },

      // Sales & Marketing
      { id: 'EMP004', employeeCode: 'EMP-017', firstName: 'Ananya', lastName: 'Gupta', fullName: 'Ananya Gupta', email: 'ananya.gupta@diallo.com', department: 'Sales & Marketing', designation: 'Sales Manager', branchName: 'Delhi NCR Office', phone: '+91 98200 12348', gender: 'Female', joinDate: '2021-01-08', salary: 1800000, basicSalary: 75000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVAG1234P', uanNumber: '101234567804', esicNumber: '31000123450000004', bankName: 'HDFC Bank Ltd', accountNumber: '5010012345004', ifscCode: 'HDFC0001234' },
      { id: 'EMP012', employeeCode: 'EMP-018', firstName: 'Roshni', lastName: 'Chatterjee', fullName: 'Roshni Chatterjee', email: 'roshni.chatterjee@diallo.com', department: 'Sales & Marketing', designation: 'Marketing Executive', branchName: 'Delhi NCR Office', phone: '+91 98200 12356', gender: 'Female', joinDate: '2023-06-01', salary: 750000, basicSalary: 31000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVRC1234Q', uanNumber: '101234567812', esicNumber: '31000123450000012', bankName: 'Axis Bank', accountNumber: '9120012345012', ifscCode: 'UTIB0000912' },
      { id: 'EMP019', employeeCode: 'EMP-019', firstName: 'Siddharth', lastName: 'Kapoor', fullName: 'Siddharth Kapoor', email: 'siddharth.kapoor@diallo.com', department: 'Sales & Marketing', designation: 'Marketing Executive', branchName: 'HQ - Mumbai', phone: '+91 98200 12363', gender: 'Male', joinDate: '2023-09-12', salary: 800000, basicSalary: 33000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVSK1234R', uanNumber: '101234567819', esicNumber: '31000123450000019', bankName: 'Kotak Mahindra Bank', accountNumber: '4110012345019', ifscCode: 'KKBK0000411' },

      // Legal & Secretarial
      { id: 'EMP008', employeeCode: 'EMP-020', firstName: 'Deepika', lastName: 'Joshi', fullName: 'Deepika Joshi', email: 'deepika.joshi@diallo.com', department: 'Legal & Secretarial Compliance', designation: 'Manager', branchName: 'HQ - Mumbai', phone: '+91 98200 12352', gender: 'Female', joinDate: '2021-11-01', salary: 2200000, basicSalary: 91000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVDJ1234S', uanNumber: '101234567808', esicNumber: '31000123450000008', bankName: 'HDFC Bank Ltd', accountNumber: '5010012345008', ifscCode: 'HDFC0001234' },
      { id: 'EMP024', employeeCode: 'EMP-021', firstName: 'Shreya', lastName: 'Das', fullName: 'Shreya Das', email: 'shreya.das@diallo.com', department: 'Legal & Secretarial Compliance', designation: 'Compliance Analyst', branchName: 'HQ - Mumbai', phone: '+91 98200 12368', gender: 'Female', joinDate: '2023-11-01', salary: 900000, basicSalary: 37500, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVSD1234T', uanNumber: '101234567824', esicNumber: '31000123450000024', bankName: 'State Bank of India', accountNumber: '2030012345024', ifscCode: 'SBIN0002030' },

      // Digital & Design
      { id: 'EMP007', employeeCode: 'EMP-022', firstName: 'Karan', lastName: 'Malhotra', fullName: 'Karan Malhotra', email: 'karan.malhotra@diallo.com', department: 'Digital & Design', designation: 'Lead UI/UX Designer', branchName: 'HQ - Mumbai', phone: '+91 98200 12351', gender: 'Male', joinDate: '2022-09-15', salary: 1400000, basicSalary: 58000, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVKM1234U', uanNumber: '101234567807', esicNumber: '31000123450000007', bankName: 'HDFC Bank Ltd', accountNumber: '5010012345007', ifscCode: 'HDFC0001234' },
      { id: 'EMP016', employeeCode: 'EMP-023', firstName: 'Ishita', lastName: 'Bose', fullName: 'Ishita Bose', email: 'ishita.bose@diallo.com', department: 'Digital & Design', designation: 'UI/UX Designer', branchName: 'HQ - Mumbai', phone: '+91 98200 12360', gender: 'Female', joinDate: '2024-01-09', salary: 950000, basicSalary: 39500, employmentType: 'Permanent', employmentStatus: 'ACTIVE', status: 'ACTIVE', panNumber: 'ABVIB1234V', uanNumber: '101234567816', esicNumber: '31000123450000016', bankName: 'ICICI Bank', accountNumber: '0011012345016', ifscCode: 'ICIC0000011' }
    ];

    employees.forEach(emp => {
      const ref = db.collection('employees').doc(emp.id);
      batch.set(ref, {
        ...emp,
        companyId: this.COMPANY_ID,
        type: emp.employmentType,
        joiningDate: emp.joinDate,
        dateOfJoining: emp.joinDate,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
  },

  // 3. ATTENDANCE & PUNCH LOGS (For Today and Realtime Metrics)
  async seedAttendance() {
    const batch = db.batch();
    const today = new Date().toISOString().slice(0, 10);

    const attendances = [
      { employeeId: 'EMP000', employeeName: 'Ayan Chougle', status: 'PRESENT', checkIn: '09:02 AM', checkOut: '06:15 PM', workedHoursFormatted: '9h 13m', workedMinutes: 553, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP001', employeeName: 'Vikram Sharma', status: 'PRESENT', checkIn: '08:55 AM', checkOut: '06:30 PM', workedHoursFormatted: '9h 35m', workedMinutes: 575, totalBreakMinutes: 40, isOnBreak: false },
      { employeeId: 'EMP002', employeeName: 'Priya Nair', status: 'PRESENT', checkIn: '09:05 AM', checkOut: '06:10 PM', workedHoursFormatted: '9h 05m', workedMinutes: 545, totalBreakMinutes: 50, isOnBreak: false },
      { employeeId: 'EMP003', employeeName: 'Rahul Mehta', status: 'PRESENT', checkIn: '09:10 AM', checkOut: '06:00 PM', workedHoursFormatted: '8h 50m', workedMinutes: 530, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP004', employeeName: 'Ananya Gupta', status: 'LATE', checkIn: '09:42 AM', checkOut: '06:45 PM', workedHoursFormatted: '9h 03m', workedMinutes: 543, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP005', employeeName: 'Arjun Patel', status: 'PRESENT', checkIn: '08:50 AM', checkOut: '06:20 PM', workedHoursFormatted: '9h 30m', workedMinutes: 570, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP006', employeeName: 'Sneha Desai', status: 'ON_LEAVE', checkIn: null, checkOut: null, workedHoursFormatted: '0h 00m', workedMinutes: 0, totalBreakMinutes: 0, isOnBreak: false },
      { employeeId: 'EMP007', employeeName: 'Karan Malhotra', status: 'PRESENT', checkIn: '09:08 AM', checkOut: '06:12 PM', workedHoursFormatted: '9h 04m', workedMinutes: 544, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP008', employeeName: 'Deepika Joshi', status: 'ON_LEAVE', checkIn: null, checkOut: null, workedHoursFormatted: '0h 00m', workedMinutes: 0, totalBreakMinutes: 0, isOnBreak: false },
      { employeeId: 'EMP009', employeeName: 'Suresh Reddy', status: 'PRESENT', checkIn: '08:45 AM', checkOut: '06:15 PM', workedHoursFormatted: '9h 30m', workedMinutes: 570, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP010', employeeName: 'Meera Iyer', status: 'PRESENT', checkIn: '09:00 AM', checkOut: '06:00 PM', workedHoursFormatted: '9h 00m', workedMinutes: 540, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP011', employeeName: 'Amit Kumar', status: 'WFH', checkIn: '09:00 AM', checkOut: '06:00 PM', workedHoursFormatted: '9h 00m', workedMinutes: 540, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP012', employeeName: 'Roshni Chatterjee', status: 'LATE', checkIn: '09:38 AM', checkOut: '06:35 PM', workedHoursFormatted: '8h 57m', workedMinutes: 537, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP013', employeeName: 'Naveen Singh', status: 'PRESENT', checkIn: '08:58 AM', checkOut: '06:05 PM', workedHoursFormatted: '9h 07m', workedMinutes: 547, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP014', employeeName: 'Pooja Verma', status: 'PRESENT', checkIn: '09:04 AM', checkOut: '06:00 PM', workedHoursFormatted: '8h 56m', workedMinutes: 536, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP015', employeeName: 'Rohit Saxena', status: 'WFH', checkIn: '09:15 AM', checkOut: '06:15 PM', workedHoursFormatted: '9h 00m', workedMinutes: 540, totalBreakMinutes: 45, isOnBreak: false },
      { employeeId: 'EMP016', employeeName: 'Ishita Bose', status: 'PRESENT', checkIn: '09:03 AM', checkOut: '06:10 PM', workedHoursFormatted: '9h 07m', workedMinutes: 547, totalBreakMinutes: 45, isOnBreak: false }
    ];

    attendances.forEach(att => {
      const recordId = `${att.employeeId}_${today}`;
      const ref = db.collection('attendanceRecords').doc(recordId);
      batch.set(ref, {
        ...att,
        date: today,
        companyId: this.COMPANY_ID,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
  },

  // 4. LEAVE APPLICATIONS & BALANCES
  async seedLeaveRecords() {
    const batch = db.batch();
    const today = new Date().toISOString().slice(0, 10);

    const leaves = [
      { id: 'LV001', employeeId: 'EMP006', employeeName: 'Sneha Desai', leaveTypeCode: 'PL', leaveTypeName: 'Privilege Leave (PL)', startDate: today, endDate: today, days: 1, reason: 'Annual Family Vacation', status: 'APPROVED', managerId: 'EMP001', companyId: this.COMPANY_ID },
      { id: 'LV002', employeeId: 'EMP008', employeeName: 'Deepika Joshi', leaveTypeCode: 'CL', leaveTypeName: 'Casual Leave (CL)', startDate: today, endDate: today, days: 1, reason: 'Personal family event', status: 'APPROVED', managerId: 'EMP001', companyId: this.COMPANY_ID },
      { id: 'LV003', employeeId: 'EMP005', employeeName: 'Arjun Patel', leaveTypeCode: 'PL', leaveTypeName: 'Privilege Leave (PL)', startDate: '2026-09-24', endDate: '2026-09-26', days: 3, reason: 'Out of town wedding', status: 'PENDING', managerId: 'EMP001', companyId: this.COMPANY_ID },
      { id: 'LV004', employeeId: 'EMP012', employeeName: 'Roshni Chatterjee', leaveTypeCode: 'CL', leaveTypeName: 'Casual Leave (CL)', startDate: '2026-09-28', endDate: '2026-09-28', days: 1, reason: 'Routine medical consultation', status: 'PENDING', managerId: 'EMP004', companyId: this.COMPANY_ID },
      { id: 'LV005', employeeId: 'EMP000', employeeName: 'Ayan Chougle', leaveTypeCode: 'CL', leaveTypeName: 'Casual Leave (CL)', startDate: '2026-08-10', endDate: '2026-08-10', days: 1, reason: 'Personal errands', status: 'APPROVED', managerId: 'EMP001', companyId: this.COMPANY_ID }
    ];

    leaves.forEach(l => {
      const ref = db.collection('leaveApplications').doc(l.id);
      batch.set(ref, {
        ...l,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    // Seed balances
    const employees = ['EMP000', 'EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005', 'EMP006', 'EMP007', 'EMP008'];
    employees.forEach(empId => {
      const bRef = db.collection('leaveBalances').doc(`${empId}_2026`);
      batch.set(bRef, {
        employeeId: empId,
        companyId: this.COMPANY_ID,
        year: 2026,
        PL: { quota: 18, used: 2, balance: 16 },
        CL: { quota: 12, used: 1, balance: 11 },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
  },

  // 5. UNIFIED APPROVAL TASKS (For Action Center & Admin Dashboard)
  async seedApprovalTasks() {
    const batch = db.batch();

    const tasks = [
      { id: 'TASK001', module: 'LEAVE', stepName: 'Manager Review', employee: 'Arjun Patel', employeeId: 'EMP005', type: 'Leave Request', detail: 'Privilege Leave — 3 days (Out of town wedding)', status: 'PENDING', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'TASK002', module: 'EXPENSES', stepName: 'Finance Review', employee: 'Rohit Saxena', employeeId: 'EMP015', type: 'Expense Claim', detail: 'INR 4,500 — Client lunch meeting at Taj Lands End', status: 'PENDING', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'TASK003', module: 'REGULARIZATION', stepName: 'HR Approval', employee: 'Tanvi Agarwal', employeeId: 'EMP020', type: 'Regularization', detail: 'Missed Punch — Biometric sync error (Aug 29)', status: 'PENDING', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'TASK004', module: 'ASSETS', stepName: 'IT Provisioning', employee: 'Karan Malhotra', employeeId: 'EMP007', type: 'Hardware Requisition', detail: 'Dell UltraSharp 27 Monitor Requisition', status: 'PENDING', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    tasks.forEach(t => {
      const ref = db.collection('approvalTasks').doc(t.id);
      batch.set(ref, t, { merge: true });
    });

    await batch.commit();
  },

  // 6. PAYROLL PERIODS & OFFICIAL PAYSLIPS
  async seedPayroll() {
    const batch = db.batch();

    const periods = [
      { id: 'period_august_2026', name: 'August 2026', month: 'August 2026', startDate: '2026-08-01', endDate: '2026-08-31', payDate: '2026-09-05', status: 'APPROVED', employeeCount: 23, totalGross: 'INR 28,50,000', totalGrossNum: 2850000, totalDeductions: 'INR 4,40,000', totalDeductionsNum: 440000, totalNet: 'INR 24,10,000', totalNetNum: 2410000, companyId: this.COMPANY_ID },
      { id: 'period_july_2026', name: 'July 2026', month: 'July 2026', startDate: '2026-07-01', endDate: '2026-07-31', payDate: '2026-08-05', status: 'LOCKED', employeeCount: 22, totalGross: 'INR 27,80,000', totalGrossNum: 2780000, totalDeductions: 'INR 4,30,000', totalDeductionsNum: 430000, totalNet: 'INR 23,50,000', totalNetNum: 2350000, companyId: this.COMPANY_ID }
    ];

    periods.forEach(p => {
      const ref = db.collection('payrollPeriods').doc(p.id);
      batch.set(ref, { ...p, createdAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });

    // Seed Payslips for current user & team
    const payslips = [
      { id: 'PS_EMP000_AUG26', employeeId: 'EMP000', employeeName: 'Ayan Chougle', employeeCode: 'EMP-001', month: 'August 2026', payrollPeriodId: 'period_august_2026', grossSalary: 150000, basicSalary: 75000, hra: 37500, allowances: 37500, epfDeduction: 1800, esicDeduction: 0, ptDeduction: 200, tdsDeduction: 12500, totalDeductions: 14500, netPay: 135500, status: 'DISBURSED', companyId: this.COMPANY_ID },
      { id: 'PS_EMP001_AUG26', employeeId: 'EMP001', employeeName: 'Vikram Sharma', employeeCode: 'EMP-002', month: 'August 2026', payrollPeriodId: 'period_august_2026', grossSalary: 300000, basicSalary: 150000, hra: 75000, allowances: 75000, epfDeduction: 1800, esicDeduction: 0, ptDeduction: 200, tdsDeduction: 35000, totalDeductions: 37000, netPay: 263000, status: 'DISBURSED', companyId: this.COMPANY_ID }
    ];

    payslips.forEach(ps => {
      const ref = db.collection('payslips').doc(ps.id);
      batch.set(ref, { ...ps, createdAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });

    await batch.commit();
  },

  // 7. EXPENSE CLAIMS & CATEGORIES
  async seedExpenses() {
    const batch = db.batch();

    // Default categories
    const categories = [
      { id: `${this.COMPANY_ID}_travel`, code: 'TRAVEL', name: 'Travel & Flights', maxAmount: 50000, requiresReceipt: true, companyId: this.COMPANY_ID, isActive: true },
      { id: `${this.COMPANY_ID}_food`, code: 'FOOD', name: 'Meals & Food', maxAmount: 3000, requiresReceipt: true, companyId: this.COMPANY_ID, isActive: true },
      { id: `${this.COMPANY_ID}_supplies`, code: 'OFFICE_SUPPLIES', name: 'Office Supplies & Hardware', maxAmount: 15000, requiresReceipt: true, companyId: this.COMPANY_ID, isActive: true },
      { id: `${this.COMPANY_ID}_client`, code: 'CLIENT_MEETING', name: 'Client Entertainment', maxAmount: 12000, requiresReceipt: true, companyId: this.COMPANY_ID, isActive: true },
      { id: `${this.COMPANY_ID}_training`, code: 'TRAINING', name: 'Certifications & Courses', maxAmount: 25000, requiresReceipt: true, companyId: this.COMPANY_ID, isActive: true }
    ];

    categories.forEach(c => {
      const ref = db.collection('expenseCategories').doc(c.id);
      batch.set(ref, c, { merge: true });
    });

    // Claims
    const claims = [
      { id: 'EXP001', employeeId: 'EMP015', employeeName: 'Rohit Saxena', employeeCode: 'EMP-006', categoryCode: 'CLIENT_MEETING', categoryName: 'Client Entertainment', amount: 4500, currency: 'INR', expenseDate: '2026-08-28', description: 'Client lunch meeting at Taj Lands End', status: 'SUBMITTED', receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e4c019fcaf4?w=500&auto=format&fit=crop', companyId: this.COMPANY_ID },
      { id: 'EXP002', employeeId: 'EMP004', employeeName: 'Ananya Gupta', employeeCode: 'EMP-017', categoryCode: 'TRAVEL', categoryName: 'Travel & Flights', amount: 12800, currency: 'INR', expenseDate: '2026-08-20', description: 'Delhi to Mumbai flight for client presentation', status: 'APPROVED', receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e4c019fcaf4?w=500&auto=format&fit=crop', companyId: this.COMPANY_ID },
      { id: 'EXP003', employeeId: 'EMP013', employeeName: 'Naveen Singh', employeeCode: 'EMP-015', categoryCode: 'OFFICE_SUPPLIES', categoryName: 'Office Supplies & Hardware', amount: 2350, currency: 'INR', expenseDate: '2026-08-25', description: 'Printer cartridges and stationery for Delhi office', status: 'APPROVED', receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e4c019fcaf4?w=500&auto=format&fit=crop', companyId: this.COMPANY_ID },
      { id: 'EXP004', employeeId: 'EMP000', employeeName: 'Ayan Chougle', employeeCode: 'EMP-001', categoryCode: 'TRAINING', categoryName: 'Certifications & Courses', amount: 8900, currency: 'INR', expenseDate: '2026-08-15', description: 'Google Cloud Professional Cloud Architect Certification', status: 'PAID', receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e4c019fcaf4?w=500&auto=format&fit=crop', companyId: this.COMPANY_ID }
    ];

    claims.forEach(cl => {
      const ref = db.collection('expenses').doc(cl.id);
      batch.set(ref, {
        ...cl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
  },

  // 8. IT ASSETS INVENTORY
  async seedAssets() {
    const batch = db.batch();

    // Asset Categories
    const categories = [
      { id: `${this.COMPANY_ID}_lap`, code: 'LAPTOP', name: 'Laptops & Workstations', prefix: 'DL-LAP', companyId: this.COMPANY_ID },
      { id: `${this.COMPANY_ID}_mon`, code: 'MONITOR', name: 'Monitors & Displays', prefix: 'DL-MON', companyId: this.COMPANY_ID },
      { id: `${this.COMPANY_ID}_mob`, code: 'MOBILE', name: 'Smartphones & Tablets', prefix: 'DL-MOB', companyId: this.COMPANY_ID },
      { id: `${this.COMPANY_ID}_acc`, code: 'ACCESS_CARD', name: 'Access Cards & Keys', prefix: 'DL-ACC', companyId: this.COMPANY_ID }
    ];

    categories.forEach(c => {
      const ref = db.collection('assetCategories').doc(c.id);
      batch.set(ref, c, { merge: true });
    });

    // Hardware Assets
    const assets = [
      { id: 'AST001', assetTag: 'DL-LAP-001', name: 'MacBook Pro 14 M3', brand: 'Apple', model: 'A2992', categoryCode: 'LAPTOP', categoryName: 'Laptops & Workstations', serialNumber: 'C02ZF1ABCDEF', value: 225000, purchasePrice: 225000, status: 'ASSIGNED', currentEmployeeId: 'EMP000', currentEmployeeName: 'Ayan Chougle', assignedDate: '2024-01-20', condition: 'EXCELLENT', companyId: this.COMPANY_ID },
      { id: 'AST002', assetTag: 'DL-LAP-002', name: 'Dell XPS 15', brand: 'Dell', model: '9530', categoryCode: 'LAPTOP', categoryName: 'Laptops & Workstations', serialNumber: 'CN-0AB12CD', value: 165000, purchasePrice: 165000, status: 'ASSIGNED', currentEmployeeId: 'EMP005', currentEmployeeName: 'Arjun Patel', assignedDate: '2024-03-10', condition: 'GOOD', companyId: this.COMPANY_ID },
      { id: 'AST003', assetTag: 'DL-MON-001', name: 'Dell UltraSharp U2723QE 27', brand: 'Dell', model: 'U2723QE', categoryCode: 'MONITOR', categoryName: 'Monitors & Displays', serialNumber: 'DL-MON-4582', value: 45000, purchasePrice: 45000, status: 'ASSIGNED', currentEmployeeId: 'EMP000', currentEmployeeName: 'Ayan Chougle', assignedDate: '2024-02-15', condition: 'EXCELLENT', companyId: this.COMPANY_ID },
      { id: 'AST004', assetTag: 'DL-MOB-001', name: 'iPhone 15 Pro 256GB', brand: 'Apple', model: 'A3102', categoryCode: 'MOBILE', categoryName: 'Smartphones & Tablets', serialNumber: 'FFMP2ABCDEF', value: 134900, purchasePrice: 134900, status: 'ASSIGNED', currentEmployeeId: 'EMP002', currentEmployeeName: 'Priya Nair', assignedDate: '2024-06-01', condition: 'EXCELLENT', companyId: this.COMPANY_ID },
      { id: 'AST005', assetTag: 'DL-LAP-003', name: 'ThinkPad X1 Carbon Gen 11', brand: 'Lenovo', model: '21HM', categoryCode: 'LAPTOP', categoryName: 'Laptops & Workstations', serialNumber: 'LN-X1C-9988', value: 155000, purchasePrice: 155000, status: 'AVAILABLE', currentEmployeeId: null, currentEmployeeName: null, condition: 'EXCELLENT', companyId: this.COMPANY_ID },
      { id: 'AST006', assetTag: 'DL-LAP-004', name: 'MacBook Air M2', brand: 'Apple', model: 'A2681', categoryCode: 'LAPTOP', categoryName: 'Laptops & Workstations', serialNumber: 'C02HG89912', value: 105000, purchasePrice: 105000, status: 'MAINTENANCE', currentEmployeeId: null, currentEmployeeName: null, condition: 'FAIR', companyId: this.COMPANY_ID }
    ];

    assets.forEach(a => {
      const ref = db.collection('assets').doc(a.id);
      batch.set(ref, {
        ...a,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    // Hardware Vendors
    const vendors = [
      { id: 'VEN001', name: 'Dell Enterprise Solutions India', contactPerson: 'Rajesh Kanna', email: 'enterprise-sales@dell.co.in', phone: '+91 80 6789 0123', category: 'Hardware & Laptops', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'VEN002', name: 'Apple Enterprise Direct', contactPerson: 'Karan Mehra', email: 'b2b@imagineonline.store', phone: '+91 22 4567 8901', category: 'Laptops & Workstations', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    vendors.forEach(v => {
      const ref = db.collection('vendors').doc(v.id);
      batch.set(ref, v, { merge: true });
    });

    await batch.commit();
  },

  // 9. RECRUITMENT & ATS PIPELINE
  async seedRecruitment() {
    const batch = db.batch();

    // Requisitions
    const requisitions = [
      { id: 'REQ001', positionTitle: 'Senior React Developer', departmentName: 'Engineering & Technology', designation: 'Senior Software Engineer', branchId: 'Bengaluru Tech Hub', numberOfPositions: 2, minExperience: 4, maxExperience: 8, salaryMin: 1800000, salaryMax: 2600000, status: 'APPROVED', companyId: this.COMPANY_ID, requestedBy: 'Vikram Sharma', createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'REQ002', positionTitle: 'HR Business Partner', departmentName: 'Human Resources', designation: 'HR Manager', branchId: 'HQ - Mumbai', numberOfPositions: 1, minExperience: 5, maxExperience: 9, salaryMin: 1400000, salaryMax: 1800000, status: 'APPROVED', companyId: this.COMPANY_ID, requestedBy: 'Priya Nair', createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'REQ003', positionTitle: 'Financial Analyst', departmentName: 'Finance, Accounts & Taxation', designation: 'Accountant', branchId: 'HQ - Mumbai', numberOfPositions: 1, minExperience: 2, maxExperience: 5, salaryMin: 800000, salaryMax: 1200000, status: 'APPROVED', companyId: this.COMPANY_ID, requestedBy: 'Rahul Mehta', createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'REQ004', positionTitle: 'DevOps & Cloud Engineer', departmentName: 'Engineering & Technology', designation: 'Team Lead', branchId: 'Hyderabad Innovation Center', numberOfPositions: 1, minExperience: 4, maxExperience: 7, salaryMin: 1600000, salaryMax: 2200000, status: 'APPROVED', companyId: this.COMPANY_ID, requestedBy: 'Vikram Sharma', createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    requisitions.forEach(req => {
      const ref = db.collection('jobRequisitions').doc(req.id);
      batch.set(ref, req, { merge: true });
    });

    // Published Job Positions
    const jobs = [
      { id: 'JOB001', title: 'Senior React Developer', department: 'Engineering & Technology', location: 'Bengaluru Tech Hub', employmentType: 'FULL_TIME', workMode: 'HYBRID', experience: '4–8 Years', openings: 2, salaryRange: '₹18,00,000 – ₹26,00,000', description: 'Lead frontend architecture, design modern web components, and mentor engineering talent.', requirements: 'Deep expertise in React, JavaScript (ES6+), State Management, WebSockets, and Performance Optimization.', skills: ['React', 'JavaScript', 'TypeScript', 'Redux', 'CSS3'], status: 'PUBLISHED', companyId: this.COMPANY_ID, closingDate: '2026-11-30', createdBy: 'Priya Nair', createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'JOB002', title: 'HR Business Partner', department: 'Human Resources', location: 'HQ - Mumbai', employmentType: 'FULL_TIME', workMode: 'ON_SITE', experience: '5–9 Years', openings: 1, salaryRange: '₹14,00,000 – ₹18,00,000', description: 'Partner with leadership on workforce planning, performance appraisal cycles, and retention.', requirements: 'Proven experience in HR business partnering, Indian labor laws, and employee relations.', skills: ['HRBP', 'Talent Management', 'Labor Laws', 'Appraisals'], status: 'PUBLISHED', companyId: this.COMPANY_ID, closingDate: '2026-12-15', createdBy: 'Priya Nair', createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'JOB003', title: 'Financial Analyst', department: 'Finance, Accounts & Taxation', location: 'HQ - Mumbai', employmentType: 'FULL_TIME', workMode: 'ON_SITE', experience: '2–5 Years', openings: 1, salaryRange: '₹8,00,000 – ₹12,00,000', description: 'Handle financial forecasting, budget variance reports, and taxation reconciliation.', requirements: 'Strong analytical skills, CA Inter/CMA/MBA Finance, and advanced Excel modeling.', skills: ['Financial Modeling', 'GST', 'TDS', 'MIS Reporting'], status: 'PUBLISHED', companyId: this.COMPANY_ID, closingDate: '2026-10-31', createdBy: 'Rahul Mehta', createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'JOB004', title: 'DevOps & Cloud Engineer', department: 'Engineering & Technology', location: 'Hyderabad Innovation Center', employmentType: 'FULL_TIME', workMode: 'HYBRID', experience: '4–7 Years', openings: 1, salaryRange: '₹16,00,000 – ₹22,00,000', description: 'Manage CI/CD pipelines, Kubernetes clusters, and cloud security governance.', requirements: 'Hands-on AWS/GCP, Docker, Terraform, and monitoring tools (Prometheus, Grafana).', skills: ['DevOps', 'Kubernetes', 'Terraform', 'CI/CD', 'AWS'], status: 'PUBLISHED', companyId: this.COMPANY_ID, closingDate: '2026-11-15', createdBy: 'Vikram Sharma', createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    jobs.forEach(job => {
      const ref = db.collection('jobPositions').doc(job.id);
      batch.set(ref, job, { merge: true });
    });

    // Candidates in Kanban pipeline
    const candidates = [
      { id: 'CAND001', fullName: 'Rohan Sharma', email: 'rohan.sharma@gmail.com', phone: '+91 98111 22334', appliedRole: 'Senior React Developer', stage: 'APPLIED', experienceYears: 5, currentCompany: 'TCS', rating: 4, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'CAND002', fullName: 'Aditi Sen', email: 'aditi.sen@outlook.com', phone: '+91 98222 33445', appliedRole: 'Senior React Developer', stage: 'SCREENING', experienceYears: 6, currentCompany: 'Infosys', rating: 4, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'CAND003', fullName: 'Manas Verma', email: 'manas.v@gmail.com', phone: '+91 98333 44556', appliedRole: 'DevOps & Cloud Engineer', stage: 'SHORTLISTED', experienceYears: 4, currentCompany: 'Wipro', rating: 5, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'CAND004', fullName: 'Priya Sundaram', email: 'priya.sundaram@yahoo.com', phone: '+91 98444 55667', appliedRole: 'HR Business Partner', stage: 'INTERVIEW', experienceYears: 7, currentCompany: 'Accenture', rating: 5, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'CAND005', fullName: 'Nikhil Kulkarni', email: 'nikhil.k@gmail.com', phone: '+91 98555 66778', appliedRole: 'Senior React Developer', stage: 'SELECTED', experienceYears: 5, currentCompany: 'Cognizant', rating: 4, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'CAND006', fullName: 'Sunita Rao', email: 'sunita.rao@hotmail.com', phone: '+91 98666 77889', appliedRole: 'Financial Analyst', stage: 'OFFER', experienceYears: 4, currentCompany: 'Deloitte', rating: 5, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    candidates.forEach(c => {
      const ref = db.collection('candidates').doc(c.id);
      batch.set(ref, c, { merge: true });
    });

    // Job Applications linking Candidates to Positions across Kanban Stages
    const applications = [
      { id: 'APP001', candidateId: 'CAND001', candidateName: 'Rohan Sharma', candidateEmail: 'rohan.sharma@gmail.com', jobId: 'JOB001', jobTitle: 'Senior React Developer', department: 'Engineering & Technology', currentStage: 'APPLIED', source: 'LINKEDIN', appliedAt: '2026-09-10T10:30:00.000Z', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'APP002', candidateId: 'CAND002', candidateName: 'Aditi Sen', candidateEmail: 'aditi.sen@outlook.com', jobId: 'JOB001', jobTitle: 'Senior React Developer', department: 'Engineering & Technology', currentStage: 'SCREENING', source: 'NAUKRI', appliedAt: '2026-09-08T14:15:00.000Z', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'APP003', candidateId: 'CAND003', candidateName: 'Manas Verma', candidateEmail: 'manas.v@gmail.com', jobId: 'JOB004', jobTitle: 'DevOps & Cloud Engineer', department: 'Engineering & Technology', currentStage: 'SHORTLISTED', source: 'REFERRAL', appliedAt: '2026-09-05T09:00:00.000Z', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'APP004', candidateId: 'CAND004', candidateName: 'Priya Sundaram', candidateEmail: 'priya.sundaram@yahoo.com', jobId: 'JOB002', jobTitle: 'HR Business Partner', department: 'Human Resources', currentStage: 'INTERVIEW', source: 'CAREER_PAGE', appliedAt: '2026-09-02T11:45:00.000Z', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'APP005', candidateId: 'CAND005', candidateName: 'Nikhil Kulkarni', candidateEmail: 'nikhil.k@gmail.com', jobId: 'JOB001', jobTitle: 'Senior React Developer', department: 'Engineering & Technology', currentStage: 'SELECTED', source: 'LINKEDIN', appliedAt: '2026-08-28T16:20:00.000Z', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'APP006', candidateId: 'CAND006', candidateName: 'Sunita Rao', candidateEmail: 'sunita.rao@hotmail.com', jobId: 'JOB003', jobTitle: 'Financial Analyst', department: 'Finance, Accounts & Taxation', currentStage: 'OFFER', source: 'DIRECT', appliedAt: '2026-08-25T13:10:00.000Z', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    applications.forEach(app => {
      const ref = db.collection('jobApplications').doc(app.id);
      batch.set(ref, app, { merge: true });
    });

    // Scheduled Interviews
    const interviews = [
      { id: 'INT001', candidateId: 'CAND004', candidateName: 'Priya Sundaram', roleTitle: 'HR Business Partner', roundName: 'Round 1: HR & Culture Fit', interviewMode: 'GOOGLE_MEET', scheduledDate: '2026-09-22', scheduledTime: '11:00 AM', meetingLink: 'https://meet.google.com/xyz-diallo-hr', interviewers: ['Priya Nair'], status: 'SCHEDULED', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'INT002', candidateId: 'CAND002', candidateName: 'Aditi Sen', roleTitle: 'Senior React Developer', roundName: 'Round 2: Technical Architecture', interviewMode: 'GOOGLE_MEET', scheduledDate: '2026-09-23', scheduledTime: '03:00 PM', meetingLink: 'https://meet.google.com/abc-diallo-tech', interviewers: ['Vikram Sharma', 'Arjun Patel'], status: 'SCHEDULED', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    interviews.forEach(int => {
      const ref = db.collection('interviews').doc(int.id);
      batch.set(ref, int, { merge: true });
    });

    // Job Offers
    const offers = [
      { id: 'OFF001', applicationId: 'APP006', candidateId: 'CAND006', candidateName: 'Sunita Rao', candidateEmail: 'sunita.rao@hotmail.com', positionTitle: 'Financial Analyst', department: 'Finance, Accounts & Taxation', branch: 'HQ - Mumbai', annualCtc: 1100000, monthlyGross: 91667, joiningDate: '2026-11-01', offerDate: '2026-09-15', expiryDate: '2026-10-05', status: 'PENDING_APPROVAL', companyId: this.COMPANY_ID, createdBy: 'Rahul Mehta', createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    offers.forEach(o => {
      const ref = db.collection('jobOffers').doc(o.id);
      batch.set(ref, o, { merge: true });
    });

    await batch.commit();
  },

  // 10. PERFORMANCE & OKR GOALS
  async seedPerformance() {
    const batch = db.batch();

    // Active Annual Review Cycle
    const cycleRef = db.collection('performanceCycles').doc('cycle_2026_annual');
    batch.set(cycleRef, {
      id: 'cycle_2026_annual',
      name: '2026 Annual Performance Review',
      type: 'ANNUAL',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      goalStartDate: '2026-01-01',
      goalEndDate: '2026-12-31',
      selfReviewStart: '2026-11-01',
      selfReviewEnd: '2026-11-30',
      managerReviewStart: '2026-12-01',
      managerReviewEnd: '2026-12-20',
      companyId: this.COMPANY_ID,
      status: 'ACTIVE',
      createdBy: 'Priya Nair',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const goals = [
      { id: 'GOAL001', employeeId: 'EMP000', title: 'Deliver Antigravity Modern HRMS Architecture', category: 'FUNCTIONAL', priority: 'CRITICAL', weight: 40, target: '100%', progress: 95, status: 'IN_PROGRESS', companyId: this.COMPANY_ID },
      { id: 'GOAL002', employeeId: 'EMP000', title: 'Complete Indian Tax & EPF/ESIC Auto-Compliance Engine', category: 'BUSINESS', priority: 'HIGH', weight: 30, target: '100%', progress: 90, status: 'IN_PROGRESS', companyId: this.COMPANY_ID },
      { id: 'GOAL003', employeeId: 'EMP005', title: 'Refactor Core Microservices to Reduce Latency by 30%', category: 'FUNCTIONAL', priority: 'HIGH', weight: 35, target: '30%', progress: 25, status: 'IN_PROGRESS', companyId: this.COMPANY_ID },
      { id: 'GOAL004', employeeId: 'EMP002', title: 'Achieve 98% On-Time Payroll and Zero Tax Disputes', category: 'OPERATIONAL', priority: 'CRITICAL', weight: 50, target: '98%', progress: 98, status: 'COMPLETED', companyId: this.COMPANY_ID }
    ];

    goals.forEach(g => {
      const ref = db.collection('performanceGoals').doc(g.id);
      batch.set(ref, {
        ...g,
        cycleId: 'cycle_2026_annual',
        dueDate: '2026-12-31',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    // 1-on-1 coaching sessions (queries oneOnOneMeetings collection)
    const meetings = [
      { id: 'MTG001', employeeId: 'EMP000', employeeName: 'Ayan Chougle', managerName: 'Vikram Sharma', date: '2026-09-20', time: '04:00 PM', agenda: 'Q3 Architectural Milestones & Career Roadmap', status: 'SCHEDULED', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'MTG002', employeeId: 'EMP005', employeeName: 'Arjun Patel', managerName: 'Vikram Sharma', date: '2026-09-22', time: '02:30 PM', agenda: 'Sprint Velocity and Mentorship Review', status: 'SCHEDULED', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    meetings.forEach(m => {
      const ref = db.collection('oneOnOneMeetings').doc(m.id);
      batch.set(ref, m, { merge: true });
    });

    // Appraisal Recommendations
    const recs = [
      { id: 'REC001', employeeId: 'EMP000', employeeName: 'Ayan Chougle', currentDesignation: 'Principal Software Architect', recommendedDesignation: 'Chief Technology Architect', currentSalary: 2400000, incrementPercentage: 15, proposedSalary: 2760000, rating: 4.8, status: 'SUBMITTED', cycleId: 'cycle_2026_annual', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    recs.forEach(r => {
      const ref = db.collection('appraisalRecommendations').doc(r.id);
      batch.set(ref, r, { merge: true });
    });

    await batch.commit();
  },

  // 11. EMPLOYEE DOCUMENTS DOSSIER
  async seedDocuments() {
    const batch = db.batch();

    const docs = [
      { id: 'DOC001', employeeId: 'EMP000', employeeName: 'Ayan Chougle', name: 'Permanent Account Number (PAN Card)', documentType: 'PAN_CARD', categoryCode: 'IDENTITY', fileType: 'PDF', fileSize: '1.2 MB', status: 'ACTIVE', downloadUrl: 'https://images.unsplash.com/photo-1554415707-9e4c019fcaf4?w=500&auto=format&fit=crop', companyId: this.COMPANY_ID },
      { id: 'DOC002', employeeId: 'EMP000', employeeName: 'Ayan Chougle', name: 'Official Employment Agreement & Offer Letter', documentType: 'OFFER_LETTER', categoryCode: 'EMPLOYMENT', fileType: 'PDF', fileSize: '2.8 MB', status: 'ACTIVE', downloadUrl: 'https://images.unsplash.com/photo-1554415707-9e4c019fcaf4?w=500&auto=format&fit=crop', companyId: this.COMPANY_ID },
      { id: 'DOC003', employeeId: 'EMP000', employeeName: 'Ayan Chougle', name: 'Annual IT & Security Policy Acknowledgement', documentType: 'COMPLIANCE', categoryCode: 'COMPLIANCE', fileType: 'PDF', fileSize: '850 KB', status: 'ACTIVE', visibility: 'EMPLOYEE', expiryDate: '2027-01-15', downloadUrl: 'https://images.unsplash.com/photo-1554415707-9e4c019fcaf4?w=500&auto=format&fit=crop', companyId: this.COMPANY_ID },
      { id: 'DOC004', employeeId: 'EMP001', employeeName: 'Vikram Sharma', name: 'Executive Appointment Letter', documentType: 'OFFER_LETTER', categoryCode: 'EMPLOYMENT', fileType: 'PDF', fileSize: '3.1 MB', status: 'ACTIVE', downloadUrl: 'https://images.unsplash.com/photo-1554415707-9e4c019fcaf4?w=500&auto=format&fit=crop', companyId: this.COMPANY_ID },
      { id: 'DOC005', employeeId: 'ALL', employeeName: 'Company Wide', name: 'Diallo Group Employee Handbook & POSH Policy 2026', documentType: 'POLICY', categoryCode: 'COMPANY', fileType: 'PDF', fileSize: '4.2 MB', status: 'ACTIVE', visibility: 'ALL', downloadUrl: 'https://images.unsplash.com/photo-1554415707-9e4c019fcaf4?w=500&auto=format&fit=crop', companyId: this.COMPANY_ID }
    ];

    docs.forEach(d => {
      const ref = db.collection('employeeDocuments').doc(d.id);
      batch.set(ref, {
        ...d,
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
  },

  // 12. ANNOUNCEMENTS & NOTIFICATIONS
  async seedAnnouncements() {
    const batch = db.batch();

    const announcements = [
      { id: 'ANN001', title: 'Q3 Town Hall — Leadership Keynote on September 25th', content: 'Join Chief Executive Officer Mamadou Diallo and executive leadership for our Q3 corporate town hall meeting. We will discuss global performance milestones, customer acquisition, and upcoming technological innovations.', tag: 'Company', date: 'Sep 25, 2026', priority: 'high', status: 'PUBLISHED', companyId: this.COMPANY_ID },
      { id: 'ANN002', title: 'Diwali Festive Holiday & Bonus Disbursement Notice', content: 'In celebration of Diwali, offices across Mumbai, Bengaluru, Delhi, and Hyderabad will observe declared holidays. Festival performance incentives will disburse with the September payroll cycle.', tag: 'Holiday', date: 'Sep 20, 2026', priority: 'normal', status: 'PUBLISHED', companyId: this.COMPANY_ID },
      { id: 'ANN003', title: 'Annual Group Medical Insurance Policy Open Enrollment', content: 'Employees are invited to review and enhance their family floater coverage under our updated policy with Care Health Insurance. Submissions close on October 5th.', tag: 'Wellness', date: 'Sep 15, 2026', priority: 'normal', status: 'PUBLISHED', companyId: this.COMPANY_ID }
    ];

    announcements.forEach(a => {
      const ref = db.collection('announcements').doc(a.id);
      batch.set(ref, { ...a, createdAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });

    await batch.commit();
  },

  async seedNotifications() {
    const batch = db.batch();

    const notifications = [
      { id: 'NOTIF001', title: 'Leave Application Approved', message: 'Your Casual Leave application for Aug 10 has been approved by Vikram Sharma.', module: 'leave', priority: 'Normal', isRead: false, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'NOTIF002', title: 'August Payslip Disbursed', message: 'Your August 2026 monthly salary slip has been computed and credited.', module: 'payroll', priority: 'Normal', isRead: false, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'NOTIF003', title: 'Action Required: Performance Review', message: 'The H2 Annual Appraisal Cycle is open for self-assessment submission.', module: 'performance', priority: 'High', isRead: false, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'NOTIF004', title: 'Reimbursement Claim Settled', message: 'Claim EXP004 (Google Cloud Certification) of INR 8,900 has been settled.', module: 'expenses', priority: 'Normal', isRead: true, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    notifications.forEach(n => {
      const ref = db.collection('notifications').doc(n.id);
      batch.set(ref, n, { merge: true });
    });

    await batch.commit();
  },

  // 13. TRAINING, TRAINEES & TRAINERS (L&D)
  async seedTraining() {
    const batch = db.batch();

    // Trainers & Mentors
    const trainers = [
      { id: 'TRN001', fullName: 'Vikram Sharma', email: 'vikram.sharma@diallo.in', phone: '+91 98111 22334', trainerType: 'INTERNAL', designation: 'Lead Technical Architect & Mentor', specialization: 'Full-Stack JavaScript, Cloud Firestore & Microservices', batchesConducted: 18, activeTrainees: 3, rating: 4.9, bio: '14+ years building high-throughput distributed systems. Leads GET engineering cohorts.', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'TRN002', fullName: 'Priya Nair', email: 'priya.nair@diallo.in', phone: '+91 98222 33445', trainerType: 'INTERNAL', designation: 'Head of People & Culture', specialization: 'POSH Act 2013, DEI, Labor Laws & Workplace Ethics', batchesConducted: 24, activeTrainees: 1, rating: 4.8, bio: 'Champion of inclusive culture, leadership grooming, and compliance governance.', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'TRN003', fullName: 'Rahul Mehta', email: 'rahul.mehta@diallo.in', phone: '+91 98333 44556', trainerType: 'INTERNAL', designation: 'Finance Controller & Taxation Lead', specialization: 'Direct/Indirect Tax (GST), TDS Compliance & MIS Reporting', batchesConducted: 12, activeTrainees: 1, rating: 4.7, bio: 'Chartered Accountant guiding corporate finance apprentices and tax analysts.', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'TRN004', fullName: 'Dr. Arvind Swaminathan', email: 'arvind.s@cloudmentor.io', phone: '+91 98444 55667', trainerType: 'EXTERNAL', designation: 'Chief Cloud & DevOps Consultant', specialization: 'Kubernetes, AWS/GCP, Docker & Infrastructure as Code', batchesConducted: 8, activeTrainees: 1, rating: 5.0, bio: 'Industry speaker and consultant advising enterprises on site reliability and CI/CD.', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    trainers.forEach(tr => {
      const ref = db.collection('trainers').doc(tr.id);
      batch.set(ref, tr, { merge: true });
    });

    // Trainees & Interns
    const trainees = [
      { id: 'TRN_EMP001', fullName: 'Tanvi Joshi', email: 'tanvi.joshi@diallo.in', traineeCode: 'EMP-T01', department: 'Engineering & Technology', track: 'Graduate Engineering Trainee (GET)', trainerId: 'TRN001', trainerName: 'Vikram Sharma', batchName: 'GET Batch 2026-Q3', startDate: '2026-07-01', targetEndDate: '2026-10-31', progress: 75, completedModules: 4, totalModules: 5, status: 'IN_TRAINING', rating: 4.5, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'TRN_EMP002', fullName: 'Sameer Khan', email: 'sameer.khan@diallo.in', traineeCode: 'EMP-T02', department: 'Engineering & Technology', track: 'Graduate Engineering Trainee (GET)', trainerId: 'TRN001', trainerName: 'Vikram Sharma', batchName: 'GET Batch 2026-Q3', startDate: '2026-07-01', targetEndDate: '2026-10-31', progress: 60, completedModules: 3, totalModules: 5, status: 'IN_TRAINING', rating: 4.0, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'TRN_EMP003', fullName: 'Meera Deshmukh', email: 'meera.d@diallo.in', traineeCode: 'EMP-T03', department: 'Human Resources', track: 'HR Management Trainee (HRMT)', trainerId: 'TRN002', trainerName: 'Priya Nair', batchName: 'HRMT FastTrack 2026', startDate: '2026-06-01', targetEndDate: '2026-09-30', progress: 90, completedModules: 5, totalModules: 5, status: 'IN_EVALUATION', rating: 4.8, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'TRN_EMP004', fullName: 'Kunal Roy', email: 'kunal.roy@diallo.in', traineeCode: 'EMP-T04', department: 'Finance, Accounts & Taxation', track: 'Corporate Finance & Tax Apprentice', trainerId: 'TRN003', trainerName: 'Rahul Mehta', batchName: 'FinTax Apprentice Batch 2', startDate: '2026-08-01', targetEndDate: '2026-12-15', progress: 45, completedModules: 2, totalModules: 5, status: 'IN_TRAINING', rating: 4.2, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'TRN_EMP005', fullName: 'Ananya Iyer', email: 'ananya.iyer@diallo.in', traineeCode: 'EMP-T05', department: 'Operations & Logistics', track: 'Operations & Supply Chain Associate', trainerId: 'TRN004', trainerName: 'Dr. Arvind Swaminathan', batchName: 'Ops Excellence Batch 1', startDate: '2026-04-01', targetEndDate: '2026-08-31', progress: 100, completedModules: 5, totalModules: 5, status: 'CERTIFIED', certifiedDate: '2026-08-31', rating: 4.9, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'TRN_EMP006', fullName: 'Sahil Verma', email: 'sahil.v@diallo.in', traineeCode: 'EMP-T06', department: 'Engineering & Technology', track: 'Frontend Engineering Intern', trainerId: 'TRN001', trainerName: 'Vikram Sharma', batchName: 'GET Batch 2026-Q3', startDate: '2026-07-01', targetEndDate: '2026-10-31', progress: 80, completedModules: 4, totalModules: 5, status: 'IN_TRAINING', rating: 4.4, companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    trainees.forEach(t => {
      const ref = db.collection('trainees').doc(t.id);
      batch.set(ref, t, { merge: true });
    });

    // Training Programs
    const programs = [
      { id: 'PRG001', title: 'Graduate Engineering Trainee (GET) Program 2026', category: 'Technical Engineering', duration: '16 Weeks', mode: 'HYBRID', trainerName: 'Vikram Sharma', trainerId: 'TRN001', enrolledCount: 3, status: 'ACTIVE', modules: ['Modern JS & React Core', 'State Management & WebSockets', 'Cloud Firestore & Security Rules', 'RESTful Microservices & Testing', 'Production Capstone Evaluation'], description: 'Intensive engineering immersion covering full-stack architecture, clean code, and cloud databases.', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'PRG002', title: 'Workplace Ethics, POSH & Corporate Induction', category: 'Compliance & Culture', duration: '4 Weeks', mode: 'CLASSROOM', trainerName: 'Priya Nair', trainerId: 'TRN002', enrolledCount: 25, status: 'ACTIVE', modules: ['POSH Act 2013 Statutory Mandates', 'Diversity, Equity & Inclusion (DEI)', 'Data Privacy, NDA & Information Security', 'Grievance Redressal & Support Channels'], description: 'Mandatory statutory induction training for all new joinees and management trainees.', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'PRG003', title: 'Indian Taxation, TDS & Corporate Accounts', category: 'Finance & Taxation', duration: '8 Weeks', mode: 'CLASSROOM', trainerName: 'Rahul Mehta', trainerId: 'TRN003', enrolledCount: 2, status: 'ACTIVE', modules: ['Direct vs Indirect Tax Framework', 'TDS Withholding & Form 16 Generation', 'Monthly Payroll Reconciliation', 'Statutory Audit Readiness'], description: 'Comprehensive finance apprentice curriculum on tax laws and ledger audits.', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
      { id: 'PRG004', title: 'DevOps, Docker & Cloud Infrastructure', category: 'Cloud & DevOps', duration: '12 Weeks', mode: 'VIRTUAL', trainerName: 'Dr. Arvind Swaminathan', trainerId: 'TRN004', enrolledCount: 6, status: 'ACTIVE', modules: ['Docker Containerization Principles', 'Kubernetes Cluster Architecture', 'CI/CD Pipeline Automation with GitHub Actions', 'Infrastructure as Code (Terraform)'], description: 'Advanced cloud infrastructure and DevOps practices for site reliability and automated deployments.', companyId: this.COMPANY_ID, createdAt: firebase.firestore.FieldValue.serverTimestamp() }
    ];

    programs.forEach(p => {
      const ref = db.collection('trainingPrograms').doc(p.id);
      batch.set(ref, p, { merge: true });
    });

    await batch.commit();
  }
};

window.seedService = seedService;
