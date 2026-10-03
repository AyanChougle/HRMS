/**
 * DIALLO HRMS — MODAL FORMS WIZARDS (PHASE 4)
 * Multi-Tab Add/Edit Employee Modal, Leave Application, and Verification Engines
 */

const Forms = {
  // 1. ADD / EDIT EMPLOYEE MODAL WIZARD
  async openEmployeeModal(employeeId = null) {
    const role = (AuthGuard.userProfile?.roleId || AuthGuard.userProfile?.role || '').toUpperCase().trim();
    const canOnboard = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR', 'MANAGER'].includes(role);
    if (!canOnboard && !employeeId) {
      if (typeof Toast !== 'undefined') {
        Toast.error('Access Restricted: Only HR Managers, Super Admin, and Managers can onboard new employees.');
      } else {
        alert('Access Restricted: Only HR Managers, Super Admin, and Managers can onboard new employees.');
      }
      return;
    }

    let emp = null;
    let departments = [];
    let designations = [];
    let branches = [];
    let managers = [];

    try {
      const [deptList, desigList, branchList, empList] = await Promise.all([
        departmentService.getDepartments(),
        orgService.getDesignations(),
        orgService.getBranches(),
        employeeService.getEmployees({ status: 'ACTIVE' })
      ]);
      departments = deptList || [];
      designations = desigList || [];
      branches = branchList || [];
      managers = empList || [];

      if (employeeId) {
        emp = await employeeService.getEmployee(employeeId);
      }
    } catch (e) {
      console.warn('Form dependency fetch warning:', e);
    }

    const defaultCode = emp?.employeeCode || await employeeService.getNextEmployeeCode();
    const isEdit = !!emp;

    const contentHtml = `
      <form id="employee-wizard-form" onsubmit="event.preventDefault(); Forms.submitEmployeeForm('${employeeId || ''}')">
        <!-- Wizard Sub-Navigation Tabs -->
        <div class="tabs-nav" style="margin-bottom: 20px; border-bottom: 1px solid var(--border-main);">
          <button type="button" class="tab-btn active" onclick="Forms.switchWizardTab('tab-personal')">1. Personal</button>
          <button type="button" class="tab-btn" onclick="Forms.switchWizardTab('tab-contact')">2. Contact</button>
          <button type="button" class="tab-btn" onclick="Forms.switchWizardTab('tab-employment')">3. Employment & Org</button>
          <button type="button" class="tab-btn" onclick="Forms.switchWizardTab('tab-terms')">4. Probation & Terms</button>
        </div>

        <!-- TAB 1: PERSONAL INFORMATION -->
        <div id="tab-personal" class="wizard-tab-pane">
          <div class="form-row">
            <div class="col-4 form-group">
              <label class="form-label required">First Name</label>
              <input type="text" id="ef-first-name" class="form-control" value="${emp?.firstName || (emp?.fullName?.split(' ')[0] || '')}" placeholder="First Name" required />
            </div>
            <div class="col-4 form-group">
              <label class="form-label">Middle Name</label>
              <input type="text" id="ef-middle-name" class="form-control" value="${emp?.middleName || ''}" placeholder="Middle Name" />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Last Name</label>
              <input type="text" id="ef-last-name" class="form-control" value="${emp?.lastName || (emp?.fullName?.split(' ').slice(1).join(' ') || '')}" placeholder="Last Name" required />
            </div>
          </div>

          <div class="form-row">
            <div class="col-4 form-group">
              <label class="form-label required">Date of Birth</label>
              <input type="date" id="ef-dob" class="form-control" value="${emp?.dateOfBirth || '1995-05-15'}" required />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Gender</label>
              <select id="ef-gender" class="form-control">
                <option value="Male" ${emp?.gender === 'Male' ? 'selected' : ''}>Male</option>
                <option value="Female" ${emp?.gender === 'Female' ? 'selected' : ''}>Female</option>
                <option value="Other" ${emp?.gender === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
            <div class="col-4 form-group">
              <label class="form-label">PAN Number (India)</label>
              <input type="text" id="ef-pan" class="form-control" value="${emp?.pan || ''}" placeholder="ABCDE1234F" maxlength="10" style="text-transform: uppercase;" />
            </div>
          </div>
        </div>

        <!-- TAB 2: CONTACT INFORMATION -->
        <div id="tab-contact" class="wizard-tab-pane" style="display: none;">
          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Official Work Email</label>
              <input type="email" id="ef-work-email" class="form-control" value="${emp?.workEmail || emp?.email || ''}" placeholder="emp.code@diallo.in" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Personal Email</label>
              <input type="email" id="ef-personal-email" class="form-control" value="${emp?.personalEmail || ''}" placeholder="personal.email@example.com" />
            </div>
          </div>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Phone Number (+91)</label>
              <input type="tel" id="ef-phone" class="form-control" value="${emp?.phone || ''}" placeholder="9876543210" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Alternate / Emergency Contact</label>
              <input type="tel" id="ef-alt-phone" class="form-control" value="${emp?.alternatePhone || ''}" placeholder="9812345678" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Residential Address</label>
            <input type="text" id="ef-address" class="form-control" value="${emp?.address || ''}" placeholder="Ghansoli, Navi Mumbai" />
          </div>

          <div class="form-row">
            <div class="col-4 form-group">
              <label class="form-label">City</label>
              <input type="text" id="ef-city" class="form-control" value="${emp?.city || 'Navi Mumbai'}" />
            </div>
            <div class="col-4 form-group">
              <label class="form-label">State</label>
              <input type="text" id="ef-state" class="form-control" value="${emp?.state || 'Maharashtra'}" />
            </div>
            <div class="col-4 form-group">
              <label class="form-label">PIN Code</label>
              <input type="text" id="ef-postal" class="form-control" value="${emp?.postalCode || '400701'}" />
            </div>
          </div>
        </div>

        <!-- TAB 3: EMPLOYMENT & ORGANIZATION -->
        <div id="tab-employment" class="wizard-tab-pane" style="display: none;">
          <div class="form-row">
            <div class="col-4 form-group">
              <label class="form-label required">Employee Code</label>
              <input type="text" id="ef-code" class="form-control font-bold" value="${defaultCode}" style="text-transform: uppercase;" required />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Date of Joining</label>
              <input type="date" id="ef-joining-date" class="form-control" value="${emp?.dateOfJoining || emp?.joiningDate || new Date().toISOString().slice(0, 10)}" required />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Employment Type</label>
              <select id="ef-emp-type" class="form-control">
                <option value="Full Time" ${emp?.employmentType === 'Full Time' ? 'selected' : ''}>Full Time (Permanent)</option>
                <option value="Contract" ${emp?.employmentType === 'Contract' ? 'selected' : ''}>Contractor</option>
                <option value="Intern" ${emp?.employmentType === 'Intern' ? 'selected' : ''}>Intern</option>
                <option value="Probation" ${emp?.employmentType === 'Probation' ? 'selected' : ''}>Probationer</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Department</label>
              <select id="ef-dept" class="form-control">
                ${departments.length === 0 ? `
                  <option value="General">General</option>
                ` : departments.map(d => {
                  const dName = d.name || d.departmentName || d;
                  const isSel = emp?.department === dName;
                  return `<option value="${dName}" ${isSel ? 'selected' : ''}>${dName}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Designation / Role</label>
              <input type="text" id="ef-designation" class="form-control" value="${emp?.designation || 'Executive'}" placeholder="e.g. Operations Executive" required />
            </div>
          </div>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label">Branch Office</label>
              <select id="ef-branch" class="form-control">
                <option value="Ghansoli - Navi Mumbai" selected>Ghansoli - Navi Mumbai</option>
              </select>
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Reporting Manager</label>
              <select id="ef-manager" class="form-control">
                <option value="">No Manager (Top Level)</option>
                ${managers.filter(m => m.id !== employeeId).map(m => `
                  <option value="${m.id}" ${emp?.managerId === m.id || emp?.manager === m.fullName ? 'selected' : ''}>${m.fullName || m.name} (${m.employeeCode || 'EMP'})</option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- TAB 4: PROBATION & TERMS -->
        <div id="tab-terms" class="wizard-tab-pane" style="display: none;">
          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label">Probation Status</label>
              <select id="ef-probation-status" class="form-control">
                <option value="Active" ${emp?.probationStatus === 'Active' ? 'selected' : ''}>Active Probation</option>
                <option value="Completed" ${emp?.probationStatus === 'Completed' || !emp ? 'selected' : ''}>Confirmed / Completed</option>
                <option value="Extended" ${emp?.probationStatus === 'Extended' ? 'selected' : ''}>Extended</option>
              </select>
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Notice Period (Days)</label>
              <input type="number" id="ef-notice-days" class="form-control" value="${emp?.noticePeriodDays || 30}" min="0" max="180" />
            </div>
          </div>

          
        </div>
      </form>
    `;

    ModalManager.openModal({
      id: 'employee-form-modal',
      title: isEdit ? `Edit Employee: ${emp.fullName || emp.name}` : 'Onboard New Employee',
      subtitle: 'Compliant with Indian Wage Code & Multi-Tenant Scoping',
      size: 'lg',
      contentHtml,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" id="btn-save-employee" onclick="Forms.submitEmployeeForm('${employeeId || ''}')">
          ${isEdit ? 'Update Changes' : 'Complete & Onboard'}
        </button>
      `
    });
  },

  switchWizardTab(tabId) {
    document.querySelectorAll('.wizard-tab-pane').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#employee-form-modal .tab-btn').forEach(btn => btn.classList.remove('active'));

    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.style.display = 'block';

    const targetBtn = Array.from(document.querySelectorAll('#employee-form-modal .tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
    if (targetBtn) targetBtn.classList.add('active');
  },

  async submitEmployeeForm(employeeId = null) {
    const firstName = document.getElementById('ef-first-name')?.value.trim();
    const middleName = document.getElementById('ef-middle-name')?.value.trim();
    const lastName = document.getElementById('ef-last-name')?.value.trim();
    const workEmail = document.getElementById('ef-work-email')?.value.trim();
    const phone = document.getElementById('ef-phone')?.value.trim();
    const employeeCode = document.getElementById('ef-code')?.value.trim().toUpperCase();

    if (!firstName || !lastName || !workEmail || !employeeCode) {
      Toast.warning('Please fill in required fields (First Name, Last Name, Email, Employee Code).');
      return;
    }

    const btn = document.getElementById('btn-save-employee');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving to Firestore...';
    }

    const payload = {
      employeeCode,
      firstName,
      middleName: middleName || '',
      lastName,
      fullName: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim(),
      dateOfBirth: document.getElementById('ef-dob')?.value || '',
      gender: document.getElementById('ef-gender')?.value || 'Male',
      pan: (document.getElementById('ef-pan')?.value || '').trim().toUpperCase(),
      workEmail,
      personalEmail: (document.getElementById('ef-personal-email')?.value || '').trim(),
      phone,
      alternatePhone: (document.getElementById('ef-alt-phone')?.value || '').trim(),
      address: (document.getElementById('ef-address')?.value || '').trim(),
      city: (document.getElementById('ef-city')?.value || '').trim(),
      state: (document.getElementById('ef-state')?.value || '').trim(),
      postalCode: (document.getElementById('ef-postal')?.value || '').trim(),
      dateOfJoining: document.getElementById('ef-joining-date')?.value || new Date().toISOString().slice(0, 10),
      employmentType: document.getElementById('ef-emp-type')?.value || 'Full Time',
      department: document.getElementById('ef-dept')?.value || 'General',
      designation: (document.getElementById('ef-designation')?.value || '').trim(),
      branchName: document.getElementById('ef-branch')?.value || 'Ghansoli - Navi Mumbai',
      location: document.getElementById('ef-branch')?.value || 'Ghansoli - Navi Mumbai',
      managerId: document.getElementById('ef-manager')?.value || '',
      manager: document.getElementById('ef-manager')?.selectedOptions?.[0]?.text || '',
      probationStatus: document.getElementById('ef-probation-status')?.value || 'Completed',
      noticePeriodDays: Number(document.getElementById('ef-notice-days')?.value) || 30
    };

    // Remove any undefined properties before submitting to Firestore
    Object.keys(payload).forEach(k => {
      if (payload[k] === undefined) delete payload[k];
    });

    try {
      if (employeeId) {
        await employeeService.updateEmployee(employeeId, payload);
        Toast.success(`Updated details for ${payload.fullName}`);
      } else {
        await employeeService.createEmployee(payload);
        Toast.success(`Onboarded ${payload.fullName} (${payload.employeeCode}) successfully!`);
      }

      ModalManager.closeModal();
      if (window.PeopleView) {
        Router.navigate('employees');
      }
    } catch (err) {
      Toast.error(`Operation failed: ${err.message}`);
      if (btn) {
        btn.disabled = false;
        btn.textContent = employeeId ? 'Update Changes' : 'Complete & Onboard';
      }
    }
  },

  // 2. APPLY LEAVE MODAL
  async openApplyLeaveModal() {
    if (window.LeaveView && LeaveView.openApplyLeaveModal) {
      return LeaveView.openApplyLeaveModal();
    }

    ModalManager.openModal({
      id: 'apply-leave-modal',
      title: 'Apply for Leave',
      subtitle: 'Tenure-Based Paid Leave (PL) & Unpaid Leave (LWP)',
      contentHtml: `
        <form id="apply-leave-form" onsubmit="event.preventDefault(); Forms.submitLeaveForm()">
          <div class="form-group">
            <label class="form-label required">Leave Type</label>
            <select id="lf-type" class="form-control">
              <option value="PL">Paid Leave (PL) — Tenure-Based Statutory Quota</option>
              <option value="LWP">Unpaid Leave (Loss of Pay / LWP)</option>
            </select>
          </div>
          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Start Date</label>
              <input type="date" id="lf-start-date" class="form-control" value="${new Date().toISOString().slice(0, 10)}" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">End Date</label>
              <input type="date" id="lf-end-date" class="form-control" value="${new Date().toISOString().slice(0, 10)}" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label required">Reason for Absence</label>
            <textarea id="lf-reason" class="form-control" rows="3" placeholder="State reason for leave request..." required></textarea>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="Forms.submitLeaveForm()">Submit Leave Application</button>
      `
    });
  },

  async submitLeaveForm() {
    const type = document.getElementById('lf-type')?.value;
    const startDate = document.getElementById('lf-start-date')?.value;
    const endDate = document.getElementById('lf-end-date')?.value;
    const reason = document.getElementById('lf-reason')?.value.trim();

    if (!startDate || !endDate || !reason) {
      Toast.warning('Please complete all leave application fields.');
      return;
    }

    try {
      const applicantName = AuthGuard.userProfile?.displayName || AuthGuard.currentUser?.email?.split('@')[0] || 'Employee';
      await leaveService.applyLeave({
        type,
        startDate,
        endDate,
        reason,
        employeeName: applicantName
      });
      Toast.success('Leave application submitted to Manager/HR for approval.');
      ModalManager.closeModal();
      Router.navigate('leave');
    } catch (err) {
      Toast.error(`Leave application failed: ${err.message}`);
    }
  }
};

window.Forms = Forms;
