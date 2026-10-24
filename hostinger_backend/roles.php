<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Standard 7 Canonical Roles definitions
$defaultRoles = [
    [
        'id' => 'ADMIN',
        'name' => 'Admin',
        'badge' => 'badge-primary',
        'color' => '#7c3aed',
        'desc' => 'Full administrative access to all system functions & settings',
        'permissions' => ['*']
    ],
    [
        'id' => 'HR',
        'name' => 'HR',
        'badge' => 'badge-success',
        'color' => '#059669',
        'desc' => 'HR operations, workforce management, leave & timecards',
        'permissions' => ['people.*', 'attendance.*', 'leave.*', 'recruitment.*', 'compliance.*', 'expenses.*', 'assets.*', 'performance.*', 'documents.*', 'requests.*', 'reports.*', 'users.manage', 'ess']
    ],
    [
        'id' => 'OPS',
        'name' => 'OPS',
        'badge' => 'badge-info',
        'color' => '#0284c7',
        'desc' => 'Operational workflow oversight, teams & shift management',
        'permissions' => ['people.view', 'attendance.view', 'leave.view', 'performance.view', 'compliance.view', 'requests.view', 'communication.view', 'reports.view', 'ess']
    ],
    [
        'id' => 'COMPLIANCE',
        'name' => 'Compliance',
        'badge' => 'badge-info',
        'color' => '#10b981',
        'desc' => 'Statutory compliance, legal audits & documents oversight',
        'permissions' => ['compliance.*', 'documents.view', 'reports.view', 'attendance.view', 'leave.view', 'communication.view', 'requests.view', 'ess']
    ],
    [
        'id' => 'MANAGER',
        'name' => 'Manager',
        'badge' => 'badge-info',
        'color' => '#2563eb',
        'desc' => 'Department oversight, approvals, performance & attendance',
        'permissions' => ['people.view', 'attendance.view', 'leave.view', 'performance.view', 'compliance.view', 'requests.view', 'communication.view', 'reports.view', 'ess']
    ],
    [
        'id' => 'TL',
        'name' => 'TL',
        'badge' => 'badge-info',
        'color' => '#4f46e5',
        'desc' => 'Team leadership, shift presence, daily roster & sign-offs',
        'permissions' => ['people.view', 'attendance.view', 'leave.view', 'performance.view', 'compliance.view', 'requests.view', 'communication.view', 'reports.view', 'ess']
    ],
    [
        'id' => 'EMPLOYEE',
        'name' => 'Employee',
        'badge' => 'badge-neutral',
        'color' => '#475569',
        'desc' => 'Standard self-service profile, timecard, leaves & requests',
        'permissions' => ['own.profile', 'attendance.view', 'leave.view', 'compliance.view', 'ess']
    ]
];

json_out([
    "success" => true,
    "count" => count($defaultRoles),
    "roles" => $defaultRoles
]);
?>
