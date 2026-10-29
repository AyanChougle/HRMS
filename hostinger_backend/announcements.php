<?php
// ==============================================================================
// DIALLO HRMS — ANNOUNCEMENTS & NOTICE BOARD MASTER API
// Server-Side Role-Based Broadcasting & MySQL Persistence
// ==============================================================================

require_once 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = strtolower(trim($_GET['action'] ?? ''));
$input = get_json_input();

if (empty($action) && isset($input['action'])) {
    $action = strtolower(trim($input['action']));
}

try {
    // Auto-heal announcements table if needed
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id VARCHAR(100) DEFAULT 'comp_diallo_india',
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'GENERAL',
            priority VARCHAR(50) DEFAULT 'NORMAL',
            target_audience VARCHAR(100) DEFAULT 'ALL',
            target_department VARCHAR(100) DEFAULT NULL,
            author_name VARCHAR(150) DEFAULT NULL,
            author_id VARCHAR(100) DEFAULT NULL,
            expires_at DATE DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_ann_type (type),
            INDEX idx_ann_priority (priority),
            INDEX idx_ann_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $currentUser = get_current_user_or_null($pdo);
    if (!$currentUser) {
        json_out(["success" => false, "error" => "Authentication required."], 401);
    }
    $userRole = canonical_role($currentUser['role_id']);
    $userUid = $currentUser['uid'] ?? $currentUser['id'] ?? '';
    $userDept = $currentUser['department'] ?? '';

    // -------------------------------------------------------------------------
    // GET: List Announcements
    // -------------------------------------------------------------------------
    if ($method === 'GET') {
        $type = trim($_GET['type'] ?? '');
        $priority = trim($_GET['priority'] ?? '');

        $sql = "SELECT * FROM announcements WHERE 1=1";
        $params = [];

        // Department & Audience scoping for non-privileged staff
        if (!in_array($userRole, ['ADMIN', 'HR', 'OPS', 'SUPER_ADMIN', 'COMPANY_ADMIN'])) {
            $sql .= " AND (target_audience = 'ALL' OR target_audience IS NULL OR target_department = :dept OR target_department = 'All')";
            $params[':dept'] = $userDept;
        }

        if (!empty($type) && $type !== 'All') {
            $sql .= " AND type = :t";
            $params[':t'] = $type;
        }

        if (!empty($priority) && $priority !== 'All') {
            $sql .= " AND priority = :p";
            $params[':p'] = $priority;
        }

        $sql .= " ORDER BY (priority = 'URGENT') DESC, created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $announcements = $stmt->fetchAll();

        json_out([
            "success" => true,
            "count" => count($announcements),
            "announcements" => $announcements
        ]);
    }

    // -------------------------------------------------------------------------
    // POST: Broadcast / Create Announcement (ADMIN, HR, OPS)
    // -------------------------------------------------------------------------
    if ($method === 'POST') {
        $isPrivileged = in_array($userRole, ['ADMIN', 'HR', 'OPS', 'SUPER_ADMIN', 'COMPANY_ADMIN']);
        if (!$isPrivileged) {
            json_out(["success" => false, "error" => "Unauthorized: Only HR, Admin, or Ops managers can post announcements."], 403);
        }

        $title = trim($input['title'] ?? '');
        $content = trim($input['content'] ?? '');
        $type = trim($input['type'] ?? 'GENERAL');
        $priority = trim($input['priority'] ?? 'NORMAL');
        $targetAudience = trim($input['target_audience'] ?? $input['targetAudience'] ?? 'ALL');
        $targetDept = trim($input['target_department'] ?? $input['targetDepartment'] ?? 'All');
        $authorName = trim($input['author_name'] ?? $input['authorName'] ?? ($currentUser['display_name'] ?? 'HR Admin'));
        $expiresAt = !empty($input['expires_at']) ? $input['expires_at'] : null;

        if (empty($title) || empty($content)) {
            json_out(["success" => false, "error" => "Announcement title and content are required."], 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO announcements (
                company_id, title, content, type, priority, target_audience, target_department, author_name, author_id, expires_at
            ) VALUES (
                'comp_diallo_india', :title, :content, :type, :priority, :audience, :dept, :author, :aid, :exp
            )
        ");
        $stmt->execute([
            ':title' => $title,
            ':content' => $content,
            ':type' => $type,
            ':priority' => $priority,
            ':audience' => $targetAudience,
            ':dept' => $targetDept,
            ':author' => $authorName,
            ':aid' => $userUid,
            ':exp' => $expiresAt
        ]);

        $newId = $pdo->lastInsertId();

        json_out([
            "success" => true,
            "id" => $newId,
            "message" => "Announcement broadcast successfully."
        ], 201);
    }

    // -------------------------------------------------------------------------
    // DELETE: Delete Announcement (ADMIN, HR, OPS)
    // -------------------------------------------------------------------------
    if ($method === 'DELETE' || ($method === 'POST' && $action === 'delete')) {
        $isPrivileged = in_array($userRole, ['ADMIN', 'HR', 'OPS', 'SUPER_ADMIN', 'COMPANY_ADMIN']);
        if (!$isPrivileged) {
            json_out(["success" => false, "error" => "Unauthorized."], 403);
        }

        $id = intval($_GET['id'] ?? $input['id'] ?? 0);
        if (!$id) {
            json_out(["success" => false, "error" => "Announcement ID is required."], 400);
        }

        $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = :id");
        $stmt->execute([':id' => $id]);

        json_out(["success" => true, "message" => "Announcement deleted successfully."]);
    }

} catch (\Throwable $e) {
    error_log("[Announcements API Error] " . $e->getMessage());
    json_out(["success" => false, "error" => $e->getMessage()], 500);
}
