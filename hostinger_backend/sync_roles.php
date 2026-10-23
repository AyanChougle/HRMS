<?php
require_once 'db.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $updatedEmployees = [];
    $updatedUsers = [];
    $removedDuplicates = [];

    // 1. Remove obsolete test records if real census records exist
    $testCodes = ['D-00001', 'D-00002', 'D-00003', 'D-00004'];
    foreach ($testCodes as $tCode) {
        $chkStmt = $pdo->prepare("SELECT id, email, work_email, employee_code, full_name FROM employees WHERE employee_code = :c LIMIT 1");
        $chkStmt->execute([':c' => $tCode]);
        $testEmp = $chkStmt->fetch();
        if ($testEmp) {
            $eMail = strtolower(trim($testEmp['work_email'] ?: $testEmp['email']));
            // Check if another real employee record exists with this email
            $realStmt = $pdo->prepare("SELECT id, employee_code, designation FROM employees WHERE (LOWER(work_email) = :e OR LOWER(email) = :e) AND employee_code != :c LIMIT 1");
            $realStmt->execute([':e' => $eMail, ':c' => $tCode]);
            $realEmp = $realStmt->fetch();
            if ($realEmp) {
                // Delete test record from employees
                $pdo->prepare("DELETE FROM employees WHERE id = :id")->execute([':id' => $testEmp['id']]);
                // Ensure users table points to the real employee code
                $pdo->prepare("UPDATE users SET employee_code = :rc WHERE (LOWER(email) = :e) AND employee_code = :tc")->execute([
                    ':rc' => $realEmp['employee_code'],
                    ':e'  => $eMail,
                    ':tc' => $tCode
                ]);
                $removedDuplicates[] = [
                    'removed_test_code' => $tCode,
                    'real_code'         => $realEmp['employee_code'],
                    'name'              => $testEmp['full_name'],
                    'email'             => $eMail
                ];
            }
        }
    }

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
        } elseif ($currentRole !== 'EMPLOYEE' && in_array($currentRole, ['SUPER_ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER', 'MANAGER', 'PROCESS_OWNER', 'COMPLIANCE', 'DIGITAL_MARKETING', 'TEAM_LEAD', 'RELATIONSHIP_MANAGER', 'MENTOR_TRAINER', 'TRAINEE'])) {
            $newRole = $currentRole;
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
        } elseif (strpos($desig, 'relationship manager') !== false) {
            $newRole = 'RELATIONSHIP_MANAGER';
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
