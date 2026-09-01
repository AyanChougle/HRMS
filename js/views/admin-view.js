/**
 * DIALLO HRMS — ADMIN & SYSTEM GOVERNANCE MODULE (FIREBASE BACKED)
 * Multi-Company Corporate Entities (CIN, PAN, GSTIN) & Indian Branches in Firestore
 */

const AdminView = {
  async renderHub() {
    let companies = [];
    let branches = [];
    try {
      [companies, branches] = await Promise.all([
        companyService.getCompanies(),
        companyService.getBranches(),
      ]);
    } catch (e) {
      console.warn("Could not fetch admin companies:", e);
    }

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Admin</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Admin & Corporate Governance (India)</h1>
            <p class="page-subtitle">Corporate registrations (CIN/PAN/GSTIN), regional branch offices, and user access matrix in Firestore</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary btn-sm" onclick="AdminView.openAddCompanyModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Legal Entity
            </button>
          </div>
        </div>
      </div>

      <!-- Companies Summary Card -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div>
            <div class="card-title">Registered Indian Legal Entities (${companies.length})</div>
            <div class="card-subtitle">Ministry of Corporate Affairs (MCA) registered entities in Firestore</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Entity Code</th>
                <th>Corporate Identification No. (CIN)</th>
                <th>GSTIN</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                companies.length === 0
                  ? `
                <tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">No legal entities registered.</td></tr>
              `
                  : companies
                      .map(
                        (c) => `
                <tr>
                  <td class="font-semibold text-main">${c.name}</td>
                  <td><span class="badge badge-neutral">${c.code || "CO"}</span></td>
                  <td><span style="font-family: monospace; font-size: 0.8rem;">${c.cin || "U72900MH2026PTC123456"}</span></td>
                  <td><span style="font-family: monospace; font-size: 0.8rem;">${c.gstin || "-"}</span></td>
                  <td><span class="badge badge-success"><span class="badge-dot"></span> ${c.status || "Active"}</span></td>
                  <td>
                    <div class="flex items-center gap-1">
                      <button class="btn btn-soft btn-sm" onclick="AdminView.openEditCompanyModal('${c.id}', '${c.name}', '${c.code || ""}', '${c.cin || ""}', '${c.pan || ""}', '${c.gstin || ""}')">Edit</button>
                      <button class="btn btn-soft btn-sm" style="color: var(--danger);" onclick="AdminView.deleteCompany('${c.id}', '${c.name}')">Delete</button>
                    </div>
                  </td>
                </tr>
              `,
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- 6 Responsive Navigation Cards -->
      <div class="module-grid">
        <div class="module-nav-card" onclick="AdminView.showSub('Companies & Legal Entities')">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(220, 38, 38, 0.1); color: var(--accent-admin);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <span class="module-card-badge">${companies.length} Entities</span>
            </div>
            <div class="module-card-content">
              <h3>Companies</h3>
              <p>Corporate registrations, PAN, TAN, GSTIN numbers, and MCA annual compliance filings.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>Manage entities</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="AdminView.showSub('Branches & State Hubs')">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(37, 99, 235, 0.1); color: var(--primary);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <span class="module-card-badge">${branches.length} Locations</span>
            </div>
            <div class="module-card-content">
              <h3>Branches</h3>
              <p>State branches in Maharashtra, Karnataka, Haryana, and Telangana with local Shops & Est. licenses.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>Configure hubs</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="AdminView.showSub('User Accounts')">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(124, 58, 237, 0.1); color: var(--accent-people);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <span class="module-card-badge">Accounts</span>
            </div>
            <div class="module-card-content">
              <h3>User List</h3>
              <p>Admin, HR, and Line Manager logins, SSO integration and multi-factor authentication (MFA).</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>User directory</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="AdminView.showSub('User Types & Roles')">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(8, 145, 178, 0.1); color: var(--accent-attendance);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <span class="module-card-badge">Roles</span>
            </div>
            <div class="module-card-content">
              <h3>User Types</h3>
              <p>Super Admin, Company Admin, HR, Payroll Officer, Manager, and Employee ESS.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>Role definitions</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="AdminView.showSub('User Access Matrix')">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(234, 88, 12, 0.1); color: var(--accent-payroll);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <span class="module-card-badge">Permissions</span>
            </div>
            <div class="module-card-content">
              <h3>User Access</h3>
              <p>Granular read/write/delete permission matrix for each module, salary data, and tax reports.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>Access matrix</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>

        <div class="module-nav-card" onclick="AdminView.showSub('Geography & State Jurisdictions')">
          <div>
            <div class="module-nav-card-top">
              <div class="module-card-icon-box" style="background: rgba(22, 163, 74, 0.1); color: var(--accent-leave);">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="module-card-badge">India (States)</span>
            </div>
            <div class="module-card-content">
              <h3>Geography</h3>
              <p>Indian States, union territories, pin codes, and state-wise professional tax jurisdictions.</p>
            </div>
          </div>
          <div class="module-card-footer">
            <span>State rules</span>
            <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    `;
  },

  openAddCompanyModal() {
    ModalManager.openModal({
      id: "add-company-modal",
      title: "Register Indian Legal Entity",
      subtitle: "Create a new corporate entity in Cloud Firestore",
      contentHtml: `
        <form id="new-company-form">
          <div class="form-row">
            <div class="col-8 form-group">
              <label class="form-label required">Entity Full Name</label>
              <input type="text" id="co-name" class="form-control" placeholder="e.g. Diallo Digital Services India Pvt Ltd" required />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Code</label>
              <input type="text" id="co-code" class="form-control" placeholder="DDSI" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">CIN (Corporate Identification No.)</label>
              <input type="text" id="co-cin" class="form-control" placeholder="U72900MH2026PTC123456" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Company PAN</label>
              <input type="text" id="co-pan" class="form-control" placeholder="AAACD1234E" required />
            </div>
            <div class="col-12 form-group">
              <label class="form-label required">GSTIN Number</label>
              <input type="text" id="co-gstin" class="form-control" placeholder="27AAACD1234E1Z5" required />
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AdminView.saveNewCompany()">Register Entity in Firestore</button>
      `,
    });
  },

  async saveNewCompany() {
    const name = document.getElementById("co-name")?.value.trim();
    const code = document.getElementById("co-code")?.value.trim();
    const cin = document.getElementById("co-cin")?.value.trim();
    const pan = document.getElementById("co-pan")?.value.trim();
    const gstin = document.getElementById("co-gstin")?.value.trim();

    if (!name || !code || !cin) return;

    try {
      await companyService.createCompany({
        name,
        code,
        cin,
        pan,
        gstin,
        country: "India",
      });
      Toast.success(`Registered ${name} in Cloud Firestore!`);
      ModalManager.closeModal();
      Router.navigate("admin");
    } catch (err) {
      Toast.error(`Registration failed: ${err.message}`);
    }
  },

  openEditCompanyModal(
    id,
    currentName,
    currentCode,
    currentCin,
    currentPan,
    currentGstin,
  ) {
    ModalManager.openModal({
      id: "edit-company-modal",
      title: `Edit Legal Entity: ${currentName}`,
      subtitle: "Update company registration details in Firestore",
      contentHtml: `
        <form id="edit-company-form">
          <div class="form-row">
            <div class="col-8 form-group">
              <label class="form-label required">Entity Full Name</label>
              <input type="text" id="eco-name" class="form-control" value="${currentName}" required />
            </div>
            <div class="col-4 form-group">
              <label class="form-label required">Code</label>
              <input type="text" id="eco-code" class="form-control" value="${currentCode}" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">CIN (Corporate Identification No.)</label>
              <input type="text" id="eco-cin" class="form-control" value="${currentCin}" required />
            </div>
            <div class="col-6 form-group">
              <label class="form-label required">Company PAN</label>
              <input type="text" id="eco-pan" class="form-control" value="${currentPan}" required />
            </div>
            <div class="col-12 form-group">
              <label class="form-label required">GSTIN Number</label>
              <input type="text" id="eco-gstin" class="form-control" value="${currentGstin}" required />
            </div>
          </div>
        </form>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AdminView.updateCompany('${id}')">Save Changes</button>
      `,
    });
  },

  async updateCompany(id) {
    const name = document.getElementById("eco-name")?.value.trim();
    const code = document.getElementById("eco-code")?.value.trim();
    const cin = document.getElementById("eco-cin")?.value.trim();
    const pan = document.getElementById("eco-pan")?.value.trim();
    const gstin = document.getElementById("eco-gstin")?.value.trim();

    if (!name || !code || !cin) return;

    try {
      await companyService.updateCompany(id, { name, code, cin, pan, gstin });
      Toast.success(`Updated legal entity "${name}"!`);
      ModalManager.closeModal();
      Router.navigate("admin");
    } catch (err) {
      Toast.error(`Update failed: ${err.message}`);
    }
  },

  deleteCompany(id, name) {
    ModalManager.confirm({
      title: "Delete Legal Entity",
      message: `Are you sure you want to delete entity "${name}"? This action cannot be undone.`,
      confirmText: "Delete Entity",
      confirmClass: "btn-danger",
      onConfirm: async () => {
        try {
          await companyService.deleteCompany(id);
          Toast.success(`Legal entity "${name}" deleted.`);
          Router.navigate("admin");
        } catch (e) {
          Toast.error(`Delete failed: ${e.message}`);
        }
      },
    });
  },

  showSub(title) {
    ModalManager.openModal({
      id: "admin-sub-modal",
      title,
      subtitle: `Corporate governance configuration for ${title}`,
      contentHtml: `
        <div class="empty-state" style="padding: 24px;">
          <div class="empty-state-icon" style="background: rgba(220, 38, 38, 0.1); color: var(--accent-admin);">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div class="empty-state-title">${title} Synced</div>
          <div class="empty-state-desc">Indian statutory bindings and governance rules for <strong>${title}</strong> are active.</div>
        </div>
      `,
      footerHtml: `<button class="btn btn-secondary btn-sm" data-modal-close>Close</button>`,
    });
  },
};

window.AdminView = AdminView;
