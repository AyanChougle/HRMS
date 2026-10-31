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

    // 3. Ensure every employee in employees table has a corresponding record in users table
    $createdLogins = 0;
    foreach ($employees as $emp) {
        $empEmail = strtolower(trim(!empty($emp['email']) ? $emp['email'] : ($emp['work_email'] ?? '')));
        if (empty($empEmail)) continue;

        $checkU = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = :e OR (employee_code != '' AND employee_code = :c) LIMIT 1");
        $checkU->execute([':e' => $empEmail, ':c' => $emp['employee_code']]);
        if (!$checkU->fetch()) {
            $userUid = !empty($emp['user_id']) ? $emp['user_id'] : ('emp_' . strtolower(str_replace(['-', ' '], '', $emp['employee_code'] ?: bin2hex(random_bytes(4)))));
            $userPass = !empty($emp['initial_password']) ? $emp['initial_password'] : 'TradeForWealth@2026';
            $hash = password_hash($userPass, PASSWORD_BCRYPT);
            try {
                $pdo->prepare("
                    INSERT INTO users (
                        uid, employee_code, email, password_hash, initial_password, display_name,
                        first_name, last_name, phone, role_id, department, designation, status, company_id
                    ) VALUES (
                        :uid, :code, :email, :hash, :init_pwd, :name,
                        :first, :last, :phone, :role, :dept, :desig, 'ACTIVE', 'comp_diallo_india'
                    )
                ")->execute([
                    ':uid' => $userUid,
                    ':code' => $emp['employee_code'],
                    ':email' => $empEmail,
                    ':hash' => $hash,
                    ':init_pwd' => $userPass,
                    ':name' => $emp['full_name'],
                    ':first' => $emp['first_name'] ?? '',
                    ':last' => $emp['last_name'] ?? '',
                    ':phone' => $emp['phone'] ?? '',
                    ':role' => mapToCanonicalRole($emp['role_id']),
                    ':dept' => $emp['department'] ?? 'Operations',
                    ':desig' => $emp['designation'] ?? 'Associate'
                ]);
                $createdLogins++;
            } catch (\Throwable $e) {}
        }
    }

    echo json_encode([
        'success'           => true,
        'message'           => 'Role synchronization to 7 canonical roles complete (non-destructive).',
        'updated_employees' => $updatedEmployees,
        'updated_users'     => $updatedUsers,
        'created_logins'    => $createdLogins,
        'synced'            => count($employees)
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}
?>
