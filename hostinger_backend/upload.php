<?php
require_once 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Only POST method is allowed"]);
    exit();
}

if (!isset($_FILES['file']) || !isset($_POST['employee_code'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing file or employee_code"]);
    exit();
}

$employee_code = $_POST['employee_code'];
$file = $_FILES['file'];

// Create uploads directory if it doesn't exist
$uploadDir = 'uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate secure file name
$fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$secureFileName = uniqid($employee_code . '_') . '.' . $fileExtension;
$targetPath = $uploadDir . $secureFileName;

// Move uploaded file to destination
if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    try {
        // Find user ID (optional, but good for foreign keys)
        $userStmt = $pdo->prepare("SELECT id FROM users WHERE employee_code = ?");
        $userStmt->execute([$employee_code]);
        $user = $userStmt->fetch();
        $user_id = $user ? $user['id'] : null;

        // Insert record into uploads table
        $stmt = $pdo->prepare("
            INSERT INTO uploads (user_id, employee_code, file_name, file_path, file_type, file_size) 
            VALUES (:user_id, :employee_code, :file_name, :file_path, :file_type, :file_size)
        ");
        
        $stmt->execute([
            'user_id' => $user_id,
            'employee_code' => $employee_code,
            'file_name' => $file['name'],
            'file_path' => $targetPath,
            'file_type' => $fileExtension,
            'file_size' => $file['size']
        ]);
        
        echo json_encode([
            "success" => true, 
            "message" => "File uploaded successfully",
            "url" => "https://yourdomain.com/" . $targetPath
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to move uploaded file"]);
}
?>
