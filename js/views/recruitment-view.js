/**
 * DIALLO HRMS — RECRUITMENT & APPLICANT TRACKING SYSTEM (ATS) VIEW (PHASE 9)
 * Job Requisitions, Positions, 8-Stage Kanban Pipeline, Interviews, Assessments, Offers, and Onboarding Handoff
 */

const RecruitmentView = {
  activeTab: 'pipeline',

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
      { key: 'OFFER', label: 'Offer Sent', color: '#0284c7' },
      { key: 'HIRED', label: 'Hired & Onboard', color: 'var(--success)' }
    ];

    return `
      <div style="overflow-x: auto; padding-bottom: 16px;">
        <div style="display: flex; gap: 16px; min-width: 1200px;">
          ${stages.map(s => {
            const appsInStage = applications.filter(a => a.currentStage === s.key);
            return `
              <div style="flex: 1; min-width: 200px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: var(--radius-lg); padding: 12px; display: flex; flex-direction: column;">
                <div class="flex items-center justify-between" style="padding-bottom: 10px; border-bottom: 2px solid ${s.color}; margin-bottom: 12px;">
                  <strong class="text-main" style="font-size: 0.85rem; text-transform: uppercase;">${s.label}</strong>
                  <span class="badge badge-neutral font-bold">${appsInStage.length}</span>
                </div>
                
                <div class="flex flex-col gap-2" style="flex: 1; min-height: 250px;">
                  ${appsInStage.length === 0 ? `
                    <div style="padding: 24px 8px; text-align: center; color: var(--text-muted); font-size: 0.75rem;">No candidates in ${s.label}</div>
                  ` : appsInStage.map(a => `
                    <div class="card" style="padding: 12px; border: 1px solid var(--border-main); box-shadow: var(--shadow-xs); background: var(--bg-surface);">
                      <div class="font-bold text-main" style="font-size: 0.85rem;">${a.candidateName || 'Candidate'}</div>
                      <div class="text-secondary" style="font-size: 0.75rem; margin: 2px 0 6px 0;">${a.jobTitle || 'Open Position'}</div>
                      <div class="flex items-center justify-between" style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 8px;">
                        <span>Source: ${a.source || 'Direct'}</span>
                      </div>
                      <div class="flex items-center gap-1" style="flex-wrap: wrap;">
                        ${s.key !== 'HIRED' ? `
                          <button class="btn btn-soft btn-sm" style="font-size: 0.7rem; padding: 2px 6px;" onclick="RecruitmentView.advanceStage('${a.id}', '${s.key}')">Advance ➔</button>
                        ` : '<span class="badge badge-success" style="font-size: 0.7rem;">✓ Onboarded</span>'}
                        <button class="btn btn-ghost btn-sm" style="font-size: 0.7rem; padding: 2px 4px;" onclick="RecruitmentView.openInterviewModal('${a.id}', '${a.candidateId}', '${a.candidateName}', '${a.jobTitle}')">Interview</button>
                        <button class="btn btn-ghost btn-sm" style="font-size: 0.7rem; padding: 2px 4px;" onclick="RecruitmentView.openCreateOfferModal('${a.id}', '${a.candidateId}', '${a.candidateName}', '${a.candidateEmail || ''}', '${a.jobTitle}')">Offer</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  async advanceStage(appId, currentStage) {
    const nextStages = {
      'APPLIED': 'SCREENING',
      'SCREENING': 'SHORTLISTED',
      'SHORTLISTED': 'INTERVIEW',
      'INTERVIEW': 'SELECTED',
      'SELECTED': 'OFFER',
      'OFFER': 'HIRED'
    };

    const next = nextStages[currentStage] || 'SHORTLISTED';
    try {
      await recruitmentService.updateApplicationStage(appId, next);
      Toast.success(`Candidate advanced to ${next} stage.`);
      Router.navigate('recruitment');
    } catch (e) {
      Toast.error(`Could not advance stage: ${e.message}`);
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
                  <th>Status</th>
                  <th>Actions</th>
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
                    <td><span class="badge badge-success">${j.status}</span></td>
                    <td>
                      <button class="btn btn-soft btn-sm" onclick="RecruitmentView.openAddCandidateModal('${j.id}', '${j.title}')">+ Add Candidate</button>
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

  openCreateJobModal() {
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
            <div class="col-6 form-group">
              <label class="form-label required">Experience Requirement</label>
              <input type="text" id="job-exp" class="form-control" value="3–6 Years" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Target Salary Range (Annual CTC)</label>
              <input type="text" id="job-salary" class="form-control" value="₹10,00,000 – ₹16,00,000" required />
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
    const description = document.getElementById('job-desc')?.value.trim();

    if (!title || !description) return;

    try {
      await recruitmentService.createJob({ title, openings, department, workMode, location, experience, salaryRange, description });
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
                      ` : '<span class="text-muted" style="font-size: 0.8rem;">✓ Approved</span>'}
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
                  <th>Meeting Link</th>
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
                    <td><a href="${i.meetingLink}" target="_blank" class="btn btn-soft btn-sm">Join Video</a></td>
                    <td><span class="badge ${i.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}">${i.status}</span></td>
                    <td>
                      ${i.status !== 'COMPLETED' ? `
                        <button class="btn btn-primary btn-sm" onclick="RecruitmentView.openFeedbackModal('${i.id}', '${i.candidateId}', '${i.candidateName}', '${i.applicationId}')">Score</button>
                      ` : '<span class="text-muted" style="font-size: 0.8rem;">✓ Scored</span>'}
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

  openInterviewModal(applicationId, candidateId, candidateName, jobTitle) {
    ModalManager.openModal({
      id: 'schedule-interview-modal',
      title: `Schedule Interview: ${candidateName}`,
      subtitle: `Setting up evaluation for ${jobTitle}`,
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Interview Round</label>
          <select id="int-round" class="form-control">
            <option value="Round 1: HR Screening">Round 1: HR Screening</option>
            <option value="Round 2: Technical Assessment" selected>Round 2: Technical Assessment</option>
            <option value="Round 3: Hiring Manager">Round 3: Hiring Manager</option>
            <option value="Round 4: Executive Panel">Round 4: Executive Panel</option>
          </select>
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
        <div class="form-group">
          <label class="form-label required">Google Meet / Video Link</label>
          <input type="url" id="int-link" class="form-control" value="https://meet.google.com/xyz-diallo-ats" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="RecruitmentView.saveInterview('${applicationId}', '${candidateId}', '${candidateName}', '${jobTitle}')">Schedule Interview</button>
      `
    });
  },

  async saveInterview(applicationId, candidateId, candidateName, jobTitle) {
    const round = document.getElementById('int-round')?.value;
    const date = document.getElementById('int-date')?.value;
    const time = document.getElementById('int-time')?.value;
    const meetingLink = document.getElementById('int-link')?.value.trim();

    try {
      await recruitmentService.scheduleInterview({ applicationId, candidateId, candidateName, jobTitle, round, date, time, meetingLink });
      Toast.success('Interview scheduled and invite dispatched!');
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
            <option value="PASS" selected>🌟 PASS (Advance to Selection / Offer)</option>
            <option value="HOLD">⏸ HOLD (Consider for other roles)</option>
            <option value="FAIL">❌ REJECT</option>
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
                          <button class="btn btn-primary btn-sm" style="background: var(--success);" onclick="RecruitmentView.convertToEmployee('${o.candidateId}', '${o.candidateName}', '${o.candidateEmail}', '${o.positionTitle}', '${o.department}', '${o.branch}', '${o.joiningDate}', '${o.id}', '${o.applicationId}')">✓ Convert to Employee</button>
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
              <button class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print Offer Letter</button>
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
        <div class="card-header">
          <div>
            <div class="card-title">Talent Pool Database (${candidates.length})</div>
            <div class="card-subtitle">Curated candidate profiles across technology, product, and operations</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="RecruitmentView.openAddCandidateModal()">+ Add Candidate</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${candidates.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Candidate Profiles</div>
              <div class="empty-state-desc">Click "Add Candidate" to register applicants into the talent pool.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Current Designation</th>
                  <th>Experience</th>
                  <th>Location</th>
                  <th>Contact Email</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${candidates.map(c => `
                  <tr>
                    <td class="font-bold text-main">${c.fullName}</td>
                    <td>${c.currentDesignation}</td>
                    <td><strong>${c.totalExperience} Years</strong></td>
                    <td>${c.location}</td>
                    <td>${c.email}</td>
                    <td><span class="badge badge-neutral">${c.source}</span></td>
                    <td><span class="badge badge-success">${c.profileStatus || 'ACTIVE'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
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
