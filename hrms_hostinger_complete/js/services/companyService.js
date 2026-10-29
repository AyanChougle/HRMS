/**
 * DIALLO HRMS — COMPANY & BRANCH SERVICE
 * Manages organization entities and branches on Hostinger MySQL
 */

const companyService = {
  DEFAULT_COMPANIES: [
    {
      id: 'comp_diallo_india',
      name: 'Diallo India Private Limited',
      code: 'DIALLO',
      status: 'ACTIVE',
      currency: 'INR',
      timezone: 'Asia/Kolkata'
    }
  ],

  DEFAULT_BRANCHES: [
    {
      id: 'branch_ghansoli',
      companyId: 'comp_diallo_india',
      name: 'Ghansoli - Navi Mumbai',
      code: 'GHN',
      status: 'ACTIVE',
      isHeadquarters: true
    },
    {
      id: 'branch_mumbai',
      companyId: 'comp_diallo_india',
      name: 'HQ - Mumbai',
      code: 'MUM',
      status: 'ACTIVE',
      isHeadquarters: false
    }
  ],

  // Get all registered companies
  async getCompanies() {
    return this.DEFAULT_COMPANIES;
  },

  // Get specific company
  async getCompany(companyId) {
    return this.DEFAULT_COMPANIES.find(c => c.id === companyId) || this.DEFAULT_COMPANIES[0];
  },

  // Create new legal entity
  async createCompany(companyData) {
    const newComp = {
      id: 'comp_' + Date.now().toString(36),
      ...companyData,
      status: companyData.status || 'ACTIVE'
    };
    this.DEFAULT_COMPANIES.push(newComp);
    return newComp;
  },

  // Update legal entity
  async updateCompany(companyId, updateData) {
    const idx = this.DEFAULT_COMPANIES.findIndex(c => c.id === companyId);
    if (idx !== -1) {
      Object.assign(this.DEFAULT_COMPANIES[idx], updateData);
    }
    return true;
  },

  async deleteCompany(companyId) {
    return true;
  },

  // Branches
  async getBranches(companyId = null) {
    return this.DEFAULT_BRANCHES;
  },

  async createBranch(branchData) {
    const newBranch = {
      id: 'branch_' + Date.now().toString(36),
      companyId: branchData.companyId || 'comp_diallo_india',
      ...branchData,
      status: branchData.status || 'ACTIVE'
    };
    this.DEFAULT_BRANCHES.push(newBranch);
    return newBranch;
  }
};

window.companyService = companyService;
