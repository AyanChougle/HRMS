/**
 * DIALLO HRMS — HR LETTERS & OFFICIAL ISSUANCE SERVICE (PHASE 16)
 * Generates and archives Offer, Appointment, Confirmation, Promotion,
 * Transfer, Relieving, Experience, and Warning Letters with Dynamic Variable Interpolation.
 */

const letterService = {
  DEFAULT_COMPANY_ID: 'comp_diallo_india',

  // 1. LETTER TEMPLATES MASTER
  async getLetterTemplates(companyId = this.DEFAULT_COMPANY_ID) {
    try {
      const snap = await db.collection('letterTemplates')
        .where('companyId', '==', companyId)
        .get();
      
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (list.length === 0) {
        const defaults = [
          {
            name: 'Employment Confirmation Letter',
            type: 'CONFIRMATION',
            subject: 'Confirmation of Employment Services',
            content: `Dear {{employeeName}},\n\nConsequent to the successful completion of your probation evaluation period at {{companyName}}, we take great pleasure in confirming your services as {{designation}} in the {{department}} Department, effective {{effectiveDate}}.\n\nAll terms and conditions of your employment contract remain unchanged. We look forward to your valuable continued contributions to our organizational milestones.\n\nYours sincerely,\nAuthorized HR Signatory\n{{companyName}}`,
            version: 'v1.0',
            status: 'ACTIVE',
            companyId
          },
          {
            name: 'Promotion & Title Progression Letter',
            type: 'PROMOTION',
            subject: 'Promotion to {{designation}}',
            content: `Dear {{employeeName}},\n\nIn recognition of your exceptional performance, demonstrated leadership, and professional contributions, the Management is pleased to promote you to the position of {{designation}} effective {{effectiveDate}}.\n\nYour revised compensation structure and expanded responsibilities reflect this progression. We congratulate you on this well-earned advancement.\n\nWarm regards,\nHuman Resources Directorate\n{{companyName}}`,
            version: 'v1.0',
            status: 'ACTIVE',
            companyId
          },
          {
            name: 'Departmental / Branch Transfer Letter',
            type: 'TRANSFER',
            subject: 'Notice of Internal Transfer',
            content: `Dear {{employeeName}},\n\nIn line with organizational operational requirements and career progression objectives, you are hereby transferred to the {{department}} Department, reporting to {{managerName}}, effective {{effectiveDate}}.\n\nYour designation as {{designation}} and core employment entitlements remain preserved.\n\nBest regards,\nOperations & Talent HR\n{{companyName}}`,
            version: 'v1.0',
            status: 'ACTIVE',
            companyId
          },
          {
            name: 'Experience & Service Certificate',
            type: 'EXPERIENCE',
            subject: 'Certificate of Employment and Experience',
            content: `TO WHOMSOEVER IT MAY CONCERN\n\nThis is to certify that {{employeeName}} (Employee ID: {{employeeCode}}) was employed with {{companyName}} from {{joiningDate}} to {{effectiveDate}} as {{designation}} in the {{department}} Department.\n\nDuring their tenure with our organization, we found them to be diligent, sincere, and proactive in their professional commitments. We wish them all success in their future endeavors.\n\nAuthorized Signatory\n{{companyName}}`,
            version: 'v1.0',
            status: 'ACTIVE',
            companyId
          },
          {
            name: 'Formal Performance Advisory / Warning Notice',
            type: 'WARNING',
            subject: 'Formal HR Advisory Notice — Performance / Policy',
            content: `Dear {{employeeName}},\n\nThis communication serves as a formal advisory regarding your recent compliance / attendance record in the {{department}} Department. You are advised to align your daily working standards with the company code of conduct.\n\nPlease treat this notice with high priority.\n\nHR Department\n{{companyName}}`,
            version: 'v1.0',
            status: 'ACTIVE',
            companyId
          }
        ];

        for (const t of defaults) {
          const docRef = await db.collection('letterTemplates').add({
            ...t,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          list.push({ id: docRef.id, ...t });
        }
      }
      return list;
    } catch (e) {
      console.error('Error fetching letter templates:', e);
      return [];
    }
  },

  // 2. LETTER GENERATION ENGINE
  async generateEmployeeLetter(templateId, employee, customVars = {}) {
    try {
      const templateDoc = await db.collection('letterTemplates').doc(templateId).get();
      if (!templateDoc.exists) throw new Error('Letter template not found.');
      const template = templateDoc.data();

      const company = await organizationService.getCompany(employee.companyId || this.DEFAULT_COMPANY_ID);

      const vars = {
        employeeName: employee.fullName || employee.name || 'Staff Member',
        employeeId: employee.employeeCode || employee.id,
        employeeCode: employee.employeeCode || employee.id,
        designation: employee.designation || 'Specialist',
        department: employee.department || 'General',
        joiningDate: employee.joiningDate || '01 Jan 2026',
        companyName: company?.name || 'Diallo India Private Limited',
        managerName: employee.managerName || 'Reporting Officer',
        effectiveDate: customVars.effectiveDate || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        ...customVars
      };

      // Variable interpolation
      let compiledContent = template.content;
      let compiledSubject = template.subject || template.name;

      Object.entries(vars).forEach(([key, val]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        compiledContent = compiledContent.replace(regex, val);
        compiledSubject = compiledSubject.replace(regex, val);
      });

      const payload = {
        templateId,
        templateName: template.name,
        letterType: template.type || 'GENERAL',
        employeeId: employee.id,
        employeeName: vars.employeeName,
        employeeCode: vars.employeeCode,
        department: vars.department,
        designation: vars.designation,
        subject: compiledSubject,
        content: compiledContent,
        issuedBy: AuthGuard.userProfile?.displayName || 'Human Resources Directorate',
        companyId: employee.companyId || this.DEFAULT_COMPANY_ID,
        status: 'ISSUED',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('employeeLetters').add(payload);
      if (typeof auditService !== 'undefined') {
        await auditService.log('HR_LETTER_GENERATED', 'HR_LETTERS', 'employeeLetters', docRef.id, {
          employeeId: employee.id,
          letterType: template.type
        });
      }
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error('Error generating employee letter:', e);
      throw e;
    }
  },

  async getEmployeeLetters(companyId = this.DEFAULT_COMPANY_ID, employeeId = null) {
    try {
      let query = db.collection('employeeLetters').where('companyId', '==', companyId);
      if (employeeId) {
        query = query.where('employeeId', '==', employeeId);
      }
      const snap = await query.orderBy('createdAt', 'desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Error fetching employee letters:', e);
      return [];
    }
  }
};

window.letterService = letterService;
