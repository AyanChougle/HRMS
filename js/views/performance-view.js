/**
 * DIALLO HRMS — PERFORMANCE & APPRAISAL MODULE (PHASE 8)
 * OKRs & Goals, Multi-Tier Reviews (Self/Manager/HR), 1-on-1s, Development Plans, PIPs, and Appraisal Handoff
 */

const PerformanceView = {
  activeTab: 'goals',

  async renderHub() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployeeOnly = role === 'EMPLOYEE';
    const employeeId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;

    let activeCycle = null;
    let goals = [];
    let myReview = null;
    let recommendations = [];

    try {
      [activeCycle, goals, myReview, recommendations] = await Promise.all([
        performanceCycleService.getActiveCycle(),
        performanceService.getGoals({ employeeId }),
        performanceService.getReviewForEmployee(employeeId, 'cycle_2026_annual'),
        performanceService.getAppraisalRecommendations()
      ]);
    } catch (e) {
      console.warn('Performance Hub data load warning:', e);
    }

    // Compute progress stats
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
    const avgProgress = totalGoals > 0 ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / totalGoals) : 0;

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Performance</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Performance, Goals & Appraisals</h1>
            <p class="page-subtitle">Annual appraisal cycles, weighted OKRs, multi-tier reviews, 1-on-1 coaching, and merit increments</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="PerformanceView.openFeedbackModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              Give Feedback
            </button>
            <button class="btn btn-primary btn-sm" onclick="PerformanceView.openAddGoalModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Add Goal / OKR
            </button>
          </div>
        </div>
      </div>

      <!-- Active Cycle Banner Card -->
      <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, rgba(37,99,235,0.08), rgba(14,165,233,0.04)); border: 1px solid var(--primary-light);">
        <div class="card-body" style="padding: 16px 20px;">
          <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 16px;">
            <div>
              <div class="flex items-center gap-2">
                <span class="badge badge-primary font-bold">ACTIVE APPRAISAL CYCLE</span>
                <span class="font-bold text-main" style="font-size: 1.1rem;">${activeCycle?.name || '2026 Annual Performance Review'}</span>
              </div>
              <div style="font-size: 0.825rem; color: var(--text-secondary); margin-top: 4px;">
                Self-Review Period: <strong>Sep 1 – Sep 15</strong> • Manager Review: <strong>Sep 16 – Sep 30</strong> • Weighting: <strong>60% Goals / 40% Competencies</strong>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn-soft btn-sm" onclick="PerformanceView.switchTab('reviews')">
                ${myReview?.status === 'SELF_REVIEW_SUBMITTED' ? '✓ Self-Review Submitted' : '📝 Start Self-Review'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance KPI Cards -->
      <div class="kpi-grid" style="margin-bottom: 24px;">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">${completedGoals}/${totalGoals} Done</span>
          </div>
          <div class="kpi-value">${avgProgress}%</div>
          <div class="kpi-label">Goal Completion</div>
          <div class="kpi-subtitle">Weighted average</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">5-Point Scale</span>
          </div>
          <div class="kpi-value">${myReview?.overallRating ? `${myReview.overallRating} / 5.0` : '4.2 / 5.0'}</div>
          <div class="kpi-label">Performance Rating</div>
          <div class="kpi-subtitle">${myReview?.ratingLabel || 'Exceeds Expectations'}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Merit</span>
          </div>
          <div class="kpi-value">${recommendations.length} Pending</div>
          <div class="kpi-label">Appraisal Outcomes</div>
          <div class="kpi-subtitle">Salary & promotion handoff</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Coaching</span>
          </div>
          <div class="kpi-value">Active</div>
          <div class="kpi-label">1-on-1 Discussions</div>
          <div class="kpi-subtitle">Continuous feedback</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        <button class="tab-btn ${this.activeTab === 'goals' ? 'active' : ''}" onclick="PerformanceView.switchTab('goals')">My Goals & OKRs</button>
        <button class="tab-btn ${this.activeTab === 'reviews' ? 'active' : ''}" onclick="PerformanceView.switchTab('reviews')">Reviews & Assessment</button>
        ${role === 'MANAGER' || role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || role === 'HR' ? `
          <button class="tab-btn ${this.activeTab === 'team' ? 'active' : ''}" onclick="PerformanceView.switchTab('team')">Team Performance</button>
        ` : ''}
        <button class="tab-btn ${this.activeTab === 'coaching' ? 'active' : ''}" onclick="PerformanceView.switchTab('coaching')">1-on-1s & Feedback</button>
        <button class="tab-btn ${this.activeTab === 'development' ? 'active' : ''}" onclick="PerformanceView.switchTab('development')">Development & PIP</button>
        ${!isEmployeeOnly ? `
          <button class="tab-btn ${this.activeTab === 'appraisals' ? 'active' : ''}" onclick="PerformanceView.switchTab('appraisals')">Appraisals & Cycles</button>
        ` : ''}
      </div>

      <!-- TAB CONTENT VIEWPORT -->
      <div id="performance-tab-content">
        ${await this.renderTabContent(goals, myReview, role, employeeId)}
      </div>
    `;
  },

  async renderTabContent(goals, myReview, role, employeeId) {
    if (this.activeTab === 'reviews') {
      return await this.renderReviewsTab(myReview, employeeId);
    } else if (this.activeTab === 'team') {
      return await this.renderTeamTab();
    } else if (this.activeTab === 'coaching') {
      return await this.renderCoachingTab(employeeId);
    } else if (this.activeTab === 'development') {
      return await this.renderDevelopmentTab(employeeId);
    } else if (this.activeTab === 'appraisals') {
      return await this.renderAppraisalsTab();
    }
    return await this.renderGoalsTab(goals);
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    Router.navigate('performance');
  },

  // 1. MY GOALS & OKRs TAB
  async renderGoalsTab(goals) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">My Performance Objectives (OKRs)</div>
            <div class="card-subtitle">Weighted strategic goals for the 2026 Annual Cycle (Total weight must equal 100%)</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="PerformanceView.openAddGoalModal()">+ Add Objective</button>
        </div>
        <div class="card-body" style="padding: 0;">
          ${goals.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-icon" style="width: 44px; height: 44px; margin-bottom: 8px; background: var(--primary-light); color: var(--primary);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="empty-state-title">No Goals Assigned Yet</div>
              <div class="empty-state-desc">Click "Add Objective" to establish your weighted key performance targets.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Goal Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Weight</th>
                  <th>Target Metric</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${goals.map(g => `
                  <tr>
                    <td>
                      <div>
                        <span class="font-bold text-main">${g.title}</span>
                        ${g.description ? `<div class="text-secondary" style="font-size: 0.75rem; margin-top: 2px;">${g.description}</div>` : ''}
                      </div>
                    </td>
                    <td><span class="badge badge-neutral">${g.category}</span></td>
                    <td>
                      <span class="badge ${g.priority === 'CRITICAL' || g.priority === 'HIGH' ? 'badge-danger' : 'badge-warning'}">
                        ${g.priority}
                      </span>
                    </td>
                    <td><strong style="color: var(--primary);">${g.weight}%</strong></td>
                    <td>${g.target || '100%'}</td>
                    <td style="min-width: 140px;">
                      <div class="flex items-center gap-2">
                        <div style="flex: 1; height: 6px; background: var(--bg-hover); border-radius: 3px; overflow: hidden;">
                          <div style="width: ${g.progress || 0}%; height: 100%; background: ${g.progress === 100 ? 'var(--success)' : 'var(--primary)'};"></div>
                        </div>
                        <span class="font-bold text-main" style="font-size: 0.8rem;">${g.progress || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge ${g.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}">
                        ${g.status}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-soft btn-sm" onclick="PerformanceView.openUpdateProgressModal('${g.id}', '${g.title}', ${g.progress || 0})">Update</button>
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

  openAddGoalModal() {
    ModalManager.openModal({
      id: 'add-goal-modal',
      title: 'Define Performance Goal / OKR',
      subtitle: 'Set measurable targets with strategic weights (Max 100% total)',
      contentHtml: `
        <form id="new-goal-form" onsubmit="event.preventDefault(); PerformanceView.saveGoal()">
          <div class="form-group">
            <label class="form-label required">Goal Title / Objective</label>
            <input type="text" id="goal-title" class="form-control" placeholder="e.g. Implement automated attendance reconciliation engine" required />
          </div>

          <div class="form-group">
            <label class="form-label">Description & Success Criteria</label>
            <textarea id="goal-desc" class="form-control" rows="2" placeholder="Key deliverables and milestones..."></textarea>
          </div>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Category</label>
              <select id="goal-cat" class="form-control">
                <option value="BUSINESS">Business / Operational</option>
                <option value="FINANCIAL">Financial / Revenue</option>
                <option value="CUSTOMER">Customer / Quality</option>
                <option value="LEARNING">Learning & Development</option>
              </select>
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Priority</label>
              <select id="goal-prio" class="form-control">
                <option value="HIGH" selected>High</option>
                <option value="CRITICAL">Critical</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label required">Weight (%)</label>
              <input type="number" id="goal-weight" class="form-control" value="25" min="5" max="100" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Target Metric</label>
              <input type="text" id="goal-target" class="form-control" value="100% Delivered" required />
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PerformanceView.saveGoal()">Save Objective</button>
      `
    });
  },

  async saveGoal() {
    const title = document.getElementById('goal-title')?.value.trim();
    const description = document.getElementById('goal-desc')?.value.trim();
    const category = document.getElementById('goal-cat')?.value;
    const priority = document.getElementById('goal-prio')?.value;
    const weight = Number(document.getElementById('goal-weight')?.value) || 25;
    const target = document.getElementById('goal-target')?.value.trim();

    if (!title) return;

    try {
      await performanceService.createGoal({ title, description, category, priority, weight, target });
      Toast.success('Goal created successfully!');
      ModalManager.closeModal();
      Router.navigate('performance');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openUpdateProgressModal(goalId, title, currentProgress) {
    ModalManager.openModal({
      id: 'update-goal-progress-modal',
      title: `Update Progress: ${title}`,
      subtitle: 'Adjust completion percentage and add milestone notes',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Current Completion: <strong id="progress-val-display" style="color: var(--primary);">${currentProgress}%</strong></label>
          <input type="range" id="prog-slider" class="form-control" min="0" max="100" value="${currentProgress}" oninput="document.getElementById('progress-val-display').textContent = this.value + '%'" style="cursor: pointer;" />
        </div>
        <div class="form-group">
          <label class="form-label">Progress Update Notes</label>
          <textarea id="prog-comment" class="form-control" rows="3" placeholder="Explain achievements or blockers for this update..."></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PerformanceView.saveGoalProgress('${goalId}')">Save Progress</button>
      `
    });
  },

  async saveGoalProgress(goalId) {
    const progress = Number(document.getElementById('prog-slider')?.value) || 0;
    const comment = document.getElementById('prog-comment')?.value.trim();

    try {
      await performanceService.updateGoalProgress(goalId, progress, comment);
      Toast.success('Goal progress updated.');
      ModalManager.closeModal();
      Router.navigate('performance');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  // 2. REVIEWS & ASSESSMENT TAB (SELF REVIEW WIZARD)
  async renderReviewsTab(myReview, employeeId) {
    const competencies = await performanceService.getCompetencies();

    return `
      <div class="card" style="max-width: 800px; margin: 0 auto; padding: 24px;">
        <div class="card-header" style="padding: 0 0 16px 0; border-bottom: 1px solid var(--border-main); margin-bottom: 20px;">
          <div>
            <div class="card-title">Employee Self-Assessment (2026 Annual Cycle)</div>
            <div class="card-subtitle">Reflect on key accomplishments, challenges, and core competency demonstrations</div>
          </div>
          <span class="badge ${myReview?.status === 'SELF_REVIEW_SUBMITTED' ? 'badge-success' : 'badge-warning'}">
            ${myReview?.status === 'SELF_REVIEW_SUBMITTED' ? '✓ Submitted for Manager Review' : 'Draft / In Progress'}
          </span>
        </div>

        <form id="self-review-form" onsubmit="event.preventDefault(); PerformanceView.submitSelfAssessment()">
          <div class="form-group">
            <label class="form-label required">1. Key Achievements & Highlights</label>
            <textarea id="self-achieve" class="form-control" rows="3" placeholder="Describe your most impactful deliverables and projects..." required ${myReview?.status === 'SELF_REVIEW_SUBMITTED' ? 'readonly' : ''}>${myReview?.selfAssessment?.achievements || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label required">2. Key Challenges & Lessons Learned</label>
            <textarea id="self-challenges" class="form-control" rows="3" placeholder="What obstacles did you encounter and how did you overcome them?" required ${myReview?.status === 'SELF_REVIEW_SUBMITTED' ? 'readonly' : ''}>${myReview?.selfAssessment?.challenges || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label required">3. Core Strengths Demonstrated</label>
            <textarea id="self-strengths" class="form-control" rows="2" placeholder="Specific technical or leadership strengths..." required ${myReview?.status === 'SELF_REVIEW_SUBMITTED' ? 'readonly' : ''}>${myReview?.selfAssessment?.strengths || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label required">4. Areas for Growth & Development</label>
            <textarea id="self-growth" class="form-control" rows="2" placeholder="Skills, tools, or domains you want to master next cycle..." required ${myReview?.status === 'SELF_REVIEW_SUBMITTED' ? 'readonly' : ''}>${myReview?.selfAssessment?.improvementAreas || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label required">5. Overall Self-Rating (1.0 to 5.0)</label>
            <select id="self-rating" class="form-control" style="max-width: 320px;" ${myReview?.status === 'SELF_REVIEW_SUBMITTED' ? 'disabled' : ''}>
              <option value="5.0" ${myReview?.selfAssessment?.selfRating === 5.0 ? 'selected' : ''}>5.0 — Outstanding Performance</option>
              <option value="4.5" ${myReview?.selfAssessment?.selfRating === 4.5 ? 'selected' : ''}>4.5 — Exceeds Expectations</option>
              <option value="4.0" ${myReview?.selfAssessment?.selfRating === 4.0 || !myReview ? 'selected' : ''}>4.0 — Strong Contributor</option>
              <option value="3.0" ${myReview?.selfAssessment?.selfRating === 3.0 ? 'selected' : ''}>3.0 — Meets Expectations</option>
              <option value="2.0" ${myReview?.selfAssessment?.selfRating === 2.0 ? 'selected' : ''}>2.0 — Developing</option>
            </select>
          </div>

          ${myReview?.status !== 'SELF_REVIEW_SUBMITTED' ? `
            <div class="flex justify-end gap-3" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-main);">
              <button type="submit" class="btn btn-primary btn-sm">Submit Self-Assessment to Manager</button>
            </div>
          ` : ''}
        </form>
      </div>
    `;
  },

  async submitSelfAssessment() {
    const achievements = document.getElementById('self-achieve')?.value.trim();
    const challenges = document.getElementById('self-challenges')?.value.trim();
    const strengths = document.getElementById('self-strengths')?.value.trim();
    const improvementAreas = document.getElementById('self-growth')?.value.trim();
    const selfRating = Number(document.getElementById('self-rating')?.value) || 4.0;

    if (!achievements || !challenges) {
      Toast.warning('Please complete all self-assessment questions.');
      return;
    }

    try {
      await performanceService.submitSelfReview({ achievements, challenges, strengths, improvementAreas, selfRating });
      Toast.success('Self-review submitted to your reporting manager!');
      Router.navigate('performance');
    } catch (e) {
      Toast.error(`Submission failed: ${e.message}`);
    }
  },

  // 3. TEAM PERFORMANCE TAB (MANAGER PORTAL)
  async renderTeamTab() {
    const managerId = AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const team = await employeeService.getEmployees({ managerId });

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Team Performance & Appraisal Roster</div>
            <div class="card-subtitle">Evaluate direct reporting staff, score competencies, and submit manager assessments</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${team.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Direct Reports Found</div>
              <div class="empty-state-desc">Employees assigned with you as manager will appear here.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Appraisal Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${team.map(t => `
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-cell-avatar">${(t.fullName || t.name).substring(0, 2).toUpperCase()}</div>
                        <div class="user-cell-info">
                          <span class="user-cell-name font-semibold">${t.fullName || t.name}</span>
                          <span class="user-cell-code font-bold" style="color: var(--primary);">${t.employeeCode || t.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>${t.designation || 'Staff'}</td>
                    <td>${t.department || 'General'}</td>
                    <td><span class="badge badge-warning">Ready for Review</span></td>
                    <td>
                      <div class="flex items-center gap-1">
                        <button class="btn btn-primary btn-sm" onclick="PerformanceView.openManagerReviewModal('${t.id}', '${t.fullName || t.name}')">Conduct Review</button>
                        <button class="btn btn-soft btn-sm" onclick="PerformanceView.openScheduleMeetingModal('${t.id}', '${t.fullName || t.name}')">1-on-1</button>
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

  async openManagerReviewModal(employeeId, name) {
    const goals = await performanceService.getGoals({ employeeId });
    const competencies = await performanceService.getCompetencies();

    ModalManager.openModal({
      id: 'manager-review-modal',
      title: `Manager Review: ${name}`,
      subtitle: 'Evaluate weighted OKRs (60%) and core competencies (40%)',
      size: 'lg',
      contentHtml: `
        <form id="mgr-eval-form" onsubmit="event.preventDefault(); PerformanceView.submitManagerAssessment('${employeeId}', '${name}')">
          <div class="card" style="padding: 12px 16px; margin-bottom: 16px; background: var(--bg-hover);">
            <strong>Goal Achievement Score:</strong> ${performanceCalculationService.calculateGoalScore(goals)} / 5.0 (${goals.length} Goals Logged)
          </div>

          <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--primary); margin-bottom: 12px;">Competency Evaluation (1 to 5 Stars)</h4>
          <div class="flex flex-col gap-3" style="margin-bottom: 16px;">
            ${competencies.map((c, i) => `
              <div class="flex items-center justify-between" style="padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 6px;">
                <div>
                  <div class="font-semibold text-main" style="font-size: 0.85rem;">${c.name}</div>
                  <div class="text-secondary" style="font-size: 0.75rem;">${c.description}</div>
                </div>
                <select id="comp-rate-${i}" class="form-control" style="width: 100px;">
                  <option value="5">5 - Outstanding</option>
                  <option value="4" selected>4 - Exceeds</option>
                  <option value="3">3 - Meets</option>
                  <option value="2">2 - Developing</option>
                </select>
              </div>
            `).join('')}
          </div>

          <div class="form-group">
            <label class="form-label required">Manager Feedback & Strengths</label>
            <textarea id="mgr-feedback" class="form-control" rows="3" placeholder="Key contributions and commendations..." required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label required">Development Recommendations</label>
            <textarea id="mgr-recommend" class="form-control" rows="2" placeholder="Next-step growth areas and training targets..." required></textarea>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PerformanceView.submitManagerAssessment('${employeeId}', '${name}')">Submit Evaluation</button>
      `
    });
  },

  async submitManagerAssessment(employeeId, name) {
    const feedback = document.getElementById('mgr-feedback')?.value.trim();
    const improvementAreas = document.getElementById('mgr-recommend')?.value.trim();
    const competencies = await performanceService.getCompetencies();

    const competencyRatings = competencies.map((c, i) => ({
      competencyName: c.name,
      rating: Number(document.getElementById(`comp-rate-${i}`)?.value) || 4
    }));

    if (!feedback) return;

    try {
      const reviewId = `cycle_2026_annual_${employeeId}`;
      await performanceService.submitManagerReview(reviewId, { feedback, improvementAreas, competencyRatings });
      Toast.success(`Manager review for ${name} submitted!`);
      ModalManager.closeModal();
      Router.navigate('performance');
    } catch (e) {
      Toast.error(`Evaluation failed: ${e.message}`);
    }
  },

  // 4. COACHING & 1-ON-1s TAB
  async renderCoachingTab(employeeId) {
    const [meetings, feedback] = await Promise.all([
      performanceService.getOneOnOnes(employeeId),
      performanceService.getFeedback(employeeId)
    ]);

    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- 1-on-1 Syncs -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">1-on-1 Coaching Syncs</div>
            <button class="btn btn-primary btn-sm" onclick="PerformanceView.openScheduleMeetingModal('${employeeId}')">+ Schedule</button>
          </div>
          <div class="card-body" style="padding: 0;">
            ${meetings.length === 0 ? `
              <div style="padding: 30px; text-align: center; color: var(--text-muted);">No 1-on-1 meetings scheduled.</div>
            ` : `
              <div class="flex flex-col gap-2" style="padding: 12px;">
                ${meetings.map(m => `
                  <div style="padding: 12px; background: var(--bg-hover); border-radius: 6px;">
                    <div class="flex items-center justify-between">
                      <strong class="text-main">${m.agenda}</strong>
                      <span class="badge badge-primary">${m.date}</span>
                    </div>
                    <div class="text-secondary" style="font-size: 0.8rem; margin-top: 4px;">With: ${m.managerName} at ${m.time}</div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- Continuous Recognition & Feedback -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Continuous Feedback & Kudos</div>
            <button class="btn btn-secondary btn-sm" onclick="PerformanceView.openFeedbackModal('${employeeId}')">+ Give Feedback</button>
          </div>
          <div class="card-body" style="padding: 0;">
            ${feedback.length === 0 ? `
              <div style="padding: 30px; text-align: center; color: var(--text-muted);">No feedback notes recorded yet.</div>
            ` : `
              <div class="flex flex-col gap-2" style="padding: 12px;">
                ${feedback.map(f => `
                  <div style="padding: 12px; background: var(--bg-hover); border-radius: 6px;">
                    <div class="flex items-center justify-between">
                      <span class="badge badge-success font-bold">${f.type}</span>
                      <span class="text-muted" style="font-size: 0.75rem;">From: ${f.fromUserName}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-main); margin-top: 6px;">"${f.message}"</p>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  },

  openScheduleMeetingModal(employeeId, empName = 'Staff') {
    ModalManager.openModal({
      id: 'schedule-sync-modal',
      title: 'Schedule 1-on-1 Coaching Sync',
      subtitle: `Book coaching time with ${empName}`,
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Meeting Date</label>
            <input type="date" id="sync-date" class="form-control" value="${new Date().toISOString().slice(0, 10)}" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Time</label>
            <input type="time" id="sync-time" class="form-control" value="10:30" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Discussion Agenda</label>
          <input type="text" id="sync-agenda" class="form-control" value="Bi-weekly OKRs review & career coaching" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PerformanceView.saveMeeting('${employeeId}')">Schedule 1-on-1</button>
      `
    });
  },

  async saveMeeting(employeeId) {
    const date = document.getElementById('sync-date')?.value;
    const time = document.getElementById('sync-time')?.value;
    const agenda = document.getElementById('sync-agenda')?.value.trim();

    try {
      await performanceService.scheduleOneOnOne({ employeeId, date, time, agenda });
      Toast.success('1-on-1 meeting scheduled!');
      ModalManager.closeModal();
      this.switchTab('coaching');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  openFeedbackModal(defaultEmpId = null) {
    ModalManager.openModal({
      id: 'give-feedback-modal',
      title: 'Share Performance Feedback / Kudos',
      subtitle: 'Provide constructive feedback or peer recognition',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Feedback Type</label>
          <select id="fb-type" class="form-control">
            <option value="RECOGNITION" selected>🌟 Recognition / Kudos</option>
            <option value="CONSTRUCTIVE">💡 Constructive Coaching</option>
            <option value="GENERAL">💬 General Observation</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Feedback Message</label>
          <textarea id="fb-msg" class="form-control" rows="4" placeholder="Write feedback note..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PerformanceView.saveFeedback('${defaultEmpId}')">Send Feedback</button>
      `
    });
  },

  async saveFeedback(employeeId) {
    const targetEmpId = employeeId || AuthGuard.userProfile?.employeeId || AuthGuard.currentUser?.uid;
    const type = document.getElementById('fb-type')?.value;
    const message = document.getElementById('fb-msg')?.value.trim();

    if (!message) return;

    try {
      await performanceService.giveFeedback({ employeeId: targetEmpId, type, message });
      Toast.success('Feedback recorded!');
      ModalManager.closeModal();
      this.switchTab('coaching');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  // 5. DEVELOPMENT PLANS & PIPs TAB
  async renderDevelopmentTab(employeeId) {
    const [plans, pips] = await Promise.all([
      performanceService.getDevelopmentPlans(employeeId),
      performanceService.getPIPs(employeeId)
    ]);

    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Development Plans -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Career Development Plans (IDP)</div>
            <button class="btn btn-primary btn-sm" onclick="PerformanceView.openAddDevPlanModal('${employeeId}')">+ Add Skill Goal</button>
          </div>
          <div class="card-body" style="padding: 0;">
            ${plans.length === 0 ? `
              <div style="padding: 30px; text-align: center; color: var(--text-muted);">No active development plans.</div>
            ` : `
              <table class="data-table">
                <thead><tr><th>Growth Area</th><th>Action</th><th>Target Date</th></tr></thead>
                <tbody>
                  ${plans.map(p => `
                    <tr>
                      <td class="font-semibold text-main">${p.area}</td>
                      <td>${p.actionItem}</td>
                      <td>${p.targetDate}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>

        <!-- Performance Improvement Plans (PIP) -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Structured Improvement (PIP)</div>
          </div>
          <div class="card-body" style="padding: 0;">
            ${pips.length === 0 ? `
              <div style="padding: 30px; text-align: center; color: var(--text-muted);">No active PIP interventions recorded.</div>
            ` : `
              <table class="data-table">
                <thead><tr><th>Objectives</th><th>Timeline</th><th>Status</th></tr></thead>
                <tbody>
                  ${pips.map(pip => `
                    <tr>
                      <td class="font-semibold text-main">${pip.objectives}</td>
                      <td>${pip.startDate} to ${pip.endDate}</td>
                      <td><span class="badge badge-warning">${pip.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>
      </div>
    `;
  },

  openAddDevPlanModal(employeeId) {
    ModalManager.openModal({
      id: 'add-dev-plan-modal',
      title: 'Create Individual Development Plan',
      subtitle: 'Define target skill growth and training commitments',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Development Area</label>
          <input type="text" id="dev-area" class="form-control" placeholder="e.g. Cloud System Architecture" required />
        </div>
        <div class="form-group">
          <label class="form-label required">Action Commitments</label>
          <input type="text" id="dev-action" class="form-control" placeholder="e.g. AWS Certified Solutions Architect certification" required />
        </div>
        <div class="form-group">
          <label class="form-label required">Target Completion Date</label>
          <input type="date" id="dev-date" class="form-control" value="2026-12-31" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PerformanceView.saveDevPlan('${employeeId}')">Save Plan</button>
      `
    });
  },

  async saveDevPlan(employeeId) {
    const area = document.getElementById('dev-area')?.value.trim();
    const actionItem = document.getElementById('dev-action')?.value.trim();
    const targetDate = document.getElementById('dev-date')?.value;

    if (!area) return;

    try {
      await performanceService.createDevelopmentPlan({ employeeId, area, actionItem, targetDate });
      Toast.success('Development plan created!');
      ModalManager.closeModal();
      this.switchTab('development');
    } catch (e) {
      Toast.error(`Failed: ${e.message}`);
    }
  },

  // 6. APPRAISALS & OUTCOMES TAB (HR PORTAL)
  async renderAppraisalsTab() {
    const recs = await performanceService.getAppraisalRecommendations();

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Appraisal Recommendations & Merit Ledgers</div>
            <div class="card-subtitle">Approved performance increments for Compensation & Payroll handoff</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${recs.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 40px;">
              <div class="empty-state-title">No Appraisal Recommendations</div>
              <div class="empty-state-desc">Recommendations generated from manager reviews will appear here.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Recommended Action</th>
                  <th>Increment %</th>
                  <th>Justification</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${recs.map(r => `
                  <tr>
                    <td class="font-bold text-main">${r.employeeName || 'Staff'}</td>
                    <td><span class="badge badge-primary font-bold">${r.recommendedAction}</span></td>
                    <td><strong style="color: var(--success); font-size: 1rem;">+${r.recommendedPercentage}%</strong></td>
                    <td style="max-width: 240px; font-size: 0.8rem;">${r.reason}</td>
                    <td>
                      <span class="badge ${r.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}">
                        ${r.status}
                      </span>
                    </td>
                    <td>
                      ${r.status === 'PENDING' ? `
                        <button class="btn btn-primary btn-sm" onclick="PerformanceView.approveAppraisal('${r.id}')">Approve for Payroll</button>
                      ` : '<span class="text-muted" style="font-size: 0.75rem;">✓ Approved</span>'}
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

  async approveAppraisal(id) {
    try {
      await performanceService.approveAppraisalRecommendation(id);
      Toast.success('Appraisal outcome approved and queued for Compensation update!');
      Router.navigate('performance');
    } catch (e) {
      Toast.error(`Approval failed: ${e.message}`);
    }
  }
};

window.PerformanceView = PerformanceView;
