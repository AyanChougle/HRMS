<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Standard dynamic roles definitions stored in DB
$defaultRoles = [
    [
        'id' => 'SUPER_ADMIN',
        'name' => 'Super Administrator',
        'badge' => 'badge-primary',
        'color' => '#7c3aed',
        'desc' => 'Full root access to all system functions & settings',
        'permissions' => ['*']
    ],
    [
        'id' => 'HR_MANAGER',
        'name' => 'HR Manager',
        'badge' => 'badge-success',
        'color' => '#059669',
        'desc' => 'Full HR ops, recruitment, onboarding, leave & timecards',
        'permissions' => ['people.*', 'attendance.*', 'leave.*', 'recruitment.*', 'compliance.*', 'expenses.*', 'assets.*', 'performance.*', 'documents.*', 'requests.*', 'reports.*', 'users.manage', 'ess']
    ],
    [
        'id' => 'MANAGER',
        'name' => 'Line Manager',
        'badge' => 'badge-info',
        'color' => '#2563eb',
        'desc' => 'Team oversight, approvals, performance & attendance',
        'permissions' => ['people.view', 'attendance.view', 'leave.view', 'performance.view', 'compliance.view', 'requests.view', 'communication.view', 'reports.view', 'ess']
    ],
    [
        'id' => 'OPERATIONS_MANAGER',
        'name' => 'Operations Manager',
        'badge' => 'badge-info',
        'color' => '#0284c7',
        'desc' => 'Operational workflow oversight, teams & shift management',
        'permissions' => ['people.view', 'attendance.view', 'leave.view', 'performance.view', 'compliance.view', 'requests.view', 'communication.view', 'reports.view', 'ess']
    ],
    [
        'id' => 'TEAM_LEAD',
        'name' => 'Team Leader',
        'badge' => 'badge-info',
        'color' => '#4f46e5',
        'desc' => 'Shift leadership, daily roster, team reviews & sign-offs',
        'permissions' => ['people.view', 'attendance.view', 'leave.view', 'performance.view', 'compliance.view', 'requests.view', 'communication.view', 'reports.view', 'ess']
    ],
    [
        'id' => 'MENTOR_TRAINER',
        'name' => 'Mentor / Trainer',
        'badge' => 'badge-warning',
        'color' => '#d97706',
        'desc' => 'Training curriculum, module evaluations & trainee guidance',
        'permissions' => ['training.*', 'attendance.view', 'people.view', 'compliance.view', 'ess']
    ],
    [
        'id' => 'TRAINEE',
        'name' => 'Graduate Trainee',
        'badge' => 'badge-warning',
        'color' => '#ea580c',
        'desc' => 'Restricted access strictly to 7-day training & punch-in',
        'permissions' => ['training.view', 'attendance.view', 'compliance.view', 'ess']
    ],
    [
        'id' => 'EMPLOYEE',
        'name' => 'Employee (Self Service)',
        'badge' => 'badge-neutral',
        'color' => '#475569',
        'desc' => 'Standard self-service profile, timecard, leaves & requests',
        'permissions' => ['own.profile', 'attendance.view', 'leave.view', 'compliance.view', 'ess']
    ]
];

// Check if custom config exists in system_config
$stmt = $pdo->prepare("SELECT config_value FROM system_config WHERE config_key = 'custom_roles' LIMIT 1");
$stmt->execute();
$row = $stmt->fetch();

$roles = $row ? json_decode($row['config_value'], true) : $defaultRoles;

json_out([
    "success" => true,
    "count" => count($roles),
    "roles" => $roles
]);
?>
