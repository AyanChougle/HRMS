<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = get_json_input();

// -----------------------------------------------------------------------------
// GET: Fetch all users or single user
// -----------------------------------------------------------------------------
if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $role = trim($_GET['role'] ?? '');
    $status = trim($_GET['status'] ?? '');
    $uid = trim($_GET['uid'] ?? '');

    if (!empty($uid)) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE uid = :uid OR id = :id LIMIT 1");
        $stmt->execute([':uid' => $uid, ':id' => $uid]);
        $user = $stmt->fetch();
        if ($user) unset($user['password_hash']);
        json_out(["success" => true, "user" => $user]);
    }

    $sql = "SELECT id, uid, employee_code, email, display_name, first_name, last_name, phone, role_id, company_name, branch_name, department, designation, status, last_login_at, created_at, updated_at FROM users WHERE 1=1";
    $params = [];

    if (!empty($search)) {
        $sql .= " AND (display_name LIKE :s OR email LIKE :s OR employee_code LIKE :s OR department LIKE :s)";
        $params[':s'] = "%$search%";
    }
    if (!empty($role) && $role !== 'All') {
        $sql .= " AND role_id = :r";
        $params[':r'] = $role;
    }
    if (!empty($status) && $status !== 'All') {
        $sql .= " AND status = :st";
        $params[':st'] = $status;
    }

    $sql .= " ORDER BY (role_id = 'SUPER_ADMIN') DESC, display_name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();

    json_out([
        "success" => true,
        "count" => count($users),
        "users" => $users
    ]);
}

// -----------------------------------------------------------------------------
// POST / PUT: Update User & Role
// -----------------------------------------------------------------------------
if ($method === 'POST') {
    $uid = trim($input['uid'] ?? $input['id'] ?? '');
    if (empty($uid)) {
        json_out(["success" => false, "error" => "User UID is required."], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE uid = :uid OR id = :uid LIMIT 1");
    $stmt->execute([':uid' => $uid]);
    $user = $stmt->fetch();

    if (!$user) {
        json_out(["success" => false, "error" => "User not found."], 404);
    }

    $displayName = trim($input['display_name'] ?? $user['display_name']);
    $roleId = trim($input['role_id'] ?? $user['role_id']);
    $department = trim($input['department'] ?? $user['department']);
    $designation = trim($input['designation'] ?? $user['designation']);
    $phone = trim($input['phone'] ?? $user['phone']);
    $status = trim($input['status'] ?? $user['status']);
    $employeeCode = trim($input['employee_code'] ?? $user['employee_code']);

    // 1. Update users table
    $upStmt = $pdo->prepare("
        UPDATE users 
        SET display_name = :name, role_id = :role, department = :dept, designation = :desig, phone = :phone, status = :status, employee_code = :code
        WHERE id = :id
    ");
    $upStmt->execute([
        ':name' => $displayName,
        ':role' => $roleId,
        ':dept' => $department,
        ':desig' => $designation,
        ':phone' => $phone,
        ':status' => $status,
        ':code' => $employeeCode,
        ':id' => $user['id']
    ]);

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
