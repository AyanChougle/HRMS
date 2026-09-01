/**
 * DIALLO HRMS — LIGHTWEIGHT VANILLA SVG CHARTS
 * Handles data visualization with graceful empty states when no records exist.
 */

const Charts = {
  // Renders a smooth trend line chart
  renderTrendChart(containerId, data = [], labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today']) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0 || data.every(v => v === 0)) {
      container.innerHTML = `
        <div class="empty-state" style="border: none; padding: 40px 10px; height: 100%;">
          <div class="empty-state-icon" style="width: 40px; height: 40px; margin-bottom: 8px;">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
            </svg>
          </div>
          <div class="empty-state-title" style="font-size: 0.95rem;">No Attendance Activity Yet</div>
          <div class="empty-state-desc" style="font-size: 0.8rem; margin-bottom: 0;">Attendance trends will populate as employees punch in daily.</div>
        </div>
      `;
      return;
    }

    const width = 500;
    const height = 180;
    const padding = 35;
    const maxVal = 100;
    const minVal = 0;

    const points = data.map((val, idx) => {
      const x = padding + (idx * (width - 2 * padding)) / (data.length - 1);
      const y = height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding);
      return { x, y, val, label: labels[idx] };
    });

    const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2563eb" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#2563eb" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" class="chart-grid-line" />
        <line x1="${padding}" y1="${(height - padding * 2) / 2 + padding}" x2="${width - padding}" y2="${(height - padding * 2) / 2 + padding}" class="chart-grid-line" />
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="chart-axis-line" />

        <text x="${padding - 8}" y="${padding + 4}" class="chart-axis-text" text-anchor="end">100%</text>
        <text x="${padding - 8}" y="${(height - padding * 2) / 2 + padding + 4}" class="chart-axis-text" text-anchor="end">50%</text>
        <text x="${padding - 8}" y="${height - padding + 4}" class="chart-axis-text" text-anchor="end">0%</text>

        <path d="${areaD}" class="chart-area" />
        <path d="${pathD}" class="chart-line" />

        ${points.map(pt => `
          <circle cx="${pt.x}" cy="${pt.y}" class="chart-dot">
            <title>${pt.label}: ${pt.val}% Attendance</title>
          </circle>
          <text x="${pt.x}" y="${height - 12}" class="chart-axis-text" text-anchor="middle">${pt.label}</text>
        `).join('')}
      </svg>
    `;
  },

  // Renders a Headcount by Department Donut Chart
  renderDonutChart(containerId, segments = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const total = segments.reduce((sum, s) => sum + s.count, 0);

    if (total === 0) {
      container.innerHTML = `
        <div class="empty-state" style="border: none; padding: 40px 10px;">
          <div class="empty-state-icon" style="width: 40px; height: 40px; margin-bottom: 8px;">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div class="empty-state-title" style="font-size: 0.95rem;">0 Employees Registered</div>
          <div class="empty-state-desc" style="font-size: 0.8rem; margin-bottom: 12px;">Add employees to see department breakdown.</div>
          <button class="btn btn-soft btn-sm" onclick="Forms.openEmployeeModal()">+ Add Employee</button>
        </div>
      `;
      return;
    }

    let cumulative = 0;
    const radius = 65;
    const circumference = 2 * Math.PI * radius;

    const circles = segments.filter(s => s.count > 0).map(seg => {
      const strokeDasharray = `${(seg.count / total) * circumference} ${circumference}`;
      const strokeDashoffset = -cumulative * circumference;
      cumulative += seg.count / total;
      return `
        <circle cx="90" cy="90" r="${radius}" fill="none" stroke="${seg.color}" stroke-width="26"
          stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}"
          transform="rotate(-90 90 90)">
          <title>${seg.label}: ${seg.count} employees (${Math.round((seg.count/total)*100)}%)</title>
        </circle>
      `;
    }).join('');

    const legendHtml = segments.map(s => `
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; margin-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${s.color};"></span>
          <span class="text-secondary">${s.label}</span>
        </div>
        <span class="font-semibold text-main">${s.count} <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">(${Math.round((s.count/total)*100)}%)</span></span>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
        <div style="width: 180px; height: 180px; position: relative; flex-shrink: 0;">
          <svg viewBox="0 0 180 180" style="width: 100%; height: 100%;">
            ${circles}
          </svg>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <div style="font-size: 1.3rem; font-weight: 700; color: var(--text-main); line-height: 1;">${total}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Employees</div>
          </div>
        </div>
        <div style="flex: 1; min-width: 160px;">
          ${legendHtml}
        </div>
      </div>
    `;
  }
};

window.Charts = Charts;
