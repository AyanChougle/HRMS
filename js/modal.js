/**
 * DIALLO HRMS — MODAL & DRAWER CONTROLLER
 * Accessible modal dialogs and slide-over drawers
 */

const ModalManager = {
  activeModal: null,
  activeDrawer: null,

  init() {
    // Listen for Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.activeModal) this.closeModal();
        if (this.activeDrawer) this.closeDrawer();
      }
    });

    // Delegate backdrop clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        this.closeModal();
      }
      if (e.target.classList.contains('drawer-backdrop')) {
        this.closeDrawer();
      }
      if (e.target.closest('.modal-close-btn') || e.target.closest('[data-modal-close]')) {
        this.closeModal();
        this.closeDrawer();
      }
    });
  },

  openModal({ id = 'generic-modal', title, subtitle = '', contentHtml, footerHtml = '', size = 'md' }) {
    this.closeModal();

    let modalBackdrop = document.getElementById(id);
    if (!modalBackdrop) {
      modalBackdrop = document.createElement('div');
      modalBackdrop.id = id;
      modalBackdrop.className = 'modal-backdrop';
      document.body.appendChild(modalBackdrop);
    }

    const sizeClass = size === 'lg' ? 'modal-lg' : (size === 'sm' ? 'modal-sm' : '');

    modalBackdrop.innerHTML = `
      <div class="modal-dialog ${sizeClass}" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">${title}</h3>
            ${subtitle ? `<div class="modal-subtitle">${subtitle}</div>` : ''}
          </div>
          <button class="modal-close-btn" data-modal-close aria-label="Close">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          ${contentHtml}
        </div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;

    setTimeout(() => {
      modalBackdrop.classList.add('active');
    }, 10);

    this.activeModal = modalBackdrop;
    return modalBackdrop;
  },

  closeModal() {
    if (this.activeModal) {
      this.activeModal.classList.remove('active');
      const el = this.activeModal;
      setTimeout(() => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 200);
      this.activeModal = null;
    }
  },

  openDrawer({ id = 'generic-drawer', title, contentHtml, footerHtml = '' }) {
    this.closeDrawer();

    let drawerBackdrop = document.getElementById(id);
    if (!drawerBackdrop) {
      drawerBackdrop = document.createElement('div');
      drawerBackdrop.id = id;
      drawerBackdrop.className = 'drawer-backdrop';
      document.body.appendChild(drawerBackdrop);
    }

    drawerBackdrop.innerHTML = `
      <div class="drawer-panel" role="dialog" aria-modal="true">
        <div class="drawer-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close-btn" data-modal-close aria-label="Close">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="drawer-body">
          ${contentHtml}
        </div>
        ${footerHtml ? `<div class="drawer-footer">${footerHtml}</div>` : ''}
      </div>
    `;

    setTimeout(() => {
      drawerBackdrop.classList.add('active');
    }, 10);

    this.activeDrawer = drawerBackdrop;
    return drawerBackdrop;
  },

  closeDrawer() {
    if (this.activeDrawer) {
      this.activeDrawer.classList.remove('active');
      const el = this.activeDrawer;
      setTimeout(() => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 250);
      this.activeDrawer = null;
    }
  },

  confirm({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', confirmClass = 'btn-danger', onConfirm }) {
    this.openModal({
      id: 'confirm-modal',
      title,
      size: 'sm',
      contentHtml: `<p class="text-secondary">${message}</p>`,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn ${confirmClass} btn-sm" id="confirm-action-btn">${confirmText}</button>
      `
    });

    const confirmBtn = document.getElementById('confirm-action-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (typeof onConfirm === 'function') onConfirm();
        this.closeModal();
      });
    }
  }
};

window.ModalManager = ModalManager;
