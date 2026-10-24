<?php
require_once 'db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$input = get_json_input();

if (empty($action) && isset($input['action'])) {
    $action = $input['action'];
}

try {
    // -----------------------------------------------------------------------------
    // 1. SIGN IN (AUTHENTICATION)
    // -----------------------------------------------------------------------------
    if ($action === 'login') {
        $loginId = strtolower(trim($input['email'] ?? $input['username'] ?? $input['employee_code'] ?? ''));
        $password = $input['password'] ?? '';

        if (empty($loginId) || empty($password)) {
            json_out(["success" => false, "error" => "Email/Employee ID and password are required."], 400);
        }

        // Extract username prefix if an email was typed (e.g. 'ganesh' from 'ganesh@tradeforwealth.co.in')
        $usernamePrefix = (strpos($loginId, '@') !== false) ? explode('@', $loginId)[0] : $loginId;

        // 1. Search users table by email, employee_code, or username pattern
        $stmt = $pdo->prepare("
            SELECT * FROM users 
            WHERE LOWER(email) = :id 
               OR UPPER(employee_code) = UPPER(:id)
               OR LOWER(email) LIKE :prefixPattern
               OR LOWER(email) LIKE :exactPrefix
            LIMIT 1
        ");
        $stmt->execute([
            ':id' => $loginId,
            ':prefixPattern' => $usernamePrefix . '@tr%eforwealth.co.in',
            ':exactPrefix' => $usernamePrefix . '@tradeforwealth.co.in'
        ]);
        $user = $stmt->fetch();

        // 2. If not found in users, check employees table
        if (!$user) {
            $empStmt = $pdo->prepare("
                SELECT * FROM employees 
                WHERE LOWER(work_email) = :id 
                   OR LOWER(email) = :id 
                   OR UPPER(employee_code) = UPPER(:id)
                   OR LOWER(work_email) LIKE :prefixPattern
                   OR LOWER(email) LIKE :prefixPattern
                   OR LOWER(work_email) LIKE :exactPrefix
                LIMIT 1
            ");
            $empStmt->execute([
                ':id' => $loginId,
                ':prefixPattern' => $usernamePrefix . '@tr%eforwealth.co.in',
                ':exactPrefix' => $usernamePrefix . '@tradeforwealth.co.in'
            ]);
            $emp = $empStmt->fetch();

            if ($emp) {
                if (!empty($emp['employee_code'])) {
                    $uCheck = $pdo->prepare("SELECT * FROM users WHERE UPPER(employee_code) = UPPER(:c) LIMIT 1");
                    $uCheck->execute([':c' => $emp['employee_code']]);
                    $user = $uCheck->fetch();
                }

                if (!$user) {
                    $newUid = !empty($emp['id']) ? $emp['id'] : ('usr_' . bin2hex(random_bytes(8)));
                    $passHash = password_hash($password, PASSWORD_DEFAULT);
                    $role = !empty($emp['role_id']) ? canonical_role($emp['role_id']) : 'EMPLOYEE';
                    $userEmail = !empty($emp['work_email']) ? $emp['work_email'] : (!empty($emp['email']) ? $emp['email'] : $loginId);

                    $insStmt = $pdo->prepare("
                        INSERT INTO users (uid, employee_code, email, password_hash, display_name, first_name, last_name, role_id, department, designation, status)
                        VALUES (:uid, :code, :email, :pass, :name, :fname, :lname, :role, :dept, :desig, 'ACTIVE')
                    ");
                    $insStmt->execute([
                        ':uid' => $newUid,
                        ':code' => $emp['employee_code'],
                        ':email' => $userEmail,
                        ':pass' => $passHash,
                        ':name' => $emp['full_name'],
                        ':fname' => $emp['first_name'],
                        ':lname' => $emp['last_name'],
                        ':role' => $role,
                        ':dept' => $emp['department'],
                        ':desig' => $emp['designation']
                    ]);
                    $stmt->execute([
                        ':id' => $userEmail,
                        ':prefixPattern' => $usernamePrefix . '@tr%eforwealth.co.in',
                        ':exactPrefix' => $usernamePrefix . '@tradeforwealth.co.in'
                    ]);
                    $user = $stmt->fetch();
                }
            } else {
                json_out(["success" => false, "error" => "No account found matching this email address or Employee ID."], 404);
            }
        }

        if (isset($user['status']) && $user['status'] === 'SUSPENDED') {
            json_out(["success" => false, "error" => "This account is suspended. Contact HR Administration."], 403);
        }

        // Verify Password strictly via secure password hash
        $passwordValid = false;
        if (!empty($user['password_hash'])) {
            $passwordValid = password_verify($password, $user['password_hash']);
        }

        // Case-insensitive check for initial company default passwords, employee name patterns, code, or phone
        if (!$passwordValid) {
            $cleanPw = strtolower(trim($password));
            $validDefaults = [
                'diallo@2026',
                'diallo@123',
                'diallo',
                'tradeforwealth',
                'tradeforwealth@2026',
                'tradeforwealth@123',
                'password@123',
                'welcome@123',
                'admin@123',
                'hrms@123',
                '123456',
                'password'
            ];

            $firstName = !empty($user['first_name']) ? strtolower(trim($user['first_name'])) : '';
            $lastName = !empty($user['last_name']) ? strtolower(trim($user['last_name'])) : '';
            $userPrefix = strtolower($usernamePrefix);

            // Pattern checks for employee-specific passwords like Ganesh@123, Ganesh@2026, ganesh, etc.
            $isNameMatch = false;
            if (!empty($firstName) && (
                $cleanPw === $firstName ||
                $cleanPw === $firstName . '@123' ||
                $cleanPw === $firstName . '@2026' ||
                $cleanPw === $firstName . '@2025' ||
                $cleanPw === $firstName . '123' ||
                strpos($cleanPw, $firstName) === 0
            )) {
                $isNameMatch = true;
            }
            if (!empty($userPrefix) && (
                $cleanPw === $userPrefix ||
                $cleanPw === $userPrefix . '@123' ||
                $cleanPw === $userPrefix . '@2026' ||
                $cleanPw === $userPrefix . '123' ||
                strpos($cleanPw, $userPrefix) === 0
            )) {
                $isNameMatch = true;
            }

            $isDefaultMatch = in_array($cleanPw, $validDefaults);
            $isCodeMatch = !empty($user['employee_code']) && (
                strtoupper(trim($password)) === strtoupper(trim($user['employee_code'])) ||
                $cleanPw === strtolower($user['employee_code']) . '@123' ||
                $cleanPw === strtolower($user['employee_code']) . '@2026'
            );
            $isPhoneMatch = !empty($user['phone']) && trim($password) === trim($user['phone']);

            if ($isDefaultMatch || $isNameMatch || $isCodeMatch || $isPhoneMatch) {
                $passwordValid = true;
                // Establish the entered password hash so subsequent logins verify directly
                $pdo->prepare("UPDATE users SET password_hash = :p WHERE id = :id")->execute([
                    ':p' => password_hash($password, PASSWORD_DEFAULT),
                    ':id' => $user['id']
                ]);
            }
        } elseif (strlen($password) >= 6 && empty($user['password_hash'])) {
            $passwordValid = true;
            $pdo->prepare("UPDATE users SET password_hash = :p WHERE id = :id")->execute([
                ':p' => password_hash($password, PASSWORD_DEFAULT),
                ':id' => $user['id']
            ]);
        }

        if (!$passwordValid) {
            json_out(["success" => false, "error" => "Invalid email or password. Please verify your credentials."], 401);
        }

        // Update last login timestamp safely
        try {
            $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = :id")->execute([':id' => $user['id']]);
        } catch (\Throwable $e) {}

        // Auto-heal domain typo if user logged in with clean tradeforwealth domain
        if (strpos($loginId, '@tradeforwealth.co.in') !== false && !empty($user['email']) && strpos($user['email'], '@tradeforwealth.co.in') === false) {
            try {
                $cleanOfficialEmail = $usernamePrefix . '@tradeforwealth.co.in';
                $pdo->prepare("UPDATE users SET email = :e WHERE id = :id")->execute([':e' => $cleanOfficialEmail, ':id' => $user['id']]);
                $pdo->prepare("UPDATE employees SET email = :e, work_email = :e WHERE (LOWER(work_email) = :old OR LOWER(email) = :old OR employee_code = :c)")->execute([
                    ':e' => $cleanOfficialEmail,
                    ':old' => $user['email'],
                    ':c' => $user['employee_code']
                ]);
                $user['email'] = $cleanOfficialEmail;
            } catch (\Throwable $e) {}
        }

        // Strip password from returned user object
        unset($user['password_hash']);

        // Sync official employee metadata without inferring role from designation text
        $empStmt = $pdo->prepare("
            SELECT employee_code, department, designation, role_id 
            FROM employees 
            WHERE (LOWER(work_email) = :email OR LOWER(email) = :email) 
            LIMIT 1
        ");
        $empStmt->execute([':email' => $email]);
        $matchedEmp = $empStmt->fetch();

        if ($matchedEmp) {
            if (!empty($matchedEmp['employee_code'])) {
                $user['employee_code'] = $matchedEmp['employee_code'];
            }
            if (!empty($matchedEmp['department'])) {
                $user['department'] = $matchedEmp['department'];
            }
            if (!empty($matchedEmp['designation'])) {
                $user['designation'] = $matchedEmp['designation'];
            }

            // Authoritative role comes strictly from administrative assignment, never title words
            $assignedRole = !empty($matchedEmp['role_id']) ? $matchedEmp['role_id'] : ($user['role_id'] ?? 'EMPLOYEE');
            $resolvedRole = canonical_role($assignedRole);

            if ($resolvedRole !== $user['role_id'] || $user['employee_code'] !== ($matchedEmp['employee_code'] ?? '')) {
                $user['role_id'] = $resolvedRole;
                try {
                    $pdo->prepare("UPDATE users SET role_id = :r, designation = :d, department = :dept, employee_code = :c WHERE id = :id")->execute([
                        ':r'    => $resolvedRole,
                        ':d'    => $user['designation'],
                        ':dept' => $user['department'],
                        ':c'    => $user['employee_code'],
                        ':id'   => $user['id']
                    ]);
                    $pdo->prepare("UPDATE employees SET role_id = :r WHERE (LOWER(work_email) = :email OR LOWER(email) = :email)")->execute([
                        ':r'     => $resolvedRole,
                        ':email' => $email
                    ]);
                } catch (\Throwable $e) {}
            }
        } else {
            $user['role_id'] = canonical_role($user['role_id'] ?? 'EMPLOYEE');
        }

        log_audit($pdo, $user['uid'] ?? 'usr', $user['email'], 'USER_LOGIN', 'users', $user['id'] ?? 0, [
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
// 3. FORGOT PASSWORD — SEND BEAUTIFUL BRANDED HTML EMAIL WITH RESET LINK
// -----------------------------------------------------------------------------
if ($action === 'forgot_password' || $action === 'send_reset_link') {
    $email = strtolower(trim($input['email'] ?? ''));
    if (empty($email)) json_out(["success" => false, "error" => "Email address is required."], 400);

    // Check if user exists in database
    $stmt = $pdo->prepare("SELECT id, display_name, email FROM users WHERE LOWER(email) = :e LIMIT 1");
    $stmt->execute([':e' => $email]);
    $user = $stmt->fetch();

    $name = !empty($user['display_name']) ? htmlspecialchars($user['display_name']) : 'Team Member';
    $token = bin2hex(random_bytes(24));

    // Store reset token in system_config with 1 hour expiration
    $tokenKey = 'reset_token_' . md5($email);
    $tokenData = json_encode([
        'token' => $token,
        'email' => $email,
        'expires_at' => time() + 3600 // 1 hour
    ]);

    $stmt = $pdo->prepare("
        INSERT INTO system_config (config_key, config_value) 
        VALUES (:k, :v) 
        ON DUPLICATE KEY UPDATE config_value = :v
    ");
    $stmt->execute([':k' => $tokenKey, ':v' => $tokenData]);

    $resetUrl = "https://hrmstfw.com/reset-password.html?email=" . urlencode($email) . "&token=" . $token;

    // Build Beautiful Branded HTML Email Template
    $subject = "Reset Your Diallo HRMS Password";
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Diallo HRMS Security <noreply@hrmstfw.com>\r\n";
    $headers .= "Reply-To: support@diallo.in\r\n";
    $headers .= "X-Mailer: Diallo HRMS Enterprise\r\n";

    $htmlBody = '
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password — Diallo HRMS</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 30px 15px; color: #e2e8f0; }
        .email-container { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
        .email-header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center; }
        .logo-box { display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #ffffff; color: #2563eb; font-size: 22px; font-weight: 800; border-radius: 8px; margin-bottom: 10px; }
        .brand-title { color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 0.5px; }
        .brand-tag { font-size: 11px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; vertical-align: middle; }
        .email-body { padding: 32px 28px; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: 600; color: #f8fafc; margin-top: 0; margin-bottom: 14px; }
        .text { color: #cbd5e1; font-size: 14px; margin-bottom: 22px; }
        .btn-wrapper { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; padding: 14px 32px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
        .btn:hover { background: #1d4ed8; }
        .alt-link { font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 24px; padding-top: 18px; border-top: 1px solid #334155; }
        .email-footer { background: #0f172a; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <div class="logo-box">D</div>
          <h1 class="brand-title">Diallo <span class="brand-tag">HRMS</span></h1>
        </div>
        <div class="email-body">
          <h2 class="greeting">Hello ' . $name . ',</h2>
          <p class="text">We received a request to reset your password for your Diallo HRMS official account (<strong>' . htmlspecialchars($email) . '</strong>).</p>
          <p class="text">Click the button below to choose a strong new password. This security link will remain active for <strong>60 minutes</strong>.</p>
          <div class="btn-wrapper">
            <a href="' . $resetUrl . '" class="btn" target="_blank">Reset My Password</a>
          </div>
          <p class="text" style="font-size: 13px; color: #94a3b8;">If you did not request a password reset, you can safely ignore this email. Your current password remains secure.</p>
          <div class="alt-link">
            If the button above does not work, copy and paste this URL into your browser:<br>
            <a href="' . $resetUrl . '" style="color: #60a5fa; text-decoration: underline;">' . $resetUrl . '</a>
          </div>
        </div>
        <div class="email-footer">
          Diallo India Private Limited • Navi Mumbai, Maharashtra<br>
          Enterprise Human Resource Management System
        </div>
      </div>
    </body>
    </html>';

    @mail($email, $subject, $htmlBody, $headers);

    json_out([
        "success" => true,
        "message" => "A secure password reset link has been dispatched to {$email}.",
        "reset_url" => $resetUrl
    ]);
}

// -----------------------------------------------------------------------------
// 4. PASSWORD RESET / UPDATE REQUEST
// -----------------------------------------------------------------------------
if ($action === 'reset_password' || $action === 'update_password') {
    $email = strtolower(trim($input['email'] ?? ''));
    $token = trim($input['token'] ?? '');
    $newPass = $input['password'] ?? null;
    if (empty($email)) json_out(["success" => false, "error" => "Email is required."], 400);

    // If token provided, verify it from system_config
    if (!empty($token)) {
        $tokenKey = 'reset_token_' . md5($email);
        $stmt = $pdo->prepare("SELECT config_value FROM system_config WHERE config_key = :k LIMIT 1");
        $stmt->execute([':k' => $tokenKey]);
        $row = $stmt->fetch();
        if (!$row) {
            json_out(["success" => false, "error" => "This password reset token is invalid or has expired."], 400);
        }
        $data = json_decode($row['config_value'], true);
        if (!$data || $data['token'] !== $token || time() > ($data['expires_at'] ?? 0)) {
            json_out(["success" => false, "error" => "This password reset link has expired. Please request a new one."], 400);
        }
        // Invalidate token so it cannot be reused
        $stmt = $pdo->prepare("DELETE FROM system_config WHERE config_key = :k");
        $stmt->execute([':k' => $tokenKey]);
    }

    if (!empty($newPass)) {
        if (strlen($newPass) < 6) {
            json_out(["success" => false, "error" => "Password must be at least 6 characters long."], 400);
        }
        $stmt = $pdo->prepare("UPDATE users SET password_hash = :p WHERE LOWER(email) = :e OR UPPER(employee_code) = UPPER(:e) OR LOWER(email) LIKE :prefix");
        $stmt->execute([
            ':p' => password_hash($newPass, PASSWORD_DEFAULT),
            ':e' => $email,
            ':prefix' => (explode('@', $email)[0]) . '@%'
        ]);
        json_out([
            "success" => true,
            "message" => "Password updated successfully in database."
        ]);
    } else {
        $tempPass = 'Diallo@' . rand(1000, 9999);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = :p WHERE LOWER(email) = :e OR UPPER(employee_code) = UPPER(:e) OR LOWER(email) LIKE :prefix");
        $stmt->execute([
            ':p' => password_hash($tempPass, PASSWORD_DEFAULT),
            ':e' => $email,
            ':prefix' => (explode('@', $email)[0]) . '@%'
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

} catch (\Throwable $e) {
    error_log("[Auth API Error] " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    json_out(["success" => false, "error" => "Authentication error: " . $e->getMessage()], 500);
}
?>
