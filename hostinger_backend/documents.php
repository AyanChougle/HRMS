<?php
require_once 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = strtolower(trim($_GET['action'] ?? ''));
$input = get_json_input();

try {
    $currentUser = get_current_user_or_null($pdo);
    if (!$currentUser) {
        json_out(["success" => false, "error" => "Authentication required."], 401);
    }
    $userRole = canonical_role($currentUser['role_id'] ?? 'EMPLOYEE');
    $userCode = $currentUser['employee_code'] ?? '';
    $userUid = $currentUser['uid'] ?? $currentUser['id'] ?? '';

    // -------------------------------------------------------------------------
    // GET: List Documents
    // -------------------------------------------------------------------------
    if ($method === 'GET') {
        $empId = trim($_GET['employee_id'] ?? '');
        $empCode = trim($_GET['employee_code'] ?? '');
        $category = trim($_GET['category'] ?? '');

        $sql = "SELECT * FROM documents WHERE 1=1";
        $params = [];

        // Role scoping
        if ($userRole === 'EMPLOYEE') {
            $sql .= " AND (employee_id = :self_uid OR employee_code = :self_code OR category = 'COMPANY_POLICY')";
            $params[':self_uid'] = $userUid;
            $params[':self_code'] = $userCode;
        } elseif ($userRole === 'TL') {
            $sql .= " AND (employee_id = :self_uid OR employee_code = :self_code OR category = 'COMPANY_POLICY' OR employee_id IN (SELECT id FROM employees WHERE team_lead_id = :tlid OR team_lead_id = :tlcode))";
            $params[':self_uid'] = $userUid;
            $params[':self_code'] = $userCode;
            $params[':tlid'] = $userUid;
            $params[':tlcode'] = $userCode;
        }

        if (!empty($empId)) {
            $sql .= " AND (employee_id = :filter_eid OR employee_code = :filter_eid)";
            $params[':filter_eid'] = $empId;
        } elseif (!empty($empCode)) {
            $sql .= " AND employee_code = :filter_code";
            $params[':filter_code'] = $empCode;
        }

        if (!empty($category) && $category !== 'All') {
            $sql .= " AND category = :cat";
            $params[':cat'] = $category;
        }

        $sql .= " ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $docs = $stmt->fetchAll();

        json_out([
            "success" => true,
            "count" => count($docs),
            "documents" => $docs
        ]);
    }

    // -------------------------------------------------------------------------
    // POST: Add Document record
    // -------------------------------------------------------------------------
    if ($method === 'POST') {
        $empId = trim($input['employee_id'] ?? $userUid);
        $empCode = trim($input['employee_code'] ?? $userCode);

        // Security gate: non-admin/HR/managers cannot assign documents to arbitrary employees
        if ($userRole === 'EMPLOYEE' && $empId !== $userUid && $empCode !== $userCode) {
            json_out(["success" => false, "error" => "Access denied. Employees can only manage their own documents."], 403);
        }

        $category = trim($input['category'] ?? 'GENERAL');
        $title = trim($input['title'] ?? 'Document');
        $fileName = trim($input['file_name'] ?? '');
        $filePath = trim($input['file_path'] ?? '');
        $fileUrl = trim($input['file_url'] ?? '');
        $fileType = trim($input['file_type'] ?? '');
        $fileSize = intval($input['file_size'] ?? 0);

        if (empty($title) || empty($fileUrl)) {
            json_out(["success" => false, "error" => "Document title and file URL are required."], 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO documents (
                company_id, employee_id, employee_code, category, title,
                file_name, file_path, file_url, file_type, file_size, uploaded_by
            ) VALUES (
                'comp_diallo_india', :eid, :ecode, :cat, :title,
                :fname, :fpath, :furl, :ftype, :fsize, :upby
            )
        ");
        $stmt->execute([
            ':eid' => $empId,
            ':ecode' => $empCode,
            ':cat' => $category,
            ':title' => $title,
            ':fname' => $fileName,
            ':fpath' => $filePath,
            ':furl' => $fileUrl,
            ':ftype' => $fileType,
            ':fsize' => $fileSize,
            ':upby' => $userUid
        ]);

        $newId = $pdo->lastInsertId();
        json_out(["success" => true, "id" => $newId, "message" => "Document saved successfully."]);
    }

    // -------------------------------------------------------------------------
    // DELETE: Remove document
    // -------------------------------------------------------------------------
    if ($method === 'DELETE') {
        $docId = intval($_GET['id'] ?? $input['id'] ?? 0);
        if (!$docId) {
            json_out(["success" => false, "error" => "Document ID is required."], 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM documents WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $docId]);
        $doc = $stmt->fetch();

        if (!$doc) {
            json_out(["success" => false, "error" => "Document not found."], 404);
        }

        // Check permission: Admin/HR or the uploader
        if (!in_array($userRole, ['ADMIN', 'HR']) && $doc['uploaded_by'] !== $userUid && $doc['employee_id'] !== $userUid) {
            json_out(["success" => false, "error" => "Access denied. Cannot delete this document."], 403);
        }

        // Remove physical file if on server
        if (!empty($doc['file_path']) && file_exists($doc['file_path'])) {
            @unlink($doc['file_path']);
        }

        $delStmt = $pdo->prepare("DELETE FROM documents WHERE id = :id");
        $delStmt->execute([':id' => $docId]);

        json_out(["success" => true, "message" => "Document deleted successfully."]);
    }

} catch (\Throwable $e) {
    error_log("[Documents API Error] " . $e->getMessage());
    json_out(["success" => false, "error" => $e->getMessage()], 500);
}
