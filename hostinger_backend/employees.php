<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = get_json_input();

try {
    // -----------------------------------------------------------------------------
    // GET: List Employees or Org Tree
    // -----------------------------------------------------------------------------
    if ($method === 'GET') {
        // 1. Return dynamic Org Chart Tree
        if ($action === 'tree') {
            $stmt = $pdo->query("
                SELECT id, employee_code, full_name, role_id, department, designation, manager_id, manager, profile_photo_url, employment_status
                FROM employees 
                WHERE employment_status = 'ACTIVE'
                ORDER BY full_name ASC
            ");
            $all = $stmt->fetchAll();

            // Build parent-child tree dynamically
            $byId = [];
            $roots = [];
            foreach ($all as $emp) {
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
        $id = $_GET['id'] ?? '';
        if (!empty($id)) {
            $stmt = $pdo->prepare("SELECT * FROM employees WHERE id = :id OR employee_code = :code LIMIT 1");
            $stmt->execute([':id' => $id, ':code' => $id]);
            $emp = $stmt->fetch();
            if (!$emp) json_out(["success" => false, "error" => "Employee not found"], 404);
            json_out(["success" => true, "employee" => $emp]);
        }

        // 3. Searchable employee roster
        $search = trim($_GET['search'] ?? '');
        $dept = trim($_GET['department'] ?? '');
        $status = trim($_GET['status'] ?? '');

        $sql = "SELECT * FROM employees WHERE 1=1";
        $params = [];

        if (!empty($search)) {
            $sql .= " AND (full_name LIKE :s OR employee_code LIKE :s OR work_email LIKE :s OR designation LIKE :s)";
            $params[':s'] = "%$search%";
        }
        if (!empty($dept) && $dept !== 'All') {
            $sql .= " AND department = :d";
            $params[':d'] = $dept;
        }
        if (!empty($status) && $status !== 'All') {
            $sql .= " AND employment_status = :st";
            $params[':st'] = $status;
        }

        $sql .= " ORDER BY full_name ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $employees = $stmt->fetchAll();

        json_out([
            "success" => true,
            "count" => count($employees),
            "employees" => $employees
        ]);
    }

    // -----------------------------------------------------------------------------
    // DELETE / POST action=delete: Delete Employee & Associated User Account
    // -----------------------------------------------------------------------------
    if ($method === 'DELETE' || ($method === 'POST' && ($action === 'delete' || ($input['action'] ?? '') === 'delete'))) {
        $id = trim($_GET['id'] ?? $input['id'] ?? '');
        $code = trim($_GET['employee_code'] ?? $input['employee_code'] ?? $input['code'] ?? '');
        $email = strtolower(trim($_GET['email'] ?? $input['email'] ?? $input['work_email'] ?? ''));

        if (empty($id) && empty($code) && empty($email)) {
            json_out(["success" => false, "error" => "Employee id, employee_code, or email is required to delete."], 400);
        }

        $empDeleted = 0;
        $userDeleted = 0;

        // If specific ID or employee_code provided, delete only that specific record
        if (!empty($id) || !empty($code)) {
            $delEmp = $pdo->prepare("DELETE FROM employees WHERE id = :id OR (employee_code = :c AND :c != '')");
            $delEmp->execute([':id' => $id, ':c' => $code]);
            $empDeleted = $delEmp->rowCount();

            $delUser = $pdo->prepare("DELETE FROM users WHERE uid = :id OR (employee_code = :c AND :c != '')");
            $delUser->execute([':id' => $id, ':c' => $code]);
            $userDeleted = $delUser->rowCount();
        } elseif (!empty($email)) {
            $delEmp = $pdo->prepare("DELETE FROM employees WHERE LOWER(work_email) = :e OR LOWER(email) = :e");
            $delEmp->execute([':e' => $email]);
            $empDeleted = $delEmp->rowCount();

            $delUser = $pdo->prepare("DELETE FROM users WHERE LOWER(email) = :e");
            $delUser->execute([':e' => $email]);
            $userDeleted = $delUser->rowCount();
        }

        log_audit($pdo, 'admin', 'system', 'EMPLOYEE_DELETED', 'employees', $id ?: $code, [
            'id' => $id,
            'code' => $code,
            'email' => $email,
            'emp_deleted' => $empDeleted,
            'user_deleted' => $userDeleted
        ]);

        json_out([
            "success" => true,
            "message" => "Employee record and login account permanently deleted from MySQL.",
            "deleted_count" => $empDeleted
        ]);
    }

    // -----------------------------------------------------------------------------
    // POST: Create or Update Employee
    // -----------------------------------------------------------------------------
    if ($method === 'POST') {
        $code = strtoupper(trim($input['employee_code'] ?? $input['code'] ?? ''));
        $fullName = trim($input['full_name'] ?? ($input['name'] ?? ($input['first_name'] ?? '' . ' ' . $input['last_name'] ?? '')));
        $email = strtolower(trim($input['work_email'] ?? $input['email'] ?? ''));
        $phone = trim($input['phone'] ?? '');
        $dept = trim($input['department'] ?? 'Operations');
        $desig = trim($input['designation'] ?? 'Associate');
        $role = strtoupper(trim($input['role_id'] ?? $input['role'] ?? 'EMPLOYEE'));
        $validRoles = ['SUPER_ADMIN', 'HR_MANAGER', 'MANAGER', 'OPERATIONS_MANAGER', 'TEAM_LEAD', 'RELATIONSHIP_MANAGER', 'MENTOR_TRAINER', 'TRAINEE', 'EMPLOYEE'];
        if (!in_array($role, $validRoles)) $role = 'EMPLOYEE';

        $mgrId = trim($input['manager_id'] ?? '');
        $mgrName = trim($input['manager'] ?? '');
        $mentor = trim($input['mentor'] ?? '');
        $status = strtoupper(trim($input['employment_status'] ?? $input['status'] ?? 'ACTIVE'));
        $validStatuses = ['ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'SUSPENDED', 'RESIGNED', 'TERMINATED'];
        if (!in_array($status, $validStatuses)) $status = 'ACTIVE';

        $doj = $input['date_of_joining'] ?? date('Y-m-d');
        $id = trim($input['id'] ?? ('emp_' . bin2hex(random_bytes(8))));

        if (empty($fullName) || empty($email)) {
            json_out(["success" => false, "error" => "Full Name and Email are required."], 400);
        }

        if (empty($code)) {
            $code = 'D' . str_pad(rand(100, 99999), 5, '0', STR_PAD_LEFT);
        }

        $parts = explode(' ', $fullName);
        $firstName = $input['first_name'] ?? ($parts[0] ?? $fullName);
        $lastName = $input['last_name'] ?? (count($parts) > 1 ? end($parts) : '');

        // 1. Save to employees table
        $stmt = $pdo->prepare("
            INSERT INTO employees (
                id, employee_code, first_name, last_name, full_name, email, work_email, phone,
                department, designation, role_id, manager_id, manager, mentor,
                date_of_joining, employment_status, status
            ) VALUES (
                :id, :code, :fname, :lname, :name, :email, :wemail, :phone,
                :dept, :desig, :role, :mid, :mname, :mentor,
                :doj, :estatus, :status
            )
            ON DUPLICATE KEY UPDATE
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                full_name = VALUES(full_name),
                email = VALUES(email),
                work_email = VALUES(work_email),
                phone = VALUES(phone),
                department = VALUES(department),
                designation = VALUES(designation),
                role_id = VALUES(role_id),
                manager_id = VALUES(manager_id),
                manager = VALUES(manager),
                mentor = VALUES(mentor),
                employment_status = VALUES(employment_status),
                status = VALUES(status)
        ");

        $stmt->execute([
            ':id' => $id,
            ':code' => $code,
            ':fname' => $firstName,
            ':lname' => $lastName,
            ':name' => $fullName,
            ':email' => $email,
            ':wemail' => $email,
            ':phone' => $phone,
            ':dept' => $dept,
            ':desig' => $desig,
            ':role' => $role,
            ':mid' => !empty($mgrId) ? $mgrId : null,
            ':mname' => !empty($mgrName) ? $mgrName : null,
            ':mentor' => !empty($mentor) ? $mentor : null,
            ':doj' => $doj,
            ':estatus' => $status,
            ':status' => $status
        ]);

        // 2. Also auto-sync user login record
        $userStmt = $pdo->prepare("
            INSERT INTO users (uid, employee_code, email, display_name, first_name, last_name, phone, role_id, department, designation, status)
            VALUES (:uid, :code, :email, :name, :fname, :lname, :phone, :role, :dept, :desig, :status)
            ON DUPLICATE KEY UPDATE
                display_name = VALUES(display_name),
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                phone = VALUES(phone),
                role_id = VALUES(role_id),
                department = VALUES(department),
                designation = VALUES(designation),
                status = VALUES(status)
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
            ':status' => in_array($status, ['ACTIVE', 'SUSPENDED', 'PENDING', 'INACTIVE']) ? $status : 'ACTIVE'
        ]);

        json_out([
            "success" => true,
            "message" => "Employee record and login profile saved successfully.",
            "employee" => [
                "id" => $id,
                "employee_code" => $code,
                "full_name" => $fullName,
                "department" => $dept,
                "designation" => $desig,
                "role_id" => $role
            ]
        ]);
    }

} catch (\Throwable $e) {
    error_log("[Employees API Error] " . $e->getMessage());
    json_out(["success" => false, "error" => $e->getMessage()], 500);
}
?>
