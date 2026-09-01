<?php
/**
 * DIALLO HRMS — HOSTINGER PRODUCTION FILE DOWNLOAD & PREVIEW API (PHASE 20)
 * Endpoint: GET https://storage.diallo.com/api/download.php?file=...
 */

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
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Authorization, Content-Type");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$fileParam = isset($_GET['file']) ? trim($_GET['file']) : '';

// Security: Prevent path traversal
if (empty($fileParam) || strpos($fileParam, '..') !== false || strpos($fileParam, '\\') !== false) {
    http_response_code(400);
    die('Invalid file path request.');
}

$baseStorageDir = dirname(__DIR__) . '/storage/';
$targetFullPath = $baseStorageDir . $fileParam;

if (!file_exists($targetFullPath)) {
    http_response_code(404);
    die('Requested document not found in Hostinger storage.');
}

$mimeType = mime_content_type($targetFullPath) ?: 'application/octet-stream';
$fileName = basename($targetFullPath);

header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($targetFullPath));
header('Content-Disposition: inline; filename="' . $fileName . '"');
header('Cache-Control: private, max-age=3600');

readfile($targetFullPath);
exit();
?>
