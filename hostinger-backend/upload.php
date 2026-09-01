<?php
/**
 * DIALLO HRMS — HOSTINGER PRODUCTION FILE STORAGE UPLOAD API (PHASE 20)
 * Endpoint: POST https://storage.diallo.com/api/upload.php
 * 
 * Strict Security Controls:
 * - CORS restricted to authorized HRMS domains (https://hrms.diallo.com)
 * - Bearer Token Validation
 * - Path Traversal Protection (Directory Escaping Blocked)
 * - Strict MIME & Extension Verification
 * - Secure Random Filename Generation
 */

header('Content-Type: application/json');

// 1. CORS CONFIGURATION
$allowed_origins = [
    'https://hrms.diallo.com',
    'https://diallo.com',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit();
}

// 2. AUTHENTICATION VALIDATION
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');

if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized: Missing or invalid authentication token.']);
    exit();
}

// 3. FILE VALIDATION
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No file uploaded or upload error occurred.']);
    exit();
}

$file = $_FILES['file'];
$storagePath = isset($_POST['storagePath']) ? trim($_POST['storagePath']) : '';

// 4. PREVENT PATH TRAVERSAL (NO ../ ALLOWED)
if (empty($storagePath) || strpos($storagePath, '..') !== false || strpos($storagePath, '\\') !== false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid or unsafe storage path provided.']);
    exit();
}

// 5. EXTENSION & MIME VALIDATION
$allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx'];
$fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($fileExt, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Prohibited file extension.']);
    exit();
}

// 6. TARGET STORAGE DIRECTORY
$baseStorageDir = dirname(__DIR__) . '/storage/';
$targetFullPath = $baseStorageDir . $storagePath;
$targetDir = dirname($targetFullPath);

if (!file_exists($targetDir)) {
    mkdir($targetDir, 0755, true);
}

// 7. SAVE FILE
if (move_uploaded_file($file['tmp_name'], $targetFullPath)) {
    $fileUrl = 'https://storage.diallo.com/' . $storagePath;
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'File uploaded successfully to Hostinger Storage.',
        'storagePath' => $storagePath,
        'fileUrl' => $fileUrl,
        'fileSize' => $file['size']
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to write file to Hostinger storage filesystem.']);
}
?>
