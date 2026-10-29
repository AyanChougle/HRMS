<?php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(["success" => false, "error" => "Only POST method is allowed."], 405);
}

try {
    $currentUser = get_current_user_or_null($pdo);
    if (!$currentUser) {
        json_out(["success" => false, "error" => "Authentication required to upload documents."], 401);
    }

    $userRole = canonical_role($currentUser['role_id'] ?? 'EMPLOYEE');
    $userCode = $currentUser['employee_code'] ?? '';
    $userUid = $currentUser['uid'] ?? $currentUser['id'] ?? '';

    // If target employee is specified, verify caller permissions
    $targetCode = trim($_POST['employee_code'] ?? $userCode);
    $targetUid = trim($_POST['employee_id'] ?? $userUid);
    if ($userRole === 'EMPLOYEE' && !empty($targetCode) && $targetCode !== $userCode) {
        json_out(["success" => false, "error" => "Employees may only upload documents for their own profile."], 403);
    }

    $finalCode = !empty($targetCode) ? $targetCode : $userCode;
    $finalUid = !empty($targetUid) ? $targetUid : $userUid;

    $category = strtoupper(trim($_POST['category'] ?? 'GENERAL'));
    $title = trim($_POST['title'] ?? '');

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        json_out(["success" => false, "error" => "No file uploaded or file upload error occurred."], 400);
    }

    $file = $_FILES['file'];
    $allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'];
    $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($fileExt, $allowedExts)) {
        json_out(["success" => false, "error" => "File extension .{$fileExt} is not permitted."], 400);
    }

    // Max 25 MB
    $maxSize = 25 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        json_out(["success" => false, "error" => "File size exceeds 25 MB limit."], 400);
    }

    // Create uploads directory
    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0755, true);
    }

    $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '', $userCode) . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $fileExt;
    $targetPath = $uploadDir . $safeName;
    $relativeUrl = 'uploads/' . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        json_out(["success" => false, "error" => "Failed to save uploaded file on server."], 500);
    }

    // Determine public domain & URL
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'] ?? 'hrmstfw.com';
    $baseUrl = rtrim($protocol . $host, '/') . '/hostinger_backend';
    $fullFileUrl = $baseUrl . '/' . $relativeUrl;

    if (empty($title)) {
        $title = pathinfo($file['name'], PATHINFO_FILENAME);
    }

    // Insert into documents table
    $docStmt = $pdo->prepare("
        INSERT INTO documents (
            company_id, employee_id, employee_code, category, title,
            file_name, file_path, file_url, file_type, file_size, uploaded_by
        ) VALUES (
            'comp_diallo_india', :eid, :ecode, :cat, :title,
            :fname, :fpath, :furl, :ftype, :fsize, :upby
        )
    ");
    $docStmt->execute([
        ':eid' => $finalUid,
        ':ecode' => $finalCode,
        ':cat' => $category,
        ':title' => $title,
        ':fname' => $file['name'],
        ':fpath' => $targetPath,
        ':furl' => $fullFileUrl,
        ':ftype' => $fileExt,
        ':fsize' => (int)$file['size'],
        ':upby' => $userUid
    ]);

    $docId = $pdo->lastInsertId();

    json_out([
        "success" => true,
        "message" => "File uploaded successfully.",
        "id" => $docId,
        "url" => $fullFileUrl,
        "file_name" => $file['name'],
        "file_size" => $file['size'],
        "file_type" => $fileExt
    ]);

} catch (\Throwable $e) {
    error_log("[Upload API Error] " . $e->getMessage());
    json_out(["success" => false, "error" => $e->getMessage()], 500);
}
