/**
 * DIALLO HRMS — CREATE EMPLOYEE LOGIN & ONBOARDING VIEW
 * Accessible to Super Admin, HR Managers, and Training Mentors.
 * Provisions real accounts into Firebase Auth & Firestore using a non-disruptive secondary app instance.
 */

const CreateEmployeeView = {
  async render() {
    const userRole = (AuthGuard.userProfile?.roleId || '').toUpperCase().trim();
    const isAuthorized = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'COMPANY_ADMIN' || userRole.includes('HR') || userRole.includes('TRAIN');

    if (!isAuthorized) {
      return `
        <div class="card p-6 text-center" style="max-width: 600px; margin: 40px auto;">
          <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Access Restricted</h2>
          <p style="color: var(--text-secondary); margin-bottom: 20px;">Creating employee and trainee accounts is restricted to Super Admin, HR, and Training Mentors.</p>
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('dashboard')">Return to Dashboard</button>
        </div>
      `;
    }

    const officialDepartments = [
      'Digital Team',
      'Operations',
      'Sales',
      'Real Estate',
      'Car Rental',
      'Compliance',
      'Training',
      'Human Resources'
    ];

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <a href="#people">Employees</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Create Employee Login</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Create Employee & Trainee Login</h1>
            <p class="page-subtitle">Provision official accounts with Firebase Auth credentials, designated roles, and 8 standardized departments</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="Router.navigate('people')">
              <span>View Employee Directory</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Creation Form Card -->
      <div class="card animate-fade-in" style="max-width: 900px; margin: 0 auto 32px;">
        <div class="card-header">
          <div class="flex items-center gap-3">
            <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center;">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <div class="card-title">New User Onboarding Form</div>
              <div class="card-subtitle">Official shift: 10:00 AM – 07:00 PM (8h Work • 1h Break • 10m Grace) • Ghansoli Mahape</div>
            </div>
          </div>
        </div>

        <div class="card-body">
          <form id="create-employee-form" onsubmit="CreateEmployeeView.handleSubmit(event)">
            
            <!-- Section 1: Personal Details -->
            <div style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--primary); letter-spacing: 0.05em; margin-bottom: 14px;">
              1. Personal Details
            </div>
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
              <div class="form-group">
                <label class="form-label required">First Name</label>
                <input type="text" id="new-emp-firstname" class="form-control" placeholder="e.g. Rahul" required />
              </div>
              <div class="form-group">
                <label class="form-label required">Last Name</label>
                <input type="text" id="new-emp-lastname" class="form-control" placeholder="e.g. Sharma" required />
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" id="new-emp-phone" class="form-control" placeholder="+91 98765 43210" />
              </div>
            </div>

            <!-- Section 2: Account & Security -->
            <div style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--primary); letter-spacing: 0.05em; margin-bottom: 14px;">
              2. Login Credentials & Security
            </div>
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
              <div class="form-group">
                <label class="form-label required">Official Email Address</label>
                <input type="email" id="new-emp-email" class="form-control" placeholder="username@diallo.in" required />
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">This email will be used for sign-in authentication.</div>
              </div>
              <div class="form-group">
                <div class="flex items-center justify-between" style="margin-bottom: 4px;">
                  <label class="form-label required" style="margin-bottom: 0;">Initial Password</label>
                  <button type="button" class="btn btn-ghost btn-sm" onclick="CreateEmployeeView.generatePassword()" style="font-size: 0.72rem; padding: 2px 6px;">Auto Generate</button>
                </div>
                <div class="password-input-wrapper">
                  <input type="text" id="new-emp-password" class="form-control" placeholder="Minimum 6 characters" minlength="6" required value="Diallo@2026" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label required">Designated System Role</label>
                <select id="new-emp-role" class="form-control" required onchange="CreateEmployeeView.handleRoleChange(this.value)">
                  <option value="TRAINEE" selected>Graduate Trainee (7-Day Modules)</option>
                  <option value="EMPLOYEE">Employee (General Staff ESS)</option>
                  <option value="TRAINER">Corporate Trainer (Mentor)</option>
                  <option value="HR">HR Manager</option>
                </select>
              </div>
            </div>

            <!-- Section 3: Organization & Role Alignment -->
            <div style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--primary); letter-spacing: 0.05em; margin-bottom: 14px;">
              3. Organization & Policy Alignment
            </div>
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
              <div class="form-group">
                <label class="form-label required">Standard Department</label>
                <select id="new-emp-department" class="form-control" required>
                  ${officialDepartments.map(dept => `<option value="${dept}">${dept}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">Designation / Title</label>
                <input type="text" id="new-emp-designation" class="form-control" placeholder="e.g. Graduate Trainee / Executive" required value="Graduate Trainee" />
              </div>
              <div class="form-group">
                <label class="form-label">Assigned Mentor / Reporting Manager</label>
                <input type="text" id="new-emp-mentor" class="form-control" placeholder="e.g. Vikram Sharma (Trainer)" />
              </div>
              <div class="form-group">
                <label class="form-label required">Date of Joining</label>
                <input type="date" id="new-emp-doj" class="form-control" required value="${new Date().toISOString().split('T')[0]}" />
              </div>
              <div class="form-group">
                <label class="form-label">Office Location</label>
                <input type="text" class="form-control" value="Ghansoli Mahape, Navi Mumbai" readonly disabled style="background: var(--bg-hover);" />
              </div>
              <div class="form-group">
                <label class="form-label">Shift Timing Policy</label>
                <input type="text" class="form-control" value="10:00 AM – 07:00 PM (8h Work • 1h Break)" readonly disabled style="background: var(--bg-hover);" />
              </div>
            </div>

            <!-- Trainee Specific Banner -->
            <div id="trainee-notice-box" style="padding: 14px 16px; background: rgba(37, 99, 235, 0.08); border: 1px solid var(--primary-border); border-radius: var(--radius-md); margin-bottom: 24px;">
              <div class="flex items-center gap-2" style="font-weight: 700; color: var(--primary); font-size: 0.88rem; margin-bottom: 4px;">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>7-Day Training Curriculum Auto-Enrollment</span>
              </div>
              <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
                This account will be automatically enrolled on <strong>Day 1: Introduction, Trade Types, Market, What is Cryptocurrency</strong>. The Trainee will have restricted access strictly to Training Modules, Assigned Mentor Contact, Master HR Policies, and Attendance Punches.
              </div>
            </div>

            <div class="flex items-center justify-end gap-3" style="padding-top: 16px; border-top: 1px solid var(--border-main);">
              <button type="button" class="btn btn-secondary btn-lg" onclick="Router.navigate('people')">Cancel</button>
              <button type="submit" id="create-emp-submit-btn" class="btn btn-primary btn-lg">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Create Login Account</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Success Credentials Modal Container -->
      <div id="credentials-success-modal" style="display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 9999; align-items: center; justify-content: center; padding: 20px;">
        <div class="card animate-fade-in" style="max-width: 500px; width: 100%; padding: 24px; box-shadow: var(--shadow-xl); border: 2px solid var(--primary);">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--success-light); color: var(--success); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style="font-size: 1.3rem; font-weight: 700; text-align: center; color: var(--text-main); margin-bottom: 6px;">Login Account Created Successfully!</h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary); text-align: center; margin-bottom: 20px;">Copy and securely share these credentials with the employee/trainee.</p>
          
          <div style="background: var(--bg-hover); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-main); margin-bottom: 20px; font-size: 0.88rem;">
            <div class="flex justify-between py-1" style="border-bottom: 1px solid var(--border-light);">
              <span class="text-muted">Full Name:</span>
              <strong id="cred-name" class="text-main"></strong>
            </div>
            <div class="flex justify-between py-1" style="border-bottom: 1px solid var(--border-light);">
              <span class="text-muted">Official Email:</span>
              <strong id="cred-email" class="text-main" style="font-family: monospace;"></strong>
            </div>
            <div class="flex justify-between py-1" style="border-bottom: 1px solid var(--border-light);">
              <span class="text-muted">Password:</span>
              <strong id="cred-pass" class="text-primary" style="font-family: monospace;"></strong>
            </div>
            <div class="flex justify-between py-1" style="border-bottom: 1px solid var(--border-light);">
              <span class="text-muted">Assigned Role:</span>
              <strong id="cred-role" class="text-main"></strong>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-muted">Department:</span>
              <strong id="cred-dept" class="text-main"></strong>
            </div>
          </div>

          <div class="flex gap-3">
            <button type="button" class="btn btn-secondary flex-1" onclick="CreateEmployeeView.closeModal()">Close</button>
            <button type="button" class="btn btn-primary flex-1" onclick="CreateEmployeeView.copyCredentials()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copy Credentials</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  handleRoleChange(role) {
    const notice = document.getElementById('trainee-notice-box');
    const desigInput = document.getElementById('new-emp-designation');
    if (role === 'TRAINEE') {
      if (notice) notice.style.display = 'block';
      if (desigInput && (!desigInput.value || desigInput.value.includes('Executive'))) desigInput.value = 'Graduate Trainee';
    } else {
      if (notice) notice.style.display = 'none';
      if (desigInput && desigInput.value === 'Graduate Trainee') desigInput.value = 'Associate';
    }
  },

  generatePassword() {
    const pass = 'Diallo@' + Math.floor(1000 + Math.random() * 9000);
    const passInput = document.getElementById('new-emp-password');
    if (passInput) passInput.value = pass;
    Toast.info(`Generated password: ${pass}`);
  },

  async handleSubmit(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('create-emp-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Creating Account in Firebase...</span>';
    }

    const firstName = document.getElementById('new-emp-firstname').value.trim();
    const lastName = document.getElementById('new-emp-lastname').value.trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const email = document.getElementById('new-emp-email').value.trim().toLowerCase();
    const password = document.getElementById('new-emp-password').value;
    const phone = document.getElementById('new-emp-phone').value.trim();
    const roleId = document.getElementById('new-emp-role').value;
    const department = document.getElementById('new-emp-department').value;
    const designation = document.getElementById('new-emp-designation').value.trim();
    const mentor = document.getElementById('new-emp-mentor').value.trim();
    const dateOfJoining = document.getElementById('new-emp-doj').value;

    let secondaryApp = null;
    try {
      // 1. Provision Firebase Auth User using a secondary Firebase App instance
      // This prevents the current logged-in HR / Mentor session from being logged out!
      const appName = `AccountCreation_${Date.now()}`;
      secondaryApp = firebase.initializeApp(firebaseConfig, appName);
      const secondaryAuth = secondaryApp.auth();

      const userCred = await secondaryAuth.createUserWithEmailAndPassword(email, password);
      const uid = userCred.user.uid;

      // Update Auth Profile Display Name
      await userCred.user.updateProfile({ displayName: fullName });

      // Generate Clean Employee Code
      const empCode = 'EMP-' + Math.floor(100 + Math.random() * 900);

      // 2. Write to Firestore 'users' collection
      const userDoc = {
        uid,
        email,
        displayName: fullName,
        firstName,
        lastName,
        phone,
        roleId,
        department,
        designation,
        companyId: 'comp_diallo_india',
        status: 'ACTIVE',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('users').doc(uid).set(userDoc);

      // 3. Write to Firestore 'employees' collection
      const empDoc = {
        id: uid,
        employeeCode: empCode,
        firstName,
        lastName,
        fullName,
        email,
        workEmail: email,
        phone,
        roleId,
        department,
        designation,
        manager: mentor,
        mentor,
        dateOfJoining,
        joiningDate: dateOfJoining,
        employmentStatus: 'ACTIVE',
        status: 'ACTIVE',
        companyId: 'comp_diallo_india',
        branchName: 'Diallo - Ghansoli Mahape',
        shift: '10:00 AM – 07:00 PM',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('employees').doc(uid).set(empDoc);

      // 4. If Trainee, automatically initialize in 'trainees' collection with Day 1
      if (roleId === 'TRAINEE') {
        await db.collection('trainees').doc(uid).set({
          traineeId: uid,
          name: fullName,
          fullName,
          email,
          phone,
          department,
          mentorName: mentor || 'Lead Corporate Trainer',
          mentorContact: '9372868617',
          currentDay: 1,
          totalDays: 7,
          currentModuleTitle: 'Day 1: Introduction, Trade Types, Market, What is Cryptocurrency',
          status: 'ACTIVE',
          enrolledDate: dateOfJoining,
          companyId: 'comp_diallo_india',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // Log Audit Trail
      if (typeof auditService !== 'undefined') {
        await auditService.log('USER_LOGIN_CREATED', 'SECURITY', 'users', uid, { email, roleId, department, createdBy: AuthGuard.userProfile?.displayName });
      }

      // 5. Present Success Modal with Credentials
      document.getElementById('cred-name').textContent = fullName;
      document.getElementById('cred-email').textContent = email;
      document.getElementById('cred-pass').textContent = password;
      document.getElementById('cred-role').textContent = roleId;
      document.getElementById('cred-dept').textContent = department;

      const modal = document.getElementById('credentials-success-modal');
      if (modal) modal.style.display = 'flex';

      Toast.success(`Login credentials created for ${fullName} (${email})`);

      // Reset form
      document.getElementById('create-employee-form').reset();
      document.getElementById('new-emp-doj').value = new Date().toISOString().split('T')[0];
    } catch (err) {
      console.error('[CreateEmployee] Error provisioning user:', err);
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists in Firebase Auth.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'The password is too weak. Please use at least 6 characters.';
      }
      Toast.error('Account creation failed: ' + msg);
    } finally {
      if (secondaryApp) {
        try { await secondaryApp.delete(); } catch (_) {}
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Create Login Account</span>
        `;
      }
    }
  },

  closeModal() {
    const modal = document.getElementById('credentials-success-modal');
    if (modal) modal.style.display = 'none';
  },

  copyCredentials() {
    const email = document.getElementById('cred-email').textContent;
    const pass = document.getElementById('cred-pass').textContent;
    const name = document.getElementById('cred-name').textContent;
    const role = document.getElementById('cred-role').textContent;
    const text = `Diallo HRMS Login Credentials:\nName: ${name}\nRole: ${role}\nEmail: ${email}\nPassword: ${pass}\nPortal: https://ayanchougle.github.io/HRMS/login.html`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        Toast.success('Credentials copied to clipboard!');
      });
    } else {
      Toast.info('Credentials ready to share.');
    }
  }
};

window.CreateEmployeeView = CreateEmployeeView;
