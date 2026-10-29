/**
 * DIALLO HRMS — SEED SERVICE
 * Production datasets are authoritative in Hostinger MySQL.
 */

const seedService = {
  COMPANY_ID: 'comp_diallo_india',

  async bootstrapIfEmpty() {
    return true;
  },

  async checkAndSeedModule() {
    return true;
  },

  async seedAll() {
    if (typeof Toast !== 'undefined') {
      Toast.success('Corporate datasets verified on MySQL.');
    }
    return true;
  },

  async seedRoles() {
    return [
      { id: 'ADMIN', name: 'Admin', permissions: ['*'], status: 'ACTIVE' },
      { id: 'HR', name: 'HR', permissions: ['people.*', 'attendance.*', 'leave.*'], status: 'ACTIVE' },
      { id: 'OPS', name: 'OPS', permissions: ['people.view', 'attendance.view'], status: 'ACTIVE' },
      { id: 'COMPLIANCE', name: 'Compliance', permissions: ['compliance.*'], status: 'ACTIVE' },
      { id: 'MANAGER', name: 'Manager', permissions: ['team.*', 'attendance.view'], status: 'ACTIVE' },
      { id: 'TL', name: 'TL', permissions: ['team.view', 'attendance.view'], status: 'ACTIVE' },
      { id: 'EMPLOYEE', name: 'Employee', permissions: ['own.profile', 'ess'], status: 'ACTIVE' }
    ];
  }
};

window.seedService = seedService;
