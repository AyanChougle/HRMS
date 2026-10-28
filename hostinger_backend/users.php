<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = get_json_input();

if (empty($action) && isset($input['action'])) {
    $action = $input['action'];
}

// -----------------------------------------------------------------------------
// GET: Fetch all users or single user
// -----------------------------------------------------------------------------
if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $role = trim($_GET['role'] ?? '');
    $status = trim($_GET['status'] ?? '');
    $uid = trim($_GET['uid'] ?? '');
    $emailParam = trim($_GET['email'] ?? '');

    if (!empty($uid)) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE uid = :uid OR id = :id LIMIT 1");
        $stmt->execute([':uid' => $uid, ':id' => $uid]);
        $user = $stmt->fetch();
        if ($user) {
            unset($user['password_hash']);
            $user['role_id'] = canonical_role($user['role_id']);
        }
        json_out(["success" => true, "user" => $user]);
    }

    $sql = "SELECT id, uid, employee_code, email, display_name, first_name, last_name, phone, role_id, company_name, branch_name, department, designation, status, last_login_at, created_at, updated_at FROM users WHERE 1=1";
    $params = [];

    if (!empty($emailParam)) {
        $sql .= " AND (email = :email OR work_email = :email)";
        $params[':email'] = $emailParam;
    }

    if (!empty($search)) {
        $sql .= " AND (display_name LIKE :s OR email LIKE :s OR employee_code LIKE :s OR department LIKE :s)";
        $params[':s'] = "%$search%";
    }
    if (!empty($role) && $role !== 'All') {
        $sql .= " AND role_id = :r";
        $params[':r'] = canonical_role($role);
    }
    if (!empty($status) && $status !== 'All') {
        $sql .= " AND status = :st";
        $params[':st'] = $status;
    }

    $sql .= " ORDER BY (role_id = 'ADMIN') DESC, display_name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();

    foreach ($users as &$u) {
        $u['role_id'] = canonical_role($u['role_id']);
    }

    json_out([
        "success" => true,
        "count" => count($users),
        "users" => $users
    ]);
}

// -----------------------------------------------------------------------------
// POST / PUT: Create or Update User & Role
// -----------------------------------------------------------------------------
if ($method === 'POST') {
    $uid = trim($input['uid'] ?? $input['id'] ?? '');

    // 1. CREATE USER
    if ($action === 'create' || empty($uid)) {
        $email = strtolower(trim($input['email'] ?? ''));
        $password = $input['password'] ?? 'Diallo@2026';
        $displayName = trim($input['display_name'] ?? '');
        $firstName = trim($input['first_name'] ?? '');
        $lastName = trim($input['last_name'] ?? '');
        $roleId = canonical_role($input['role_id'] ?? 'EMPLOYEE');
        $department = trim($input['department'] ?? 'Operations');
        $designation = trim($input['designation'] ?? 'Staff');
        $phone = trim($input['phone'] ?? '');
        $employeeCode = strtoupper(trim($input['employee_code'] ?? ''));
        $status = strtoupper(trim($input['status'] ?? 'ACTIVE'));

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_out(["success" => false, "error" => "Valid email is required."], 400);
        }

        // Check duplicate email
        $chkStmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = :email LIMIT 1");
        $chkStmt->execute([':email' => $email]);
        if ($chkStmt->fetch()) {
            json_out(["success" => false, "error" => "A user with this email address already exists."], 409);
        }

        if (empty($displayName)) {
            $displayName = trim("$firstName $lastName") ?: explode('@', $email)[0];
        }

        $newUid = 'usr_' . ($employeeCode ? strtolower($employeeCode) : bin2hex(random_bytes(6)));
        $hash = password_hash($password, PASSWORD_BCRYPT);

        $insStmt = $pdo->prepare("
            INSERT INTO users (
                uid, employee_code, email, password_hash, display_name, first_name, last_name,
                phone, role_id, department, designation, status, company_id
            ) VALUES (
                :uid, :code, :email, :hash, :name, :first, :last,
                :phone, :role, :dept, :desig, :status, 'comp_diallo_india'
            )
        ");
        $insStmt->execute([
            ':uid' => $newUid,
            ':code' => $employeeCode,
            ':email' => $email,
            ':hash' => $hash,
            ':name' => $displayName,
            ':first' => $firstName,
            ':last' => $lastName,
            ':phone' => $phone,
            ':role' => $roleId,
            ':dept' => $department,
            ':desig' => $designation,
            ':status' => $status
        ]);

        $newId = $pdo->lastInsertId();

        // Cross-link with employees table without creating duplicate records
        $checkEmp = $pdo->prepare("
            SELECT id FROM employees 
            WHERE LOWER(work_email) = :email 
               OR LOWER(email) = :email2 
               OR (employee_code != '' AND (employee_code = :code OR REPLACE(employee_code, '-', '') = REPLACE(:clean, '-', '')))
            LIMIT 1
        ");
        $checkEmp->execute([
            ':email' => strtolower($email),
            ':email2' => strtolower($email),
            ':code' => $employeeCode,
            ':clean' => $employeeCode
        ]);
        $existingEmp = $checkEmp->fetch();

        if ($existingEmp) {
            // Link existing employee to this user login
            $upd = $pdo->prepare("UPDATE employees SET user_id = :uid, role_id = :role WHERE id = :id");
            $upd->execute([':uid' => $newUid, ':role' => $roleId, ':id' => $existingEmp['id']]);
        } else {
            // Insert employee record only if none existed previously
            $empStmt = $pdo->prepare("
                INSERT INTO employees (
                    id, user_id, employee_code, first_name, last_name, full_name,
                    work_email, phone, role_id, department, designation, employment_status, company_id
                ) VALUES (
                    :id, :uid, :code, :first, :last, :full,
                    :email, :phone, :role, :dept, :desig, :status, 'comp_diallo_india'
                )
            ");
            $empStmt->execute([
                ':id' => 'emp_' . ($employeeCode ? strtolower($employeeCode) : bin2hex(random_bytes(6))),
                ':uid' => $newUid,
                ':code' => $employeeCode,
                ':first' => $firstName,
                ':last' => $lastName,
                ':full' => $displayName,
                ':email' => $email,
                ':phone' => $phone,
                ':role' => $roleId,
                ':dept' => $department,
                ':desig' => $designation,
                ':status' => $status
            ]);
        }

        json_out([
            "success" => true,
            "message" => "User {$displayName} created successfully.",
            "user" => [
                "id" => $newId,
                "uid" => $newUid,
                "email" => $email,
                "display_name" => $displayName,
                "role_id" => $roleId,
                "department" => $department,
                "designation" => $designation,
                "status" => $status
            ]
        ], 201);
    }

    // 2. UPDATE USER
    $stmt = $pdo->prepare("SELECT * FROM users WHERE uid = :uid OR id = :uid LIMIT 1");
    $stmt->execute([':uid' => $uid]);
    $user = $stmt->fetch();

    if (!$user) {
        json_out(["success" => false, "error" => "User not found."], 404);
    }

    $displayName = trim($input['display_name'] ?? $user['display_name']);
    $roleId = canonical_role($input['role_id'] ?? $user['role_id']);
    $department = trim($input['department'] ?? $user['department']);
    $designation = trim($input['designation'] ?? $user['designation']);
    $phone = trim($input['phone'] ?? $user['phone']);
    $status = trim($input['status'] ?? $user['status']);
    $employeeCode = strtoupper(trim($input['employee_code'] ?? $user['employee_code']));

    // Optional password update
    $passwordSql = "";
    $updateParams = [
        ':name' => $displayName,
        ':role' => $roleId,
        ':dept' => $department,
        ':desig' => $designation,
        ':phone' => $phone,
        ':status' => $status,
        ':code' => $employeeCode,
        ':id' => $user['id']
    ];

    if (!empty($input['password'])) {
        $passwordSql = ", password_hash = :hash";
        $updateParams[':hash'] = password_hash($input['password'], PASSWORD_BCRYPT);
    }

    // 1. Update users table
    $upStmt = $pdo->prepare("
        UPDATE users 
        SET display_name = :name, role_id = :role, department = :dept, designation = :desig, phone = :phone, status = :status, employee_code = :code $passwordSql
        WHERE id = :id
    ");
    $upStmt->execute($updateParams);

    // 2. Cross-sync to employees table
    $empStmt = $pdo->prepare("
        UPDATE employees 
        SET full_name = :name, role_id = :role, department = :dept, designation = :desig, phone = :phone, employment_status = :status, employee_code = :code
        WHERE user_id = :uid OR id = :uid OR LOWER(work_email) = :email
    ");
    $empStmt->execute([
        ':name' => $displayName,
        ':role' => $roleId,
        ':dept' => $department,
        ':desig' => $designation,
        ':phone' => $phone,
        ':status' => $status,
        ':code' => $employeeCode,
        ':uid' => $user['uid'],
        ':email' => strtolower($user['email'])
    ]);

    log_audit($pdo, $user['uid'], $user['email'], 'USER_ROLE_UPDATED', 'users', $user['id'], [
        'new_role' => $roleId,
        'new_status' => $status
    ]);

    json_out([
        "success" => true,
        "message" => "User {$displayName} and assigned role updated successfully.",
        "user" => [
            "uid" => $user['uid'],
            "display_name" => $displayName,
            "role_id" => $roleId,
            "department" => $department,
            "designation" => $designation,
            "status" => $status
        ]
    ]);
}
?>