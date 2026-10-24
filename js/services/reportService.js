/**
 * DIALLO HRMS — REPORT SERVICE
 * Handles CSV export with formula injection protection and printable views
 */

const reportService = {
  // Export table or raw JSON array as CSV
  exportToCsv(filename, rows, headers = null) {
    if (!rows || rows.length === 0) {
      Toast.warning('No data available to export.');
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM
    
    // Headers
    const columnKeys = headers ? Object.keys(headers) : Object.keys(rows[0]);
    const headerLabels = headers ? Object.values(headers) : columnKeys;
    csvContent += headerLabels.map(h => {
      let str = String(h);
      if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',') + '\r\n';

    // Rows with CSV Formula Injection Protection
    rows.forEach(row => {
      const line = columnKeys.map(key => {
        let val = row[key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        let strVal = String(val);
        // Formula injection protection
        if (/^[=+\-@\t\r]/.test(strVal)) {
          strVal = "'" + strVal;
        }
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(',');
      csvContent += line + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Toast.success(`Exported "${filename}.csv" successfully.`);
  },

  // Authoritative Backend Export: Direct XLSX / CSV from Hostinger MySQL
  downloadBackendExport(type = 'attendance', format = 'xlsx', extraParams = {}) {
    const baseUrl = 'https://hrmstfw.com/hostinger_backend/export.php';
    const params = new URLSearchParams({ type, format, ...extraParams });
    const downloadUrl = `${baseUrl}?${params.toString()}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof Toast !== 'undefined') {
      Toast.success(`Generated official ${format.toUpperCase()} export from MySQL database.`);
    }
  },

  printReport(containerId = 'report-printable-area') {
    const el = document.getElementById(containerId) || document.querySelector('.report-studio-content') || document.querySelector('.tab-content');
    if (!el) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html>
        <head>
          <title>Diallo HRMS — Enterprise Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 14px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            th { background: #f1f5f9; font-weight: 700; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
            .kpi-card { border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; }
            .kpi-val { font-size: 16px; font-weight: 800; color: #0284c7; }
            .kpi-lbl { font-size: 10px; color: #64748b; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div style="border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between;">
            <div>
              <h2 style="margin: 0; font-size: 16px;">DIALLO INDIA PRIVATE LIMITED</h2>
              <div style="font-size: 10px; color: #64748b;">Enterprise Human Resource Management & Statutory Analytics</div>
            </div>
            <div style="font-size: 10px; text-align: right; color: #64748b;">
              Generated on: ${new Date().toLocaleString()}<br/>
              Report ID: RPT-${Date.now().toString().slice(-6)}
            </div>
          </div>
          ${el.innerHTML}
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWin.document.close();
  }
};

window.reportService = reportService;
