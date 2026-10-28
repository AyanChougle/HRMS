<?php
// Set official application timezone strictly to Indian Standard Time (IST / UTC+05:30)
date_default_timezone_set('Asia/Kolkata');

// ==============================================================================
// DIALLO HRMS — CENTRAL DATABASE CONNECTION & API HELPERS
// Hostinger MySQL 8.0+ / PDO Connection
// Strictly 100% Hostinger Backend (Pure PHP/MySQL — Zero Firebase dependencies)
// ==============================================================================

// Enable CORS for frontend requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure JSON response header by default
header("Content-Type: application/json; charset=UTF-8");

// Start secure server-side session
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_samesite', 'Lax');
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        ini_set('session.cookie_secure', '1');
    }
    session_start();
}

// Try to load DB credentials from environment or .env file if available
$envLocations = [__DIR__ . '/../.env', __DIR__ . '/.env', $_SERVER['DOCUMENT_ROOT'] . '/.env'];
foreach ($envLocations as $envFile) {
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim(trim($val), '"\'');
                if (!getenv($key)) putenv("$key=$val");
            }
        }
        break;
    }
}

// Hostinger Database Configuration
$dbHost = '127.0.0.1';
$dbName = 'u147377699_HRMS';
$dbUser = 'u147377699_HRMSQL';
$dbPass = getenv('DB_PASS') ?: 'Diallo@2026';
$charset = 'utf8mb4';

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => true,
    PDO::ATTR_TIMEOUT            => 5
];

$pdo = null;
$lastError = '';

// Attempt connection: First via 127.0.0.1:3306, then localhost with verified user u147377699_HRMSQL
$hostsToTry = ['127.0.0.1', 'localhost'];
$usersToTry = ['u147377699_HRMSQL'];

foreach ($hostsToTry as $hostCandidate) {
    foreach ($usersToTry as $userCandidate) {
        try {
            $dsn = "mysql:host=$hostCandidate;port=3306;dbname=$dbName;charset=$charset";
            $pdo = new PDO($dsn, $userCandidate, $dbPass, $options);
            $pdo->exec("SET time_zone = '+05:30'");
            $dbUser = $userCandidate;
            break 2;
        } catch (\PDOException $ex) {
            $lastError = $ex->getMessage();
        }
    }
}

if (!$pdo) {
    error_log("[DB Error] Connection failed: " . $lastError);
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database connection error: " . $lastError,
        "details" => [
            "database" => $dbName,
            "user" => $dbUser,
            "tested_hosts" => $hostsToTry,
            "tip" => "Check database password and user privileges in Hostinger hPanel -> Databases -> MySQL Management."
        ]
    ]);
    exit();
}

// Auto-heal missing security tables on Hostinger MySQL
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `auth_tokens` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `token` VARCHAR(128) UNIQUE NOT NULL,
            `user_id` INT NOT NULL,
            `user_uid` VARCHAR(128) DEFAULT NULL,
            `user_email` VARCHAR(120) NOT NULL,
            `role_id` VARCHAR(50) NOT NULL,
            `ip_address` VARCHAR(45) DEFAULT NULL,
            `user_agent` TEXT DEFAULT NULL,
            `expires_at` DATETIME NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_token_lookup` (`token`),
            INDEX `idx_token_user` (`user_id`),
            INDEX `idx_token_expires` (`expires_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `password_resets` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `email` VARCHAR(120) NOT NULL,
            `token` VARCHAR(128) UNIQUE NOT NULL,
            `expires_at` DATETIME NOT NULL,
            `used` TINYINT(1) NOT NULL DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_pwd_reset_token` (`token`),
            INDEX `idx_pwd_reset_email` (`email`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `teams` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `department_id` INT DEFAULT NULL,
            `department_name` VARCHAR(100) DEFAULT 'Sales',
            `name` VARCHAR(120) NOT NULL,
            `code` VARCHAR(50) UNIQUE NOT NULL,
            `lead_employee_id` VARCHAR(128) DEFAULT NULL,
            `lead_name` VARCHAR(150) DEFAULT NULL,
            `description` TEXT DEFAULT NULL,
            `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_team_dept` (`department_name`),
            INDEX `idx_team_lead` (`lead_employee_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `documents` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `employee_id` VARCHAR(128) NOT NULL,
            `employee_code` VARCHAR(50) DEFAULT NULL,
            `title` VARCHAR(200) NOT NULL,
            `category` VARCHAR(80) NOT NULL DEFAULT 'GENERAL',
            `file_name` VARCHAR(255) NOT NULL,
            `file_path` TEXT NOT NULL,
            `file_size` INT DEFAULT 0,
            `file_type` VARCHAR(100) DEFAULT NULL,
            `uploaded_by` VARCHAR(128) DEFAULT NULL,
            `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_doc_emp` (`employee_id`),
            INDEX `idx_doc_cat` (`category`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Auto-normalize mismatched employee_id in attendance_records
    try {
        $pdo->exec("
            UPDATE attendance_records a
            JOIN employees e ON (a.employee_code = e.employee_code AND a.employee_code != '')
            SET a.employee_id = e.id
            WHERE a.employee_id != e.id
        ");

        // Universal Auto-fix for skewed gross_minutes across attendance_records
        $pdo->exec("
            UPDATE attendance_records 
            SET gross_minutes = TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(date, ' ', check_in), '%Y-%m-%d %h:%i %p'), STR_TO_DATE(CONCAT(date, ' ', check_out), '%Y-%m-%d %h:%i %p')),
                gross_hours_formatted = CONCAT(
                    FLOOR(TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(date, ' ', check_in), '%Y-%m-%d %h:%i %p'), STR_TO_DATE(CONCAT(date, ' ', check_out), '%Y-%m-%d %h:%i %p')) / 60),
                    'h ',
                    LPAD(MOD(TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(date, ' ', check_in), '%Y-%m-%d %h:%i %p'), STR_TO_DATE(CONCAT(date, ' ', check_out), '%Y-%m-%d %h:%i %p')), 60), 2, '0'),
                    'm'
                )
            WHERE check_in IS NOT NULL AND check_out IS NOT NULL 
              AND check_in != '' AND check_out != ''
              AND check_in LIKE '%:%M' AND check_out LIKE '%:%M'
              AND STR_TO_DATE(CONCAT(date, ' ', check_out), '%Y-%m-%d %h:%i %p') >= STR_TO_DATE(CONCAT(date, ' ', check_in), '%Y-%m-%d %h:%i %p')
              AND ABS(gross_minutes - TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(date, ' ', check_in), '%Y-%m-%d %h:%i %p'), STR_TO_DATE(CONCAT(date, ' ', check_out), '%Y-%m-%d %h:%i %p'))) > 10;
        ");

        // Auto-clean legacy duplicate employee entries in MySQL
        $pdo->exec("
            DELETE FROM employees WHERE id = 'emp_emp0001' AND EXISTS (SELECT 1 FROM users WHERE uid = 'super_admin_ayan');
            DELETE FROM employees WHERE id = 'Q7DWXwGStNNies9E6HSF' AND EXISTS (SELECT 1 FROM employees WHERE id = 'ehyJCFxLSVZwaDqNo3SWAs5UwJt2');
            DELETE FROM users WHERE uid = 'Q7DWXwGStNNies9E6HSF' AND EXISTS (SELECT 1 FROM employees WHERE id = 'ehyJCFxLSVZwaDqNo3SWAs5UwJt2');
        ");

        // Auto Punch-Out Sweep: Closes forgotten shifts at 9:00 PM and marks as HALF_DAY
        $nowDate = date('Y-m-d');
        $nowHourMin = date('H:i');
        $pdo->prepare("
            UPDATE attendance_records
            SET check_out = '09:00 PM',
                check_out_iso = CONCAT(date, ' 21:00:00'),
                status = 'HALF_DAY',
                is_on_break = 0,
                device = CASE 
                    WHEN device IS NULL OR device = '' THEN 'Auto Punched Out (9:00 PM System)'
                    WHEN device NOT LIKE '%Auto Punched Out%' THEN CONCAT(device, ' | Auto Punched Out (9:00 PM System)')
                    ELSE device
                END,
                gross_minutes = GREATEST(0, TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(date, ' ', check_in), '%Y-%m-%d %h:%i %p'), STR_TO_DATE(CONCAT(date, ' 09:00 PM'), '%Y-%m-%d %h:%i %p'))),
                gross_hours_formatted = CONCAT(
                    FLOOR(GREATEST(0, TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(date, ' ', check_in), '%Y-%m-%d %h:%i %p'), STR_TO_DATE(CONCAT(date, ' 09:00 PM'), '%Y-%m-%d %h:%i %p'))) / 60),
                    'h ',
                    LPAD(MOD(GREATEST(0, TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(date, ' ', check_in), '%Y-%m-%d %h:%i %p'), STR_TO_DATE(CONCAT(date, ' 09:00 PM'), '%Y-%m-%d %h:%i %p'))), 60), 2, '0'),
                    'm'
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE check_in IS NOT NULL AND check_in != ''
              AND (check_out IS NULL OR check_out = '' OR check_out = '-')
              AND (
                  date < :today
                  OR (date = :today AND :now_time >= '21:00')
              )
        ")->execute([':today' => $nowDate, ':now_time' => $nowHourMin]);
    } catch (\Throwable $e) {}
} catch (\Throwable $patchErr) {
    // Non-fatal
}

/**
 * Standardized JSON response helper
 */
function json_out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * Get parsed JSON input body
 */
function get_json_input() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Audit log helper
 */
function log_audit($pdo, $actor_id, $actor_email, $action, $resource_type, $resource_id, $meta = []) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO audit_logs (operation_id, actor_user_id, actor_email, action, resource_type, resource_id, metadata_json, user_agent, ip_address)
            VALUES (:op, :aid, :aemail, :action, :rtype, :rid, :meta, :ua, :ip)
        ");
        $stmt->execute([
            ':op' => 'OP_' . bin2hex(random_bytes(6)),
            ':aid' => $actor_id ?: 'system',
            ':aemail' => $actor_email ?: 'system',
            ':action' => $action,
            ':rtype' => $resource_type,
            ':rid' => (string)$resource_id,
            ':meta' => json_encode($meta),
            ':ua' => substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 255),
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
        ]);
    } catch (\Throwable $e) {
        // Non-blocking audit failure
    }
}

/**
 * Canonical Role Normalization (Strict 7 Roles: ADMIN, HR, OPS, COMPLIANCE, MANAGER, TL, EMPLOYEE)
 */
if (!function_exists('canonical_role')) {
    function canonical_role($r) {
        $clean = strtoupper(trim($r ?? 'EMPLOYEE'));
        $map = [
            'SUPER_ADMIN' => 'ADMIN',
            'COMPANY_ADMIN' => 'ADMIN',
            'ADMIN' => 'ADMIN',
            'HR_MANAGER' => 'HR',
            'HR' => 'HR',
            'OPERATIONS_MANAGER' => 'OPS',
            'PROCESS_OWNER' => 'OPS',
            'OPS' => 'OPS',
            'COMPLIANCE' => 'COMPLIANCE',
            'COMPLIANCE_OFFICER' => 'COMPLIANCE',
            'MANAGER' => 'MANAGER',
            'DEPARTMENT_MANAGER' => 'MANAGER',
            'TEAM_LEAD' => 'TL',
            'TL' => 'TL',
            'EMPLOYEE' => 'EMPLOYEE',
            'RELATIONSHIP_MANAGER' => 'EMPLOYEE',
            'DIGITAL_MARKETING' => 'EMPLOYEE',
            'MENTOR_TRAINER' => 'EMPLOYEE',
            'TRAINER' => 'EMPLOYEE',
            'TRAINEE' => 'EMPLOYEE',
            'SALES' => 'EMPLOYEE'
        ];
        return $map[$clean] ?? 'EMPLOYEE';
    }
}

/**
 * Extract Bearer Auth Token from HTTP headers
 */
function get_bearer_token() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    if (!empty($headers) && preg_match('/Bearer\s(\S+)/i', $headers, $matches)) {
        return $matches[1];
    }
    return null;
}

/**
 * Get current authenticated user or return null
 */
function get_current_user_or_null($pdo) {
    if (!$pdo) return null;

    $token = get_bearer_token();
    $userId = null;

    if (!empty($token)) {
        try {
            $stmt = $pdo->prepare("SELECT user_id, expires_at FROM auth_tokens WHERE token = :t LIMIT 1");
            $stmt->execute([':t' => $token]);
            $row = $stmt->fetch();
            if ($row && strtotime($row['expires_at']) > time()) {
                $userId = $row['user_id'];
            }
        } catch (\Throwable $e) {}
    }

    if (!$userId && !empty($_SESSION['user']['id'])) {
        $userId = $_SESSION['user']['id'];
    }

    if (!$userId) return null;

    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch();
        if (!$user || ($user['status'] ?? '') === 'SUSPENDED') {
            return null;
        }

        // Hydrate employee profile
        $empStmt = $pdo->prepare("SELECT id as emp_id, employee_code, department, team_id, team_name, designation, role_id, manager_id, manager, team_lead_id, team_lead FROM employees WHERE user_id = :uid OR id = :uid OR email = :email LIMIT 1");
        $empStmt->execute([':uid' => $user['uid'] ?: $user['id'], ':email' => $user['email']]);
        $emp = $empStmt->fetch();

        $canonical = canonical_role($emp['role_id'] ?? $user['role_id'] ?? 'EMPLOYEE');
        $user['role_id'] = $canonical;
        $user['employee_id'] = $emp['emp_id'] ?? ($user['uid'] ?: $user['id']);
        $user['employee_code'] = $emp['employee_code'] ?? ($user['employee_code'] ?? '');
        $user['department'] = $emp['department'] ?? ($user['department'] ?? 'Operations');
        $user['team_id'] = $emp['team_id'] ?? null;
        $user['team_name'] = $emp['team_name'] ?? null;
        $user['team_lead_id'] = $emp['team_lead_id'] ?? null;
        $user['manager_id'] = $emp['manager_id'] ?? null;
        $user['designation'] = $emp['designation'] ?? ($user['designation'] ?? 'Associate');

        unset($user['password_hash']);
        return $user;
    } catch (\Throwable $e) {
        return null;
    }
}

/**
 * Require valid authenticated user or terminate with 401 Unauthorized
 */
function require_authenticated_user($pdo) {
    $user = get_current_user_or_null($pdo);
    if (!$user) {
        json_out([
            "success" => false,
            "error" => "Authentication required. Please sign in.",
            "code" => "UNAUTHENTICATED"
        ], 401);
    }
    return $user;
}

/**
 * Enforce strict role authorization or terminate with 403 Forbidden
 */
function require_role($pdo, $allowedRoles = []) {
    $user = require_authenticated_user($pdo);
    $role = canonical_role($user['role_id'] ?? 'EMPLOYEE');

    // System ADMIN has universal override
    if ($role === 'ADMIN') {
        return $user;
    }

    $normalizedAllowed = array_map('strtoupper', (array)$allowedRoles);
    if (!in_array($role, $normalizedAllowed)) {
        json_out([
            "success" => false,
            "error" => "Access denied: Your account role ($role) does not have permission for this operation.",
            "code" => "FORBIDDEN"
        ], 403);
    }
    return $user;
}
?>
