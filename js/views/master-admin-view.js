/**
 * DIALLO HRMS — MASTER ADMIN CONSOLE VIEW (PHASE 23)
 * Categorized Master Hub matching /master with live filter pills (All, User Related, Settings, Favourites),
 * quick search, bookmarks, and enterprise system access.
 */

const MasterAdminView = {
  activeFilter: 'ALL', // 'ALL', 'USER', 'SETTINGS', 'FAVOURITES'
  searchQuery: '',

  CARDS: [
    {
      id: 'companies',
      title: 'Companies',
      description: 'View, create and manage all companies in your organization.',
      category: 'USER',
      categoryLabel: 'USER RELATED',
      route: 'admin',
      icon: `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`
    },
    {
      id: 'branches',
      title: 'Branches',
      description: 'View and manage company branches, locations and contact details.',
      category: 'USER',
      categoryLabel: 'USER RELATED',
      route: 'admin',
      icon: `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`
    },
    {
      id: 'users',
      title: 'User List',
      description: 'View, edit and manage all user accounts, roles and branch access.',
      category: 'USER',
      categoryLabel: 'USER RELATED',
      route: 'users',
      icon: `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`
    },
    {
      id: 'user-types',
      title: 'User Types',
      description: 'Define custom roles and assign module + page access per user type.',
      category: 'USER',
      categoryLabel: 'USER RELATED',
      route: 'users',
      icon: `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`
    },
    {
      id: 'user-access',
      title: 'User Access',
      description: 'Override page access for individual users beyond their user type defaults.',
      category: 'USER',
      categoryLabel: 'USER RELATED',
      route: 'security',
      icon: `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`
    },
    {
      id: 'geography',
      title: 'Geography',
      description: 'Manage countries, states, districts, cities and areas for address forms.',
      category: 'SETTINGS',
      categoryLabel: 'SETTINGS',
      route: 'settings',
      icon: `<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    }
  ],

  async render() {
    let list = this.CARDS;
    if (this.activeFilter === 'USER') list = list.filter(c => c.category === 'USER');
    if (this.activeFilter === 'SETTINGS') list = list.filter(c => c.category === 'SETTINGS');
    if (this.activeFilter === 'FAVOURITES') list = list.filter(c => this.isBookmarked(c.id));

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }

    const userCount = this.CARDS.filter(c => c.category === 'USER').length;
    const settingsCount = this.CARDS.filter(c => c.category === 'SETTINGS').length;
    const favCount = this.CARDS.filter(c => this.isBookmarked(c.id)).length;

    return `
      <div class="page-header animate-fade-in" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: #ef4444; color: #fff; display: flex; align-items: center; justify-content: center;">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
            </div>
            <div>
              <h1 class="page-title" style="margin: 0; font-size: 1.5rem; font-weight: 800;">Admin</h1>
              <p class="page-subtitle" style="margin: 2px 0 0 0;">${this.CARDS.length} entries available</p>
            </div>
          </div>

          <div style="position: relative; width: 260px;">
            <input type="text" id="admin-search-input" class="form-control" placeholder="Search entries..." value="${this.searchQuery}" oninput="MasterAdminView.handleSearch(this.value)" style="height: 38px; border-radius: 20px; padding-left: 36px;" />
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="position: absolute; left: 12px; top: 11px; color: var(--text-secondary);">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Filter Pills -->
      <div class="flex items-center gap-2" style="margin-bottom: 24px;">
        <button class="btn ${this.activeFilter === 'ALL' ? 'btn-danger' : 'btn-soft'} btn-sm" onclick="MasterAdminView.filterBy('ALL')" style="${this.activeFilter === 'ALL' ? 'background: #ef4444; border-color: #ef4444; color: #fff;' : ''} border-radius: 20px; padding: 4px 14px;">
          All ${this.CARDS.length}
        </button>
        <button class="btn ${this.activeFilter === 'USER' ? 'btn-danger' : 'btn-soft'} btn-sm" onclick="MasterAdminView.filterBy('USER')" style="${this.activeFilter === 'USER' ? 'background: #ef4444; border-color: #ef4444; color: #fff;' : ''} border-radius: 20px; padding: 4px 14px;">
          User Related ${userCount}
        </button>
        <button class="btn ${this.activeFilter === 'SETTINGS' ? 'btn-danger' : 'btn-soft'} btn-sm" onclick="MasterAdminView.filterBy('SETTINGS')" style="${this.activeFilter === 'SETTINGS' ? 'background: #ef4444; border-color: #ef4444; color: #fff;' : ''} border-radius: 20px; padding: 4px 14px;">
          Settings ${settingsCount}
        </button>
        <button class="btn ${this.activeFilter === 'FAVOURITES' ? 'btn-danger' : 'btn-soft'} btn-sm" onclick="MasterAdminView.filterBy('FAVOURITES')" style="${this.activeFilter === 'FAVOURITES' ? 'background: #ef4444; border-color: #ef4444; color: #fff;' : ''} border-radius: 20px; padding: 4px 14px;">
          Favourites ${favCount}
        </button>
      </div>

      <!-- Cards Grid -->
      <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;">
        ${list.map(c => `
          <div class="card" onclick="Router.navigate('${c.route}')" style="cursor: pointer; position: relative; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s; min-height: 180px;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="color: var(--text-secondary);">
                  ${c.icon}
                </div>
                <button onclick="event.stopPropagation(); MasterAdminView.toggleBookmark('${c.id}')" style="background: none; border: none; cursor: pointer; color: ${this.isBookmarked(c.id) ? '#ef4444' : 'var(--text-muted)'}; padding: 0;">
                  <svg width="18" height="18" fill="${this.isBookmarked(c.id) ? '#ef4444' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                  </svg>
                </button>
              </div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0 0 6px 0;">${c.title}</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; margin: 0;">${c.description}</p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 10px; border-top: 1px solid var(--border-light);">
              <span class="badge badge-neutral" style="font-size: 0.65rem; text-transform: uppercase;">${c.categoryLabel}</span>
              <span style="color: var(--text-muted); font-size: 0.9rem;">→</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  filterBy(f) {
    this.activeFilter = f;
    Router.mountView('admin');
  },

  handleSearch(val) {
    this.searchQuery = val;
    Router.mountView('admin');
  },

  isBookmarked(id) {
    const list = JSON.parse(localStorage.getItem('diallo_admin_bookmarks') || '[]');
    return list.includes(id);
  },

  toggleBookmark(id) {
    let list = JSON.parse(localStorage.getItem('diallo_admin_bookmarks') || '[]');
    if (list.includes(id)) list = list.filter(x => x !== id);
    else list.push(id);
    localStorage.setItem('diallo_admin_bookmarks', JSON.stringify(list));
    Router.mountView('admin');
  }
};

window.MasterAdminView = MasterAdminView;
