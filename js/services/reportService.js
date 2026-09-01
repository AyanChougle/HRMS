/**
 * DIALLO HRMS — REPORT GENERATION & EXPORT SERVICE (PHASE 12)
 * Central query engine for People, Attendance, Leave, Payroll, Recruitment, Performance, Expenses, and Assets
 */

const reportService = {
  REPORT_CATEGORIES: [
    { code: 'PEOPLE', name: 'People & Headcount' },
    { code: 'ATTENDANCE', name: 'Attendance & Muster Roll' },
    { code: 'LEAVE', name: 'Leave Ledger & Quotas' },
    { code: 'PAYROLL', name: 'Payroll & Statutory Cost' },
    { code: 'RECRUITMENT', name: 'Recruitment & ATS Funnel' },
    { code: 'PERFORMANCE', name: 'Performance & Appraisals' },
    { code: 'EXPENSES', name: 'Expenses & Reimbursements' },
    { code: 'ASSETS', name: 'Asset Inventory & Custody' },
    { code: 'DOCUMENTS', name: 'Document Compliance Dossier' },
    { code: 'REQUESTS', name: 'Employee Helpdesk Requests' }
  ],

  // 1. GET REPORT ROWS WITH GLOBAL FILTERS
  async getReportData(reportType, filters = {}) {
    const targetComp = filters.companyId || AuthGuard.userProfile?.companyId || 'comp_diallo_india';

    try {
      switch (reportType) {
        case 'PEOPLE_DIRECTORY':
        case 'PEOPLE_HEADCOUNT': {
          const snap = await db.collection('employees').where('companyId', '==', targetComp).get();
          let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (filters.department && filters.department !== 'All') list = list.filter(e => e.department === filters.department);
          if (filters.status && filters.status !== 'All') list = list.filter(e => (e.employmentStatus || 'ACTIVE') === filters.status);
          return list;
        }

        case 'ATTENDANCE_SUMMARY': {
          const snap = await db.collection('attendanceRecords').where('companyId', '==', targetComp).limit(100).get();
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        case 'LEAVE_UTILIZATION': {
          const snap = await db.collection('leaveApplications').where('companyId', '==', targetComp).limit(100).get();
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        case 'PAYROLL_SUMMARY': {
          // Strict Role Security Check
          const role = AuthGuard.userProfile?.roleId || 'EMPLOYEE';
          if (!['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'PAYROLL'].includes(role)) {
            throw new Error('Access Denied: You do not have permission to view enterprise payroll reports.');
          }
          const snap = await db.collection('payrollRuns').where('companyId', '==', targetComp).limit(50).get();
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        case 'RECRUITMENT_FUNNEL': {
          const snap = await db.collection('candidates').where('companyId', '==', targetComp).limit(100).get();
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        case 'EXPENSES_SUMMARY': {
          const snap = await db.collection('expenses').where('companyId', '==', targetComp).limit(100).get();
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        case 'ASSET_REGISTER': {
          const snap = await db.collection('assets').where('companyId', '==', targetComp).limit(100).get();
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        case 'DOCUMENT_COMPLIANCE': {
          const snap = await db.collection('employeeDocuments').where('companyId', '==', targetComp).limit(100).get();
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        case 'REQUESTS_QUEUE': {
          const snap = await db.collection('employeeRequests').where('companyId', '==', targetComp).limit(100).get();
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        default:
          return [];
      }
    } catch (e) {
      console.warn(`Error generating report for ${reportType}:`, e);
      throw e;
    }
  },

  // 2. EXPORT DATA TO CSV FILE
  exportToCSV(filename, rows) {
    if (!rows || !rows.length) {
      Toast.warning('No data to export.');
      return;
    }

    const keys = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object' && k !== 'id');
    const header = keys.join(',');
    const csvRows = rows.map(r =>
      keys.map(k => {
        const val = r[k] === null || r[k] === undefined ? '' : String(r[k]).replace(/"/g, '""');
        return `"${val}"`;
      }).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    auditService.log('REPORT_EXPORTED', 'REPORTS', 'export', filename, { rowCount: rows.length });
    Toast.success(`Exported ${rows.length} records to ${filename}.csv`);
  },

  // 3. CLEAN PRINT PREPARATION
  printReport() {
    window.print();
  },

  // 4. SAVED REPORTS PRESETS
  async saveReportPreset(name, reportType, filters = {}) {
    try {
      const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const payload = {
        companyId,
        name,
        reportType,
        filters,
        createdBy: AuthGuard.userProfile?.displayName || 'User',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const ref = await db.collection('savedReports').add(payload);
      return { id: ref.id, ...payload };
    } catch (e) {
      throw e;
    }
  },

  async getSavedReports() {
    try {
      const companyId = AuthGuard.userProfile?.companyId || 'comp_diallo_india';
      const snap = await db.collection('savedReports').where('companyId', '==', companyId).get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      return [];
    }
  },

  async deleteSavedReport(id) {
    try {
      await db.collection('savedReports').doc(id).delete();
      return true;
    } catch (e) {
      throw e;
    }
  }
};

window.reportService = reportService;
