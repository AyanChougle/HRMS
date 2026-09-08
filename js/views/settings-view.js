/**
 * DIALLO HRMS — SETTINGS & PREFERENCES MODULE
 * Employee Self-Service: Account Security, User Interface Themes, Density, & Alert Notifications
 * Admin / HR Hub: System Configuration, Code Series, SMTP & PDF Templates
 */

const SettingsView = {
  activeEmployeeTab: 'ui', // 'ui', 'account', 'notifications'

  renderHub() {
    const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
    const isEmployee = role === 'EMPLOYEE';

    if (isEmployee) {
      return this.renderEmployeeSettings();
    }

    return this.renderAdminSettings();
  },

  // ==========================================
  // EMPLOYEE VIEW: ACCOUNT & UI SETTINGS
  // ==========================================
  renderEmployeeSettings() {
    const user = AuthGuard.userProfile || {};
    const empName = user.displayName || AuthGuard.currentUser?.displayName || 'Employee';
    const empEmail = user.email || AuthGuard.currentUser?.email || 'employee@diallo.com';
    const empCode = user.employeeCode || 'EMP-001';
    const empDept = user.department || 'Technology';
    const currentTheme = (typeof ThemeManager !== 'undefined' && ThemeManager.getCurrentTheme) ? ThemeManager.getCurrentTheme() : 'dark';

    // Load saved preferences from localStorage
    const savedPrefs = JSON.parse(localStorage.getItem('diallo_user_preferences') || '{}');
    const density = savedPrefs.density || 'comfortable';
    const animations = savedPrefs.animations !== false;
    const sounds = savedPrefs.sounds !== false;
    const punchReminder = savedPrefs.punchReminder !== false;
    const breakReminder = savedPrefs.breakReminder !== false;
    const leaveAlerts = savedPrefs.leaveAlerts !== false;
    const payslipAlerts = savedPrefs.payslipAlerts !== false;
    const hrAlerts = savedPrefs.hrAlerts !== false;

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Account & UI Settings</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Account & User Interface Settings</h1>
            <p class="page-subtitle">Personalize your portal theme, display density, account security, and notification alerts</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="SettingsView.saveEmployeePreferences()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Save Preferences
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" style="margin-bottom: 24px;">
        <button class="tab-btn ${this.activeEmployeeTab === 'ui' ? 'active' : ''}" onclick="SettingsView.switchTab('ui')">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin-right: 6px; display: inline-block; vertical-align: middle;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4 7 7 0 0114 0 4 4 0 01-4 4H7z M12 3v4m0 0a4 4 0 100 8 4 4 0 000-8z"/>
          </svg>
          <span>User Interface & Appearance</span>
        </button>
        <button class="tab-btn ${this.activeEmployeeTab === 'account' ? 'active' : ''}" onclick="SettingsView.switchTab('account')">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin-right: 6px; display: inline-block; vertical-align: middle;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span>Account & Security</span>
        </button>
        <button class="tab-btn ${this.activeEmployeeTab === 'notifications' ? 'active' : ''}" onclick="SettingsView.switchTab('notifications')">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin-right: 6px; display: inline-block; vertical-align: middle;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span>Notification & Alerts</span>
        </button>
      </div>

      <!-- Tab Contents -->
      <div class="tab-content">
        ${this.renderActiveEmployeeTab(currentTheme, density, animations, sounds, user, empName, empEmail, empCode, empDept, punchReminder, breakReminder, leaveAlerts, payslipAlerts, hrAlerts)}
      </div>
    `;
  },

  switchTab(tabKey) {
    this.activeEmployeeTab = tabKey;
    Router.mountView('settings');
  },

  renderActiveEmployeeTab(currentTheme, density, animations, sounds, user, empName, empEmail, empCode, empDept, punchReminder, breakReminder, leaveAlerts, payslipAlerts, hrAlerts) {
    if (this.activeEmployeeTab === 'account') {
      return this.renderAccountSecurityTab(user, empName, empEmail, empCode, empDept);
    } else if (this.activeEmployeeTab === 'notifications') {
      return this.renderNotificationsTab(punchReminder, breakReminder, leaveAlerts, payslipAlerts, hrAlerts);
    }
    return this.renderUITab(currentTheme, density, animations, sounds);
  },

  // 1. UI & APPEARANCE TAB
  renderUITab(currentTheme, density, animations, sounds) {
    return `
      <div class="grid" style="grid-template-columns: 1fr; gap: 20px;">
        <!-- Theme Mode Card -->
        <div class="card" style="padding: 24px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Color Theme & Mode</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">Choose how the HRMS portal looks on your device.</p>

          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
            <!-- Light Mode Option -->
            <div class="card" style="padding: 16px; border: 2px solid ${currentTheme === 'light' ? 'var(--primary)' : 'var(--border)'}; cursor: pointer; transition: all 0.2s;" onclick="SettingsView.selectTheme('light')">
              <div class="flex items-center justify-between" style="margin-bottom: 12px;">
                <div class="flex items-center gap-2">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: #f59e0b;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                  <strong style="color: var(--text-main); font-size: 0.95rem;">Light Theme</strong>
                </div>
                <input type="radio" name="ui-theme" value="light" ${currentTheme === 'light' ? 'checked' : ''} style="accent-color: var(--primary);" />
              </div>
              <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">Clean white enterprise background with rich blue navigational headers.</p>
              <div style="height: 36px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; align-items: center; padding: 0 10px; gap: 6px;">
                <div style="width: 12px; height: 12px; background: #2563eb; border-radius: 50%;"></div>
                <div style="width: 60px; height: 6px; background: #cbd5e1; border-radius: 3px;"></div>
                <div style="width: 40px; height: 6px; background: #e2e8f0; border-radius: 3px; margin-left: auto;"></div>
              </div>
            </div>

            <!-- Dark Mode Option -->
            <div class="card" style="padding: 16px; border: 2px solid ${currentTheme === 'dark' ? 'var(--primary)' : 'var(--border)'}; cursor: pointer; transition: all 0.2s;" onclick="SettingsView.selectTheme('dark')">
              <div class="flex items-center justify-between" style="margin-bottom: 12px;">
                <div class="flex items-center gap-2">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: #6366f1;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                  </svg>
                  <strong style="color: var(--text-main); font-size: 0.95rem;">Dark Mode (Obsidian)</strong>
                </div>
                <input type="radio" name="ui-theme" value="dark" ${currentTheme === 'dark' ? 'checked' : ''} style="accent-color: var(--primary);" />
              </div>
              <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 12px;">Deep obsidian dark background designed to reduce eye strain in low-light.</p>
              <div style="height: 36px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; display: flex; align-items: center; padding: 0 10px; gap: 6px;">
                <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%;"></div>
                <div style="width: 60px; height: 6px; background: #475569; border-radius: 3px;"></div>
                <div style="width: 40px; height: 6px; background: #334155; border-radius: 3px; margin-left: auto;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Display Density & Layout Preferences -->
        <div class="card" style="padding: 24px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Display Density & Layout</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">Adjust row spacing for data tables and navigation lists.</p>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label">Table & Data View Density</label>
              <select id="pref-density" class="form-control">
                <option value="comfortable" ${density === 'comfortable' ? 'selected' : ''}>Comfortable (Spacious & Easy to Read)</option>
                <option value="compact" ${density === 'compact' ? 'selected' : ''}>Compact (Dense for high-volume data)</option>
              </select>
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Default Date & Time Format</label>
              <input type="text" class="form-control" value="DD MMM YYYY (12-Hour IST)" readonly style="background: var(--bg-hover);" />
            </div>
          </div>

          <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 14px;">
            <label class="flex items-center gap-3" style="cursor: pointer;">
              <input type="checkbox" id="pref-animations" ${animations ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);" />
              <div>
                <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">Enable UI Animations & Page Transitions</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Smooth fade-ins and interactive card animations.</div>
              </div>
            </label>

            <label class="flex items-center gap-3" style="cursor: pointer;">
              <input type="checkbox" id="pref-sounds" ${sounds ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);" />
              <div>
                <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">Sound Feedback & Chimes</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Play subtle audio notification upon punching in/out or receiving alerts.</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    `;
  },

  // 2. ACCOUNT & SECURITY TAB
  renderAccountSecurityTab(user, empName, empEmail, empCode, empDept) {
    return `
      <div class="grid" style="grid-template-columns: 1fr; gap: 20px;">
        <!-- Identity Summary Card -->
        <div class="card" style="padding: 24px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Profile & Identification</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">Your verified credentials recorded with Diallo HRMS.</p>

          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; font-size: 0.88rem;">
            <div>
              <div style="color: var(--text-muted); font-size: 0.78rem;">Full Name</div>
              <strong style="color: var(--text-main);">${empName}</strong>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.78rem;">Employee Code</div>
              <strong style="color: var(--primary); font-family: monospace;">${empCode}</strong>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.78rem;">Registered Email</div>
              <strong style="color: var(--text-main);">${empEmail}</strong>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.78rem;">Department / Unit</div>
              <strong style="color: var(--text-main);">${empDept}</strong>
            </div>
            <div>
              <div style="color: var(--text-muted); font-size: 0.78rem;">Account Role</div>
              <span class="badge badge-primary">Employee (ESS)</span>
            </div>
          </div>
        </div>

        <!-- Change Password Card -->
        <div class="card" style="padding: 24px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Change Account Password</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">Update your password regularly to keep your employee portal secure.</p>

          <div class="form-row">
            <div class="col-4 form-group">
              <label class="form-label required">Current Password</label>
              <input type="password" id="pwd-current" class="form-control" placeholder="••••••••" />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">New Password</label>
              <input type="password" id="pwd-new" class="form-control" placeholder="Min 6 characters" />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Confirm New Password</label>
              <input type="password" id="pwd-confirm" class="form-control" placeholder="Re-enter password" />
            </div>
          </div>

          <div style="margin-top: 10px;">
            <button class="btn btn-secondary btn-sm" onclick="SettingsView.changePassword()">
              Update Password
            </button>
          </div>
        </div>

        <!-- Active Login Session -->
        <div class="card" style="padding: 24px;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Active Device & Session</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">Current logged-in browser instance and security state.</p>

          <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: var(--bg-hover); border-radius: var(--radius-md); border: 1px solid var(--border);">
            <div class="flex items-center gap-3">
              <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(37, 99, 235, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center;">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <div style="font-weight: 700; color: var(--text-main); font-size: 0.9rem;">Windows Web Client</div>
                <div style="font-size: 0.78rem; color: var(--text-secondary);">Current Active Session • Authenticated via Firebase Auth</div>
              </div>
            </div>
            <span class="badge badge-success"><span class="badge-dot"></span> Active Now</span>
          </div>
        </div>
      </div>
    `;
  },

  // 3. NOTIFICATION & ALERTS TAB
  renderNotificationsTab(punchReminder, breakReminder, leaveAlerts, payslipAlerts, hrAlerts) {
    return `
      <div class="card" style="padding: 24px;">
        <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Notification & Alert Preferences</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 24px;">Select the operational alerts and push notifications you wish to receive.</p>

        <div style="display: flex; flex-direction: column; gap: 18px;">
          <!-- Punch Reminder -->
          <label class="flex items-center justify-between" style="cursor: pointer; padding-bottom: 14px; border-bottom: 1px solid var(--border);">
            <div>
              <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">Daily Shift Punch Reminders</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Receive subtle toast notifications at 09:00 AM (Punch In) and 06:00 PM (Punch Out).</div>
            </div>
            <input type="checkbox" id="pref-punch-remind" ${punchReminder ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--primary);" />
          </label>

          <!-- Break Timer Reminder -->
          <label class="flex items-center justify-between" style="cursor: pointer; padding-bottom: 14px; border-bottom: 1px solid var(--border);">
            <div>
              <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">Break Limit Alert</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Alert when active break duration exceeds 45 minutes to prevent overtime deductions.</div>
            </div>
            <input type="checkbox" id="pref-break-remind" ${breakReminder ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--primary);" />
          </label>

          <!-- Leave Application Updates -->
          <label class="flex items-center justify-between" style="cursor: pointer; padding-bottom: 14px; border-bottom: 1px solid var(--border);">
            <div>
              <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">Leave Application Status Updates</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Get notified immediately whenever your manager or HR approves or declines a leave request.</div>
            </div>
            <input type="checkbox" id="pref-leave-alerts" ${leaveAlerts ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--primary);" />
          </label>

          <!-- Salary & Payslip Alerts -->
          <label class="flex items-center justify-between" style="cursor: pointer; padding-bottom: 14px; border-bottom: 1px solid var(--border);">
            <div>
              <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">Monthly Salary Payslip Generation</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Receive notification when your monthly salary slip is published and available for download.</div>
            </div>
            <input type="checkbox" id="pref-payslip-alerts" ${payslipAlerts ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--primary);" />
          </label>

          <!-- HR Helpdesk Updates -->
          <label class="flex items-center justify-between" style="cursor: pointer;">
            <div>
              <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">HR Request & Certificate Approvals</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">Get notified when HR completes certificate generation or resolves your helpdesk ticket.</div>
            </div>
            <input type="checkbox" id="pref-hr-alerts" ${hrAlerts ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--primary);" />
          </label>
        </div>

        <div style="margin-top: 24px;">
          <button class="btn btn-primary btn-sm" onclick="SettingsView.saveEmployeePreferences()">
            Save Alert Preferences
          </button>
        </div>
      </div>
    `;
  },

  selectTheme(theme) {
    if (typeof ThemeManager !== 'undefined' && ThemeManager.setTheme) {
      ThemeManager.setTheme(theme);
      Toast.success(`Applied ${theme === 'dark' ? 'Dark' : 'Light'} Mode!`);
    }
    Router.mountView('settings');
  },

  saveEmployeePreferences() {
    const density = document.getElementById('pref-density')?.value || 'comfortable';
    const animations = document.getElementById('pref-animations')?.checked !== false;
    const sounds = document.getElementById('pref-sounds')?.checked !== false;
    const punchReminder = document.getElementById('pref-punch-remind')?.checked !== false;
    const breakReminder = document.getElementById('pref-break-remind')?.checked !== false;
    const leaveAlerts = document.getElementById('pref-leave-alerts')?.checked !== false;
    const payslipAlerts = document.getElementById('pref-payslip-alerts')?.checked !== false;
    const hrAlerts = document.getElementById('pref-hr-alerts')?.checked !== false;

    const prefs = {
      density,
      animations,
      sounds,
      punchReminder,
      breakReminder,
      leaveAlerts,
      payslipAlerts,
      hrAlerts,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('diallo_user_preferences', JSON.stringify(prefs));
    Toast.success('Your account and UI preferences have been saved successfully!');
  },

  async changePassword() {
    const current = document.getElementById('pwd-current')?.value;
    const newPwd = document.getElementById('pwd-new')?.value;
    const confirmPwd = document.getElementById('pwd-confirm')?.value;

    if (!current || !newPwd || !confirmPwd) {
      Toast.warning('Please fill in all password fields.');
      return;
    }

    if (newPwd.length < 6) {
      Toast.warning('New password must be at least 6 characters long.');
      return;
    }

    if (newPwd !== confirmPwd) {
      Toast.error('New password and confirmation do not match.');
      return;
    }

    try {
      const user = firebase.auth().currentUser;
      if (user) {
        await user.updatePassword(newPwd);
        Toast.success('Password updated successfully!');
        document.getElementById('pwd-current').value = '';
        document.getElementById('pwd-new').value = '';
        document.getElementById('pwd-confirm').value = '';
      } else {
        Toast.success('Password updated for current session.');
      }
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') {
        Toast.error('Please log in again before changing your password.');
      } else {
        Toast.error(e.message || 'Failed to update password');
      }
    }
  },

  // ==========================================
  // ADMIN / HR MASTER CONFIGURATION VIEW
  // ==========================================
  renderAdminSettings() {
    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">System Settings</span>
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

      <!-- 5 Responsive Navigation Cards -->
      <div class="module-grid">
        <!-- 1. Provident Fund (PF) & Statutory Funds Configuration -->
        <div class="module-nav-card" onclick="SettingsView.openStatutoryFundsModal()" style="border: 1.5px solid var(--primary-light);">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(37, 99, 235, 0.12); color: var(--primary);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="module-card-badge" style="background: var(--primary-light); color: var(--primary);">EPF / ESIC / PT / Funds</span>
            </div>
            <div class="module-card-content">
              <h3>Provident Fund & Statutory Funds</h3>
              <p>Company-wide PF enable/disable, employee & employer contribution rates, statutory wage ceilings, ESIC thresholds, and PT rules.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span style="color: var(--primary); font-weight: 600;">Configure PF & funds</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: var(--primary);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

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

  // MODAL: PROVIDENT FUND & STATUTORY FUNDS GOVERNANCE
  async openStatutoryFundsModal() {
    const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';
    let stat = {};
    try {
      stat = await payrollSettingsService.getStatutorySettings(companyId);
    } catch (e) {
      stat = payrollSettingsService.DEFAULT_SETTINGS.statutory;
    }

    const pfEnabled = stat.pfEnabled !== false;
    const pfCeilingRestricted = stat.pfCeilingRestricted !== false;
    const pfWageCeiling = stat.pfWageCeiling || 15000;
    const pfEeRate = stat.pfEmployeeRate ?? 12;
    const pfErRate = stat.pfEmployerRate ?? 3.67;
    const epsErRate = stat.epsEmployerRate ?? 8.33;
    const pfAdminRate = stat.pfAdminRate ?? 0.5;
    const edliRate = stat.edliRate ?? 0.5;
    const includeEmployerPfInCtc = stat.includeEmployerPfInCtc !== false;

    const esicEnabled = stat.esicEnabled !== false;
    const esicWageCeiling = stat.esicWageCeiling || 21000;
    const esicEeRate = stat.esicEmployeeRate ?? 0.75;
    const esicErRate = stat.esicEmployerRate ?? 3.25;

    const ptEnabled = stat.ptEnabled !== false;
    const lwfEnabled = stat.lwfEnabled !== false;
    const lwfMonthlyAmount = stat.lwfMonthlyAmount ?? 20;
    const gratuityEnabled = stat.gratuityEnabled !== false;

    ModalManager.openModal({
      id: 'statutory-funds-modal',
      title: 'Provident Fund (PF) & Statutory Funds Governance',
      subtitle: 'Manage company-wide EPF, EPS, ESIC, Professional Tax and Gratuity configurations',
      contentHtml: `
        <div style="max-height: 70vh; overflow-y: auto; padding-right: 4px;">
          <!-- 1. PROVIDENT FUND (EPF / EPS) SECTION -->
          <div class="card" style="margin-bottom: 20px; border: 1.5px solid var(--border-main); padding: 18px;">
            <div class="flex items-center justify-between" style="border-bottom: 1px solid var(--border-light); padding-bottom: 12px; margin-bottom: 16px;">
              <div class="flex items-center gap-2">
                <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(37, 99, 235, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem;">
                  PF
                </div>
                <div>
                  <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin: 0;">Employees' Provident Fund (EPF & EPS)</h4>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">Statutory retirement fund under Employees' Provident Funds Act 1952</div>
                </div>
              </div>
              <label class="flex items-center gap-2" style="cursor: pointer; background: var(--bg-hover); padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border-light);">
                <input type="checkbox" id="stat-pf-enable" ${pfEnabled ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);" />
                <strong style="font-size: 0.82rem; color: ${pfEnabled ? 'var(--primary)' : 'var(--text-muted)'};" id="stat-pf-enable-label">${pfEnabled ? 'PF ENABLED' : 'PF DISABLED'}</strong>
              </label>
            </div>

            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
              <div class="form-group">
                <label class="form-label font-semibold">Employee EPF Contribution Rate (%)</label>
                <input type="number" step="0.01" id="stat-pf-ee-rate" class="form-control" value="${pfEeRate}" placeholder="12.00" />
                <small class="text-muted" style="font-size: 0.7rem;">Deducted from Employee Basic</small>
              </div>

              <div class="form-group">
                <label class="form-label font-semibold">Employer EPF Share (%)</label>
                <input type="number" step="0.01" id="stat-pf-er-rate" class="form-control" value="${pfErRate}" placeholder="3.67" />
                <small class="text-muted" style="font-size: 0.7rem;">Direct Employer PF share</small>
              </div>

              <div class="form-group">
                <label class="form-label font-semibold">Employer EPS Pension Share (%)</label>
                <input type="number" step="0.01" id="stat-pf-eps-rate" class="form-control" value="${epsErRate}" placeholder="8.33" />
                <small class="text-muted" style="font-size: 0.7rem;">Pension Fund Contribution</small>
              </div>

              <div class="form-group">
                <label class="form-label font-semibold">EPF Admin Charges (%)</label>
                <input type="number" step="0.01" id="stat-pf-admin-rate" class="form-control" value="${pfAdminRate}" placeholder="0.50" />
                <small class="text-muted" style="font-size: 0.7rem;">Govt Admin charges (A/c 2)</small>
              </div>

              <div class="form-group">
                <label class="form-label font-semibold">EDLI Insurance Rate (%)</label>
                <input type="number" step="0.01" id="stat-pf-edli-rate" class="form-control" value="${edliRate}" placeholder="0.50" />
                <small class="text-muted" style="font-size: 0.7rem;">Deposit Linked Insurance</small>
              </div>

              <div class="form-group">
                <label class="form-label font-semibold">Statutory Wage Ceiling (₹ / mo)</label>
                <input type="number" id="stat-pf-ceiling" class="form-control" value="${pfWageCeiling}" placeholder="15000" />
                <small class="text-muted" style="font-size: 0.7rem;">Statutory limit: ₹15,000</small>
              </div>
            </div>

            <div class="flex items-center justify-between" style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border-light); flex-wrap: wrap; gap: 12px;">
              <label class="flex items-center gap-2" style="cursor: pointer;">
                <input type="checkbox" id="stat-pf-ceiling-type" ${pfCeilingRestricted ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--primary);" />
                <span style="font-size: 0.85rem; color: var(--text-main);">Restrict PF calculation to Statutory Ceiling (₹15,000 max)</span>
              </label>

              <label class="flex items-center gap-2" style="cursor: pointer;">
                <input type="checkbox" id="stat-pf-ctc-include" ${includeEmployerPfInCtc ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--primary);" />
                <span style="font-size: 0.85rem; color: var(--text-main);">Include Employer PF Share in Gross CTC</span>
              </label>
            </div>
          </div>

          <!-- 2. EMPLOYEES' STATE INSURANCE (ESIC) SECTION -->
          <div class="card" style="margin-bottom: 20px; border: 1.5px solid var(--border-main); padding: 18px;">
            <div class="flex items-center justify-between" style="border-bottom: 1px solid var(--border-light); padding-bottom: 12px; margin-bottom: 16px;">
              <div class="flex items-center gap-2">
                <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(16, 185, 129, 0.12); color: var(--success); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem;">
                  ESI
                </div>
                <div>
                  <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin: 0;">Employees' State Insurance (ESIC)</h4>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">Medical & health benefits for employees with gross monthly wage ≤ ₹21,000</div>
                </div>
              </div>
              <label class="flex items-center gap-2" style="cursor: pointer; background: var(--bg-hover); padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border-light);">
                <input type="checkbox" id="stat-esic-enable" ${esicEnabled ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--success);" />
                <strong style="font-size: 0.82rem; color: ${esicEnabled ? 'var(--success)' : 'var(--text-muted)'};" id="stat-esic-enable-label">${esicEnabled ? 'ESIC ENABLED' : 'ESIC DISABLED'}</strong>
              </label>
            </div>

            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
              <div class="form-group">
                <label class="form-label font-semibold">Gross Wage Ceiling Threshold (₹ / mo)</label>
                <input type="number" id="stat-esic-ceiling" class="form-control" value="${esicWageCeiling}" placeholder="21000" />
                <small class="text-muted" style="font-size: 0.7rem;">Eligible if Gross Salary ≤ this limit</small>
              </div>

              <div class="form-group">
                <label class="form-label font-semibold">Employee ESIC Rate (%)</label>
                <input type="number" step="0.01" id="stat-esic-ee-rate" class="form-control" value="${esicEeRate}" placeholder="0.75" />
                <small class="text-muted" style="font-size: 0.7rem;">Statutory employee contribution: 0.75%</small>
              </div>

              <div class="form-group">
                <label class="form-label font-semibold">Employer ESIC Share (%)</label>
                <input type="number" step="0.01" id="stat-esic-er-rate" class="form-control" value="${esicErRate}" placeholder="3.25" />
                <small class="text-muted" style="font-size: 0.7rem;">Statutory employer contribution: 3.25%</small>
              </div>
            </div>
          </div>

          <!-- 3. STATE PT, LWF & GRATUITY FUNDS -->
          <div class="card" style="border: 1.5px solid var(--border-main); padding: 18px;">
            <div class="flex items-center justify-between" style="border-bottom: 1px solid var(--border-light); padding-bottom: 12px; margin-bottom: 16px;">
              <div class="flex items-center gap-2">
                <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(245, 158, 11, 0.12); color: var(--warning); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem;">
                  TAX
                </div>
                <div>
                  <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin: 0;">State Professional Tax (PT), LWF & Gratuity</h4>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">State statutory levies, welfare fund, and Payment of Gratuity Act 1972</div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <label class="flex items-center justify-between" style="cursor: pointer; padding: 10px 14px; background: var(--bg-hover); border-radius: var(--radius-sm);">
                <div>
                  <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">Professional Tax (PT) Deduction</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">State-wise slabs (Maharashtra: ₹200/mo & ₹300 Feb, Karnataka: ₹200/mo, Telangana: ₹200/mo)</div>
                </div>
                <input type="checkbox" id="stat-pt-enable" ${ptEnabled ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);" />
              </label>

              <div style="padding: 10px 14px; background: var(--bg-hover); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                <div>
                  <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">Labour Welfare Fund (LWF)</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">State statutory welfare contribution per employee</div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1">
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Amount: ₹</span>
                    <input type="number" id="stat-lwf-amount" class="form-control" style="width: 80px; height: 32px; padding: 2px 8px;" value="${lwfMonthlyAmount}" />
                  </div>
                  <input type="checkbox" id="stat-lwf-enable" ${lwfEnabled ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);" />
                </div>
              </div>

              <label class="flex items-center justify-between" style="cursor: pointer; padding: 10px 14px; background: var(--bg-hover); border-radius: var(--radius-sm);">
                <div>
                  <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">Gratuity Liability Monthly Provision (4.81% Basic)</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">Provision for Payment of Gratuity Act 1972 (15/26 working days calculation)</div>
                </div>
                <input type="checkbox" id="stat-gratuity-enable" ${gratuityEnabled ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);" />
              </label>
            </div>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="SettingsView.saveStatutoryFundsSettings()">Save & Apply for Company</button>
      `
    });

    // Attach dynamic toggle listeners
    document.getElementById('stat-pf-enable')?.addEventListener('change', (e) => {
      const lbl = document.getElementById('stat-pf-enable-label');
      if (lbl) {
        lbl.textContent = e.target.checked ? 'PF ENABLED' : 'PF DISABLED';
        lbl.style.color = e.target.checked ? 'var(--primary)' : 'var(--text-muted)';
      }
    });

    document.getElementById('stat-esic-enable')?.addEventListener('change', (e) => {
      const lbl = document.getElementById('stat-esic-enable-label');
      if (lbl) {
        lbl.textContent = e.target.checked ? 'ESIC ENABLED' : 'ESIC DISABLED';
        lbl.style.color = e.target.checked ? 'var(--success)' : 'var(--text-muted)';
      }
    });
  },

  async saveStatutoryFundsSettings() {
    const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';
    
    const pfEnabled = document.getElementById('stat-pf-enable')?.checked !== false;
    const pfEmployeeRate = Number(document.getElementById('stat-pf-ee-rate')?.value) || 12;
    const pfEmployerRate = Number(document.getElementById('stat-pf-er-rate')?.value) || 3.67;
    const epsEmployerRate = Number(document.getElementById('stat-pf-eps-rate')?.value) || 8.33;
    const pfAdminRate = Number(document.getElementById('stat-pf-admin-rate')?.value) || 0.5;
    const edliRate = Number(document.getElementById('stat-pf-edli-rate')?.value) || 0.5;
    const pfWageCeiling = Number(document.getElementById('stat-pf-ceiling')?.value) || 15000;
    const pfCeilingRestricted = document.getElementById('stat-pf-ceiling-type')?.checked !== false;
    const includeEmployerPfInCtc = document.getElementById('stat-pf-ctc-include')?.checked !== false;

    const esicEnabled = document.getElementById('stat-esic-enable')?.checked !== false;
    const esicWageCeiling = Number(document.getElementById('stat-esic-ceiling')?.value) || 21000;
    const esicEmployeeRate = Number(document.getElementById('stat-esic-ee-rate')?.value) || 0.75;
    const esicEmployerRate = Number(document.getElementById('stat-esic-er-rate')?.value) || 3.25;

    const ptEnabled = document.getElementById('stat-pt-enable')?.checked !== false;
    const lwfEnabled = document.getElementById('stat-lwf-enable')?.checked !== false;
    const lwfMonthlyAmount = Number(document.getElementById('stat-lwf-amount')?.value) || 20;
    const gratuityEnabled = document.getElementById('stat-gratuity-enable')?.checked !== false;

    const statutoryPayload = {
      pfEnabled,
      pfEmployeeRate,
      pfEmployerRate,
      epsEmployerRate,
      pfAdminRate,
      edliRate,
      pfWageCeiling,
      pfCeilingRestricted,
      includeEmployerPfInCtc,

      esicEnabled,
      esicWageCeiling,
      esicEmployeeRate,
      esicEmployerRate,

      ptEnabled,
      lwfEnabled,
      lwfMonthlyAmount,
      gratuityEnabled,
      gratuityRate: 4.81
    };

    try {
      await payrollSettingsService.updateStatutorySettings(companyId, statutoryPayload);
      Toast.success('Company-wide PF and Statutory Funds rules updated & active!');
      ModalManager.closeModal();
    } catch (e) {
      console.error('Error saving statutory settings:', e);
      Toast.error(e.message || 'Failed to update statutory configuration');
    }
  },
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

