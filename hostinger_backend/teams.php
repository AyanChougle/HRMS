<?php
// ==============================================================================
// DIALLO HRMS — TEAMS & REPORTING HIERARCHY API
// Company -> Department -> Team -> Team Lead (TL) -> Employees
// ==============================================================================

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = get_json_input();

try {
    // -------------------------------------------------------------------------
    // GET: List Teams or Team Details
    // -------------------------------------------------------------------------
    if ($method === 'GET') {
        $user = require_authenticated_user($pdo);
        $role = canonical_role($user['role_id']);

        $id = intval($_GET['id'] ?? 0);
        $dept = trim($_GET['department'] ?? $_GET['department_name'] ?? '');

        if ($id > 0) {
            $stmt = $pdo->prepare("SELECT * FROM teams WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
            $team = $stmt->fetch();
            if (!$team) {
                json_out(["success" => false, "error" => "Team not found."], 404);
            }

            // Fetch team members
            $mStmt = $pdo->prepare("SELECT id, employee_code, full_name, email, designation, role_id, employment_status FROM employees WHERE team_id = :tid OR team_lead_id = :lid ORDER BY full_name ASC");
            $mStmt->execute([':tid' => $team['id'], ':lid' => $team['lead_employee_id']]);
            $team['members'] = $mStmt->fetchAll();

            json_out(["success" => true, "team" => $team]);
        }

        // List teams
        $sql = "
            SELECT t.*, 
                   COUNT(e.id) as member_count
            FROM teams t
            LEFT JOIN employees e ON (e.team_id = t.id OR e.team_lead_id = t.lead_employee_id) AND e.employment_status = 'ACTIVE'
            WHERE t.status = 'ACTIVE'
        ";
        $params = [];

        if (!empty($dept) && $dept !== 'All') {
            $sql .= " AND t.department_name = :dept";
            $params[':dept'] = $dept;
        }

        // Team Lead scope: if TL, only show their own team
        if ($role === 'TL') {
            $sql .= " AND (t.lead_employee_id = :leadId OR t.id = :teamId)";
            $params[':leadId'] = $user['employee_id'];
            $params[':teamId'] = intval($user['team_id'] ?? 0);
        }

        $sql .= " GROUP BY t.id ORDER BY t.name ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $teams = $stmt->fetchAll();

        json_out([
            "success" => true,
            "count" => count($teams),
            "teams" => $teams
        ]);
    }

    // -------------------------------------------------------------------------
    // POST: Create New Team (ADMIN, HR, OPS)
    // -------------------------------------------------------------------------
    if ($method === 'POST') {
        $user = require_role($pdo, ['ADMIN', 'HR', 'OPS']);

        $name = trim($input['name'] ?? '');
        $code = strtoupper(trim($input['code'] ?? ''));
        $deptName = trim($input['department_name'] ?? $input['department'] ?? 'Sales');
        $leadId = trim($input['lead_employee_id'] ?? '');
        $leadName = trim($input['lead_name'] ?? '');
        $desc = trim($input['description'] ?? '');

        if (empty($name)) {
            json_out(["success" => false, "error" => "Team name is required."], 400);
        }

        if (empty($code)) {
            $code = 'TEAM-' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 8));
        }

        // Auto-resolve lead name if leadId provided
        if (!empty($leadId) && empty($leadName)) {
            $lStmt = $pdo->prepare("SELECT full_name FROM employees WHERE id = :id OR employee_code = :c LIMIT 1");
            $lStmt->execute([':id' => $leadId, ':c' => $leadId]);
            $leadName = $lStmt->fetchColumn() ?: '';
        }

        // Check duplicate code
        $chk = $pdo->prepare("SELECT id FROM teams WHERE code = :code");
        $chk->execute([':code' => $code]);
        if ($chk->fetch()) {
            json_out(["success" => false, "error" => "A team with code '$code' already exists."], 409);
        }

        $stmt = $pdo->prepare("
            INSERT INTO teams (department_name, name, code, lead_employee_id, lead_name, description, status)
            VALUES (:dept, :name, :code, :lid, :lname, :desc, 'ACTIVE')
        ");
        $stmt->execute([
            ':dept' => $deptName,
            ':name' => $name,
            ':code' => $code,
            ':lid' => $leadId ?: null,
            ':lname' => $leadName ?: null,
            ':desc' => $desc ?: null
        ]);
        $newId = $pdo->lastInsertId();

        // If a lead was assigned, ensure their role is TL
        if (!empty($leadId)) {
            $pdo->prepare("UPDATE employees SET role_id = 'TL', team_id = :tid, team_name = :tname WHERE id = :id OR employee_code = :c")->execute([
                ':tid' => $newId,
                ':tname' => $name,
                ':id' => $leadId,
                ':c' => $leadId
            ]);
            $pdo->prepare("UPDATE users SET role_id = 'TL' WHERE uid = :id OR employee_code = :c")->execute([
                ':id' => $leadId,
                ':c' => $leadId
            ]);
        }

        log_audit($pdo, $user['employee_id'], $user['email'], 'TEAM_CREATED', 'teams', $newId, [
            'name' => $name,
            'code' => $code
        ]);

        json_out([
            "success" => true,
            "message" => "Team '$name' created successfully.",
            "team_id" => $newId
        ], 201);
    }

    // -------------------------------------------------------------------------
    // PUT: Update Team (ADMIN, HR, OPS)
    // -------------------------------------------------------------------------
    if ($method === 'PUT') {
        $user = require_role($pdo, ['ADMIN', 'HR', 'OPS']);
        $id = intval($input['id'] ?? $_GET['id'] ?? 0);

        if ($id <= 0) {
            json_out(["success" => false, "error" => "Valid team ID is required."], 400);
        }

        $name = trim($input['name'] ?? '');
        $deptName = trim($input['department_name'] ?? $input['department'] ?? '');
        $leadId = trim($input['lead_employee_id'] ?? '');
        $leadName = trim($input['lead_name'] ?? '');
        $desc = trim($input['description'] ?? '');
        $status = strtoupper(trim($input['status'] ?? 'ACTIVE'));

        if (!empty($leadId) && empty($leadName)) {
            $lStmt = $pdo->prepare("SELECT full_name FROM employees WHERE id = :id OR employee_code = :c LIMIT 1");
            $lStmt->execute([':id' => $leadId, ':c' => $leadId]);
            $leadName = $lStmt->fetchColumn() ?: '';
        }

        $stmt = $pdo->prepare("
            UPDATE teams 
            SET name = COALESCE(NULLIF(:name, ''), name),
                department_name = COALESCE(NULLIF(:dept, ''), department_name),
                lead_employee_id = :lid,
                lead_name = :lname,
                description = :desc,
                status = :st
            WHERE id = :id
        ");
        $stmt->execute([
            ':name' => $name,
            ':dept' => $deptName,
            ':lid' => $leadId ?: null,
            ':lname' => $leadName ?: null,
            ':desc' => $desc ?: null,
            ':st' => in_array($status, ['ACTIVE', 'INACTIVE']) ? $status : 'ACTIVE',
            ':id' => $id
        ]);

        // Sync team members if lead changed
        if (!empty($leadId)) {
            $pdo->prepare("UPDATE employees SET team_id = :tid, team_name = :tname, team_lead_id = :lid, team_lead = :lname WHERE team_id = :tid")->execute([
                ':tid' => $id,
                ':tname' => $name ?: 'Team',
                ':lid' => $leadId,
                ':lname' => $leadName
            ]);
        }

        log_audit($pdo, $user['employee_id'], $user['email'], 'TEAM_UPDATED', 'teams', $id, $input);

        json_out([
            "success" => true,
            "message" => "Team updated successfully."
        ]);
    }

    // -------------------------------------------------------------------------
    // DELETE: Deactivate Team (ADMIN, HR)
    // -------------------------------------------------------------------------
    if ($method === 'DELETE') {
        $user = require_role($pdo, ['ADMIN', 'HR']);
        $id = intval($_GET['id'] ?? $input['id'] ?? 0);

        if ($id <= 0) {
            json_out(["success" => false, "error" => "Valid team ID is required."], 400);
        }

        $pdo->prepare("UPDATE teams SET status = 'INACTIVE' WHERE id = :id")->execute([':id' => $id]);

        log_audit($pdo, $user['employee_id'], $user['email'], 'TEAM_DEACTIVATED', 'teams', $id);

        json_out([
            "success" => true,
            "message" => "Team deactivated successfully."
        ]);
    }

    json_out(["success" => false, "error" => "Method not allowed."], 405);

} catch (\Throwable $e) {
    error_log("[Teams API Error] " . $e->getMessage());
    json_out(["success" => false, "error" => "Teams service error: " . $e->getMessage()], 500);
}
?>
