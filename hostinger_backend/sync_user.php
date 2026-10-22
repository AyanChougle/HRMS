<?php
// ==============================================================================
// DIALLO HRMS — SYNC SINGLE USER / EMPLOYEE TO MYSQL
// ==============================================================================
require_once 'db.php';

$input = get_json_input();
if (empty($input)) {
    json_out(["success" => false, "error" => "No data provided."], 400);
}

$code     = strtoupper(trim($input['employee_code'] ?? ''));
$email    = strtolower(trim($input['email'] ?? $input['work_email'] ?? ''));
$fullName = trim($input['full_name'] ?? $input['name'] ?? $input['displayName'] ?? 'User');
$role     = strtoupper(trim($input['role'] ?? $input['role_id'] ?? 'EMPLOYEE'));
$dept     = trim($input['department'] ?? 'Operations');
$desig    = trim($input['designation'] ?? 'Associate');
$phone    = trim($input['phone'] ?? '');
$status   = strtoupper(trim($input['status'] ?? $input['employment_status'] ?? 'ACTIVE'));
$password = trim($input['password'] ?? $input['initialPassword'] ?? $input['loginPassword'] ?? 'Diallo@2026');

if (empty($email) || empty($fullName)) {
    json_out(["success" => false, "error" => "Email and Full Name are required."], 400);
}

$uid = $input['uid'] ?? $input['id'] ?? ('usr_' . ($code ? strtolower(preg_replace('/[^a-z0-9]/i', '', $code)) : bin2hex(random_bytes(6))));

$parts = explode(' ', $fullName);
$firstName = $input['first_name'] ?? ($parts[0] ?? $fullName);
$lastName = $input['last_name'] ?? (count($parts) > 1 ? end($parts) : '');

// 1. Sync to users table
try {
    $stmt = $pdo->prepare("
        INSERT INTO users (uid, employee_code, email, password_hash, display_name, first_name, last_name, role_id, department, designation, phone, status)
        VALUES (:uid, :code, :email, :pass, :name, :fname, :lname, :role, :dept, :desig, :phone, :status)
        ON DUPLICATE KEY UPDATE 
            display_name = :name, 
            first_name = :fname,
            last_name = :lname,
            role_id = :role, 
            department = :dept, 
            designation = :desig, 
            phone = :phone, 
            status = :status
    ");
    $stmt->execute([
        ':uid'    => $uid,
        ':code'   => $code,
        ':email'  => $email,
        ':pass'   => password_hash($password, PASSWORD_DEFAULT),
        ':name'   => $fullName,
        ':fname'  => $firstName,
        ':lname'  => $lastName,
        ':role'   => $role,
        ':dept'   => $dept,
        ':desig'  => $desig,
        ':phone'  => $phone,
        ':status' => $status
    ]);
} catch (\Throwable $e) {
    error_log("[Sync User Error] " . $e->getMessage());
}

// 2. Sync to employees table
try {
    $empStmt = $pdo->prepare("
        INSERT INTO employees (id, employee_code, first_name, last_name, full_name, email, work_email, phone, department, designation, role_id, employment_status, status)
        VALUES (:id, :code, :fname, :lname, :name, :email, :wemail, :phone, :dept, :desig, :role, :status, :status)
        ON DUPLICATE KEY UPDATE 
            full_name = :name,
            first_name = :fname,
            last_name = :lname,
            phone = :phone, 
            department = :dept, 
            designation = :desig, 
            role_id = :role, 
            employment_status = :status, 
            status = :status
    ");
    $empStmt->execute([
        ':id'     => $uid,
        ':code'   => $code,
        ':fname'  => $firstName,
        ':lname'  => $lastName,
        ':name'   => $fullName,
        ':email'  => $email,
        ':wemail' => $email,
        ':phone'  => $phone,
        ':dept'   => $dept,
        ':desig'  => $desig,
        ':role'   => $role,
        ':status' => $status
    ]);
} catch (\Throwable $e) {
    error_log("[Sync Employee Error] " . $e->getMessage());
}

json_out([
    "success" => true,
    "message" => "Record synchronized to Hostinger MySQL successfully.",
    "uid"     => $uid
]);
