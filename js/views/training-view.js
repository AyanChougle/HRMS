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
    const isEmployee = rawRole === 'EMPLOYEE';
    const currentEmpEmail = AuthGuard.userProfile?.email || AuthGuard.currentUser?.email;
    const currentEmpName = AuthGuard.userProfile?.displayName || 'Employee';

    if (isEmployee && this.activeTab === 'trainees') {
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
          <span class="breadcrumb-current">${isEmployee ? 'My Learning & Mentorship' : 'Trainees & Trainers (L&D)'}</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">${isEmployee ? 'My Training, Mentorship & Certifications' : 'Trainee Cohorts & Trainer Directory'}</h1>
            <p class="page-subtitle">${isEmployee ? 'Track your onboarding curriculum, mentorship milestones, practical modules, and certification readiness' : 'Manage graduate trainee cohorts, mentor directory, curriculum milestones, assessments, and certifications'}</p>
          </div>
          <div class="page-actions">
            ${!isEmployee ? `
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
            `}
          </div>
        </div>
      </div>

      <!-- KPI Overview Grid -->
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
          <div class="kpi-label">Total Trainees & Interns</div>
          <div class="kpi-subtitle">Across engineering, HR & finance</div>
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
          <div class="kpi-subtitle">Internal leads & external experts</div>
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
          <div class="kpi-subtitle">Structured syllabus & batches</div>
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
          <div class="kpi-subtitle">Completion & readiness score</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tab-nav" style="margin-bottom: 20px;">
        ${!isEmployee ? `
          <button class="tab-btn ${this.activeTab === 'trainees' ? 'active' : ''}" onclick="TrainingView.switchTab('trainees')">
            Trainees & Interns (${totalTrainees})
          </button>
          <button class="tab-btn ${this.activeTab === 'trainers' ? 'active' : ''}" onclick="TrainingView.switchTab('trainers')">
            Trainers & Mentors (${totalTrainers})
          </button>
          <button class="tab-btn ${this.activeTab === 'programs' ? 'active' : ''}" onclick="TrainingView.switchTab('programs')">
            Training Programs (${totalPrograms})
          </button>
        ` : ''}
        <button class="tab-btn ${this.activeTab === 'my_learning' ? 'active' : ''}" onclick="TrainingView.switchTab('my_learning')">
          ${isEmployee ? 'My Learning & Mentorship' : 'Employee Mentorship View (Preview)'}
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
                <th>Curriculum Progress</th>
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
                const statusBadge = t.status === 'CERTIFIED' 
                  ? 'badge-success' 
                  : (t.status === 'IN_EVALUATION' ? 'badge-warning' : 'badge-primary');
                const statusLabel = t.status === 'CERTIFIED'
                  ? 'Certified'
                  : (t.status === 'IN_EVALUATION' ? 'In Evaluation' : 'In Training');

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
                      <div class="font-medium">${t.track}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${t.batchName || 'General Batch'}</div>
                    </td>
                    <td>
                      <span class="badge badge-neutral">${t.department}</span>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--bg-hover); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: var(--text-secondary);">
                          ${(t.trainerName || 'M').substring(0, 1)}
                        </div>
                        <span class="font-medium" style="font-size: 0.85rem;">${t.trainerName || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td style="min-width: 160px;">
                      <div class="flex items-center justify-between" style="font-size: 0.78rem; margin-bottom: 4px;">
                        <span>${t.completedModules || 0}/${t.totalModules || 5} Modules</span>
                        <strong style="color: var(--primary);">${t.progress || 0}%</strong>
                      </div>
                      <div style="width: 100%; height: 6px; background: var(--border-main); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${t.progress || 0}%; height: 100%; background: ${t.progress >= 100 ? 'var(--success)' : 'var(--primary)'}; border-radius: 3px;"></div>
                      </div>
                    </td>
                    <td>
                      <span class="badge ${statusBadge}" style="cursor: pointer;" onclick="TrainingView.openEvaluateModal('${t.id}', '${t.fullName.replace(/'/g, "\\'")}', ${t.progress || 0})" title="Click to evaluate trainee or update status">
                        <span class="badge-dot"></span>
                        ${statusLabel}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; gap: 6px;">
                        <button class="btn btn-soft btn-sm" onclick="TrainingView.openEvaluateModal('${t.id}', '${t.fullName.replace(/'/g, "\\'")}', ${t.progress || 0})">
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

  // 4. EMPLOYEE / TRAINEE LEARNING TAB
  renderMyLearningTab(trainees, trainers, programs) {
    const userEmail = AuthGuard.userProfile?.email || AuthGuard.currentUser?.email;
    const userName = AuthGuard.userProfile?.displayName || 'Employee';

    // Find personal trainee record or fallback to sample trainee
    const myTraineeRecord = trainees.find(t => t.email && t.email.toLowerCase() === userEmail.toLowerCase()) || trainees[0] || {
      fullName: userName,
      traineeCode: 'EMP-T01',
      track: 'Graduate Engineering Trainee (GET)',
      department: 'Engineering & Technology',
      trainerName: 'Vikram Sharma',
      progress: 75,
      completedModules: 4,
      totalModules: 5,
      status: 'IN_TRAINING',
      batchName: 'GET Batch 2026-Q3',
      startDate: '2026-07-01',
      targetEndDate: '2026-10-31'
    };

    const myTrainer = trainers.find(tr => tr.fullName === myTraineeRecord.trainerName) || trainers[0] || {
      fullName: 'Vikram Sharma',
      designation: 'Principal Software Architect',
      specialization: 'Full Stack Architecture & Cloud',
      email: 'vikram.sharma@diallo.in',
      phone: '+91 98111 22334'
    };

    const modulesList = [
      { name: 'Module 1: Enterprise JavaScript (ES6+), Clean Architecture & Coding Standards', status: 'COMPLETED', score: '95%' },
      { name: 'Module 2: Cloud Firestore Database Modeling, Indexing & Security Rules', status: 'COMPLETED', score: '92%' },
      { name: 'Module 3: Modular Single-Page Application (SPA) Routing & State Management', status: 'COMPLETED', score: '90%' },
      { name: 'Module 4: Indian Statutory Compliance (EPF, ESIC, PT, TDS & Wage Code 2026)', status: myTraineeRecord.progress >= 75 ? 'COMPLETED' : 'IN_PROGRESS', score: myTraineeRecord.progress >= 75 ? '88%' : 'Pending' },
      { name: 'Module 5: End-to-End Capstone Project & Technical Architecture Viva', status: myTraineeRecord.progress >= 100 ? 'COMPLETED' : 'PENDING', score: 'Pending' }
    ];

    return `
      <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start;">
        
        <!-- Left: Course Syllabus & Checklist -->
        <div>
          <!-- Hero Progress Card -->
          <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(37,99,235,0.06), rgba(14,165,233,0.03)); border: 1px solid var(--primary-light);">
            <div class="card-body" style="padding: 24px;">
              <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                <div>
                  <span class="badge badge-primary" style="margin-bottom: 6px;">COHORT TRACK</span>
                  <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--text-main); margin: 0;">${myTraineeRecord.track}</h2>
                  <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                    Batch: <strong>${myTraineeRecord.batchName}</strong> • Start: ${myTraineeRecord.startDate} • Target Completion: ${myTraineeRecord.targetEndDate}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 2rem; font-weight: 800; color: var(--primary);">${myTraineeRecord.progress}%</div>
                  <span class="badge badge-success">On Schedule</span>
                </div>
              </div>

              <div>
                <div class="flex justify-between" style="font-size: 0.8rem; margin-bottom: 6px; font-weight: 600;">
                  <span>Curriculum Progress (${myTraineeRecord.completedModules} of ${myTraineeRecord.totalModules} Milestones Cleared)</span>
                  <span>${myTraineeRecord.progress}% Complete</span>
                </div>
                <div style="width: 100%; height: 8px; background: var(--border-main); border-radius: 4px; overflow: hidden;">
                  <div style="width: ${myTraineeRecord.progress}%; height: 100%; background: var(--primary); border-radius: 4px;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modules Checklist Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Curriculum Modules & Assessment Record</div>
              <div class="card-subtitle">Complete lessons, submit lab assignments, and take mentor assessments</div>
            </div>
            <div class="card-body" style="padding: 0;">
              <div style="display: flex; flex-direction: column;">
                ${modulesList.map((m, idx) => `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-main); gap: 12px;">
                    <div class="flex items-center gap-3">
                      <div style="width: 32px; height: 32px; border-radius: 50%; background: ${m.status === 'COMPLETED' ? 'var(--success-light)' : (m.status === 'IN_PROGRESS' ? 'var(--primary-light)' : 'var(--bg-hover)')}; color: ${m.status === 'COMPLETED' ? 'var(--success)' : (m.status === 'IN_PROGRESS' ? 'var(--primary)' : 'var(--text-muted)')}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${m.status === 'COMPLETED' ? `
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                          </svg>
                        ` : `<span style="font-weight: 700; font-size: 0.85rem;">${idx + 1}</span>`}
                      </div>
                      <div>
                        <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">${m.name}</div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">Assessment Score: <strong>${m.score}</strong></div>
                      </div>
                    </div>
                    <div>
                      <span class="badge ${m.status === 'COMPLETED' ? 'badge-success' : (m.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-neutral')}">
                        ${m.status === 'COMPLETED' ? 'Cleared' : (m.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending')}
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Mentor Card & Actions -->
        <div>
          <!-- Mentor Profile Card -->
          <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
              <div class="card-title">Assigned Mentor</div>
              <div class="card-subtitle">Your dedicated guide & evaluator</div>
            </div>
            <div class="card-body" style="padding: 20px; text-align: center;">
              <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: inline-flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; margin-bottom: 12px;">
                ${myTrainer.fullName.substring(0, 2).toUpperCase()}
              </div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0 0 2px 0;">${myTrainer.fullName}</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">${myTrainer.designation}</div>
              
              <div class="badge badge-neutral" style="margin-bottom: 16px;">
                ${myTrainer.specialization}
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 0.8rem; background: var(--bg-hover); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 16px;">
                <div class="flex items-center gap-2">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <span>${myTrainer.email}</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <span>${myTrainer.phone}</span>
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

          <!-- Training Certification Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Completion Certificate</div>
              <div class="card-subtitle">Official credential</div>
            </div>
            <div class="card-body" style="padding: 20px; text-align: center;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--success-light); color: var(--success); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
              </div>
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin-bottom: 4px;">
                ${myTraineeRecord.status === 'CERTIFIED' ? 'Certified Graduate' : 'Pending 100% Completion'}
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px;">
                ${myTraineeRecord.status === 'CERTIFIED' ? 'Certificate issued with verification key DL-CERT-2026.' : 'Upon completing all 5 curriculum modules and viva, your official Diallo HRMS completion certificate will unlock.'}
              </p>
              <button class="btn btn-secondary btn-sm" style="width: 100%; justify-content: center;" onclick="Toast.info('Official certificate unlocks upon completion of final viva evaluation.')">
                Download Certificate
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
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
              <option value="Engineering & Technology">Engineering & Technology</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Finance, Accounts & Taxation">Finance, Accounts & Taxation</option>
              <option value="Operations & Logistics">Operations & Logistics</option>
              <option value="Digital & Design">Digital & Design</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Curriculum Track *</label>
            <input type="text" id="trn-track" class="form-control" value="Graduate Engineering Trainee (GET)" required />
          </div>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label">Assigned Mentor / Trainer</label>
            <input type="text" id="trn-mentor" class="form-control" placeholder="e.g. Vikram Sharma" value="Vikram Sharma" />
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
            <input type="text" id="prg-trainer" class="form-control" placeholder="e.g. Vikram Sharma" value="Vikram Sharma" />
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

  openMentorConnectModal(mentorName = 'Vikram Sharma') {
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
          <a href="https://meet.google.com/xyz-diallo-hr" target="_blank" class="btn btn-primary" style="justify-content: center; width: 100%;">
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
