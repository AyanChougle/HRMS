<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = get_json_input();

// -----------------------------------------------------------------------------
// GET: Fetch all active departments dynamically from DB
// -----------------------------------------------------------------------------
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM departments WHERE status = 'ACTIVE' ORDER BY name ASC");
    $departments = $stmt->fetchAll();
    json_out([
        "success" => true,
        "count" => count($departments),
        "departments" => $departments
    ]);
}

// -----------------------------------------------------------------------------
// POST: Create or Update Department dynamically
// -----------------------------------------------------------------------------
if ($method === 'POST') {
    $name = trim($input['name'] ?? '');
    $code = strtoupper(trim($input['code'] ?? ''));
    $head = trim($input['head_name'] ?? '');
    $desc = trim($input['description'] ?? '');

    if (empty($name)) {
        json_out(["success" => false, "error" => "Department name is required."], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO departments (name, code, head_name, description, status)
        VALUES (:name, :code, :head, :desc, 'ACTIVE')
        ON DUPLICATE KEY UPDATE code = :code, head_name = :head, description = :desc
    ");
    $stmt->execute([
        ':name' => $name,
        ':code' => $code,
        ':head' => $head,
        ':desc' => $desc
    ]);

    json_out(["success" => true, "message" => "Department saved successfully."]);
}
?>
