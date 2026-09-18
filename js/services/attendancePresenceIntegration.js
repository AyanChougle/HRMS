
/**
 * Adds typed breaks without replacing the existing attendanceService.
 */
(() => {
  const BREAKS = [
    ['TEA', 'Tea Break'], ['LUNCH', 'Lunch Break'], ['NAMAZ', 'Namaz'],
    ['BIO', 'Bio Break'], ['PERSONAL', 'Personal'], ['MEETING', 'Meeting'],
    ['OTHER', 'Other']
  ];

  const originalToggleBreak = ESSView.toggleBreak?.bind(ESSView);
  const originalTogglePunch = ESSView.togglePunch?.bind(ESSView);

  ESSView.breakSessions = ESSView.breakSessions || [];

  function chooseBreak() {
    if (!ESSView.isPunchedIn) {
      if (typeof Toast !== 'undefined') Toast.warning('Please punch in first before taking a break.');
      return;
    }
    if (ESSView.isShiftCompletedToday) {
      if (typeof Toast !== 'undefined') Toast.warning('Shift is completed for today.');
      return;
    }

    const html = `
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label required" style="font-weight: 600; margin-bottom: 8px; display: block;">Select Break Type</label>
        <select id="hrms-break-type" class="form-control" style="font-size: 0.95rem; padding: 8px 12px;">
          ${BREAKS.map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
        </select>
        <div class="text-muted" style="font-size: 0.8rem; margin-top: 6px;">
          Work timer will pause while break duration is tracked.
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

      setTimeout(() => {
        const btn = document.getElementById('hrms-start-break-btn');
        if (btn) {
          btn.addEventListener('click', () => {
            const type = document.getElementById('hrms-break-type')?.value || 'OTHER';
            ModalManager.closeModal();
            ESSView.startTypedBreak(type);
          });
        }
      }, 50);
    } else if (window.Modal?.open) {
      Modal.open('Start Break', html, [{
        text: 'Start Break', class: 'btn-primary',
        onclick: () => {
          const type = document.getElementById('hrms-break-type')?.value || 'OTHER';
          Modal.close();
          ESSView.startTypedBreak(type);
        }
      }, { text: 'Cancel', class: 'btn-secondary', onclick: () => Modal.close() }]);
    } else {
      const type = prompt('Break: TEA / LUNCH / NAMAZ / BIO / PERSONAL / MEETING / OTHER') || 'OTHER';
      ESSView.startTypedBreak(type.toUpperCase());
    }
  }

  ESSView.startTypedBreak = async function(type) {
    if (this.isOnBreak) return;
    if (!this.isPunchedIn || this.isShiftCompletedToday) return;

    const found = BREAKS.find(x => x[0] === type) || BREAKS[6];
    const session = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      type: found[0], label: found[1],
      startedAt: new Date().toISOString(), endedAt: null, durationSeconds: 0
    };
    this.breakSessions.push(session);
    this.isOnBreak = true;
    this.breakSeconds = 0;
    this.breakStartTimestamp = Date.now();
    this.currentBreakType = found[0];
    this.currentBreakLabel = found[1];

    this.savePersistedState?.();
    this.startBreakTimer?.();
    this.updateTimecardUI?.();

    if (typeof Toast !== 'undefined') {
      Toast.info(`${found[1]} started — work timer paused.`);
    }

    try {
      await attendanceService.recordPunch?.({
        name: AuthGuard.userProfile?.displayName || 'Employee',
        punchType: 'Break In',
        device: 'ESS Web GPS Terminal',
        status: `On ${found[1]}`,
        breakType: found[0], breakLabel: found[1],
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
