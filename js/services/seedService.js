/**
 * DIALLO HRMS — FIREBASE DATABASE SEED & BOOTSTRAP SERVICE
 * Automatically populates initial Indian corporate structure, roles, permissions,
 * and realistic demo workforce data on first run
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
    await this.seedCoreStructure();
    await this.seedEmployees();
    await this.seedAttendance();
    await this.seedLeaveRecords();
    await this.seedAnnouncements();
    await this.seedExpenses();
    await this.seedAssets();
    await this.seedPerformance();
    await this.seedRecruitment();
    console.log('✓ All demo data seeded successfully.');
  },

  async seedCoreStructure() {
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
        permissions: ['people.*', 'attendance.*', 'leave.*', 'payroll.*', 'reports.*', 'admin.view', 'admin.manage', 'communication.*', 'settings.manage', 'users.manage', 'companies.manage'],
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
        permissions: ['ess.view', 'leave.create', 'attendance.punch', 'own.profile'],
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

    // 2. Default Indian Legal Entity
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

    // 4. Departments
    const departments = [
      { id: 'dept_eng', name: 'Engineering & Technology', code: 'ENG', head: 'Vikram Sharma', members: 12, budget: '₹45,00,000' },
      { id: 'dept_hr', name: 'Human Resources', code: 'HRD', head: 'Priya Nair', members: 4, budget: '₹12,00,000' },
      { id: 'dept_fin', name: 'Finance, Accounts & Taxation', code: 'FIN', head: 'Rahul Mehta', members: 5, budget: '₹18,00,000' },
      { id: 'dept_ops', name: 'Operations & Logistics', code: 'OPS', head: 'Suresh Reddy', members: 6, budget: '₹22,00,000' },
      { id: 'dept_sales', name: 'Sales & Marketing', code: 'MKT', head: 'Ananya Gupta', members: 8, budget: '₹30,00,000' },
      { id: 'dept_legal', name: 'Legal & Secretarial Compliance', code: 'LGL', head: 'Deepika Joshi', members: 3, budget: '₹8,00,000' },
      { id: 'dept_design', name: 'Digital & Design', code: 'DGN', head: 'Karan Malhotra', members: 5, budget: '₹15,00,000' }
    ];

    departments.forEach(d => {
      const ref = db.collection('departments').doc(d.id);
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

    // 6. Designations
    const designations = [
      { id: 'desg_ceo', title: 'Chief Executive Officer', level: 'C-Suite', grade: 'L10' },
      { id: 'desg_cto', title: 'Chief Technology Officer', level: 'C-Suite', grade: 'L10' },
      { id: 'desg_vp', title: 'Vice President', level: 'Executive', grade: 'L9' },
      { id: 'desg_dir', title: 'Director', level: 'Senior Management', grade: 'L8' },
      { id: 'desg_sm', title: 'Senior Manager', level: 'Management', grade: 'L7' },
      { id: 'desg_mgr', title: 'Manager', level: 'Management', grade: 'L6' },
      { id: 'desg_tl', title: 'Team Lead', level: 'Mid-Level', grade: 'L5' },
      { id: 'desg_sse', title: 'Senior Software Engineer', level: 'Mid-Level', grade: 'L4' },
      { id: 'desg_se', title: 'Software Engineer', level: 'Entry', grade: 'L3' },
      { id: 'desg_je', title: 'Junior Engineer', level: 'Entry', grade: 'L2' },
      { id: 'desg_intern', title: 'Intern', level: 'Trainee', grade: 'L1' },
      { id: 'desg_hr_mgr', title: 'HR Manager', level: 'Management', grade: 'L6' },
      { id: 'desg_hr_exec', title: 'HR Executive', level: 'Entry', grade: 'L3' },
      { id: 'desg_acct', title: 'Accountant', level: 'Entry', grade: 'L3' },
      { id: 'desg_sr_acct', title: 'Senior Accountant', level: 'Mid-Level', grade: 'L5' },
      { id: 'desg_designer', title: 'UI/UX Designer', level: 'Mid-Level', grade: 'L4' },
      { id: 'desg_mkt_exec', title: 'Marketing Executive', level: 'Entry', grade: 'L3' },
      { id: 'desg_sales_mgr', title: 'Sales Manager', level: 'Management', grade: 'L6' }
    ];

    designations.forEach(d => {
      const ref = db.collection('designations').doc(d.id);
      batch.set(ref, {
        ...d,
        companyId: 'comp_diallo_india',
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  },

  // Seed 25 realistic Indian employees
  async seedEmployees() {
    const batch = db.batch();
    const now = new Date();

    const employees = [
      { id: 'EMP001', firstName: 'Vikram', lastName: 'Sharma', email: 'vikram.sharma@diallo.com', department: 'Engineering & Technology', designation: 'Chief Technology Officer', branch: 'HQ - Mumbai', phone: '+91 98200 12345', gender: 'Male', dob: '1982-04-15', joinDate: '2020-01-10', salary: 3200000, type: 'Permanent', manager: null, status: 'ACTIVE' },
      { id: 'EMP002', firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@diallo.com', department: 'Human Resources', designation: 'HR Manager', branch: 'HQ - Mumbai', phone: '+91 98200 12346', gender: 'Female', dob: '1988-07-22', joinDate: '2020-03-01', salary: 1800000, type: 'Permanent', manager: null, status: 'ACTIVE' },
      { id: 'EMP003', firstName: 'Rahul', lastName: 'Mehta', email: 'rahul.mehta@diallo.com', department: 'Finance, Accounts & Taxation', designation: 'Senior Accountant', branch: 'HQ - Mumbai', phone: '+91 98200 12347', gender: 'Male', dob: '1985-11-05', joinDate: '2020-06-15', salary: 1500000, type: 'Permanent', manager: null, status: 'ACTIVE' },
      { id: 'EMP004', firstName: 'Ananya', lastName: 'Gupta', email: 'ananya.gupta@diallo.com', department: 'Sales & Marketing', designation: 'Sales Manager', branch: 'Delhi NCR Office', phone: '+91 98200 12348', gender: 'Female', dob: '1990-02-18', joinDate: '2021-01-08', salary: 1600000, type: 'Permanent', manager: null, status: 'ACTIVE' },
      { id: 'EMP005', firstName: 'Arjun', lastName: 'Patel', email: 'arjun.patel@diallo.com', department: 'Engineering & Technology', designation: 'Senior Software Engineer', branch: 'Bengaluru Tech Hub', phone: '+91 98200 12349', gender: 'Male', dob: '1992-09-30', joinDate: '2021-04-12', salary: 1400000, type: 'Permanent', manager: 'EMP001', status: 'ACTIVE' },
      { id: 'EMP006', firstName: 'Sneha', lastName: 'Desai', email: 'sneha.desai@diallo.com', department: 'Engineering & Technology', designation: 'Software Engineer', branch: 'Bengaluru Tech Hub', phone: '+91 98200 12350', gender: 'Female', dob: '1994-06-14', joinDate: '2021-07-01', salary: 1100000, type: 'Permanent', manager: 'EMP005', status: 'ACTIVE' },
      { id: 'EMP007', firstName: 'Karan', lastName: 'Malhotra', email: 'karan.malhotra@diallo.com', department: 'Digital & Design', designation: 'UI/UX Designer', branch: 'HQ - Mumbai', phone: '+91 98200 12351', gender: 'Male', dob: '1993-01-25', joinDate: '2021-09-15', salary: 1200000, type: 'Permanent', manager: null, status: 'ACTIVE' },
      { id: 'EMP008', firstName: 'Deepika', lastName: 'Joshi', email: 'deepika.joshi@diallo.com', department: 'Legal & Secretarial Compliance', designation: 'Manager', branch: 'HQ - Mumbai', phone: '+91 98200 12352', gender: 'Female', dob: '1986-08-09', joinDate: '2020-11-01', salary: 2000000, type: 'Permanent', manager: null, status: 'ACTIVE' },
      { id: 'EMP009', firstName: 'Suresh', lastName: 'Reddy', email: 'suresh.reddy@diallo.com', department: 'Operations & Logistics', designation: 'Senior Manager', branch: 'Hyderabad Innovation Center', phone: '+91 98200 12353', gender: 'Male', dob: '1984-12-03', joinDate: '2020-02-20', salary: 1900000, type: 'Permanent', manager: null, status: 'ACTIVE' },
      { id: 'EMP010', firstName: 'Meera', lastName: 'Iyer', email: 'meera.iyer@diallo.com', department: 'Human Resources', designation: 'HR Executive', branch: 'Bengaluru Tech Hub', phone: '+91 98200 12354', gender: 'Female', dob: '1995-03-28', joinDate: '2022-01-10', salary: 750000, type: 'Permanent', manager: 'EMP002', status: 'ACTIVE' },
      { id: 'EMP011', firstName: 'Amit', lastName: 'Kumar', email: 'amit.kumar@diallo.com', department: 'Engineering & Technology', designation: 'Team Lead', branch: 'Bengaluru Tech Hub', phone: '+91 98200 12355', gender: 'Male', dob: '1991-05-12', joinDate: '2021-03-05', salary: 1600000, type: 'Permanent', manager: 'EMP001', status: 'ACTIVE' },
      { id: 'EMP012', firstName: 'Roshni', lastName: 'Chatterjee', email: 'roshni.chatterjee@diallo.com', department: 'Sales & Marketing', designation: 'Marketing Executive', branch: 'Delhi NCR Office', phone: '+91 98200 12356', gender: 'Female', dob: '1996-10-07', joinDate: '2022-06-01', salary: 650000, type: 'Permanent', manager: 'EMP004', status: 'ACTIVE' },
      { id: 'EMP013', firstName: 'Naveen', lastName: 'Singh', email: 'naveen.singh@diallo.com', department: 'Operations & Logistics', designation: 'Team Lead', branch: 'Delhi NCR Office', phone: '+91 98200 12357', gender: 'Male', dob: '1989-07-19', joinDate: '2021-11-15', salary: 1300000, type: 'Permanent', manager: 'EMP009', status: 'ACTIVE' },
      { id: 'EMP014', firstName: 'Pooja', lastName: 'Verma', email: 'pooja.verma@diallo.com', department: 'Finance, Accounts & Taxation', designation: 'Accountant', branch: 'HQ - Mumbai', phone: '+91 98200 12358', gender: 'Female', dob: '1993-09-02', joinDate: '2022-02-14', salary: 800000, type: 'Permanent', manager: 'EMP003', status: 'ACTIVE' },
      { id: 'EMP015', firstName: 'Rohit', lastName: 'Saxena', email: 'rohit.saxena@diallo.com', department: 'Engineering & Technology', designation: 'Software Engineer', branch: 'Hyderabad Innovation Center', phone: '+91 98200 12359', gender: 'Male', dob: '1995-01-11', joinDate: '2022-04-18', salary: 1000000, type: 'Permanent', manager: 'EMP011', status: 'ACTIVE' },
      { id: 'EMP016', firstName: 'Ishita', lastName: 'Bose', email: 'ishita.bose@diallo.com', department: 'Digital & Design', designation: 'UI/UX Designer', branch: 'HQ - Mumbai', phone: '+91 98200 12360', gender: 'Female', dob: '1997-04-30', joinDate: '2023-01-09', salary: 900000, type: 'Permanent', manager: 'EMP007', status: 'ACTIVE' },
      { id: 'EMP017', firstName: 'Aditya', lastName: 'Rao', email: 'aditya.rao@diallo.com', department: 'Engineering & Technology', designation: 'Senior Software Engineer', branch: 'Bengaluru Tech Hub', phone: '+91 98200 12361', gender: 'Male', dob: '1991-11-24', joinDate: '2021-08-02', salary: 1350000, type: 'Permanent', manager: 'EMP011', status: 'ACTIVE' },
      { id: 'EMP018', firstName: 'Kavya', lastName: 'Menon', email: 'kavya.menon@diallo.com', department: 'Human Resources', designation: 'HR Executive', branch: 'HQ - Mumbai', phone: '+91 98200 12362', gender: 'Female', dob: '1996-06-18', joinDate: '2023-03-01', salary: 700000, type: 'Permanent', manager: 'EMP002', status: 'ACTIVE' },
      { id: 'EMP019', firstName: 'Siddharth', lastName: 'Kapoor', email: 'siddharth.kapoor@diallo.com', department: 'Sales & Marketing', designation: 'Marketing Executive', branch: 'HQ - Mumbai', phone: '+91 98200 12363', gender: 'Male', dob: '1994-08-22', joinDate: '2022-09-12', salary: 750000, type: 'Permanent', manager: 'EMP004', status: 'ACTIVE' },
      { id: 'EMP020', firstName: 'Tanvi', lastName: 'Agarwal', email: 'tanvi.agarwal@diallo.com', department: 'Engineering & Technology', designation: 'Junior Engineer', branch: 'Bengaluru Tech Hub', phone: '+91 98200 12364', gender: 'Female', dob: '1999-02-08', joinDate: '2024-07-01', salary: 600000, type: 'Probation', manager: 'EMP005', status: 'ACTIVE' },
      { id: 'EMP021', firstName: 'Harsh', lastName: 'Trivedi', email: 'harsh.trivedi@diallo.com', department: 'Engineering & Technology', designation: 'Junior Engineer', branch: 'Hyderabad Innovation Center', phone: '+91 98200 12365', gender: 'Male', dob: '2000-05-16', joinDate: '2024-08-12', salary: 550000, type: 'Probation', manager: 'EMP011', status: 'ACTIVE' },
      { id: 'EMP022', firstName: 'Neha', lastName: 'Pillai', email: 'neha.pillai@diallo.com', department: 'Operations & Logistics', designation: 'Manager', branch: 'Bengaluru Tech Hub', phone: '+91 98200 12366', gender: 'Female', dob: '1988-10-14', joinDate: '2021-05-20', salary: 1500000, type: 'Permanent', manager: 'EMP009', status: 'ACTIVE' },
      { id: 'EMP023', firstName: 'Varun', lastName: 'Bhatt', email: 'varun.bhatt@diallo.com', department: 'Finance, Accounts & Taxation', designation: 'Accountant', branch: 'Delhi NCR Office', phone: '+91 98200 12367', gender: 'Male', dob: '1994-03-07', joinDate: '2023-02-06', salary: 850000, type: 'Permanent', manager: 'EMP003', status: 'ACTIVE' },
      { id: 'EMP024', firstName: 'Shreya', lastName: 'Das', email: 'shreya.das@diallo.com', department: 'Legal & Secretarial Compliance', designation: 'HR Executive', branch: 'HQ - Mumbai', phone: '+91 98200 12368', gender: 'Female', dob: '1995-12-29', joinDate: '2022-11-01', salary: 800000, type: 'Permanent', manager: 'EMP008', status: 'ACTIVE' },
      { id: 'EMP025', firstName: 'Rajesh', lastName: 'Khanna', email: 'rajesh.khanna@diallo.com', department: 'Engineering & Technology', designation: 'Intern', branch: 'Bengaluru Tech Hub', phone: '+91 98200 12369', gender: 'Male', dob: '2001-08-20', joinDate: '2024-09-01', salary: 300000, type: 'Probation', manager: 'EMP005', status: 'ACTIVE' }
    ];

    employees.forEach(emp => {
      const ref = db.collection('employees').doc(emp.id);
      batch.set(ref, {
        ...emp,
        companyId: 'comp_diallo_india',
        employmentType: emp.type,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  },

  // Seed today's attendance for most employees
  async seedAttendance() {
    const batch = db.batch();
    const today = new Date().toISOString().split('T')[0];

    const attendanceRecords = [
      { empId: 'EMP001', name: 'Vikram Sharma', status: 'present', checkIn: '08:55', checkOut: '18:30', type: 'office', onTime: true },
      { empId: 'EMP002', name: 'Priya Nair', status: 'present', checkIn: '09:02', checkOut: '18:15', type: 'office', onTime: true },
      { empId: 'EMP003', name: 'Rahul Mehta', status: 'present', checkIn: '09:10', checkOut: '18:00', type: 'office', onTime: true },
      { empId: 'EMP004', name: 'Ananya Gupta', status: 'present', checkIn: '09:30', checkOut: null, type: 'office', onTime: false },
      { empId: 'EMP005', name: 'Arjun Patel', status: 'present', checkIn: '08:45', checkOut: '18:45', type: 'office', onTime: true },
      { empId: 'EMP006', name: 'Sneha Desai', status: 'present', checkIn: '09:15', checkOut: null, type: 'wfh', onTime: true },
      { empId: 'EMP007', name: 'Karan Malhotra', status: 'present', checkIn: '09:05', checkOut: null, type: 'office', onTime: true },
      { empId: 'EMP008', name: 'Deepika Joshi', status: 'leave', checkIn: null, checkOut: null, type: null, onTime: false },
      { empId: 'EMP009', name: 'Suresh Reddy', status: 'present', checkIn: '08:50', checkOut: '18:20', type: 'office', onTime: true },
      { empId: 'EMP010', name: 'Meera Iyer', status: 'present', checkIn: '09:08', checkOut: null, type: 'office', onTime: true },
      { empId: 'EMP011', name: 'Amit Kumar', status: 'present', checkIn: '09:00', checkOut: null, type: 'wfh', onTime: true },
      { empId: 'EMP012', name: 'Roshni Chatterjee', status: 'present', checkIn: '09:45', checkOut: null, type: 'office', onTime: false },
      { empId: 'EMP013', name: 'Naveen Singh', status: 'present', checkIn: '08:58', checkOut: null, type: 'office', onTime: true },
      { empId: 'EMP014', name: 'Pooja Verma', status: 'leave', checkIn: null, checkOut: null, type: null, onTime: false },
      { empId: 'EMP015', name: 'Rohit Saxena', status: 'present', checkIn: '09:20', checkOut: null, type: 'wfh', onTime: true },
      { empId: 'EMP016', name: 'Ishita Bose', status: 'present', checkIn: '09:03', checkOut: null, type: 'office', onTime: true },
      { empId: 'EMP017', name: 'Aditya Rao', status: 'present', checkIn: '08:40', checkOut: null, type: 'office', onTime: true },
      { empId: 'EMP018', name: 'Kavya Menon', status: 'present', checkIn: '09:12', checkOut: null, type: 'office', onTime: true },
      { empId: 'EMP019', name: 'Siddharth Kapoor', status: 'present', checkIn: '09:35', checkOut: null, type: 'office', onTime: false },
      { empId: 'EMP020', name: 'Tanvi Agarwal', status: 'present', checkIn: '08:55', checkOut: null, type: 'office', onTime: true },
      { empId: 'EMP021', name: 'Harsh Trivedi', status: 'leave', checkIn: null, checkOut: null, type: null, onTime: false },
      { empId: 'EMP022', name: 'Neha Pillai', status: 'present', checkIn: '09:06', checkOut: null, type: 'office', onTime: true },
      { empId: 'EMP023', name: 'Varun Bhatt', status: 'present', checkIn: '09:00', checkOut: null, type: 'office', onTime: true },
      { empId: 'EMP024', name: 'Shreya Das', status: 'present', checkIn: '09:18', checkOut: null, type: 'wfh', onTime: true },
      { empId: 'EMP025', name: 'Rajesh Khanna', status: 'present', checkIn: '08:50', checkOut: null, type: 'office', onTime: true }
    ];

    attendanceRecords.forEach(rec => {
      const ref = db.collection('attendance').doc(`${rec.empId}_${today}`);
      batch.set(ref, {
        ...rec,
        date: today,
        companyId: 'comp_diallo_india',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  },

  // Seed leave requests (pending, approved, etc.)
  async seedLeaveRecords() {
    const batch = db.batch();

    const leaves = [
      { id: 'LV001', employeeId: 'EMP008', employee: 'Deepika Joshi', type: 'Casual Leave', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], days: 1, reason: 'Personal work', status: 'APPROVED', approvedBy: 'EMP002' },
      { id: 'LV002', employeeId: 'EMP014', employee: 'Pooja Verma', type: 'Sick Leave', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], days: 1, reason: 'Feeling unwell', status: 'APPROVED', approvedBy: 'EMP003' },
      { id: 'LV003', employeeId: 'EMP021', employee: 'Harsh Trivedi', type: 'Casual Leave', startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], days: 2, reason: 'Family function', status: 'APPROVED', approvedBy: 'EMP011' },
      { id: 'LV004', employeeId: 'EMP006', employee: 'Sneha Desai', type: 'Privilege Leave', startDate: new Date(Date.now() + 7*86400000).toISOString().split('T')[0], endDate: new Date(Date.now() + 11*86400000).toISOString().split('T')[0], days: 5, reason: 'Vacation trip to Goa', status: 'PENDING', approvedBy: null },
      { id: 'LV005', employeeId: 'EMP012', employee: 'Roshni Chatterjee', type: 'Casual Leave', startDate: new Date(Date.now() + 3*86400000).toISOString().split('T')[0], endDate: new Date(Date.now() + 3*86400000).toISOString().split('T')[0], days: 1, reason: 'Doctor appointment', status: 'PENDING', approvedBy: null },
      { id: 'LV006', employeeId: 'EMP017', employee: 'Aditya Rao', type: 'Sick Leave', startDate: new Date(Date.now() + 2*86400000).toISOString().split('T')[0], endDate: new Date(Date.now() + 4*86400000).toISOString().split('T')[0], days: 3, reason: 'Dental surgery recovery', status: 'PENDING', approvedBy: null }
    ];

    leaves.forEach(l => {
      const ref = db.collection('leaves').doc(l.id);
      batch.set(ref, {
        ...l,
        companyId: 'comp_diallo_india',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    // Also add pending approvals that appear in the Action Center
    const pendingApprovals = [
      { id: 'APR001', employee: 'Sneha Desai', employeeId: 'EMP006', type: 'Leave Request', detail: 'Privilege Leave — 5 days (Vacation)', status: 'PENDING' },
      { id: 'APR002', employee: 'Roshni Chatterjee', employeeId: 'EMP012', type: 'Leave Request', detail: 'Casual Leave — 1 day (Doctor visit)', status: 'PENDING' },
      { id: 'APR003', employee: 'Aditya Rao', employeeId: 'EMP017', type: 'Leave Request', detail: 'Sick Leave — 3 days (Dental surgery)', status: 'PENDING' },
      { id: 'APR004', employee: 'Rohit Saxena', employeeId: 'EMP015', type: 'Expense Claim', detail: '₹4,500 — Client lunch meeting (Aug 28)', status: 'PENDING' },
      { id: 'APR005', employee: 'Tanvi Agarwal', employeeId: 'EMP020', type: 'Regularization', detail: 'Missed punch — Aug 29 (forgot badge)', status: 'PENDING' }
    ];

    pendingApprovals.forEach(a => {
      const ref = db.collection('approvals').doc(a.id);
      batch.set(ref, {
        ...a,
        companyId: 'comp_diallo_india',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  },

  // Seed announcements
  async seedAnnouncements() {
    const batch = db.batch();

    const announcements = [
      { id: 'ANN001', title: 'Independence Day Celebration — Office Closed Aug 15', content: 'The office will remain closed on August 15th for Independence Day. A virtual flag hoisting ceremony will be held at 9:00 AM on Google Meet. All employees are invited to join.', tag: 'Holiday', date: '2026-08-12', priority: 'normal', status: 'PUBLISHED' },
      { id: 'ANN002', title: 'Q3 Town Hall — September 5th at 3:00 PM IST', content: 'Join CEO Mamadou Diallo and the leadership team for our Q3 2026 company-wide town hall. Topics include revenue update, new product roadmap, and upcoming hiring plans. Register on the intranet.', tag: 'Company', date: '2026-08-28', priority: 'high', status: 'PUBLISHED' },
      { id: 'ANN003', title: 'Updated Work-From-Home Policy — Effective September 1', content: 'Effective September 1, employees may work from home up to 2 days per week with manager approval. Please update your WFH schedule in the HRMS attendance module by August 30.', tag: 'Policy', date: '2026-08-25', priority: 'normal', status: 'PUBLISHED' },
      { id: 'ANN004', title: 'Annual Health Checkup Camp — September 10-12', content: 'Free comprehensive health checkups for all employees at the Mumbai, Bengaluru, and Delhi offices. Eye tests, blood work, and BMI assessments included. Book your slot on the ESS portal.', tag: 'Wellness', date: '2026-09-01', priority: 'normal', status: 'PUBLISHED' }
    ];

    announcements.forEach(a => {
      const ref = db.collection('announcements').doc(a.id);
      batch.set(ref, {
        ...a,
        companyId: 'comp_diallo_india',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  },

  // Seed expense claims
  async seedExpenses() {
    const batch = db.batch();

    const expenses = [
      { id: 'EXP001', employeeId: 'EMP015', employee: 'Rohit Saxena', category: 'Client Entertainment', amount: 4500, currency: 'INR', date: '2026-08-28', description: 'Client lunch meeting at Taj Lands End', status: 'PENDING', receipt: true },
      { id: 'EXP002', employeeId: 'EMP004', employee: 'Ananya Gupta', category: 'Travel', amount: 12800, currency: 'INR', date: '2026-08-20', description: 'Delhi to Mumbai flight — client presentation', status: 'APPROVED', receipt: true },
      { id: 'EXP003', employeeId: 'EMP013', employee: 'Naveen Singh', category: 'Office Supplies', amount: 2350, currency: 'INR', date: '2026-08-25', description: 'Printer cartridges and stationery for Delhi office', status: 'APPROVED', receipt: true },
      { id: 'EXP004', employeeId: 'EMP011', employee: 'Amit Kumar', category: 'Software License', amount: 15000, currency: 'INR', date: '2026-08-22', description: 'Annual JetBrains IDE license renewal', status: 'APPROVED', receipt: true },
      { id: 'EXP005', employeeId: 'EMP019', employee: 'Siddharth Kapoor', category: 'Marketing', amount: 8500, currency: 'INR', date: '2026-08-30', description: 'LinkedIn premium recruitment ad — Aug campaign', status: 'PENDING', receipt: true },
      { id: 'EXP006', employeeId: 'EMP012', employee: 'Roshni Chatterjee', category: 'Travel', amount: 3200, currency: 'INR', date: '2026-08-27', description: 'Cab to client site — Noida Sector 62', status: 'REIMBURSED', receipt: true }
    ];

    expenses.forEach(e => {
      const ref = db.collection('expenses').doc(e.id);
      batch.set(ref, {
        ...e,
        companyId: 'comp_diallo_india',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  },

  // Seed IT assets
  async seedAssets() {
    const batch = db.batch();

    const assets = [
      { id: 'AST001', name: 'MacBook Pro 14" M3', category: 'Laptop', serial: 'C02ZF1ABCDEF', assignedTo: 'EMP001', assignedName: 'Vikram Sharma', status: 'Assigned', purchaseDate: '2024-01-15', value: 225000 },
      { id: 'AST002', name: 'Dell XPS 15', category: 'Laptop', serial: 'CN-0AB12CD', assignedTo: 'EMP005', assignedName: 'Arjun Patel', status: 'Assigned', purchaseDate: '2024-03-10', value: 165000 },
      { id: 'AST003', name: 'iPhone 15 Pro', category: 'Mobile', serial: 'FFMP2ABCDEF', assignedTo: 'EMP002', assignedName: 'Priya Nair', status: 'Assigned', purchaseDate: '2024-06-01', value: 134900 },
      { id: 'AST004', name: 'Dell UltraSharp U2723QE 27"', category: 'Monitor', serial: 'DL-MON-4582', assignedTo: 'EMP017', assignedName: 'Aditya Rao', status: 'Assigned', purchaseDate: '2024-02-20', value: 45000 },
      { id: 'AST005', name: 'Logitech MX Master 3S', category: 'Peripheral', serial: 'LG-MX3S-1122', assignedTo: 'EMP007', assignedName: 'Karan Malhotra', status: 'Assigned', purchaseDate: '2024-04-15', value: 8500 },
      { id: 'AST006', name: 'ThinkPad X1 Carbon Gen 11', category: 'Laptop', serial: 'LN-X1C-9988', assignedTo: null, assignedName: null, status: 'Available', purchaseDate: '2024-07-01', value: 155000 },
      { id: 'AST007', name: 'Samsung Galaxy S24 Ultra', category: 'Mobile', serial: 'SM-S928B-5566', assignedTo: 'EMP004', assignedName: 'Ananya Gupta', status: 'Assigned', purchaseDate: '2024-05-10', value: 129999 },
      { id: 'AST008', name: 'HP LaserJet Pro MFP M428', category: 'Printer', serial: 'HP-LJ-3344', assignedTo: null, assignedName: null, status: 'Available', purchaseDate: '2023-11-20', value: 35000 }
    ];

    assets.forEach(a => {
      const ref = db.collection('assets').doc(a.id);
      batch.set(ref, {
        ...a,
        companyId: 'comp_diallo_india',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  },

  // Seed performance review data
  async seedPerformance() {
    const batch = db.batch();

    const reviews = [
      { id: 'PRF001', employeeId: 'EMP005', employee: 'Arjun Patel', reviewPeriod: 'H1 2026', overallRating: 4.5, selfRating: 4.2, managerRating: 4.5, status: 'COMPLETED', reviewer: 'Vikram Sharma', goals: 3, goalsCompleted: 3 },
      { id: 'PRF002', employeeId: 'EMP006', employee: 'Sneha Desai', reviewPeriod: 'H1 2026', overallRating: 4.0, selfRating: 3.8, managerRating: 4.0, status: 'COMPLETED', reviewer: 'Arjun Patel', goals: 4, goalsCompleted: 3 },
      { id: 'PRF003', employeeId: 'EMP011', employee: 'Amit Kumar', reviewPeriod: 'H1 2026', overallRating: 4.8, selfRating: 4.5, managerRating: 4.8, status: 'COMPLETED', reviewer: 'Vikram Sharma', goals: 5, goalsCompleted: 5 },
      { id: 'PRF004', employeeId: 'EMP012', employee: 'Roshni Chatterjee', reviewPeriod: 'H1 2026', overallRating: 3.5, selfRating: 3.8, managerRating: 3.5, status: 'COMPLETED', reviewer: 'Ananya Gupta', goals: 3, goalsCompleted: 2 },
      { id: 'PRF005', employeeId: 'EMP017', employee: 'Aditya Rao', reviewPeriod: 'H1 2026', overallRating: null, selfRating: 4.0, managerRating: null, status: 'IN_PROGRESS', reviewer: 'Amit Kumar', goals: 4, goalsCompleted: 3 },
      { id: 'PRF006', employeeId: 'EMP020', employee: 'Tanvi Agarwal', reviewPeriod: 'H1 2026', overallRating: null, selfRating: null, managerRating: null, status: 'NOT_STARTED', reviewer: 'Arjun Patel', goals: 2, goalsCompleted: 0 }
    ];

    reviews.forEach(r => {
      const ref = db.collection('performanceReviews').doc(r.id);
      batch.set(ref, {
        ...r,
        companyId: 'comp_diallo_india',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  },

  // Seed recruitment openings
  async seedRecruitment() {
    const batch = db.batch();

    const jobs = [
      { id: 'JOB001', title: 'Senior React Developer', department: 'Engineering & Technology', location: 'Bengaluru Tech Hub', type: 'Full-Time', experience: '5-8 years', salary: '₹18-25 LPA', status: 'OPEN', applicants: 24, shortlisted: 6, interviewed: 3, offered: 0, postedDate: '2026-08-10' },
      { id: 'JOB002', title: 'HR Business Partner', department: 'Human Resources', location: 'HQ - Mumbai', type: 'Full-Time', experience: '4-6 years', salary: '₹12-16 LPA', status: 'OPEN', applicants: 18, shortlisted: 5, interviewed: 2, offered: 1, postedDate: '2026-08-05' },
      { id: 'JOB003', title: 'Financial Analyst', department: 'Finance, Accounts & Taxation', location: 'Delhi NCR Office', type: 'Full-Time', experience: '2-4 years', salary: '₹8-12 LPA', status: 'OPEN', applicants: 32, shortlisted: 8, interviewed: 4, offered: 0, postedDate: '2026-08-15' },
      { id: 'JOB004', title: 'DevOps Engineer', department: 'Engineering & Technology', location: 'Hyderabad Innovation Center', type: 'Full-Time', experience: '3-5 years', salary: '₹14-20 LPA', status: 'OPEN', applicants: 15, shortlisted: 4, interviewed: 1, offered: 0, postedDate: '2026-08-20' },
      { id: 'JOB005', title: 'Content Marketing Specialist', department: 'Sales & Marketing', location: 'HQ - Mumbai', type: 'Full-Time', experience: '2-3 years', salary: '₹6-9 LPA', status: 'CLOSED', applicants: 42, shortlisted: 10, interviewed: 5, offered: 1, postedDate: '2026-07-15' },
      { id: 'JOB006', title: 'UI/UX Design Intern', department: 'Digital & Design', location: 'HQ - Mumbai', type: 'Internship', experience: '0-1 years', salary: '₹20,000/month', status: 'OPEN', applicants: 55, shortlisted: 12, interviewed: 0, offered: 0, postedDate: '2026-08-25' }
    ];

    jobs.forEach(j => {
      const ref = db.collection('jobs').doc(j.id);
      batch.set(ref, {
        ...j,
        companyId: 'comp_diallo_india',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  }
};

window.seedService = seedService;
