const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let c = fs.readFileSync(path, 'utf8');

// ─── 1. Add Attendance tab button in trainer tab nav ───────────────────────
const OLD_TAB_NAV = `          <button class="tab-btn \${this.activeTab === 'programs' ? 'active' : ''}" onclick="TrainingView.switchTab('programs')">
            Curriculum Programs (\${totalPrograms})
          </button>
        \` : '')}`;

const NEW_TAB_NAV = `          <button class="tab-btn \${this.activeTab === 'attendance' ? 'active' : ''}" onclick="TrainingView.switchTab('attendance')">
            Attendance &amp; Marks
          </button>
          <button class="tab-btn \${this.activeTab === 'programs' ? 'active' : ''}" onclick="TrainingView.switchTab('programs')">
            Curriculum Programs (\${totalPrograms})
          </button>
        \` : '')}`;

if (!c.includes(OLD_TAB_NAV)) { console.error('TAB NAV target not found'); process.exit(1); }
c = c.replace(OLD_TAB_NAV, NEW_TAB_NAV);

// ─── 2. Add attendance case to renderActiveTab switch ─────────────────────
const OLD_SWITCH = `      case 'my_learning':
        return this.renderMyLearningTab(trainees, trainers, programs);
      case 'trainees':
      default:
        return this.renderTraineesTab(trainees, trainers);
    }
  },`;

const NEW_SWITCH = `      case 'my_learning':
        return this.renderMyLearningTab(trainees, trainers, programs);
      case 'attendance':
        return this.renderAttendanceTab(trainees);
      case 'trainees':
      default:
        return this.renderTraineesTab(trainees, trainers);
    }
  },`;

if (!c.includes(OLD_SWITCH)) { console.error('SWITCH target not found'); process.exit(1); }
c = c.replace(OLD_SWITCH, NEW_SWITCH);

// ─── 3. Add renderAttendanceTab method + mark attendance methods just before exportTraineesCSV ─
const EXPORT_MARKER = `  async exportTraineesCSV() {`;
const ATTENDANCE_METHODS = `
  // ═══════════════════════════════════════════════════════════════
  // TRAINER: ATTENDANCE & MARKS TAB
  // ═══════════════════════════════════════════════════════════════
  renderAttendanceTab(trainees) {
    const today = new Date().toISOString().slice(0, 10);
    return \`
      <!-- Date Selector Bar -->
      <div class="card" style="margin-bottom: 20px; padding: 16px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-size: 1rem; font-weight: 700; color: var(--text-main);">Mark Trainee Attendance</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Select date and mark each trainee present, absent, or half day</div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <input type="date" id="att-date-picker" class="form-control" style="width: 170px;" value="\${today}"
              onchange="TrainingView.refreshAttendanceDate(this.value)" />
            <button class="btn btn-secondary btn-sm" onclick="TrainingView.refreshAttendanceDate(document.getElementById('att-date-picker').value)">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Trainee Attendance Table -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Trainee Roster — Attendance Sheet</div>
            <div class="card-subtitle">Mark each trainee for the selected date. Changes save immediately.</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          \${trainees.length === 0 ? \`
            <div class="empty-state">
              <div class="empty-state-icon"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
              <div class="empty-state-title">No Trainees Enrolled</div>
              <div class="empty-state-desc">Add trainees first to mark their attendance.</div>
            </div>
          \` : \`
            <table class="data-table">
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Department</th>
                  <th>Batch</th>
                  <th>Day Progress</th>
                  <th style="text-align: center;">Mark Attendance</th>
                  <th style="text-align: center;">View Sheet</th>
                </tr>
              </thead>
              <tbody>
                \${trainees.map(t => {
                  const curDay = Number(t.currentDay) || 1;
                  return \`
                    <tr id="att-row-\${t.id}">
                      <td>
                        <div class="user-cell">
                          <div class="user-cell-avatar" style="background: var(--primary-light); color: var(--primary); font-weight: 700;">
                            \${(t.fullName || 'T').substring(0, 2).toUpperCase()}
                          </div>
                          <div class="user-cell-info">
                            <span class="user-cell-name font-semibold">\${t.fullName}</span>
                            <span class="user-cell-email text-muted" style="font-size: 0.75rem;">\${t.traineeCode || 'TRN'} • \${t.email || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge badge-primary">\${t.department || 'Operations'}</span></td>
                      <td><span style="font-size: 0.82rem;">\${t.batchName || 'Cohort 2026'}</span></td>
                      <td>
                        <div style="font-size: 0.8rem; font-weight: 600;">Day \${curDay} / 7</div>
                        <div style="width: 80px; height: 5px; background: var(--border-main); border-radius: 3px; overflow: hidden; margin-top: 4px;">
                          <div style="width: \${t.progress || Math.round((curDay/7)*100)}%; height: 100%; background: var(--primary); border-radius: 3px;"></div>
                        </div>
                      </td>
                      <td style="text-align: center;">
                        <div style="display: inline-flex; gap: 6px;">
                          <button class="btn btn-sm" id="att-present-\${t.id}"
                            style="background: var(--success-light); color: var(--success); border: 1px solid var(--success);"
                            onclick="TrainingView.markAttendance('\${t.id}', '\${(t.fullName||'').replace(/'/g,&quot;\\\\'&quot;)}', 'PRESENT', document.getElementById('att-date-picker').value, '\${t.traineeCode||'TRN'}')">
                            Present
                          </button>
                          <button class="btn btn-sm" id="att-halfday-\${t.id}"
                            style="background: var(--warning-light); color: var(--warning); border: 1px solid var(--warning);"
                            onclick="TrainingView.markAttendance('\${t.id}', '\${(t.fullName||'').replace(/'/g,&quot;\\\\'&quot;)}', 'HALF_DAY', document.getElementById('att-date-picker').value, '\${t.traineeCode||'TRN'}')">
                            Half Day
                          </button>
                          <button class="btn btn-sm" id="att-absent-\${t.id}"
                            style="background: var(--danger-light); color: var(--danger); border: 1px solid var(--danger);"
                            onclick="TrainingView.markAttendance('\${t.id}', '\${(t.fullName||'').replace(/'/g,&quot;\\\\'&quot;)}', 'ABSENT', document.getElementById('att-date-picker').value, '\${t.traineeCode||'TRN'}')">
                            Absent
                          </button>
                        </div>
                      </td>
                      <td style="text-align: center;">
                        <button class="btn btn-secondary btn-sm"
                          onclick="TrainingView.openAttendanceSheetModal('\${t.id}', '\${(t.fullName||'').replace(/'/g,&quot;\\\\'&quot;)}', '\${t.traineeCode||'TRN'}')">
                          View Sheet
                        </button>
                      </td>
                    </tr>
                  \`;
                }).join('')}
              </tbody>
            </table>

            <!-- Pending Regularization Requests Section -->
            <div style="padding: 20px; border-top: 1px solid var(--border-main);">
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Pending Regularization Requests
              </div>
              <div id="trainer-reg-requests-list">
                <div style="font-size: 0.85rem; color: var(--text-muted); padding: 12px 0;">Loading pending requests...</div>
              </div>
            </div>
          \`}
        </div>
      </div>
    \`;
  },

  refreshAttendanceDate(dateVal) {
    if (!dateVal) return;
    Router.navigate('training');
  },

  async markAttendance(traineeId, traineeName, status, dateStr, traineeCode) {
    if (!dateStr) dateStr = new Date().toISOString().slice(0, 10);
    try {
      const trainerName = AuthGuard.userProfile?.displayName || 'Trainer';
      const record = {
        employeeId: traineeId,
        employeeName: traineeName,
        employeeCode: traineeCode,
        date: dateStr,
        status: status === 'PRESENT' ? 'PRESENT' : (status === 'HALF_DAY' ? 'HALF_DAY' : 'ABSENT'),
        punchIn: status === 'PRESENT' ? '10:00' : (status === 'HALF_DAY' ? '10:00' : null),
        punchOut: status === 'PRESENT' ? '19:00' : (status === 'HALF_DAY' ? '16:00' : null),
        workedHours: status === 'PRESENT' ? 8 : (status === 'HALF_DAY' ? 6 : 0),
        markedBy: trainerName,
        markedAt: new Date().toISOString(),
        source: 'TRAINER_MARK',
        isTrainee: true
      };
      // Save to Firestore attendance collection
      const db = firebase.firestore();
      const docId = traineeId + '_' + dateStr;
      await db.collection('attendance').doc(docId).set(record, { merge: true });

      // Visual feedback — highlight the active button
      const btnMap = { PRESENT: 'att-present-', HALF_DAY: 'att-halfday-', ABSENT: 'att-absent-' };
      ['att-present-', 'att-halfday-', 'att-absent-'].forEach(pfx => {
        const el = document.getElementById(pfx + traineeId);
        if (el) el.style.opacity = '0.5';
      });
      const activeBtn = document.getElementById(btnMap[status] + traineeId);
      if (activeBtn) {
        activeBtn.style.opacity = '1';
        activeBtn.style.boxShadow = '0 0 0 2px currentColor';
      }

      Toast.success(traineeName + ' marked ' + status.replace('_', ' ') + ' for ' + dateStr);
    } catch (e) {
      Toast.error('Could not mark attendance: ' + (e.message || e));
    }
  },

  async openAttendanceSheetModal(traineeId, traineeName, traineeCode) {
    ModalManager.openModal({
      id: 'trainee-att-sheet-modal',
      title: 'Attendance Sheet — ' + traineeName,
      subtitle: traineeCode + ' | Full attendance history',
      contentHtml: '<div style="text-align:center;padding:24px;color:var(--text-muted);">Loading attendance records...</div>',
      size: 'lg'
    });

    try {
      const db = firebase.firestore();
      const snap = await db.collection('attendance')
        .where('employeeId', '==', traineeId)
        .orderBy('date', 'desc')
        .limit(60)
        .get();

      const records = snap.docs.map(d => d.data());

      const tableRows = records.length === 0
        ? '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">No attendance records found for this trainee.</td></tr>'
        : records.map(r => {
            const statusBadge = r.status === 'PRESENT' ? 'badge-success'
              : r.status === 'HALF_DAY' ? 'badge-warning'
              : r.status === 'ABSENT' ? 'badge-danger'
              : 'badge-neutral';
            return '<tr>' +
              '<td><strong>' + (r.date || '') + '</strong></td>' +
              '<td>' + (r.punchIn || '<span class="text-muted">—</span>') + '</td>' +
              '<td>' + (r.punchOut || '<span class="text-muted">—</span>') + '</td>' +
              '<td>' + (r.workedHours != null ? r.workedHours + 'h' : '<span class="text-muted">—</span>') + '</td>' +
              '<td><span class="badge ' + statusBadge + '">' + (r.status || 'UNKNOWN').replace('_',' ') + '</span></td>' +
              '<td><span style="font-size:0.75rem;color:var(--text-muted);">' + (r.markedBy || 'System') + '</span></td>' +
              '</tr>';
          }).join('');

      const bodyHtml =
        '<table class="data-table">' +
        '<thead><tr><th>Date</th><th>Punch In</th><th>Punch Out</th><th>Hours</th><th>Status</th><th>Marked By</th></tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
        '</table>';

      const modalBody = document.querySelector('#trainee-att-sheet-modal .modal-body');
      if (modalBody) modalBody.innerHTML = bodyHtml;
    } catch (e) {
      const modalBody = document.querySelector('#trainee-att-sheet-modal .modal-body');
      if (modalBody) modalBody.innerHTML = '<div style="color:var(--danger);padding:20px;">Error loading attendance: ' + e.message + '</div>';
    }
  },

`;

if (!c.includes(EXPORT_MARKER)) { console.error('EXPORT MARKER not found'); process.exit(1); }
c = c.replace(EXPORT_MARKER, ATTENDANCE_METHODS + EXPORT_MARKER);

fs.writeFileSync(path, c, 'utf8');
console.log('PATCH OK — lines: ' + c.split('\n').length);
