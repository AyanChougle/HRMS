/**
 * DIALLO HRMS — CENTRALIZED PERMISSION SERVICE (PHASE 3)
 * Dynamic wildcard-aware permission resolution and role mappings
 */

const PermissionService = {
  // Built-in Role to Permission Mappings
  ROLE_PERMISSIONS: {
    SUPER_ADMIN: ['*'],
    
    COMPANY_ADMIN: [
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
      'people.view',
      'people.create',
      'people.edit',
      'people.deactivate',
      'attendance.view',
      'attendance.create',
      'attendance.edit',
      'attendance.approve',
      'leave.view',
      'leave.create',
      'leave.edit',
      'leave.approve',
      'documents.view',
      'documents.upload',
      'reports.view',
      'reports.export',
      'communication.*',
      'approvals.process',
      'companies.manage',
      'companies.view',
      'settings.manage'
    ],

    PAYROLL: [
      'payroll.view',
      'payroll.manage',
      'payroll.process',
      'reports.view',
      'reports.export',
      'people.view',
      'own.profile',
      'own.payslips'
    ],

    MANAGER: [
      'team.view',
      'team.attendance',
      'team.leave',
      'team.approve',
      'attendance.team',
      'leave.approve',
      'approvals.process',
      'communication.view',
      'own.profile',
      'own.attendance',
      'own.leave',
      'own.payslips',
      'own.documents',
      'own.requests'
    ],

    EMPLOYEE: [
      'own.profile',
      'own.attendance',
      'own.leave',
      'own.payslips',
      'own.documents',
      'own.expenses',
      'own.requests',
      'attendance.punch',
      'communication.view'
    ]
  },

  // Get active permissions set for a user profile
  getUserPermissions(userProfile, roleDoc = null) {
    const roleId = userProfile?.roleId || 'EMPLOYEE';
    
    // 1. If roleDoc has custom permissions array in Firestore, use it
    if (roleDoc && Array.isArray(roleDoc.permissions) && roleDoc.permissions.length > 0) {
      return new Set(roleDoc.permissions);
    }

    // 2. Fall back to standard built-in role mapping
    const defaultPerms = this.ROLE_PERMISSIONS[roleId] || this.ROLE_PERMISSIONS.EMPLOYEE;
    return new Set(defaultPerms);
  },

  // Evaluate if user has a specific permission key
  hasPermission(permissionName, userPermissions, userRole = 'EMPLOYEE') {
    if (!permissionName) return true;
    if (userRole === 'SUPER_ADMIN') return true;
    if (!userPermissions || !(userPermissions instanceof Set)) return false;

    // Direct match or Global Superadmin Wildcard
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

    return false;
  }
};

window.PermissionService = PermissionService;
