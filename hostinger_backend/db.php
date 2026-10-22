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
$envFile = __DIR__ . '/../.env';
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
}

// Hostinger Database Configuration (dynamic with fallback)
$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_NAME') ?: 'u147377699_HRMS';
$user = getenv('DB_USER') ?: 'u147377699_HRMS';
$pass = getenv('DB_PASS') ?: 'Diallo@2026';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    error_log("[DB Error] Connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database connection error. Please verify database service status."
    ]);
    exit();
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
