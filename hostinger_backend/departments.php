<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = get_json_input();

try {
    $user = require_authenticated_user($pdo);
    $userRole = canonical_role($user['role_id']);

    // -----------------------------------------------------------------------------
    // GET: Fetch all active departments dynamically from DB with member counts
    // -----------------------------------------------------------------------------
    if ($method === 'GET') {
        // Auto-sync any distinct departments from employees master into departments table
        try {
            $pdo->exec("
                INSERT IGNORE INTO departments (name, code, description, status)
                SELECT DISTINCT department, UPPER(LEFT(REPLACE(department, ' ', ''), 4)), CONCAT(department, ' Department'), 'ACTIVE'
                FROM employees
                WHERE department IS NOT NULL AND department != '' 
                  AND department NOT IN (SELECT name FROM departments);
            ");
        } catch (\Throwable $e) {}

        $stmt = $pdo->query("
            SELECT d.id, d.name, d.code, d.head_employee_id, d.head_name, d.description, d.status, d.created_at,
                   COUNT(e.id) AS members
            FROM departments d
            LEFT JOIN employees e ON (e.department = d.name AND e.employment_status = 'ACTIVE')
            WHERE d.status = 'ACTIVE'
            GROUP BY d.id, d.name, d.code, d.head_employee_id, d.head_name, d.description, d.status, d.created_at
            ORDER BY d.name ASC
        ");
        $departments = $stmt->fetchAll();
        json_out([
            "success" => true,
            "count" => count($departments),
            "departments" => $departments
        ]);
    }

    // -----------------------------------------------------------------------------
    // POST / PUT: Create or Update Department dynamically
    // -----------------------------------------------------------------------------
    if ($method === 'POST' || $method === 'PUT') {
        if (!in_array($userRole, ['ADMIN', 'HR', 'OPS', 'SUPER_ADMIN', 'COMPANY_ADMIN'])) {
            json_out(["success" => false, "error" => "Unauthorized: Only HR, Admin, or Ops can modify departments."], 403);
        }
        $id = !empty($input['id']) ? trim($input['id']) : null;
        $name = trim($input['name'] ?? '');
        $code = strtoupper(trim($input['code'] ?? ''));
        $head = trim($input['head_name'] ?? '');
        $desc = trim($input['description'] ?? '');
        $status = strtoupper(trim($input['status'] ?? 'ACTIVE'));
        if (!in_array($status, ['ACTIVE', 'INACTIVE'])) $status = 'ACTIVE';

        if (empty($name)) {
            json_out(["success" => false, "error" => "Department name is required."], 400);
        }

        if (!empty($id) && is_numeric($id)) {
            // Update existing department by ID
            $stmt = $pdo->prepare("
                UPDATE departments 
                SET name = :name, code = :code, head_name = :head, description = :desc, status = :status
                WHERE id = :id
            ");
            $stmt->execute([
                ':name' => $name,
                ':code' => $code,
                ':head' => $head,
                ':desc' => $desc,
                ':status' => $status,
                ':id' => $id
            ]);
            json_out(["success" => true, "id" => (int)$id, "message" => "Department updated successfully."]);
        } else {
            // Insert or Upsert by unique name
            $stmt = $pdo->prepare("
                INSERT INTO departments (name, code, head_name, description, status)
                VALUES (:name, :code, :head, :desc, :status)
                ON DUPLICATE KEY UPDATE 
                    code = VALUES(code),
                    head_name = VALUES(head_name),
                    description = VALUES(description),
                    status = VALUES(status)
            ");
            $stmt->execute([
                ':name' => $name,
                ':code' => $code,
                ':head' => $head,
                ':desc' => $desc,
                ':status' => $status
            ]);
            $insertedId = $pdo->lastInsertId() ?: $id;
            json_out(["success" => true, "id" => $insertedId, "message" => "Department saved successfully."]);
        }
    }

    // -----------------------------------------------------------------------------
    // DELETE: Soft delete department
    // -----------------------------------------------------------------------------
    if ($method === 'DELETE') {
        if (!in_array($userRole, ['ADMIN', 'HR', 'OPS', 'SUPER_ADMIN', 'COMPANY_ADMIN'])) {
            json_out(["success" => false, "error" => "Unauthorized: Only HR, Admin, or Ops can deactivate departments."], 403);
        }
        $id = $_GET['id'] ?? ($input['id'] ?? '');
        if (empty($id)) {
            json_out(["success" => false, "error" => "Department ID is required."], 400);
        }
        $stmt = $pdo->prepare("UPDATE departments SET status = 'INACTIVE' WHERE id = :id OR name = :name");
        $stmt->execute([':id' => $id, ':name' => $id]);
        json_out(["success" => true, "message" => "Department deactivated successfully."]);
    }

} catch (\Throwable $e) {
    error_log("[Departments API Error] " . $e->getMessage());
    json_out(["success" => false, "error" => $e->getMessage()], 500);
}
?>
