/**
 * DIALLO HRMS — PAYSLIP TEMPLATES GALLERY & DESIGNER VIEW
 * Interactive template selection, real-time preview, template customization, duplication, and default activation.
 */

const PayslipTemplatesView = {
  currentFilter: 'ALL',

  async render() {
    const templates = await payslipTemplateService.getTemplates();
    const activeTemplate = templates.find(t => t.isDefault) || templates[0];

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#payroll">Payroll</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Payslip Templates</span>
        </div>
        <div class="page-title-row">
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="btn btn-secondary btn-sm" onclick="Router.navigate('payroll')" style="padding: 6px 10px;">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              <span>Back</span>
            </button>
            <div>
              <h1 class="page-title" style="margin: 0;">Payslip Templates</h1>
              <p class="page-subtitle" style="margin: 2px 0 0 0;">Pick a ready-made design or duplicate one to customise. The default template is used for every payslip, payslip PDF and the employee portal.</p>
            </div>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="PayslipTemplatesView.openNewDesignModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>+ New design</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Blue Enterprise Notice Banner -->
      <div style="background: rgba(37, 99, 235, 0.06); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; font-size: 0.825rem; color: #1e40af; line-height: 1.5;">
        <strong>Template Distribution Notice:</strong> The default template is used everywhere a payslip appears — the on-screen slip, browser print, PDF download and the employee portal. The <strong>Classic</strong> template is identical to your standard statutory payslip. Custom designs render pixel-perfect in browser print & PDF preview.
      </div>

      <!-- Templates Gallery Grid -->
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 32px;">
        ${templates.map(t => this.renderTemplateCard(t)).join('')}
      </div>
    `;
  },

  renderTemplateCard(t) {
    const isClassic = t.id === 'classic';
    const isCanvas = t.id === 'canvas';
    const isCompliance = t.id === 'compliance';
    const isModern = t.id === 'modern';

    return `
      <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; border: ${t.isDefault ? '2px solid var(--primary)' : '1px solid var(--border-light)'}; box-shadow: ${t.isDefault ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'var(--shadow-sm)'}; transition: transform 0.2s, box-shadow 0.2s;">
        <!-- Card Top Bar -->
        <div style="padding: 14px 16px 10px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="font-size: 1rem; color: var(--text-main);">${t.name}</strong>
            ${t.isDefault ? '<span class="badge badge-primary" style="font-size: 0.65rem; padding: 2px 6px;">✓ Default</span>' : ''}
          </div>
          <span class="badge badge-neutral" style="font-size: 0.7rem;">${t.category || 'Preset'}</span>
        </div>

        <!-- Realistic Visual Mini Preview -->
        <div style="padding: 16px; background: var(--bg-hover); display: flex; justify-content: center; align-items: center;">
          <div style="width: 100%; max-width: 260px; height: 170px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); padding: 8px; font-size: 5.5px; line-height: 1.3; overflow: hidden; color: #1e293b; user-select: none;">
            
            ${isClassic ? `
              <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 3px; margin-bottom: 4px;">
                <div style="font-weight: 800; font-size: 7px; text-transform: uppercase;">DIALLO INDIA PVT LTD</div>
                <div style="font-size: 4.5px; color: #64748b;">CIN: U72900MH2026PTC123456 • Mumbai</div>
                <span style="display: inline-block; background: #0f172a; color: #fff; font-size: 4.5px; font-weight: 700; padding: 1px 4px; border-radius: 2px; margin-top: 2px;">SALARY PAYSLIP</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: #f8fafc; padding: 2px; border: 0.5px solid #cbd5e1; margin-bottom: 4px;">
                <div><strong>Emp Name:</strong> Rahul Sharma</div>
                <div><strong>Emp Code:</strong> EMP-1042</div>
                <div><strong>Designation:</strong> Tech Lead</div>
                <div><strong>Days:</strong> 26 Worked</div>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 5px; margin-bottom: 4px;">
                <tr style="background: #e2e8f0; font-weight: 700;">
                  <td style="border: 0.5px solid #cbd5e1; padding: 1px;">EARNINGS</td><td style="border: 0.5px solid #cbd5e1; text-align: right; padding: 1px;">AMT</td>
                  <td style="border: 0.5px solid #cbd5e1; padding: 1px;">DEDUCT</td><td style="border: 0.5px solid #cbd5e1; text-align: right; padding: 1px;">AMT</td>
                </tr>
                <tr><td style="border: 0.5px solid #cbd5e1; padding: 1px;">Basic</td><td style="border: 0.5px solid #cbd5e1; text-align: right; padding: 1px;">32,500</td><td style="border: 0.5px solid #cbd5e1; padding: 1px;">EPF</td><td style="border: 0.5px solid #cbd5e1; text-align: right; padding: 1px;">1,800</td></tr>
                <tr><td style="border: 0.5px solid #cbd5e1; padding: 1px;">HRA</td><td style="border: 0.5px solid #cbd5e1; text-align: right; padding: 1px;">16,250</td><td style="border: 0.5px solid #cbd5e1; padding: 1px;">PT</td><td style="border: 0.5px solid #cbd5e1; text-align: right; padding: 1px;">200</td></tr>
              </table>
              <div style="background: #f1f5f9; padding: 2px 4px; border: 0.5px solid #94a3b8; display: flex; justify-content: space-between; font-weight: 800;">
                <span>NET PAY:</span><span>₹61,223.00</span>
              </div>
            ` : ''}

            ${isCanvas ? `
              <div style="background: #0284c7; color: #fff; padding: 4px 6px; margin: -8px -8px 6px -8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 800; font-size: 6.5px;">DIALLO INDIA</div>
                  <div style="font-size: 4px; opacity: 0.85;">Payslip • August 2026</div>
                </div>
                <span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 8px; font-size: 4.5px;">PAID</span>
              </div>
              <div style="background: #f8fafc; padding: 3px; border-radius: 3px; margin-bottom: 4px; font-size: 5px;">
                <strong>Rahul S. Sharma</strong> (EMP-1042) • Product Engineering
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 4px;">
                <div style="border: 0.5px solid #bae6fd; border-radius: 2px; padding: 2px;">
                  <div style="color: #0369a1; font-weight: 700; border-bottom: 0.5px solid #e0f2fe;">EARNINGS</div>
                  <div>Gross: ₹65,000</div>
                </div>
                <div style="border: 0.5px solid #fecaca; border-radius: 2px; padding: 2px;">
                  <div style="color: #991b1b; font-weight: 700; border-bottom: 0.5px solid #fee2e2;">DEDUCT</div>
                  <div>Total: ₹3,777</div>
                </div>
              </div>
              <div style="background: #0284c7; color: #fff; padding: 3px 6px; border-radius: 3px; display: flex; justify-content: space-between; font-weight: 800;">
                <span>NET TAKE-HOME</span><span>₹61,223.00</span>
              </div>
            ` : ''}

            ${isCompliance ? `
              <div style="border-top: 2px solid #059669; padding-top: 2px; margin-bottom: 4px; display: flex; justify-content: space-between;">
                <div>
                  <span style="background: #059669; color: #fff; font-size: 4px; padding: 0 2px;">STATUTORY FORM-16</span>
                  <div style="font-weight: 800; font-size: 6px; color: #064e3b;">DIALLO INDIA PVT LTD</div>
                </div>
                <div style="font-weight: 700; color: #059669;">AUG 2026</div>
              </div>
              <div style="background: #ecfdf5; border: 0.5px solid #a7f3d0; padding: 2px; font-size: 4.5px; margin-bottom: 4px;">
                UAN: 100987654321 | PAN: ABCDE1234F | PF No: MH/BAN/12345
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 4.8px; margin-bottom: 3px;">
                <tr style="background: #064e3b; color: #fff;">
                  <td>COMPONENT</td><td style="text-align: right;">AMT</td><td>STATUTORY</td><td style="text-align: right;">AMT</td>
                </tr>
                <tr><td>Basic</td><td style="text-align: right;">32,500</td><td>EPF (12%)</td><td style="text-align: right;">1,800</td></tr>
                <tr><td>HRA</td><td style="text-align: right;">16,250</td><td>ESIC</td><td style="text-align: right;">0</td></tr>
              </table>
              <div style="background: #064e3b; color: #fff; padding: 2px 4px; display: flex; justify-content: space-between; font-weight: 800;">
                <span>NET STATUTORY:</span><span>₹61,223.00</span>
              </div>
            ` : ''}

            ${isModern ? `
              <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; padding: 5px; margin: -8px -8px 6px -8px; border-radius: 4px 4px 0 0; display: flex; justify-content: space-between;">
                <div>
                  <div style="font-weight: 900; font-size: 6.5px;">DIALLO INDIA</div>
                  <div style="font-size: 4px; opacity: 0.85;">Salary Voucher • August 2026</div>
                </div>
                <div style="font-size: 4px; background: rgba(255,255,255,0.2); padding: 1px 3px; border-radius: 2px;">QR SEAL ✓</div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin-bottom: 4px; font-size: 4.8px;">
                <div style="background: #f8fafc; padding: 2px; border-radius: 2px;"><strong>Emp:</strong> Rahul Sharma</div>
                <div style="background: #f8fafc; padding: 2px; border-radius: 2px;"><strong>Role:</strong> Tech Lead</div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin-bottom: 4px;">
                <div style="background: #fbfbfe; border: 0.5px solid #e0e7ff; padding: 2px; color: #4338ca; font-weight: 700;">EARN: ₹65,000</div>
                <div style="background: #fffafa; border: 0.5px solid #fee2e2; padding: 2px; color: #dc2626; font-weight: 700;">DEDUCT: ₹3,777</div>
              </div>
              <div style="background: #1e1b4b; color: #818cf8; padding: 3px 5px; border-radius: 2px; display: flex; justify-content: space-between; font-weight: 900;">
                <span>NET TAKE-HOME</span><span>₹61,223.00</span>
              </div>
            ` : ''}

            ${!isClassic && !isCanvas && !isCompliance && !isModern ? `
              <div style="border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; margin-bottom: 4px; display: flex; justify-content: space-between; font-weight: 800;">
                <span>DIALLO INDIA</span><span>AUG 2026</span>
              </div>
              <div style="font-size: 4.8px; margin-bottom: 4px;">
                Rahul Sharma (EMP-1042) • PAN: ABCDE1234F
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 4.8px; margin-bottom: 4px;">
                <tr style="border-bottom: 0.5px solid #0f172a;"><td>EARNINGS</td><td style="text-align: right;">65,000</td><td>DEDUCT</td><td style="text-align: right;">3,777</td></tr>
              </table>
              <div style="border-top: 1px solid #0f172a; border-bottom: 1px solid #0f172a; padding: 2px 0; display: flex; justify-content: space-between; font-weight: 900;">
                <span>NET PAYOUT</span><span>₹61,223.00</span>
              </div>
            ` : ''}

          </div>
        </div>

        <!-- Card Footer Actions -->
        <div style="padding: 12px 16px; border-top: 1px solid var(--border-light); background: var(--bg-hover); display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" style="flex: 1; padding: 5px 8px; font-size: 0.8rem;" onclick="PayslipTemplatesView.previewTemplate('${t.id}')">
              Preview
            </button>
            ${!t.isDefault ? `
              <button class="btn btn-primary btn-sm" style="flex: 1.2; padding: 5px 8px; font-size: 0.8rem;" onclick="PayslipTemplatesView.useTemplate('${t.id}')">
                Use this
              </button>
            ` : ''}
            <button class="btn btn-soft btn-sm" style="flex: 1; padding: 5px 8px; font-size: 0.8rem;" onclick="PayslipTemplatesView.customizeTemplate('${t.id}')">
              Customize
            </button>
          </div>
          <div style="display: flex; justify-content: center;">
            <button class="btn btn-link btn-sm" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none; padding: 2px 6px;" onclick="PayslipTemplatesView.duplicateTemplate('${t.id}')">
              Duplicate
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // 1. PREVIEW TEMPLATE IN INTERACTIVE MODAL
  previewTemplate(templateId) {
    const sampleData = payslipTemplateService.getSampleRecord();
    const html = payslipTemplateService.renderPayslipHtml(sampleData, templateId);

    ModalManager.openModal({
      id: 'payslip-template-preview-modal',
      title: 'Payslip Template Preview',
      subtitle: 'Rendered with live company & compensation structure data',
      size: 'lg',
      contentHtml: `
        <div style="max-height: 75vh; overflow-y: auto; padding: 12px 4px;">
          ${html}
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Close</button>
        <button class="btn btn-soft btn-sm" onclick="PayslipTemplatesView.useTemplate('${templateId}'); ModalManager.closeModal();">
          Set as Company Default
        </button>
        <button class="btn btn-primary btn-sm" onclick="PayslipTemplatesView.printPreview()">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          Print / PDF
        </button>
      `
    });
  },

  printPreview() {
    const printContent = document.getElementById('printable-payslip-container')?.outerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Diallo HRMS — Payslip Preview</title>
          <style>
            body { margin: 20px; font-family: system-ui, -apple-system, sans-serif; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  },

  // 2. SET ACTIVE COMPANY DEFAULT TEMPLATE
  async useTemplate(templateId) {
    await payslipTemplateService.setActiveTemplate(templateId);
    Toast.success('Payslip template updated! Set as company-wide default.');
    Router.mountView('payslip-templates');
  },

  // 3. DUPLICATE TEMPLATE
  async duplicateTemplate(templateId) {
    const copy = await payslipTemplateService.duplicateTemplate(templateId);
    Toast.success(`Template duplicated as "${copy.name}"`);
    Router.mountView('payslip-templates');
  },

  // 4. CUSTOMIZE TEMPLATE MODAL
  async customizeTemplate(templateId) {
    const templates = await payslipTemplateService.getTemplates();
    const t = templates.find(item => item.id === templateId) || templates[0];

    ModalManager.openModal({
      id: 'customize-template-modal',
      title: `Customize: ${t.name}`,
      subtitle: 'Fine-tune brand colors, layout options, and disclaimer text',
      size: 'md',
      contentHtml: `
        <form id="template-customizer-form" onsubmit="event.preventDefault();">
          <div class="form-group">
            <label class="form-label required">Template Display Name</label>
            <input type="text" id="cust-tpl-name" class="form-control" value="${t.name}" required />
          </div>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label">Brand Primary Color</label>
              <div class="flex items-center gap-2">
                <input type="color" id="cust-tpl-color" value="${t.primaryColor || '#2563eb'}" style="width: 44px; height: 38px; border: 1px solid var(--border-main); border-radius: 6px; cursor: pointer;" />
                <input type="text" id="cust-tpl-color-hex" class="form-control" value="${t.primaryColor || '#2563eb'}" />
              </div>
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Layout Architecture</label>
              <select id="cust-tpl-header" class="form-control">
                <option value="standard" ${t.headerStyle === 'standard' ? 'selected' : ''}>Boxed Standard</option>
                <option value="banner" ${t.headerStyle === 'banner' ? 'selected' : ''}>Sky Blue Banner</option>
                <option value="statutory" ${t.headerStyle === 'statutory' ? 'selected' : ''}>Statutory Form-16</option>
                <option value="gradient" ${t.headerStyle === 'gradient' ? 'selected' : ''}>Modern Gradient Bar</option>
                <option value="minimal" ${t.headerStyle === 'minimal' ? 'selected' : ''}>Minimalist Hairline</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Component Displays</label>
            <div class="flex flex-col gap-2" style="background: var(--bg-hover); padding: 12px; border-radius: 6px;">
              <label class="flex items-center gap-2" style="font-size: 0.85rem;">
                <input type="checkbox" id="cust-tpl-qr" ${t.showQrCode ? 'checked' : ''} />
                Include Digital QR Verification Stamp
              </label>
              <label class="flex items-center gap-2" style="font-size: 0.85rem;">
                <input type="checkbox" id="cust-tpl-match" ${t.showEmployerContributions ? 'checked' : ''} />
                Display Employer Statutory Matching Table (EPF/EPS/Gratuity)
              </label>
              <label class="flex items-center gap-2" style="font-size: 0.85rem;">
                <input type="checkbox" id="cust-tpl-bank" ${t.showBankDetails !== false ? 'checked' : ''} />
                Show Employee Bank Account & IFSC Details
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Footer Disclaimer / Compliance Note</label>
            <textarea id="cust-tpl-note" class="form-control" rows="2">${t.footerNote || ''}</textarea>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PayslipTemplatesView.saveCustomization('${t.id}')">Save Template</button>
      `
    });

    document.getElementById('cust-tpl-color')?.addEventListener('input', (e) => {
      const hex = document.getElementById('cust-tpl-color-hex');
      if (hex) hex.value = e.target.value;
    });
  },

  async saveCustomization(templateId) {
    const name = document.getElementById('cust-tpl-name')?.value.trim() || 'Custom Template';
    const primaryColor = document.getElementById('cust-tpl-color-hex')?.value || '#2563eb';
    const headerStyle = document.getElementById('cust-tpl-header')?.value || 'standard';
    const showQrCode = document.getElementById('cust-tpl-qr')?.checked || false;
    const showEmployerContributions = document.getElementById('cust-tpl-match')?.checked || false;
    const showBankDetails = document.getElementById('cust-tpl-bank')?.checked !== false;
    const footerNote = document.getElementById('cust-tpl-note')?.value.trim() || '';

    const payload = {
      id: templateId,
      name,
      primaryColor,
      headerStyle,
      showQrCode,
      showEmployerContributions,
      showBankDetails,
      footerNote,
      category: 'Custom'
    };

    await payslipTemplateService.saveTemplate(payload);
    Toast.success(`Template "${name}" saved successfully!`);
    ModalManager.closeModal();
    Router.mountView('payslip-templates');
  },

  // 5. NEW DESIGN MODAL
  openNewDesignModal() {
    ModalManager.openModal({
      id: 'new-template-modal',
      title: 'Create Custom Payslip Design',
      subtitle: 'Build a customized company payslip layout',
      size: 'md',
      contentHtml: `
        <form id="new-template-form" onsubmit="event.preventDefault();">
          <div class="form-group">
            <label class="form-label required">Design Name</label>
            <input type="text" id="new-tpl-name" class="form-control" placeholder="e.g. Executive Leadership Slip" required />
          </div>

          <div class="form-row">
            <div class="col-6 form-group">
              <label class="form-label">Brand Color</label>
              <input type="color" id="new-tpl-color" value="#4f46e5" style="width: 100%; height: 38px; border: 1px solid var(--border-main); border-radius: 6px; cursor: pointer;" />
            </div>
            <div class="col-6 form-group">
              <label class="form-label">Base Layout Preset</label>
              <select id="new-tpl-base" class="form-control">
                <option value="canvas">Canvas Standard</option>
                <option value="compliance">Statutory Compliance</option>
                <option value="modern">Modern Executive</option>
                <option value="classic">Classic Boxed</option>
                <option value="minimal">Minimalist Swiss</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Footer Disclaimer</label>
            <textarea id="new-tpl-note" class="form-control" rows="2" placeholder="Custom confidentiality or payroll disclaimer..."></textarea>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PayslipTemplatesView.createDesign()">Create Design</button>
      `
    });
  },

  async createDesign() {
    const name = document.getElementById('new-tpl-name')?.value.trim();
    if (!name) {
      Toast.warning('Please enter a design name');
      return;
    }

    const primaryColor = document.getElementById('new-tpl-color')?.value || '#4f46e5';
    const base = document.getElementById('new-tpl-base')?.value || 'canvas';
    const footerNote = document.getElementById('new-tpl-note')?.value.trim() || 'Confidential document issued by Diallo HRMS.';

    const payload = {
      name,
      primaryColor,
      headerStyle: base,
      showQrCode: true,
      showEmployerContributions: base === 'compliance',
      showBankDetails: true,
      footerNote,
      category: 'Custom'
    };

    await payslipTemplateService.saveTemplate(payload);
    Toast.success(`Design "${name}" created!`);
    ModalManager.closeModal();
    Router.mountView('payslip-templates');
  }
};

window.PayslipTemplatesView = PayslipTemplatesView;
