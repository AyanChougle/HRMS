/**
 * DIALLO HRMS — ASSET MANAGEMENT & HARDWARE LIFECYCLE VIEW (PHASE 10)
 * Manages Company Hardware Inventory, Custodian Checkouts, Returns, Maintenance, and Exit Clearances
 */

const AssetsView = {
  activeTab: 'register', // 'register', 'assignments', 'maintenance', 'returns', 'vendors'
  currentFilters: {
    status: 'All',
    categoryCode: 'All',
    search: ''
  },

  async render() {
    const [assets, categories, vendors] = await Promise.all([
      assetService.getAssets({}),
      assetService.getCategories(),
      assetService.getVendors()
    ]);

    const availableAssets = assets.filter(a => a.status === 'AVAILABLE');
    const assignedAssets = assets.filter(a => a.status === 'ASSIGNED');
    const maintenanceAssets = assets.filter(a => a.status === 'MAINTENANCE');
    const damagedAssets = assets.filter(a => a.status === 'DAMAGED');

    const totalValue = assets.reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0);

    return `
      <div class="page-header animate-fade-in">
        <div class="breadcrumb">
          <a href="#dashboard">Dashboard</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">Asset Management</span>
        </div>
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Company Asset Lifecycle & Inventory</h1>
            <p class="page-subtitle">Track hardware procurement, employee custodian assignments, return audits, and maintenance</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="AssetsView.exportAssetsCSV()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export Inventory
            </button>
            <button class="btn btn-primary btn-sm" onclick="AssetsView.openAddAssetModal()">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              + Register New Asset
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="card" style="padding: 16px; border-left: 4px solid var(--primary);">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Total Asset Value</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin: 4px 0;">₹${totalValue.toLocaleString('en-IN')}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${assets.length} Total Registered Assets</div>
        </div>

        <div class="card" style="padding: 16px; border-left: 4px solid #10b981;">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">In Stock (Available)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #10b981; margin: 4px 0;">${availableAssets.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Ready for Immediate Issue</div>
        </div>

        <div class="card" style="padding: 16px; border-left: 4px solid #3b82f6;">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Assigned (Custodians)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #3b82f6; margin: 4px 0;">${assignedAssets.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Active with Staff</div>
        </div>

        <div class="card" style="padding: 16px; border-left: 4px solid var(--accent-leave);">
          <div class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Maintenance & Repairs</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-leave); margin: 4px 0;">${maintenanceAssets.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${damagedAssets.length} Damaged Items</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-nav" style="margin-bottom: 20px;">
        <button class="tab-btn ${this.activeTab === 'register' ? 'active' : ''}" onclick="AssetsView.switchTab('register')">
          Asset Register (${assets.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'assignments' ? 'active' : ''}" onclick="AssetsView.switchTab('assignments')">
          Active Assignments (${assignedAssets.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'maintenance' ? 'active' : ''}" onclick="AssetsView.switchTab('maintenance')">
          Maintenance & Damage (${maintenanceAssets.length})
        </button>
        <button class="tab-btn ${this.activeTab === 'returns' ? 'active' : ''}" onclick="AssetsView.switchTab('returns')">
          Returns & Clearances
        </button>
        <button class="tab-btn ${this.activeTab === 'vendors' ? 'active' : ''}" onclick="AssetsView.switchTab('vendors')">
          Vendors & Suppliers (${vendors.length})
        </button>
      </div>

      <!-- Tab Body -->
      <div class="tab-content">
        ${this.renderActiveTab(assets, assignedAssets, maintenanceAssets, categories, vendors)}
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    Router.mountView('assets');
  },

  renderActiveTab(assets, assignedAssets, maintenanceAssets, categories, vendors) {
    if (this.activeTab === 'assignments') {
      return this.renderAssignmentsTab(assignedAssets);
    } else if (this.activeTab === 'maintenance') {
      return this.renderMaintenanceTab(maintenanceAssets);
    } else if (this.activeTab === 'returns') {
      return this.renderReturnsTab();
    } else if (this.activeTab === 'vendors') {
      return this.renderVendorsTab(vendors);
    }
    return this.renderRegisterTab(assets, categories);
  },

  // TAB 1: ASSET REGISTER
  renderRegisterTab(assets, categories) {
    let list = assets;
    if (this.currentFilters.status !== 'All') {
      list = list.filter(a => a.status === this.currentFilters.status);
    }
    if (this.currentFilters.categoryCode !== 'All') {
      list = list.filter(a => a.categoryCode === this.currentFilters.categoryCode);
    }
    if (this.currentFilters.search) {
      const s = this.currentFilters.search.toLowerCase();
      list = list.filter(a =>
        (a.name && a.name.toLowerCase().includes(s)) ||
        (a.assetTag && a.assetTag.toLowerCase().includes(s)) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(s)) ||
        (a.currentEmployeeName && a.currentEmployeeName.toLowerCase().includes(s))
      );
    }

    return `
      <!-- Search & Filters -->
      <div class="card" style="margin-bottom: 20px; padding: 16px;">
        <div class="flex items-center gap-3" style="flex-wrap: wrap;">
          <div style="flex: 1; min-width: 220px;">
            <input type="text" id="filter-asset-search" class="form-control" placeholder="Search by Asset Tag, Name, Serial, Custodian..." value="${this.currentFilters.search}" onkeydown="if(event.key==='Enter') AssetsView.applyFilters()" />
          </div>
          <select id="filter-asset-status" class="form-control" style="width: 170px;">
            <option value="All">All Statuses</option>
            <option value="AVAILABLE" ${this.currentFilters.status === 'AVAILABLE' ? 'selected' : ''}>Available (In Stock)</option>
            <option value="ASSIGNED" ${this.currentFilters.status === 'ASSIGNED' ? 'selected' : ''}>Assigned to Staff</option>
            <option value="MAINTENANCE" ${this.currentFilters.status === 'MAINTENANCE' ? 'selected' : ''}>In Maintenance</option>
            <option value="DAMAGED" ${this.currentFilters.status === 'DAMAGED' ? 'selected' : ''}>Damaged</option>
          </select>
          <select id="filter-asset-cat" class="form-control" style="width: 180px;">
            <option value="All">All Categories</option>
            ${categories.map(c => `<option value="${c.code}" ${this.currentFilters.categoryCode === c.code ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" onclick="AssetsView.applyFilters()">Filter</button>
          <button class="btn btn-secondary btn-sm" onclick="AssetsView.clearFilters()">Clear</button>
        </div>
      </div>

      <!-- Assets Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Inventory Master Census (${list.length})</div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${list.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-title">No Assets Found</div>
              <div class="empty-state-desc">No asset records match your filter criteria.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Device / Item Name</th>
                  <th>Category</th>
                  <th>Serial Number</th>
                  <th>Value (INR)</th>
                  <th>Custodian / Location</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(a => `
                  <tr>
                    <td><strong style="font-family: monospace; color: var(--primary);">${a.assetTag}</strong></td>
                    <td>
                      <div class="font-semibold text-main">${a.name}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${a.brand || ''} ${a.model || ''}</div>
                    </td>
                    <td><span class="badge badge-neutral">${a.categoryName}</span></td>
                    <td><code style="font-size: 0.75rem;">${a.serialNumber || 'N/A'}</code></td>
                    <td><strong>₹${(a.purchasePrice || 0).toLocaleString('en-IN')}</strong></td>
                    <td>
                      ${a.status === 'ASSIGNED' ? `
                        <div class="font-semibold text-main" style="color: var(--primary);">${a.currentEmployeeName}</div>
                      ` : `<span class="text-muted">${a.location || 'In Stock'}</span>`}
                    </td>
                    <td><span class="badge ${a.condition === 'EXCELLENT' ? 'badge-success' : 'badge-neutral'}">${a.condition}</span></td>
                    <td>
                      <span class="badge ${a.status === 'AVAILABLE' ? 'badge-success' : (a.status === 'ASSIGNED' ? 'badge-primary' : 'badge-warning')}">
                        ${a.status}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center gap-1">
                        ${a.status === 'AVAILABLE' ? `
                          <button class="btn btn-primary btn-sm" onclick="AssetsView.openAssignModal('${a.id}', '${a.assetTag}', '${a.name}')">Assign</button>
                        ` : (a.status === 'ASSIGNED' ? `
                          <button class="btn btn-soft btn-sm" onclick="AssetsView.openReturnModal('${a.id}', '${a.assetTag}', '${a.name}', '${a.currentEmployeeName}')">Return</button>
                        ` : '')}
                        <button class="btn btn-secondary btn-sm" onclick="AssetsView.openMaintenanceModal('${a.id}', '${a.assetTag}', '${a.name}')">Service</button>
                        <button class="btn btn-danger btn-sm" onclick="AssetsView.confirmDeleteAsset('${a.id}', '${a.assetTag}')">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  // TAB 2: ACTIVE ASSIGNMENTS
  renderAssignmentsTab(assignedAssets) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Active Custodian Deployments (${assignedAssets.length})</div>
            <div class="card-subtitle">Equipment currently in possession of active workforce staff</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${assignedAssets.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-title">No Active Assignments</div>
              <div class="empty-state-desc">All registered company assets are currently stored in inventory.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Item Details</th>
                  <th>Custodian Employee</th>
                  <th>Serial Number</th>
                  <th>Branch Location</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${assignedAssets.map(a => `
                  <tr>
                    <td><strong style="font-family: monospace; color: var(--primary);">${a.assetTag}</strong></td>
                    <td>
                      <div class="font-semibold text-main">${a.name}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">${a.categoryName}</div>
                    </td>
                    <td>
                      <div class="font-semibold text-main" style="color: var(--primary);">${a.currentEmployeeName}</div>
                      <div class="text-muted" style="font-size: 0.75rem;">Assigned Custodian</div>
                    </td>
                    <td><code style="font-size: 0.8rem;">${a.serialNumber}</code></td>
                    <td>${a.branchName || 'HQ - Mumbai'}</td>
                    <td>
                      <button class="btn btn-primary btn-sm" onclick="AssetsView.openReturnModal('${a.id}', '${a.assetTag}', '${a.name}', '${a.currentEmployeeName}')">
                        📥 Check-in & Return
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  // TAB 3: MAINTENANCE & DAMAGE
  renderMaintenanceTab(maintenanceAssets) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Active Service & Repair Tickets (${maintenanceAssets.length})</div>
            <div class="card-subtitle">Devices under OEM diagnostics, hardware repair, or warranty overhaul</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${maintenanceAssets.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 48px 16px;">
              <div class="empty-state-title">No Active Maintenance Tickets</div>
              <div class="empty-state-desc">All hardware assets are in operational working condition.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th>Current Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${maintenanceAssets.map(a => `
                  <tr>
                    <td><strong style="font-family: monospace; color: var(--accent-leave);">${a.assetTag}</strong></td>
                    <td><div class="font-semibold text-main">${a.name}</div></td>
                    <td>${a.categoryName}</td>
                    <td><span class="badge badge-warning">${a.condition}</span></td>
                    <td><span class="badge badge-warning">IN_MAINTENANCE</span></td>
                    <td>
                      <button class="btn btn-primary btn-sm" onclick="AssetsView.openCompleteMaintenanceModal('${a.id}', '${a.assetTag}')">
                        ✓ Complete Service
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  // TAB 4: ASSET RETURNS & AUDITS
  async renderReturnsTab() {
    let returns = [];
    try {
      const snap = await db.collection('assetReturns').orderBy('createdAt', 'desc').limit(20).get();
      returns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Could not fetch returns:', e);
    }

    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Recent Asset Check-in Audits (${returns.length})</div>
            <div class="card-subtitle">Inspection condition ratings and clearance verifications</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          ${returns.length === 0 ? `
            <div class="empty-state" style="border: none; padding: 32px 16px;">
              <div class="empty-state-title">No Return Audits Recorded</div>
              <div class="empty-state-desc">Completed check-ins and inspection logs will appear here.</div>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Returned By</th>
                  <th>Received By</th>
                  <th>Return Date</th>
                  <th>Inspected Condition</th>
                  <th>Inspection Notes</th>
                </tr>
              </thead>
              <tbody>
                ${returns.map(r => `
                  <tr>
                    <td><strong style="font-family: monospace;">${r.assetTag}</strong></td>
                    <td><div class="font-semibold text-main">${r.returnedBy}</div></td>
                    <td>${r.receivedBy}</td>
                    <td>${r.returnDate}</td>
                    <td><span class="badge ${r.condition === 'EXCELLENT' ? 'badge-success' : 'badge-neutral'}">${r.condition}</span></td>
                    <td><span class="text-muted" style="font-size: 0.85rem;">${r.notes || 'Clean check-in'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  },

  // TAB 5: VENDORS
  renderVendorsTab(vendors) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Authorized Hardware Vendors & Service Partners (${vendors.length})</div>
            <div class="card-subtitle">Procurement suppliers, OEM authorized service providers, and facility vendors</div>
          </div>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Vendor Entity</th>
                <th>Category</th>
                <th>Contact Person</th>
                <th>Email Address</th>
                <th>Support Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${vendors.map(v => `
                <tr>
                  <td><div class="font-semibold text-main">${v.name}</div></td>
                  <td><span class="badge badge-neutral">${v.category || 'General'}</span></td>
                  <td>${v.contactPerson || 'Account Manager'}</td>
                  <td><a href="mailto:${v.email}" class="text-primary">${v.email}</a></td>
                  <td>${v.phone || '-'}</td>
                  <td><span class="badge badge-success">ACTIVE</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // MODAL 1: ADD / REGISTER ASSET
  async openAddAssetModal() {
    const categories = await assetService.getCategories();
    const vendors = await assetService.getVendors();
    const todayStr = new Date().toISOString().slice(0, 10);

    ModalManager.openModal({
      id: 'add-asset-modal',
      title: 'Register New Asset',
      subtitle: 'Add company hardware or equipment into central inventory',
      contentHtml: `
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Asset Name</label>
            <input type="text" id="ast-name" class="form-control" placeholder="e.g. MacBook Pro 16 M3" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Category</label>
            <select id="ast-category" class="form-control">
              ${categories.map(c => `<option value="${c.code}">${c.icon || '📦'} ${c.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Brand / Manufacturer</label>
            <input type="text" id="ast-brand" class="form-control" placeholder="e.g. Apple / Dell / Lenovo" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label">Model Name / Number</label>
            <input type="text" id="ast-model" class="form-control" placeholder="e.g. Latitude 7440" />
          </div>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Serial Number</label>
            <input type="text" id="ast-serial" class="form-control" placeholder="e.g. SN-88992211" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label">Asset Tag (Leave blank to auto-generate)</label>
            <input type="text" id="ast-tag" class="form-control" placeholder="e.g. DL-LAP-0025" />
          </div>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Purchase Price (INR ₹)</label>
            <input type="number" id="ast-price" class="form-control" value="85000" min="0" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Purchase Date</label>
            <input type="date" id="ast-date" class="form-control" value="${todayStr}" required />
          </div>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label">Supplier / Vendor</label>
            <select id="ast-vendor" class="form-control">
              ${vendors.map(v => `<option value="${v.name}">${v.name}</option>`).join('')}
            </select>
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Initial Condition</label>
            <select id="ast-condition" class="form-control">
              <option value="NEW">Brand New</option>
              <option value="EXCELLENT" selected>Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
            </select>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AssetsView.saveNewAsset()">Register Asset</button>
      `
    });
  },

  async saveNewAsset() {
    const name = document.getElementById('ast-name')?.value.trim();
    const categoryCode = document.getElementById('ast-category')?.value;
    const brand = document.getElementById('ast-brand')?.value.trim();
    const model = document.getElementById('ast-model')?.value.trim();
    const serialNumber = document.getElementById('ast-serial')?.value.trim();
    const assetTag = document.getElementById('ast-tag')?.value.trim();
    const purchasePrice = Number(document.getElementById('ast-price')?.value);
    const purchaseDate = document.getElementById('ast-date')?.value;
    const vendor = document.getElementById('ast-vendor')?.value;
    const condition = document.getElementById('ast-condition')?.value;

    if (!name || !brand || !serialNumber) {
      Toast.warning('Please complete all mandatory fields.');
      return;
    }

    try {
      await assetService.createAsset({
        name,
        categoryCode,
        brand,
        model,
        serialNumber,
        assetTag,
        purchasePrice,
        purchaseDate,
        vendor,
        condition
      });

      Toast.success(`Asset '${name}' registered successfully!`);
      ModalManager.closeModal();
      Router.mountView('assets');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  // MODAL 2: ASSIGN ASSET TO EMPLOYEE
  async openAssignModal(assetId, assetTag, assetName) {
    const employees = await employeeService.getEmployees({});

    ModalManager.openModal({
      id: 'assign-asset-modal',
      title: `Assign Custodian: ${assetTag}`,
      subtitle: assetName,
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Select Employee Custodian</label>
          <select id="assign-emp-select" class="form-control" required>
            ${employees.map(e => `
              <option value="${e.id}" data-name="${e.fullName || e.name}" data-code="${e.employeeCode || ''}">
                ${e.fullName || e.name} (${e.employeeCode || 'EMP'}) • ${e.department || 'General'}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Expected Return Date</label>
            <input type="date" id="assign-return-date" class="form-control" value="2027-12-31" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label required">Condition at Issue</label>
            <select id="assign-condition" class="form-control">
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD" selected>Good</option>
              <option value="FAIR">Fair</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Assignment Notes</label>
          <textarea id="assign-notes" class="form-control" rows="2" placeholder="Issued for daily developer/manager responsibilities..."></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AssetsView.confirmAssign('${assetId}')">Confirm Assignment</button>
      `
    });
  },

  async confirmAssign(assetId) {
    const empSelect = document.getElementById('assign-emp-select');
    const employeeId = empSelect?.value;
    const employeeName = empSelect?.selectedOptions[0]?.getAttribute('data-name');
    const employeeCode = empSelect?.selectedOptions[0]?.getAttribute('data-code');
    const expectedReturnDate = document.getElementById('assign-return-date')?.value;
    const condition = document.getElementById('assign-condition')?.value;
    const notes = document.getElementById('assign-notes')?.value.trim();

    if (!employeeId) return;

    try {
      await assetService.assignAsset(assetId, {
        employeeId,
        employeeName,
        employeeCode,
        expectedReturnDate,
        condition,
        notes
      });

      Toast.success(`Asset successfully assigned to ${employeeName}!`);
      ModalManager.closeModal();
      Router.mountView('assets');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  // MODAL 3: RETURN ASSET
  openReturnModal(assetId, assetTag, assetName, empName) {
    ModalManager.openModal({
      id: 'return-asset-modal',
      title: `Check-in & Return: ${assetTag}`,
      subtitle: `Currently held by ${empName}`,
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Inspected Condition on Return</label>
          <select id="return-condition" class="form-control">
            <option value="EXCELLENT">Excellent (No defects)</option>
            <option value="GOOD" selected>Good (Minor wear)</option>
            <option value="FAIR">Fair (Visible signs of use)</option>
            <option value="DAMAGED">Damaged (Requires Repair)</option>
            <option value="UNUSABLE">Unusable / Write-off</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Inspection & Check-in Notes</label>
          <textarea id="return-notes" class="form-control" rows="2" placeholder="e.g. Power adapter and original cable received in good working order."></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AssetsView.confirmReturn('${assetId}')">Confirm Return to Inventory</button>
      `
    });
  },

  async confirmReturn(assetId) {
    const condition = document.getElementById('return-condition')?.value;
    const notes = document.getElementById('return-notes')?.value.trim();

    try {
      await assetService.returnAsset(assetId, { condition, notes });
      Toast.success('Asset returned to company inventory!');
      ModalManager.closeModal();
      Router.mountView('assets');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  // MODAL 4: MAINTENANCE TICKET
  openMaintenanceModal(assetId, assetTag, assetName) {
    ModalManager.openModal({
      id: 'service-asset-modal',
      title: `Log Service / Repair: ${assetTag}`,
      subtitle: assetName,
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Issue Description</label>
          <input type="text" id="maint-issue" class="form-control" placeholder="e.g. Battery replacement & thermal repasting" required />
        </div>
        <div class="form-row">
          <div class="col-6 form-group">
            <label class="form-label required">Service Vendor</label>
            <input type="text" id="maint-vendor" class="form-control" value="Dell Authorized Service" required />
          </div>
          <div class="col-6 form-group">
            <label class="form-label">Estimated Cost (INR ₹)</label>
            <input type="number" id="maint-cost" class="form-control" value="4500" />
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AssetsView.confirmMaintenance('${assetId}', '${assetTag}', '${assetName}')">Send to Service</button>
      `
    });
  },

  async confirmMaintenance(assetId, assetTag, assetName) {
    const issue = document.getElementById('maint-issue')?.value.trim();
    const vendor = document.getElementById('maint-vendor')?.value.trim();
    const cost = Number(document.getElementById('maint-cost')?.value);

    if (!issue) return;

    try {
      await assetService.createMaintenanceRecord({ assetId, assetTag, assetName, issue, vendor, cost });
      Toast.success('Service ticket created and asset moved to Maintenance!');
      ModalManager.closeModal();
      Router.mountView('assets');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  openCompleteMaintenanceModal(assetId, assetTag) {
    ModalManager.openModal({
      id: 'complete-maint-modal',
      title: `Complete Service: ${assetTag}`,
      subtitle: 'Mark maintenance ticket as resolved and return asset to Available status',
      contentHtml: `
        <div class="form-group">
          <label class="form-label required">Resolution Summary</label>
          <textarea id="comp-maint-notes" class="form-control" rows="3" placeholder="e.g. Battery replaced under warranty. Clean diagnostics passed."></textarea>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" data-modal-close>Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="AssetsView.confirmCompleteMaintenance('${assetId}')">Restore to Available</button>
      `
    });
  },

  async confirmCompleteMaintenance(assetId) {
    const notes = document.getElementById('comp-maint-notes')?.value.trim();
    try {
      await db.collection('assets').doc(assetId).update({
        status: 'AVAILABLE',
        condition: 'GOOD',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      Toast.success('Asset service completed and restored to inventory!');
      ModalManager.closeModal();
      Router.mountView('assets');
    } catch (e) {
      Toast.error(e.message);
    }
  },

  confirmDeleteAsset(assetId, assetTag) {
    ModalManager.confirm({
      title: 'Delete Asset Record',
      message: `Are you sure you want to permanently delete asset ${assetTag}?`,
      confirmText: 'Delete Asset',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await assetService.deleteAsset(assetId);
          Toast.success(`Asset ${assetTag} deleted.`);
          Router.mountView('assets');
        } catch (e) {
          Toast.error(e.message);
        }
      }
    });
  },

  applyFilters() {
    this.currentFilters.search = document.getElementById('filter-asset-search')?.value.trim() || '';
    this.currentFilters.status = document.getElementById('filter-asset-status')?.value || 'All';
    this.currentFilters.categoryCode = document.getElementById('filter-asset-cat')?.value || 'All';
    Router.mountView('assets');
  },

  clearFilters() {
    this.currentFilters = { status: 'All', categoryCode: 'All', search: '' };
    Router.mountView('assets');
  },

  async exportAssetsCSV() {
    const assets = await assetService.getAssets({});
    let csv = 'AssetTag,Name,Category,Brand,Model,SerialNumber,Price,Status,Condition,Custodian\n';
    assets.forEach(a => {
      csv += `"${a.assetTag}","${a.name}","${a.categoryName}","${a.brand || ''}","${a.model || ''}","${a.serialNumber}","${a.purchasePrice}","${a.status}","${a.condition}","${a.currentEmployeeName || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diallo_Asset_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    Toast.success('Exported asset inventory to CSV.');
  }
};

window.AssetsView = AssetsView;
