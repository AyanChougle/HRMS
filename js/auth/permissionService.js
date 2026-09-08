/**
 * DIALLO HRMS — CENTRALIZED PERMISSION SERVICE (PHASE 3)
 * Dynamic wildcard-aware permission resolution and role mappings
 */

const PermissionService = {
  // Built-in Role to Permission Mappings
  ROLE_PERMISSIONS: {
    SUPER_ADMIN: ['*'],
    
    COMPANY_ADMIN: [
      '*',
      'people.*',
      'attendance.*',
      'leave.*',
      'payroll.*',
      'documents.*',
      'reports.*',
      'communication.*',
      'approvals.*',
      'companies.manage',
      'branches.manage',
      'departments.manage',
      'users.manage',
      'settings.manage',
      'audit.view'
    ],

    HR: [
      'people.*',
      'people.view',
      'people.create',
      'people.edit',
      'people.deactivate',
      'attendance.*',
      'attendance.view',
      'attendance.create',
      'attendance.edit',
      'attendance.approve',
      'leave.*',
      'leave.view',
      'leave.create',
      'leave.edit',
      'leave.approve',
      'documents.*',
      'documents.view',
      'documents.upload',
      'reports.*',
      'reports.view',
      'reports.export',
      'communication.*',
      'approvals.*',
      'approvals.process',
      'companies.view',
      'settings.manage',
      'recruitment.*',
      'performance.*',
      'expenses.*',
      'assets.*'
    ],

    PAYROLL: [
      'payroll.*',
      'payroll.view',
      'payroll.manage',
      'payroll.process',
      'reports.*',
      'reports.view',
      'reports.export',
      'people.view',
      'expenses.view',
      'own.profile',
      'own.payslips',
      'attendance.view',
      'leave.view',
      'communication.view'
    ],

    MANAGER: [
      'team.*',
      'team.view',
      'team.attendance',
      'team.leave',
      'team.approve',
      'people.view',
      'attendance.team',
      'attendance.view',
      'leave.view',
      'leave.approve',
      'approvals.*',
      'approvals.process',
      'performance.view',
      'requests.view',
      'workflows.view',
      'communication.view',
      'reports.view',
      'own.profile',
      'own.attendance',
      'own.leave',
      'own.payslips',
      'own.documents',
      'own.requests',
      'own.expenses',
      'ess.view'
    ],

    EMPLOYEE: [
      'own.profile',
      'own.attendance',
      'own.leave',
      'own.payslips',
      'own.documents',
      'own.requests',
      'attendance.punch',
      'attendance.view',
      'leave.view',
      'leave.create',
      'payroll.view',
      'communication.view',
      'reports.view',
      'ess.view',
      'assets.view',
      'performance.view',
      'documents.view',
      'requests.view'
    ]
  },

  // Get active permissions set for a user profile
  getUserPermissions(userProfile, roleDoc = null) {
    const roleId = userProfile?.roleId || 'EMPLOYEE';
    
    if (roleId === 'SUPER_ADMIN') {
      return new Set(['*']);
    }

    // Always start with built-in default permissions for the role
    const defaultPerms = this.ROLE_PERMISSIONS[roleId] || this.ROLE_PERMISSIONS.EMPLOYEE || [];
    const permsSet = new Set(defaultPerms);

    // Merge in any custom permissions from roleDoc if present
    if (roleDoc && Array.isArray(roleDoc.permissions)) {
      roleDoc.permissions.forEach(p => permsSet.add(p));
    }

    return permsSet;
  },

  // Mapping: own.* permissions grant read-only access to the corresponding module view
  OWN_TO_MODULE_MAP: {
    'own.attendance': ['attendance.view', 'attendance.punch'],
    'own.leave': ['leave.view', 'leave.create'],
    'own.payslips': ['payroll.view'],
    'own.documents': ['documents.view'],
    'own.expenses': ['expenses.view'],
    'own.requests': ['requests.view'],
    'own.profile': ['ess.view', 'own.profile', 'people.view.self']
  },

  // Evaluate if user has a specific permission key
  hasPermission(permissionName, userPermissions, userRole = 'EMPLOYEE') {
    if (!permissionName) return true;
    if (userRole === 'SUPER_ADMIN') return true;

    // Direct match or Global Superadmin Wildcard
    if (userPermissions && userPermissions instanceof Set) {
      if (userPermissions.has('*') || userPermissions.has(permissionName)) {
        return true;
      }

      // Category Wildcard check (e.g. 'people.*' grants 'people.view', 'people.create')
      const parts = permissionName.split('.');
      if (parts.length === 2) {
        const wildcard = `${parts[0]}.*`;
        if (userPermissions.has(wildcard)) {
          return true;
        }
      }

      // Own-to-Module mapping
      for (const [ownPerm, grantedPerms] of Object.entries(this.OWN_TO_MODULE_MAP)) {
        if (userPermissions.has(ownPerm) && grantedPerms.includes(permissionName)) {
          return true;
        }
      }
    }

    // Role-based baseline guarantees
    if (userRole === 'EMPLOYEE') {
      const employeeAllowedPerms = [
        'attendance.view', 'attendance.punch', 'leave.view', 'leave.create',
        'payroll.view', 'communication.view', 'reports.view', 'own.profile',
        'ess.view', 'assets.view', 'performance.view',
        'documents.view', 'requests.view'
      ];
      if (employeeAllowedPerms.includes(permissionName)) {
        return true;
      }
    }

    if (userRole === 'MANAGER') {
      const managerAllowedPerms = [
        'attendance.view', 'attendance.punch', 'leave.view', 'leave.create', 'leave.approve',
        'payroll.view', 'communication.view', 'reports.view', 'own.profile',
        'ess.view', 'expenses.view', 'assets.view', 'performance.view',
        'documents.view', 'requests.view', 'team.view', 'people.view', 'workflows.view',
        'approvals.process'
      ];
      if (managerAllowedPerms.includes(permissionName)) {
        return true;
      }
    }

    return false;
  }
};

window.PermissionService = PermissionService;
