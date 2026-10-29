<?php
require_once 'db.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $updatedEmployees = [];
    $updatedUsers = [];

    // Canonical 7-role map
    function mapToCanonicalRole($rawRole) {
        $r = strtoupper(trim($rawRole ?? 'EMPLOYEE'));
        if (in_array($r, ['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'])) return 'ADMIN';
        if (in_array($r, ['HR', 'HR_MANAGER'])) return 'HR';
        if (in_array($r, ['OPS', 'OPERATIONS_MANAGER', 'PROCESS_OWNER'])) return 'OPS';
        if ($r === 'COMPLIANCE') return 'COMPLIANCE';
        if ($r === 'MANAGER') return 'MANAGER';
        if (in_array($r, ['TL', 'TEAM_LEAD'])) return 'TL';
        return 'EMPLOYEE';
    }

    // 1. Audit and migrate roles in employees table non-destructively
    $empStmt = $pdo->query("SELECT id, employee_code, full_name, email, work_email, department, designation, role_id FROM employees");
    $employees = $empStmt->fetchAll();

    foreach ($employees as $emp) {
        $currentRole = strtoupper(trim($emp['role_id'] ?? 'EMPLOYEE'));
        $targetRole = mapToCanonicalRole($currentRole);

        // Job designations like Relationship Manager or Digital Marketing Executive are strictly EMPLOYEE
        $desig = strtolower(trim($emp['designation'] ?? ''));
        if (strpos($desig, 'relationship manager') !== false || strpos($desig, 'digital') !== false || strpos($desig, 'trainee') !== false) {
            $targetRole = 'EMPLOYEE';
        }

        if ($targetRole !== $currentRole) {
            $pdo->prepare("UPDATE employees SET role_id = :r WHERE id = :id")->execute([
                ':r'  => $targetRole,
                ':id' => $emp['id']
            ]);
            $updatedEmployees[] = [
                'employee_code' => $emp['employee_code'],
                'full_name'     => $emp['full_name'],
                'designation'   => $emp['designation'],
                'old_role'      => $currentRole,
                'new_role'      => $targetRole
            ];
        }
    }

    // 2. Audit and migrate roles in users table non-destructively
    $uStmt = $pdo->query("SELECT id, uid, employee_code, email, display_name, designation, department, role_id FROM users");
    $users = $uStmt->fetchAll();

    foreach ($users as $u) {
        $currentRole = strtoupper(trim($u['role_id'] ?? 'EMPLOYEE'));
        $targetRole = mapToCanonicalRole($currentRole);

        $desig = strtolower(trim($u['designation'] ?? ''));
        if (strpos($desig, 'relationship manager') !== false || strpos($desig, 'digital') !== false || strpos($desig, 'trainee') !== false) {
            $targetRole = 'EMPLOYEE';
        }

        if ($targetRole !== $currentRole) {
            $pdo->prepare("UPDATE users SET role_id = :r WHERE id = :id")->execute([
                ':r'  => $targetRole,
                ':id' => $u['id']
            ]);
            $updatedUsers[] = [
                'email'         => $u['email'],
                'display_name'  => $u['display_name'],
                'employee_code' => $u['employee_code'],
                'designation'   => $u['designation'],
                'old_role'      => $currentRole,
                'new_role'      => $targetRole
            ];
        }
    }

    echo json_encode([
        'success'           => true,
        'message'           => 'Role synchronization to 7 canonical roles complete (non-destructive).',
        'updated_employees' => $updatedEmployees,
        'updated_users'     => $updatedUsers
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}
?>
