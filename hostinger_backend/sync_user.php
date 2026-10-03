<?php
require_once 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Only POST method is allowed"]);
    exit();
}

// Get JSON payload
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['employee_code']) || !isset($data['email']) || !isset($data['full_name'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit();
}

try {
    // Insert or Update the user record
    $stmt = $pdo->prepare("
        INSERT INTO users (employee_code, email, full_name, role) 
        VALUES (:employee_code, :email, :full_name, :role)
        ON DUPLICATE KEY UPDATE 
            full_name = :full_name,
            role = :role,
            updated_at = CURRENT_TIMESTAMP
    ");
    
    $stmt->execute([
        'employee_code' => $data['employee_code'],
        'email' => $data['email'],
        'full_name' => $data['full_name'],
        'role' => $data['role'] ?? 'employee'
    ]);
    
    echo json_encode(["success" => true, "message" => "User synchronized successfully"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
