/**
 * DIALLO HRMS — CSV IMPORT
 * Reusable "Import CSV" flow: pick file -> preview & validate -> import valid rows.
 *
 * Usage:
 *   CsvImport.open({
 *     title: 'Import Employees',
 *     templateName: 'Diallo_Employees_Template.csv',
 *     columns: [{ key, label, aliases: [], required: true }],
 *     prepare: async () => ctx,                    // optional, runs once after parse (load existing data)
 *     validate: (row, ctx, seen) => 'error' | null // optional extra validation per row
 *     importRow: async (row, ctx) => {},           // creates one record (throws to mark row failed)
 *     onDone: (result) => {}                       // optional, e.g. refresh the view
 *   });
 *
 * Files exported by the app's own "Export CSV" buttons can be re-imported as-is
 * because export headers are registered as aliases.
 */
const CsvImport = {
  MAX_ROWS: 2000,

  // ---------- CSV parsing (RFC 4180: quotes, escaped quotes, CRLF, BOM) ----------
  parse(text) {
    text = String(text || '').replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
        } else { field += c; }
      } else if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        rows.push(row); row = [];
      } else { field += c; }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(cell => String(cell).trim() !== ''));
  },

  _norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); },

  _esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  },

  // Guard against spreadsheet formula injection when values are later exported again
  _clean(v) { return String(v ?? '').trim(); },

  /** Map parsed rows to objects keyed by column.key using header names/aliases. */
  mapRows(matrix, columns) {
    const header = matrix[0].map(h => this._norm(h));
    const index = {};
    columns.forEach(col => {
      const names = [col.label, col.key, ...(col.aliases || [])].map(n => this._norm(n));
      const at = header.findIndex(h => names.includes(h));
      if (at >= 0) index[col.key] = at;
    });
    const missing = columns.filter(c => c.required && !(c.key in index)).map(c => c.label);
    const records = matrix.slice(1).map((cells, i) => {
      const data = {};
      columns.forEach(col => { data[col.key] = col.key in index ? this._clean(cells[index[col.key]]) : ''; });
      return { line: i + 2, data, errors: [], status: 'pending' };
    });
    return { records, missing };
  },

  downloadTemplate(columns, name, sampleRow) {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [columns.map(c => q(c.label)).join(',')];
    if (sampleRow) lines.push(columns.map(c => q(sampleRow[c.key] ?? '')).join(','));
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name || 'import_template.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },

  // ---------- UI ----------
  _state: null,

  open(config) {
    this._state = { config, records: [], ctx: null, busy: false };
    const c = config;
    const required = c.columns.filter(x => x.required).map(x => x.label).join(', ');
    ModalManager.openModal({
      id: 'csv-import-modal',
      title: c.title || 'Import CSV',
      subtitle: `Required columns: ${this._esc(required)}. Max ${this.MAX_ROWS} rows.`,
      size: 'lg',
      contentHtml: `
        <div id="csv-import-body">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:14px;">
            <input type="file" id="csv-import-file" accept=".csv,text/csv" class="form-control" style="max-width:340px;">
            <button type="button" class="btn btn-secondary btn-sm" id="csv-import-template">Download template</button>
          </div>
          <div id="csv-import-preview" style="color:var(--text-muted, #64748b); font-size:13px;">
            Choose a .csv file to preview it before anything is saved.
          </div>
        </div>`,
      footerHtml: `
        <button type="button" class="btn btn-secondary" data-modal-close>Close</button>
        <button type="button" class="btn btn-primary" id="csv-import-run" disabled>Import valid rows</button>`
    });

    document.getElementById('csv-import-template').onclick = () =>
      this.downloadTemplate(c.columns, c.templateName, c.sampleRow);
    document.getElementById('csv-import-file').onchange = e => this._onFile(e.target.files[0]);
    document.getElementById('csv-import-run').onclick = () => this._run();
  },

  async _onFile(file) {
    const box = document.getElementById('csv-import-preview');
    const runBtn = document.getElementById('csv-import-run');
    runBtn.disabled = true;
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      box.innerHTML = '<span style="color:#dc2626;">Please choose a .csv file.</span>';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      box.innerHTML = '<span style="color:#dc2626;">File is larger than 5 MB.</span>';
      return;
    }
    try {
      const st = this._state, cfg = st.config;
      const matrix = this.parse(await file.text());
      if (matrix.length < 2) throw new Error('The file has no data rows.');
      if (matrix.length - 1 > this.MAX_ROWS) throw new Error(`Too many rows (${matrix.length - 1}). Split the file into chunks of ${this.MAX_ROWS}.`);

      const { records, missing } = this.mapRows(matrix, cfg.columns);
      if (missing.length) throw new Error(`Missing required column(s): ${missing.join(', ')}. Download the template to see the expected headers.`);

      box.textContent = 'Checking rows...';
      st.ctx = cfg.prepare ? await cfg.prepare(records) : {};
      const seen = {};
      records.forEach(r => {
        cfg.columns.forEach(col => { if (col.required && !r.data[col.key]) r.errors.push(`${col.label} is required`); });
        if (!r.errors.length && cfg.validate) {
          const msg = cfg.validate(r.data, st.ctx, seen);
          if (msg) r.errors.push(msg);
        }
        r.status = r.errors.length ? 'invalid' : 'valid';
      });
      st.records = records;
      this._renderPreview();
    } catch (err) {
      box.innerHTML = `<span style="color:#dc2626;">${this._esc(err.message)}</span>`;
    }
  },

  _renderPreview() {
    const { config, records } = this._state;
    const valid = records.filter(r => r.status === 'valid').length;
    const invalid = records.filter(r => r.status === 'invalid').length;
    const shown = config.columns.slice(0, 6);
    const body = records.slice(0, 200).map(r => `
      <tr style="${r.status === 'invalid' ? 'background:rgba(220,38,38,.07);' : ''}">
        <td>${r.line}</td>
        ${shown.map(c => `<td>${this._esc(r.data[c.key])}</td>`).join('')}
        <td style="white-space:nowrap; color:${r.status === 'invalid' ? '#dc2626' : '#16a34a'};">
          ${r.status === 'invalid' ? this._esc(r.errors.join('; ')) : 'Ready'}
        </td>
      </tr>`).join('');
    document.getElementById('csv-import-preview').innerHTML = `
      <div style="margin-bottom:10px; font-size:13px; color:inherit;">
        <strong>${records.length}</strong> rows: <span style="color:#16a34a;">${valid} ready</span>,
        <span style="color:#dc2626;">${invalid} with errors</span> (rows with errors are skipped).
      </div>
      <div style="max-height:320px; overflow:auto; border:1px solid var(--border-color, #e2e8f0); border-radius:8px;">
        <table class="data-table" style="width:100%; font-size:12px;">
          <thead><tr><th>Line</th>${shown.map(c => `<th>${this._esc(c.label)}</th>`).join('')}<th>Result</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      ${records.length > 200 ? '<div style="margin-top:6px; font-size:12px;">Preview shows the first 200 rows; all rows are processed.</div>' : ''}`;
    const btn = document.getElementById('csv-import-run');
    btn.disabled = valid === 0;
    btn.textContent = valid ? `Import ${valid} valid row${valid === 1 ? '' : 's'}` : 'Nothing to import';
  },

  async _run() {
    const st = this._state;
    if (st.busy) return;
    const todo = st.records.filter(r => r.status === 'valid');
    if (!todo.length) return;
    st.busy = true;
    const btn = document.getElementById('csv-import-run');
    btn.disabled = true;
    let ok = 0;
    const failed = [];
    for (let i = 0; i < todo.length; i++) {
      btn.textContent = `Importing ${i + 1} / ${todo.length}...`;
      try {
        await st.config.importRow(todo[i].data, st.ctx);
        todo[i].status = 'imported';
        ok++;
      } catch (err) {
        todo[i].status = 'invalid';
        todo[i].errors = [err.message || 'Import failed'];
        failed.push(todo[i]);
      }
    }
    st.busy = false;
    const skipped = st.records.filter(r => r.status === 'invalid').length;
    const msg = `Imported ${ok} row${ok === 1 ? '' : 's'}${skipped ? `, ${skipped} skipped/failed` : ''}.`;
    if (typeof Toast !== 'undefined') (skipped ? Toast.warning : Toast.success).call(Toast, msg);
    this._renderPreview();
    btn.textContent = 'Done';
    btn.disabled = true;
    if (st.config.onDone) st.config.onDone({ imported: ok, failed: failed.length, skipped });
  }
};

window.CsvImport = CsvImport;
