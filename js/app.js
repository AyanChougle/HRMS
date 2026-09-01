/**
 * DIALLO HRMS — MAIN APPLICATION ENTRYPOINT & COORDINATOR (FIREBASE BACKED)
 * Initializes Router, UI Theme, Toast, Modals, AuthGuard and Real-time Header Switchers
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  async init() {
    // 1. Initialize Theme & Toast UI Immediately
    try {
      ThemeManager.init();
      Toast.init();
      ModalManager.init();
    } catch (e) {
      console.warn('UI components init warning:', e);
    }

    // 2. Bind UI Shell Controls
    this.bindSidebarToggle();
    this.bindDropdowns();
    this.bindGlobalSearch();

    // 3. Initialize Auth Guard FIRST to ensure permissions and active profile are established
    try {
      const user = await AuthGuard.init({ isPublicPage: false });
      if (!user) return; // User was redirected to login.html
    } catch (e) {
      console.warn('Auth guard warning:', e);
    }

    // 4. Initialize Router with Authenticated Role Context
    try {
      Router.init();
    } catch (e) {
      console.error('Router init error:', e);
    }

    // 5. Load Real Companies, Branches & Notifications from Firestore safely
    this.bindCompanySwitcher().catch(() => {});
    this.bindBranchSwitcher().catch(() => {});
    this.bindNotifications().catch(() => {});

    // 6. Safe Background Seeding
    if (typeof seedService !== 'undefined' && seedService.bootstrapIfEmpty) {
      seedService.bootstrapIfEmpty().catch(err => console.warn('Seed warning:', err));
    }

    console.log('✓ Diallo HRMS Enterprise Application Initialized.');
  },

  // Sidebar Collapse and Mobile Drawer
  bindSidebarToggle() {
    const appContainer = document.querySelector('.app-container');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (window.innerWidth < 768) {
          appContainer.classList.toggle('mobile-sidebar-open');
        } else {
          appContainer.classList.toggle('sidebar-collapsed');
        }
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        appContainer.classList.remove('mobile-sidebar-open');
      });
    }
  },

  // Dropdowns (Company, Branch, Notifications, Profile)
  bindDropdowns() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-dropdown-trigger]');
      
      if (trigger) {
        e.stopPropagation();
        const targetId = trigger.getAttribute('data-dropdown-trigger');
        const popover = document.getElementById(targetId);
        
        document.querySelectorAll('.dropdown-popover').forEach(p => {
          if (p !== popover) p.classList.remove('active');
        });

        if (popover) {
          popover.classList.toggle('active');
        }
        return;
      }

      if (!e.target.closest('.dropdown-popover')) {
        document.querySelectorAll('.dropdown-popover').forEach(p => {
          p.classList.remove('active');
        });
      }
    });
  },

  // Global Search Modal (Ctrl+K / /)
  bindGlobalSearch() {
    const trigger = document.getElementById('global-search-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => this.openSearchModal());
    }

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openSearchModal();
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        this.openSearchModal();
      }
    });
  },

  openSearchModal() {
    ModalManager.openModal({
      id: 'global-search-modal',
      title: 'Global Search',
      subtitle: 'Find employees, pages, actions, and settings across Diallo HRMS',
      size: 'md',
      contentHtml: `
        <div class="table-search-box" style="width: 100%; max-width: 100%; margin-bottom: 16px;">
          <svg class="table-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" id="quick-search-input" placeholder="Type a command, employee name, or module..." style="width: 100%; padding: 10px 14px 10px 38px; font-size: 0.95rem;" autofocus />
        </div>

        <div id="quick-search-results" class="flex flex-col gap-1">
          <div class="dropdown-header">Quick Navigation</div>
          <button class="dropdown-item" onclick="ModalManager.closeModal(); Router.navigate('employees');">
            <span>👥 Employee Directory</span>
          </button>
          <button class="dropdown-item" onclick="ModalManager.closeModal(); Router.navigate('attendance');">
            <span>⏱️ Attendance & Live Punch Logs</span>
          </button>
          <button class="dropdown-item" onclick="ModalManager.closeModal(); Router.navigate('leave');">
            <span>🏖️ Leave Quota & Applications</span>
          </button>
          <button class="dropdown-item" onclick="ModalManager.closeModal(); Router.navigate('payroll');">
            <span>💳 Payroll Processing & Salaries</span>
          </button>
          <button class="dropdown-item" onclick="ModalManager.closeModal(); Router.navigate('ess');">
            <span>📱 ESS & Kiosk Terminal</span>
          </button>
          <button class="dropdown-item" onclick="ModalManager.closeModal(); Router.navigate('communication');">
            <span>📢 Communication & Company Wall</span>
          </button>
          <button class="dropdown-item" onclick="ModalManager.closeModal(); Router.navigate('reports');">
            <span>📊 Reports & Statutory Filings</span>
          </button>
          <button class="dropdown-item" onclick="ModalManager.closeModal(); Router.navigate('admin');">
            <span>🏢 Legal Entities & Governance</span>
          </button>
          <button class="dropdown-item" onclick="ModalManager.closeModal(); Router.navigate('settings');">
            <span>⚙️ System Settings</span>
          </button>
        </div>
      `,
      footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close</button>`
    });

    setTimeout(() => {
      document.getElementById('quick-search-input')?.focus();
    }, 100);
  },

  // Company Switcher (Firestore Backed)
  async bindCompanySwitcher() {
    const popover = document.getElementById('company-popover');
    if (!popover) return;

    let companies = [];
    try {
      companies = await companyService.getCompanies();
    } catch (e) {
      console.warn('Could not load companies for switcher:', e);
    }

    if (companies.length === 0) {
      companies = [{ id: 'comp_diallo_india', name: 'Diallo India Private Limited', country: 'India' }];
    }

    const currentComp = AuthGuard.userProfile?.companyName || companies[0].name;
    const labelEl = document.getElementById('current-company-label');
    if (labelEl) {
      labelEl.textContent = currentComp.length > 22 ? currentComp.substring(0, 20) + '...' : currentComp;
    }

    popover.innerHTML = `
      <div class="dropdown-header">Select Legal Entity</div>
      ${companies.map(c => `
        <button class="dropdown-item ${c.name === currentComp ? 'active' : ''}" onclick="App.selectCompany('${c.id}', '${c.name}')">
          <div class="flex-1">
            <div class="font-semibold">${c.name}</div>
            <div class="text-muted" style="font-size: 0.72rem;">${c.country || 'India'} • ${c.cin || 'Active Entity'}</div>
          </div>
          ${c.name === currentComp ? '✓' : ''}
        </button>
      `).join('')}
    `;
  },

  async selectCompany(id, name) {
    if (AuthGuard.userProfile) {
      AuthGuard.userProfile.companyId = id;
      AuthGuard.userProfile.companyName = name;
    }
    const labelEl = document.getElementById('current-company-label');
    if (labelEl) {
      labelEl.textContent = name.length > 22 ? name.substring(0, 20) + '...' : name;
    }
    document.getElementById('company-popover')?.classList.remove('active');
    await this.bindCompanySwitcher();
    Toast.info(`Active entity: ${name}`);
    if (window.Router) Router.navigate(Router.currentRoute);
  },

  // Branch Switcher (Firestore Backed)
  async bindBranchSwitcher() {
    const popover = document.getElementById('branch-popover');
    if (!popover) return;

    let branches = [];
    try {
      branches = await companyService.getBranches();
    } catch (e) {
      console.warn('Could not load branches:', e);
    }

    if (branches.length === 0) {
      branches = [
        { id: 'b1', name: 'HQ - Mumbai', city: 'Mumbai (BKC)', timezone: 'IST (UTC+5:30)' },
        { id: 'b2', name: 'Bengaluru Tech Hub', city: 'Bengaluru', timezone: 'IST (UTC+5:30)' }
      ];
    }

    const currentBranch = AuthGuard.userProfile?.branchName || branches[0].name;
    const labelEl = document.getElementById('current-branch-label');
    if (labelEl) {
      labelEl.textContent = currentBranch;
    }

    popover.innerHTML = `
      <div class="dropdown-header">Select Location</div>
      ${branches.map(b => `
        <button class="dropdown-item ${b.name === currentBranch ? 'active' : ''}" onclick="App.selectBranch('${b.id}', '${b.name}')">
          <div class="flex-1">
            <div class="font-semibold">${b.name}</div>
            <div class="text-muted" style="font-size: 0.72rem;">${b.city || ''} • ${b.timezone || 'IST'}</div>
          </div>
          ${b.name === currentBranch ? '✓' : ''}
        </button>
      `).join('')}
    `;
  },

  async selectBranch(id, name) {
    if (AuthGuard.userProfile) {
      AuthGuard.userProfile.branchId = id;
      AuthGuard.userProfile.branchName = name;
    }
    const labelEl = document.getElementById('current-branch-label');
    if (labelEl) {
      labelEl.textContent = name;
    }
    document.getElementById('branch-popover')?.classList.remove('active');
    await this.bindBranchSwitcher();
    Toast.info(`Active branch: ${name}`);
    if (window.Router) Router.navigate(Router.currentRoute);
  },

  // Notifications
  async bindNotifications() {
    const container = document.getElementById('notifications-list-container');
    if (!container || !AuthGuard.currentUser) return;

    try {
      const notifs = await notificationService.getNotifications(AuthGuard.currentUser.uid);
      if (notifs.length === 0) {
        container.innerHTML = `<div style="padding: 24px 16px; text-align: center; color: var(--text-muted); font-size: 0.825rem;">No unread notifications</div>`;
      } else {
        container.innerHTML = `
          <div class="flex flex-col gap-1">
            ${notifs.map(n => `
              <div class="dropdown-item" style="flex-direction: column; align-items: flex-start; gap: 2px;">
                <div class="font-semibold text-main" style="font-size: 0.85rem;">${n.title}</div>
                <div class="text-muted" style="font-size: 0.75rem;">${n.message}</div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } catch (e) {
      console.warn('Could not load notifications:', e);
    }
  }
};

window.App = App;
