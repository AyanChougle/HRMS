<?php
require_once 'db.php';

header("Content-Type: application/json; charset=UTF-8");

function normalize_date_to_mysql($dateStr) {
    if (empty($dateStr)) return date('Y-m-d');
    $dateStr = trim($dateStr);
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateStr)) {
        return $dateStr;
    }
    if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $dateStr, $m)) {
        $p1 = intval($m[1]);
        $p2 = intval($m[2]);
        $year = intval($m[3]);
        if ($p1 > 12) {
            return sprintf('%04d-%02d-%02d', $year, $p2, $p1);
        } else {
            return sprintf('%04d-%02d-%02d', $year, $p1, $p2);
        }
    }
    $ts = strtotime($dateStr);
    return $ts ? date('Y-m-d', $ts) : date('Y-m-d');
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = get_json_input();

if (empty($action) && isset($input['action'])) {
    $action = $input['action'];
}

try {
    $currentUser = require_authenticated_user($pdo);
    $userRole = canonical_role($currentUser['role_id']);

    // -----------------------------------------------------------------------------
    // GET: Fetch all users or single user
    // -----------------------------------------------------------------------------
    if ($method === 'GET') {
        $search = trim($_GET['search'] ?? '');
        $role = trim($_GET['role'] ?? '');
        $status = trim($_GET['status'] ?? '');
        $uid = trim($_GET['uid'] ?? '');
        $emailParam = trim($_GET['email'] ?? '');

        if (!empty($uid)) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE uid = :uid OR id = :id LIMIT 1");
            $stmt->execute([':uid' => $uid, ':id' => $uid]);
            $user = $stmt->fetch();
            if ($user) {
                $user['role_id'] = canonical_role($user['role_id']);
                $rawHash = $user['password_hash'] ?? '';
                $initPwd = $user['initial_password'] ?? '';
                $isBcrypt = (strpos($rawHash, '$2y$') === 0 || strpos($rawHash, '$2a$') === 0 || strpos($rawHash, '$2b$') === 0 || strpos($rawHash, '$argon2') === 0);
                if (!$isBcrypt && !empty($rawHash)) {
                    $user['login_password'] = $rawHash;
                    $user['initial_password'] = $rawHash;
                } elseif (!empty($initPwd)) {
                    $user['login_password'] = $initPwd;
                } else {
                    $user['login_password'] = '••••••••';
                }
                unset($user['password_hash']);
            }
            json_out(["success" => true, "user" => $user]);
        }

        $sql = "SELECT id, uid, employee_code, email, password_hash, initial_password, display_name, first_name, last_name, phone, role_id, company_name, branch_name, department, designation, status, last_login_at, created_at, updated_at FROM users WHERE 1=1";
        $params = [];

        if (!empty($emailParam)) {
            $sql .= " AND email = :email";
            $params[':email'] = $emailParam;
        }

        if (!empty($search)) {
            $sql .= " AND (display_name LIKE :s OR email LIKE :s OR employee_code LIKE :s OR department LIKE :s)";
            $params[':s'] = "%$search%";
        }
        if (!empty($role) && $role !== 'All') {
            $sql .= " AND role_id = :r";
            $params[':r'] = canonical_role($role);
        }
        if (!empty($status) && $status !== 'All') {
            $sql .= " AND status = :st";
            $params[':st'] = $status;
        }

        $sql .= " ORDER BY (role_id = 'ADMIN') DESC, display_name ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll();

        foreach ($users as &$u) {
            $u['role_id'] = canonical_role($u['role_id']);

            // Resolve exact dynamic login password from MySQL for Admin/HR oversight
            $rawHash = $u['password_hash'] ?? '';
            $initPwd = $u['initial_password'] ?? '';
            $isBcrypt = (strpos($rawHash, '$2y$') === 0 || strpos($rawHash, '$2a$') === 0 || strpos($rawHash, '$2b$') === 0 || strpos($rawHash, '$argon2') === 0);

            if (!$isBcrypt && !empty($rawHash)) {
                // Stored directly in plaintext via phpMyAdmin
                $u['login_password'] = $rawHash;
                $u['initial_password'] = $rawHash;
            } elseif (!empty($initPwd)) {
                // Stored during creation / login sync
                $u['login_password'] = $initPwd;
                $u['initial_password'] = $initPwd;
            } elseif ($u['email'] === 'ayanislight@gmail.com' || strtolower($u['employee_code'] ?? '') === 'd0001') {
                $u['login_password'] = 'Diallo@2026';
                $u['initial_password'] = 'Diallo@2026';
            } else {
                // Standard convention: FirstName@EmpCode
                $firstToken = explode(' ', trim($u['display_name'] ?? $u['first_name'] ?? ''))[0];
                $fname = ucfirst(strtolower($firstToken));
                $code = strtoupper(trim(str_replace('-', '', $u['employee_code'] ?? '')));
                $u['login_password'] = ($fname && $code) ? "{$fname}@{$code}" : '••••••••';
                $u['initial_password'] = $u['login_password'];
            }
            unset($u['password_hash']);
        }

        json_out([
            "success" => true,
            "count" => count($users),
            "users" => $users
        ]);
    }

    // -----------------------------------------------------------------------------
    // POST / PUT: Create or Update User & Role
    // -----------------------------------------------------------------------------
    if ($method === 'POST') {
        $uid = trim($input['uid'] ?? $input['id'] ?? '');

        // 1. CREATE USER
        if ($action === 'create' || empty($uid)) {
            $email = strtolower(trim($input['email'] ?? ''));
            $password = trim($input['password'] ?? $input['initialPassword'] ?? $input['initial_password'] ?? '');
            if (empty($password)) {
                $password = 'TradeForWealth@2026';
            }
            $displayName = trim($input['display_name'] ?? $input['displayName'] ?? '');
            $firstName = trim($input['first_name'] ?? $input['firstName'] ?? '');
            $lastName = trim($input['last_name'] ?? $input['lastName'] ?? '');
            $roleId = canonical_role($input['role_id'] ?? $input['roleId'] ?? 'EMPLOYEE');
            $department = trim($input['department'] ?? 'Sales');
            $designation = trim($input['designation'] ?? 'Relationship Manager');
            $phone = trim($input['phone'] ?? '');
            $employeeCode = strtoupper(trim($input['employee_code'] ?? $input['employeeCode'] ?? ''));
            $status = strtoupper(trim($input['status'] ?? 'ACTIVE'));
            if (!in_array($status, ['ACTIVE', 'INACTIVE', 'SUSPENDED'])) $status = 'ACTIVE';

            $managerId = trim($input['manager_id'] ?? $input['managerId'] ?? '');
            $manager = trim($input['manager'] ?? $input['manager_name'] ?? $input['managerName'] ?? '');
            $teamLeadId = trim($input['team_lead_id'] ?? $input['teamLeadId'] ?? '');
            $teamLead = trim($input['team_lead'] ?? $input['team_lead_name'] ?? $input['teamLeadName'] ?? '');
            $mentor = trim($input['mentor'] ?? $input['mentor_name'] ?? $input['mentorName'] ?? '');
            
            $rawDoj = trim($input['date_of_joining'] ?? $input['joiningDate'] ?? $input['dateOfJoining'] ?? $input['doj'] ?? date('Y-m-d'));
            $dateOfJoining = normalize_date_to_mysql($rawDoj);

            $branchName = trim($input['branch_name'] ?? $input['branchName'] ?? $input['location'] ?? 'Trade For Wealth - HQ Mumbai');
            $location = $branchName;

            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                json_out(["success" => false, "error" => "Valid email address is required."], 400);
            }

            if (empty($displayName)) {
                $displayName = trim("$firstName $lastName") ?: explode('@', $email)[0];
            }

            // Extract employee code from password if entered like Shirkant@D08532
            if (empty($employeeCode) && preg_match('/@([dD][0-9]{4,6})/i', $password, $mCode)) {
                $employeeCode = strtoupper($mCode[1]);
            }

            // Auto-generate employee code if missing (D00000 format)
            if (empty($employeeCode)) {
                try {
                    $cStmt = $pdo->query("SELECT employee_code FROM employees WHERE employee_code REGEXP '^D[0-9]+$' ORDER BY LENGTH(employee_code) DESC, employee_code DESC LIMIT 1");
                    $maxRow = $cStmt ? $cStmt->fetch() : null;
                    if ($maxRow && preg_match('/^D([0-9]+)$/', $maxRow['employee_code'], $m)) {
                        $nextNum = intval($m[1]) + 1;
                        $employeeCode = 'D' . str_pad($nextNum, 5, '0', STR_PAD_LEFT);
                    } else {
                        $employeeCode = 'D06813';
                    }
                } catch (\Throwable $e) {
                    $employeeCode = 'D' . rand(10000, 99999);
                }
            }

            $cleanCode = strtolower(str_replace(['-', ' '], '', $employeeCode));
            $newUid = 'emp_' . ($cleanCode ?: bin2hex(random_bytes(6)));
            $hash = password_hash($password, PASSWORD_BCRYPT);

            // Ensure initial_password column exists if not already present
            try {
                $hasCol = $pdo->query("SHOW COLUMNS FROM users LIKE 'initial_password'")->fetch();
                if (!$hasCol) {
                    $pdo->exec("ALTER TABLE users ADD COLUMN initial_password VARCHAR(255) DEFAULT NULL AFTER password_hash");
                }
                $hasEmpCol = $pdo->query("SHOW COLUMNS FROM employees LIKE 'initial_password'")->fetch();
                if (!$hasEmpCol) {
                    $pdo->exec("ALTER TABLE employees ADD COLUMN initial_password VARCHAR(255) DEFAULT NULL");
                }
            } catch (\Throwable $e) {}

            // Insert or Update in users table
            $insStmt = $pdo->prepare("
                INSERT INTO users (
                    uid, employee_code, email, password_hash, initial_password, display_name, first_name, last_name,
                    phone, role_id, department, designation, status, company_id
                ) VALUES (
                    :uid, :code, :email, :hash, :init_pwd, :name, :first, :last,
                    :phone, :role, :dept, :desig, :status, 'comp_diallo_india'
                )
                ON DUPLICATE KEY UPDATE
                    employee_code = VALUES(employee_code),
                    password_hash = VALUES(password_hash),
                    initial_password = VALUES(initial_password),
                    display_name = VALUES(display_name),
                    first_name = VALUES(first_name),
                    last_name = VALUES(last_name),
                    phone = VALUES(phone),
                    role_id = VALUES(role_id),
                    department = VALUES(department),
                    designation = VALUES(designation),
                    status = VALUES(status)
            ");
            $insStmt->execute([
                ':uid' => $newUid,
                ':code' => $employeeCode,
                ':email' => $email,
                ':hash' => $hash,
                ':init_pwd' => $password,
                ':name' => $displayName,
                ':first' => $firstName,
                ':last' => $lastName,
                ':phone' => $phone,
                ':role' => $roleId,
                ':dept' => $department,
                ':desig' => $designation,
                ':status' => $status
            ]);

            $newId = $pdo->lastInsertId();

            // Insert or Update in employees table
            $empStmt = $pdo->prepare("
                INSERT INTO employees (
                    id, user_id, employee_code, first_name, last_name, full_name,
                    work_email, email, phone, role_id, department, designation,
                    manager_id, manager, team_lead_id, team_lead, mentor,
                    date_of_joining, branch_name, location,
                    employment_status, status, company_id, initial_password
                ) VALUES (
                    :id, :uid, :code, :first, :last, :full,
                    :email, :email2, :phone, :role, :dept, :desig,
                    :mid, :mname, :tlid, :tlname, :mentor,
                    :doj, :bname, :loc,
                    :estatus, :status, 'comp_diallo_india', :init_pwd
                )
                ON DUPLICATE KEY UPDATE
                    user_id = VALUES(user_id),
                    employee_code = VALUES(employee_code),
                    first_name = VALUES(first_name),
                    last_name = VALUES(last_name),
                    full_name = VALUES(full_name),
                    work_email = VALUES(work_email),
                    email = VALUES(email),
                    phone = VALUES(phone),
                    role_id = VALUES(role_id),
                    department = VALUES(department),
                    designation = VALUES(designation),
                    manager_id = VALUES(manager_id),
                    manager = VALUES(manager),
                    team_lead_id = VALUES(team_lead_id),
                    team_lead = VALUES(team_lead),
                    mentor = VALUES(mentor),
                    date_of_joining = VALUES(date_of_joining),
                    employment_status = VALUES(employment_status),
                    status = VALUES(status),
                    initial_password = VALUES(initial_password)
            ");
            $empStmt->execute([
                ':id' => $newUid,
                ':uid' => $newUid,
                ':code' => $employeeCode,
                ':first' => $firstName,
                ':last' => $lastName,
                ':full' => $displayName,
                ':email' => $email,
                ':email2' => $email,
                ':phone' => $phone,
                ':role' => $roleId,
                ':dept' => $department,
                ':desig' => $designation,
                ':mid' => $managerId ?: null,
                ':mname' => $manager ?: null,
                ':tlid' => $teamLeadId ?: null,
                ':tlname' => $teamLead ?: null,
                ':mentor' => $mentor ?: null,
                ':doj' => $dateOfJoining,
                ':bname' => $branchName,
                ':loc' => $location,
                ':estatus' => $status,
                ':status' => $status,
                ':init_pwd' => $password
            ]);

            json_out([
                "success" => true,
                "message" => "User {$displayName} ({$employeeCode}) created successfully.",
                "user" => [
                    "id" => $newId,
                    "uid" => $newUid,
                    "employee_code" => $employeeCode,
                    "email" => $email,
                    "display_name" => $displayName,
                    "role_id" => $roleId,
                    "department" => $department,
                    "designation" => $designation,
                    "status" => $status,
                    "login_password" => $password
                ]
            ], 201);
        }

        // 2. UPDATE USER
        $stmt = $pdo->prepare("SELECT * FROM users WHERE uid = :uid OR id = :uid LIMIT 1");
        $stmt->execute([':uid' => $uid]);
        $user = $stmt->fetch();

        if (!$user) {
            json_out(["success" => false, "error" => "User account not found."], 404);
        }

        $displayName = trim($input['display_name'] ?? $user['display_name']);
        $roleId = canonical_role($input['role_id'] ?? $user['role_id']);
        $department = trim($input['department'] ?? $user['department']);
        $designation = trim($input['designation'] ?? $user['designation']);
        $phone = trim($input['phone'] ?? $user['phone']);
        $status = trim($input['status'] ?? $user['status']);
        $employeeCode = strtoupper(trim($input['employee_code'] ?? $user['employee_code']));

        // Optional password update
        $passwordSql = "";
        $updateParams = [
            ':name' => $displayName,
            ':role' => $roleId,
            ':dept' => $department,
            ':desig' => $designation,
            ':phone' => $phone,
            ':status' => $status,
            ':code' => $employeeCode,
            ':id' => $user['id']
        ];

        if (!empty($input['password'])) {
            $newPlainPassword = trim($input['password']);
            $passwordSql = ", password_hash = :hash, initial_password = :init_pwd";
            $updateParams[':hash'] = password_hash($newPlainPassword, PASSWORD_BCRYPT);
            $updateParams[':init_pwd'] = $newPlainPassword;
        }

        // 1. Update users table
        $upStmt = $pdo->prepare("
            UPDATE users 
            SET display_name = :name, role_id = :role, department = :dept, designation = :desig, phone = :phone, status = :status, employee_code = :code $passwordSql
            WHERE id = :id
        ");
        $upStmt->execute($updateParams);

        // 2. Cross-sync to employees table
        $empPwdSql = (!empty($input['password'])) ? ", initial_password = " . $pdo->quote(trim($input['password'])) : "";
        $empStmt = $pdo->prepare("
            UPDATE employees 
            SET full_name = :name, role_id = :role, department = :dept, designation = :desig, phone = :phone, employment_status = :status, employee_code = :code $empPwdSql
            WHERE user_id = :uid OR id = :uid OR LOWER(work_email) = :email
        ");
        $empStmt->execute([
            ':name' => $displayName,
            ':role' => $roleId,
            ':dept' => $department,
            ':desig' => $designation,
            ':phone' => $phone,
            ':status' => $status,
            ':code' => $employeeCode,
            ':uid' => $user['uid'],
            ':email' => strtolower($user['email'])
        ]);

        log_audit($pdo, $user['uid'], $user['email'], 'USER_ROLE_UPDATED', 'users', $user['id'], [
            'new_role' => $roleId,
            'new_status' => $status
        ]);

        json_out([
            "success" => true,
            "message" => "User {$displayName} and assigned role updated successfully.",
            "user" => [
                "uid" => $user['uid'],
                "display_name" => $displayName,
                "role_id" => $roleId,
                "department" => $department,
                "designation" => $designation,
                "status" => $status
            ]
        ]);
    }

    // -----------------------------------------------------------------------------
    // DELETE: Delete user account (ADMIN / HR)
    // -----------------------------------------------------------------------------
    if ($method === 'DELETE' || ($method === 'POST' && ($action === 'delete' || ($input['action'] ?? '') === 'delete'))) {
        $curr = get_current_user_or_null($pdo);
        $role = canonical_role($curr['role_id'] ?? '');
        if (!in_array($role, ['ADMIN', 'HR', 'SUPER_ADMIN', 'COMPANY_ADMIN'])) {
            json_out(["success" => false, "error" => "Unauthorized: Only Admin or HR can delete user accounts."], 403);
        }

        $targetId = trim($_GET['id'] ?? $input['id'] ?? '');
        $targetUid = trim($_GET['uid'] ?? $input['uid'] ?? '');
        $targetEmail = strtolower(trim($_GET['email'] ?? $input['email'] ?? ''));

        if (empty($targetId) && empty($targetUid) && empty($targetEmail)) {
            json_out(["success" => false, "error" => "User id, uid, or email is required to delete."], 400);
        }

        $delStmt = $pdo->prepare("DELETE FROM users WHERE id = :id OR uid = :uid OR LOWER(email) = :e");
        $delStmt->execute([':id' => $targetId ?: -1, ':uid' => $targetUid ?: 'none', ':e' => $targetEmail ?: 'none']);
        $cnt = $delStmt->rowCount();

        json_out(["success" => true, "message" => "User deleted successfully.", "deleted_count" => $cnt]);
    }

} catch (\Throwable $e) {
    error_log("[users.php Error] " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
    json_out([
        "success" => false,
        "error" => "Account processing error: " . $e->getMessage()
    ], 500);
}
