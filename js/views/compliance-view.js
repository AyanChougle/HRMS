/**
 * DIALLO HRMS — ADVANCED HR & COMPLIANCE MANAGEMENT VIEW (PHASE 16)
 * Enterprise Suite managing Employee Lifecycle, Probations, Promotions, Transfers,
 * HR Letters, Certifications, Training Records, Disciplinary Cases, and Grievances.
 */

const ComplianceView = {
  activeTab: 'overview',

  async render() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isHRorAdmin = role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || role === 'HR_MANAGER' || role === 'HR';
    const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';
    const currentEmployeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;

    let [compliance, probations, promotions, transfers, letters, certs, trainings, cases, grievances, employees] = await Promise.all([
      complianceService.getComplianceOverview(companyId),
      hrService.getProbations(companyId),
      hrService.getPromotions(companyId),
      hrService.getTransfers(companyId),
      letterService.getEmployeeLetters(companyId, isHRorAdmin ? null : currentEmployeeId),
      complianceService.getCertifications(companyId, isHRorAdmin ? null : currentEmployeeId),
      complianceService.getTrainingRecords(companyId, isHRorAdmin ? null : currentEmployeeId),
      isHRorAdmin ? hrService.getHRCases(companyId) : [],
      hrService.getGrievances(companyId, isHRorAdmin ? null : currentEmployeeId),
      employeeService.getAllEmployees(companyId)
    ]);

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Advanced HR & Compliance</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Advanced HR & Compliance Management</h1>
            <p class="page-subtitle">Employee lifecycle oversight, probations, promotions, official HR letters, certifications, and compliance audit</p>
          </div>
          <div class="page-actions">
            ${isHRorAdmin ? `
              <button class="btn btn-primary btn-sm" onclick="ComplianceView.openGenerateLetterModal()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                + Issue HR Letter
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="ComplianceView.openSubmitGrievanceModal()">
                Submit Grievance
              </button>
            `}
          </div>
        </div>
      </div>

      <!-- Top Summary Metrics Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Health</span>
          </div>
          <div class="kpi-value">${compliance.overallCompliance}</div>
          <div class="kpi-label">Organization Compliance</div>
          <div class="kpi-subtitle">Documents, Certs, Policies & Training</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Evaluations</span>
          </div>
          <div class="kpi-value">${probations.filter(p => p.status === 'ACTIVE').length}</div>
          <div class="kpi-label">Active Probations</div>
          <div class="kpi-subtitle">${probations.filter(p => p.reviewStatus === 'PENDING_HR_REVIEW').length} Pending HR Review</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Issued</span>
          </div>
          <div class="kpi-value">${letters.length}</div>
          <div class="kpi-label">Official HR Letters</div>
          <div class="kpi-subtitle">Generated Document Ledgers</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Skills</span>
          </div>
          <div class="kpi-value">${trainings.length}</div>
          <div class="kpi-label">Active Trainings</div>
          <div class="kpi-subtitle">${certs.length} Verified Certifications</div>
        </div>
      </div>

      <!-- Navigation Tabs (9 Tabs) -->
      <div class="tabs-nav" style="margin-bottom: 20px; overflow-x: auto; white-space: nowrap;">
        <button class="tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" onclick="ComplianceView.switchTab('overview')">
          Compliance Matrix
        </button>
        <button class="tab-btn ${this.activeTab === 'probation' ? 'active' : ''}" onclick="ComplianceView.switchTab('probation')">
          Probation & Confirmation (${probations.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'promotions' ? 'active' : ''}" onclick="ComplianceView.switchTab('promotions')">
          Promotions & Transfers (${promotions.length + transfers.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'letters' ? 'active' : ''}" onclick="ComplianceView.switchTab('letters')">
          Official HR Letters (${letters.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'certifications' ? 'active' : ''}" onclick="ComplianceView.switchTab('certifications')">
          Certifications (${certs.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'training' ? 'active' : ''}" onclick="ComplianceView.switchTab('training')">
          Training & Learning (${trainings.length})
        </button>
        ${isHRorAdmin ? `
          <button class="tab-btn ${this.activeTab === 'cases' ? 'active' : ''}" onclick="ComplianceView.switchTab('cases')">
            Disciplinary & HR Cases (${cases.length})
          </button>
        ` : ''}
        <button class="tab-btn ${this.activeTab === 'grievances' ? 'active' : ''}" onclick="ComplianceView.switchTab('grievances')">
          Grievances (${grievances.length})
        </button>
        ${isHRorAdmin ? `
          <button class="tab-btn ${this.activeTab === 'salary-history' ? 'active' : ''}" onclick="ComplianceView.switchTab('salary-history')">
            Salary Revision History
          </button>
        ` : ''}
      </div>

      <!-- Active Tab Container -->
      <div class="tab-content">
        ${await this.renderActiveTab(compliance, probations, promotions, transfers, letters, certs, trainings, cases, grievances, employees, isHRorAdmin, currentEmployeeId, companyId)}
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    Router.mountView('compliance');
  },

  async renderActiveTab(compliance, probations, promotions, transfers, letters, certs, trainings, cases, grievances, employees, isHRorAdmin, currentEmployeeId, companyId) {
    switch (this.activeTab) {
      case 'probation': return this.renderProbationTab(probations, isHRorAdmin);
      case 'promotions': return this.renderPromotionsTab(promotions, transfers, isHRorAdmin);
      case 'letters': return this.renderLettersTab(letters, isHRorAdmin);
      case 'certifications': return this.renderCertificationsTab(certs, isHRorAdmin);
      case 'training': return this.renderTrainingTab(trainings, isHRorAdmin);
      case 'cases': return this.renderCasesTab(cases, isHRorAdmin);
      case 'grievances': return this.renderGrievancesTab(grievances, isHRorAdmin);
      case 'salary-history': return await this.renderSalaryHistoryTab(companyId);
      default: return this.renderOverviewTab(compliance);
    }
  },

  // 1. COMPLIANCE MATRIX OVERVIEW
  renderOverviewTab(compliance) {
    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <!-- Detailed Category Breakdown -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Statutory & Organizational Compliance Audit</div>
              <div class="card-subtitle">Real-time adherence index derived from employee dossiers</div>
            </div>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-4">
              <div>
                <div class="flex justify-between items-center" style="margin-bottom: 4px; font-size: 0.88rem;">
                  <strong>Employee KYC & Document Dossiers</strong>
                  <span class="badge badge-success">${compliance.docComplianceRate}</span>
                </div>
                <div style="height: 8px; background: var(--bg-hover); border-radius: 4px; overflow: hidden;">
                  <div style="width: ${compliance.docComplianceRate}; height: 100%; background: var(--success); border-radius: 4px;"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between items-center" style="margin-bottom: 4px; font-size: 0.88rem;">
                  <strong>Professional Certifications & Licenses</strong>
                  <span class="badge badge-primary">${compliance.certComplianceRate}</span>
                </div>
                <div style="height: 8px; background: var(--bg-hover); border-radius: 4px; overflow: hidden;">
                  <div style="width: ${compliance.certComplianceRate}; height: 100%; background: var(--primary); border-radius: 4px;"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between items-center" style="margin-bottom: 4px; font-size: 0.88rem;">
                  <strong>Mandatory Compliance & POSH Training</strong>
                  <span class="badge badge-success">${compliance.trainingRate}</span>
                </div>
                <div style="height: 8px; background: var(--bg-hover); border-radius: 4px; overflow: hidden;">
                  <div style="width: ${compliance.trainingRate}; height: 100%; background: var(--success); border-radius: 4px;"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between items-center" style="margin-bottom: 4px; font-size: 0.88rem;">
                  <strong>HR Policy Acknowledgement Quotas</strong>
                  <span class="badge badge-info">${compliance.policyAckRate}</span>
                </div>
                <div style="height: 8px; background: var(--bg-hover); border-radius: 4px; overflow: hidden;">
                  <div style="width: ${compliance.policyAckRate}; height: 100%; background: var(--info); border-radius: 4px;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Compliance Governance Rules -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Governance Standards & Statutory Alignment</div>
              <div class="card-subtitle">Automated reminders and mandatory HR audit requirements</div>
            </div>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3" style="font-size: 0.85rem;">
              <div style="padding: 12px; background: var(--bg-hover); border-radius: 6px;">
                <strong>KYC Dossier Protocol:</strong> All active employees must maintain verified Government Identity (PAN/Aadhaar) and current residential address proof.
              </div>
              <div style="padding: 12px; background: var(--bg-hover); border-radius: 6px;">
                <strong>Annual POSH Certification:</strong> Prevention of Sexual Harassment training is compulsory for 100% of staff within 60 days of joining.
              </div>
              <div style="padding: 12px; background: var(--bg-hover); border-radius: 6px;">
                <strong>Probation Evaluation:</strong> Mandatory performance sign-off required by line manager 14 days prior to probation expiration date.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 2. PROBATION & CONFIRMATION TAB
  renderProbationTab(probations, isHRorAdmin) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Probation Evaluations & Confirmations (${probations.length})</div>
            <div class="card-subtitle">Track new joiner probation tenures, review milestones, and service confirmations</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department & Title</th>
                <th>Probation Start</th>
                <th>Expected End</th>
                <th>Status</th>
                <th>Review Status</th>
                ${isHRorAdmin ? '<th>Action</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${probations.map(p => `
                <tr>
                  <td>
                    <div class="font-semibold text-main">${p.employeeName}</div>
                    <div class="text-muted" style="font-size: 0.75rem;"><code>${p.employeeCode}</code></div>
                  </td>
                  <td>
                    <div>${p.designation}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${p.department}</div>
                  </td>
                  <td>${p.startDate}</td>
                  <td><strong>${p.expectedEndDate}</strong></td>
                  <td>
                    <span class="badge ${p.status === 'COMPLETED' ? 'badge-success' : (p.status === 'EXTENDED' ? 'badge-warning' : 'badge-primary')}">
                      ${p.status}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-neutral">${p.reviewStatus || 'PENDING_REVIEW'}</span>
                  </td>
                  ${isHRorAdmin ? `
                    <td>
                      ${p.status === 'ACTIVE' || p.status === 'EXTENDED' ? `
                        <button class="btn btn-soft btn-sm" onclick="ComplianceView.openProbationReviewModal('${p.id}', '${p.employeeId}', '${p.employeeName}', '${p.expectedEndDate}')">
                          Review / Confirm
                        </button>
                      ` : '<span class="text-muted" style="font-size: 0.8rem;">Completed</span>'}
                    </td>
                  ` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 3. PROMOTIONS & TRANSFERS TAB
  renderPromotionsTab(promotions, transfers, isHRorAdmin) {
    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Promotions Ledger -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Promotions & Title Advancements (${promotions.length})</div>
              <div class="card-subtitle">Career progression records and grade adjustments</div>
            </div>
            ${isHRorAdmin ? `<button class="btn btn-primary btn-sm" onclick="ComplianceView.openAddPromotionModal()">+ Promote</button>` : ''}
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation Progression</th>
                  <th>Effective Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${promotions.length === 0 ? `
                  <tr><td colspan="4" class="text-center text-muted" style="padding: 24px;">No promotion records logged yet.</td></tr>
                ` : promotions.map(pr => `
                  <tr>
                    <td>
                      <strong>${pr.employeeName}</strong>
                      <div class="text-muted" style="font-size: 0.75rem;">${pr.department}</div>
                    </td>
                    <td>
                      <span class="text-muted">${pr.oldDesignation}</span> &rarr; <strong style="color: var(--primary);">${pr.newDesignation}</strong>
                    </td>
                    <td><code>${pr.effectiveDate}</code></td>
                    <td><span class="badge badge-success">${pr.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Transfers Ledger -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Organizational & Branch Transfers (${transfers.length})</div>
              <div class="card-subtitle">Internal department and physical branch relocations</div>
            </div>
            ${isHRorAdmin ? `<button class="btn btn-primary btn-sm" onclick="ComplianceView.openAddTransferModal()">+ Transfer</button>` : ''}
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Transfer Details</th>
                  <th>Effective</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${transfers.length === 0 ? `
                  <tr><td colspan="4" class="text-center text-muted" style="padding: 24px;">No transfer records logged yet.</td></tr>
                ` : transfers.map(tr => `
                  <tr>
                    <td><strong>${tr.employeeName}</strong></td>
                    <td>
                      <div style="font-size: 0.8rem;">
                        ${tr.fromBranch ? `${tr.fromBranch} &rarr; <strong>${tr.toBranch}</strong>` : ''}
                        ${tr.fromDepartment ? `${tr.fromDepartment} &rarr; <strong>${tr.toDepartment}</strong>` : ''}
                      </div>
                    </td>
                    <td><code>${tr.effectiveDate}</code></td>
                    <td><span class="badge badge-success">${tr.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // 4. OFFICIAL HR LETTERS TAB
  renderLettersTab(letters, isHRorAdmin) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Official Issued HR Letters (${letters.length})</div>
            <div class="card-subtitle">Formal appointment, confirmation, transfer, experience, and promotion letters</div>
          </div>
          ${isHRorAdmin ? `<button class="btn btn-primary btn-sm" onclick="ComplianceView.openGenerateLetterModal()">+ Generate Letter</button>` : ''}
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Recipient Employee</th>
                <th>Letter Type & Subject</th>
                <th>Department</th>
                <th>Issued Date</th>
                <th>Issued By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${letters.length === 0 ? `
                <tr><td colspan="6" class="text-center text-muted" style="padding: 32px;">No official letters issued.</td></tr>
              ` : letters.map(lt => `
                <tr>
                  <td>
                    <div class="font-semibold text-main">${lt.employeeName}</div>
                    <div class="text-muted" style="font-size: 0.75rem;"><code>${lt.employeeCode}</code></div>
                  </td>
                  <td>
                    <strong>${lt.subject || lt.templateName}</strong>
                    <div class="text-muted" style="font-size: 0.75rem;">${lt.letterType}</div>
                  </td>
                  <td>${lt.department}</td>
                  <td>${lt.createdAt ? new Date(lt.createdAt.seconds ? lt.createdAt.seconds * 1000 : lt.createdAt).toLocaleDateString() : 'Recent'}</td>
                  <td>${lt.issuedBy}</td>
                  <td>
                    <button class="btn btn-soft btn-sm" onclick="ComplianceView.openViewLetterModal('${lt.id}')">
                      View & Print
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 5. CERTIFICATIONS TAB
  renderCertificationsTab(certs, isHRorAdmin) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Professional Certifications & Licenses (${certs.length})</div>
            <div class="card-subtitle">Verified professional credentials, license numbers, and validity periods</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ComplianceView.openAddCertificationModal()">+ Add Certification</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Certification Name</th>
                <th>Staff Member</th>
                <th>Issuing Authority</th>
                <th>Credential ID</th>
                <th>Validity Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${certs.map(c => `
                <tr>
                  <td>
                    <strong>${c.name}</strong>
                  </td>
                  <td>
                    <div>${c.employeeName}</div>
                    <div class="text-muted" style="font-size: 0.75rem;"><code>${c.employeeCode || ''}</code></div>
                  </td>
                  <td>${c.issuingOrg}</td>
                  <td><code>${c.credentialId || '-'}</code></td>
                  <td>${c.expiryDate || 'No Expiry'}</td>
                  <td>
                    <span class="badge ${c.status === 'VALID' ? 'badge-success' : (c.status === 'EXPIRING_SOON' ? 'badge-warning' : 'badge-danger')}">
                      ${c.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 6. TRAINING & LEARNING TAB
  renderTrainingTab(trainings, isHRorAdmin) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Corporate Training & Skill Programs (${trainings.length})</div>
            <div class="card-subtitle">Mandatory POSH, technical upskilling, and cybersecurity learning modules</div>
          </div>
          ${isHRorAdmin ? `<button class="btn btn-primary btn-sm" onclick="ComplianceView.openAssignTrainingModal()">+ Assign Training</button>` : ''}
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Training Program</th>
                <th>Category</th>
                <th>Target Audience</th>
                <th>Provider</th>
                <th>Target Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${trainings.map(t => `
                <tr>
                  <td><strong>${t.trainingName}</strong></td>
                  <td><span class="badge badge-neutral">${t.category}</span></td>
                  <td>${t.targetName || t.employeeName || 'Workforce'}</td>
                  <td>${t.provider}</td>
                  <td><code>${t.dueDate}</code></td>
                  <td>
                    <span class="badge ${t.status === 'COMPLETED' ? 'badge-success' : (t.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-neutral')}">
                      ${t.status} ${t.completionRate ? `(${t.completionRate})` : ''}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 7. DISCIPLINARY & HR CASES TAB
  renderCasesTab(cases, isHRorAdmin) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Confidential HR & Disciplinary Case Management (${cases.length})</div>
            <div class="card-subtitle">Attendance irregularities, policy violations, formal warnings, and inquiry records</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ComplianceView.openAddCaseModal()">+ Open HR Case</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Case Title</th>
                <th>Staff Involved</th>
                <th>Case Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Assigned HR</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${cases.map(cs => `
                <tr>
                  <td>
                    <div class="font-semibold text-main">${cs.title}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${cs.description?.slice(0, 50)}...</div>
                  </td>
                  <td>
                    <strong>${cs.employeeName}</strong>
                    <div class="text-muted" style="font-size: 0.75rem;"><code>${cs.employeeCode || ''}</code></div>
                  </td>
                  <td><span class="badge badge-neutral">${cs.caseType}</span></td>
                  <td>
                    <span class="badge ${cs.severity === 'CRITICAL' ? 'badge-danger' : (cs.severity === 'HIGH' ? 'badge-warning' : 'badge-neutral')}">
                      ${cs.severity || 'LOW'}
                    </span>
                  </td>
                  <td>
                    <span class="badge ${cs.status === 'CLOSED' ? 'badge-success' : 'badge-primary'}">
                      ${cs.status}
                    </span>
                  </td>
                  <td>${cs.assignedTo}</td>
                  <td>
                    <button class="btn btn-soft btn-sm" onclick="ComplianceView.openResolveCaseModal('${cs.id}')">
                      Update Case
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 8. GRIEVANCES TAB
  renderGrievancesTab(grievances, isHRorAdmin) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Employee Grievance Helpdesk (${grievances.length})</div>
            <div class="card-subtitle">Confidential workplace, payroll, and interpersonal dispute resolution channel</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ComplianceView.openSubmitGrievanceModal()">+ Submit Grievance</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Grievance Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Submitted On</th>
                <th>Status</th>
                <th>Resolution Notes</th>
                ${isHRorAdmin ? '<th>Action</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${grievances.length === 0 ? `
                <tr><td colspan="7" class="text-center text-muted" style="padding: 32px;">No grievances submitted.</td></tr>
              ` : grievances.map(g => `
                <tr>
                  <td>
                    <div class="font-semibold text-main">${g.title}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${g.description?.slice(0, 60)}...</div>
                  </td>
                  <td><span class="badge badge-neutral">${g.category}</span></td>
                  <td>
                    <span class="badge ${g.priority === 'URGENT' ? 'badge-danger' : (g.priority === 'HIGH' ? 'badge-warning' : 'badge-neutral')}">
                      ${g.priority}
                    </span>
                  </td>
                  <td>${g.submittedAt ? new Date(g.submittedAt.seconds ? g.submittedAt.seconds * 1000 : g.submittedAt).toLocaleDateString() : 'Recent'}</td>
                  <td>
                    <span class="badge ${g.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}">
                      ${g.status}
                    </span>
                  </td>
                  <td><span class="text-muted" style="font-size: 0.8rem;">${g.resolutionNotes || 'In review by HR Ethics Committee'}</span></td>
                  ${isHRorAdmin ? `
                    <td>
                      ${g.status !== 'RESOLVED' ? `
                        <button class="btn btn-soft btn-sm" onclick="ComplianceView.openResolveGrievanceModal('${g.id}')">Resolve</button>
                      ` : '<span class="text-muted" style="font-size: 0.8rem;">Closed</span>'}
                    </td>
                  ` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 9. CONFIDENTIAL SALARY REVISION HISTORY TAB
  async renderSalaryHistoryTab(companyId) {
    const records = await hrService.getSalaryHistory(null, companyId);

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Confidential Salary Revision Ledgers (${records.length})</div>
            <div class="card-subtitle">Historical compensation adjustments, merit increments, and committee authorizations</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ComplianceView.openAddSalaryRevisionModal()">+ Record Salary Revision</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Previous CTC (INR)</th>
                <th>Revised CTC (INR)</th>
                <th>Increment %</th>
                <th>Effective Date</th>
                <th>Reason</th>
                <th>Authorized By</th>
              </tr>
            </thead>
            <tbody>
              ${records.length === 0 ? `
                <tr><td colspan="7" class="text-center text-muted" style="padding: 32px;">No salary revision records logged.</td></tr>
              ` : records.map(s => `
                <tr>
                  <td><strong>${s.employeeName}</strong></td>
                  <td>INR ${(s.previousCtc || 0).toLocaleString('en-IN')}</td>
                  <td><strong style="color: var(--success);">INR ${(s.revisedCtc || 0).toLocaleString('en-IN')}</strong></td>
                  <td><span class="badge badge-success">+${s.incrementPercentage}%</span></td>
                  <td><code>${s.effectiveDate}</code></td>
                  <td><span class="text-muted" style="font-size: 0.8rem;">${s.revisionReason}</span></td>
                  <td>${s.approvedBy}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // MODALS
  openProbationReviewModal(probationId, employeeId, employeeName, expectedEndDate) {
    ModalManager.openModal({
      id: 'probation-review-modal',
      title: 'Probation Milestone Evaluation',
      subtitle: `Evaluate probation tenure for ${employeeName} (Scheduled End: ${expectedEndDate})`,
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Evaluation Decision</label>
          <select id="pr-decision" class="form-control">
            <option value="CONFIRM" selected>Confirm Services as Permanent Employee</option>
            <option value="EXTEND">Extend Probation Period (Further Evaluation)</option>
            <option value="TERMINATE">Conclude Employment (Failed Probation)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Evaluation Remarks & Performance Summary</label>
          <textarea id="pr-remarks" class="form-control" rows="3" placeholder="Performance achievements, core competencies, or extension rationale..."></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitProbationReview('${probationId}', '${employeeId}')">Submit Decision</button>
      `
    });
  },

  async submitProbationReview(probationId, employeeId) {
    const decision = document.getElementById('pr-decision')?.value || 'CONFIRM';
    const remarks = document.getElementById('pr-remarks')?.value || '';

    try {
      await hrService.completeProbation(probationId, employeeId, decision, remarks);
      Toast.success(`Probation review finalized: ${decision}`);
      ModalManager.closeModal('probation-review-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async openGenerateLetterModal() {
    const [templates, employees] = await Promise.all([
      letterService.getLetterTemplates(),
      employeeService.getAllEmployees()
    ]);

    ModalManager.openModal({
      id: 'generate-letter-modal',
      title: 'Issue Official HR Letter',
      subtitle: 'Select recipient employee and standard letter template',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Select Staff Member</label>
          <select id="lt-employee" class="form-control">
            ${employees.map(e => `<option value="${e.id}">${e.fullName || e.name} (${e.employeeCode || 'EMP'}) — ${e.designation || 'Staff'}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Letter Template</label>
          <select id="lt-template" class="form-control">
            ${templates.map(t => `<option value="${t.id}">${t.name} (${t.type})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Effective Date</label>
          <input type="date" id="lt-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitGenerateLetter()">Generate & Issue Letter</button>
      `
    });
  },

  async submitGenerateLetter() {
    const employeeId = document.getElementById('lt-employee')?.value;
    const templateId = document.getElementById('lt-template')?.value;
    const effectiveDate = document.getElementById('lt-date')?.value;

    if (!employeeId || !templateId) {
      Toast.error('Please select both an employee and letter template.');
      return;
    }

    try {
      const emp = await employeeService.getEmployee(employeeId);
      await letterService.generateEmployeeLetter(templateId, emp, { effectiveDate });
      Toast.success('HR letter generated and archived in employee record.');
      ModalManager.closeModal('generate-letter-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async openViewLetterModal(letterId) {
    const letters = await letterService.getEmployeeLetters();
    const letter = letters.find(l => l.id === letterId);
    if (!letter) return;

    ModalManager.openModal({
      id: 'view-letter-modal',
      title: letter.subject || letter.templateName,
      subtitle: `Issued to ${letter.employeeName} (${letter.employeeCode}) • Issued by ${letter.issuedBy}`,
      contentHtml: `
        <div class="card" style="padding: 24px; background: var(--bg-surface); border: 1px solid var(--border-main); white-space: pre-line; line-height: 1.7; font-size: 0.92rem;">
          ${letter.content}
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="window.print()">Print Document</button>
        <button class="btn btn-primary btn-sm" data-modal-close>Close</button>
      `
    });
  },

  openSubmitGrievanceModal() {
    ModalManager.openModal({
      id: 'submit-grievance-modal',
      title: 'Submit Confidential Grievance',
      subtitle: 'Report a workplace, compensation, or organizational issue securely',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Grievance Subject</label>
          <input type="text" id="gr-title" class="form-control" placeholder="Brief subject..." required />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label required">Category</label>
            <select id="gr-cat" class="form-control">
              <option value="WORKPLACE_ENVIRONMENT" selected>Workplace Environment</option>
              <option value="PAYROLL_EXPENSE">Payroll & Reimbursements</option>
              <option value="MANAGEMENT_RELATION">Management & Interpersonal</option>
              <option value="POLICY_CONCERN">Policy Interpretation</option>
              <option value="OTHER">Other Query</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Priority</label>
            <select id="gr-pri" class="form-control">
              <option value="NORMAL" selected>Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Detailed Description</label>
          <textarea id="gr-desc" class="form-control" rows="4" placeholder="Provide factual description and dates of the concern..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitGrievance()">Submit Grievance</button>
      `
    });
  },

  async submitGrievance() {
    const title = document.getElementById('gr-title')?.value;
    const description = document.getElementById('gr-desc')?.value;
    if (!title || !description) {
      Toast.error('Please provide title and description.');
      return;
    }

    try {
      await hrService.createGrievance({
        title,
        description,
        category: document.getElementById('gr-cat')?.value || 'WORKPLACE_ENVIRONMENT',
        priority: document.getElementById('gr-pri')?.value || 'NORMAL'
      });
      Toast.success('Grievance logged securely with HR Ethics Committee.');
      ModalManager.closeModal('submit-grievance-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openResolveGrievanceModal(id) {
    ModalManager.openModal({
      id: 'resolve-grievance-modal',
      title: 'Resolve & Close Grievance',
      subtitle: 'Provide formal committee resolution notes',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Formal Resolution Summary</label>
          <textarea id="gr-res-notes" class="form-control" rows="3" placeholder="Corrective actions taken and committee conclusion..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitResolveGrievance('${id}')">Finalize Resolution</button>
      `
    });
  },

  async submitResolveGrievance(id) {
    const notes = document.getElementById('gr-res-notes')?.value;
    if (!notes) {
      Toast.error('Please enter resolution summary.');
      return;
    }

    try {
      await hrService.resolveGrievance(id, notes);
      Toast.success('Grievance closed with formal resolution.');
      ModalManager.closeModal('resolve-grievance-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async openAddPromotionModal() {
    const [employees, designations, jobLevels] = await Promise.all([
      employeeService.getAllEmployees(),
      organizationService.getDesignations(),
      organizationService.getJobLevels()
    ]);

    ModalManager.openModal({
      id: 'add-promotion-modal',
      title: 'Promote Staff Member',
      subtitle: 'Advance title, job level, and responsibility matrix',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Staff Member</label>
          <select id="prm-emp" class="form-control">
            ${employees.map(e => `<option value="${e.id}" data-desig="${e.designation || ''}" data-dept="${e.department || ''}">${e.fullName || e.name} (${e.designation || 'Staff'})</option>`).join('')}
          </select>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label required">New Designation Title</label>
            <select id="prm-desig" class="form-control">
              ${designations.map(d => `<option value="${d.name}">${d.name} (${d.code})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">New Job Level</label>
            <select id="prm-lvl" class="form-control">
              ${jobLevels.map(l => `<option value="${l.code}">${l.name} (${l.code})</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Effective Promotion Date</label>
          <input type="date" id="prm-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Merit Justification</label>
          <textarea id="prm-reason" class="form-control" rows="2" placeholder="Appraisal performance results, expanded scope..."></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitPromotion()">Confirm Promotion</button>
      `
    });
  },

  async submitPromotion() {
    const empSelect = document.getElementById('prm-emp');
    const employeeId = empSelect?.value;
    const selectedOption = empSelect?.options[empSelect.selectedIndex];
    const employeeName = selectedOption?.text.split('(')[0].trim();
    const oldDesignation = selectedOption?.getAttribute('data-desig') || 'Staff';
    const department = selectedOption?.getAttribute('data-dept') || 'Engineering';

    const newDesignation = document.getElementById('prm-desig')?.value;
    const newLevel = document.getElementById('prm-lvl')?.value;
    const effectiveDate = document.getElementById('prm-date')?.value;

    try {
      await hrService.createPromotion({
        employeeId,
        employeeName,
        oldDesignation,
        newDesignation,
        newLevel,
        department,
        effectiveDate,
        reason: document.getElementById('prm-reason')?.value || 'Merit Performance Progression'
      });
      Toast.success('Employee promotion confirmed and updated in active records.');
      ModalManager.closeModal('add-promotion-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async openAddTransferModal() {
    const [employees, branches, departments] = await Promise.all([
      employeeService.getAllEmployees(),
      organizationService.getBranches(),
      organizationService.getDepartments()
    ]);

    ModalManager.openModal({
      id: 'add-transfer-modal',
      title: 'Internal Organizational Transfer',
      subtitle: 'Transfer staff to another branch facility or department',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Select Staff Member</label>
          <select id="tr-emp" class="form-control">
            ${employees.map(e => `<option value="${e.id}" data-branch="${e.branch || 'HQ'}" data-dept="${e.department || 'General'}">${e.fullName || e.name} (${e.branch || 'HQ'} - ${e.department || 'General'})</option>`).join('')}
          </select>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Destination Branch</label>
            <select id="tr-branch" class="form-control">
              <option value="">No Branch Change</option>
              ${branches.map(b => `<option value="${b.name}">${b.name} (${b.code})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Destination Department</label>
            <select id="tr-dept" class="form-control">
              <option value="">No Department Change</option>
              ${departments.map(d => `<option value="${d.name}">${d.name} (${d.code})</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Effective Transfer Date</label>
          <input type="date" id="tr-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitTransfer()">Process Transfer</button>
      `
    });
  },

  async submitTransfer() {
    const empSelect = document.getElementById('tr-emp');
    const employeeId = empSelect?.value;
    const selectedOption = empSelect?.options[empSelect.selectedIndex];
    const employeeName = selectedOption?.text.split('(')[0].trim();
    const fromBranch = selectedOption?.getAttribute('data-branch') || '';
    const fromDepartment = selectedOption?.getAttribute('data-dept') || '';

    const toBranch = document.getElementById('tr-branch')?.value || fromBranch;
    const toDepartment = document.getElementById('tr-dept')?.value || fromDepartment;
    const effectiveDate = document.getElementById('tr-date')?.value;

    try {
      await hrService.createTransfer({
        employeeId,
        employeeName,
        fromBranch,
        toBranch,
        fromDepartment,
        toDepartment,
        effectiveDate
      });
      Toast.success('Employee transfer processed successfully.');
      ModalManager.closeModal('add-transfer-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openAddCertificationModal() {
    ModalManager.openModal({
      id: 'add-cert-modal',
      title: 'Add Professional Certification',
      subtitle: 'Register credentials, license numbers, and validity periods',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Certification Title</label>
          <input type="text" id="cr-name" class="form-control" placeholder="e.g. Certified Information Security Manager" required />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label required">Issuing Organization</label>
            <input type="text" id="cr-org" class="form-control" placeholder="e.g. ISACA / AWS / Microsoft" required />
          </div>
          <div class="form-group">
            <label class="form-label">Credential ID / License No</label>
            <input type="text" id="cr-id" class="form-control" placeholder="e.g. CISM-129481" />
          </div>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Issue Date</label>
            <input type="date" id="cr-issue" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label class="form-label">Expiry Date</label>
            <input type="date" id="cr-expiry" class="form-control" />
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitCertification()">Register Certification</button>
      `
    });
  },

  async submitCertification() {
    const name = document.getElementById('cr-name')?.value;
    const issuingOrg = document.getElementById('cr-org')?.value;
    if (!name || !issuingOrg) {
      Toast.error('Title and Issuing Organization are required.');
      return;
    }

    try {
      await complianceService.createCertification({
        name,
        issuingOrg,
        credentialId: document.getElementById('cr-id')?.value || '',
        issueDate: document.getElementById('cr-issue')?.value || '',
        expiryDate: document.getElementById('cr-expiry')?.value || ''
      });
      Toast.success('Certification registered successfully.');
      ModalManager.closeModal('add-cert-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openAssignTrainingModal() {
    ModalManager.openModal({
      id: 'assign-training-modal',
      title: 'Assign Corporate Training Program',
      subtitle: 'Schedule mandatory learning modules for workforce',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Training Title</label>
          <input type="text" id="trn-name" class="form-control" placeholder="e.g. Annual Anti-Bribery & Corruption Policy" required />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label required">Category</label>
            <select id="trn-cat" class="form-control">
              <option value="STATUTORY_COMPLIANCE" selected>Statutory Compliance</option>
              <option value="SECURITY">Information Security</option>
              <option value="TECHNICAL">Technical Skills</option>
              <option value="LEADERSHIP">Leadership & Management</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Target Due Date</label>
            <input type="date" id="trn-due" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Training Provider / Platform</label>
          <input type="text" id="trn-prov" class="form-control" value="Internal L&D Team" />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitAssignTraining()">Assign Training</button>
      `
    });
  },

  async submitAssignTraining() {
    const trainingName = document.getElementById('trn-name')?.value;
    if (!trainingName) {
      Toast.error('Please provide a training title.');
      return;
    }

    try {
      await complianceService.assignTraining({
        trainingName,
        category: document.getElementById('trn-cat')?.value || 'STATUTORY_COMPLIANCE',
        dueDate: document.getElementById('trn-due')?.value || '',
        provider: document.getElementById('trn-prov')?.value || 'Internal L&D'
      });
      Toast.success('Training module assigned.');
      ModalManager.closeModal('assign-training-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async openAddCaseModal() {
    const employees = await employeeService.getAllEmployees();

    ModalManager.openModal({
      id: 'add-case-modal',
      title: 'Open Formal HR / Disciplinary Case',
      subtitle: 'Record an inquiry, attendance irregularity, or policy violation',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Case Title</label>
          <input type="text" id="cs-title" class="form-control" placeholder="e.g. Repeated Absence Without Leave" required />
        </div>
        <div class="form-group">
          <label class="form-label required">Staff Member</label>
          <select id="cs-emp" class="form-control">
            ${employees.map(e => `<option value="${e.id}" data-code="${e.employeeCode || 'EMP'}">${e.fullName || e.name} (${e.employeeCode || 'EMP'}) — ${e.department || 'General'}</option>`).join('')}
          </select>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label required">Case Type</label>
            <select id="cs-type" class="form-control">
              <option value="ATTENDANCE_ISSUE" selected>Attendance Irregularity</option>
              <option value="POLICY_VIOLATION">Policy Violation</option>
              <option value="PERFORMANCE">Performance Concern</option>
              <option value="WARNING">Formal Warning</option>
              <option value="DISCIPLINARY">Disciplinary Inquiry</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Severity</label>
            <select id="cs-sev" class="form-control">
              <option value="LOW" selected>Low Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="HIGH">High Severity</option>
              <option value="CRITICAL">Critical Severity</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Case Summary / Evidence</label>
          <textarea id="cs-desc" class="form-control" rows="3" placeholder="Factual chronology, dates, and preliminary findings..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitCase()">Open Case</button>
      `
    });
  },

  async submitCase() {
    const title = document.getElementById('cs-title')?.value;
    const desc = document.getElementById('cs-desc')?.value;
    const empSelect = document.getElementById('cs-emp');
    const employeeId = empSelect?.value;
    const selectedOption = empSelect?.options[empSelect.selectedIndex];
    const employeeName = selectedOption?.text.split('(')[0].trim();
    const employeeCode = selectedOption?.getAttribute('data-code') || '';

    if (!title || !desc || !employeeId) {
      Toast.error('Please fill in all required fields.');
      return;
    }

    try {
      await hrService.createHRCase({
        title,
        description: desc,
        employeeId,
        employeeName,
        employeeCode,
        caseType: document.getElementById('cs-type')?.value || 'ATTENDANCE_ISSUE',
        severity: document.getElementById('cs-sev')?.value || 'LOW'
      });
      Toast.success('HR Case opened and logged to audit trail.');
      ModalManager.closeModal('add-case-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openResolveCaseModal(caseId) {
    ModalManager.openModal({
      id: 'resolve-case-modal',
      title: 'Update HR Case Resolution',
      subtitle: 'Conclude investigation and record administrative findings',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Resolution Status</label>
          <select id="cs-res-status" class="form-control">
            <option value="ACTION_TAKEN" selected>Action Taken (Warning Issued / Remediation)</option>
            <option value="CLOSED">Case Closed (Exonerated / Resolved)</option>
            <option value="IN_INVESTIGATION">Investigation Ongoing</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Administrative Notes</label>
          <textarea id="cs-res-notes" class="form-control" rows="3" placeholder="Action taken and formal committee notes..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitResolveCase('${caseId}')">Save Resolution</button>
      `
    });
  },

  async submitResolveCase(caseId) {
    const status = document.getElementById('cs-res-status')?.value || 'ACTION_TAKEN';
    const notes = document.getElementById('cs-res-notes')?.value;

    try {
      await hrService.updateHRCaseStatus(caseId, status, notes);
      Toast.success('HR case status updated.');
      ModalManager.closeModal('resolve-case-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async openAddSalaryRevisionModal() {
    const employees = await employeeService.getAllEmployees();

    ModalManager.openModal({
      id: 'add-salary-rev-modal',
      title: 'Record Confidential Salary Revision',
      subtitle: 'Log compensation adjustments and merit increments',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Staff Member</label>
          <select id="sr-emp" class="form-control">
            ${employees.map(e => `<option value="${e.id}">${e.fullName || e.name} (${e.employeeCode || 'EMP'})</option>`).join('')}
          </select>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label required">Previous Annual CTC (INR)</label>
            <input type="number" id="sr-prev" class="form-control" placeholder="e.g. 600000" required />
          </div>
          <div class="form-group">
            <label class="form-label required">Revised Annual CTC (INR)</label>
            <input type="number" id="sr-rev" class="form-control" placeholder="e.g. 720000" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Effective Revision Date</label>
          <input type="date" id="sr-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Revision Reason</label>
          <input type="text" id="sr-reason" class="form-control" value="Annual Merit Appraisal Increment" />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="ComplianceView.submitSalaryRevision()">Save Salary Record</button>
      `
    });
  },

  async submitSalaryRevision() {
    const empSelect = document.getElementById('sr-emp');
    const employeeId = empSelect?.value;
    const employeeName = empSelect?.options[empSelect.selectedIndex]?.text.split('(')[0].trim();
    const previousCtc = document.getElementById('sr-prev')?.value;
    const revisedCtc = document.getElementById('sr-rev')?.value;
    const effectiveDate = document.getElementById('sr-date')?.value;

    if (!employeeId || !previousCtc || !revisedCtc) {
      Toast.error('Please fill in all required salary parameters.');
      return;
    }

    try {
      await hrService.recordSalaryRevision({
        employeeId,
        employeeName,
        previousCtc,
        revisedCtc,
        effectiveDate,
        revisionReason: document.getElementById('sr-reason')?.value || 'Merit Revision'
      });
      Toast.success('Salary revision record logged securely in audit ledger.');
      ModalManager.closeModal('add-salary-rev-modal');
      Router.mountView('compliance');
    } catch (e) {
      Toast.error(e.message);
    }
  }
};

window.ComplianceView = ComplianceView;
