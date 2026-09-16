/**
 * DIALLO HRMS — RECRUITMENT & APPLICANT TRACKING SYSTEM (ATS) VIEW (PHASE 9)
 * Job Requisitions, Positions, 8-Stage Kanban Pipeline, Interviews, Assessments, Offers, and Onboarding Handoff
 */

const RecruitmentView = {
  activeTab: 'pipeline',
  forceShowKanban: false,

  toggleKanbanView(force = null) {
    this.forceShowKanban = force !== null ? force : !this.forceShowKanban;
    Router.navigate('recruitment');
  },

  async renderHub() {
    let requisitions = [];
    let jobs = [];
    let candidates = [];
    let applications = [];
    let interviews = [];
    let offers = [];

    try {
      [requisitions, jobs, candidates, applications, interviews, offers] = await Promise.all([
        recruitmentService.getRequisitions(),
        recruitmentService.getJobs(),
        recruitmentService.getCandidates(),
        recruitmentService.getApplications(),
        recruitmentService.getInterviews(),
        recruitmentService.getOffers()
      ]);
    } catch (e) {
      console.warn('Recruitment data loading warning:', e);
    }

    const openJobs = jobs.filter(j => j.status === 'PUBLISHED').length;
    const activeCandidates = candidates.length;
    const scheduledInterviews = interviews.filter(i => i.status === 'SCHEDULED').length;
    const pendingOffers = offers.filter(o => o.status === 'PENDING_APPROVAL' || o.status === 'APPROVED').length;
    const totalHired = applications.filter(a => a.currentStage === 'HIRED').length;

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Recruitment & ATS</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Recruitment & Applicant Tracking (ATS)</h1>
            <p class="page-subtitle">Talent requisitions, candidate pipeline, multi-round interview scoring, job offers, and onboarding conversion</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="RecruitmentView.openAddCandidateModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              + Add Candidate
            </button>
            <button class="btn btn-primary btn-sm" onclick="RecruitmentView.openCreateJobModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Post Job Position
            </button>
          </div>
        </div>
      </div>

      <!-- Recruitment KPI Summary Grid -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">${openJobs} Active</span>
          </div>
          <div class="kpi-value">${openJobs}</div>
          <div class="kpi-label">Open Job Positions</div>
          <div class="kpi-subtitle">Published & hiring</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Talent Pool</span>
          </div>
          <div class="kpi-value">${activeCandidates}</div>
          <div class="kpi-label">Candidate Profiles</div>
          <div class="kpi-subtitle">${applications.length} total applications</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Scheduled</span>
          </div>
          <div class="kpi-value">${scheduledInterviews}</div>
          <div class="kpi-label">Active Interviews</div>
          <div class="kpi-subtitle">Video & technical rounds</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Offers</span>
          </div>
          <div class="kpi-value">${pendingOffers}</div>
          <div class="kpi-label">Offers in Workflow</div>
          <div class="kpi-subtitle">${totalHired} candidates hired</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        <button class="tab-btn ${this.activeTab === 'pipeline' ? 'active' : ''}" onclick="RecruitmentView.switchTab('pipeline')">Candidate Pipeline (Kanban)</button>
        <button class="tab-btn ${this.activeTab === 'jobs' ? 'active' : ''}" onclick="RecruitmentView.switchTab('jobs')">Job Positions (${jobs.length})</button>
        <button class="tab-btn ${this.activeTab === 'requisitions' ? 'active' : ''}" onclick="RecruitmentView.switchTab('requisitions')">Requisitions (${requisitions.length})</button>
        <button class="tab-btn ${this.activeTab === 'interviews' ? 'active' : ''}" onclick="RecruitmentView.switchTab('interviews')">Interviews (${interviews.length})</button>
        <button class="tab-btn ${this.activeTab === 'offers' ? 'active' : ''}" onclick="RecruitmentView.switchTab('offers')">Job Offers (${offers.length})</button>
        <button class="tab-btn ${this.activeTab === 'candidates' ? 'active' : ''}" onclick="RecruitmentView.switchTab('candidates')">Talent Pool (${candidates.length})</button>
      </div>

      <!-- TAB CONTENT VIEWPORT -->
      <div id="recruitment-tab-content">
        ${await this.renderTabContent(jobs, requisitions, applications, candidates, interviews, offers)}
      </div>
    `;
  },

  async renderTabContent(jobs, requisitions, applications, candidates, interviews, offers) {
    if (this.activeTab === 'jobs') {
      return this.renderJobsTab(jobs);
    } else if (this.activeTab === 'requisitions') {
      return this.renderRequisitionsTab(requisitions);
    } else if (this.activeTab === 'interviews') {
      return this.renderInterviewsTab(interviews, applications);
    } else if (this.activeTab === 'offers') {
      return this.renderOffersTab(offers, applications);
    } else if (this.activeTab === 'candidates') {
      return this.renderCandidatesTab(candidates);
    }
    return this.renderPipelineTab(applications, jobs);
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    Router.navigate('recruitment');
  },

  // 1. KANBAN CANDIDATE PIPELINE TAB
  renderPipelineTab(applications, jobs) {
    const stages = [
      { key: 'APPLIED', label: 'Applied', color: 'var(--primary)' },
      { key: 'SCREENING', label: 'Screening', color: 'var(--info)' },
      { key: 'SHORTLISTED', label: 'Shortlisted', color: 'var(--accent-people)' },
      { key: 'INTERVIEW', label: 'Interview', color: 'var(--warning)' },
      { key: 'SELECTED', label: 'Selected', color: '#059669' },
      { key: 'OFFER', label: 'Offer', color: '#0284c7' },
      { key: 'HIRED', label: 'Hired & Onboard', color: 'var(--success)' }
    ];

    const activeApps = applications.filter(a =>
      stages.some(s => s.key === a.currentStage)
    );

    // If no candidate applications exist in the 7 pipeline stages, render ONE clean empty card
    if (activeApps.length === 0) {
      return `
        <div class="card">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="card-title">Candidate Pipeline</div>
              <div class="card-subtitle">0 candidate applications in hiring stages</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary btn-sm" onclick="RecruitmentView.openAddCandidateModal()">+ Add Candidate</button>
            </div>
          </div>
          <div class="card-body" style="padding: 60px 16px; text-align: center;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary-light, #eff6ff); color: var(--primary, #2563eb); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div style="font-weight: 700; font-size: 1.05rem; color: var(--text-main); margin-bottom: 6px;">
              No Candidates in Active Pipeline
            </div>
            <div style="color: var(--text-secondary); font-size: 0.85rem; max-width: 460px; margin: 0 auto 20px auto;">
              Candidates will appear across recruitment stages as they apply or are assigned to published job openings.
            </div>
            <div style="display: flex; gap: 8px; justify-content: center;">
              <button class="btn btn-primary btn-sm" onclick="RecruitmentView.openAddCandidateModal()">
                + Add Candidate
              </button>
              <button class="btn btn-secondary btn-sm" onclick="RecruitmentView.openCreateJobModal()">
                Post Job Position
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // When there ARE candidates, render all stages inside ONE unified Card
    return `
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="card-title">Candidate Pipeline (${activeApps.length})</div>
            <div class="card-subtitle">Visual candidate journey across recruitment stages</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn btn-primary btn-sm" onclick="RecruitmentView.openAddCandidateModal()">+ Add Candidate</button>
          </div>
        </div>
        <div class="card-body" style="padding: 16px; overflow-x: auto;">
          <div style="display: flex; gap: 14px; min-width: 1200px;">
            ${stages.map(s => {
              const appsInStage = applications.filter(a => a.currentStage === s.key);
              return `
                <div style="flex: 1; min-width: 200px; background: var(--bg-surface, var(--bg-hover)); border: 1px solid var(--border-main); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column;">
                  <div class="flex items-center justify-between" style="padding-bottom: 8px; border-bottom: 2px solid ${s.color}; margin-bottom: 10px;">
                    <strong class="text-main" style="font-size: 0.82rem; text-transform: uppercase;">${s.label}</strong>
                    <span class="badge badge-neutral font-bold" style="font-size: 0.72rem;">${appsInStage.length}</span>
                  </div>
                  
                  <div class="flex flex-col gap-2" style="flex: 1; min-height: 220px;">
                    ${appsInStage.length === 0 ? `
                      <div style="padding: 24px 8px; text-align: center; color: var(--text-muted); font-size: 0.76rem; border: 1px dashed var(--border-main); border-radius: var(--radius-md); background: var(--bg-card); margin: 6px 0;">
                        No candidates in ${s.label}
                      </div>
                    ` : appsInStage.map(a => `
                      <div class="card" style="padding: 12px 14px; border: 1px solid var(--border-main); box-shadow: var(--shadow-xs); background: var(--bg-card); border-radius: var(--radius-md); margin-bottom: 6px;">
                        <!-- Card Header: Avatar, Name & Delete button -->
                        <div class="flex items-center justify-between" style="margin-bottom: 6px;">
                          <div class="flex items-center gap-2" style="min-width: 0;">
                            <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-light); color: var(--primary); font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                              ${(a.candidateName || 'CA').split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div style="min-width: 0;">
                              <div class="font-bold text-main" style="font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${a.candidateName || 'Candidate'}">
                                ${a.candidateName || 'Candidate'}
                              </div>
                              <div class="text-secondary" style="font-size: 0.72rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${a.jobTitle || 'Open Position'}
                              </div>
                            </div>
                          </div>
                          <button class="btn btn-ghost btn-sm" style="padding: 2px 6px; color: var(--text-muted); font-size: 0.8rem; line-height: 1;" onclick="RecruitmentView.deleteApplication('${a.id}', '${a.candidateName}')" title="Remove Application">x</button>
                        </div>

                        <!-- Tag row: Source & Date -->
                        <div class="flex items-center justify-between" style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid var(--border-light);">
                          <span class="badge badge-neutral" style="font-size: 0.68rem; padding: 2px 6px;">${(a.source || 'Career Page').replace(/_/g, ' ')}</span>
                          <span style="font-size: 0.7rem;">${a.appliedAt ? new Date(a.appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recent'}</span>
                        </div>

                        <!-- Contextual Actions tailored to Stage -->
                        <div class="flex items-center gap-1" style="flex-wrap: wrap;">
                          ${s.key === 'APPLIED' ? `
                            <button class="btn btn-soft btn-sm" style="font-size: 0.72rem; padding: 3px 8px;" onclick="RecruitmentView.advanceStage('${a.id}', 'APPLIED', '${a.candidateId || ''}', '${a.candidateName || ''}', '${a.candidateEmail || ''}', '${a.jobTitle || ''}')">Screen</button>
                            <button class="btn btn-ghost btn-sm" style="font-size: 0.72rem; padding: 3px 6px;" onclick="RecruitmentView.openInterviewModal('${a.id}', '${a.candidateId}', '${a.candidateName}', '${a.jobTitle}')">Interview</button>
                          ` : ''}

                          ${s.key === 'SCREENING' ? `
                            <button class="btn btn-soft btn-sm" style="font-size: 0.72rem; padding: 3px 8px;" onclick="RecruitmentView.advanceStage('${a.id}', 'SCREENING', '${a.candidateId || ''}', '${a.candidateName || ''}', '${a.candidateEmail || ''}', '${a.jobTitle || ''}')">Shortlist</button>
                            <button class="btn btn-ghost btn-sm" style="font-size: 0.72rem; padding: 3px 6px;" onclick="RecruitmentView.openInterviewModal('${a.id}', '${a.candidateId}', '${a.candidateName}', '${a.jobTitle}')">Interview</button>
                          ` : ''}

                          ${s.key === 'SHORTLISTED' ? `
                            <button class="btn btn-primary btn-sm" style="font-size: 0.72rem; padding: 3px 8px;" onclick="RecruitmentView.openInterviewModal('${a.id}', '${a.candidateId}', '${a.candidateName}', '${a.jobTitle}')">Interview</button>
                            <button class="btn btn-soft btn-sm" style="font-size: 0.72rem; padding: 3px 6px;" onclick="RecruitmentView.advanceStage('${a.id}', 'SHORTLISTED', '${a.candidateId || ''}', '${a.candidateName || ''}', '${a.candidateEmail || ''}', '${a.jobTitle || ''}')">Next</button>
                          ` : ''}

                          ${s.key === 'INTERVIEW' ? `
                            <button class="btn btn-primary btn-sm" style="font-size: 0.72rem; padding: 3px 8px;" onclick="RecruitmentView.openFeedbackModal('${a.id}', '${a.candidateId}', '${a.candidateName}', '${a.id}')">Score</button>
                            <button class="btn btn-soft btn-sm" style="font-size: 0.72rem; padding: 3px 6px;" onclick="RecruitmentView.advanceStage('${a.id}', 'INTERVIEW', '${a.candidateId || ''}', '${a.candidateName || ''}', '${a.candidateEmail || ''}', '${a.jobTitle || ''}')">Select</button>
                          ` : ''}

                          ${s.key === 'SELECTED' ? `
                            <button class="btn btn-primary btn-sm" style="font-size: 0.72rem; padding: 3px 8px;" onclick="RecruitmentView.openCreateOfferModal('${a.id}', '${a.candidateId}', '${a.candidateName}', '${a.candidateEmail || ''}', '${a.jobTitle}')">Offer</button>
                            <button class="btn btn-soft btn-sm" style="font-size: 0.72rem; padding: 3px 6px;" onclick="RecruitmentView.advanceStage('${a.id}', 'SELECTED', '${a.candidateId || ''}', '${a.candidateName || ''}', '${a.candidateEmail || ''}', '${a.jobTitle || ''}')">Advance</button>
                          ` : ''}

                          ${s.key === 'OFFER' ? `
                            <button class="btn btn-soft btn-sm" style="font-size: 0.72rem; padding: 3px 8px;" onclick="RecruitmentView.switchTab('offers')">Offer Details</button>
                            <button class="btn btn-primary btn-sm" style="font-size: 0.72rem; padding: 3px 8px; background: var(--success);" onclick="RecruitmentView.hireAndConvertCandidate('${a.id}', '${a.candidateId || ''}', '${a.candidateName || ''}', '${a.candidateEmail || ''}', '${a.jobTitle || ''}')">Hire & Add</button>
                          ` : ''}

                          ${s.key === 'HIRED' ? `
                            ${a.employeeCode ? `
                              <span class="badge badge-success" style="font-size: 0.72rem;">${a.employeeCode}</span>
                              <button class="btn btn-soft btn-sm" style="font-size: 0.7rem; padding: 2px 6px;" onclick="Router.navigate('employees')">Directory</button>
                            ` : `
                              <button class="btn btn-primary btn-sm" style="font-size: 0.72rem; padding: 4px 8px; background: var(--success); font-weight: 600;" onclick="RecruitmentView.hireAndConvertCandidate('${a.id}', '${a.candidateId || ''}', '${a.candidateName || ''}', '${a.candidateEmail || ''}', '${a.jobTitle || ''}')">Add to Employees</button>
                            `}
                          ` : ''}

                          <!-- Quick Move Stage Selector -->
                          <select class="form-control" style="font-size: 0.68rem; padding: 2px 4px; height: 24px; width: auto; max-width: 80px; margin-left: auto; border-radius: var(--radius-sm);" onchange="RecruitmentView.quickMoveStage('${a.id}', this.value, '${a.candidateId || ''}', '${a.candidateName || ''}', '${a.candidateEmail || ''}', '${a.jobTitle || ''}')" title="Change stage">
                            <option value="" disabled selected>Move…</option>
                            <option value="APPLIED">Applied</option>
                            <option value="SCREENING">Screening</option>
                            <option value="SHORTLISTED">Shortlisted</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="SELECTED">Selected</option>
                            <option value="OFFER">Offer</option>
                            <option value="HIRED">Hired (Employee)</option>
                            <option value="REJECTED">Reject Candidate</option>
                          </select>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  async advanceStage(appId, currentStage, candidateId = '', candidateName = '', candidateEmail = '', jobTitle = '') {
    const nextStages = {
      'APPLIED': 'SCREENING',
      'SCREENING': 'SHORTLISTED',
      'SHORTLISTED': 'INTERVIEW',
      'INTERVIEW': 'SELECTED',
      'SELECTED': 'OFFER',
      'OFFER': 'HIRED'
    };

    const next = nextStages[currentStage] || 'SHORTLISTED';
    if (next === 'HIRED') {
      await this.hireAndConvertCandidate(appId, candidateId, candidateName, candidateEmail, jobTitle);
      return;
    }

    try {
      await recruitmentService.updateApplicationStage(appId, next);
      Toast.success(`Candidate advanced to ${next} stage.`);
      Router.navigate('recruitment');
    } catch (e) {
      Toast.error(`Could not advance stage: ${e.message}`);
    }
  },

  async quickMoveStage(appId, newStage, candidateId = '', candidateName = '', candidateEmail = '', jobTitle = '') {
    if (!newStage) return;
    if (newStage === 'HIRED') {
      await this.hireAndConvertCandidate(appId, candidateId, candidateName, candidateEmail, jobTitle);
      return;
    }
    if (newStage === 'REJECTED') {
      if (!confirm(`Are you sure you want to reject this candidate application?`)) return;
      try {
        await recruitmentService.rejectApplication(appId);
        Toast.info('Candidate application marked as Rejected.');
        Router.navigate('recruitment');
      } catch (e) {
        Toast.error(`Failed: ${e.message}`);
      }
      return;
    }
    try {
      await recruitmentService.updateApplicationStage(appId, newStage);
      Toast.success(`Application moved to ${newStage} stage.`);
      Router.navigate('recruitment');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  async hireAndConvertCandidate(appId, candidateId = '', candidateName = '', candidateEmail = '', jobTitle = '') {
    ModalManager.confirm({
      title: `Hire & Add to Employee Directory`,
      message: `Confirm hiring ${candidateName || 'this candidate'} for '${jobTitle || 'Open Role'}'? This will immediately create an active Employee profile with official employee code (e.g. EMP-0014) in the People & Employees directory (#employees).`,
      confirmText: 'Hire & Create Employee',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        try {
          const newEmp = await recruitmentService.convertCandidateToEmployee(
            { candidateId, candidateName, candidateEmail, applicationId: appId, jobTitle },
            { positionTitle: jobTitle, department: 'Technology', branch: 'HQ - Mumbai', joiningDate: new Date().toISOString().slice(0, 10) }
          );
          Toast.success(`${newEmp.fullName} hired! Created official record: ${newEmp.employeeCode} in Employees directory.`);
          Router.navigate('employees');
        } catch (err) {
          Toast.error(`Could not hire candidate: ${err.message}`);
        }
      }
    });
  },

  async deleteApplication(appId, candidateName = '') {
    if (!confirm(`Are you sure you want to remove ${candidateName ? `'${candidateName}'` : 'this application'} from the recruitment pipeline?`)) {
      return;
    }
    try {
      await recruitmentService.deleteApplication(appId);
      Toast.success('Application removed from pipeline.');
      Router.navigate('recruitment');
    } catch (e) {
      Toast.error(`Could not delete application: ${e.message}`);
    }
  },

  async deleteCandidate(candidateId, candidateName = '') {
    if (!confirm(`Are you sure you want to delete candidate profile '${candidateName || 'Candidate'}' and their applications? This action cannot be undone.`)) {
      return;
    }
    try {
      await recruitmentService.deleteCandidate(candidateId);
      Toast.success(`Candidate '${candidateName || 'Candidate'}' deleted from Talent Pool.`);
      Router.navigate('recruitment');
    } catch (e) {
      Toast.error(`Could not delete candidate: ${e.message}`);
    }
  },

  // 2. JOB POSITIONS TAB
  renderJobsTab(jobs) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Job Openings & Positions (${jobs.length})</div>
            <div class="card-subtitle">Published vacancies open for public and internal candidate applications</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="RecruitmentView.openCreateJobModal()">+ Post New Job</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${jobs.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Job Openings Published</div>
              <div class="empty-state-desc">Click "Post New Job" to establish a new hiring requirement.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Work Mode</th>
                  <th>Openings</th>
                  <th>Salary Range</th>
                  <th>Closing Date</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${jobs.map(j => `
                  <tr>
                    <td class="font-bold text-main">${j.title}</td>
                    <td>${j.department}</td>
                    <td>${j.location}</td>
                    <td><span class="badge badge-neutral">${j.workMode}</span></td>
                    <td><strong>${j.openings}</strong></td>
                    <td>${j.salaryRange}</td>
                    <td><span class="font-medium" style="font-size: 0.85rem; color: var(--text-secondary);">${RecruitmentView.formatDate(j.closingDate)}</span></td>
                    <td>
                      <span class="badge ${j.status === 'PUBLISHED' ? 'badge-success' : (j.status === 'CLOSED' ? 'badge-danger' : 'badge-warning')}">
                        <span class="badge-dot"></span> ${j.status === 'PUBLISHED' ? 'Active / Open' : (j.status === 'CLOSED' ? 'Closed' : j.status)}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; align-items: center; gap: 6px;">
                        ${j.status === 'PUBLISHED' ? `
                          <button class="btn btn-soft btn-sm" onclick="RecruitmentView.openAddCandidateModal('${j.id}', '${j.title}')">+ Candidate</button>
                          <button class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: rgba(220, 38, 38, 0.3);" onclick="RecruitmentView.closeJobPosition('${j.id}', '${j.title}')" title="Close this job position">Close Position</button>
                        ` : `
                          <button class="btn btn-soft btn-sm" onclick="RecruitmentView.reopenJobPosition('${j.id}', '${j.title}')">Reopen Position</button>
                        `}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  async closeJobPosition(jobId, jobTitle) {
    if (!confirm(`Are you sure you want to close the job position '${jobTitle}'? Closed positions will no longer accept new candidate applications.`)) {
      return;
    }
    try {
      await recruitmentService.updateJobStatus(jobId, 'CLOSED');
      Toast.success(`Job position '${jobTitle}' closed successfully.`);
      Router.navigate('recruitment');
    } catch (e) {
      Toast.error(`Failed to close position: ${e.message}`);
    }
  },

  async reopenJobPosition(jobId, jobTitle) {
    try {
      await recruitmentService.updateJobStatus(jobId, 'PUBLISHED');
      Toast.success(`Job position '${jobTitle}' reopened and active!`);
      Router.navigate('recruitment');
    } catch (e) {
      Toast.error(`Failed to reopen position: ${e.message}`);
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return 'Open-ended';
    try {
      const clean = String(dateStr).trim().replace(/\s+/g, '-');
      const d = new Date(clean);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  },

  openCreateJobModal() {
    const defaultClosing = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    ModalManager.openModal({
      id: 'create-job-modal',
      title: 'Post New Job Opening',
      subtitle: 'Publish an open role for talent acquisition',
      size: 'lg',
      contentHtml: `
        <form id="post-job-form" onsubmit="event.preventDefault(); RecruitmentView.saveJob()">
          <div class="form-row">
            <div class="col-8 form-group">
              <label class="form-label required">Job Title</label>
              <input type="text" id="job-title" class="form-control" placeholder="e.g. Lead Frontend Engineer" required />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Number of Openings</label>
              <input type="number" id="job-openings" class="form-control" value="2" min="1" required />
            </div>
          </div>

          <div class="form-row">
            <div class="col-4 form-group">
              <label class="form-label required">Department</label>
              <select id="job-dept" class="form-control">
                <option value="Technology">Technology</option>
                <option value="Product">Product</option>
                <option value="Operations">Operations</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Work Mode</label>
              <select id="job-workmode" class="form-control">
                <option value="HYBRID" selected>Hybrid (2 Days Office)</option>
                <option value="ON_SITE">On-Site (Office Hub)</option>
                <option value="REMOTE">100% Remote</option>
              </select>
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Location</label>
              <input type="text" id="job-loc" class="form-control" value="Mumbai, Maharashtra" required />
            </div>
          </div>

          <div class="form-row">
            <div class="col-4 form-group">
              <label class="form-label required">Experience Requirement</label>
              <input type="text" id="job-exp" class="form-control" value="3–6 Years" required />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Target Salary Range (Annual CTC)</label>
              <input type="text" id="job-salary" class="form-control" value="₹10,00,000 – ₹16,00,000" required />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Application Closing Date</label>
              <input type="date" id="job-closing-date" class="form-control" value="${defaultClosing}" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Role Description & Responsibilities</label>
            <textarea id="job-desc" class="form-control" rows="3" placeholder="Core mission and key deliverables..." required></textarea>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="RecruitmentView.saveJob()">Publish Job Opening</button>
      `
    });
  },

  async saveJob() {
    const title = document.getElementById('job-title')?.value.trim();
    const openings = document.getElementById('job-openings')?.value;
    const department = document.getElementById('job-dept')?.value;
    const workMode = document.getElementById('job-workmode')?.value;
    const location = document.getElementById('job-loc')?.value.trim();
    const experience = document.getElementById('job-exp')?.value.trim();
    const salaryRange = document.getElementById('job-salary')?.value.trim();
    const closingDate = document.getElementById('job-closing-date')?.value || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const description = document.getElementById('job-desc')?.value.trim();

    if (!title || !description) return;

    try {
      await recruitmentService.createJob({ title, openings, department, workMode, location, experience, salaryRange, closingDate, description });
      Toast.success(`Job position '${title}' published!`);
      ModalManager.closeModal();
      this.switchTab('jobs');
    } catch (e) {
      Toast.error(`Failed to publish: ${e.message}`);
    }
  },

  // 3. WORKFORCE REQUISITIONS TAB
  renderRequisitionsTab(requisitions) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Workforce Hiring Requisitions (${requisitions.length})</div>
            <div class="card-subtitle">Headcount authorization requests submitted by line managers</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="RecruitmentView.openCreateRequisitionModal()">+ Request Headcount</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${requisitions.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Pending Requisitions</div>
              <div class="empty-state-desc">Click "Request Headcount" to submit a hiring requirement.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Positions</th>
                  <th>Requested By</th>
                  <th>Target Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${requisitions.map(r => `
                  <tr>
                    <td class="font-bold text-main">${r.positionTitle}</td>
                    <td>${r.departmentName}</td>
                    <td><strong>${r.numberOfPositions}</strong></td>
                    <td>${r.requestedBy}</td>
                    <td>${r.targetJoiningDate}</td>
                    <td>
                      <span class="badge ${r.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}">
                        ${r.status}
                      </span>
                    </td>
                    <td>
                      ${r.status !== 'APPROVED' ? `
                        <button class="btn btn-primary btn-sm" onclick="RecruitmentView.approveRequisition('${r.id}')">Approve</button>
                      ` : '<span class="text-muted" style="font-size: 0.8rem;">Approved</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  openCreateRequisitionModal() {
    ModalManager.openModal({
      id: 'create-req-modal',
      title: 'Submit Headcount Requisition',
      subtitle: 'Request budget approval for new personnel hiring',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Target Position / Title</label>
          <input type="text" id="req-title" class="form-control" placeholder="e.g. Senior Backend Engineer" required />
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Department</label>
            <input type="text" id="req-dept" class="form-control" value="Technology" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Headcount Required</label>
            <input type="number" id="req-count" class="form-control" value="1" min="1" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Target Joining Date</label>
          <input type="date" id="req-date" class="form-control" value="2026-11-01" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="RecruitmentView.saveRequisition()">Submit Requisition</button>
      `
    });
  },

  async saveRequisition() {
    const positionTitle = document.getElementById('req-title')?.value.trim();
    const departmentName = document.getElementById('req-dept')?.value.trim();
    const numberOfPositions = Number(document.getElementById('req-count')?.value) || 1;
    const targetJoiningDate = document.getElementById('req-date')?.value;

    if (!positionTitle) return;

    try {
      await recruitmentService.createRequisition({ positionTitle, departmentName, numberOfPositions, targetJoiningDate });
      Toast.success('Requisition submitted for approval!');
      ModalManager.closeModal();
      this.switchTab('requisitions');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  async approveRequisition(id) {
    try {
      await recruitmentService.approveRequisition(id);
      Toast.success('Requisition approved for hiring!');
      Router.navigate('recruitment');
    } catch (e) {
      Toast.error(`Approval failed: ${e.message}`);
    }
  },

  // 4. INTERVIEWS TAB
  renderInterviewsTab(interviews, applications) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Scheduled Candidate Interviews (${interviews.length})</div>
            <div class="card-subtitle">Upcoming video, technical, and executive panel evaluations</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${interviews.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Interviews Scheduled</div>
              <div class="empty-state-desc">Schedule candidate interviews directly from the Kanban pipeline.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position</th>
                  <th>Round</th>
                  <th>Interviewer</th>
                  <th>Date & Time</th>
                  <th>Mode / Venue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${interviews.map(i => `
                  <tr>
                    <td class="font-bold text-main">${i.candidateName || 'Candidate'}</td>
                    <td>${i.jobTitle || 'Open Role'}</td>
                    <td><span class="badge badge-primary">${i.round}</span></td>
                    <td>${i.interviewer}</td>
                    <td><strong>${i.date}</strong> at ${i.time}</td>
                    <td>
                      ${i.status === 'COMPLETED' ? `
                        <span class="badge badge-neutral" style="font-size: 0.78rem;">
                          ${i.interviewType === 'IN_PERSON' ? 'In-Person (Concluded)' : (i.interviewType === 'PHONE' ? 'Phone (Concluded)' : 'Video Call (Ended)')}
                        </span>
                      ` : (i.interviewType === 'IN_PERSON' || !i.meetingLink || !i.meetingLink.startsWith('http')) ? `
                        <span class="badge badge-neutral" style="font-size: 0.78rem;" title="${i.location || 'Office Venue'}">
                          Walk-In: ${i.location || 'Office Venue'}
                        </span>
                      ` : `
                        <a href="${i.meetingLink}" target="_blank" class="btn btn-soft btn-sm">Join Video</a>
                      `}
                    </td>
                    <td><span class="badge ${i.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}">${i.status}</span></td>
                    <td>
                      ${i.status !== 'COMPLETED' ? `
                        <button class="btn btn-primary btn-sm" onclick="RecruitmentView.openFeedbackModal('${i.id}', '${i.candidateId}', '${i.candidateName}', '${i.applicationId}')">Score</button>
                      ` : `
                        <button class="btn btn-soft btn-sm" onclick="RecruitmentView.viewScorecard('${i.id}', '${(i.candidateName || 'Candidate').replace(/'/g, "\\'")}')">View Scorecard</button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  handleInterviewModeChange(mode) {
    const locGroup = document.getElementById('int-location-group');
    const linkGroup = document.getElementById('int-link-group');
    const phoneGroup = document.getElementById('int-phone-group');
    const locInput = document.getElementById('int-location');
    const linkInput = document.getElementById('int-link');
    const phoneInput = document.getElementById('int-phone');

    if (locGroup) locGroup.style.display = mode === 'IN_PERSON' ? 'block' : 'none';
    if (linkGroup) linkGroup.style.display = mode === 'VIDEO' ? 'block' : 'none';
    if (phoneGroup) phoneGroup.style.display = mode === 'PHONE' ? 'block' : 'none';

    if (locInput) locInput.required = mode === 'IN_PERSON';
    if (linkInput) linkInput.required = mode === 'VIDEO';
    if (phoneInput) phoneInput.required = mode === 'PHONE';
  },

  handleInterviewRoundChange(round) {
    const interviewerInput = document.getElementById('int-interviewer');
    const hint = document.getElementById('int-interviewer-hint');
    if (!interviewerInput) return;

    if (round.includes('Round 1')) {
      interviewerInput.value = 'HR Operations';
      if (hint) hint.textContent = 'Round 1 is conducted by HR.';
    } else if (round.includes('Round 2')) {
      interviewerInput.value = 'Team Lead (TL) & Operations';
      if (hint) hint.textContent = 'Round 2 is technical evaluation conducted by TL & Operations.';
    } else if (round.includes('Round 3')) {
      interviewerInput.value = 'Hiring Manager';
      if (hint) hint.textContent = 'Round 3 is conducted by the Hiring Manager.';
    } else if (round.includes('Round 4')) {
      interviewerInput.value = 'Executive Panel / Director';
      if (hint) hint.textContent = 'Round 4 is final approval conducted by Executive Panel.';
    }
  },

  openInterviewModal(applicationId, candidateId, candidateName, jobTitle) {
    ModalManager.openModal({
      id: 'schedule-interview-modal',
      title: `Schedule Interview: ${candidateName}`,
      subtitle: `Setting up evaluation for ${jobTitle}`,
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Interview Mode / Format</label>
            <select id="int-mode" class="form-control" onchange="RecruitmentView.handleInterviewModeChange(this.value)">
              <option value="IN_PERSON" selected>Walk-In / In-Person (Office Venue)</option>
              <option value="VIDEO">Virtual Video Call (Google Meet / Zoom)</option>
              <option value="PHONE">Telephonic Interview</option>
            </select>
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Interview Round</label>
            <select id="int-round" class="form-control" onchange="RecruitmentView.handleInterviewRoundChange(this.value)">
              <option value="Round 1: HR Screening" selected>Round 1: HR Screening</option>
              <option value="Round 2: Technical Assessment (TL & Ops)">Round 2: Technical Assessment (TL & Ops)</option>
              <option value="Round 3: Hiring Manager">Round 3: Hiring Manager</option>
              <option value="Round 4: Executive Panel">Round 4: Executive Panel</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label required">Interviewer / Taken By</label>
          <input type="text" id="int-interviewer" class="form-control" value="HR Operations" placeholder="e.g. HR Manager, Team Lead (TL), Operations Lead" required />
          <div class="form-hint" id="int-interviewer-hint" style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;">
            Round 1 is conducted by HR.
          </div>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Date</label>
            <input type="date" id="int-date" class="form-control" value="${new Date().toISOString().slice(0, 10)}" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Time</label>
            <input type="time" id="int-time" class="form-control" value="14:30" required />
          </div>
        </div>

        <div id="int-location-group" class="form-group">
          <label class="form-label required">Office Location / Venue / Desk</label>
          <input type="text" id="int-location" class="form-control" value="HQ - Mumbai, Floor 4, Meeting Room 2" placeholder="e.g. HQ - Mumbai, Reception Desk / Room 3" required />
        </div>

        <div id="int-link-group" class="form-group" style="display: none;">
          <label class="form-label required">Google Meet / Video Link</label>
          <input type="url" id="int-link" class="form-control" value="https://meet.google.com/xyz-diallo-ats" placeholder="https://meet.google.com/..." />
        </div>

        <div id="int-phone-group" class="form-group" style="display: none;">
          <label class="form-label required">Candidate Contact Number</label>
          <input type="text" id="int-phone" class="form-control" value="+91 98200 12345" placeholder="+91 98..." />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="RecruitmentView.saveInterview('${applicationId}', '${candidateId}', '${candidateName}', '${jobTitle}')">Schedule Interview</button>
      `
    });
  },

  async saveInterview(applicationId, candidateId, candidateName, jobTitle) {
    const round = document.getElementById('int-round')?.value || 'Round 1: HR Screening';
    const mode = document.getElementById('int-mode')?.value || 'IN_PERSON';
    const interviewer = document.getElementById('int-interviewer')?.value.trim() || 'HR Operations';
    const date = document.getElementById('int-date')?.value;
    const time = document.getElementById('int-time')?.value;
    let location = '';
    let meetingLink = '';

    if (mode === 'IN_PERSON') {
      location = document.getElementById('int-location')?.value.trim() || 'HQ - Mumbai, Meeting Room 2';
    } else if (mode === 'VIDEO') {
      meetingLink = document.getElementById('int-link')?.value.trim() || 'https://meet.google.com/xyz-diallo-ats';
      location = 'Google Meet';
    } else {
      location = `Phone: ${document.getElementById('int-phone')?.value.trim() || ''}`;
    }

    try {
      await recruitmentService.scheduleInterview({
        applicationId,
        candidateId,
        candidateName,
        jobTitle,
        round,
        interviewer,
        date,
        time,
        interviewType: mode,
        location,
        meetingLink
      });
      Toast.success(`${mode === 'IN_PERSON' ? 'Walk-in' : 'Virtual'} Interview scheduled and recorded!`);
      ModalManager.closeModal();
      this.switchTab('interviews');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  openFeedbackModal(interviewId, candidateId, candidateName, applicationId) {
    ModalManager.openModal({
      id: 'interview-feedback-modal',
      title: `Interview Scorecard: ${candidateName}`,
      subtitle: 'Submit structured evaluation across key competencies (1 to 5)',
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Technical Rating (1-5)</label>
            <select id="fb-tech" class="form-control">
              <option value="5">5 - Exceptional</option>
              <option value="4" selected>4 - Strong</option>
              <option value="3">3 - Competent</option>
              <option value="2">2 - Needs Work</option>
            </select>
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Communication & Culture</label>
            <select id="fb-comm" class="form-control">
              <option value="5">5 - Outstanding</option>
              <option value="4" selected>4 - Clear & Articulate</option>
              <option value="3">3 - Acceptable</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Hiring Recommendation</label>
          <select id="fb-recom" class="form-control">
            <option value="PASS" selected>PASS (Advance to Selection / Offer)</option>
            <option value="HOLD">HOLD (Consider for other roles)</option>
            <option value="FAIL">REJECT</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Detailed Evaluation Notes</label>
          <textarea id="fb-notes" class="form-control" rows="3" placeholder="Key strengths, architectural problem-solving, and red flags..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="RecruitmentView.saveFeedback('${interviewId}', '${candidateId}', '${applicationId}')">Submit Scorecard</button>
      `
    });
  },

  async saveFeedback(interviewId, candidateId, applicationId) {
    const technicalRating = document.getElementById('fb-tech')?.value;
    const communicationRating = document.getElementById('fb-comm')?.value;
    const recommendation = document.getElementById('fb-recom')?.value;
    const comments = document.getElementById('fb-notes')?.value.trim();

    if (!comments) return;

    try {
      await recruitmentService.submitInterviewFeedback({ interviewId, candidateId, applicationId, technicalRating, communicationRating, recommendation, comments });
      Toast.success('Interview evaluation recorded!');
      ModalManager.closeModal();
      this.switchTab('interviews');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  async viewScorecard(interviewId, candidateName) {
    try {
      const snap = await db.collection('interviewFeedback').where('interviewId', '==', interviewId).limit(1).get();
      if (snap.empty) {
        Toast.info('Scorecard details not found.');
        return;
      }
      const fb = snap.docs[0].data();
      ModalManager.openModal({
        id: 'view-scorecard-modal',
        title: `Interview Scorecard: ${candidateName}`,
        subtitle: `Evaluated by ${fb.interviewerName || 'Panel'} on ${fb.submittedAt ? new Date(fb.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}`,
        contentHtml: `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div style="padding: 12px; background: var(--bg-hover); border-radius: var(--radius-md);">
              <div class="text-secondary" style="font-size: 0.78rem;">Technical Rating</div>
              <div class="font-bold text-main" style="font-size: 1.1rem;">${fb.technicalRating || 4} / 5</div>
            </div>
            <div style="padding: 12px; background: var(--bg-hover); border-radius: var(--radius-md);">
              <div class="text-secondary" style="font-size: 0.78rem;">Communication Rating</div>
              <div class="font-bold text-main" style="font-size: 1.1rem;">${fb.communicationRating || 4} / 5</div>
            </div>
          </div>
          <div style="margin-bottom: 14px;">
            <div class="text-secondary" style="font-size: 0.78rem; margin-bottom: 4px;">Recommendation</div>
            <span class="badge ${fb.recommendation === 'PASS' ? 'badge-success' : (fb.recommendation === 'FAIL' ? 'badge-danger' : 'badge-warning')}" style="font-size: 0.85rem; font-weight: 700;">
              ${fb.recommendation || 'PASS'}
            </span>
          </div>
          <div style="margin-bottom: 8px;">
            <div class="text-secondary" style="font-size: 0.78rem; margin-bottom: 4px;">Evaluation Comments</div>
            <div style="padding: 12px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: var(--radius-md); font-size: 0.88rem; line-height: 1.5; color: var(--text-main);">
              ${fb.comments || 'No written remarks provided.'}
            </div>
          </div>
        `,
        footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close</button>`
      });
    } catch (e) {
      Toast.error(`Could not load scorecard: ${e.message}`);
    }
  },

  // 5. JOB OFFERS TAB
  renderOffersTab(offers, applications) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Job Offers & Pre-Employment Verification (${offers.length})</div>
            <div class="card-subtitle">Formal appointment letters, compensation packages, and employee conversions</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${offers.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Offers Prepared</div>
              <div class="empty-state-desc">Generate job offers for selected candidates from the pipeline.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position</th>
                  <th>Annual CTC</th>
                  <th>Target Joining</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${offers.map(o => `
                  <tr>
                    <td class="font-bold text-main">${o.candidateName}</td>
                    <td>${o.positionTitle}</td>
                    <td><strong style="color: var(--success); font-size: 0.95rem;">₹${(o.annualCtc || 0).toLocaleString('en-IN')}</strong></td>
                    <td>${o.joiningDate}</td>
                    <td>
                      <span class="badge ${o.status === 'ACCEPTED' ? 'badge-success' : (o.status === 'APPROVED' ? 'badge-primary' : 'badge-warning')}">
                        ${o.status}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-1">
                        <button class="btn btn-soft btn-sm" onclick="RecruitmentView.viewOfferLetter('${o.id}', '${o.candidateName}', '${o.positionTitle}', ${o.annualCtc}, '${o.joiningDate}')">Letter</button>
                        ${o.status === 'PENDING_APPROVAL' ? `
                          <button class="btn btn-primary btn-sm" onclick="RecruitmentView.approveOffer('${o.id}')">Approve</button>
                        ` : ''}
                        ${o.status === 'APPROVED' ? `
                          <button class="btn btn-primary btn-sm" onclick="RecruitmentView.acceptOffer('${o.id}', '${o.candidateId}', '${o.applicationId}')">Accept Offer</button>
                        ` : ''}
                        ${o.status === 'ACCEPTED' ? `
                          <button class="btn btn-primary btn-sm" style="background: var(--success);" onclick="RecruitmentView.convertToEmployee('${o.candidateId}', '${o.candidateName}', '${o.candidateEmail}', '${o.positionTitle}', '${o.department}', '${o.branch}', '${o.joiningDate}', '${o.id}', '${o.applicationId}')">Convert to Employee</button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  openCreateOfferModal(applicationId, candidateId, candidateName, candidateEmail, positionTitle) {
    ModalManager.openModal({
      id: 'create-offer-modal',
      title: `Prepare Job Offer: ${candidateName}`,
      subtitle: `Generate formal employment offer for ${positionTitle}`,
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Annual CTC (₹)</label>
            <input type="number" id="offer-ctc" class="form-control" value="1200000" step="50000" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Target Joining Date</label>
            <input type="date" id="offer-join" class="form-control" value="2026-11-01" required />
          </div>
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Department</label>
            <input type="text" id="offer-dept" class="form-control" value="Technology" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Branch / Office Location</label>
            <input type="text" id="offer-loc" class="form-control" value="HQ - Mumbai" required />
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="RecruitmentView.saveOffer('${applicationId}', '${candidateId}', '${candidateName}', '${candidateEmail}', '${positionTitle}')">Generate Offer</button>
      `
    });
  },

  async saveOffer(applicationId, candidateId, candidateName, candidateEmail, positionTitle) {
    const annualCtc = Number(document.getElementById('offer-ctc')?.value) || 1200000;
    const joiningDate = document.getElementById('offer-join')?.value;
    const department = document.getElementById('offer-dept')?.value.trim();
    const branch = document.getElementById('offer-loc')?.value.trim();

    try {
      await recruitmentService.createOffer({ applicationId, candidateId, candidateName, candidateEmail, positionTitle, annualCtc, joiningDate, department, branch });
      Toast.success('Job offer generated and queued for approval!');
      ModalManager.closeModal();
      this.switchTab('offers');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  async approveOffer(offerId) {
    try {
      await recruitmentService.approveOffer(offerId);
      Toast.success('Job offer approved and released to candidate!');
      Router.navigate('recruitment');
    } catch (e) {
      Toast.error(`Approval failed: ${e.message}`);
    }
  },

  async acceptOffer(offerId, candidateId, applicationId) {
    try {
      await recruitmentService.acceptOffer(offerId, candidateId, applicationId);
      Toast.success('Offer accepted! Ready for Pre-Employment verification and onboarding conversion.');
      Router.navigate('recruitment');
    } catch (e) {
      Toast.error(`Acceptance failed: ${e.message}`);
    }
  },

  viewOfferLetter(offerId, name, title, ctc, joiningDate) {
    ModalManager.openModal({
      id: 'view-offer-modal',
      title: `Official Offer Letter: ${name}`,
      subtitle: 'Diallo India Private Limited — Formal Employment Appointment',
      size: 'lg',
      contentHtml: `
        <div style="padding: 24px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 8px; font-family: serif; color: var(--text-main); line-height: 1.6;">
          <div style="border-bottom: 2px solid var(--primary); padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: var(--primary); margin: 0;">DIALLO INDIA PRIVATE LIMITED</h2>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Corporate Headquarters: Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051</div>
          </div>

          <p>Date: <strong>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>
          <p>Dear <strong>${name}</strong>,</p>

          <p>We are delighted to extend this formal offer of employment for the position of <strong>${title}</strong> at Diallo India Private Limited.</p>

          <div style="padding: 16px; background: var(--bg-hover); border-radius: 6px; margin: 16px 0;">
            <div><strong>Position:</strong> ${title}</div>
            <div><strong>Annual Cost to Company (CTC):</strong> ₹${ctc.toLocaleString('en-IN')}</div>
            <div><strong>Monthly Gross:</strong> ₹${Math.round(ctc / 12).toLocaleString('en-IN')}</div>
            <div><strong>Target Joining Date:</strong> ${joiningDate}</div>
            <div><strong>Reporting Location:</strong> HQ - Mumbai</div>
          </div>

          <p>Your employment will be governed by company bylaws, statutory EPF/ESIC provisions, and the standard confidentiality and code of conduct policies.</p>

          <div class="flex justify-between items-end" style="margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border-main);">
            <div>
              <strong>Authorized Signatory</strong><br/>
              <span style="font-size: 0.85rem; color: var(--text-muted);">Human Resources Director</span><br/>
              <em>Diallo India Private Limited</em>
            </div>
            <div>
              <button class="btn btn-secondary btn-sm" onclick="window.print()">Print Offer Letter</button>
            </div>
          </div>
        </div>
      `,
      footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close</button>`
    });
  },

  async convertToEmployee(candidateId, candidateName, candidateEmail, positionTitle, department, branch, joiningDate, offerId, applicationId) {
    ModalManager.confirm({
      title: 'Convert Candidate to Active Employee',
      message: `Are you sure you want to hire ${candidateName}? This will generate their official Employee record in the People Directory (Phase 4) and create onboarding checklist tasks.`,
      confirmText: 'Hire & Onboard',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        try {
          const emp = await recruitmentService.convertCandidateToEmployee(
            { candidateId, candidateName, candidateEmail, applicationId },
            { positionTitle, department, branch, joiningDate }
          );
          Toast.success(`Candidate hired! Generated employee record: ${emp.employeeCode} (${emp.fullName}).`);
          Router.navigate('employees');
        } catch (e) {
          Toast.error(`Conversion failed: ${e.message}`);
        }
      }
    });
  },

  // 6. CANDIDATES DIRECTORY TAB
  renderCandidatesTab(candidates) {
    return `
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="card-title">Talent Pool Database (${candidates.length})</div>
            <div class="card-subtitle">Curated candidate profiles across technology, product, and operations</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${candidates.length > 0 ? `
              <button class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: rgba(220, 38, 38, 0.3);" onclick="RecruitmentView.cleanupTestCandidates()" title="Remove junk or incomplete test candidate entries">
                Purge Test Candidates
              </button>
            ` : ''}
            <button class="btn btn-primary btn-sm" onclick="RecruitmentView.openAddCandidateModal()">+ Add Candidate</button>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${candidates.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Candidate Profiles</div>
              <div class="empty-state-desc">Click "Add Candidate" to register applicants into the talent pool.</div>
            </div>
          ` : `
            <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-main); display: flex; gap: 12px; align-items: center; background: var(--bg-hover);">
              <input type="text" id="talent-search-input" class="form-control" placeholder="Search candidate by name, designation, email, skills..." oninput="RecruitmentView.filterTalentPool(this.value)" style="max-width: 380px; font-size: 0.85rem;" />
              <span class="text-muted" style="font-size: 0.8rem;">Showing <span id="talent-visible-count">${candidates.length}</span> candidate(s)</span>
            </div>
            <table class="data-table" id="talent-pool-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Current Designation</th>
                  <th>Experience</th>
                  <th>Location</th>
                  <th>Contact Email</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${candidates.map(c => {
                  const safeName = (c.fullName || '').replace(/'/g, "\\'");
                  const safeDesig = (c.currentDesignation || 'General Role').replace(/'/g, "\\'");
                  const initials = (c.fullName || 'C').split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'C';
                  const isHired = c.profileStatus === 'HIRED' || !!c.employeeCode;
                  return `
                  <tr class="talent-row" data-search="${((c.fullName || '') + ' ' + (c.currentDesignation || '') + ' ' + (c.email || '') + ' ' + (c.skills || '')).toLowerCase()}">
                    <td class="font-bold text-main">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 30px; height: 30px; border-radius: 50%; background: ${isHired ? 'var(--success-light, #dcfce7)' : 'var(--primary-light, #e0e7ff)'}; color: ${isHired ? 'var(--success)' : 'var(--primary)'}; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0;">
                          ${initials}
                        </div>
                        <div>
                          <div>${c.fullName}</div>
                          ${c.employeeCode ? `<span style="font-size: 0.72rem; color: var(--success); font-weight: 600;">Code: ${c.employeeCode}</span>` : ''}
                        </div>
                      </div>
                    </td>
                    <td>${c.currentDesignation || '—'}</td>
                    <td><strong>${c.totalExperience || 0} Years</strong></td>
                    <td>${c.location || 'Mumbai'}</td>
                    <td>${c.email}</td>
                    <td><span class="badge badge-neutral">${c.source || 'Direct'}</span></td>
                    <td>
                      <span class="badge ${isHired ? 'badge-success' : 'badge-primary'}">
                        ${isHired ? 'HIRED' : (c.profileStatus || 'ACTIVE')}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; align-items: center; gap: 6px;">
                        <button class="btn btn-soft btn-sm" style="font-size: 0.75rem; padding: 4px 8px;" onclick="RecruitmentView.openInterviewModal('', '${c.id}', '${safeName}', '${safeDesig}')" title="Schedule Interview">
                          Interview
                        </button>
                        <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 4px 8px; color: var(--danger); border-color: rgba(220, 38, 38, 0.3);" onclick="RecruitmentView.deleteCandidate('${c.id}', '${safeName}')" title="Delete Candidate">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
                }).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  filterTalentPool(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.talent-row');
    let visible = 0;
    rows.forEach(r => {
      const text = r.getAttribute('data-search') || '';
      const match = !q || text.includes(q);
      r.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    const countEl = document.getElementById('talent-visible-count');
    if (countEl) countEl.textContent = visible;
  },

  async cleanupTestCandidates() {
    ModalManager.confirm({
      title: 'Purge Dummy & Test Candidates',
      message: 'This will scan the Talent Pool for incomplete test candidates (e.g. repeated test names like "aaa", "bbb", "dad dadad", or invalid emails) and permanently remove them along with their test applications. Are you sure?',
      confirmText: 'Purge Test Candidates',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          const count = await recruitmentService.purgeTestCandidates();
          Toast.success(`Purged ${count} test candidate(s).`);
          Router.navigate('recruitment');
        } catch (e) {
          Toast.error(`Purge failed: ${e.message}`);
        }
      }
    });
  },

  openAddCandidateModal(defaultJobId = null, defaultJobTitle = null) {
    ModalManager.openModal({
      id: 'add-candidate-modal',
      title: 'Register Candidate Profile',
      subtitle: 'Add applicant into talent pool with automated duplicate detection',
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">First Name</label>
            <input type="text" id="cand-first" class="form-control" placeholder="Ayan" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Last Name</label>
            <input type="text" id="cand-last" class="form-control" placeholder="Diallo" required />
          </div>
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Email Address</label>
            <input type="email" id="cand-email" class="form-control" placeholder="ayan@diallo.in" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Phone Number</label>
            <input type="tel" id="cand-phone" class="form-control" placeholder="+91 9876543210" required />
          </div>
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Current Designation</label>
            <input type="text" id="cand-desig" class="form-control" value="Frontend Developer" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Total Experience (Years)</label>
            <input type="number" id="cand-exp" class="form-control" value="3" min="0" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Key Skills (comma separated)</label>
          <input type="text" id="cand-skills" class="form-control" value="JavaScript, Firebase, HTML5, CSS3" />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="RecruitmentView.saveCandidate('${defaultJobId || ''}', '${defaultJobTitle || ''}')">Save Candidate</button>
      `
    });
  },

  async saveCandidate(jobId, jobTitle) {
    const firstName = document.getElementById('cand-first')?.value.trim();
    const lastName = document.getElementById('cand-last')?.value.trim();
    const email = document.getElementById('cand-email')?.value.trim();
    const phone = document.getElementById('cand-phone')?.value.trim();
    const currentDesignation = document.getElementById('cand-desig')?.value.trim();
    const totalExperience = Number(document.getElementById('cand-exp')?.value) || 3;
    const skills = document.getElementById('cand-skills')?.value.trim();

    if (!firstName || !email) return;

    try {
      await recruitmentService.createCandidate({ firstName, lastName, email, phone, currentDesignation, totalExperience, skills, jobId, jobTitle });
      Toast.success(`Candidate '${firstName} ${lastName}' registered!`);
      ModalManager.closeModal();
      this.switchTab('pipeline');
    } catch (e) {
      Toast.error(`Registration failed: ${e.message}`);
    }
  }
};

window.RecruitmentView = RecruitmentView;
