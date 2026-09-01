/**
 * DIALLO HRMS — CENTRALIZED SECURITY, AUDIT & MONITORING VIEW (PHASE 18)
 * Enterprise Security Operations Center (SOC) managing Audit Trails, Security Events,
 * Incident Lifecycles, Privileged Access Reviews, and Hardened Security Governance.
 */

const SecurityView = {
  activeTab: "dashboard",

  async render() {
    const role = AuthGuard.userProfile?.roleId || "EMPLOYEE";
    const isSuperAdminOrAdmin =
      role === "SUPER_ADMIN" || role === "COMPANY_ADMIN";
    const companyId = AuthGuard.userProfile?.companyId || "comp_diallo_india";

    if (!isSuperAdminOrAdmin) {
      return `
        <div class="empty-state" style="padding: 60px 20px;">
          <div class="empty-state-title text-danger">Restricted Security Area</div>
          <div class="empty-state-desc">Only authorized Super Administrators and Company Administrators can access Security Operations and Audit Logs.</div>
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('dashboard')">Return to Dashboard</button>
        </div>
      `;
    }

    const [dashboard, auditLogs, secEvents, incidents, accessList, settings] =
      await Promise.all([
        securityService.getSecurityDashboard(companyId),
        auditService.getAuditLogs(companyId, { limit: 50 }),
        securityService.getSecurityEvents(companyId),
        securityService.getSecurityIncidents(companyId),
        securityService.getAccessReviews(companyId),
        securityService.getSecuritySettings(companyId),
      ]);

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Security & Audit</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Security, Audit & Monitoring Operations</h1>
            <p class="page-subtitle">Centralized enterprise security posture, append-only audit trails, access reviews, and anomaly detection</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="SecurityView.openCreateIncidentModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              + Log Security Incident
            </button>
          </div>
        </div>
      </div>

      <!-- Top Security Metrics Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--success-light); color: var(--success);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">${dashboard.postureStatus}</span>
          </div>
          <div class="kpi-value">${dashboard.postureScore}</div>
          <div class="kpi-label">Security Posture Score</div>
          <div class="kpi-subtitle">Multi-Layer Firestore & Storage Rules</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--warning-light); color: var(--warning);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Active</span>
          </div>
          <div class="kpi-value">${dashboard.activeIncidents}</div>
          <div class="kpi-label">Security Incidents</div>
          <div class="kpi-subtitle">${secEvents.length} Anomaly Events Tracked</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--primary-light); color: var(--primary);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <span class="kpi-trend neutral">Append-Only</span>
          </div>
          <div class="kpi-value">${dashboard.totalAuditLogs}</div>
          <div class="kpi-label">Audit Logs Logged</div>
          <div class="kpi-subtitle">${dashboard.adminActions} Administrative Actions</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-box" style="background: var(--info-light); color: var(--info);">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
            <span class="kpi-trend positive">Active</span>
          </div>
          <div class="kpi-value">${dashboard.activeUsersCount}</div>
          <div class="kpi-label">Active User Accounts</div>
          <div class="kpi-subtitle">${dashboard.suspendedUsersCount} Suspended / Isolated</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px; overflow-x: auto; white-space: nowrap;">
        <button class="tab-btn ${this.activeTab === "dashboard" ? "active" : ""}" onclick="SecurityView.switchTab('dashboard')">
          Security Overview
        </button>
        <button class="tab-btn ${this.activeTab === "audit-logs" ? "active" : ""}" onclick="SecurityView.switchTab('audit-logs')">
          Audit Trail (${auditLogs.length})
        </button>
        <button class="tab-btn ${this.activeTab === "security-events" ? "active" : ""}" onclick="SecurityView.switchTab('security-events')">
          Security Events (${secEvents.length})
        </button>
        <button class="tab-btn ${this.activeTab === "incidents" ? "active" : ""}" onclick="SecurityView.switchTab('incidents')">
          Incidents (${incidents.length})
        </button>
        <button class="tab-btn ${this.activeTab === "access-review" ? "active" : ""}" onclick="SecurityView.switchTab('access-review')">
          Access Review (${accessList.length})
        </button>
        <button class="tab-btn ${this.activeTab === "settings" ? "active" : ""}" onclick="SecurityView.switchTab('settings')">
          Security Policies & Settings
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="tab-content">
        ${await this.renderActiveTab(dashboard, auditLogs, secEvents, incidents, accessList, settings, companyId)}
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    Router.mountView("security");
  },

  async renderActiveTab(
    dashboard,
    auditLogs,
    secEvents,
    incidents,
    accessList,
    settings,
    companyId,
  ) {
    switch (this.activeTab) {
      case "audit-logs":
        return this.renderAuditLogsTab(auditLogs);
      case "security-events":
        return this.renderSecurityEventsTab(secEvents);
      case "incidents":
        return this.renderIncidentsTab(incidents);
      case "access-review":
        return this.renderAccessReviewTab(accessList);
      case "settings":
        return this.renderSettingsTab(settings, companyId);
      default:
        return this.renderOverviewTab(dashboard);
    }
  },

  // 1. SECURITY OVERVIEW TAB
  renderOverviewTab(dashboard) {
    return `
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Protection Services Status Matrix -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Production Security Architecture Status</div>
              <div class="card-subtitle">Layered defense verification across Auth, Database, Storage, and App Check</div>
            </div>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3">
              <div class="flex justify-between items-center" style="padding: 10px 12px; background: var(--bg-hover); border-radius: 6px;">
                <span><strong>Firebase Authentication & Sessions</strong></span>
                <span class="badge badge-success">${dashboard.systemStatus.authentication}</span>
              </div>
              <div class="flex justify-between items-center" style="padding: 10px 12px; background: var(--bg-hover); border-radius: 6px;">
                <span><strong>Cloud Firestore Security Rules</strong></span>
                <span class="badge badge-success">${dashboard.systemStatus.firestoreRules}</span>
              </div>
              <div class="flex justify-between items-center" style="padding: 10px 12px; background: var(--bg-hover); border-radius: 6px;">
                <span><strong>Firebase Storage Access Controls</strong></span>
                <span class="badge badge-success">${dashboard.systemStatus.storageRules}</span>
              </div>
              <div class="flex justify-between items-center" style="padding: 10px 12px; background: var(--bg-hover); border-radius: 6px;">
                <span><strong>Firebase App Check (Bot/Attestation)</strong></span>
                <span class="badge badge-info">${dashboard.systemStatus.appCheck}</span>
              </div>
              <div class="flex justify-between items-center" style="padding: 10px 12px; background: var(--bg-hover); border-radius: 6px;">
                <span><strong>Append-Only Audit Logging</strong></span>
                <span class="badge badge-success">${dashboard.systemStatus.auditLogging}</span>
              </div>
              <div class="flex justify-between items-center" style="padding: 10px 12px; background: var(--bg-hover); border-radius: 6px;">
                <span><strong>Real-time Anomaly Monitoring</strong></span>
                <span class="badge badge-success">${dashboard.systemStatus.monitoring}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Security Operations Protocols -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Security Governance & Compliance Baseline</div>
              <div class="card-subtitle">Mandatory operational guidelines enforced across Diallo HRMS</div>
            </div>
          </div>
          <div class="card-body">
            <div class="flex flex-col gap-3" style="font-size: 0.85rem;">
              <div style="padding: 12px; background: var(--bg-hover); border-radius: 6px;">
                <strong>Company Isolation Guarantee:</strong> Multi-tenant Firestore Security Rules guarantee that no cross-company queries can succeed regardless of client requests.
              </div>
              <div style="padding: 12px; background: var(--bg-hover); border-radius: 6px;">
                <strong>Sensitive Compensation Shield:</strong> All salary, banking, and appraisal records require explicit elevated permissions and log immutable access audit events.
              </div>
              <div style="padding: 12px; background: var(--bg-hover); border-radius: 6px;">
                <strong>Admin Privileges & Exit Defense:</strong> Exited or terminated employees are instantly isolated, revoking active session tokens and company access while preserving audit history.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 2. AUDIT TRAIL TAB
  renderAuditLogsTab(auditLogs) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Enterprise Audit Ledger (${auditLogs.length})</div>
            <div class="card-subtitle">Append-only audit trail recording logins, role elevations, sensitive accesses, and administrative changes</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor User</th>
                <th>Action</th>
                <th>Resource Target</th>
                <th>Operation ID</th>
                <th>Severity</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              ${auditLogs
                .map(
                  (log) => `
                <tr>
                  <td style="font-size: 0.8rem;">
                    ${log.timestamp ? new Date(log.timestamp.seconds ? log.timestamp.seconds * 1000 : log.timestamp).toLocaleString() : "Recent"}
                  </td>
                  <td>
                    <div class="font-semibold text-main">${log.actorName}</div>
                    <div class="text-muted" style="font-size: 0.75rem;"><code>${log.actorRole}</code></div>
                  </td>
                  <td><strong>${log.action}</strong></td>
                  <td><code>${log.resourceType}/${log.resourceId}</code></td>
                  <td><code style="font-size: 0.75rem;">${log.operationId || "-"}</code></td>
                  <td>
                    <span class="badge ${log.severity === "CRITICAL" ? "badge-danger" : log.severity === "HIGH" ? "badge-warning" : log.severity === "MEDIUM" ? "badge-primary" : "badge-neutral"}">
                      ${log.severity || "INFO"}
                    </span>
                  </td>
                  <td>
                    <span class="badge ${log.result === "SUCCESS" ? "badge-success" : "badge-danger"}">
                      ${log.result}
                    </span>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 3. SECURITY EVENTS TAB
  renderSecurityEventsTab(secEvents) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Security Events & Anomaly Stream (${secEvents.length})</div>
            <div class="card-subtitle">Authentication events, privilege adjustments, and anomaly alerts</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Title & Type</th>
                <th>User Account</th>
                <th>IP / Origin</th>
                <th>Severity</th>
                <th>Event Details</th>
              </tr>
            </thead>
            <tbody>
              ${secEvents
                .map(
                  (ev) => `
                <tr>
                  <td style="font-size: 0.8rem;">
                    ${ev.timestamp ? new Date(ev.timestamp.seconds ? ev.timestamp.seconds * 1000 : ev.timestamp).toLocaleString() : "Recent"}
                  </td>
                  <td>
                    <strong>${ev.title || ev.eventType}</strong>
                    <div class="text-muted" style="font-size: 0.75rem;"><code>${ev.eventType}</code></div>
                  </td>
                  <td>
                    <div>${ev.userEmail || "System"}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${ev.userRole || "-"}</div>
                  </td>
                  <td><code>${ev.ip || "Local"}</code></td>
                  <td>
                    <span class="badge ${ev.severity === "CRITICAL" ? "badge-danger" : ev.severity === "HIGH" ? "badge-warning" : ev.severity === "MEDIUM" ? "badge-primary" : "badge-neutral"}">
                      ${ev.severity || "INFO"}
                    </span>
                  </td>
                  <td><span class="text-muted" style="font-size: 0.82rem;">${ev.details}</span></td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 4. INCIDENTS TAB
  renderIncidentsTab(incidents) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Security Incident Response Center (${incidents.length})</div>
            <div class="card-subtitle">Active containment, forensic investigation, and formal remediation records</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="SecurityView.openCreateIncidentModal()">+ Log Incident</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Incident Title</th>
                <th>Severity</th>
                <th>Reported By</th>
                <th>Assigned Investigator</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${incidents
                .map(
                  (inc) => `
                <tr>
                  <td>
                    <div class="font-semibold text-main">${inc.title}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${inc.description?.slice(0, 60)}...</div>
                  </td>
                  <td>
                    <span class="badge ${inc.severity === "CRITICAL" ? "badge-danger" : inc.severity === "HIGH" ? "badge-warning" : "badge-primary"}">
                      ${inc.severity}
                    </span>
                  </td>
                  <td>${inc.reportedBy}</td>
                  <td><strong>${inc.assignedTo}</strong></td>
                  <td>
                    <span class="badge ${inc.status === "RESOLVED" || inc.status === "CLOSED" ? "badge-success" : "badge-warning"}">
                      ${inc.status}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-soft btn-sm" onclick="SecurityView.openUpdateIncidentModal('${inc.id}')">
                      Update Incident
                    </button>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 5. ACCESS REVIEW TAB
  renderAccessReviewTab(accessList) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Privileged Account & Access Review Matrix (${accessList.length})</div>
            <div class="card-subtitle">Audit active accounts, role assignments, privileged access, and user isolation controls</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role & Privilege Level</th>
                <th>Department</th>
                <th>Account Status</th>
                <th>Last Login / Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${accessList
                .map(
                  (u) => `
                <tr>
                  <td>
                    <div class="font-semibold text-main">${u.name}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${u.email}</div>
                  </td>
                  <td>
                    <strong>${u.role}</strong>
                    ${u.isPrivileged ? '<span class="badge badge-warning" style="margin-left: 6px;">Privileged</span>' : ""}
                  </td>
                  <td>${u.department}</td>
                  <td>
                    <span class="badge ${u.status === "ACTIVE" || u.status === "CONFIRMED" ? "badge-success" : "badge-danger"}">
                      ${u.status}
                    </span>
                  </td>
                  <td><code>${u.lastLogin}</code></td>
                  <td>
                    ${
                      u.status === "SUSPENDED"
                        ? `
                      <button class="btn btn-soft btn-sm" onclick="SecurityView.restoreUser('${u.id}')">
                        Restore Access
                      </button>
                    `
                        : `
                      <button class="btn btn-soft btn-sm text-danger" onclick="SecurityView.openSuspendModal('${u.id}', '${u.name}')">
                        Suspend Access
                      </button>
                    `
                    }
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 6. SECURITY SETTINGS TAB
  renderSettingsTab(settings, companyId) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Security Governance & Enforcement Policies</div>
            <div class="card-subtitle">Configure organization-wide authentication mandates, timeout thresholds, and data retention</div>
          </div>
        </div>
        <div class="card-body">
          <form id="sec-settings-form" onsubmit="event.preventDefault(); SecurityView.saveSettings('${companyId}');">
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div class="form-group">
                <label class="form-label required">Multi-Factor Authentication (MFA) Policy</label>
                <select id="set-mfa" class="form-control">
                  <option value="OPTIONAL" ${settings.mfaPolicy === "OPTIONAL" ? "selected" : ""}>Optional for All Users</option>
                  <option value="REQUIRED_FOR_ADMINS" ${settings.mfaPolicy === "REQUIRED_FOR_ADMINS" ? "selected" : ""}>Mandatory for Administrators & HR</option>
                  <option value="MANDATORY_ALL" ${settings.mfaPolicy === "MANDATORY_ALL" ? "selected" : ""}>Mandatory for Entire Workforce</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label required">Session Inactivity Timeout (Minutes)</label>
                <input type="number" id="set-timeout" class="form-control" value="${settings.sessionTimeoutMinutes || 60}" min="15" max="480" required />
              </div>

              <div class="form-group">
                <label class="form-label required">Password Rotation Cycle (Days)</label>
                <input type="number" id="set-rotation" class="form-control" value="${settings.passwordRotationDays || 90}" min="30" max="365" required />
              </div>

              <div class="form-group">
                <label class="form-label required">Audit Log Retention Horizon (Days)</label>
                <input type="number" id="set-retention" class="form-control" value="${settings.auditRetentionDays || 365}" min="90" max="1825" required />
              </div>
            </div>

            <div class="flex flex-col gap-3" style="margin-bottom: 24px;">
              <label class="flex items-center gap-2" style="cursor: pointer;">
                <input type="checkbox" id="set-email-verif" ${settings.emailVerificationRequired ? "checked" : ""} />
                <span><strong>Enforce Verified Email Address:</strong> Prevent unverified accounts from logging into company portal.</span>
              </label>

              <label class="flex items-center gap-2" style="cursor: pointer;">
                <input type="checkbox" id="set-app-check" ${settings.appCheckEnabled ? "checked" : ""} />
                <span><strong>Enable Firebase App Check Attestation:</strong> Block automated scripts and unauthorized API traffic.</span>
              </label>

              <label class="flex items-center gap-2" style="cursor: pointer;">
                <input type="checkbox" id="set-data-masking" ${settings.sensitiveDataMasking ? "checked" : ""} />
                <span><strong>Mask Confidential Fields:</strong> Automatically mask bank accounts and tax identifiers in audit exports.</span>
              </label>
            </div>

            <div class="flex justify-end">
              <button type="submit" class="btn btn-primary btn-sm">Save Security Policies</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  // MODALS
  openCreateIncidentModal() {
    ModalManager.openModal({
      id: "create-incident-modal",
      title: "Report Security Incident",
      subtitle:
        "Log a security anomaly or unauthorized access event for investigation",
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Incident Title</label>
          <input type="text" id="inc-title" class="form-control" placeholder="e.g. Unauthorized access attempt to payroll documents" required />
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label class="form-label required">Severity</label>
            <select id="inc-sev" class="form-control">
              <option value="LOW">Low Severity</option>
              <option value="MEDIUM" selected>Medium Severity</option>
              <option value="HIGH">High Severity</option>
              <option value="CRITICAL">Critical Incident</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Assigned Investigator</label>
            <input type="text" id="inc-assignee" class="form-control" value="Security Operations Lead" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Incident Summary & Evidence</label>
          <textarea id="inc-desc" class="form-control" rows="3" placeholder="Chronology, affected resources, and technical observations..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="SecurityView.submitCreateIncident()">Log Incident</button>
      `,
    });
  },

  async submitCreateIncident() {
    const title = document.getElementById("inc-title")?.value;
    const description = document.getElementById("inc-desc")?.value;
    if (!title || !description) {
      Toast.error("Please enter title and summary.");
      return;
    }

    try {
      await securityService.createSecurityIncident({
        title,
        description,
        severity: document.getElementById("inc-sev")?.value || "MEDIUM",
        assignedTo:
          document.getElementById("inc-assignee")?.value || "Security Lead",
      });
      Toast.success("Security incident logged and escalated to investigator.");
      ModalManager.closeModal("create-incident-modal");
      Router.mountView("security");
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openUpdateIncidentModal(incidentId) {
    ModalManager.openModal({
      id: "update-incident-modal",
      title: "Update Incident Remediation",
      subtitle: "Record containment steps and formal resolution",
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Incident Lifecycle Status</label>
          <select id="inc-status" class="form-control">
            <option value="INVESTIGATING">Investigating</option>
            <option value="CONTAINED" selected>Contained (Threat Isolated)</option>
            <option value="RESOLVED">Resolved (Remediation Complete)</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Investigation & Resolution Notes</label>
          <textarea id="inc-notes" class="form-control" rows="3" placeholder="Technical actions taken and conclusion..." required></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="SecurityView.submitUpdateIncident('${incidentId}')">Save Incident Status</button>
      `,
    });
  },

  async submitUpdateIncident(incidentId) {
    const status = document.getElementById("inc-status")?.value || "CONTAINED";
    const notes = document.getElementById("inc-notes")?.value || "";

    try {
      await securityService.updateIncidentStatus(incidentId, status, notes);
      Toast.success("Incident status updated.");
      ModalManager.closeModal("update-incident-modal");
      Router.mountView("security");
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openSuspendModal(userId, userName) {
    ModalManager.openModal({
      id: "suspend-user-modal",
      title: "Suspend User Account Access",
      subtitle: `Revoke company portal and database access for ${userName}`,
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Reason for Account Suspension</label>
          <input type="text" id="susp-reason" class="form-control" placeholder="e.g. Administrative security investigation" required />
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-danger btn-sm" onclick="SecurityView.submitSuspendUser('${userId}')">Confirm Suspension</button>
      `,
    });
  },

  async submitSuspendUser(userId) {
    const reason =
      document.getElementById("susp-reason")?.value ||
      "Administrative Security Review";
    try {
      await securityService.suspendUser(userId, reason);
      Toast.success("User account suspended and access revoked.");
      ModalManager.closeModal("suspend-user-modal");
      Router.mountView("security");
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async restoreUser(userId) {
    try {
      await securityService.restoreUser(userId);
      Toast.success("User account restored to Active status.");
      Router.mountView("security");
    } catch (e) {
      Toast.error(e.message);
    }
  },

  async saveSettings(companyId) {
    const payload = {
      mfaPolicy: document.getElementById("set-mfa")?.value || "OPTIONAL",
      sessionTimeoutMinutes:
        Number(document.getElementById("set-timeout")?.value) || 60,
      passwordRotationDays:
        Number(document.getElementById("set-rotation")?.value) || 90,
      auditRetentionDays:
        Number(document.getElementById("set-retention")?.value) || 365,
      emailVerificationRequired:
        document.getElementById("set-email-verif")?.checked || false,
      appCheckEnabled:
        document.getElementById("set-app-check")?.checked || false,
      sensitiveDataMasking:
        document.getElementById("set-data-masking")?.checked || false,
    };

    try {
      await securityService.updateSecuritySettings(companyId, payload);
      Toast.success("Security governance policies updated successfully.");
      Router.mountView("security");
    } catch (e) {
      Toast.error(e.message);
    }
  },
};

window.SecurityView = SecurityView;
