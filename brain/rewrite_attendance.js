const fs = require('fs');
const path = 'D:/AYAN/HRMS/js/views/training-view.js';
let c = fs.readFileSync(path, 'utf8');

// Remove everything from the ATTENDANCE_METHODS marker to the exportTraineesCSV marker
// Then rewrite it cleanly

const START_MARKER = '\n  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n  // TRAINER: ATTENDANCE & MARKS TAB\n  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n  renderAttendanceTab(trainees) {';
const END_MARKER = '  async exportTraineesCSV() {';

const startIdx = c.indexOf(START_MARKER);
const endIdx = c.indexOf(END_MARKER);

if (startIdx === -1) { console.error('START_MARKER not found'); process.exit(1); }
if (endIdx === -1) { console.error('END_MARKER not found'); process.exit(1); }

const before = c.slice(0, startIdx);
const after = c.slice(endIdx);

// Clean replacement block
const NEW_BLOCK = `

  // ===================================================================
  // TRAINER: ATTENDANCE & MARKS TAB + MODULE MANAGEMENT
  // ===================================================================

  renderAttendanceTab(trainees) {
    const today = new Date().toISOString().slice(0, 10);
    const rows = trainees.map(function(t) {
      const curDay = Number(t.currentDay) || 1;
      const prog = t.progress || Math.round((curDay / 7) * 100);
      const safeName = (t.fullName || 'Trainee').replace(/"/g, '&quot;');
      const safeCode = (t.traineeCode || 'TRN').replace(/"/g, '&quot;');
      return '<tr>' +
        '<td>' +
          '<div class="user-cell">' +
            '<div class="user-cell-avatar" style="background:var(--primary-light);color:var(--primary);font-weight:700;">' +
              (t.fullName || 'T').substring(0, 2).toUpperCase() +
            '</div>' +
            '<div class="user-cell-info">' +
              '<span class="user-cell-name font-semibold">' + (t.fullName || '') + '</span>' +
              '<span class="user-cell-email text-muted" style="font-size:0.75rem;">' + (t.traineeCode || 'TRN') + ' &bull; ' + (t.email || '') + '</span>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td><span class="badge badge-primary">' + (t.department || 'Operations') + '</span></td>' +
        '<td>' +
          '<div style="font-size:0.78rem;"><strong>' + (t.batchName || 'Cohort 2026') + '</strong></div>' +
          '<div style="font-size:0.72rem;color:var(--text-muted);">' +
            (t.startDate ? 'From: ' + t.startDate : 'Not started') +
            (t.targetEndDate ? ' &rarr; ' + t.targetEndDate : '') +
          '</div>' +
        '</td>' +
        '<td>' +
          '<div style="font-size:0.8rem;font-weight:600;">Day ' + curDay + ' / 7 &nbsp; <strong style="color:var(--primary);">' + prog + '%</strong></div>' +
          '<div style="width:100px;height:5px;background:var(--border-main);border-radius:3px;overflow:hidden;margin-top:4px;">' +
            '<div style="width:' + prog + '%;height:100%;background:var(--primary);border-radius:3px;"></div>' +
          '</div>' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<div style="display:inline-flex;gap:5px;flex-wrap:wrap;justify-content:center;">' +
            '<button class="btn btn-sm" style="background:var(--success-light);color:var(--success);border:1px solid var(--success);" ' +
              'onclick="TrainingView.markAttendance(' + "'" + t.id + "'" + ',' + "'" + safeName + "'" + ',' + "'PRESENT'" + ',document.getElementById(' + "'att-date-picker'" + ').value,' + "'" + safeCode + "'" + ')">Present</button>' +
            '<button class="btn btn-sm" style="background:var(--warning-light);color:var(--warning);border:1px solid var(--warning);" ' +
              'onclick="TrainingView.markAttendance(' + "'" + t.id + "'" + ',' + "'" + safeName + "'" + ',' + "'HALF_DAY'" + ',document.getElementById(' + "'att-date-picker'" + ').value,' + "'" + safeCode + "'" + ')">Half Day</button>' +
            '<button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);border:1px solid var(--danger);" ' +
              'onclick="TrainingView.markAttendance(' + "'" + t.id + "'" + ',' + "'" + safeName + "'" + ',' + "'ABSENT'" + ',document.getElementById(' + "'att-date-picker'" + ').value,' + "'" + safeCode + "'" + ')">Absent</button>' +
          '</div>' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<div style="display:inline-flex;gap:5px;">' +
            '<button class="btn btn-secondary btn-sm" onclick="TrainingView.openAttendanceSheetModal(' + "'" + t.id + "','" + safeName + "','" + safeCode + "'" + ')">Sheet</button>' +
            '<button class="btn btn-soft btn-sm" onclick="TrainingView.openManageModuleModal(' + "'" + t.id + "','" + safeName + "'," + curDay + ',' + prog + ',' + "'" + (t.startDate || '') + "','" + (t.targetEndDate || '') + "','" + (t.batchName || '') + "'" + ')">Manage</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    return \`
      <div class="card" style="margin-bottom: 20px; padding: 16px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-size: 1rem; font-weight: 700; color: var(--text-main);">Mark Trainee Attendance</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Select date and mark each trainee as present, absent, or half day</div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <input type="date" id="att-date-picker" class="form-control" style="width: 175px;" value="\${today}" />
            <button class="btn btn-primary btn-sm" onclick="TrainingView.switchTab('attendance')">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Trainee Attendance &amp; Module Sheet</div>
            <div class="card-subtitle">Mark daily attendance, manage module progress, start / end batch, and add daily remarks.</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0; overflow-x: auto;">
          \${trainees.length === 0 ? \`
            <div class="empty-state">
              <div class="empty-state-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div class="empty-state-title">No Trainees Enrolled</div>
              <div class="empty-state-desc">Register trainees first to mark their daily attendance.</div>
            </div>
          \` : \`
            <table class="data-table">
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Department</th>
                  <th>Batch &amp; Dates</th>
                  <th>Day &amp; Progress</th>
                  <th style="text-align:center;">Mark Attendance</th>
                  <th style="text-align:center;">Actions</th>
                </tr>
              </thead>
              <tbody id="att-tbody">\${rows}</tbody>
            </table>

            <div style="padding: 20px; border-top: 1px solid var(--border-main);">
              <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Pending Regularization Requests from Trainees
              </div>
              <div id="trainer-reg-list">
                <div style="font-size:0.85rem;color:var(--text-muted);">No pending regularization requests at this time.</div>
              </div>
            </div>
          \`}
        </div>
      </div>
    \`;
  },

  async markAttendance(traineeId, traineeName, status, dateStr, traineeCode) {
    if (!dateStr) dateStr = new Date().toISOString().slice(0, 10);
    try {
      const trainerName = AuthGuard.userProfile?.displayName || 'Trainer';
      const docId = traineeId + '_' + dateStr;
      const db = firebase.firestore();
      await db.collection('attendance').doc(docId).set({
        employeeId: traineeId,
        employeeName: traineeName,
        employeeCode: traineeCode,
        date: dateStr,
        status: status,
        punchIn: status === 'ABSENT' ? null : '10:00',
        punchOut: status === 'PRESENT' ? '19:00' : (status === 'HALF_DAY' ? '16:00' : null),
        workedHours: status === 'PRESENT' ? 9 : (status === 'HALF_DAY' ? 6 : 0),
        markedBy: trainerName,
        markedAt: new Date().toISOString(),
        source: 'TRAINER_MARK',
        isTrainee: true
      }, { merge: true });
      const colMap = { PRESENT: 'var(--success)', HALF_DAY: 'var(--warning)', ABSENT: 'var(--danger)' };
      const label = status.replace('_', ' ');
      const row = document.getElementById('att-row-' + traineeId);
      if (row) {
        const td = row.querySelector('.att-status-cell');
        if (td) td.innerHTML = '<span class="badge" style="background:' + colMap[status] + ';color:#fff;">' + label + '</span>';
      }
      Toast.success(traineeName + ' marked ' + label + ' for ' + dateStr);
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
      const records = snap.docs.map(function(d) { return d.data(); });
      const statusColor = { PRESENT: 'badge-success', HALF_DAY: 'badge-warning', ABSENT: 'badge-danger', LATE: 'badge-warning', REGULARIZED: 'badge-primary' };
      const tableRows = records.length === 0
        ? '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);">No attendance records found.</td></tr>'
        : records.map(function(r) {
            return '<tr>' +
              '<td><strong>' + (r.date || '') + '</strong></td>' +
              '<td>' + (r.punchIn || '<span class="text-muted">—</span>') + '</td>' +
              '<td>' + (r.punchOut || '<span class="text-muted">—</span>') + '</td>' +
              '<td>' + (r.workedHours != null ? r.workedHours + 'h' : '<span class="text-muted">—</span>') + '</td>' +
              '<td><span class="badge ' + (statusColor[r.status] || 'badge-neutral') + '">' + (r.status || '').replace('_', ' ') + '</span></td>' +
              '<td>' + (r.remarks || r.trainerRemarks || '<span class="text-muted">—</span>') + '</td>' +
              '<td style="font-size:0.75rem;color:var(--text-muted);">' + (r.markedBy || 'System') + '</td>' +
            '</tr>';
          }).join('');
      const body = '<table class="data-table">' +
        '<thead><tr><th>Date</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th><th>Remarks</th><th>By</th></tr></thead>' +
        '<tbody>' + tableRows + '</tbody></table>';
      const el = document.querySelector('#trainee-att-sheet-modal .modal-body');
      if (el) el.innerHTML = body;
    } catch (e) {
      const el = document.querySelector('#trainee-att-sheet-modal .modal-body');
      if (el) el.innerHTML = '<div style="color:var(--danger);padding:20px;">Error: ' + e.message + '</div>';
    }
  },

  openManageModuleModal(traineeId, traineeName, curDay, curProgress, startDate, endDate, batchName) {
    const modalHtml = \`
      <form id="manage-module-form" onsubmit="event.preventDefault(); TrainingView.submitManageModule('\${traineeId}');">
        <div style="background: var(--primary-light); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 18px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; flex-shrink: 0;">
            \${(traineeName || 'T').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div style="font-weight: 700; color: var(--text-main);">\${traineeName}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Current Day: <strong>\${curDay} / 7</strong> &bull; Progress: <strong>\${curProgress}%</strong></div>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label">Batch Name</label>
            <input type="text" id="mm-batch" class="form-control" value="\${batchName || ''}" placeholder="e.g. Cohort Q3 2026" />
          </div>
          <div class="form-group">
            <label class="form-label">Current Day (1 – 7) *</label>
            <select id="mm-day" class="form-control" required>
              \${[1,2,3,4,5,6,7].map(function(d) {
                return '<option value="' + d + '"' + (d === curDay ? ' selected' : '') + '>Day ' + d + (d === 6 ? ' — Certification' : (d === 7 ? ' — Floor Handover' : '')) + '</option>';
              }).join('')}
            </select>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label">Batch Start Date</label>
            <input type="date" id="mm-start" class="form-control" value="\${startDate || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Batch End Date</label>
            <input type="date" id="mm-end" class="form-control" value="\${endDate || ''}" />
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div class="form-group">
            <label class="form-label">Updated Progress (%)</label>
            <input type="number" id="mm-progress" class="form-control" min="0" max="100" value="\${curProgress}" />
          </div>
          <div class="form-group">
            <label class="form-label">Training Status</label>
            <select id="mm-status" class="form-control">
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_TRAINING" selected>In Training</option>
              <option value="IN_EVALUATION">In Evaluation</option>
              <option value="CERTIFIED">Certified</option>
              <option value="HANDED_OVER">Handed Over</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label">Mark Day \${curDay} as Complete</label>
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 6px;">
            <input type="checkbox" id="mm-day-complete" style="width: 18px; height: 18px; cursor: pointer;" />
            <label for="mm-day-complete" style="font-size: 0.88rem; color: var(--text-secondary); cursor: pointer;">
              Confirm Day \${curDay} syllabus completed — will advance progress and unlock Day \${Math.min(curDay + 1, 7)}
            </label>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
          <label class="form-label">Trainer Remarks / Daily Notes</label>
          <textarea id="mm-remarks" class="form-control" rows="3" placeholder="e.g. Performed well in crypto fundamentals. Needs improvement in market terminology..."></textarea>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-soft btn-sm" onclick="TrainingView.startBatch('\${traineeId}', '\${traineeName}')">Start Batch</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="TrainingView.endBatch('\${traineeId}', '\${traineeName}')">End Batch</button>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </form>
    \`;
    ModalManager.openModal({
      id: 'manage-module-modal',
      title: 'Manage Module & Progress',
      subtitle: 'Update batch dates, daily progress, and trainee remarks for ' + traineeName,
      contentHtml: modalHtml,
      size: 'lg'
    });
  },

  async submitManageModule(traineeId) {
    try {
      const dayComplete = document.getElementById('mm-day-complete').checked;
      const newDay = Number(document.getElementById('mm-day').value);
      const updatedDay = dayComplete ? Math.min(newDay + 1, 7) : newDay;
      const progress = Number(document.getElementById('mm-progress').value) || Math.round((updatedDay / 7) * 100);
      const status = document.getElementById('mm-status').value;
      const remarks = document.getElementById('mm-remarks').value;
      const startDate = document.getElementById('mm-start').value;
      const endDate = document.getElementById('mm-end').value;
      const batchName = document.getElementById('mm-batch').value;
      const modules = (typeof trainingService !== 'undefined' && trainingService.SEVEN_DAY_MODULES) ? trainingService.SEVEN_DAY_MODULES : [];
      const nextModule = modules[updatedDay - 1];
      const updates = {
        currentDay: updatedDay,
        progress: progress,
        status: status,
        startDate: startDate,
        targetEndDate: endDate,
        batchName: batchName,
        currentModuleTitle: nextModule ? nextModule.title : ('Day ' + updatedDay + ' Training'),
        trainerRemarks: remarks,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: AuthGuard.userProfile?.displayName || 'Trainer'
      };
      if (dayComplete) {
        updates['day' + newDay + 'CompletedAt'] = new Date().toISOString();
        updates['day' + newDay + 'Remarks'] = remarks;
      }
      await trainingService.updateTrainee(traineeId, updates);
      ModalManager.closeModal();
      Toast.success('Module updated successfully. Day ' + updatedDay + ' now active.');
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not save module update: ' + (e.message || e));
    }
  },

  async startBatch(traineeId, traineeName) {
    const today = new Date().toISOString().slice(0, 10);
    const endEl = document.getElementById('mm-end');
    const endDate = endEl && endEl.value ? endEl.value : '';
    try {
      await trainingService.updateTrainee(traineeId, {
        startDate: today,
        status: 'IN_TRAINING',
        currentDay: 1,
        progress: 14,
        batchStartedAt: new Date().toISOString(),
        batchStartedBy: AuthGuard.userProfile?.displayName || 'Trainer'
      });
      Toast.success('Training batch started for ' + traineeName + ' from ' + today);
      ModalManager.closeModal();
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not start batch: ' + (e.message || e));
    }
  },

  async endBatch(traineeId, traineeName) {
    if (!confirm('End the batch for ' + traineeName + '? This will mark the training as completed.')) return;
    try {
      await trainingService.updateTrainee(traineeId, {
        targetEndDate: new Date().toISOString().slice(0, 10),
        status: 'HANDED_OVER',
        batchEndedAt: new Date().toISOString(),
        batchEndedBy: AuthGuard.userProfile?.displayName || 'Trainer'
      });
      Toast.success('Batch ended for ' + traineeName);
      ModalManager.closeModal();
      if (window.Router) Router.navigate('training');
    } catch (e) {
      Toast.error('Could not end batch: ' + (e.message || e));
    }
  },

`;

c = before + NEW_BLOCK + after;
fs.writeFileSync(path, c, 'utf8');
console.log('REWRITE OK — lines: ' + c.split('\n').length);
