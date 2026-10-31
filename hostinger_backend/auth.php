<?php
// ==============================================================================
// DIALLO HRMS — SECURE SERVER-SIDE AUTHENTICATION & SESSION ENGINE
// 100% Hostinger MySQL & PHP — Zero Firebase Dependencies
// ==============================================================================

require_once 'db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$input = get_json_input();

if (empty($action) && isset($input['action'])) {
    $action = $input['action'];
}

try {
    // -------------------------------------------------------------------------
    // 1. SIGN IN (AUTHENTICATION — 100% Hostinger MySQL Backend)
    // -------------------------------------------------------------------------
    if ($action === 'login') {
        $rawLogin = trim($input['email'] ?? $input['username'] ?? $input['employee_code'] ?? '');
        $loginId = strtolower($rawLogin);
        $rawPassword = (string)($input['password'] ?? '');
        $password = trim($rawPassword);

        if (empty($loginId) || $password === '') {
            json_out(["success" => false, "error" => "Email/Employee ID and password are required."], 400);
        }

        $cleanLoginCode = strtoupper(str_replace(['-', ' '], '', $rawLogin));

        // 1. Find user in users table by Email, Employee Code, UID, or numeric ID
        $stmt = $pdo->prepare("
            SELECT * FROM users 
            WHERE LOWER(TRIM(email)) = :login1 
               OR UPPER(TRIM(employee_code)) = UPPER(:login2)
               OR UPPER(REPLACE(TRIM(employee_code), '-', '')) = :cleancode
               OR uid = :login3
               OR id = :login4
            LIMIT 1
        ");
        $stmt->execute([
            ':login1' => $loginId,
            ':login2' => $rawLogin,
            ':cleancode' => $cleanLoginCode,
            ':login3' => $rawLogin,
            ':login4' => is_numeric($rawLogin) ? intval($rawLogin) : -1
        ]);
        $user = $stmt->fetch();

        // 2. If not found in users table, fallback check employees master
        $empFound = null;
        if (!$user) {
            $eStmt = $pdo->prepare("
                SELECT * FROM employees 
                WHERE LOWER(TRIM(email)) = :login1 
                   OR LOWER(TRIM(work_email)) = :login1 
                   OR UPPER(TRIM(employee_code)) = UPPER(:login2)
                   OR UPPER(REPLACE(TRIM(employee_code), '-', '')) = :cleancode
                   OR id = :login3
                   OR user_id = :login3
                LIMIT 1
            ");
            $eStmt->execute([
                ':login1' => $loginId,
                ':login2' => $rawLogin,
                ':cleancode' => $cleanLoginCode,
                ':login3' => $rawLogin
            ]);
            $empFound = $eStmt->fetch();

            if ($empFound) {
                $userUid = !empty($empFound['user_id']) ? $empFound['user_id'] : ('emp_' . strtolower(str_replace(['-', ' '], '', $empFound['employee_code'] ?: bin2hex(random_bytes(4)))));
                $userEmail = !empty($empFound['email']) ? $empFound['email'] : $empFound['work_email'];
                $userPass = !empty($empFound['initial_password']) ? $empFound['initial_password'] : (!empty($empFound['password_hash']) ? $empFound['password_hash'] : 'TradeForWealth@2026');

                try {
                    $pdo->prepare("
                        INSERT INTO users (
                            uid, employee_code, email, display_name, first_name, last_name, phone,
                            role_id, department, designation, branch_name, status, password_hash, initial_password
                        ) VALUES (
                            :uid, :code, :email, :name, :fname, :lname, :phone,
                            :role, :dept, :desig, :bname, 'ACTIVE', :phash, :init_pwd
                        )
                        ON DUPLICATE KEY UPDATE
                            employee_code = VALUES(employee_code),
                            display_name = VALUES(display_name),
                            role_id = VALUES(role_id)
                    ")->execute([
                        ':uid' => $userUid,
                        ':code' => $empFound['employee_code'],
                        ':email' => strtolower(trim($userEmail)),
                        ':name' => $empFound['full_name'] ?: trim(($empFound['first_name'] ?? '') . ' ' . ($empFound['last_name'] ?? '')),
                        ':fname' => $empFound['first_name'],
                        ':lname' => $empFound['last_name'],
                        ':phone' => $empFound['phone'],
                        ':role' => canonical_role($empFound['role_id']),
                        ':dept' => $empFound['department'] ?: 'Operations',
                        ':desig' => $empFound['designation'] ?: 'Associate',
                        ':bname' => $empFound['branch_name'] ?: 'HQ - Mumbai',
                        ':phash' => $userPass,
                        ':init_pwd' => $userPass
                    ]);
                } catch (\Throwable $e) {}

                $stmt->execute([
                    ':login1' => strtolower(trim($userEmail)),
                    ':login2' => $empFound['employee_code'],
                    ':cleancode' => $cleanLoginCode,
                    ':login3' => $userUid,
                    ':login4' => -1
                ]);
                $user = $stmt->fetch();
            }
        }

        if (!$user) {
            json_out(["success" => false, "error" => "User account not found in database. Please verify your email or employee ID."], 401);
        }

        // Account status check
        if (isset($user['status']) && strtoupper($user['status']) === 'SUSPENDED') {
            json_out(["success" => false, "error" => "This account is suspended. Please contact HR Administration."], 403);
        }

        // Gather all potential password candidates across columns and tables
        $candidates = [];
        if (!empty($user['password_hash'])) $candidates[] = (string)$user['password_hash'];
        if (!empty($user['initial_password'])) $candidates[] = (string)$user['initial_password'];
        if (!empty($empFound['password_hash'])) $candidates[] = (string)$empFound['password_hash'];
        if (!empty($empFound['initial_password'])) $candidates[] = (string)$empFound['initial_password'];

        // Root super admin master override
        if ($user['email'] === 'ayanislight@gmail.com' || strtolower($user['employee_code'] ?? '') === 'd0001') {
            $candidates[] = 'Diallo@2026';
        }

        // Comprehensive password verification
        $passwordValid = false;
        foreach ($candidates as $cand) {
            $c = trim($cand);
            if ($c === '') continue;

            // 1. Plaintext exact match
            if ($c === $password || $cand === $password || $c === $rawPassword) {
                $passwordValid = true;
                break;
            }

            // 2. Plaintext case-insensitive match
            if (strcasecmp($c, $password) === 0) {
                $passwordValid = true;
                break;
            }

            // 3. Bcrypt / Argon2 hash verification
            if (strpos($c, '$2y$') === 0 || strpos($c, '$2a$') === 0 || strpos($c, '$2b$') === 0 || strpos($c, '$argon2') === 0) {
                if (password_verify($password, $c) || password_verify($rawPassword, $c)) {
                    $passwordValid = true;
                    break;
                }
            }

            // 4. MD5 hash (phpMyAdmin MD5 function)
            if (strcasecmp($c, md5($password)) === 0 || strcasecmp($c, md5($rawPassword)) === 0) {
                $passwordValid = true;
                break;
            }

            // 5. SHA1 / SHA256 hash
            if (strcasecmp($c, sha1($password)) === 0 || strcasecmp($c, hash('sha256', $password)) === 0) {
                $passwordValid = true;
                break;
            }
        }

        if (!$passwordValid) {
            json_out(["success" => false, "error" => "Invalid email or password. Please verify your credentials."], 401);
        }

        // Successful authentication: ensure initial_password is saved
        try {
            $pdo->prepare("
                UPDATE users 
                SET initial_password = COALESCE(NULLIF(initial_password, ''), :pwd),
                    last_login_at = NOW() 
                WHERE id = :id
            ")->execute([
                ':pwd' => $password,
                ':id' => $user['id']
            ]);
        } catch (\Throwable $e) {}

        // Regenerate PHP session ID securely
        session_regenerate_id(true);

        // Generate cryptographically random Bearer Auth Token
        $token = bin2hex(random_bytes(32));
        $tokenExpires = date('Y-m-d H:i:s', time() + (30 * 86400)); // 30 Days

        // Save token in auth_tokens table
        try {
            $tokStmt = $pdo->prepare("
                INSERT INTO auth_tokens (token, user_id, user_uid, user_email, role_id, ip_address, user_agent, expires_at)
                VALUES (:token, :uid, :uuid, :email, :role, :ip, :ua, :exp)
            ");
            $tokStmt->execute([
                ':token' => $token,
                ':uid' => $user['id'],
                ':uuid' => $user['uid'] ?: ('usr_' . $user['id']),
                ':email' => $user['email'],
                ':role' => canonical_role($user['role_id']),
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
                ':ua' => substr($_SERVER['HTTP_USER_AGENT'] ?? 'Web', 0, 255),
                ':exp' => $tokenExpires
            ]);
        } catch (\Throwable $e) {}

        // Hydrate employee data (team, department, designation, employee_code)
        $empStmt = $pdo->prepare("
            SELECT id as emp_id, employee_code, department, team_id, team_name, designation, role_id, manager_id, manager, team_lead_id, team_lead 
            FROM employees 
            WHERE (LOWER(work_email) = :email OR LOWER(email) = :email OR user_id = :uid OR id = :uid)
            LIMIT 1
        ");
        $empStmt->execute([
            ':email' => strtolower($user['email']),
            ':uid' => $user['uid'] ?: $user['id']
        ]);
        $emp = $empStmt->fetch();

        $canonical = canonical_role($emp['role_id'] ?? $user['role_id'] ?? 'EMPLOYEE');
        $user['role_id'] = $canonical;
        $user['employee_id'] = $emp['emp_id'] ?? ($user['uid'] ?: $user['id']);
        $user['employee_code'] = $emp['employee_code'] ?? ($user['employee_code'] ?? '');
        $user['department'] = $emp['department'] ?? ($user['department'] ?? 'Operations');
        $user['team_id'] = $emp['team_id'] ?? null;
        $user['team_name'] = $emp['team_name'] ?? null;
        $user['team_lead_id'] = $emp['team_lead_id'] ?? null;
        $user['team_lead'] = $emp['team_lead'] ?? null;
        $user['manager_id'] = $emp['manager_id'] ?? null;
        $user['manager'] = $emp['manager'] ?? null;
        $user['designation'] = $emp['designation'] ?? ($user['designation'] ?? 'Associate');

        // Remove sensitive fields
        unset($user['password_hash']);

        // Save into server session
        $_SESSION['user'] = $user;
        $_SESSION['auth_token'] = $token;

        log_audit($pdo, $user['employee_id'], $user['email'], 'USER_LOGIN_SUCCESS', 'users', $user['id'], [
            'role' => $user['role_id']
        ]);

        json_out([
            "success" => true,
            "message" => "Login successful",
            "user" => $user,
            "token" => $token
        ]);
    }

    // -------------------------------------------------------------------------
    // 2. CHECK SESSION / VERIFY CURRENT USER
    // -------------------------------------------------------------------------
    if ($action === 'check' || $action === 'me') {
        $user = get_current_user_or_null($pdo);
        if (!$user) {
            json_out([
                "success" => true,
                "authenticated" => false,
                "user" => null,
                "message" => "No active session."
            ]);
        }

        json_out([
            "success" => true,
            "authenticated" => true,
            "user" => $user
        ]);
    }

    // -------------------------------------------------------------------------
    // 3. SIGN OUT (LOGOUT)
    // -------------------------------------------------------------------------
    if ($action === 'logout') {
        $token = get_bearer_token();
        if (!empty($token)) {
            try {
                $pdo->prepare("DELETE FROM auth_tokens WHERE token = :t")->execute([':t' => $token]);
            } catch (\Throwable $e) {}
        }

        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();

        json_out([
            "success" => true,
            "message" => "Logged out successfully"
        ]);
    }

    // -------------------------------------------------------------------------
    // 4. FORGOT PASSWORD (CRYPTOGRAPHIC TOKEN GENERATION)
    // -------------------------------------------------------------------------
    if ($action === 'forgot_password' || $action === 'send_reset_link') {
        $email = strtolower(trim($input['email'] ?? ''));
        if (empty($email)) {
            json_out(["success" => false, "error" => "Email address is required."], 400);
        }

        $stmt = $pdo->prepare("SELECT id, display_name, email FROM users WHERE LOWER(email) = :e LIMIT 1");
        $stmt->execute([':e' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            // Check employees table
            $empStmt = $pdo->prepare("SELECT id, full_name as display_name, email, work_email FROM employees WHERE LOWER(work_email) = :e OR LOWER(email) = :e LIMIT 1");
            $empStmt->execute([':e' => $email]);
            $user = $empStmt->fetch();
        }

        if (!$user) {
            json_out(["success" => false, "error" => "No registered account found with that email address."], 404);
        }

        $name = !empty($user['display_name']) ? htmlspecialchars($user['display_name']) : 'Team Member';
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour

        // Save to password_resets table
        $stmt = $pdo->prepare("INSERT INTO password_resets (email, token, expires_at, used) VALUES (:e, :t, :exp, 0)");
        $stmt->execute([':e' => $email, ':t' => $token, ':exp' => $expires]);

        $resetUrl = "https://hrmstfw.com/reset-password.html?email=" . urlencode($email) . "&token=" . $token;

        $subject = "Reset Your Diallo HRMS Password";
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: Diallo HRMS Security <noreply@hrmstfw.com>\r\n";
        $headers .= "Reply-To: support@diallo.in\r\n";

        $htmlBody = '
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Reset Your Password</title></head>
        <body style="font-family: Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 30px; color: #e2e8f0;">
          <div style="max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden;">
            <div style="background: #2563eb; padding: 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 20px;">Diallo HRMS Security</h1>
            </div>
            <div style="padding: 28px; line-height: 1.6;">
              <h2 style="font-size: 16px; margin-top: 0;">Hello ' . $name . ',</h2>
              <p>We received a request to reset your password for your Diallo HRMS account (<strong>' . htmlspecialchars($email) . '</strong>).</p>
              <p>Click the button below to choose a strong new password. This link expires in 60 minutes.</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="' . $resetUrl . '" style="background: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">If you did not request a password reset, you can safely disregard this email.</p>
            </div>
          </div>
        </body>
        </html>';

        @mail($email, $subject, $htmlBody, $headers);

        log_audit($pdo, (string)$user['id'], $email, 'PASSWORD_RESET_REQUESTED', 'password_resets', $token);

        json_out([
            "success" => true,
            "message" => "Password reset instructions have been sent to your email address.",
            "reset_url" => $resetUrl
        ]);
    }

    // -------------------------------------------------------------------------
    // 4.5. VERIFY RESET TOKEN
    // -------------------------------------------------------------------------
    if ($action === 'verify_reset_token') {
        $token = trim($_GET['token'] ?? $input['token'] ?? '');
        if (empty($token)) {
            json_out(["success" => false, "error" => "Token is required."], 400);
        }

        $stmt = $pdo->prepare("
            SELECT id, email, expires_at, used 
            FROM password_resets 
            WHERE token = :t 
            ORDER BY id DESC LIMIT 1
        ");
        $stmt->execute([':t' => $token]);
        $row = $stmt->fetch();

        if (!$row || intval($row['used']) === 1) {
            json_out(["success" => false, "error" => "This password reset token is invalid or has already been used."], 400);
        }
        if (strtotime($row['expires_at']) < time()) {
            json_out(["success" => false, "error" => "This password reset link has expired."], 400);
        }

        json_out(["success" => true, "email" => $row['email'], "valid" => true]);
    }

    // -------------------------------------------------------------------------
    // 5. RESET PASSWORD WITH TOKEN OR ADMIN TEMPORARY PASSWORD
    // -------------------------------------------------------------------------
    if ($action === 'reset_password' || $action === 'update_password') {
        $email = strtolower(trim($input['email'] ?? ''));
        $token = trim($input['token'] ?? '');
        $newPass = (string)($input['password'] ?? '');

        // Admin direct temporary password reset (e.g. from Users management view)
        if (empty($token) && !empty($email) && empty($newPass)) {
            $userAuth = get_current_user_or_null($pdo);
            $userRole = canonical_role($userAuth['role_id'] ?? '');
            if (in_array($userRole, ['ADMIN', 'HR', 'SUPER_ADMIN', 'COMPANY_ADMIN'])) {
                $tempPassword = 'Diallo@' . rand(1000, 9999);
                $tempHash = password_hash($tempPassword, PASSWORD_DEFAULT);
                $up = $pdo->prepare("UPDATE users SET password_hash = :p WHERE LOWER(email) = :e");
                $up->execute([':p' => $tempHash, ':e' => $email]);
                json_out([
                    "success" => true,
                    "message" => "Temporary password generated.",
                    "temporary_password" => $tempPassword
                ]);
            }
        }

        // Auto-resolve email from token if missing
        if (empty($email) && !empty($token)) {
            $tStmt = $pdo->prepare("SELECT email FROM password_resets WHERE token = :t AND used = 0 ORDER BY id DESC LIMIT 1");
            $tStmt->execute([':t' => $token]);
            $tRow = $tStmt->fetch();
            if ($tRow) {
                $email = strtolower(trim($tRow['email']));
            }
        }

        if (empty($email) || empty($token) || empty($newPass)) {
            json_out(["success" => false, "error" => "Email, token, and new password are required."], 400);
        }

        if (strlen($newPass) < 6) {
            json_out(["success" => false, "error" => "Password must be at least 6 characters in length."], 400);
        }

        // Verify token in password_resets
        $stmt = $pdo->prepare("
            SELECT id, expires_at, used 
            FROM password_resets 
            WHERE LOWER(email) = :e AND token = :t 
            ORDER BY id DESC LIMIT 1
        ");
        $stmt->execute([':e' => $email, ':t' => $token]);
        $resetRecord = $stmt->fetch();

        if (!$resetRecord || intval($resetRecord['used']) === 1) {
            json_out(["success" => false, "error" => "This password reset token is invalid or has already been used."], 400);
        }

        if (strtotime($resetRecord['expires_at']) < time()) {
            json_out(["success" => false, "error" => "This password reset link has expired. Please request a new link."], 400);
        }

        // Hash new password and update user
        $newHash = password_hash($newPass, PASSWORD_DEFAULT);
        $upStmt = $pdo->prepare("
            UPDATE users 
            SET password_hash = :p, failed_attempts = 0, locked_until = NULL 
            WHERE LOWER(email) = :e
        ");
        $upStmt->execute([':p' => $newHash, ':e' => $email]);

        // Invalidate token
        $pdo->prepare("UPDATE password_resets SET used = 1 WHERE id = :id")->execute([':id' => $resetRecord['id']]);

        // Invalidate any active sessions for this email to enforce re-login
        $pdo->prepare("DELETE FROM auth_tokens WHERE LOWER(user_email) = :e")->execute([':e' => $email]);

        log_audit($pdo, 'system', $email, 'PASSWORD_RESET_SUCCESSFUL', 'users', $email);

        json_out([
            "success" => true,
            "message" => "Your password has been reset successfully. Please sign in with your new password."
        ]);
    }

    // -------------------------------------------------------------------------
    // 6. CHANGE PASSWORD (AUTHENTICATED USER)
    // -------------------------------------------------------------------------
    if ($action === 'change_password') {
        $currentUser = require_authenticated_user($pdo);
        $currentPass = (string)($input['current_password'] ?? '');
        $newPass = (string)($input['new_password'] ?? '');

        if (empty($currentPass) || empty($newPass)) {
            json_out(["success" => false, "error" => "Current password and new password are required."], 400);
        }

        if (strlen($newPass) < 6) {
            json_out(["success" => false, "error" => "New password must be at least 6 characters in length."], 400);
        }

        // Fetch user password hash
        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $currentUser['id']]);
        $storedHash = $stmt->fetchColumn();

        if (empty($storedHash) || !password_verify($currentPass, $storedHash)) {
            json_out(["success" => false, "error" => "Current password is incorrect."], 400);
        }

        $newHash = password_hash($newPass, PASSWORD_DEFAULT);
        $pdo->prepare("UPDATE users SET password_hash = :p WHERE id = :id")->execute([
            ':p' => $newHash,
            ':id' => $currentUser['id']
        ]);

        log_audit($pdo, $currentUser['employee_id'], $currentUser['email'], 'PASSWORD_CHANGED', 'users', $currentUser['id']);

        json_out([
            "success" => true,
            "message" => "Password changed successfully."
        ]);
    }

    json_out(["success" => false, "error" => "Invalid authentication action."], 400);

} catch (\Throwable $e) {
    error_log("[Auth Error] " . $e->getMessage());
    json_out([
        "success" => false,
        "error" => "Authentication service error: " . $e->getMessage()
    ], 500);
}
?>
