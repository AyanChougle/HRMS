/**
 * DIALLO HRMS — TRAINING, TRAINEES & TRAINERS MODULE VIEW (L&D)
 * Comprehensive Trainee Cohorts, Mentor Directory, Curriculum Programs, and Employee Learning Track
 */

const TrainingView = {
  activeTab: 'trainees', // 'trainees', 'trainers', 'programs', 'my_learning'
  currentFilters: {
    status: 'ALL',
    department: 'ALL',
    search: ''
  },

  async renderHub() {
    const rawRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    const isTrainee = rawRole === 'TRAINEE';
    const isTrainer = rawRole === 'TRAINER' || rawRole === 'MENTOR';
    const isEmployee = rawRole === 'EMPLOYEE' || isTrainee;
    const currentEmpEmail = AuthGuard.userProfile?.email || AuthGuard.currentUser?.email;
    const currentEmpName = AuthGuard.userProfile?.displayName || 'Employee';

    if (isTrainee && (this.activeTab === 'trainees' || this.activeTab === 'trainers')) {
      this.activeTab = 'my_learning';
    } else if (isTrainer && this.activeTab === 'my_learning') {
      this.activeTab = 'trainees';
    } else if (isEmployee && this.activeTab === 'trainees') {
      this.activeTab = 'my_learning';
    }

    let trainees = [];
    let trainers = [];
    let programs = [];

    try {
      [trainees, trainers, programs] = await Promise.all([
        trainingService.getTrainees(),
        trainingService.getTrainers(),
        trainingService.getPrograms()
      ]);
    } catch (e) {
      console.warn('Error loading training datasets:', e);
    }

    // KPI Metrics
    const totalTrainees = trainees.length;
    const inTrainingCount = trainees.filter(t => t.status === 'IN_TRAINING').length;
    const certifiedCount = trainees.filter(t => t.status === 'CERTIFIED').length;
    const totalTrainers = trainers.length;
    const totalPrograms = programs.length;
    const avgProgress = totalTrainees > 0 
      ? Math.round(trainees.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) / totalTrainees)
      : 0;

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">${isTrainee ? 'My Learning & Mentorship' : (isTrainer ? 'Trainer Command Center' : (isEmployee ? 'My Learning & Mentorship' : 'Trainees & Trainers (L&D)'))}</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">${isTrainee ? 'My Trainee Curriculum & Mentorship' : (isTrainer ? 'Trainer Command Center & Trainee Batches' : (isEmployee ? 'My Training, Mentorship & Certifications' : 'Trainee Cohorts & Trainer Directory'))}</h1>
            <p class="page-subtitle">${isTrainee ? 'Track your onboarding curriculum, mentorship milestones, practical modules, and certification readiness' : (isTrainer ? 'Manage and assess your assigned trainees, track milestone submissions, and conduct syllabus modules' : (isEmployee ? 'Track your onboarding curriculum, mentorship milestones, practical modules, and certification readiness' : 'Manage graduate trainee cohorts, mentor directory, curriculum milestones, assessments, and certifications'))}</p>
          </div>
          <div class="page-actions">
            ${isTrainer ? `
              <button class="btn btn-secondary btn-sm" onclick="TrainingView.openAddProgramModal()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                + Create Program
              </button>
              <button class="btn btn-primary btn-sm" onclick="TrainingView.openAddTraineeModal()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                + Add Trainee
              </button>
            ` : (!isEmployee ? `
              <button class="btn btn-secondary btn-sm" onclick="TrainingView.openAddTrainerModal()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                + Add Trainer
              </button>
              <button class="btn btn-primary btn-sm" onclick="TrainingView.openAddTraineeModal()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                + Add Trainee
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="TrainingView.openMentorConnectModal()">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                Connect with Mentor
              </button>
            `)}
          </div>
        </div>
      </div>

      <!-- KPI Overview Grid (Hidden for Trainee) -->
      ${!isTrainee ? `
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">${inTrainingCount} Active</span>
          </div>
          <div class="kpi-value">${totalTrainees}</div>
          <div class="kpi-label">Total Trainees &amp; Interns</div>
          <div class="kpi-subtitle">Across engineering, HR &amp; finance</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Mentors</span>
          </div>
          <div class="kpi-value">${totalTrainers}</div>
          <div class="kpi-label">Certified Trainers</div>
          <div class="kpi-subtitle">Internal leads &amp; external experts</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Active</span>
          </div>
          <div class="kpi-value">${totalPrograms}</div>
          <div class="kpi-label">Curriculum Tracks</div>
          <div class="kpi-subtitle">Structured syllabus &amp; batches</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">${certifiedCount} Certified</span>
          </div>
          <div class="kpi-value">${avgProgress}%</div>
          <div class="kpi-label">Average Cohort Progress</div>
          <div class="kpi-subtitle">Completion &amp; readiness score</div>
        </div>
      </div>
      ` : ''}

      <!-- Navigation Tabs -->
      <div class="tab-nav" style="margin-bottom: 20px;">
        ${!isTrainee && !isEmployee && !isTrainer ? `
          <button class="tab-btn ${this.activeTab === 'trainees' ? 'active' : ''}" onclick="TrainingView.switchTab('trainees')">
            Trainees & Interns (${totalTrainees})
          </button>
          <button class="tab-btn ${this.activeTab === 'trainers' ? 'active' : ''}" onclick="TrainingView.switchTab('trainers')">
            Trainers & Mentors (${totalTrainers})
          </button>
          <button class="tab-btn ${this.activeTab === 'programs' ? 'active' : ''}" onclick="TrainingView.switchTab('programs')">
            Training Programs (${totalPrograms})
          </button>
        ` : (isTrainer ? `
          <button class="tab-btn ${this.activeTab === 'trainees' ? 'active' : ''}" onclick="TrainingView.switchTab('trainees')">
            My Trainees & Batches (${totalTrainees})
          </button>
          <button class="tab-btn ${this.activeTab === 'attendance' ? 'active' : ''}" onclick="TrainingView.switchTab('attendance')">
            Attendance &amp; Marks
          </button>
          <button class="tab-btn ${this.activeTab === 'programs' ? 'active' : ''}" onclick="TrainingView.switchTab('programs')">
            Curriculum Programs (${totalPrograms})
          </button>
        ` : '')}
        <button class="tab-btn ${this.activeTab === 'my_learning' ? 'active' : ''}" onclick="TrainingView.switchTab('my_learning')">
          ${isTrainee ? 'My Learning Track & Modules' : (isEmployee ? 'My Learning & Mentorship' : 'Trainee Learning Track (Preview)')}
        </button>
      </div>

      <!-- Active Tab Content View -->
      <div class="tab-content animate-fade-in">
        ${this.renderActiveTab(trainees, trainers, programs, isEmployee)}
      </div>
    `;
  },

  switchTab(tabKey) {
    this.activeTab = tabKey;
    if (window.Router) Router.navigate('training');
  },

  renderActiveTab(trainees, trainers, programs, isEmployee) {
    switch (this.activeTab) {
      case 'trainers':
        return this.renderTrainersTab(trainers);
      case 'programs':
        return this.renderProgramsTab(programs);
      case 'my_learning':
        return this.renderMyLearningTab(trainees, trainers, programs);
      case 'attendance':
        return this.renderAttendanceTab(trainees);
      case 'trainees':
      default:
        return this.renderTraineesTab(trainees, trainers);
    }
  },

  // 1. TRAINEES TAB
  renderTraineesTab(trainees, trainers) {
    return `
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="card-title">Trainee & Intern Roster</div>
            <div class="card-subtitle">Active cohort members, curriculum tracks, assigned mentors, and milestone completion</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="TrainingView.exportTraineesCSV()">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export CSV
            </button>
            <button class="btn btn-primary btn-sm" onclick="TrainingView.openAddTraineeModal()">
              + Add Trainee
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Trainee Details</th>
                <th>Track & Cohort</th>
                <th>Department</th>
                <th>Assigned Mentor</th>
                <th>Day &amp; Progress</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${trainees.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 48px 16px;">
                    <div style="color: var(--text-muted); font-size: 0.95rem;">No trainees enrolled yet. Click "+ Add Trainee" to onboard your first cohort.</div>
                  </td>
                </tr>
              ` : trainees.map(t => {
                const curDay = Number(t.currentDay) || 1;
                const statusBadge = t.status === 'HANDED_OVER'
                  ? 'badge-success'
                  : (t.status === 'CERTIFIED'
                    ? 'badge-primary'
                    : (t.status === 'IN_EVALUATION' ? 'badge-warning' : 'badge-neutral'));
                const statusLabel = t.status === 'HANDED_OVER'
                  ? 'Handed Over to Floor'
                  : (t.status === 'CERTIFIED'
                    ? 'Certified Trainee'
                    : (t.status === 'IN_EVALUATION' ? 'In Evaluation' : `Day ${curDay} Active`));

                return `
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-cell-avatar" style="background: var(--primary-light); color: var(--primary); font-weight: 700;">
                          ${(t.fullName || 'T').substring(0, 2).toUpperCase()}
                        </div>
                        <div class="user-cell-info">
                          <span class="user-cell-name font-semibold">${t.fullName}</span>
                          <span class="user-cell-email text-muted" style="font-size: 0.75rem; font-family: var(--font-family-mono);">${t.traineeCode} • ${t.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="font-medium">${t.track || '7-Day Core Track'}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${t.batchName || 'Diallo Onboarding'}</div>
                    </td>
                    <td>
                      <span class="badge badge-primary">${t.department || 'Operations'}</span>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--bg-hover); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: var(--text-secondary);">
                          ${(t.trainerName || 'M').substring(0, 1)}
                        </div>
                        <span class="font-medium" style="font-size: 0.85rem;">${t.trainerName || 'Unassigned Mentor'}</span>
                      </div>
                    </td>
                    <td style="min-width: 170px;">
                      <div class="flex items-center justify-between" style="font-size: 0.8rem; margin-bottom: 4px;">
                        <span><strong>Day ${curDay}</strong> of 7</span>
                        <strong style="color: var(--primary);">${t.progress || Math.round((curDay / 7) * 100)}%</strong>
                      </div>
                      <div style="width: 100%; height: 6px; background: var(--border-main); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${t.progress || Math.round((curDay / 7) * 100)}%; height: 100%; background: ${t.status === 'HANDED_OVER' ? 'var(--success)' : 'var(--primary)'}; border-radius: 3px;"></div>
                      </div>
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                        ${(t.currentModuleTitle || 'Syllabus Module').slice(0, 28)}...
                      </div>
                    </td>
                    <td>
                      <span class="badge ${statusBadge}">
                        <span class="badge-dot"></span>
                        ${statusLabel}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end;">
                        ${curDay < 7 && t.status !== 'HANDED_OVER' ? `
                          <button class="btn btn-primary btn-sm" onclick="TrainingView.advanceTraineeDay('${t.id}', ${curDay})" title="Advance to Day ${curDay + 1}">
                            Advance Day (${curDay + 1}/7)
                          </button>
                        ` : ''}
                        ${t.status !== 'CERTIFIED' && t.status !== 'HANDED_OVER' ? `
                          <button class="btn btn-secondary btn-sm" onclick="TrainingView.openCertifyModal('${t.id}', '${(t.fullName || '').replace(/'/g, "\\'")}')" title="Award Day 6 Certification">
                            Certify
                          </button>
                        ` : ''}
                        ${t.status !== 'HANDED_OVER' ? `
                          <button class="btn btn-soft btn-sm" onclick="TrainingView.openHandoverModal('${t.id}', '${(t.fullName || '').replace(/'/g, "\\'")}', '${(t.department || 'Operations').replace(/'/g, "\\'")}')" title="Complete Day 7 Floor Handover">
                            Handover
                          </button>
                        ` : ''}
                        <button class="btn btn-soft btn-sm" onclick="TrainingView.openEvaluateModal('${t.id}', '${(t.fullName || '').replace(/'/g, "\\'")}', ${t.progress || 0})">
                          Evaluate
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="TrainingView.deleteTrainee('${t.id}')" title="Delete record">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 2. TRAINERS & MENTORS TAB
  renderTrainersTab(trainers) {
    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
        ${trainers.map(tr => `
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div class="card-body" style="padding: 20px;">
              <div class="flex items-start justify-between" style="margin-bottom: 14px;">
                <div class="flex items-center gap-3">
                  <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--primary), var(--info)); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem;">
                    ${tr.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin: 0 0 2px 0;">${tr.fullName}</h3>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">${tr.designation}</div>
                  </div>
                </div>
                <span class="badge ${tr.trainerType === 'EXTERNAL' ? 'badge-neutral' : 'badge-primary'}">
                  ${tr.trainerType === 'EXTERNAL' ? 'External Expert' : 'Internal Lead'}
                </span>
              </div>

              <div style="background: var(--bg-hover); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 14px;">
                <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">Specialization</div>
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">${tr.specialization}</div>
              </div>

              <p style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">
                ${tr.bio || 'Instructional lead guiding professional curriculum and engineering best practices.'}
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; border-top: 1px solid var(--border-main); padding-top: 12px; margin-bottom: 14px;">
                <div>
                  <div style="font-size: 1.1rem; font-weight: 700; color: var(--primary);">${tr.batchesConducted || 0}</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">Batches</div>
                </div>
                <div>
                  <div style="font-size: 1.1rem; font-weight: 700; color: var(--info);">${tr.activeTrainees || 0}</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">Mentees</div>
                </div>
                <div>
                  <div style="font-size: 1.1rem; font-weight: 700; color: #d97706;">${tr.rating || '5.0'} / 5</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">Rating</div>
                </div>
              </div>

              <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px;">
                <div class="flex items-center gap-2">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <span>${tr.email}</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <span>${tr.phone}</span>
                </div>
              </div>
            </div>
            <div class="card-footer" style="padding: 12px 20px; background: var(--bg-hover); border-top: 1px solid var(--border-main); display: flex; justify-content: space-between;">
              <button class="btn btn-secondary btn-sm" onclick="TrainingView.openAssignTraineeModal('${tr.id}', '${tr.fullName}')">
                Assign Trainee
              </button>
              <button class="btn btn-secondary btn-sm" onclick="TrainingView.deleteTrainer('${tr.id}')" title="Delete trainer">
                Delete
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // 3. PROGRAMS TAB
  renderProgramsTab(programs) {
    return `
      <div style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
        <button class="btn btn-primary btn-sm" onclick="TrainingView.openAddProgramModal()">
          + Create Training Program
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px;">
        ${programs.map(prg => `
          <div class="card">
            <div class="card-body" style="padding: 20px;">
              <div class="flex items-center justify-between" style="margin-bottom: 10px;">
                <span class="badge badge-primary">${prg.category}</span>
                <span class="badge ${prg.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}">
                  ${prg.status || 'ACTIVE'}
                </span>
              </div>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
                ${prg.title}
              </h3>
              <p style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">
                ${prg.description}
              </p>

              <div style="display: flex; gap: 16px; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px; flex-wrap: wrap;">
                <div><strong>Duration:</strong> ${prg.duration}</div>
                <div><strong>Mode:</strong> ${prg.mode}</div>
                <div><strong>Enrolled:</strong> ${prg.enrolledCount || 0} Trainees</div>
              </div>

              <div style="border-top: 1px solid var(--border-main); padding-top: 12px;">
                <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">Curriculum Syllabus Modules</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 0.82rem; color: var(--text-main); display: flex; flex-direction: column; gap: 4px;">
                  ${(prg.modules || []).map(m => `<li>${m}</li>`).join('')}
                </ul>
              </div>
            </div>
            <div class="card-footer" style="padding: 12px 20px; background: var(--bg-hover); border-top: 1px solid var(--border-main); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; color: var(--text-muted);">Lead: <strong>${prg.trainerName || 'Assigned Mentor'}</strong></span>
              <button class="btn btn-secondary btn-sm" onclick="TrainingView.deleteProgram('${prg.id}')">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // 4. EMPLOYEE / TRAINEE LEARNING TAB — 7-DAY CORE CURRICULUM
  renderMyLearningTab(trainees, trainers, programs) {
    const rawRole = (AuthGuard._previewRoleId || AuthGuard.userProfile?.roleId || 'EMPLOYEE').toString().toUpperCase().trim();
    const isTrainer = rawRole === 'TRAINER' || rawRole === 'MENTOR';
    const userEmail = (AuthGuard.userProfile?.email || AuthGuard.currentUser?.email || '').toLowerCase();
    const userName = AuthGuard.userProfile?.displayName || 'Trainee';

    // Find personal trainee record or fallback
    const myTraineeRecord = trainees.find(t => t.email && t.email.toLowerCase() === userEmail) || trainees[0] || {
      fullName: userName,
      traineeCode: 'TRN-2026',
      track: '7-Day Core Training Modules',
      department: 'Operations',
      trainerName: 'Lead Trainer',
      currentDay: 1,
      progress: 0,
      completedModules: 0,
      totalModules: 7,
      status: 'IN_TRAINING',
      batchName: 'Diallo Trainee Cohort 2026',
      startDate: new Date().toISOString().slice(0, 10),
      targetEndDate: '2026-12-31'
    };

    const curDay = Number(myTraineeRecord.currentDay) || 1;
    const progressPercent = myTraineeRecord.progress || Math.round((curDay / 7) * 100);

    const myTrainer = trainers.find(tr => tr.fullName === myTraineeRecord.trainerName) || trainers[0] || {
      fullName: myTraineeRecord.trainerName || 'Assigned Lead Trainer',
      designation: 'Senior Technical & Operations Trainer',
      specialization: 'Financial Markets, Crypto & Operations',
      email: 'trainer@diallo.in',
      phone: '9372868617'
    };

    const modules = (typeof trainingService !== 'undefined' && trainingService.SEVEN_DAY_MODULES) 
      ? trainingService.SEVEN_DAY_MODULES 
      : [];

    return `
      <!-- 7-Day Curriculum Stepper Bar -->
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(37,99,235,0.06), rgba(15,23,42,0.02)); border: 1px solid var(--border-main);">
        <div class="card-body" style="padding: 24px;">
          <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 16px; margin-bottom: 20px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span class="badge badge-primary" style="font-weight: 700;">7-DAY ONBOARDING CURRICULUM</span>
                <span class="badge ${myTraineeRecord.status === 'HANDED_OVER' ? 'badge-success' : (myTraineeRecord.status === 'CERTIFIED' ? 'badge-primary' : 'badge-neutral')}">
                  ${myTraineeRecord.status === 'HANDED_OVER' ? 'Handed Over to Floor' : (myTraineeRecord.status === 'CERTIFIED' ? 'Certified Graduate' : `Day ${curDay} in Progress`)}
                </span>
              </div>
              <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0;">${myTraineeRecord.track || '7-Day Core Training Track'}</h2>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">
                Trainee: <strong>${myTraineeRecord.fullName}</strong> (${myTraineeRecord.traineeCode || 'TRN'}) • Department: <strong>${myTraineeRecord.department || 'Operations'}</strong> • Shift: <strong>10:00 AM – 07:00 PM</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 2.2rem; font-weight: 800; color: var(--primary); font-family: var(--font-family-mono);">${progressPercent}%</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">Curriculum Completion</div>
            </div>
          </div>

          <!-- Stepper Dots Bar (Days 1 to 7) -->
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-top: 14px;">
            ${modules.map(m => {
              const isPassed = m.day < curDay;
              const isCurrent = m.day === curDay;
              return `
                <div style="text-align: center;">
                  <div style="height: 6px; border-radius: 3px; background: ${isPassed ? 'var(--success)' : (isCurrent ? 'var(--primary)' : 'var(--border-main)')}; margin-bottom: 6px;"></div>
                  <div style="font-size: 0.75rem; font-weight: ${isCurrent ? '800' : '600'}; color: ${isPassed ? 'var(--success)' : (isCurrent ? 'var(--primary)' : 'var(--text-muted)')};">
                    Day ${m.day}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Main Layout: Left = 7 Days List, Right = Mentor & Certification -->
      <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start;">
        
        <!-- Left: 7-Day Day-by-Day Module Stepper Cards -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${modules.map(m => {
            const isPassed = m.day < curDay;
            const isCurrent = m.day === curDay;
            const cardBorder = isCurrent 
              ? 'border-left: 4px solid var(--primary); box-shadow: 0 0 0 1px var(--primary-light);' 
              : (isPassed ? 'border-left: 4px solid var(--success);' : 'border-left: 4px solid var(--border-main); opacity: 0.85;');

            return `
              <div class="card" style="${cardBorder}">
                <div class="card-body" style="padding: 20px;">
                  <div class="flex items-start justify-between" style="gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                    <div class="flex items-center gap-3">
                      <div style="width: 36px; height: 36px; border-radius: 50%; background: ${isPassed ? 'var(--success-light)' : (isCurrent ? 'var(--primary-light)' : 'var(--bg-hover)')}; color: ${isPassed ? 'var(--success)' : (isCurrent ? 'var(--primary)' : 'var(--text-muted)')}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem; flex-shrink: 0;">
                        ${isPassed ? `
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                          </svg>
                        ` : m.day}
                      </div>
                      <div>
                        <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">Day ${m.day} Module</div>
                        <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0;">${m.title}</h3>
                      </div>
                    </div>
                    <div>
                      <span class="badge ${isPassed ? 'badge-success' : (isCurrent ? 'badge-primary' : 'badge-neutral')}">
                        ${isPassed ? 'Cleared' : (isCurrent ? 'Today Active' : 'Upcoming')}
                      </span>
                    </div>
                  </div>

                  <div style="display: flex; gap: 16px; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px; flex-wrap: wrap;">
                    <div><strong>Shift Duration:</strong> ${m.duration}</div>
                    <div><strong>Objective:</strong> ${m.learningObjectives}</div>
                  </div>

                  <div style="background: var(--bg-hover); border-radius: var(--radius-sm); padding: 12px 16px;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">Day ${m.day} Syllabus &amp; Key Topics</div>
                    <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: var(--text-main); display: flex; flex-direction: column; gap: 4px; line-height: 1.45;">
                      ${m.topics.map(t => `<li>${t}</li>`).join('')}
                    </ul>
                  </div>
                  ${(isTrainer && isCurrent && curDay < 7) ? `
                    <div style="margin-top: 16px; border-top: 1px dashed var(--border-main); padding-top: 14px; display: flex; justify-content: flex-end;">
                      <button class="btn btn-primary" onclick="TrainingView.advanceTraineeDay('${myTraineeRecord.id}', ${curDay})">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        Mark Day ${curDay} Complete
                      </button>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Right Column: Mentor & Certification -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Assigned Mentor Profile Card -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Assigned Training Mentor</div>
                <div class="card-subtitle">Dedicated trainer & curriculum evaluator</div>
              </div>
            </div>
            <div class="card-body" style="padding: 20px; text-align: center;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: inline-flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; margin-bottom: 12px;">
                ${(myTrainer.fullName || 'M').substring(0, 2).toUpperCase()}
              </div>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin: 0 0 4px 0;">${myTrainer.fullName}</h3>
              <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">${myTrainer.designation}</div>
              
              <div class="badge badge-primary" style="margin-bottom: 16px;">
                ${myTrainer.specialization}
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 0.82rem; background: var(--bg-hover); padding: 12px 14px; border-radius: var(--radius-sm); margin-bottom: 16px;">
                <div class="flex items-center gap-2">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                  <span>Diallo % — HQ - Mumbai</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <span><strong>HR Helpline:</strong> 9372868617</span>
                </div>
              </div>

              <button class="btn btn-primary btn-sm" style="width: 100%; justify-content: center;" onclick="TrainingView.openMentorConnectModal('${myTrainer.fullName}')">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Book 1-on-1 Review
              </button>
            </div>
          </div>

          <!-- Training Certification Status Card -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Certification & Handover</div>
                <div class="card-subtitle">Official training credential</div>
              </div>
            </div>
            <div class="card-body" style="padding: 20px; text-align: center;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: ${myTraineeRecord.status === 'HANDED_OVER' ? 'var(--success-light)' : (myTraineeRecord.status === 'CERTIFIED' ? 'var(--primary-light)' : 'var(--bg-hover)')}; color: ${myTraineeRecord.status === 'HANDED_OVER' ? 'var(--success)' : (myTraineeRecord.status === 'CERTIFIED' ? 'var(--primary)' : 'var(--text-muted)')}; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
              </div>
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin-bottom: 4px;">
                ${myTraineeRecord.status === 'HANDED_OVER' ? 'Handed Over to Production Floor' : (myTraineeRecord.status === 'CERTIFIED' ? 'Certified Trainee Graduate' : `In Training (Day ${curDay}/7)`)}
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px; line-height: 1.45;">
                ${myTraineeRecord.status === 'HANDED_OVER' ? 'Transitioned to live operations with complete handover sign-off.' : (myTraineeRecord.status === 'CERTIFIED' ? 'Day 6 Benchmark Mock Call and Theory examinations passed.' : 'Complete Day 6 Certification viva and Day 7 Floor Handover to graduate.')}
              </p>
              <div style="font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-hover); padding: 8px 10px; border-radius: var(--radius-sm);">
                <strong>Milestones:</strong> Day 6 = Certification • Day 7 = Floor Handover
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  },

  // PROGRESSION ACTION HANDLERS
  async advanceTraineeDay(traineeId, currentDay) {
    try {
      await trainingService.advanceTraineeDay(traineeId, currentDay);
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not advance day: ' + (e.message || e));
    }
  },

  openCertifyModal(traineeId, fullName) {
    const modalHtml = `
      <form id="certify-trainee-form" onsubmit="event.preventDefault(); TrainingView.submitCertify('${traineeId}');">
        <p style="margin-bottom: 16px; font-size: 0.9rem; color: var(--text-secondary);">
          Award official Day 6 Certification to <strong>${fullName}</strong> upon completion of theory exams and live benchmark mock calls.
        </p>
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label">Evaluation Score / Rating (1 to 5) *</label>
          <select id="cert-rating" class="form-control" required>
            <option value="5">5.0 - Exceptional (Exceeds Standards)</option>
            <option value="4">4.0 - Proficient (Meets Standards)</option>
            <option value="3">3.0 - Satisfactory</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label">Mentor Certification Remarks</label>
          <textarea id="cert-notes" class="form-control" rows="3" placeholder="Enter evaluation notes, call quality observations and certification approval remarks..."></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Award Official Certification</button>
        </div>
      </form>
    `;
    ModalManager.openModal({
      id: 'certify-trainee-modal',
      title: 'Award Day 6 Trainee Certification',
      subtitle: fullName,
      contentHtml: modalHtml,
      size: 'md'
    });
  },

  async submitCertify(traineeId) {
    try {
      const rating = document.getElementById('cert-rating').value;
      const notes = document.getElementById('cert-notes').value;
      await trainingService.certifyTrainee(traineeId, rating, notes);
      ModalManager.closeModal();
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not certify trainee: ' + (e.message || e));
    }
  },

  openHandoverModal(traineeId, fullName, defaultDept) {
    const modalHtml = `
      <form id="handover-trainee-form" onsubmit="event.preventDefault(); TrainingView.submitHandover('${traineeId}');">
        <p style="margin-bottom: 16px; font-size: 0.9rem; color: var(--text-secondary);">
          Complete official <strong>Day 7 Floor Handover</strong> for <strong>${fullName}</strong>. Trainee will transition from training track to live production operations.
        </p>
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label">Assigned Production Department *</label>
          <select id="hnd-dept" class="form-control" required>
            <option value="Operations" ${defaultDept === 'Operations' ? 'selected' : ''}>Operations</option>
            <option value="Digital Team" ${defaultDept === 'Digital Team' ? 'selected' : ''}>Digital Team</option>
            <option value="Sales" ${defaultDept === 'Sales' ? 'selected' : ''}>Sales</option>
            <option value="Real Estate" ${defaultDept === 'Real Estate' ? 'selected' : ''}>Real Estate</option>
            <option value="Car Rental" ${defaultDept === 'Car Rental' ? 'selected' : ''}>Car Rental</option>
            <option value="Compliance" ${defaultDept === 'Compliance' ? 'selected' : ''}>Compliance</option>
            <option value="Human Resources" ${defaultDept === 'Human Resources' ? 'selected' : ''}>Human Resources</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label">Assigned Reporting Manager / Team Lead *</label>
          <input type="text" id="hnd-tl" class="form-control" placeholder="e.g. Operations TL" value="Assigned Reporting Manager" required />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Complete Floor Handover</button>
        </div>
      </form>
    `;
    ModalManager.openModal({
      id: 'handover-trainee-modal',
      title: 'Day 7 Floor Handover Sign-Off',
      subtitle: fullName,
      contentHtml: modalHtml,
      size: 'md'
    });
  },

  async submitHandover(traineeId) {
    try {
      const dept = document.getElementById('hnd-dept').value;
      const tl = document.getElementById('hnd-tl').value;
      await trainingService.handoverToFloor(traineeId, dept, tl);
      ModalManager.closeModal();
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not complete floor handover: ' + (e.message || e));
    }
  },

  // MODALS
  openAddTraineeModal() {
    const modalHtml = `
      <form id="add-trainee-form" onsubmit="event.preventDefault(); TrainingView.submitAddTrainee();">
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label">Full Name *</label>
          <input type="text" id="trn-fullname" class="form-control" placeholder="e.g. Tanvi Joshi" required />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" id="trn-email" class="form-control" placeholder="e.g. tanvi.joshi@diallo.in" required />
          </div>
          <div class="form-group">
            <label class="form-label">Trainee Code</label>
            <input type="text" id="trn-code" class="form-control" value="TRN-${Date.now().toString().slice(-4)}" />
          </div>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label">Department *</label>
            <select id="trn-dept" class="form-control" required>
              <option value="Operations">Operations</option>
              <option value="Digital Team">Digital Team</option>
              <option value="Sales">Sales</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Car Rental">Car Rental</option>
              <option value="Compliance">Compliance</option>
              <option value="Training">Training</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Curriculum Track *</label>
            <input type="text" id="trn-track" class="form-control" value="7-Day Core Training Modules" required />
          </div>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label">Assigned Mentor / Trainer</label>
            <input type="text" id="trn-mentor" class="form-control" placeholder="e.g. Lead Trainer" />
          </div>
          <div class="form-group">
            <label class="form-label">Batch Name</label>
            <input type="text" id="trn-batch" class="form-control" value="Cohort 2026-Q3" />
          </div>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="date" id="trn-start" class="form-control" value="${new Date().toISOString().slice(0, 10)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Target Completion</label>
            <input type="date" id="trn-end" class="form-control" value="2026-12-31" />
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">+ Register Trainee</button>
        </div>
      </form>
    `;

    ModalManager.openModal({
      id: 'add-trainee-modal',
      title: 'Register New Trainee / Intern',
      subtitle: 'Enroll a graduate engineering, HR, or finance trainee into a guided track',
      contentHtml: modalHtml,
      size: 'lg'
    });
  },

  async submitAddTrainee() {
    try {
      const payload = {
        fullName: document.getElementById('trn-fullname').value,
        email: document.getElementById('trn-email').value,
        traineeCode: document.getElementById('trn-code').value,
        department: document.getElementById('trn-dept').value,
        track: document.getElementById('trn-track').value,
        trainerName: document.getElementById('trn-mentor').value,
        batchName: document.getElementById('trn-batch').value,
        startDate: document.getElementById('trn-start').value,
        targetEndDate: document.getElementById('trn-end').value,
        progress: 10,
        completedModules: 0,
        totalModules: 5,
        status: 'IN_TRAINING'
      };

      await trainingService.createTrainee(payload);
      ModalManager.closeModal();
      Toast.success(`Trainee ${payload.fullName} registered successfully!`);
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not register trainee: ' + e.message);
    }
  },

  openAddTrainerModal() {
    const modalHtml = `
      <form id="add-trainer-form" onsubmit="event.preventDefault(); TrainingView.submitAddTrainer();">
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label required">Full Name</label>
          <input type="text" id="tr-name" class="form-control" placeholder="e.g. Dr. Arvind Swaminathan" required />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label required">Email Address</label>
            <input type="email" id="tr-email" class="form-control" placeholder="e.g. arvind.s@diallo.in" required />
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="text" id="tr-phone" class="form-control" placeholder="+91 98000 00000" value="+91 98222 33445" />
          </div>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label required">Trainer Type</label>
            <select id="tr-type" class="form-control" required>
              <option value="INTERNAL">Internal Lead</option>
              <option value="EXTERNAL">External Expert</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Designation</label>
            <input type="text" id="tr-desig" class="form-control" placeholder="e.g. Principal Architect" value="Senior Technical Mentor" required />
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label required">Domain Specialization</label>
          <input type="text" id="tr-spec" class="form-control" placeholder="e.g. Kubernetes, Cloud Architecture & DevOps" required />
        </div>
        <div class="form-group" style="margin-bottom: 20px;">
          <label class="form-label">Bio / Profile Summary</label>
          <textarea id="tr-bio" class="form-control" rows="3" placeholder="Brief background of professional expertise and coaching experience..."></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">+ Add Trainer</button>
        </div>
      </form>
    `;

    ModalManager.openModal({
      id: 'add-trainer-modal',
      title: 'Add New Certified Trainer / Mentor',
      subtitle: 'Register an internal tech lead or accredited external instructor',
      contentHtml: modalHtml,
      size: 'lg'
    });
  },

  async submitAddTrainer() {
    try {
      const payload = {
        fullName: document.getElementById('tr-name').value,
        email: document.getElementById('tr-email').value,
        phone: document.getElementById('tr-phone').value,
        trainerType: document.getElementById('tr-type').value,
        designation: document.getElementById('tr-desig').value,
        specialization: document.getElementById('tr-spec').value,
        bio: document.getElementById('tr-bio').value,
        batchesConducted: 0,
        activeTrainees: 0,
        rating: 5.0
      };

      await trainingService.createTrainer(payload);
      ModalManager.closeModal();
      Toast.success(`Trainer ${payload.fullName} added successfully!`);
      this.activeTab = 'trainers';
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not add trainer: ' + e.message);
    }
  },

  openAddProgramModal() {
    const modalHtml = `
      <form id="add-program-form" onsubmit="event.preventDefault(); TrainingView.submitAddProgram();">
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label required">Program Title</label>
          <input type="text" id="prg-title" class="form-control" placeholder="e.g. Full-Stack Cloud Architecture Accelerator" required />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label required">Category</label>
            <select id="prg-cat" class="form-control" required>
              <option value="Technical Engineering">Technical Engineering</option>
              <option value="Compliance & Culture">Compliance & Culture</option>
              <option value="Finance & Taxation">Finance & Taxation</option>
              <option value="Cloud & DevOps">Cloud & DevOps</option>
              <option value="Leadership & Soft Skills">Leadership & Soft Skills</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Delivery Mode</label>
            <select id="prg-mode" class="form-control" required>
              <option value="HYBRID">Hybrid (In-Office + Lab)</option>
              <option value="CLASSROOM">Classroom Training</option>
              <option value="VIRTUAL">Virtual / Online Live</option>
            </select>
          </div>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label required">Duration</label>
            <input type="text" id="prg-duration" class="form-control" placeholder="e.g. 12 Weeks" value="12 Weeks" required />
          </div>
          <div class="form-group">
            <label class="form-label">Lead Trainer / Mentor</label>
            <input type="text" id="prg-trainer" class="form-control" placeholder="e.g. Lead Trainer" />
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label required">Curriculum Modules (One per line)</label>
          <textarea id="prg-modules" class="form-control" rows="4" required>Module 1: Architecture & Foundations
Module 2: Real-time Cloud Services & Scaling
Module 3: Security, Roles & Testing
Module 4: Practical Capstone Evaluation</textarea>
        </div>
        <div class="form-group" style="margin-bottom: 20px;">
          <label class="form-label">Description</label>
          <textarea id="prg-desc" class="form-control" rows="2" placeholder="Course overview and career learning goals..."></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">+ Publish Program</button>
        </div>
      </form>
    `;

    ModalManager.openModal({
      id: 'add-program-modal',
      title: 'Create Curriculum Training Program',
      subtitle: 'Design structured corporate curriculum, milestones, and syllabus modules',
      contentHtml: modalHtml,
      size: 'lg'
    });
  },

  async submitAddProgram() {
    try {
      const payload = {
        title: document.getElementById('prg-title').value,
        category: document.getElementById('prg-cat').value,
        mode: document.getElementById('prg-mode').value,
        duration: document.getElementById('prg-duration').value,
        trainerName: document.getElementById('prg-trainer').value,
        modules: document.getElementById('prg-modules').value.split('\n').map(m => m.trim()).filter(Boolean),
        description: document.getElementById('prg-desc').value || 'Targeted upskilling and mentorship program.',
        enrolledCount: 0,
        status: 'ACTIVE'
      };

      await trainingService.createProgram(payload);
      ModalManager.closeModal();
      Toast.success(`Program "${payload.title}" created successfully!`);
      this.activeTab = 'programs';
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not create program: ' + e.message);
    }
  },

  openEvaluateModal(traineeId, traineeName, currentProgress) {
    const modalHtml = `
      <form id="eval-trainee-form" onsubmit="event.preventDefault(); TrainingView.submitEvaluation('${traineeId}');">
        <div style="margin-bottom: 14px; font-size: 0.9rem; color: var(--text-secondary);">
          Recording milestone evaluation and assessment score for <strong>${traineeName}</strong>.
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label required">Updated Progress (%)</label>
            <input type="number" id="eval-prog" class="form-control" min="0" max="100" value="${Math.min(100, currentProgress + 20)}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Rating (1 to 5 Stars)</label>
            <select id="eval-rating" class="form-control">
              <option value="5">5.0 - Exceptional</option>
              <option value="4" selected>4.0 - Proficient</option>
              <option value="3">3.0 - Meets Expectations</option>
              <option value="2">2.0 - Needs Improvement</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label required">Trainee Status</label>
          <select id="eval-status" class="form-control">
            <option value="IN_TRAINING">In Training</option>
            <option value="IN_EVALUATION" selected>In Evaluation</option>
            <option value="CERTIFIED" ${currentProgress >= 75 ? 'selected' : ''}>Certified Graduate</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 20px;">
          <label class="form-label">Evaluation Remarks & Feedback</label>
          <textarea id="eval-notes" class="form-control" rows="3" placeholder="Notes on practical assignment, viva performance, and technical proficiency..."></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Save Evaluation</button>
        </div>
      </form>
    `;

    ModalManager.openModal({
      id: 'eval-trainee-modal',
      title: `Evaluate Trainee: ${traineeName}`,
      subtitle: 'Update milestone progress, score assessment viva, or certify cohort member',
      contentHtml: modalHtml
    });
  },

  async submitEvaluation(traineeId) {
    try {
      const evaluationData = {
        progress: Number(document.getElementById('eval-prog').value),
        rating: Number(document.getElementById('eval-rating').value),
        status: document.getElementById('eval-status').value,
        notes: document.getElementById('eval-notes').value
      };

      await trainingService.evaluateTrainee(traineeId, evaluationData);
      ModalManager.closeModal();
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not save evaluation: ' + e.message);
    }
  },

  async openAssignTraineeModal(trainerId, trainerName) {
    try {
      const trainees = await trainingService.getTrainees();
      const modalHtml = `
        <form id="assign-trainee-form" onsubmit="event.preventDefault(); TrainingView.submitAssignTrainee('${trainerId}', '${trainerName.replace(/'/g, "\\'")}');">
          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label">Mentor / Trainer</label>
            <input type="text" class="form-control" value="${trainerName}" disabled />
          </div>
          <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label required">Select Trainee to Assign</label>
            <select id="assign-trainee-id" class="form-control" required>
              ${trainees.length === 0 ? '<option value="" disabled>No trainees found</option>' : trainees.map(t => `
                <option value="${t.id}">${t.fullName} (${t.traineeCode || 'TRN'}) — ${t.track || t.department}</option>
              `).join('')}
            </select>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
            <button type="submit" class="btn btn-primary">Assign Trainee</button>
          </div>
        </form>
      `;

      ModalManager.openModal({
        id: 'assign-trainee-modal',
        title: `Assign Trainee to ${trainerName}`,
        subtitle: 'Link trainee with this mentor for regular reviews and progress tracking',
        contentHtml: modalHtml
      });
    } catch (e) {
      Toast.error('Could not open assignment: ' + e.message);
    }
  },

  async submitAssignTrainee(trainerId, trainerName) {
    try {
      const selectEl = document.getElementById('assign-trainee-id');
      if (!selectEl || !selectEl.value) {
        Toast.error('Please select a trainee');
        return;
      }
      const traineeId = selectEl.value;
      await trainingService.updateTrainee(traineeId, {
        trainerId,
        trainerName
      });
      ModalManager.closeModal();
      Toast.success(`Assigned ${trainerName} as mentor successfully!`);
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Assignment failed: ' + e.message);
    }
  },

  openMentorConnectModal(mentorName = 'Mentor') {
    const modalHtml = `
      <div style="text-align: center; padding: 12px 0;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
          Schedule 1-on-1 Mentorship Review
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 18px; max-width: 400px; margin-left: auto; margin-right: auto;">
          Connect directly with ${mentorName} for curriculum progress check, code review, or doubt resolution.
        </p>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
          <a href="#" target="_blank" class="btn btn-primary" style="justify-content: center; width: 100%;">
            Launch Google Meet Room
          </a>
          <button class="btn btn-secondary" style="justify-content: center; width: 100%;" onclick="ModalManager.closeModal(); Toast.success('Mentorship calendar sync invitation sent.');">
            Send Calendar Invitation
          </button>
        </div>
      </div>
    `;

    ModalManager.openModal({
      id: 'mentor-connect-modal',
      title: 'Mentor Office Hours',
      subtitle: `Connect with ${mentorName}`,
      contentHtml: modalHtml
    });
  },

  async deleteTrainee(id) {
    if (!confirm('Are you sure you want to remove this trainee record?')) return;
    try {
      await trainingService.deleteTrainee(id);
      Toast.success('Trainee record removed.');
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not delete trainee: ' + e.message);
    }
  },

  async deleteTrainer(id) {
    if (!confirm('Are you sure you want to remove this trainer from the directory?')) return;
    try {
      await trainingService.deleteTrainer(id);
      Toast.success('Trainer removed.');
      this.activeTab = 'trainers';
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not delete trainer: ' + e.message);
    }
  },

  async deleteProgram(id) {
    if (!confirm('Are you sure you want to delete this training program?')) return;
    try {
      await trainingService.deleteProgram(id);
      Toast.success('Training program removed.');
      this.activeTab = 'programs';
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not delete program: ' + e.message);
    }
  },



  // ===================================================================
  // TRAINER: ATTENDANCE & MARKS TAB + MODULE MANAGEMENT
  // ===================================================================

  renderAttendanceTab(trainees) {
    const today = new Date().toISOString().slice(0, 10);
    const rows = trainees.map(function(t) {
      const curDay = Number(t.currentDay) || 1;
      const prog = t.progress || Math.round((curDay / 7) * 100);
      const safeName = (t.fullName || 'Trainee').replace(/"/g, '&quot;');
      const safeCode = (t.traineeCode || 'TRN').replace(/"/g, '&quot;');
      let bStatus = 'CURRENT';
      if (t.status === 'CERTIFIED' || t.status === 'HANDED_OVER') bStatus = 'PAST';
      else if (t.status === 'NOT_STARTED' || (t.startDate && new Date(t.startDate) > new Date())) bStatus = 'UPCOMING';
      return '<tr class="att-row-item" data-batch-status="' + bStatus + '">' +
        '<td>' +
          '<div class="user-cell">' +
            '<div class="user-cell-avatar" style="background:var(--primary-light);color:var(--primary);font-weight:700;">' +
              (t.fullName || 'T').substring(0, 2).toUpperCase() +
            '</div>' +
            '<div class="user-cell-info">' +
              '<span class="user-cell-name font-semibold">' + (t.fullName || '') + '</span>' +
              '<span class="user-cell-email text-muted" style="font-size:0.75rem;">' + (t.traineeCode || 'TRN') + ' &bull; ' + (t.email || '') + '</span>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td><span class="badge badge-primary">' + (t.department || 'Operations') + '</span></td>' +
        '<td>' +
          '<div style="font-size:0.78rem;"><strong>' + (t.batchName || 'Cohort 2026') + '</strong></div>' +
          '<div style="font-size:0.72rem;color:var(--text-muted);">' +
            (t.startDate ? 'From: ' + t.startDate : 'Not started') +
            (t.targetEndDate ? ' &rarr; ' + t.targetEndDate : '') +
          '</div>' +
        '</td>' +
        '<td>' +
          '<div style="font-size:0.8rem;font-weight:600;">Day ' + curDay + ' / 7 &nbsp; <strong style="color:var(--primary);">' + prog + '%</strong></div>' +
          '<div style="width:100px;height:5px;background:var(--border-main);border-radius:3px;overflow:hidden;margin-top:4px;">' +
            '<div style="width:' + prog + '%;height:100%;background:var(--primary);border-radius:3px;"></div>' +
          '</div>' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<div style="display:inline-flex;gap:5px;flex-wrap:wrap;justify-content:center;">' +
            '<button class="btn btn-sm" style="background:var(--success-light);color:var(--success);border:1px solid var(--success);" ' +
              'onclick="TrainingView.markAttendance(' + "'" + t.id + "'" + ',' + "'" + safeName + "'" + ',' + "'PRESENT'" + ',document.getElementById(' + "'att-date-picker'" + ').value,' + "'" + safeCode + "'" + ')">Present</button>' +
            '<button class="btn btn-sm" style="background:var(--warning-light);color:var(--warning);border:1px solid var(--warning);" ' +
              'onclick="TrainingView.markAttendance(' + "'" + t.id + "'" + ',' + "'" + safeName + "'" + ',' + "'HALF_DAY'" + ',document.getElementById(' + "'att-date-picker'" + ').value,' + "'" + safeCode + "'" + ')">Half Day</button>' +
            '<button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:1px solid var(--danger);" ' +
              'onclick="TrainingView.markAttendance(' + "'" + t.id + "'" + ',' + "'" + safeName + "'" + ',' + "'ABSENT'" + ',document.getElementById(' + "'att-date-picker'" + ').value,' + "'" + safeCode + "'" + ')">Absent</button>' +
          '</div>' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<div style="display:inline-flex;gap:5px;">' +
            '<button class="btn btn-secondary btn-sm" onclick="TrainingView.openAttendanceSheetModal(' + "'" + t.id + "','" + safeName + "','" + safeCode + "'" + ')">Sheet</button>' +
            '<button class="btn btn-soft btn-sm" onclick="TrainingView.openManageModuleModal(' + "'" + t.id + "','" + safeName + "'," + curDay + ',' + prog + ',' + "'" + (t.startDate || '') + "','" + (t.targetEndDate || '') + "','" + (t.batchName || '') + "'" + ')">Manage</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    return `
      <div class="card" style="margin-bottom: 20px; padding: 16px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-size: 1rem; font-weight: 700; color: var(--text-main);">Mark Trainee Attendance</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Select date and mark each trainee as present, absent, or half day</div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <select id="att-batch-filter" class="form-control" style="width: 160px;" onchange="TrainingView.filterAttendanceBatch(this.value)">
              <option value="ALL">All Batches</option>
              <option value="CURRENT" selected>Current Active Batches</option>
              <option value="UPCOMING">Upcoming Batches</option>
              <option value="PAST">Past / Completed</option>
            </select>
            <input type="date" id="att-date-picker" class="form-control" style="width: 140px;" value="${today}" />
            <button class="btn btn-primary btn-sm" onclick="TrainingView.switchTab('attendance')">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Trainee Attendance &amp; Module Sheet</div>
            <div class="card-subtitle">Mark daily attendance, manage module progress, start / end batch, and add daily remarks.</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0; overflow-x: auto;">
          ${trainees.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div class="empty-state-title">No Trainees Enrolled</div>
              <div class="empty-state-desc">Register trainees first to mark their daily attendance.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Department</th>
                  <th>Batch &amp; Dates</th>
                  <th>Day &amp; Progress</th>
                  <th style="text-align:center;">Mark Attendance</th>
                  <th style="text-align:center;">Actions</th>
                </tr>
              </thead>
              <tbody id="att-tbody">${rows}</tbody>
            </table>

            <div style="padding: 20px; border-top: 1px solid var(--border-main);">
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Pending Regularization Requests from Trainees
              </div>
              <div id="trainer-reg-list">
                <div style="font-size:0.85rem;color:var(--text-muted);">No pending regularization requests at this time.</div>
              </div>
            </div>
          `}
        </div>
      </div>
    `;
  },

  async markAttendance(traineeId, traineeName, status, dateStr, traineeCode) {
    if (!dateStr) dateStr = new Date().toISOString().slice(0, 10);
    try {
      const trainerName = AuthGuard.userProfile?.displayName || 'Trainer';
      const docId = traineeId + '_' + dateStr;
      const db = firebase.firestore();
      await db.collection('attendance').doc(docId).set({
        employeeId: traineeId,
        employeeName: traineeName,
        employeeCode: traineeCode,
        date: dateStr,
        status: status,
        punchIn: status === 'ABSENT' ? null : '10:00',
        punchOut: status === 'PRESENT' ? '19:00' : (status === 'HALF_DAY' ? '16:00' : null),
        workedHours: status === 'PRESENT' ? 9 : (status === 'HALF_DAY' ? 6 : 0),
        markedBy: trainerName,
        markedAt: new Date().toISOString(),
        source: 'TRAINER_MARK',
        isTrainee: true
      }, { merge: true });
      const colMap = { PRESENT: 'var(--success)', HALF_DAY: 'var(--warning)', ABSENT: 'var(--danger)' };
      const label = status.replace('_', ' ');
      const row = document.getElementById('att-row-' + traineeId);
      if (row) {
        const td = row.querySelector('.att-status-cell');
        if (td) td.innerHTML = '<span class="badge" style="background:' + colMap[status] + ';color:#fff;">' + label + '</span>';
      }
      Toast.success(traineeName + ' marked ' + label + ' for ' + dateStr);
    } catch (e) {
      Toast.error('Could not mark attendance: ' + (e.message || e));
    }
  },

  async openAttendanceSheetModal(traineeId, traineeName, traineeCode) {
    ModalManager.openModal({
      id: 'trainee-att-sheet-modal',
      title: 'Attendance Sheet — ' + traineeName,
      subtitle: traineeCode + ' | Full attendance history',
      contentHtml: '<div style="text-align:center;padding:24px;color:var(--text-muted);">Loading attendance records...</div>',
      size: 'lg'
    });
    try {
      const db = firebase.firestore();
      const snap = await db.collection('attendance')
        .where('employeeId', '==', traineeId)
        .orderBy('date', 'desc')
        .limit(60)
        .get();
      const records = snap.docs.map(function(d) { return d.data(); });
      const statusColor = { PRESENT: 'badge-success', HALF_DAY: 'badge-warning', ABSENT: 'badge-danger', LATE: 'badge-warning', REGULARIZED: 'badge-primary' };
      const tableRows = records.length === 0
        ? '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);">No attendance records found.</td></tr>'
        : records.map(function(r) {
            return '<tr>' +
              '<td><strong>' + (r.date || '') + '</strong></td>' +
              '<td>' + (r.punchIn || '<span class="text-muted">—</span>') + '</td>' +
              '<td>' + (r.punchOut || '<span class="text-muted">—</span>') + '</td>' +
              '<td>' + (r.workedHours != null ? r.workedHours + 'h' : '<span class="text-muted">—</span>') + '</td>' +
              '<td><span class="badge ' + (statusColor[r.status] || 'badge-neutral') + '">' + (r.status || '').replace('_', ' ') + '</span></td>' +
              '<td>' + (r.remarks || r.trainerRemarks || '<span class="text-muted">—</span>') + '</td>' +
              '<td style="font-size:0.75rem;color:var(--text-muted);">' + (r.markedBy || 'System') + '</td>' +
            '</tr>';
          }).join('');
      const body = '<table class="data-table">' +
        '<thead><tr><th>Date</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th><th>Remarks</th><th>By</th></tr></thead>' +
        '<tbody>' + tableRows + '</tbody></table>';
      const el = document.querySelector('#trainee-att-sheet-modal .modal-body');
      if (el) el.innerHTML = body;
    } catch (e) {
      const el = document.querySelector('#trainee-att-sheet-modal .modal-body');
      if (el) el.innerHTML = '<div style="color:var(--danger);padding:20px;">Error: ' + e.message + '</div>';
    }
  },

  openManageModuleModal(traineeId, traineeName, curDay, curProgress, startDate, endDate, batchName) {
    const modalHtml = `
      <form id="manage-module-form" onsubmit="event.preventDefault(); TrainingView.submitManageModule('${traineeId}');">
        <div style="background: var(--primary-light); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 18px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; flex-shrink: 0;">
            ${(traineeName || 'T').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div style="font-weight: 700; color: var(--text-main);">${traineeName}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Current Day: <strong>${curDay} / 7</strong> &bull; Progress: <strong>${curProgress}%</strong></div>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label">Batch Name</label>
            <input type="text" id="mm-batch" class="form-control" value="${batchName || ''}" placeholder="e.g. Cohort Q3 2026" />
          </div>
          <div class="form-group">
            <label class="form-label">Current Day (1 – 7) *</label>
            <select id="mm-day" class="form-control" required>
              ${[1,2,3,4,5,6,7].map(function(d) {
                return '<option value="' + d + '"' + (d === curDay ? ' selected' : '') + '>Day ' + d + (d === 6 ? ' — Certification' : (d === 7 ? ' — Floor Handover' : '')) + '</option>';
              }).join('')}
            </select>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label">Batch Start Date</label>
            <input type="date" id="mm-start" class="form-control" value="${startDate || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Batch End Date</label>
            <input type="date" id="mm-end" class="form-control" value="${endDate || ''}" />
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label">Updated Progress (%)</label>
            <input type="number" id="mm-progress" class="form-control" min="0" max="100" value="${curProgress}" />
          </div>
          <div class="form-group">
            <label class="form-label">Training Status</label>
            <select id="mm-status" class="form-control">
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_TRAINING" selected>In Training</option>
              <option value="IN_EVALUATION">In Evaluation</option>
              <option value="CERTIFIED">Certified</option>
              <option value="HANDED_OVER">Handed Over</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label">Mark Day ${curDay} as Complete</label>
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 6px;">
            <input type="checkbox" id="mm-day-complete" style="width: 18px; height: 18px; cursor: pointer;" />
            <label for="mm-day-complete" style="font-size: 0.88rem; color: var(--text-secondary); cursor: pointer;">
              Confirm Day ${curDay} syllabus completed — will advance progress and unlock Day ${Math.min(curDay + 1, 7)}
            </label>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
          <label class="form-label">Trainer Remarks / Daily Notes</label>
          <textarea id="mm-remarks" class="form-control" rows="3" placeholder="e.g. Performed well in crypto fundamentals. Needs improvement in market terminology..."></textarea>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-soft btn-sm" onclick="TrainingView.startBatch('${traineeId}', '${traineeName}')">Start Batch</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="TrainingView.endBatch('${traineeId}', '${traineeName}')">End Batch</button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </form>
    `;
    ModalManager.openModal({
      id: 'manage-module-modal',
      title: 'Manage Module & Progress',
      subtitle: 'Update batch dates, daily progress, and trainee remarks for ' + traineeName,
      contentHtml: modalHtml,
      size: 'lg'
    });
  },

  async submitManageModule(traineeId) {
    try {
      const dayComplete = document.getElementById('mm-day-complete').checked;
      const newDay = Number(document.getElementById('mm-day').value);
      const updatedDay = dayComplete ? Math.min(newDay + 1, 7) : newDay;
      const progress = Number(document.getElementById('mm-progress').value) || Math.round((updatedDay / 7) * 100);
      const status = document.getElementById('mm-status').value;
      const remarks = document.getElementById('mm-remarks').value;
      const startDate = document.getElementById('mm-start').value;
      const endDate = document.getElementById('mm-end').value;
      const batchName = document.getElementById('mm-batch').value;
      const modules = (typeof trainingService !== 'undefined' && trainingService.SEVEN_DAY_MODULES) ? trainingService.SEVEN_DAY_MODULES : [];
      const nextModule = modules[updatedDay - 1];
      const updates = {
        currentDay: updatedDay,
        progress: progress,
        status: status,
        startDate: startDate,
        targetEndDate: endDate,
        batchName: batchName,
        currentModuleTitle: nextModule ? nextModule.title : ('Day ' + updatedDay + ' Training'),
        trainerRemarks: remarks,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: AuthGuard.userProfile?.displayName || 'Trainer'
      };
      if (dayComplete) {
        updates['day' + newDay + 'CompletedAt'] = new Date().toISOString();
        updates['day' + newDay + 'Remarks'] = remarks;
      }
      await trainingService.updateTrainee(traineeId, updates);
      ModalManager.closeModal();
      Toast.success('Module updated successfully. Day ' + updatedDay + ' now active.');
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not save module update: ' + (e.message || e));
    }
  },

  async startBatch(traineeId, traineeName) {
    const today = new Date().toISOString().slice(0, 10);
    const endEl = document.getElementById('mm-end');
    const endDate = endEl && endEl.value ? endEl.value : '';
    try {
      await trainingService.updateTrainee(traineeId, {
        startDate: today,
        status: 'IN_TRAINING',
        currentDay: 1,
        progress: 14,
        batchStartedAt: new Date().toISOString(),
        batchStartedBy: AuthGuard.userProfile?.displayName || 'Trainer'
      });
      Toast.success('Training batch started for ' + traineeName + ' from ' + today);
      ModalManager.closeModal();
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not start batch: ' + (e.message || e));
    }
  },

  async endBatch(traineeId, traineeName) {
    if (!confirm('End the batch for ' + traineeName + '? This will mark the training as completed.')) return;
    try {
      await trainingService.updateTrainee(traineeId, {
        targetEndDate: new Date().toISOString().slice(0, 10),
        status: 'HANDED_OVER',
        batchEndedAt: new Date().toISOString(),
        batchEndedBy: AuthGuard.userProfile?.displayName || 'Trainer'
      });
      Toast.success('Batch ended for ' + traineeName);
      ModalManager.closeModal();
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not end batch: ' + (e.message || e));
    }
  },


  filterAttendanceBatch(status) {
    const rows = document.querySelectorAll('.att-row-item');
    let visibleCount = 0;
    rows.forEach(row => {
      if (status === 'ALL' || row.getAttribute('data-batch-status') === status) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    // Call it once after render if needed
  },

  async exportTraineesCSV() {
    try {
      const trainees = await trainingService.getTrainees();
      if (!trainees.length) {
        Toast.info('No trainees available to export.');
        return;
      }
      const headers = ['Trainee Code', 'Full Name', 'Email', 'Department', 'Track', 'Trainer', 'Batch', 'Progress', 'Status', 'Rating'];
      const rows = trainees.map(t => [
        t.traineeCode || '',
        `"${(t.fullName || '').replace(/"/g, '""')}"`,
        t.email || '',
        `"${(t.department || '').replace(/"/g, '""')}"`,
        `"${(t.track || '').replace(/"/g, '""')}"`,
        `"${(t.trainerName || '').replace(/"/g, '""')}"`,
        `"${(t.batchName || '').replace(/"/g, '""')}"`,
        `${t.progress || 0}%`,
        t.status || '',
        t.rating || ''
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Diallo_Trainees_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Toast.success('Trainee roster exported to CSV successfully!');
    } catch (e) {
      Toast.error('Export failed: ' + e.message);
    }
  }
};

window.TrainingView = TrainingView;
