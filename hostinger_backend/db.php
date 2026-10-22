<?php
// ==============================================================================
// DIALLO HRMS — CENTRAL DATABASE CONNECTION & API HELPERS
// Hostinger MySQL 8.0+ / PDO Connection
// ==============================================================================

// Enable CORS for frontend requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure JSON response header by default
header("Content-Type: application/json; charset=UTF-8");

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
    PDO::ATTR_EMULATE_PREPARES   => false,
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

try {
    // Auto-heal legacy users table schema if older columns detected
    try {
        $cols = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
        if (!empty($cols)) {
            if (!in_array('uid', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN uid VARCHAR(128) UNIQUE AFTER id");
            }
            if (!in_array('password_hash', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER email");
            }
            if (!in_array('display_name', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN display_name VARCHAR(150) DEFAULT NULL AFTER email");
                if (in_array('full_name', $cols)) {
                    $pdo->exec("UPDATE users SET display_name = full_name WHERE display_name IS NULL OR display_name = ''");
                }
            }
            if (!in_array('first_name', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN first_name VARCHAR(80) DEFAULT NULL");
            }
            if (!in_array('last_name', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN last_name VARCHAR(80) DEFAULT NULL");
            }
            if (!in_array('phone', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(30) DEFAULT NULL");
            }
            if (!in_array('role_id', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN role_id VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE'");
                if (in_array('role', $cols)) {
                    $pdo->exec("UPDATE users SET role_id = role WHERE role_id = 'EMPLOYEE'");
                }
            }
            if (!in_array('department', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT 'Operations'");
            }
            if (!in_array('designation', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN designation VARCHAR(100) DEFAULT 'Associate'");
            }
            if (!in_array('status', $cols)) {
                $pdo->exec("ALTER TABLE users ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'");
            }
        }
    } catch (\Throwable $patchErr) {
        // Table doesn't exist yet or user lacks alter privileges; non-fatal
    }
} catch (\Throwable $initErr) {
    // Non-fatal initialization warning
    error_log("[DB Init Warning] " . $initErr->getMessage());
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
            ':aid' => $actor_id,
            ':aemail' => $actor_email,
            ':action' => $action,
            ':rtype' => $resource_type,
            ':rid' => (string)$resource_id,
            ':meta' => json_encode($meta),
            ':ua' => substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 255),
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
        ]);
    } catch (\Exception $e) {
        // Non-blocking audit failure
    }
}
?>
