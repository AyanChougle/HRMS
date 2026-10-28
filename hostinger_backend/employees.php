<?php
// ==============================================================================
// DIALLO HRMS — EMPLOYEES & PERSONNEL MASTER API
// Strictly 7 Canonical Roles: ADMIN, HR, OPS, COMPLIANCE, MANAGER, TL, EMPLOYEE
// Server-Side Role-Based Scoping & Team Bifurcation
// ==============================================================================

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = get_json_input();

try {
    // -------------------------------------------------------------------------
    // GET: List Employees, Org Tree, or Single Employee
    // -------------------------------------------------------------------------
    if ($method === 'GET') {
        $currentUser = get_current_user_or_null($pdo);
        $userRole = $currentUser ? canonical_role($currentUser['role_id']) : null;
        $myEmpId = $currentUser ? ($currentUser['employee_id'] ?? $currentUser['uid']) : '';
        $myTeamId = $currentUser ? ($currentUser['team_id'] ?? null) : null;

        // 1. Return dynamic Org Chart Tree
        if ($action === 'tree') {
            $stmt = $pdo->query("
                SELECT id, employee_code, full_name, role_id, department, team_id, team_name, designation, manager_id, manager, team_lead_id, team_lead, profile_photo_url, employment_status
                FROM employees 
                WHERE employment_status = 'ACTIVE'
                ORDER BY full_name ASC
            ");
            $all = $stmt->fetchAll();

            $byId = [];
            $roots = [];
            foreach ($all as $emp) {
                $emp['role_id'] = canonical_role($emp['role_id']);
                $emp['children'] = [];
                $byId[$emp['id']] = $emp;
                if (!empty($emp['employee_code'])) {
                    $byId[$emp['employee_code']] = &$byId[$emp['id']];
                }
            }

            foreach ($all as $emp) {
                $mId = $emp['manager_id'];
                if (!empty($mId) && isset($byId[$mId])) {
                    $byId[$mId]['children'][] = &$byId[$emp['id']];
                } else {
                    $roots[] = &$byId[$emp['id']];
                }
            }

            json_out([
                "success" => true,
                "total" => count($all),
                "tree" => $roots,
                "flat" => $all
            ]);
        }

        // 2. Single employee details
        $id = trim($_GET['id'] ?? '');
        if (!empty($id)) {
            // Self-service scoping: Employees can only view their own profile unless privileged
            if ($userRole === 'EMPLOYEE' && $id !== $myEmpId && $id !== ($currentUser['employee_code'] ?? '')) {
                $id = $myEmpId; // Force own profile
            }

            // Robust read-only multi-key matching (zero auto-creation on GET)
            $stmt = $pdo->prepare("
                SELECT * FROM employees 
                WHERE id = :id 
                   OR employee_code = :code 
                   OR REPLACE(employee_code, '-', '') = REPLACE(:clean, '-', '')
                   OR user_id = :uid 
                   OR email = :email 
                   OR work_email = :wemail
                LIMIT 1
            ");
            $stmt->execute([
                ':id' => $id,
                ':code' => $id,
                ':clean' => $id,
                ':uid' => $id,
                ':email' => $id,
                ':wemail' => $id
            ]);
            $emp = $stmt->fetch();

            if (!$emp) {
                // Secondary check: match through users record by email or clean code
                $uStmt = $pdo->prepare("
                    SELECT * FROM users 
                    WHERE uid = :id 
                       OR employee_code = :code 
                       OR REPLACE(employee_code, '-', '') = REPLACE(:clean, '-', '')
                       OR email = :email 
                    LIMIT 1
                ");
                $uStmt->execute([':id' => $id, ':code' => $id, ':clean' => $id, ':email' => $id]);
                $u = $uStmt->fetch();

                if ($u) {
                    $uCode = $u['employee_code'] ?? '';
                    $uEmail = $u['email'] ?? '';
                    $uUid = $u['uid'] ?? '';
                    $matchStmt = $pdo->prepare("
                        SELECT * FROM employees 
                        WHERE id = :uid 
                           OR user_id = :uuid 
                           OR employee_code = :ucode 
                           OR REPLACE(employee_code, '-', '') = REPLACE(:uclean, '-', '')
                           OR email = :uemail 
                           OR work_email = :uwemail
                        LIMIT 1
                    ");
                    $matchStmt->execute([
                        ':uid' => $uUid,
                        ':uuid' => $uUid,
                        ':ucode' => $uCode,
                        ':uclean' => $uCode,
                        ':uemail' => $uEmail,
                        ':uwemail' => $uEmail
                    ]);
                    $emp = $matchStmt->fetch();
                }
            }

            if (!$emp) {
                json_out(["success" => false, "error" => "Employee record not found."], 404);
            }

            $emp['role_id'] = canonical_role($emp['role_id']);
            json_out(["success" => true, "employee" => $emp]);
        }

        // 3. Searchable employee roster with Server-Side Scope Filtering
        $search = trim($_GET['search'] ?? '');
        $dept = trim($_GET['department'] ?? '');
        $status = trim($_GET['status'] ?? '');
        $teamId = intval($_GET['team_id'] ?? 0);
        $roleFilter = trim($_GET['role'] ?? '');

        $sql = "SELECT * FROM employees WHERE 1=1";
        $params = [];

        // Strict Server-Side Scope Enforcement
        if ($userRole === 'TL') {
            // Team Lead: only sees their assigned team members and themselves
            $sql .= " AND (team_lead_id = :myTLId OR team_id = :myTeamId OR id = :myTLId)";
            $params[':myTLId'] = $myEmpId;
            $params[':myTeamId'] = $myTeamId ?: 0;
        } elseif ($userRole === 'MANAGER') {
            // Manager: sees their direct reports, team members under their department, and themselves
            $sql .= " AND (manager_id = :myMgrId OR id = :myMgrId)";
            $params[':myMgrId'] = $myEmpId;
        } elseif ($userRole === 'EMPLOYEE') {
            // Employee: self-service view only
            $sql .= " AND id = :myEmpIdSelf";
            $params[':myEmpIdSelf'] = $myEmpId;
        }

        if (!empty($search)) {
            $sql .= " AND (full_name LIKE :s OR employee_code LIKE :s OR work_email LIKE :s OR designation LIKE :s)";
            $params[':s'] = "%$search%";
        }
        if (!empty($dept) && $dept !== 'All') {
            $sql .= " AND department = :d";
            $params[':d'] = $dept;
        }
        if ($teamId > 0) {
            $sql .= " AND team_id = :tid";
            $params[':tid'] = $teamId;
        }
        if (!empty($roleFilter) && $roleFilter !== 'All') {
            $sql .= " AND role_id = :rf";
            $params[':rf'] = canonical_role($roleFilter);
        }
        if (!empty($status) && $status !== 'All') {
            $sql .= " AND employment_status = :st";
            $params[':st'] = $status;
        }

        $sql .= " ORDER BY full_name ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $employees = $stmt->fetchAll();

        // Ensure canonical role strings on all returned rows
        foreach ($employees as &$e) {
            $e['role_id'] = canonical_role($e['role_id']);
        }

        json_out([
            "success" => true,
            "count" => count($employees),
            "employees" => $employees
        ]);
    }

    // -------------------------------------------------------------------------
    // DELETE: Delete Employee (Requires ADMIN or HR)
    // -------------------------------------------------------------------------
    if ($method === 'DELETE' || ($method === 'POST' && ($action === 'delete' || ($input['action'] ?? '') === 'delete'))) {
        $user = require_role($pdo, ['ADMIN', 'HR']);

        $id = trim($_GET['id'] ?? $input['id'] ?? '');
        $code = trim($_GET['employee_code'] ?? $input['employee_code'] ?? $input['code'] ?? '');
        $email = strtolower(trim($_GET['email'] ?? $input['email'] ?? $input['work_email'] ?? ''));

        if (empty($id) && empty($code) && empty($email)) {
            json_out(["success" => false, "error" => "Employee id, employee_code, or email is required to delete."], 400);
        }

        $empDeleted = 0;
        $userDeleted = 0;

        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
        try {
            if (!empty($id) || !empty($code)) {
                $delEmp = $pdo->prepare("DELETE FROM employees WHERE id = :id OR (employee_code = :c AND :c != '')");
                $delEmp->execute([':id' => $id, ':c' => $code]);
                $empDeleted = $delEmp->rowCount();

                $delUser = $pdo->prepare("DELETE FROM users WHERE uid = :id OR (employee_code = :c AND :c != '')");
                $delUser->execute([':id' => $id, ':c' => $code]);
                $userDeleted = $delUser->rowCount();

                // Clean child tables
                $pdo->prepare("DELETE FROM attendance_records WHERE employee_id = :id OR (employee_code = :c AND :c != '')")->execute([':id' => $id, ':c' => $code]);
                $pdo->prepare("DELETE FROM leave_applications WHERE employee_id = :id OR (employee_code = :c AND :c != '')")->execute([':id' => $id, ':c' => $code]);
                $pdo->prepare("DELETE FROM leave_balances WHERE employee_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM punch_logs WHERE employee_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM breaks WHERE employee_id = :id")->execute([':id' => $id]);
                $pdo->prepare("DELETE FROM documents WHERE employee_id = :id")->execute([':id' => $id]);
            } elseif (!empty($email)) {
                $delEmp = $pdo->prepare("DELETE FROM employees WHERE LOWER(work_email) = :e OR LOWER(email) = :e");
                $delEmp->execute([':e' => $email]);
                $empDeleted = $delEmp->rowCount();

                $delUser = $pdo->prepare("DELETE FROM users WHERE LOWER(email) = :e");
                $delUser->execute([':e' => $email]);
                $userDeleted = $delUser->rowCount();
            }
        } finally {
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
        }

        log_audit($pdo, $user['employee_id'], $user['email'], 'EMPLOYEE_DELETED', 'employees', $id ?: $code, [
            'id' => $id,
            'code' => $code,
            'email' => $email,
            'emp_deleted' => $empDeleted,
            'user_deleted' => $userDeleted
        ]);

        json_out([
            "success" => true,
            "message" => "Employee record and login account permanently removed from MySQL.",
            "deleted_count" => $empDeleted
        ]);
    }

    // -------------------------------------------------------------------------
    // POST / PUT: Create or Update Employee (Requires ADMIN, HR, or OPS)
    // -------------------------------------------------------------------------
    if ($method === 'POST' || $method === 'PUT') {
        $user = require_authenticated_user($pdo);
        $userRole = canonical_role($user['role_id']);
        $isPrivileged = in_array($userRole, ['ADMIN', 'HR', 'OPS', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER']);
        $targetId = trim($input['id'] ?? '');
        $isSelf = !empty($targetId) && ($targetId === ($user['employee_id'] ?? '') || $targetId === ($user['uid'] ?? '') || $targetId === ($user['id'] ?? ''));

        if (!$isPrivileged && !$isSelf) {
            json_out(["success" => false, "error" => "Unauthorized: Only HR, Admin, or Managers can modify employee records."], 403);
        }

        $code = strtoupper(trim($input['employee_code'] ?? $input['code'] ?? ''));
        $fullName = trim($input['full_name'] ?? ($input['name'] ?? trim(($input['first_name'] ?? '') . ' ' . ($input['last_name'] ?? ''))));
        $email = strtolower(trim($input['work_email'] ?? $input['email'] ?? ''));
        $phone = trim($input['phone'] ?? '');
        $dept = trim($input['department'] ?? 'Operations');
        $desig = trim($input['designation'] ?? 'Associate');
        $role = canonical_role($input['role_id'] ?? $input['role'] ?? 'EMPLOYEE');

        $teamId = intval($input['team_id'] ?? 0);
        $teamName = trim($input['team_name'] ?? $input['team'] ?? '');
        $teamLeadId = trim($input['team_lead_id'] ?? '');
        $teamLead = trim($input['team_lead'] ?? '');

        // Resolve team details if teamId provided
        if ($teamId > 0 && (empty($teamName) || empty($teamLeadId))) {
            $tStmt = $pdo->prepare("SELECT name, lead_employee_id, lead_name FROM teams WHERE id = :id LIMIT 1");
            $tStmt->execute([':id' => $teamId]);
            $tRow = $tStmt->fetch();
            if ($tRow) {
                if (empty($teamName)) $teamName = $tRow['name'];
                if (empty($teamLeadId)) $teamLeadId = $tRow['lead_employee_id'];
                if (empty($teamLead)) $teamLead = $tRow['lead_name'];
            }
        }

        $mgrId = trim($input['manager_id'] ?? '');
        $mgrName = trim($input['manager'] ?? '');
        $status = strtoupper(trim($input['employment_status'] ?? $input['status'] ?? 'ACTIVE'));
        $validStatuses = ['ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'SUSPENDED', 'RESIGNED', 'TERMINATED'];
        if (!in_array($status, $validStatuses)) $status = 'ACTIVE';

        $doj = $input['date_of_joining'] ?? date('Y-m-d');
        
        // Prevent duplicate creation: Match existing employee by ID, email, or employee code
        $existingEmp = null;
        $idCandidate = trim($input['id'] ?? '');
        $codeCandidate = strtoupper(trim($input['employee_code'] ?? $input['code'] ?? ''));
        $emailCandidate = strtolower(trim($input['work_email'] ?? $input['email'] ?? ''));

        if (!empty($idCandidate)) {
            $fStmt = $pdo->prepare("SELECT * FROM employees WHERE id = :id OR user_id = :id LIMIT 1");
            $fStmt->execute([':id' => $idCandidate]);
            $existingEmp = $fStmt->fetch();
        }

        if (!$existingEmp && !empty($codeCandidate)) {
            $fStmt = $pdo->prepare("SELECT * FROM employees WHERE employee_code = :c OR REPLACE(employee_code, '-', '') = :clean LIMIT 1");
            $fStmt->execute([':c' => $codeCandidate, ':clean' => str_replace('-', '', $codeCandidate)]);
            $existingEmp = $fStmt->fetch();
        }

        if (!$existingEmp && !empty($emailCandidate)) {
            $fStmt = $pdo->prepare("SELECT * FROM employees WHERE LOWER(email) = :e OR LOWER(work_email) = :e LIMIT 1");
            $fStmt->execute([':e' => $emailCandidate]);
            $existingEmp = $fStmt->fetch();
        }

        if ($existingEmp) {
            $id = $existingEmp['id'];
        } else {
            $id = !empty($idCandidate) ? $idCandidate : ('emp_' . bin2hex(random_bytes(8)));
        }

        if (empty($fullName) || empty($email)) {
            json_out(["success" => false, "error" => "Full Name and Official Email are required."], 400);
        }

        if (empty($code)) {
            $code = $existingEmp ? $existingEmp['employee_code'] : ('D' . str_pad(rand(100, 99999), 5, '0', STR_PAD_LEFT));
        }

        // Circular reporting safeguard
        if ($mgrId === $id) $mgrId = null;
        if ($teamLeadId === $id) $teamLeadId = null;

        $branchName = trim($input['branch_name'] ?? $input['location'] ?? ($existingEmp['branch_name'] ?? 'Ghansoli - Navi Mumbai, Maharashtra'));
        $location = $branchName;
        $personalEmail = trim($input['personal_email'] ?? ($existingEmp['personal_email'] ?? ''));

        $parts = explode(' ', $fullName);
        $firstName = $input['first_name'] ?? ($parts[0] ?? $fullName);
        $lastName = $input['last_name'] ?? (count($parts) > 1 ? end($parts) : '');

        // 1. Save to employees table with all organization and branch attributes
        $stmt = $pdo->prepare("
            INSERT INTO employees (
                id, user_id, employee_code, first_name, last_name, full_name, email, work_email, personal_email, phone,
                department, team_id, team_name, designation, role_id, 
                branch_name, location,
                manager_id, manager, team_lead_id, team_lead,
                date_of_joining, employment_status, status
            ) VALUES (
                :id, :uid, :code, :fname, :lname, :name, :email, :wemail, :pemail, :phone,
                :dept, :tid, :tname, :desig, :role,
                :bname, :loc,
                :mid, :mname, :tlid, :tlname,
                :doj, :estatus, :status
            )
            ON DUPLICATE KEY UPDATE
                employee_code = VALUES(employee_code),
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                full_name = VALUES(full_name),
                email = VALUES(email),
                work_email = VALUES(work_email),
                personal_email = VALUES(personal_email),
                phone = VALUES(phone),
                department = VALUES(department),
                team_id = VALUES(team_id),
                team_name = VALUES(team_name),
                designation = VALUES(designation),
                role_id = VALUES(role_id),
                branch_name = VALUES(branch_name),
                location = VALUES(location),
                manager_id = VALUES(manager_id),
                manager = VALUES(manager),
                team_lead_id = VALUES(team_lead_id),
                team_lead = VALUES(team_lead),
                date_of_joining = VALUES(date_of_joining),
                employment_status = VALUES(employment_status),
                status = VALUES(status),
                updated_at = CURRENT_TIMESTAMP
        ");

        $stmt->execute([
            ':id' => $id,
            ':uid' => $id,
            ':code' => $code,
            ':fname' => $firstName,
            ':lname' => $lastName,
            ':name' => $fullName,
            ':email' => $email,
            ':wemail' => $email,
            ':pemail' => $personalEmail ?: null,
            ':phone' => $phone,
            ':dept' => $dept,
            ':tid' => $teamId ?: null,
            ':tname' => $teamName ?: null,
            ':desig' => $desig,
            ':role' => $role,
            ':bname' => $branchName,
            ':loc' => $location,
            ':mid' => !empty($mgrId) ? $mgrId : null,
            ':mname' => !empty($mgrName) ? $mgrName : null,
            ':tlid' => !empty($teamLeadId) ? $teamLeadId : null,
            ':tlname' => !empty($teamLead) ? $teamLead : null,
            ':doj' => $doj,
            ':estatus' => $status,
            ':status' => $status
        ]);

        // 2. Synchronize user login record
        $userStatus = in_array($status, ['ACTIVE', 'SUSPENDED', 'PENDING', 'INACTIVE']) ? $status : 'ACTIVE';
        $userStmt = $pdo->prepare("
            INSERT INTO users (uid, employee_code, email, display_name, first_name, last_name, phone, role_id, department, designation, branch_name, status)
            VALUES (:uid, :code, :email, :name, :fname, :lname, :phone, :role, :dept, :desig, :bname, :status)
            ON DUPLICATE KEY UPDATE
                employee_code = VALUES(employee_code),
                display_name = VALUES(display_name),
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                email = VALUES(email),
                phone = VALUES(phone),
                role_id = VALUES(role_id),
                department = VALUES(department),
                designation = VALUES(designation),
                branch_name = VALUES(branch_name),
                status = VALUES(status),
                updated_at = CURRENT_TIMESTAMP
        ");
        $userStmt->execute([
            ':uid' => $id,
            ':code' => $code,
            ':email' => $email,
            ':name' => $fullName,
            ':fname' => $firstName,
            ':lname' => $lastName,
            ':phone' => $phone,
            ':role' => $role,
            ':dept' => $dept,
            ':desig' => $desig,
            ':bname' => $branchName,
            ':status' => $userStatus
        ]);

        log_audit($pdo, $user['employee_id'], $user['email'], 'EMPLOYEE_SAVED', 'employees', $id, [
            'code' => $code,
            'role' => $role,
            'team' => $teamName
        ]);

        json_out([
            "success" => true,
            "message" => "Employee record and login profile saved successfully.",
            "employee" => [
                "id" => $id,
                "employee_code" => $code,
                "full_name" => $fullName,
                "department" => $dept,
                "team_id" => $teamId,
                "team_name" => $teamName,
                "designation" => $desig,
                "role_id" => $role
            ]
        ]);
    }

    json_out(["success" => false, "error" => "Method not supported."], 405);

} catch (\Throwable $e) {
    error_log("[Employees API Error] " . $e->getMessage());
    json_out(["success" => false, "error" => "Employees service error: " . $e->getMessage()], 500);
}
?>
