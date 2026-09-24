
/**
 * Adds typed breaks without replacing the existing attendanceService.
 */
(() => {
  const BREAKS = [
    ['LUNCH', 'Lunch Break (1h Quota)'],
    ['TEA', 'Tea / Coffee Break'],
    ['BIO', 'Bio / Restroom Break'],
    ['PERSONAL', 'Personal Work'],
    ['NAMAZ', 'Namaz / Prayer'],
    ['MEETING', 'Meeting / Discussion'],
    ['OTHER', 'Others']
  ];

  const originalToggleBreak = ESSView.toggleBreak?.bind(ESSView);
  const originalTogglePunch = ESSView.togglePunch?.bind(ESSView);

  ESSView.breakSessions = ESSView.breakSessions || [];

  function wireBreakModalEvents() {
    const select = document.getElementById('hrms-break-type');
    const customWrap = document.getElementById('hrms-break-custom-wrap');
    const customInput = document.getElementById('hrms-break-custom-input');
    const btn = document.getElementById('hrms-start-break-btn');

    if (select && customWrap) {
      select.addEventListener('change', () => {
        if (select.value === 'OTHER') {
          customWrap.style.display = 'block';
          if (customInput) customInput.focus();
        } else {
          customWrap.style.display = 'none';
        }
      });
    }

    if (btn) {
      btn.addEventListener('click', () => {
        const type = select?.value || 'OTHER';
        const customReason = customInput?.value?.trim() || '';

        if (type === 'OTHER' && !customReason) {
          if (typeof Toast !== 'undefined') {
            Toast.warning('Please specify your reason for taking a break.');
          }
          if (customInput) {
            customInput.focus();
            customInput.style.borderColor = 'var(--danger)';
          }
          return;
        }

        if (window.ModalManager?.closeModal) {
          ModalManager.closeModal();
        } else if (window.Modal?.close) {
          Modal.close();
        }
        ESSView.startTypedBreak(type, customReason);
      });
    }
  }

  function chooseBreak() {
    if (!ESSView.isPunchedIn) {
      if (typeof Toast !== 'undefined') Toast.warning('Please punch in first before taking a break.');
      return;
    }
    if (ESSView.isShiftCompletedToday) {
      if (typeof Toast !== 'undefined') Toast.warning('Shift is completed for today. Timecard station is locked.');
      return;
    }

    const html = `
      <div style="padding: 4px 0;">
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label required" style="font-weight: 600; margin-bottom: 8px; display: block;">Select Break Type</label>
          <select id="hrms-break-type" class="form-control" style="font-size: 0.95rem; padding: 10px 14px; width: 100%; border-radius: var(--radius-md);">
            ${BREAKS.map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
          </select>
          <div class="text-muted" style="font-size: 0.8rem; margin-top: 6px;">
            Work timer will pause while break duration is tracked (1h daily quota).
          </div>
        </div>

        <div id="hrms-break-custom-wrap" style="display: none; margin-bottom: 16px;">
          <label class="form-label required" style="font-weight: 600; margin-bottom: 8px; display: block;">Specify Break Reason</label>
          <input type="text" id="hrms-break-custom-input" class="form-control" placeholder="Enter reason for break (e.g. Bank visit, Medical, Emergency)..." style="font-size: 0.95rem; padding: 10px 14px; width: 100%; border-radius: var(--radius-md);" />
          <div class="text-muted" style="font-size: 0.8rem; margin-top: 4px;">
            Provide a specific reason for audit and supervisor visibility.
          </div>
        </div>
      </div>
    `;

    if (window.ModalManager?.openModal) {
      ModalManager.openModal({
        id: 'hrms-typed-break-modal',
        title: 'Start Work Break',
        subtitle: 'Select your break reason for accurate timecard audit',
        contentHtml: html,
        footerHtml: `
          <button type="button" class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
          <button type="button" class="btn btn-primary btn-sm" id="hrms-start-break-btn">Confirm Break</button>
        `
      });

      setTimeout(wireBreakModalEvents, 50);
    } else if (window.Modal?.open) {
      Modal.open('Start Break', html, [{
        text: 'Confirm Break', class: 'btn-primary',
        onclick: () => {
          const type = document.getElementById('hrms-break-type')?.value || 'OTHER';
          const customReason = document.getElementById('hrms-break-custom-input')?.value?.trim() || '';
          if (type === 'OTHER' && !customReason) {
            if (typeof Toast !== 'undefined') Toast.warning('Please specify your reason for taking a break.');
            return;
          }
          Modal.close();
          ESSView.startTypedBreak(type, customReason);
        }
      }, { text: 'Cancel', class: 'btn-secondary', onclick: () => Modal.close() }]);
      setTimeout(wireBreakModalEvents, 50);
    } else {
      const type = prompt('Break type (or type reason directly):') || 'Personal';
      ESSView.startTypedBreak('OTHER', type);
    }
  }

  ESSView.startTypedBreak = async function(type, customReason = '') {
    if (this.isOnBreak) return;
    if (!this.isPunchedIn || this.isShiftCompletedToday) return;

    const found = BREAKS.find(x => x[0] === type) || BREAKS[BREAKS.length - 1];
    const finalLabel = (type === 'OTHER' && customReason) ? customReason : found[1];

    const session = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      type: found[0],
      label: finalLabel,
      customReason: customReason || null,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationSeconds: 0
    };
    this.breakSessions.push(session);
    this.isOnBreak = true;
    this.breakSeconds = 0;
    this.breakStartTimestamp = Date.now();
    this.currentBreakType = found[0];
    this.currentBreakLabel = finalLabel;

    this.savePersistedState?.();
    this.startBreakTimer?.();
    this.updateTimecardUI?.();

    if (typeof Toast !== 'undefined') {
      Toast.info(`Break started (${finalLabel}) — work timer paused.`);
    }

    try {
      await attendanceService.recordPunch?.({
        name: AuthGuard.userProfile?.displayName || 'Employee',
        punchType: 'Break In',
        device: 'ESS Web GPS Terminal',
        status: `On Break: ${finalLabel}`,
        breakType: found[0],
        breakLabel: finalLabel,
        customReason: customReason || null,
        breakSessionId: session.id
      });
    } catch(e) { console.warn('Break start sync warning', e); }
  };

  ESSView.endTypedBreak = async function() {
    if (!this.isOnBreak) return;
    const session = [...this.breakSessions].reverse().find(x => !x.endedAt);
    if (!session) { 
      this.isOnBreak = false;
      this.updateTimecardUI?.();
      return; 
    }
    session.endedAt = new Date().toISOString();
    session.durationSeconds = Math.max(0, Math.round(
      (Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 1000
    ));
    this.totalBreakSeconds = (this.totalBreakSeconds || 0) + session.durationSeconds;
    this.breakSeconds = 0;
    this.breakStartTimestamp = null;
    this.isOnBreak = false;
    this.currentBreakType = null;
    this.currentBreakLabel = null;

    this.stopBreakTimer?.();
    this.savePersistedState?.();
    this.updateTimecardUI?.();

    if (typeof Toast !== 'undefined') {
      Toast.success(`Ended ${session.label} — work timer resumed!`);
    }

    try {
      await attendanceService.recordPunch?.({
        name: AuthGuard.userProfile?.displayName || 'Employee',
        punchType: 'Break Out',
        device: 'ESS Web GPS Terminal',
        status: 'Back from Break',
        breakType: session.type, breakLabel: session.label,
        customReason: session.customReason || null,
        breakSessionId: session.id, durationSeconds: session.durationSeconds,
        breakDuration: session.durationSeconds,
        totalBreakSeconds: this.totalBreakSeconds
      });
    } catch(e) { console.warn('Break end sync warning', e); }
  };

  ESSView.toggleBreak = function() {
    if (this.isOnBreak) return this.endTypedBreak();
    chooseBreak();
  };

  if (originalTogglePunch) {
    ESSView.togglePunch = async function(...args) {
      // Never leave a break dangling when the employee checks out.
      if (this.isOnBreak) await this.endTypedBreak();
      return originalTogglePunch(...args);
    };
  }

  window.HRMS_TYPED_BREAKS = BREAKS;
})();
