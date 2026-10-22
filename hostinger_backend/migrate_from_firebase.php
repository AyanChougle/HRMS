<?php
require_once 'db.php';

// Increase execution limits for bulk migration
set_time_limit(300);
ini_set('memory_limit', '256M');

$input = get_json_input();
if (empty($input)) {
    json_out(["success" => false, "error" => "No migration payload provided."], 400);
}

$results = [
    "users" => 0,
    "employees" => 0,
    "attendance_records" => 0,
    "leave_applications" => 0,
    "departments" => 0,
    "audit_logs" => 0
];

try {
    $pdo->beginTransaction();

    // -------------------------------------------------------------------------
    // 1. MIGRATE USERS
    // -------------------------------------------------------------------------
    if (!empty($input['users']) && is_array($input['users'])) {
        $stmt = $pdo->prepare("
            INSERT INTO users (uid, employee_code, email, password_hash, display_name, first_name, last_name, phone, role_id, company_id, branch_name, department, designation, status)
            VALUES (:uid, :code, :email, :pass, :name, :fname, :lname, :phone, :role, :comp, :branch, :dept, :desig, :status)
            ON DUPLICATE KEY UPDATE display_name = :name, role_id = :role, department = :dept, designation = :desig, status = :status
        ");

        foreach ($input['users'] as $u) {
            $uid = $u['uid'] ?? $u['id'] ?? ('usr_' . bin2hex(random_bytes(6)));
            $email = strtolower(trim($u['email'] ?? ''));
            if (empty($email)) continue;

            $fullName = trim($u['displayName'] ?? $u['fullName'] ?? $u['name'] ?? 'User');
            $parts = explode(' ', $fullName);
            $fname = $u['firstName'] ?? ($parts[0] ?? $fullName);
            $lname = $u['lastName'] ?? (count($parts) > 1 ? end($parts) : '');
            $role = strtoupper(trim($u['roleId'] ?? $u['role'] ?? 'EMPLOYEE'));
            $status = strtoupper(trim($u['status'] ?? 'ACTIVE'));

            $stmt->execute([
                ':uid' => $uid,
                ':code' => $u['employeeCode'] ?? null,
                ':email' => $email,
                ':pass' => password_hash('Diallo@2026', PASSWORD_DEFAULT),
                ':name' => $fullName,
                ':fname' => $fname,
                ':lname' => $lname,
                ':phone' => $u['phone'] ?? null,
                ':role' => in_array($role, ['SUPER_ADMIN', 'HR_MANAGER', 'MANAGER', 'OPERATIONS_MANAGER', 'TEAM_LEAD', 'MENTOR_TRAINER', 'TRAINEE', 'EMPLOYEE']) ? $role : 'EMPLOYEE',
                ':comp' => $u['companyId'] ?? 'comp_diallo_india',
                ':branch' => $u['branchName'] ?? 'Ghansoli - Navi Mumbai, Maharashtra',
                ':dept' => $u['department'] ?? 'Operations',
                ':desig' => $u['designation'] ?? 'Associate',
                ':status' => in_array($status, ['ACTIVE', 'SUSPENDED', 'PENDING', 'INACTIVE']) ? $status : 'ACTIVE'
            ]);
            $results['users']++;
        }
    }

    // -------------------------------------------------------------------------
    // 2. MIGRATE EMPLOYEES
    // -------------------------------------------------------------------------
    if (!empty($input['employees']) && is_array($input['employees'])) {
        $stmt = $pdo->prepare("
            INSERT INTO employees (
                id, user_id, employee_code, first_name, last_name, full_name, email, work_email, phone,
                department, designation, role_id, manager_id, manager, mentor,
                date_of_joining, employment_status, status
            ) VALUES (
                :id, :uid, :code, :fname, :lname, :name, :email, :wemail, :phone,
                :dept, :desig, :role, :mid, :mname, :mentor,
                :doj, :estatus, :status
            )
            ON DUPLICATE KEY UPDATE
                full_name = :name, department = :dept, designation = :desig, role_id = :role,
                manager_id = :mid, manager = :mname, employment_status = :estatus
        ");

        foreach ($input['employees'] as $e) {
            $id = $e['id'] ?? ('emp_' . bin2hex(random_bytes(6)));
            $code = strtoupper(trim($e['employeeCode'] ?? $e['code'] ?? ''));
            if (empty($code)) $code = 'D' . str_pad(rand(100, 99999), 5, '0', STR_PAD_LEFT);

            $name = trim($e['fullName'] ?? $e['name'] ?? 'Employee');
            $parts = explode(' ', $name);
            $fname = $e['firstName'] ?? ($parts[0] ?? $name);
            $lname = $e['lastName'] ?? (count($parts) > 1 ? end($parts) : '');
            $email = strtolower(trim($e['workEmail'] ?? $e['email'] ?? ''));
            $role = strtoupper(trim($e['roleId'] ?? $e['role'] ?? 'EMPLOYEE'));
            $status = strtoupper(trim($e['employmentStatus'] ?? $e['status'] ?? 'ACTIVE'));

            $stmt->execute([
                ':id' => $id,
                ':uid' => $e['userId'] ?? $id,
                ':code' => $code,
                ':fname' => $fname,
                ':lname' => $lname,
                ':name' => $name,
                ':email' => $email,
                ':wemail' => $email,
                ':phone' => $e['phone'] ?? null,
                ':dept' => $e['department'] ?? 'Operations',
                ':desig' => $e['designation'] ?? 'Associate',
                ':role' => in_array($role, ['SUPER_ADMIN', 'HR_MANAGER', 'MANAGER', 'OPERATIONS_MANAGER', 'TEAM_LEAD', 'MENTOR_TRAINER', 'TRAINEE', 'EMPLOYEE']) ? $role : 'EMPLOYEE',
                ':mid' => $e['managerId'] ?? null,
                ':mname' => $e['manager'] ?? null,
                ':mentor' => $e['mentor'] ?? null,
                ':doj' => $e['dateOfJoining'] ?? date('Y-m-d'),
                ':estatus' => in_array($status, ['ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'SUSPENDED', 'RESIGNED', 'TERMINATED']) ? $status : 'ACTIVE',
                ':status' => $status
            ]);
            $results['employees']++;
        }
    }

    // -------------------------------------------------------------------------
    // 3. MIGRATE ATTENDANCE RECORDS
    // -------------------------------------------------------------------------
    if (!empty($input['attendanceRecords']) && is_array($input['attendanceRecords'])) {
        $stmt = $pdo->prepare("
            INSERT INTO attendance_records (
                record_key, employee_id, employee_code, employee_name, department, date,
                check_in, check_out, status, late_minutes, location, latitude, longitude
            ) VALUES (
                :key, :eid, :code, :name, :dept, :d,
                :cin, :cout, :st, :late, :loc, :lat, :lng
            )
            ON DUPLICATE KEY UPDATE check_in = :cin, check_out = :cout, status = :st
        ");

        foreach ($input['attendanceRecords'] as $a) {
            $eid = $a['employeeId'] ?? $a['id'] ?? '';
            $d = $a['date'] ?? date('Y-m-d');
            if (empty($eid)) continue;

            $key = "{$eid}_{$d}";
            $stmt->execute([
                ':key' => $key,
                ':eid' => $eid,
                ':code' => $a['employeeCode'] ?? 'EMP-001',
                ':name' => $a['employeeName'] ?? 'Employee',
                ':dept' => $a['department'] ?? 'Operations',
                ':d' => $d,
                ':cin' => $a['checkIn'] ?? null,
                ':cout' => $a['checkOut'] ?? null,
                ':st' => in_array($a['status'] ?? '', ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'WEEKLY_OFF', 'HOLIDAY', 'ON_BREAK']) ? $a['status'] : 'PRESENT',
                ':late' => intval($a['lateMinutes'] ?? 0),
                ':loc' => $a['location'] ?? 'HQ - Mumbai',
                ':lat' => isset($a['latitude']) ? floatval($a['latitude']) : null,
                ':lng' => isset($a['longitude']) ? floatval($a['longitude']) : null
            ]);
            $results['attendance_records']++;
        }
    }

    $pdo->commit();

    json_out([
        "success" => true,
        "message" => "Firebase to MySQL migration completed successfully!",
        "migrated_counts" => $results
    ]);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    json_out(["success" => false, "error" => "Migration failed: " . $e->getMessage()], 500);
}
?>
