/**
 * DIALLO HRMS — ADMIN / HR EXECUTIVE DASHBOARD (PHASE 3)
 * Full organizational KPIs, attendance trend SVG, headcount donut, and action center
 */

const AdminDashboardView = {
  async render() {
    const todayStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const userDisplayName =
      AuthGuard.userProfile?.displayName ||
      AuthGuard.currentUser?.email?.split("@")[0] ||
      "User";

    return `
      <!-- Welcome Banner -->
      <div class="welcome-banner animate-fade-in">
        <div class="welcome-text">
          <h1>Good day, ${userDisplayName} 👋</h1>
          <p>Real-time workforce & HR operational metrics synced from Cloud Firestore.</p>
        </div>
        <div class="welcome-date-badge">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>${todayStr} (IST)</span>
        </div>
      </div>

      <!-- 5 Core KPI Metrics Cards -->
      <div class="kpi-grid" id="dashboard-kpi-grid">
        <div class="kpi-card" onclick="Router.navigate('employees')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Total</span>
          </div>
          <div class="kpi-value" id="kpi-total-employees">-</div>
          <div class="kpi-label">Active Employees</div>
          <div class="kpi-subtitle">Registered in Firestore</div>
        </div>

        <div class="kpi-card" onclick="Router.navigate('employees')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Onboarding</span>
          </div>
          <div class="kpi-value" id="kpi-probation-employees">-</div>
          <div class="kpi-label">New Joiners</div>
          <div class="kpi-subtitle">Probation / Interns</div>
        </div>

        <div class="kpi-card" onclick="Router.navigate('attendance')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive" id="kpi-present-pct">0%</span>
          </div>
          <div class="kpi-value" id="kpi-present-count">-</div>
          <div class="kpi-label">Present Today</div>
          <div class="kpi-subtitle" id="kpi-punctuality-sub">Biometric & Web Check-ins</div>
        </div>

        <div class="kpi-card" onclick="Router.navigate('leave')" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Absence</span>
          </div>
          <div class="kpi-value" id="kpi-leave-count">-</div>
          <div class="kpi-label">On Leave Today</div>
          <div class="kpi-subtitle">Approved scheduled absences</div>
        </div>

        <div class="kpi-card" onclick="AdminDashboardView.scrollToActions()" style="cursor: pointer;">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--danger-light); color: var(--danger);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="kpi-trend warning" id="kpi-approvals-status">Pending</span>
          </div>
          <div class="kpi-value" id="kpi-approvals-count">-</div>
          <div class="kpi-label">Pending Approvals</div>
          <div class="kpi-subtitle">Leaves & Action Requests</div>
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Attendance Trend Chart -->
        <div class="col-span-8 card">
          <div class="card-header">
            <div>
              <div class="card-title">Weekly Attendance Trend</div>
              <div class="card-subtitle">Daily workforce presence percentage over the current cycle</div>
            </div>
            <span class="badge badge-neutral">Live Stream</span>
          </div>
          <div class="card-body">
            <div id="attendance-trend-chart" class="chart-container"></div>
          </div>
        </div>

        <!-- Headcount by Department Donut Chart -->
        <div class="col-span-4 card">
          <div class="card-header">
            <div>
              <div class="card-title">Headcount by Dept</div>
              <div class="card-subtitle">Distribution across business units</div>
            </div>
          </div>
          <div class="card-body">
            <div id="department-donut-chart"></div>
          </div>
        </div>

        <!-- Quick Access Shortcuts -->
        <div class="col-span-12 card">
          <div class="card-header">
            <div class="card-title">Quick Access Shortcuts</div>
            <div class="card-subtitle">Frequently accessed HR tools & workflows</div>
          </div>
          <div class="card-body">
            <div class="quick-access-grid">
              <button class="quick-action-btn" onclick="Forms.openEmployeeModal()">
                <div class="quick-action-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                </div>
                <span>Add Employee</span>
              </button>

              <button class="quick-action-btn" onclick="Forms.openApplyLeaveModal()">
                <div class="quick-action-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span>Apply Leave</span>
              </button>

              <button class="quick-action-btn" onclick="Router.navigate('attendance')">
                <div class="quick-action-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span>Punch Logs</span>
              </button>

              <button class="quick-action-btn" onclick="Router.navigate('payroll')">
                <div class="quick-action-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span>Run Payroll</span>
              </button>

              <button class="quick-action-btn" onclick="Router.navigate('ess')">
                <div class="quick-action-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span>Kiosk Terminal</span>
              </button>

              <button class="quick-action-btn" onclick="Router.navigate('reports')">
                <div class="quick-action-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Action Center (Approvals) -->
        <div class="col-span-6 card" id="action-center-widget">
          <div class="card-header">
            <div class="card-title">
              <span id="action-center-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--success);"></span>
              Action Center (<span id="action-center-counter">0</span>)
            </div>
            <span class="badge badge-success" id="action-center-badge">Up to Date</span>
          </div>
          <div class="card-body" id="action-center-body">
            <div style="padding: 20px; text-align: center; color: var(--text-muted);">Loading pending actions...</div>
          </div>
        </div>

        <!-- Today's Attendance Breakdown -->
        <div class="col-span-6 card">
          <div class="card-header">
            <div class="card-title">Today's Attendance Status</div>
            <span class="badge badge-primary" id="today-avg-hours">0h 00m Avg</span>
          </div>
          <div class="card-body" id="today-attendance-body">
            <div class="attendance-stat-bars">
              <div class="stat-bar-row">
                <div class="stat-bar-header">
                  <span class="text-secondary">On-Time Checkins</span>
                  <span class="font-semibold text-main" id="bar-ontime-label">0 (0%)</span>
                </div>
                <div class="stat-bar-track">
                  <div class="stat-bar-fill" id="bar-ontime-fill" style="width: 0%; background-color: var(--success);"></div>
                </div>
              </div>

              <div class="stat-bar-row">
                <div class="stat-bar-header">
                  <span class="text-secondary">Work From Home (WFH)</span>
                  <span class="font-semibold text-main" id="bar-wfh-label">0 (0%)</span>
                </div>
                <div class="stat-bar-track">
                  <div class="stat-bar-fill" id="bar-wfh-fill" style="width: 0%; background-color: var(--primary);"></div>
                </div>
              </div>

              <div class="stat-bar-row">
                <div class="stat-bar-header">
                  <span class="text-secondary">Late Arrival</span>
                  <span class="font-semibold text-main" id="bar-late-label">0 (0%)</span>
                </div>
                <div class="stat-bar-track">
                  <div class="stat-bar-fill" id="bar-late-fill" style="width: 0%; background-color: var(--warning);"></div>
                </div>
              </div>

              <div class="stat-bar-row">
                <div class="stat-bar-header">
                  <span class="text-secondary">On Leave / Off</span>
                  <span class="font-semibold text-main" id="bar-leave-label">0 (0%)</span>
                </div>
                <div class="stat-bar-track">
                  <div class="stat-bar-fill" id="bar-leave-fill" style="width: 0%; background-color: var(--accent-leave);"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Announcements -->
        <div class="col-span-12 card">
          <div class="card-header">
            <div class="card-title">Recent Company Announcements</div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('communication')">Communication Hub</button>
          </div>
          <div class="card-body" id="dashboard-announcements-body">
            <div style="padding: 20px; text-align: center; color: var(--text-muted);">Loading announcements from Firestore...</div>
          </div>
        </div>
      </div>
    `;
  },

  async postRender() {
    try {
      const [employees, attendanceSum, approvals, announcements, departments] =
        await Promise.all([
          employeeService.getEmployees(),
          attendanceService.getTodaySummary(),
          approvalService.getPendingApprovals(),
          announcementService.getAnnouncements(null, 3),
          departmentService.getDepartments(),
        ]);

      const totalEmp = employees.length;
      const probationEmp = employees.filter(
        (e) => e.employmentType === "Probation" || e.type === "Probation",
      ).length;
      const presentCount = attendanceSum.present;
      const leaveCount = attendanceSum.onLeave;
      const approvalsCount = approvals.length;

      document.getElementById("kpi-total-employees").textContent = totalEmp;
      document.getElementById("kpi-probation-employees").textContent =
        probationEmp;
      document.getElementById("kpi-present-count").textContent = presentCount;
      document.getElementById("kpi-leave-count").textContent = leaveCount;
      document.getElementById("kpi-approvals-count").textContent =
        approvalsCount;

      const pct =
        totalEmp > 0 ? Math.round((presentCount / totalEmp) * 100) : 0;
      document.getElementById("kpi-present-pct").textContent = `${pct}%`;
      document.getElementById("kpi-punctuality-sub").textContent =
        `${attendanceSum.onTime} On Time • ${attendanceSum.late} Late`;

      if (approvalsCount > 0) {
        document.getElementById("kpi-approvals-status").textContent =
          "Needs Action";
        document.getElementById("action-center-dot").style.background =
          "var(--danger)";
        document.getElementById("action-center-badge").className =
          "badge badge-warning";
        document.getElementById("action-center-badge").textContent =
          "Pending Items";
      }
      document.getElementById("action-center-counter").textContent =
        approvalsCount;

      // Action Center List
      const actionBody = document.getElementById("action-center-body");
      if (approvals.length === 0) {
        actionBody.innerHTML = `
          <div class="empty-state" style="border: none; padding: 30px 10px;">
            <div class="empty-state-icon" style="width: 40px; height: 40px; margin-bottom: 8px; background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div class="empty-state-title" style="font-size: 0.95rem;">All Caught Up!</div>
            <div class="empty-state-desc" style="font-size: 0.8rem; margin-bottom: 0;">No pending leaves, claims or regularization requests requiring approval.</div>
          </div>
        `;
      } else {
        actionBody.innerHTML = `
          <div class="action-center-list">
            ${approvals
              .map(
                (act) => `
              <div class="action-item" id="action-row-${act.id}">
                <div class="action-item-info">
                  <div class="action-item-icon">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                  <div>
                    <div class="action-item-text">${act.employee} — <span class="text-secondary font-medium">${act.type}</span></div>
                    <div class="action-item-meta">${act.detail}</div>
                  </div>
                </div>
                <div class="action-item-buttons">
                  <button class="btn btn-soft btn-sm" onclick="AdminDashboardView.approveAction('${act.id}', '${act.employee}')">Approve</button>
                  <button class="btn btn-secondary btn-sm" onclick="AdminDashboardView.rejectAction('${act.id}', '${act.employee}')">Reject</button>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `;
      }

      // Today Attendance Bars
      document.getElementById("today-avg-hours").textContent =
        `${attendanceSum.avgWorkHours} Avg`;
      const onTimePct =
        totalEmp > 0 ? Math.round((attendanceSum.onTime / totalEmp) * 100) : 0;
      const wfhPct =
        totalEmp > 0 ? Math.round((attendanceSum.wfh / totalEmp) * 100) : 0;
      const latePct =
        totalEmp > 0 ? Math.round((attendanceSum.late / totalEmp) * 100) : 0;
      const leavePct =
        totalEmp > 0 ? Math.round((attendanceSum.onLeave / totalEmp) * 100) : 0;

      document.getElementById("bar-ontime-label").textContent =
        `${attendanceSum.onTime} (${onTimePct}%)`;
      document.getElementById("bar-ontime-fill").style.width = `${onTimePct}%`;
      document.getElementById("bar-wfh-label").textContent =
        `${attendanceSum.wfh} (${wfhPct}%)`;
      document.getElementById("bar-wfh-fill").style.width = `${wfhPct}%`;
      document.getElementById("bar-late-label").textContent =
        `${attendanceSum.late} (${latePct}%)`;
      document.getElementById("bar-late-fill").style.width = `${latePct}%`;
      document.getElementById("bar-leave-label").textContent =
        `${attendanceSum.onLeave} (${leavePct}%)`;
      document.getElementById("bar-leave-fill").style.width = `${leavePct}%`;

      // SVG Charts
      Charts.renderTrendChart("attendance-trend-chart");
      const deptColors = [
        "#2563eb",
        "#0891b2",
        "#7c3aed",
        "#ea580c",
        "#16a34a",
        "#db2777",
        "#dc2626",
        "#4f46e5",
      ];
      const deptSegments = departments.map((d, i) => ({
        label: d.name,
        count: employees.filter((e) => e.department === d.name).length,
        color: deptColors[i % deptColors.length],
      }));
      Charts.renderDonutChart("department-donut-chart", deptSegments);

      // Announcements
      const annBody = document.getElementById("dashboard-announcements-body");
      if (announcements.length === 0) {
        annBody.innerHTML = `
          <div class="empty-state" style="border: none; padding: 30px 10px;">
            <div class="empty-state-icon" style="width: 40px; height: 40px; margin-bottom: 8px; background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
              </svg>
            </div>
            <div class="empty-state-title" style="font-size: 0.95rem;">No Announcements Published</div>
            <div class="empty-state-desc" style="font-size: 0.8rem; margin-bottom: 12px;">Share notices and policy updates with your workforce.</div>
            <button class="btn btn-soft btn-sm" onclick="Router.navigate('communication')">+ Post Announcement</button>
          </div>
        `;
      } else {
        annBody.innerHTML = `
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
            ${announcements
              .map(
                (ann) => `
              <div class="announcement-card">
                <div class="flex items-center justify-between" style="margin-bottom: 4px;">
                  <span class="badge badge-neutral">${ann.tag || "Notice"}</span>
                  <span class="announcement-date">${ann.date || "Today"}</span>
                </div>
                <div class="announcement-title">${ann.title}</div>
                <div class="announcement-desc">${ann.content || ann.description || ""}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        `;
      }
    } catch (err) {
      console.error("Error in AdminDashboardView postRender:", err);
    }
  },

  scrollToActions() {
    const el = document.getElementById("action-center-widget");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      el.style.boxShadow = "0 0 0 2px var(--primary)";
      setTimeout(() => {
        el.style.boxShadow = "";
      }, 1500);
    }
  },

  async approveAction(id, empName) {
    try {
      await approvalService.resolveApproval(id, "APPROVED");
      document.getElementById(`action-row-${id}`)?.remove();
      Toast.success(`Approved request for ${empName}`);
    } catch (err) {
      Toast.error(`Approval failed: ${err.message}`);
    }
  },

  rejectAction(id, empName) {
    ModalManager.confirm({
      title: "Reject Request",
      message: `Are you sure you want to reject the request for ${empName}?`,
      confirmText: "Reject Request",
      confirmClass: "btn-danger",
      onConfirm: async () => {
        try {
          await approvalService.resolveApproval(id, "REJECTED");
          document.getElementById(`action-row-${id}`)?.remove();
          Toast.warning(`Rejected request for ${empName}`);
        } catch (err) {
          Toast.error(`Rejection failed: ${err.message}`);
        }
      },
    });
  },
};

window.AdminDashboardView = AdminDashboardView;
