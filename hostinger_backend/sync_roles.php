<?php
require_once 'db.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $updatedEmployees = [];
    $updatedUsers = [];
    $removedDuplicates = [];

    // 1. Ensure ayanislight@gmail.com is linked to real employee record D08939 (Ayan Wasim Chougle)
    $chkAyan = $pdo->prepare("SELECT id FROM users WHERE email = 'ayanislight@gmail.com' LIMIT 1");
    $chkAyan->execute();
    $ayanUser = $chkAyan->fetch();
    if ($ayanUser) {
        $pdo->prepare("UPDATE users SET employee_code = 'D08939', display_name = 'Ayan Wasim Chougle', first_name = 'Ayan', last_name = 'Wasim Chougle', designation = 'Software Developer', department = 'Digital', role_id = 'SUPER_ADMIN', company_name = 'Diallo India Private Limited', branch_name = 'Ghansoli - Navi Mumbai, Maharashtra', status = 'ACTIVE' WHERE id = :id")->execute([':id' => $ayanUser['id']]);
    } else {
        $pdo->prepare("INSERT INTO users (uid, employee_code, email, display_name, first_name, last_name, phone, role_id, company_name, branch_name, department, designation, status) VALUES ('super_admin_ayan', 'D08939', 'ayanislight@gmail.com', 'Ayan Wasim Chougle', 'Ayan', 'Wasim Chougle', '7208533219', 'SUPER_ADMIN', 'Diallo India Private Limited', 'Ghansoli - Navi Mumbai, Maharashtra', 'Digital', 'Software Developer', 'ACTIVE')")->execute();
    }

    // 2. Remove obsolete test records (carrentpedatabase@gmail.com, D-00001..D-00004)
    $pdo->exec("DELETE FROM employees WHERE email = 'carrentpedatabase@gmail.com' OR employee_code IN ('D-00001', 'D-00002', 'D-00003', 'D-00004')");
    $pdo->exec("DELETE FROM users WHERE (email = 'carrentpedatabase@gmail.com' OR employee_code IN ('D-00001', 'D-00002', 'D-00003', 'D-00004')) AND email != 'ayanislight@gmail.com'");

    // 3. Clear manager references that pointed to car database
    $pdo->exec("UPDATE employees SET manager_id = NULL, manager = 'No Manager (Top Level)' WHERE manager_id = 'ZopE1oZcZPQL2rx6VvtGdh7HeOv1' OR manager LIKE '%car database%' OR manager LIKE '%D-00001%'");

    // 4. Reset Relationship Managers & Designers to correct roles before processing
    $pdo->exec("UPDATE employees SET role_id = 'RELATIONSHIP_MANAGER' WHERE LOWER(designation) LIKE '%relationship manager%'");
    $pdo->exec("UPDATE users SET role_id = 'RELATIONSHIP_MANAGER' WHERE LOWER(designation) LIKE '%relationship manager%'");
    $pdo->exec("UPDATE employees SET role_id = 'EMPLOYEE' WHERE LOWER(designation) LIKE '%graphic designer%' OR LOWER(designation) LIKE '%designer%'");
    $pdo->exec("UPDATE users SET role_id = 'EMPLOYEE' WHERE LOWER(designation) LIKE '%graphic designer%' OR LOWER(designation) LIKE '%designer%'");

    // 2. Fetch all employees and resolve canonical role from designation
    $empStmt = $pdo->query("SELECT id, employee_code, full_name, email, work_email, department, designation, role_id FROM employees");
    $employees = $empStmt->fetchAll();

    foreach ($employees as $emp) {
        $email = strtolower(trim($emp['work_email'] ?: $emp['email']));
        $desig = strtolower(trim($emp['designation'] ?? ''));
        $currentRole = strtoupper(trim($emp['role_id'] ?? 'EMPLOYEE'));

        $newRole = 'EMPLOYEE';

        if ($email === 'ayan@tradeforwealth.co.in' || $email === 'ayanislight@gmail.com') {
            $newRole = 'SUPER_ADMIN';
        } elseif (strpos($desig, 'relationship manager') !== false) {
            $newRole = 'RELATIONSHIP_MANAGER';
        } elseif (strpos($desig, 'operations manager') !== false || strpos($desig, 'ops manager') !== false || $desig === 'ops') {
            $newRole = 'OPERATIONS_MANAGER';
        } elseif (strpos($desig, 'compliance') !== false) {
            $newRole = 'COMPLIANCE';
        } elseif (strpos($desig, 'process owner') !== false) {
            $newRole = 'PROCESS_OWNER';
        } elseif (strpos($desig, 'digital marketing') !== false || strpos($desig, 'digital') !== false || strpos($desig, 'seo') !== false) {
            $newRole = 'DIGITAL_MARKETING';
        } elseif (strpos($desig, 'team lead') !== false || strpos($desig, 'team leader') !== false || strpos($desig, 'assistant team leader') !== false || strpos($desig, 'atl') !== false) {
            $newRole = 'TEAM_LEAD';
        } elseif (strpos($desig, 'human resources') !== false || strpos($desig, 'hr lead') !== false || strpos($desig, 'hr manager') !== false || strpos($desig, 'recruiter') !== false || $desig === 'hr' || $desig === 'hrs') {
            $newRole = 'HR_MANAGER';
        } elseif ($currentRole !== 'EMPLOYEE' && in_array($currentRole, ['SUPER_ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER', 'MANAGER', 'PROCESS_OWNER', 'COMPLIANCE', 'DIGITAL_MARKETING', 'TEAM_LEAD', 'RELATIONSHIP_MANAGER', 'MENTOR_TRAINER', 'TRAINEE'])) {
            $newRole = $currentRole;
        } elseif (strpos($desig, 'general manager') !== false || strpos($desig, 'branch manager') !== false || strpos($desig, 'manager') !== false) {
            $newRole = 'MANAGER';
        } elseif (strpos($desig, 'trainer') !== false || strpos($desig, 'mentor') !== false) {
            $newRole = 'MENTOR_TRAINER';
        } elseif (strpos($desig, 'trainee') !== false || strpos($desig, 'intern') !== false) {
            $newRole = 'TRAINEE';
        }

        if ($newRole !== $currentRole) {
            $pdo->prepare("UPDATE employees SET role_id = :r WHERE id = :id")->execute([
                ':r'  => $newRole,
                ':id' => $emp['id']
            ]);
            $updatedEmployees[] = [
                'employee_code' => $emp['employee_code'],
                'full_name'     => $emp['full_name'],
                'designation'   => $emp['designation'],
                'old_role'      => $currentRole,
                'new_role'      => $newRole
            ];
        }
    }

    // 3. Sync all users in users table with corresponding employee record
    $uStmt = $pdo->query("SELECT id, uid, employee_code, email, display_name, designation, department, role_id FROM users");
    $users = $uStmt->fetchAll();

    foreach ($users as $u) {
        $uEmail = strtolower(trim($u['email'] ?? ''));
        // Find best matching employee
        $mStmt = $pdo->prepare("
            SELECT employee_code, department, designation, role_id 
            FROM employees 
            WHERE LOWER(work_email) = :e OR LOWER(email) = :e 
            ORDER BY (role_id != 'EMPLOYEE') DESC, (designation LIKE '%Manager%' OR designation LIKE '%Lead%') DESC 
            LIMIT 1
        ");
        $mStmt->execute([':e' => $uEmail]);
        $mEmp = $mStmt->fetch();

        if ($mEmp) {
            $targetRole = $mEmp['role_id'];
            $targetDesig = !empty($mEmp['designation']) ? $mEmp['designation'] : $u['designation'];
            $targetDept = !empty($mEmp['department']) ? $mEmp['department'] : $u['department'];
            $targetCode = !empty($mEmp['employee_code']) ? $mEmp['employee_code'] : $u['employee_code'];

            if ($u['role_id'] !== $targetRole || $u['employee_code'] !== $targetCode || $u['designation'] !== $targetDesig) {
                $pdo->prepare("
                    UPDATE users 
                    SET role_id = :r, designation = :desig, department = :dept, employee_code = :c 
                    WHERE id = :id
                ")->execute([
                    ':r'     => $targetRole,
                    ':desig' => $targetDesig,
                    ':dept'  => $targetDept,
                    ':c'     => $targetCode,
                    ':id'    => $u['id']
                ]);

                $updatedUsers[] = [
                    'email'         => $uEmail,
                    'display_name'  => $u['display_name'],
                    'employee_code' => $targetCode,
                    'designation'   => $targetDesig,
                    'old_role'      => $u['role_id'],
                    'new_role'      => $targetRole
                ];
            }
        }
    }

    echo json_encode([
        'success'           => true,
        'message'           => 'Role synchronization complete.',
        'updated_employees' => $updatedEmployees,
        'updated_users'     => $updatedUsers,
        'removed_duplicates'=> $removedDuplicates
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}
