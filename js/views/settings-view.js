/**
 * DIALLO HRMS — SYSTEM SETTINGS MODULE
 * Hub Landing Page (4 cards) + Code Series, SMTP & Templates
 */

const SettingsView = {
  renderHub() {
    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Settings</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Settings & Configuration</h1>
            <p class="page-subtitle">Auto-numbering code series, SMTP gateways, notification channels and payslip design layouts</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="Toast.success('All system settings are up to date.')">Save Global Config</button>
          </div>
        </div>
      </div>

      <!-- 4 Responsive Navigation Cards -->
      <div class="module-grid">
        <div class="module-nav-card" onclick="SettingsView.openCodeSeriesModal()">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(79, 70, 229, 0.1); color: var(--accent-settings);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                </svg>
              </div>
              <span class="module-card-badge">Auto-Numbering</span>
            </div>
            <div class="module-card-content">
              <h3>Code Series</h3>
              <p>Configure prefixes and numbering patterns for Employee IDs (EMP-), Invoices (INV-) and Leaves.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>Configure prefixes</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="SettingsView.openEmailModal()">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(37, 99, 235, 0.1); color: var(--primary);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <span class="module-card-badge">SMTP / API</span>
            </div>
            <div class="module-card-content">
              <h3>Email Configuration</h3>
              <p>SMTP server host, TLS/SSL encryption ports, custom sender domains and email delivery logs.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>Server setup</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="SettingsView.showSub('Notification Channels')">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
              </div>
              <span class="module-card-badge">Push / SMS</span>
            </div>
            <div class="module-card-content">
              <h3>Notification Settings</h3>
              <p>Event triggers for leave approvals, payroll release alerts, SMS gateways and Slack integrations.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>Alert channels</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="SettingsView.showSub('Payslip Templates')">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(22, 163, 74, 0.1); color: var(--accent-leave);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <span class="module-card-badge">PDF Layouts</span>
            </div>
            <div class="module-card-content">
              <h3>Payslip Templates</h3>
              <p>Custom company header logo, color theme accents, signature seals and bilingual labels.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>Template builder</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    `;
  },

  openCodeSeriesModal() {
    ModalManager.openModal({
      id: 'code-series-modal',
      title: 'Code Series Auto-Numbering',
      subtitle: 'Set prefix, start digits and format patterns',
      contentHtml: `
        <form>
          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label">Employee ID Prefix</label>
              <input type="text" class="form-control" value="EMP-" />
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Starting Digits Length</label>
              <input type="number" class="form-control" value="3" />
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Leave Application Prefix</label>
              <input type="text" class="form-control" value="LV-" />
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Invoice Prefix</label>
              <input type="text" class="form-control" value="INV-" />
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="Toast.success('Code series format updated'); ModalManager.closeModal();">Save Series</button>
      `
    });
  },

  openEmailModal() {
    ModalManager.openModal({
      id: 'email-modal',
      title: 'SMTP Server Configuration',
      subtitle: 'Outbound email delivery settings for Diallo HRMS',
      contentHtml: `
        <form>
          <div class="form-row">
            <div class="col-8 form-group">
              <label class="form-label">SMTP Host</label>
              <input type="text" class="form-control" value="smtp.diallo-hrms.com" />
            </div>
            <div class="col-4 form-group">
              <label class="form-label">Port</label>
              <input type="text" class="form-control" value="587 (TLS)" />
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Sender Email</label>
              <input type="email" class="form-control" value="notifications@diallo-hrms.com" />
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Sender Display Name</label>
              <input type="text" class="form-control" value="Diallo HRMS System" />
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="Toast.success('SMTP connection verified and saved'); ModalManager.closeModal();">Save & Test Connection</button>
      `
    });
  },

  showSub(title) {
    ModalManager.openModal({
      id: 'settings-sub-modal',
      title,
      subtitle: `System settings for ${title}`,
      contentHtml: `
        <div class="empty-state" style="padding: 24px;">
          <div class="empty-state-icon" style="background: rgba(79, 70, 229, 0.1); color: var(--accent-settings);">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            </svg>
          </div>
          <div class="empty-state-title">${title} Configured</div>
          <div class="empty-state-desc">Template styles and distribution rules for <strong>${title}</strong> are active.</div>
        </div>
      `,
      footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close</button>`
    });
  }
};

window.SettingsView = SettingsView;
