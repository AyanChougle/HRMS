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

    ADMIN: ['*'],

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
      'payroll.*',
      'payroll.view',
      'payroll.manage',
      'payroll.process',
      'payroll.export',
      'payroll.templates',
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
      'assets.*',
      'compliance.*',
      'workflows.*',
      'own.profile',
      'own.payslips',
      'own.attendance',
      'own.leave'
    ],

    HR_MANAGER: [
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
      'payroll.*',
      'payroll.view',
      'payroll.manage',
      'payroll.process',
      'payroll.export',
      'payroll.templates',
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
      'assets.*',
      'compliance.*',
      'workflows.*',
      'own.profile',
      'own.payslips',
      'own.attendance',
      'own.leave'
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
      'people.view',
      'team.*',
      'team.view',
      'team.attendance',
      'team.leave',
      'team.approve',
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
      'own.documents',
      'own.requests',
      'own.expenses',
      'ess.view'
    ],

    OPERATIONS_MANAGER: [
      'people.view',
      'team.*',
      'team.view',
      'team.attendance',
      'team.leave',
      'team.approve',
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
      'own.documents',
      'own.requests',
      'own.expenses',
      'ess.view'
    ],

    TEAM_LEAD: [
      'people.view',
      'team.view',
      'team.attendance',
      'team.leave',
      'attendance.team',
      'attendance.view',
      'leave.view',
      'performance.view',
      'requests.view',
      'workflows.view',
      'communication.view',
      'reports.view',
      'own.profile',
      'own.attendance',
      'own.leave',
      'own.documents',
      'own.requests',
      'ess.view'
    ],

    MENTOR_TRAINER: [
      'training.*',
      'training.view',
      'training.manage',
      'training.assess',
      'attendance.punch',
      'attendance.view',
      'leave.view',
      'leave.create',
      'documents.view',
      'communication.view',
      'performance.view',
      'own.profile',
      'own.attendance',
      'own.leave',
      'own.documents',
      'ess.view'
    ],

    EMPLOYEE: [
      'own.profile',
      'own.attendance',
      'own.leave',
      'own.documents',
      'own.requests',
      'attendance.punch',
      'attendance.view',
      'leave.view',
      'leave.create',
      'communication.view',
      'reports.view',
      'ess.view',
      'assets.view',
      'performance.view',
      'documents.view',
      'requests.view',
      'training.view'
    ],

    TRAINER: [
      'training.*',
      'training.view',
      'training.manage',
      'training.create',
      'training.edit',
      'training.assess',
      'people.view',
      'attendance.punch',
      'attendance.view',
      'leave.view',
      'leave.create',
      'documents.view',
      'documents.upload',
      'communication.view',
      'performance.view',
      'performance.create',
      'performance.edit',
      'own.profile',
      'own.attendance',
      'own.leave',
      'own.documents',
      'ess.view'
    ],

    TRAINEE: [
      'training.view',
      'training.submit',
      'training.participate',
      'attendance.punch',
      'attendance.view',
      'leave.view',
      'leave.create',
      'documents.view',
      'communication.view',
      'own.profile',
      'own.attendance',
      'own.leave',
      'own.documents',
      'ess.view'
    ]
  },

  // Get active permissions set for a user profile
  getUserPermissions(userProfile, roleDoc = null) {
    const rawRoleId = userProfile?.roleId || 'EMPLOYEE';
    const roleId = rawRoleId.toString().toUpperCase().trim();
    
    if (roleId === 'SUPER_ADMIN' || roleId === 'COMPANY_ADMIN' || roleId === 'ADMIN') {
      return new Set(['*']);
    }

    // Resolve built-in permissions
    const defaultPerms = this.ROLE_PERMISSIONS[roleId] 
      || (roleId.includes('HR') ? this.ROLE_PERMISSIONS.HR : null)
      || this.ROLE_PERMISSIONS[rawRoleId] 
      || this.ROLE_PERMISSIONS.EMPLOYEE 
      || [];
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
    const normalizedRole = (userRole || 'EMPLOYEE').toString().toUpperCase().trim();

    if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'COMPANY_ADMIN' || normalizedRole === 'ADMIN') {
      return true;
    }

    // Direct match or Global Superadmin Wildcard
    if (userPermissions && userPermissions instanceof Set) {
      if (userPermissions.has('*') || userPermissions.has(permissionName)) {
        return true;
      }

      // Category Wildcard check (e.g. 'payroll.*' grants 'payroll.view', 'payroll.process')
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

    // Role-based baseline guarantees for HR / HR Manager
    if (normalizedRole === 'HR' || normalizedRole === 'HR_MANAGER' || normalizedRole.includes('HR')) {
      const hrAllowedPerms = [
        'people.view', 'people.create', 'people.edit', 'people.deactivate',
        'attendance.view', 'attendance.create', 'attendance.edit', 'attendance.approve',
        'leave.view', 'leave.create', 'leave.edit', 'leave.approve',
        'payroll.view', 'payroll.manage', 'payroll.process', 'payroll.export', 'payroll.templates',
        'recruitment.view', 'recruitment.manage',
        'performance.view', 'performance.manage',
        'expenses.view', 'expenses.manage',
        'assets.view', 'assets.manage',
        'compliance.view', 'compliance.manage',
        'workflows.view', 'workflows.manage',
        'reports.view', 'reports.export',
        'communication.view', 'communication.manage',
        'settings.manage', 'documents.view', 'documents.upload',
        'own.profile', 'own.payslips', 'own.attendance', 'own.leave'
      ];
      if (hrAllowedPerms.includes(permissionName) || 
          permissionName.startsWith('payroll.') || 
          permissionName.startsWith('people.') || 
          permissionName.startsWith('attendance.') || 
          permissionName.startsWith('leave.') || 
          permissionName.startsWith('reports.')) {
        return true;
      }
    }

    // Payroll Officer baseline guarantees
    if (normalizedRole === 'PAYROLL') {
      if (permissionName.startsWith('payroll.') || 
          permissionName.startsWith('reports.') || 
          permissionName === 'expenses.view' || 
          permissionName === 'people.view') {
        return true;
      }
    }

    // Role-based baseline guarantees for Employee
    if (normalizedRole === 'EMPLOYEE') {
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

    // Role-based baseline guarantees for Line Manager
    if (normalizedRole === 'MANAGER') {
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
