/**
 * DIALLO HRMS — CORPORATE TRAINER DASHBOARD VIEW
 * Specialized command hub for instructional leads, mentors, and batch facilitators
 * Provides cohort progression metrics, assigned trainee roster, batch milestones,
 * and personal shift timecard.
 */

const TrainerDashboardView = {
  async render() {\n    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    if (typeof ESSView !== "undefined" && window.attendanceService) {
      try {
        const todayRecord = await attendanceService.getTodayRecord(employeeId);
        await ESSView.syncWithFirestore(todayRecord);
      } catch (e) {
        console.warn("Dashboard ESSView sync warning:", e);
      }
    }

    const userDisplayName = AuthGuard.userProfile?.displayName || 'Corporate Trainer';
    const userEmail = (AuthGuard.userProfile?.email || AuthGuard.currentUser?.email || '').toLowerCase();
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    let trainees = [];
    let trainers = [];
    let programs = [];

    if (window.trainingService) {
      try {
        [trainees, trainers, programs] = await Promise.all([
          trainingService.getTrainees(),
          trainingService.getTrainers(),
          trainingService.getPrograms()
        ]);
      } catch (err) {
        console.warn('Trainer dashboard data fetch warning:', err);
      }
    }

    // Match trainer record by email or name
    const myTrainerDoc = trainers.find(tr => tr.email && tr.email.toLowerCase() === userEmail) ||
      trainers.find(tr => tr.fullName && userDisplayName.toLowerCase().includes(tr.fullName.toLowerCase())) ||
      trainers[0];

    const trainerName = myTrainerDoc?.fullName || userDisplayName;
    const trainerDesignation = myTrainerDoc?.designation || 'Lead Technical Architect & Mentor';

    // Mentees assigned to this trainer (or all trainees in company if unassigned)
    const myTrainees = myTrainerDoc
      ? trainees.filter(t => t.trainerId === myTrainerDoc.id || t.trainerName === myTrainerDoc.fullName)
      : trainees;

    const displayTrainees = myTrainees.length > 0 ? myTrainees : trainees;

    // Metrics
    const totalMentees = displayTrainees.length;
    const inTrainingCount = displayTrainees.filter(t => t.status === 'IN_TRAINING').length;
    const certifiedCount = displayTrainees.filter(t => t.status === 'CERTIFIED').length;
    const avgProgress = totalMentees > 0
      ? Math.round(displayTrainees.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) / totalMentees)
      : 0;

    return `
      <!-- Welcome Hero Banner -->
      <div class="welcome-banner animate-fade-in" style="margin-bottom: 24px;">
        <div class="welcome-text">
          <div class="flex items-center gap-2" style="margin-bottom: 4px;">
            <span class="badge badge-info" style="font-size: 0.75rem;">Corporate Trainer</span>
            <span class="text-muted" style="font-size: 0.8rem;">• ${trainerDesignation}</span>
          </div>
          <h1>Trainer Hub — ${trainerName}</h1>
          <p>Curriculum delivery, cohort progress tracking, milestone assessments, and mentee guidance</p>
        </div>
        <div class="welcome-date-badge">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>${todayStr} (IST)</span>
        </div>
      </div>

      <!-- 4 Trainer-Focused KPI Cards -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card" onclick="Router.navigate('training')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">${inTrainingCount} Active</span>
          </div>
          <div class="kpi-value">${totalMentees}</div>
          <div class="kpi-label">Assigned Trainees</div>
          <div class="kpi-subtitle">Active cohort mentees</div>
        </div>

        <div class="kpi-card" onclick="Router.navigate('training')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">${programs.length} Tracks</span>
          </div>
          <div class="kpi-value">${programs.length}</div>
          <div class="kpi-label">Training Programs</div>
          <div class="kpi-subtitle">Curriculum syllabus & tracks</div>
        </div>

        <div class="kpi-card" onclick="Router.navigate('training')" style="cursor: pointer;">
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
          <div class="kpi-subtitle">Curriculum completion rate</div>
        </div>

        <div class="kpi-card" onclick="Router.navigate('attendance')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Daily</span>
          </div>
          <div class="kpi-value">100%</div>
          <div class="kpi-label">Attendance Record</div>
          <div class="kpi-subtitle">Shift & session log</div>
        </div>
      </div>

      <!-- Quick Action Launchpad -->
      <div class="card animate-fade-in" style="margin-bottom: 24px;">
        <div class="card-header">
          <div class="card-title">Trainer Action Launchpad</div>
          <div class="card-subtitle">Fast shortcuts for daily instructional workflows</div>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            <button class="btn btn-secondary" onclick="Router.navigate('training'); setTimeout(() => TrainingView.switchTab('trainees'), 100);" style="justify-content: flex-start; padding: 14px 16px;">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--primary); margin-right: 8px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              <span>Manage Trainees</span>
            </button>
            <button class="btn btn-secondary" onclick="Router.navigate('training'); setTimeout(() => TrainingView.switchTab('programs'), 100);" style="justify-content: flex-start; padding: 14px 16px;">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--info); margin-right: 8px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              <span>Curriculum Tracks</span>
            </button>
            <button class="btn btn-secondary" onclick="Router.navigate('attendance')" style="justify-content: flex-start; padding: 14px 16px;">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--warning); margin-right: 8px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Session Attendance</span>
            </button>
            <button class="btn btn-secondary" onclick="Router.navigate('create-employee')" style="justify-content: flex-start; padding: 14px 16px;">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--primary); margin-right: 8px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              <span>Onboard New Trainee</span>
            </button>
            <button class="btn btn-secondary" onclick="Router.navigate('documents')" style="justify-content: flex-start; padding: 14px 16px;">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--success); margin-right: 8px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>Training Materials</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Active Trainees Cohort Table -->
      <div class="card animate-fade-in" style="margin-bottom: 24px;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="card-title">Mentees & Active Trainees Roster</div>
            <div class="card-subtitle">Cohort members assigned to your guidance and instructional modules</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('training')">
            Open Full L&D Module
          </button>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Trainee Details</th>
                  <th>Track & Cohort</th>
                  <th>Department</th>
                  <th>Curriculum Progress</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${displayTrainees.length === 0 ? `
                  <tr><td colspan="6" style="text-align: center; padding: 32px; color: var(--text-muted);">No trainees currently assigned.</td></tr>
                ` : displayTrainees.map(t => {
                  const statusClass = t.status === 'CERTIFIED' ? 'badge-success' : (t.status === 'IN_EVALUATION' ? 'badge-warning' : 'badge-primary');
                  const statusLabel = t.status === 'CERTIFIED' ? 'Certified' : (t.status === 'IN_EVALUATION' ? 'In Evaluation' : 'In Training');
                  const progressPct = Number(t.progress) || 0;
                  return `
                    <tr>
                      <td>
                        <div class="user-cell">
                          <div class="user-cell-avatar">${(t.fullName || 'TR').substring(0, 2).toUpperCase()}</div>
                          <div class="user-cell-info">
                            <span class="user-cell-name font-semibold">${t.fullName}</span>
                            <span class="user-cell-code">${t.traineeCode || '-'} • ${t.email || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="font-medium text-main">${t.track || 'Engineering Trainee'}</div>
                        <div class="text-muted" style="font-size: 0.75rem;">${t.batchName || 'Cohort 2026'}</div>
                      </td>
                      <td>${t.department || 'Engineering'}</td>
                      <td style="min-width: 150px;">
                        <div class="flex items-center gap-2">
                          <div class="progress-bar-container" style="flex: 1; height: 6px; background: var(--bg-hover); border-radius: 3px; overflow: hidden;">
                            <div class="progress-bar" style="width: ${progressPct}%; height: 100%; background: ${progressPct >= 80 ? 'var(--success)' : 'var(--primary)'}; border-radius: 3px;"></div>
                          </div>
                          <span style="font-size: 0.75rem; font-weight: 600; min-width: 32px;">${progressPct}%</span>
                        </div>
                        <div class="text-muted" style="font-size: 0.7rem; margin-top: 2px;">${t.completedModules || 0}/${t.totalModules || 5} modules</div>
                      </td>
                      <td>
                        <span class="badge ${statusClass}">
                          <span class="badge-dot"></span> ${statusLabel}
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-secondary btn-sm" onclick="Router.navigate('training')">Review</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async postRender() {}
};

window.TrainerDashboardView = TrainerDashboardView;
