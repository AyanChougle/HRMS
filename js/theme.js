/**
 * DIALLO HRMS — THEME MANAGER
 * Controls Light / Dark Mode toggling with localStorage persistence
 */

const ThemeManager = {
  STORAGE_KEY: 'diallo_theme_preference',

  init() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Default to Light Mode as per Phase 1 specification
      this.setTheme('light');
    }
    this.bindEvents();
  },

  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  },

  setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(this.STORAGE_KEY, 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(this.STORAGE_KEY, 'light');
    }
    this.updateToggleButtons(theme);
  },

  toggle() {
    const current = this.getCurrentTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    if (window.Toast) {
      Toast.info(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode`);
    }
  },

  updateToggleButtons(theme) {
    const buttons = document.querySelectorAll('.theme-toggle-btn');
    buttons.forEach(btn => {
      const isDark = theme === 'dark';
      btn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      
      const iconSpan = btn.querySelector('.theme-icon-container');
      if (iconSpan) {
        iconSpan.innerHTML = isDark ? `
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ` : `
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        `;
      }
    });
  },

  bindEvents() {
    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.theme-toggle-btn');
      if (toggleBtn) {
        e.preventDefault();
        this.toggle();
      }
    });
  }
};

window.ThemeManager = ThemeManager;
