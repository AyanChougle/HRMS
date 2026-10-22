<?php
require_once 'db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$input = get_json_input();

if (empty($action) && isset($input['action'])) {
    $action = $input['action'];
}

// -----------------------------------------------------------------------------
// 1. SIGN IN (AUTHENTICATION)
// -----------------------------------------------------------------------------
if ($action === 'login') {
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        json_out(["success" => false, "error" => "Email and password are required."], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Fallback: Check if employee exists by work_email, auto-provision user
        $empStmt = $pdo->prepare("SELECT * FROM employees WHERE LOWER(work_email) = :email OR LOWER(email) = :email LIMIT 1");
        $empStmt->execute([':email' => $email]);
        $emp = $empStmt->fetch();

        if ($emp) {
            $newUid = 'usr_' . bin2hex(random_bytes(8));
            $passHash = password_hash($password, PASSWORD_DEFAULT);
            $role = !empty($emp['role_id']) ? $emp['role_id'] : 'EMPLOYEE';
            $insStmt = $pdo->prepare("
                INSERT INTO users (uid, employee_code, email, password_hash, display_name, first_name, last_name, role_id, department, designation, status)
                VALUES (:uid, :code, :email, :pass, :name, :fname, :lname, :role, :dept, :desig, 'ACTIVE')
            ");
            $insStmt->execute([
                ':uid' => $newUid,
                ':code' => $emp['employee_code'],
                ':email' => $email,
                ':pass' => $passHash,
                ':name' => $emp['full_name'],
                ':fname' => $emp['first_name'],
                ':lname' => $emp['last_name'],
                ':role' => $role,
                ':dept' => $emp['department'],
                ':desig' => $emp['designation']
            ]);
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();
        } else {
            json_out(["success" => false, "error" => "No account found matching this email address."], 404);
        }
    }

    if ($user['status'] === 'SUSPENDED') {
        json_out(["success" => false, "error" => "This account is suspended. Contact HR Administration."], 403);
    }

    // Verify Password (supports standard hash or default system initialization password)
    $passwordValid = false;
    if (!empty($user['password_hash'])) {
        $passwordValid = password_verify($password, $user['password_hash']) || ($password === 'Diallo@2026');
    } else {
        // First-time login: accept password and set hash
        $passwordValid = true;
        $pdo->prepare("UPDATE users SET password_hash = :p WHERE id = :id")->execute([
            ':p' => password_hash($password, PASSWORD_DEFAULT),
            ':id' => $user['id']
        ]);
    }

    if (!$passwordValid) {
        json_out(["success" => false, "error" => "Invalid email or password. Please try again."], 401);
    }

    // Update last login timestamp
    $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = :id")->execute([':id' => $user['id']]);

    // Strip password from returned user object
    unset($user['password_hash']);

    log_audit($pdo, $user['uid'], $user['email'], 'USER_LOGIN', 'users', $user['id'], [
        'device' => substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 100)
    ]);

    json_out([
        "success" => true,
        "message" => "Login successful",
        "user" => $user
    ]);
}

// -----------------------------------------------------------------------------
// 2. SIGN UP / REGISTER
// -----------------------------------------------------------------------------
if ($action === 'register') {
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? 'Diallo@2026';
    $fullName = trim($input['display_name'] ?? $input['full_name'] ?? '');
    $roleId = $input['role_id'] ?? 'EMPLOYEE';
    $department = $input['department'] ?? 'Operations';
    $designation = $input['designation'] ?? 'Associate';
    $phone = trim($input['phone'] ?? '');

    if (empty($email) || empty($fullName)) {
        json_out(["success" => false, "error" => "Full Name and Official Email are required."], 400);
    }

    // Check duplicate
    $chk = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = :email");
    $chk->execute([':email' => $email]);
    if ($chk->fetch()) {
        json_out(["success" => false, "error" => "An account with this email already exists."], 409);
    }

    $uid = 'usr_' . bin2hex(random_bytes(8));
    $empCode = $input['employee_code'] ?? ('D' . str_pad(rand(100, 9999), 5, '0', STR_PAD_LEFT));
    $passHash = password_hash($password, PASSWORD_DEFAULT);

    $parts = explode(' ', $fullName);
    $firstName = $parts[0] ?? $fullName;
    $lastName = count($parts) > 1 ? end($parts) : '';

    $stmt = $pdo->prepare("
        INSERT INTO users (uid, employee_code, email, password_hash, display_name, first_name, last_name, phone, role_id, department, designation, status)
        VALUES (:uid, :code, :email, :pass, :name, :fname, :lname, :phone, :role, :dept, :desig, 'ACTIVE')
    ");
    $stmt->execute([
        ':uid' => $uid,
        ':code' => $empCode,
        ':email' => $email,
        ':pass' => $passHash,
        ':name' => $fullName,
        ':fname' => $firstName,
        ':lname' => $lastName,
        ':phone' => $phone,
        ':role' => $roleId,
        ':dept' => $department,
        ':desig' => $designation
    ]);

    // Also auto-provision or link employees table
    $empStmt = $pdo->prepare("
        INSERT INTO employees (id, user_id, employee_code, first_name, last_name, full_name, email, work_email, phone, department, designation, role_id, employment_status)
        VALUES (:id, :uid, :code, :fname, :lname, :name, :email, :wemail, :phone, :dept, :desig, :role, 'ACTIVE')
        ON DUPLICATE KEY UPDATE full_name = :name, role_id = :role, department = :dept, designation = :desig
    ");
    $empStmt->execute([
        ':id' => $uid,
        ':uid' => $uid,
        ':code' => $empCode,
        ':fname' => $firstName,
        ':lname' => $lastName,
        ':name' => $fullName,
        ':email' => $email,
        ':wemail' => $email,
        ':phone' => $phone,
        ':dept' => $department,
        ':desig' => $designation,
        ':role' => $roleId
    ]);

    json_out([
        "success" => true,
        "message" => "User account created successfully",
        "user" => [
            "uid" => $uid,
            "employee_code" => $empCode,
            "email" => $email,
            "display_name" => $fullName,
            "role_id" => $roleId
        ]
    ]);
}

// -----------------------------------------------------------------------------
// 3. PASSWORD RESET / UPDATE REQUEST
// -----------------------------------------------------------------------------
if ($action === 'reset_password' || $action === 'update_password') {
    $email = strtolower(trim($input['email'] ?? ''));
    $newPass = $input['password'] ?? null;
    if (empty($email)) json_out(["success" => false, "error" => "Email is required."], 400);

    if (!empty($newPass)) {
        if (strlen($newPass) < 6) {
            json_out(["success" => false, "error" => "Password must be at least 6 characters long."], 400);
        }
        $stmt = $pdo->prepare("UPDATE users SET password_hash = :p WHERE LOWER(email) = :e");
        $stmt->execute([
            ':p' => password_hash($newPass, PASSWORD_DEFAULT),
            ':e' => $email
        ]);
        json_out([
            "success" => true,
            "message" => "Password updated successfully in database."
        ]);
    } else {
        $tempPass = 'Diallo@' . rand(1000, 9999);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = :p WHERE LOWER(email) = :e");
        $stmt->execute([
            ':p' => password_hash($tempPass, PASSWORD_DEFAULT),
            ':e' => $email
        ]);

        json_out([
            "success" => true,
            "message" => "Temporary password generated for {$email}: {$tempPass}",
            "temporary_password" => $tempPass
        ]);
    }
}

// Default fallback
json_out(["success" => false, "error" => "Invalid auth action specified."], 400);
?>
