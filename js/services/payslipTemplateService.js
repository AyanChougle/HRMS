/**
 * DIALLO HRMS — PAYSLIP TEMPLATE ENGINE & DESIGNER SERVICE
 * Multi-template generation (Classic, Canvas Standard, Compliance, Modern Executive, Minimalist)
 * Custom branding, live preview, print rendering, and PDF layout compilation.
 */

const payslipTemplateService = {
  PRESET_TEMPLATES: [
    {
      id: 'classic',
      name: 'Classic',
      category: 'Preset',
      isDefault: true,
      description: 'Authoritative boxed tabular layout with standard compliance borders and formal double-ruled signatures.',
      primaryColor: '#2563eb',
      accentColor: '#1e293b',
      headerStyle: 'standard',
      showQrCode: false,
      showEmployerContributions: false,
      showBankDetails: true,
      footerNote: 'This is a computer-generated statement and does not require a physical signature.'
    },
    {
      id: 'canvas',
      name: 'Canvas Standard',
      category: 'Preset',
      isDefault: false,
      description: 'Modern corporate layout with sky-blue banner highlights, clean card groupings, and prominent take-home payout callout.',
      primaryColor: '#0284c7',
      accentColor: '#0369a1',
      headerStyle: 'banner',
      showQrCode: true,
      showEmployerContributions: false,
      showBankDetails: true,
      footerNote: 'Confidential document issued by Diallo India Pvt Ltd. Keep for tax filing purposes.'
    },
    {
      id: 'compliance',
      name: 'Compliance',
      category: 'Preset',
      isDefault: false,
      description: 'Statutory-first format emphasizing EPFO (UAN/PF/EPS), ESIC, Professional Tax, LWF, TDS withholdings, and employer match.',
      primaryColor: '#059669',
      accentColor: '#065f46',
      headerStyle: 'statutory',
      showQrCode: true,
      showEmployerContributions: true,
      showBankDetails: true,
      footerNote: 'Compliant with Code on Wages 2026, EPF & MP Act 1952, and State Professional Tax Acts.'
    },
    {
      id: 'modern',
      name: 'Modern',
      category: 'Preset',
      isDefault: false,
      description: 'Tech-forward violet/indigo gradient styling, rounded micro-cards, attendance badges, and digital QR verification seal.',
      primaryColor: '#6366f1',
      accentColor: '#4338ca',
      headerStyle: 'gradient',
      showQrCode: true,
      showEmployerContributions: true,
      showBankDetails: true,
      footerNote: 'Verified digital payslip issued via Diallo HRMS Enterprise Cloud.'
    },
    {
      id: 'minimal',
      name: 'Minimalist Swiss',
      category: 'Preset',
      isDefault: false,
      description: 'High-contrast typography, ultra-clean hairline separators, and compact layout optimized for rapid review.',
      primaryColor: '#0f172a',
      accentColor: '#334155',
      headerStyle: 'minimal',
      showQrCode: false,
      showEmployerContributions: false,
      showBankDetails: true,
      footerNote: 'Direct all payroll queries to hr-payroll@diallo.com.'
    }
  ],

  // Load all templates (presets + custom saved in Firestore / localStorage)
  async getTemplates() {
    let customTemplates = [];
    try {
      const snap = await db.collection('payslipTemplates').get();
      customTemplates = snap.docs.map(d => ({ id: d.id, ...d.data(), category: 'Custom' }));
    } catch (e) {
      try {
        const local = localStorage.getItem('diallo_custom_payslip_templates');
        if (local) customTemplates = JSON.parse(local);
      } catch (err) {}
    }

    const activeId = await this.getActiveTemplateId();
    const all = [...this.PRESET_TEMPLATES, ...customTemplates];
    return all.map(t => ({
      ...t,
      isDefault: t.id === activeId
    }));
  },

  // Get active template ID
  async getActiveTemplateId() {
    try {
      const doc = await db.collection('companySettings').doc('payslipConfig').get();
      if (doc.exists && doc.data().activeTemplateId) {
        return doc.data().activeTemplateId;
      }
    } catch (e) {}
    return localStorage.getItem('diallo_active_payslip_template') || 'classic';
  },

  // Set active default template
  async setActiveTemplate(templateId) {
    localStorage.setItem('diallo_active_payslip_template', templateId);
    try {
      await db.collection('companySettings').doc('payslipConfig').set({
        activeTemplateId: templateId,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Error saving active payslip template to firestore:', e);
    }
    return true;
  },

  // Save custom template
  async saveTemplate(template) {
    const id = template.id || ('custom_' + Date.now());
    const payload = {
      ...template,
      id,
      updatedAt: new Date().toISOString()
    };

    try {
      await db.collection('payslipTemplates').doc(id).set(payload, { merge: true });
    } catch (e) {
      const templates = JSON.parse(localStorage.getItem('diallo_custom_payslip_templates') || '[]');
      const index = templates.findIndex(t => t.id === id);
      if (index >= 0) templates[index] = payload;
      else templates.push(payload);
      localStorage.setItem('diallo_custom_payslip_templates', JSON.stringify(templates));
    }
    return payload;
  },

  // Duplicate a template
  async duplicateTemplate(templateId) {
    const templates = await this.getTemplates();
    const source = templates.find(t => t.id === templateId) || this.PRESET_TEMPLATES[0];
    const newTemplate = {
      ...source,
      id: 'custom_' + source.id + '_' + Date.now().toString().slice(-4),
      name: source.name + ' (Copy)',
      category: 'Custom',
      isDefault: false
    };
    return await this.saveTemplate(newTemplate);
  },

  // Delete custom template
  async deleteTemplate(templateId) {
    try {
      await db.collection('payslipTemplates').doc(templateId).delete();
    } catch (e) {
      const templates = JSON.parse(localStorage.getItem('diallo_custom_payslip_templates') || '[]');
      const filtered = templates.filter(t => t.id !== templateId);
      localStorage.setItem('diallo_custom_payslip_templates', JSON.stringify(filtered));
    }
  },

  // Get sample payslip data for preview
  getSampleRecord() {
    return {
      periodName: 'August 2026',
      payDate: '05 September 2026',
      companySnapshot: {
        name: 'DIALLO INDIA PRIVATE LIMITED',
        cin: 'U72900MH2026PTC123456',
        pan: 'AAACD1234E',
        gstin: '27AAACD1234E1Z5',
        address: 'BKC Innovation Tower, Bandra Kurla Complex, Mumbai, Maharashtra - 400051'
      },
      employeeSnapshot: {
        fullName: 'Rahul S. Sharma',
        employeeCode: 'EMP-1042',
        designation: 'Senior Full Stack Engineer',
        department: 'Product & Engineering',
        pan: 'ABCDE1234F',
        uan: '100987654321',
        pfNumber: 'MH/BAN/0012345/000/1042',
        esicNumber: '31001234560001001',
        doj: '12-Jan-2023',
        bankName: 'HDFC Bank Ltd',
        bankAccount: '••••••••4892',
        ifsc: 'HDFC0001234',
        location: 'HQ - Mumbai'
      },
      attendanceSnapshot: {
        totalDays: 31,
        workingDays: 26,
        presentDays: 24,
        paidLeaveDays: 2,
        lwpDays: 0,
        overtimeHours: 6.5
      },
      earnings: {
        basic: 32500,
        hra: 16250,
        specialAllowance: 13400,
        conveyance: 1600,
        medicalAllowance: 1250,
        overtimePay: 0,
        grossPay: 65000
      },
      deductions: {
        epfEmployee: 1800,
        esicEmployee: 0,
        professionalTax: 200,
        tds: 1777,
        lwpDeduction: 0,
        totalDeductions: 3777
      },
      employerContributions: {
        epfEmployer: 550,
        epsEmployer: 1250,
        esicEmployer: 0,
        gratuity: 1563,
        totalEmployerCost: 3363
      },
      netPay: 61223,
      netInWords: 'Sixty One Thousand Two Hundred and Twenty Three Rupees Only'
    };
  },

  // Helper to normalize any record
  normalizeRecord(r) {
    const sample = this.getSampleRecord();
    if (!r) return sample;

    return {
      periodName: r.periodName || sample.periodName,
      payDate: r.payDate || sample.payDate,
      companySnapshot: r.companySnapshot || sample.companySnapshot,
      employeeSnapshot: {
        fullName: r.employeeSnapshot?.fullName || r.employeeName || sample.employeeSnapshot.fullName,
        employeeCode: r.employeeSnapshot?.employeeCode || r.employeeId || sample.employeeSnapshot.employeeCode,
        designation: r.employeeSnapshot?.designation || sample.employeeSnapshot.designation,
        department: r.employeeSnapshot?.department || sample.employeeSnapshot.department,
        pan: r.employeeSnapshot?.pan || sample.employeeSnapshot.pan,
        uan: r.employeeSnapshot?.uan || sample.employeeSnapshot.uan,
        pfNumber: r.employeeSnapshot?.pfNumber || sample.employeeSnapshot.pfNumber,
        esicNumber: r.employeeSnapshot?.esicNumber || sample.employeeSnapshot.esicNumber,
        doj: r.employeeSnapshot?.doj || sample.employeeSnapshot.doj,
        bankName: r.employeeSnapshot?.bankName || sample.employeeSnapshot.bankName,
        bankAccount: r.employeeSnapshot?.bankAccount || sample.employeeSnapshot.bankAccount,
        ifsc: r.employeeSnapshot?.ifsc || sample.employeeSnapshot.ifsc,
        location: r.employeeSnapshot?.location || sample.employeeSnapshot.location
      },
      attendanceSnapshot: {
        totalDays: r.attendanceSnapshot?.totalDays || sample.attendanceSnapshot.totalDays,
        workingDays: r.attendanceSnapshot?.workingDays || sample.attendanceSnapshot.workingDays,
        presentDays: r.attendanceSnapshot?.presentDays !== undefined ? r.attendanceSnapshot.presentDays : sample.attendanceSnapshot.presentDays,
        paidLeaveDays: r.attendanceSnapshot?.paidLeaveDays || 0,
        lwpDays: r.attendanceSnapshot?.lwpDays || 0,
        overtimeHours: r.attendanceSnapshot?.overtimeHours || 0
      },
      earnings: {
        basic: r.earnings?.basic || 32500,
        hra: r.earnings?.hra || 16250,
        specialAllowance: r.earnings?.specialAllowance || 13400,
        conveyance: r.earnings?.conveyance || 1600,
        medicalAllowance: r.earnings?.medicalAllowance || 1250,
        overtimePay: r.earnings?.overtimePay || 0,
        grossPay: r.earnings?.grossPay || 65000
      },
      deductions: {
        epfEmployee: r.deductions?.epfEmployee !== undefined ? r.deductions.epfEmployee : 1800,
        esicEmployee: r.deductions?.esicEmployee || 0,
        professionalTax: r.deductions?.professionalTax !== undefined ? r.deductions.professionalTax : 200,
        tds: r.deductions?.tds !== undefined ? r.deductions.tds : 1777,
        lwpDeduction: r.deductions?.lwpDeduction || 0,
        totalDeductions: r.deductions?.totalDeductions || 3777
      },
      employerContributions: {
        epfEmployer: r.employerContributions?.epfEmployer || 550,
        epsEmployer: r.employerContributions?.epsEmployer || 1250,
        esicEmployer: r.employerContributions?.esicEmployer || 0,
        gratuity: r.employerContributions?.gratuity || 1563,
        totalEmployerCost: r.employerContributions?.totalEmployerCost || 3363
      },
      netPay: r.netPay || 61223,
      netInWords: r.netInWords || 'Rupees Only'
    };
  },

  // -------------------------------------------------------------
  // MASTER HTML RENDERER ACCORDING TO SELECTED TEMPLATE
  // -------------------------------------------------------------
  renderPayslipHtml(record, templateConfig = null) {
    const data = this.normalizeRecord(record);
    const templateId = templateConfig?.id || (typeof templateConfig === 'string' ? templateConfig : 'classic');
    const template = this.PRESET_TEMPLATES.find(t => t.id === templateId) || this.PRESET_TEMPLATES[0];
    const cfg = { ...template, ...(typeof templateConfig === 'object' ? templateConfig : {}) };

    if (cfg.id === 'canvas') return this.renderCanvasStandardHtml(data, cfg);
    if (cfg.id === 'compliance') return this.renderComplianceHtml(data, cfg);
    if (cfg.id === 'modern') return this.renderModernHtml(data, cfg);
    if (cfg.id === 'minimal') return this.renderMinimalHtml(data, cfg);
    return this.renderClassicHtml(data, cfg);
  },

  // 1. CLASSIC TEMPLATE HTML
  renderClassicHtml(d, cfg) {
    return `
      <div class="payslip-document-wrapper" id="printable-payslip-container" style="background: #ffffff; color: #1e293b; padding: 28px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 820px; margin: 0 auto; box-sizing: border-box;">
        <!-- Top Company Header -->
        <div style="text-align: center; padding-bottom: 14px; border-bottom: 2px solid #1e293b; margin-bottom: 14px;">
          <h2 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; letter-spacing: 0.5px; text-transform: uppercase;">
            ${d.companySnapshot.name}
          </h2>
          <div style="font-size: 0.75rem; color: #475569; line-height: 1.4;">
            <strong>CIN:</strong> ${d.companySnapshot.cin} | <strong>PAN:</strong> ${d.companySnapshot.pan} | <strong>GSTIN:</strong> ${d.companySnapshot.gstin}<br/>
            ${d.companySnapshot.address}
          </div>
          <div style="margin-top: 8px;">
            <span style="display: inline-block; background: #0f172a; color: #ffffff; font-size: 0.75rem; font-weight: 700; padding: 3px 12px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.5px;">
              SALARY PAYSLIP — ${d.periodName}
            </span>
          </div>
        </div>

        <!-- Employee Bio Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 14px; border: 1px solid #cbd5e1;">
          <tbody>
            <tr>
              <td style="padding: 5px 8px; background: #f8fafc; font-weight: 600; width: 18%; border: 1px solid #cbd5e1;">Employee Name:</td>
              <td style="padding: 5px 8px; width: 32%; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">${d.employeeSnapshot.fullName}</td>
              <td style="padding: 5px 8px; background: #f8fafc; font-weight: 600; width: 18%; border: 1px solid #cbd5e1;">Employee Code:</td>
              <td style="padding: 5px 8px; width: 32%; border: 1px solid #cbd5e1; font-weight: 600;">${d.employeeSnapshot.employeeCode}</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; background: #f8fafc; font-weight: 600; border: 1px solid #cbd5e1;">Designation:</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${d.employeeSnapshot.designation}</td>
              <td style="padding: 5px 8px; background: #f8fafc; font-weight: 600; border: 1px solid #cbd5e1;">Department:</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${d.employeeSnapshot.department}</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; background: #f8fafc; font-weight: 600; border: 1px solid #cbd5e1;">PAN Number:</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${d.employeeSnapshot.pan}</td>
              <td style="padding: 5px 8px; background: #f8fafc; font-weight: 600; border: 1px solid #cbd5e1;">UAN (PF No):</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${d.employeeSnapshot.uan || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; background: #f8fafc; font-weight: 600; border: 1px solid #cbd5e1;">Bank Account:</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${d.employeeSnapshot.bankName} (${d.employeeSnapshot.bankAccount})</td>
              <td style="padding: 5px 8px; background: #f8fafc; font-weight: 600; border: 1px solid #cbd5e1;">Days Worked / Leaves:</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${d.attendanceSnapshot.presentDays} Present / ${d.attendanceSnapshot.paidLeaveDays} Leave</td>
            </tr>
          </tbody>
        </table>

        <!-- Earnings & Deductions Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 14px;">
          <thead>
            <tr style="background: #e2e8f0; color: #0f172a;">
              <th style="padding: 7px 8px; text-align: left; border: 1px solid #cbd5e1; width: 35%;">EARNINGS</th>
              <th style="padding: 7px 8px; text-align: right; border: 1px solid #cbd5e1; width: 15%;">AMOUNT (₹)</th>
              <th style="padding: 7px 8px; text-align: left; border: 1px solid #cbd5e1; width: 35%;">DEDUCTIONS</th>
              <th style="padding: 7px 8px; text-align: right; border: 1px solid #cbd5e1; width: 15%;">AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Basic Salary (50%)</td>
              <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${d.earnings.basic.toLocaleString('en-IN')}.00</td>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Provident Fund (EPF 12%)</td>
              <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1; color: #b91c1c;">₹${d.deductions.epfEmployee.toLocaleString('en-IN')}.00</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">House Rent Allowance (HRA)</td>
              <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${d.earnings.hra.toLocaleString('en-IN')}.00</td>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Employee State Insurance (ESIC)</td>
              <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1; color: #b91c1c;">₹${d.deductions.esicEmployee.toLocaleString('en-IN')}.00</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Special Allowance</td>
              <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${d.earnings.specialAllowance.toLocaleString('en-IN')}.00</td>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Professional Tax (State PT)</td>
              <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1; color: #b91c1c;">₹${d.deductions.professionalTax.toLocaleString('en-IN')}.00</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Conveyance & Medical Allowance</td>
              <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${(d.earnings.conveyance + d.earnings.medicalAllowance).toLocaleString('en-IN')}.00</td>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Income Tax TDS / Deductions</td>
              <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1; color: #b91c1c;">₹${(d.deductions.tds + d.deductions.lwpDeduction).toLocaleString('en-IN')}.00</td>
            </tr>
            <tr style="background: #f8fafc; font-weight: 700;">
              <td style="padding: 7px 8px; border: 1px solid #cbd5e1;">Total Gross Earnings</td>
              <td style="padding: 7px 8px; text-align: right; border: 1px solid #cbd5e1; color: #0284c7;">₹${d.earnings.grossPay.toLocaleString('en-IN')}.00</td>
              <td style="padding: 7px 8px; border: 1px solid #cbd5e1;">Total Deductions</td>
              <td style="padding: 7px 8px; text-align: right; border: 1px solid #cbd5e1; color: #dc2626;">₹${d.deductions.totalDeductions.toLocaleString('en-IN')}.00</td>
            </tr>
          </tbody>
        </table>

        <!-- Net Take Home Box -->
        <div style="background: #f1f5f9; border: 1px solid #94a3b8; border-radius: 4px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <div>
            <div style="font-size: 0.725rem; font-weight: 700; color: #475569; text-transform: uppercase;">Net Salary Disbursed</div>
            <div style="font-size: 0.8rem; color: #1e293b;"><strong>In Words:</strong> ${d.netInWords}</div>
          </div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #0f172a;">
            ₹${d.netPay.toLocaleString('en-IN')}.00
          </div>
        </div>

        <!-- Signature Row -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; font-size: 0.75rem; color: #64748b; border-top: 1px dashed #cbd5e1;">
          <div>
            <div><strong>Disbursement Date:</strong> ${d.payDate}</div>
            <div style="margin-top: 2px;">${cfg.footerNote}</div>
          </div>
          <div style="text-align: center;">
            <div style="border-bottom: 1px solid #64748b; width: 140px; margin-bottom: 4px;"></div>
            <span>Authorized Signatory</span>
          </div>
        </div>
      </div>
    `;
  },

  // 2. CANVAS STANDARD TEMPLATE HTML
  renderCanvasStandardHtml(d, cfg) {
    const primary = cfg.primaryColor || '#0284c7';
    return `
      <div class="payslip-document-wrapper" id="printable-payslip-container" style="background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 820px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <!-- Top Sky-Blue Header Band -->
        <div style="background: ${primary}; color: #ffffff; padding: 24px 28px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 1.4rem; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.2px;">
              ${d.companySnapshot.name}
            </h1>
            <div style="font-size: 0.75rem; opacity: 0.9;">
              ${d.companySnapshot.address} • CIN: ${d.companySnapshot.cin}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
              Payslip for ${d.periodName}
            </div>
            <div style="font-size: 0.7rem; margin-top: 4px; opacity: 0.85;">Paid on: ${d.payDate}</div>
          </div>
        </div>

        <div style="padding: 24px 28px;">
          <!-- Employee Details Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
            <div style="background: #f8fafc; padding: 14px 16px; border-radius: 8px; border: 1px solid #f1f5f9; font-size: 0.825rem; line-height: 1.6;">
              <div><span style="color: #64748b;">Employee Name:</span> <strong style="color: #0f172a;">${d.employeeSnapshot.fullName}</strong></div>
              <div><span style="color: #64748b;">Employee Code:</span> <strong>${d.employeeSnapshot.employeeCode}</strong></div>
              <div><span style="color: #64748b;">Designation:</span> <strong>${d.employeeSnapshot.designation}</strong></div>
              <div><span style="color: #64748b;">Department:</span> <strong>${d.employeeSnapshot.department}</strong></div>
            </div>
            <div style="background: #f8fafc; padding: 14px 16px; border-radius: 8px; border: 1px solid #f1f5f9; font-size: 0.825rem; line-height: 1.6;">
              <div><span style="color: #64748b;">PAN:</span> <strong>${d.employeeSnapshot.pan}</strong> | <span style="color: #64748b;">UAN:</span> <strong>${d.employeeSnapshot.uan || 'N/A'}</strong></div>
              <div><span style="color: #64748b;">Bank A/C:</span> <strong>${d.employeeSnapshot.bankName} • ${d.employeeSnapshot.bankAccount}</strong></div>
              <div><span style="color: #64748b;">Working Days:</span> <strong>${d.attendanceSnapshot.workingDays} Days</strong></div>
              <div><span style="color: #64748b;">Days Present:</span> <strong style="color: #0284c7;">${d.attendanceSnapshot.presentDays} Days (${d.attendanceSnapshot.paidLeaveDays} Paid Leave)</strong></div>
            </div>
          </div>

          <!-- Dual Column Table: Earnings & Deductions -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
            <!-- Earnings Box -->
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background: #f0f9ff; padding: 10px 14px; border-bottom: 1px solid #bae6fd; font-weight: 700; font-size: 0.85rem; color: #0369a1; display: flex; justify-content: space-between;">
                <span>EARNINGS</span>
                <span>AMOUNT</span>
              </div>
              <div style="padding: 12px 14px; font-size: 0.825rem; line-height: 2;">
                <div style="display: flex; justify-content: space-between;"><span>Basic Salary</span><strong>₹${d.earnings.basic.toLocaleString('en-IN')}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>House Rent Allowance</span><strong>₹${d.earnings.hra.toLocaleString('en-IN')}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>Special Allowance</span><strong>₹${d.earnings.specialAllowance.toLocaleString('en-IN')}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>Conveyance & Medical</span><strong>₹${(d.earnings.conveyance + d.earnings.medicalAllowance).toLocaleString('en-IN')}</strong></div>
              </div>
              <div style="background: #f8fafc; padding: 10px 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-weight: 800; font-size: 0.9rem; color: #0284c7;">
                <span>TOTAL GROSS</span>
                <span>₹${d.earnings.grossPay.toLocaleString('en-IN')}.00</span>
              </div>
            </div>

            <!-- Deductions Box -->
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background: #fef2f2; padding: 10px 14px; border-bottom: 1px solid #fecaca; font-weight: 700; font-size: 0.85rem; color: #991b1b; display: flex; justify-content: space-between;">
                <span>DEDUCTIONS</span>
                <span>AMOUNT</span>
              </div>
              <div style="padding: 12px 14px; font-size: 0.825rem; line-height: 2;">
                <div style="display: flex; justify-content: space-between;"><span>Provident Fund (EPF)</span><strong style="color: #dc2626;">-₹${d.deductions.epfEmployee.toLocaleString('en-IN')}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>Professional Tax (PT)</span><strong style="color: #dc2626;">-₹${d.deductions.professionalTax.toLocaleString('en-IN')}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>State Insurance (ESIC)</span><strong style="color: #dc2626;">-₹${d.deductions.esicEmployee.toLocaleString('en-IN')}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>Income Tax TDS</span><strong style="color: #dc2626;">-₹${(d.deductions.tds + d.deductions.lwpDeduction).toLocaleString('en-IN')}</strong></div>
              </div>
              <div style="background: #f8fafc; padding: 10px 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-weight: 800; font-size: 0.9rem; color: #dc2626;">
                <span>TOTAL DEDUCTIONS</span>
                <span>-₹${d.deductions.totalDeductions.toLocaleString('en-IN')}.00</span>
              </div>
            </div>
          </div>

          <!-- Bottom Net Banner -->
          <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; border-radius: 8px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; opacity: 0.9;">NET PAYABLE AMOUNT</div>
              <div style="font-size: 0.85rem; margin-top: 2px;">${d.netInWords}</div>
            </div>
            <div style="font-size: 1.6rem; font-weight: 900; letter-spacing: -0.5px;">
              ₹${d.netPay.toLocaleString('en-IN')}.00
            </div>
          </div>

          <!-- Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.725rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            <div>${cfg.footerNote}</div>
            <div>Diallo HRMS Canvas Engine</div>
          </div>
        </div>
      </div>
    `;
  },

  // 3. COMPLIANCE TEMPLATE HTML
  renderComplianceHtml(d, cfg) {
    const primary = cfg.primaryColor || '#059669';
    return `
      <div class="payslip-document-wrapper" id="printable-payslip-container" style="background: #ffffff; color: #1e293b; padding: 28px; border: 1px solid #059669; border-top: 6px solid #059669; border-radius: 6px; font-family: 'Segoe UI', Arial, sans-serif; max-width: 820px; margin: 0 auto;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
          <div>
            <span style="background: #059669; color: #fff; font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 2px; text-transform: uppercase;">Statutory Form-16 Format</span>
            <h2 style="font-size: 1.3rem; font-weight: 800; color: #064e3b; margin: 6px 0 2px 0;">${d.companySnapshot.name}</h2>
            <div style="font-size: 0.75rem; color: #475569;">
              <strong>CIN:</strong> ${d.companySnapshot.cin} | <strong>PAN:</strong> ${d.companySnapshot.pan} | <strong>GSTIN:</strong> ${d.companySnapshot.gstin}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.1rem; font-weight: 800; color: #059669;">PAYSLIP / STATEMENT</div>
            <div style="font-size: 0.8rem; font-weight: 600; color: #1e293b;">Wage Period: ${d.periodName}</div>
          </div>
        </div>

        <!-- Statutory Identifiers Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px 12px; border-radius: 4px; font-size: 0.75rem; margin-bottom: 16px;">
          <div><span style="color: #065f46; font-weight: 600;">Employee Name:</span><br/><strong>${d.employeeSnapshot.fullName}</strong></div>
          <div><span style="color: #065f46; font-weight: 600;">Employee Code:</span><br/><strong>${d.employeeSnapshot.employeeCode}</strong></div>
          <div><span style="color: #065f46; font-weight: 600;">UAN (EPFO):</span><br/><strong>${d.employeeSnapshot.uan || 'N/A'}</strong></div>
          <div><span style="color: #065f46; font-weight: 600;">ESIC IP No:</span><br/><strong>${d.employeeSnapshot.esicNumber || 'Exempt'}</strong></div>
          <div><span style="color: #065f46; font-weight: 600;">Income Tax PAN:</span><br/><strong>${d.employeeSnapshot.pan}</strong></div>
          <div><span style="color: #065f46; font-weight: 600;">PF Member ID:</span><br/><strong>${d.employeeSnapshot.pfNumber}</strong></div>
          <div><span style="color: #065f46; font-weight: 600;">Payable / Worked Days:</span><br/><strong>${d.attendanceSnapshot.presentDays} / ${d.attendanceSnapshot.workingDays} Days</strong></div>
          <div><span style="color: #065f46; font-weight: 600;">Bank A/C:</span><br/><strong>${d.employeeSnapshot.bankAccount}</strong></div>
        </div>

        <!-- Breakdown Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 0.785rem; margin-bottom: 14px; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background: #064e3b; color: #ffffff;">
              <th style="padding: 6px 8px; text-align: left; width: 35%;">EARNINGS COMPONENT</th>
              <th style="padding: 6px 8px; text-align: right; width: 15%;">AMOUNT (₹)</th>
              <th style="padding: 6px 8px; text-align: left; width: 35%;">STATUTORY WITHHOLDING</th>
              <th style="padding: 6px 8px; text-align: right; width: 15%;">AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Basic Wages (Wage Code >= 50%)</td>
              <td style="padding: 5px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${d.earnings.basic.toLocaleString('en-IN')}.00</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Provident Fund (EPF Employee 12%)</td>
              <td style="padding: 5px 8px; text-align: right; border: 1px solid #cbd5e1; color: #b91c1c;">₹${d.deductions.epfEmployee.toLocaleString('en-IN')}.00</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">House Rent Allowance (HRA)</td>
              <td style="padding: 5px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${d.earnings.hra.toLocaleString('en-IN')}.00</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Professional Tax (State PT)</td>
              <td style="padding: 5px 8px; text-align: right; border: 1px solid #cbd5e1; color: #b91c1c;">₹${d.deductions.professionalTax.toLocaleString('en-IN')}.00</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Special / Supplementary Allowance</td>
              <td style="padding: 5px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${d.earnings.specialAllowance.toLocaleString('en-IN')}.00</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">ESIC (Employee 0.75%)</td>
              <td style="padding: 5px 8px; text-align: right; border: 1px solid #cbd5e1; color: #b91c1c;">₹${d.deductions.esicEmployee.toLocaleString('en-IN')}.00</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Conveyance & Medical Reimb.</td>
              <td style="padding: 5px 8px; text-align: right; border: 1px solid #cbd5e1;">₹${(d.earnings.conveyance + d.earnings.medicalAllowance).toLocaleString('en-IN')}.00</td>
              <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">Tax Deducted at Source (TDS)</td>
              <td style="padding: 5px 8px; text-align: right; border: 1px solid #cbd5e1; color: #b91c1c;">₹${d.deductions.tds.toLocaleString('en-IN')}.00</td>
            </tr>
            <tr style="background: #f8fafc; font-weight: 700;">
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Total Gross Earnings (A)</td>
              <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1; color: #059669;">₹${d.earnings.grossPay.toLocaleString('en-IN')}.00</td>
              <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">Total Statutory Deductions (B)</td>
              <td style="padding: 6px 8px; text-align: right; border: 1px solid #cbd5e1; color: #dc2626;">₹${d.deductions.totalDeductions.toLocaleString('en-IN')}.00</td>
            </tr>
          </tbody>
        </table>

        <!-- Employer Contribution Summary (Compliance Requirement) -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 4px; font-size: 0.75rem; margin-bottom: 14px; display: flex; justify-content: space-between;">
          <div><strong style="color: #065f46;">Employer Contribution:</strong> EPF (3.67%): ₹${d.employerContributions.epfEmployer} | EPS (8.33%): ₹${d.employerContributions.epsEmployer} | Gratuity: ₹${d.employerContributions.gratuity}</div>
          <div><strong>Total Employer Cost:</strong> ₹${d.employerContributions.totalEmployerCost.toLocaleString('en-IN')}</div>
        </div>

        <!-- Net Box -->
        <div style="background: #064e3b; color: #ffffff; padding: 12px 16px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div>
            <div style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #a7f3d0;">NET STATUTORY DISBURSEMENT (A - B)</div>
            <div style="font-size: 0.8rem; margin-top: 2px;">${d.netInWords}</div>
          </div>
          <div style="font-size: 1.45rem; font-weight: 900; color: #ffffff;">
            ₹${d.netPay.toLocaleString('en-IN')}.00
          </div>
        </div>

        <div style="font-size: 0.7rem; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          ${cfg.footerNote}
        </div>
      </div>
    `;
  },

  // 4. MODERN EXECUTIVE TEMPLATE HTML
  renderModernHtml(d, cfg) {
    const primary = cfg.primaryColor || '#6366f1';
    return `
      <div class="payslip-document-wrapper" id="printable-payslip-container" style="background: #ffffff; color: #0f172a; padding: 32px; border-radius: 12px; border: 1px solid #e0e7ff; font-family: 'Inter', system-ui, sans-serif; max-width: 820px; margin: 0 auto; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.08);">
        <!-- Top Gradient Bar -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 24px; border-radius: 10px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; opacity: 0.85;">Official Salary Voucher</div>
            <h1 style="font-size: 1.35rem; font-weight: 900; margin: 2px 0 4px 0; letter-spacing: -0.3px;">${d.companySnapshot.name}</h1>
            <div style="font-size: 0.75rem; opacity: 0.9;">CIN: ${d.companySnapshot.cin} • Mumbai, India</div>
          </div>
          <div style="text-align: right; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(4px); padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2);">
            <div style="font-size: 0.95rem; font-weight: 800;">${d.periodName}</div>
            <div style="font-size: 0.7rem; opacity: 0.9;">Disbursed: ${d.payDate}</div>
          </div>
        </div>

        <!-- Employee Info Pill Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="background: #f8fafc; border: 1px solid #f1f5f9; padding: 10px 14px; border-radius: 8px; font-size: 0.8rem;">
            <div style="color: #64748b; font-size: 0.7rem;">EMPLOYEE</div>
            <strong style="color: #0f172a; font-size: 0.9rem;">${d.employeeSnapshot.fullName}</strong>
            <div style="color: #6366f1; font-weight: 600; font-size: 0.75rem;">${d.employeeSnapshot.employeeCode}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #f1f5f9; padding: 10px 14px; border-radius: 8px; font-size: 0.8rem;">
            <div style="color: #64748b; font-size: 0.7rem;">ROLE & TEAM</div>
            <strong style="color: #0f172a;">${d.employeeSnapshot.designation}</strong>
            <div style="color: #64748b; font-size: 0.75rem;">${d.employeeSnapshot.department}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #f1f5f9; padding: 10px 14px; border-radius: 8px; font-size: 0.8rem;">
            <div style="color: #64748b; font-size: 0.7rem;">BANK & PAN</div>
            <strong style="color: #0f172a;">${d.employeeSnapshot.bankAccount}</strong>
            <div style="color: #64748b; font-size: 0.75rem;">PAN: ${d.employeeSnapshot.pan}</div>
          </div>
        </div>

        <!-- Earnings and Deductions Modern Split -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
          <!-- Left: Earnings -->
          <div style="background: #fbfbfe; border: 1px solid #e0e7ff; border-radius: 10px; padding: 16px;">
            <div style="font-weight: 800; font-size: 0.85rem; color: #4338ca; margin-bottom: 12px; display: flex; justify-content: space-between; border-bottom: 1px solid #e0e7ff; padding-bottom: 8px;">
              <span>EARNINGS</span>
              <span style="color: #4f46e5;">₹${d.earnings.grossPay.toLocaleString('en-IN')}</span>
            </div>
            <div style="font-size: 0.825rem; line-height: 2.1;">
              <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Basic Salary (50%)</span><strong style="color: #0f172a;">₹${d.earnings.basic.toLocaleString('en-IN')}</strong></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">House Rent Allowance</span><strong style="color: #0f172a;">₹${d.earnings.hra.toLocaleString('en-IN')}</strong></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Special Allowance</span><strong style="color: #0f172a;">₹${d.earnings.specialAllowance.toLocaleString('en-IN')}</strong></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Conveyance & Medical</span><strong style="color: #0f172a;">₹${(d.earnings.conveyance + d.earnings.medicalAllowance).toLocaleString('en-IN')}</strong></div>
            </div>
          </div>

          <!-- Right: Deductions -->
          <div style="background: #fffafa; border: 1px solid #fee2e2; border-radius: 10px; padding: 16px;">
            <div style="font-weight: 800; font-size: 0.85rem; color: #991b1b; margin-bottom: 12px; display: flex; justify-content: space-between; border-bottom: 1px solid #fee2e2; padding-bottom: 8px;">
              <span>DEDUCTIONS</span>
              <span style="color: #dc2626;">-₹${d.deductions.totalDeductions.toLocaleString('en-IN')}</span>
            </div>
            <div style="font-size: 0.825rem; line-height: 2.1;">
              <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Provident Fund (EPF)</span><strong style="color: #dc2626;">-₹${d.deductions.epfEmployee.toLocaleString('en-IN')}</strong></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Professional Tax (PT)</span><strong style="color: #dc2626;">-₹${d.deductions.professionalTax.toLocaleString('en-IN')}</strong></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Employee State Ins. (ESIC)</span><strong style="color: #dc2626;">-₹${d.deductions.esicEmployee.toLocaleString('en-IN')}</strong></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">Tax Withholding (TDS)</span><strong style="color: #dc2626;">-₹${d.deductions.tds.toLocaleString('en-IN')}</strong></div>
            </div>
          </div>
        </div>

        <!-- Modern Net Callout Banner -->
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: #ffffff; border-radius: 10px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <div style="font-size: 0.725rem; text-transform: uppercase; font-weight: 700; color: #a5b4fc; letter-spacing: 0.5px;">NET TAKE-HOME SALARY</div>
            <div style="font-size: 0.85rem; margin-top: 2px;">${d.netInWords}</div>
          </div>
          <div style="font-size: 1.7rem; font-weight: 900; color: #818cf8;">
            ₹${d.netPay.toLocaleString('en-IN')}.00
          </div>
        </div>

        <!-- Footer with Verification Seal -->
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.725rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 14px;">
          <div>
            <strong>Diallo Cloud Security:</strong> Digitally encrypted & certified. ${cfg.footerNote}
          </div>
          <div style="background: #f5f3ff; color: #7c3aed; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem;">
            VERIFIED PAYSLIP ✓
          </div>
        </div>
      </div>
    `;
  },

  // 5. MINIMALIST SWISS TEMPLATE HTML
  renderMinimalHtml(d, cfg) {
    return `
      <div class="payslip-document-wrapper" id="printable-payslip-container" style="background: #ffffff; color: #0f172a; padding: 36px; font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 820px; margin: 0 auto; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 24px;">
          <h1 style="font-size: 1.25rem; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1px;">${d.companySnapshot.name}</h1>
          <span style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase;">Payslip / ${d.periodName}</span>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 24px; line-height: 1.6;">
          <div>
            <strong>${d.employeeSnapshot.fullName}</strong> (${d.employeeSnapshot.employeeCode})<br/>
            ${d.employeeSnapshot.designation} — ${d.employeeSnapshot.department}
          </div>
          <div style="text-align: right;">
            PAN: ${d.employeeSnapshot.pan} | Bank: ${d.employeeSnapshot.bankAccount}<br/>
            Disbursed: ${d.payDate}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 0.825rem; margin-bottom: 24px;">
          <thead>
            <tr style="border-bottom: 1px solid #0f172a; text-transform: uppercase; font-size: 0.75rem;">
              <th style="padding: 6px 0; text-align: left;">Earnings</th>
              <th style="padding: 6px 0; text-align: right;">Amount (₹)</th>
              <th style="padding: 6px 0; text-align: left; padding-left: 24px;">Deductions</th>
              <th style="padding: 6px 0; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody style="line-height: 1.8;">
            <tr>
              <td>Basic Wages</td><td style="text-align: right;">${d.earnings.basic.toLocaleString('en-IN')}</td>
              <td style="padding-left: 24px;">Provident Fund</td><td style="text-align: right;">${d.deductions.epfEmployee.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>House Rent Allowance</td><td style="text-align: right;">${d.earnings.hra.toLocaleString('en-IN')}</td>
              <td style="padding-left: 24px;">Professional Tax</td><td style="text-align: right;">${d.deductions.professionalTax.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Special Allowance</td><td style="text-align: right;">${d.earnings.specialAllowance.toLocaleString('en-IN')}</td>
              <td style="padding-left: 24px;">ESIC</td><td style="text-align: right;">${d.deductions.esicEmployee.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Allowances</td><td style="text-align: right;">${(d.earnings.conveyance + d.earnings.medicalAllowance).toLocaleString('en-IN')}</td>
              <td style="padding-left: 24px;">Tax (TDS)</td><td style="text-align: right;">${d.deductions.tds.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 1px solid #0f172a; font-weight: 700;">
              <td style="padding-top: 8px;">Gross Earnings</td><td style="text-align: right; padding-top: 8px;">₹${d.earnings.grossPay.toLocaleString('en-IN')}</td>
              <td style="padding-left: 24px; padding-top: 8px;">Total Deductions</td><td style="text-align: right; padding-top: 8px;">₹${d.deductions.totalDeductions.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div style="border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; padding: 14px 0; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Net Payout</div>
            <div style="font-size: 0.8rem; color: #475569;">${d.netInWords}</div>
          </div>
          <div style="font-size: 1.6rem; font-weight: 900;">
            ₹${d.netPay.toLocaleString('en-IN')}.00
          </div>
        </div>

        <div style="font-size: 0.7rem; color: #94a3b8;">
          ${cfg.footerNote}
        </div>
      </div>
    `;
  }
};

window.payslipTemplateService = payslipTemplateService;
