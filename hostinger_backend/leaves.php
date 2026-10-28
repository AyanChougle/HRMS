<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = get_json_input();

if (empty($action) && isset($input['action'])) {
    $action = $input['action'];
}

$currentUser = get_current_user_or_null($pdo);
$userRole = canonical_role($currentUser['role_id'] ?? $_GET['role'] ?? 'EMPLOYEE');
$userCode = $currentUser['employee_code'] ?? $_GET['employee_code'] ?? '';
$userUid = $currentUser['uid'] ?? $currentUser['id'] ?? $_GET['uid'] ?? '';
$userDept = $currentUser['department'] ?? '';

// -----------------------------------------------------------------------------
// GET: Fetch Leaves or Balances
// -----------------------------------------------------------------------------
if ($method === 'GET') {
    $empId = trim($_GET['employee_id'] ?? '');

    // Get Balances
    if ($action === 'balances') {
        if (empty($empId)) $empId = $userUid;
        if (empty($empId)) json_out(["success" => false, "error" => "Employee ID is required."], 400);

        $year = intval($_GET['year'] ?? date('Y'));
        $stmt = $pdo->prepare("SELECT * FROM leave_balances WHERE (employee_id = :eid OR employee_id = :ecode) AND year = :y");
        $stmt->execute([':eid' => $empId, ':ecode' => $userCode, ':y' => $year]);
        $balances = $stmt->fetchAll();

        // Default standard leave balance if none initialized
        if (empty($balances)) {
            $types = ['Casual Leave' => 12, 'Sick Leave' => 12, 'Earned Leave' => 15];
            foreach ($types as $t => $days) {
                $pdo->prepare("
                    INSERT IGNORE INTO leave_balances (employee_id, leave_type, year, total_credited, used, available)
                    VALUES (:eid, :t, :y, :c, 0, :c)
                ")->execute([':eid' => $empId, ':t' => $t, ':y' => $year, ':c' => $days]);
            }
            $stmt->execute([':eid' => $empId, ':ecode' => $userCode, ':y' => $year]);
            $balances = $stmt->fetchAll();
        }

        json_out(["success" => true, "balances" => $balances]);
    }

    // List Leave Applications
    $status = trim($_GET['status'] ?? '');
    $sql = "SELECT l.* FROM leave_applications l LEFT JOIN employees e ON (l.employee_id = e.id OR l.employee_code = e.employee_code) WHERE 1=1";
    $params = [];

    // Role Scoping
    if ($userRole === 'EMPLOYEE') {
        $sql .= " AND (l.employee_id = :self_uid OR l.employee_code = :self_code)";
        $params[':self_uid'] = $userUid;
        $params[':self_code'] = $userCode;
    } elseif ($userRole === 'TL') {
        $sql .= " AND (l.employee_id = :self_uid OR l.employee_code = :self_code OR e.team_lead_id = :tlid OR e.team_lead_id = :tlcode OR e.manager_id = :tlid OR e.manager_id = :tlcode)";
        $params[':self_uid'] = $userUid;
        $params[':self_code'] = $userCode;
        $params[':tlid'] = $userUid;
        $params[':tlcode'] = $userCode;
    } elseif ($userRole === 'MANAGER' && !empty($userDept)) {
        $sql .= " AND (l.employee_id = :self_uid OR l.employee_code = :self_code OR e.department = :dept OR e.manager_id = :mgr_uid OR e.manager_id = :mgr_code)";
        $params[':self_uid'] = $userUid;
        $params[':self_code'] = $userCode;
        $params[':dept'] = $userDept;
        $params[':mgr_uid'] = $userUid;
        $params[':mgr_code'] = $userCode;
    }

    if (!empty($empId)) {
        $sql .= " AND (l.employee_id = :eid OR l.employee_code = :eid)";
        $params[':eid'] = $empId;
    }
    if (!empty($status) && $status !== 'All') {
        $sql .= " AND l.status = :st";
        $params[':st'] = $status;
    }

    $sql .= " ORDER BY l.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $leaves = $stmt->fetchAll();

    json_out(["success" => true, "count" => count($leaves), "leaves" => $leaves]);
}

// -----------------------------------------------------------------------------
// POST: Submit Leave Application or Approve / Reject
// -----------------------------------------------------------------------------
if ($method === 'POST') {
    // 1. Approve or Reject
    if ($action === 'review') {
        $leaveId = intval($input['id'] ?? 0);
        $status = strtoupper(trim($input['status'] ?? '')); // APPROVED or REJECTED
        $reviewer = trim($input['reviewed_by'] ?? ($currentUser['display_name'] ?? 'HR Admin'));
        $rejectionReason = trim($input['rejection_reason'] ?? '');

        if (!$leaveId || !in_array($status, ['APPROVED', 'REJECTED'])) {
            json_out(["success" => false, "error" => "Invalid review parameters."], 400);
        }

        // Fetch application details first
        $getStmt = $pdo->prepare("SELECT * FROM leave_applications WHERE id = :id LIMIT 1");
        $getStmt->execute([':id' => $leaveId]);
        $app = $getStmt->fetch();

        if (!$app) {
            json_out(["success" => false, "error" => "Leave application not found."], 404);
        }

        $stmt = $pdo->prepare("
            UPDATE leave_applications 
            SET status = :st, approved_by_name = :rev, rejection_reason = :rr, reviewed_at = NOW(), updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");
        $stmt->execute([
            ':st' => $status,
            ':rev' => $reviewer,
            ':rr' => $status === 'REJECTED' ? $rejectionReason : null,
            ':id' => $leaveId
        ]);

        // If APPROVED and was previously PENDING, deduct from balance
        if ($status === 'APPROVED' && $app['status'] !== 'APPROVED') {
            $leaveYear = intval(date('Y', strtotime($app['start_date'])));
            $daysCount = floatval($app['days_count']);
            $leaveType = $app['leave_type'];
            $targetEmp = $app['employee_id'];

            try {
                $balStmt = $pdo->prepare("
                    UPDATE leave_balances 
                    SET used = used + :days, available = GREATEST(0, available - :days)
                    WHERE (employee_id = :eid OR employee_id = :ecode) AND leave_type = :lt AND year = :y
                ");
                $balStmt->execute([
                    ':days' => $daysCount,
                    ':eid' => $targetEmp,
                    ':ecode' => $app['employee_code'],
                    ':lt' => $leaveType,
                    ':y' => $leaveYear
                ]);
            } catch (\Throwable $balErr) {
                error_log("[Leave Balance Deduction Notice] " . $balErr->getMessage());
            }
        }

        json_out(["success" => true, "message" => "Leave application marked as {$status}."]);
    }

    // 2. Submit New Leave Application
    $empId = trim($input['employee_id'] ?? $userUid);
    $leaveType = trim($input['leave_type'] ?? 'Casual Leave');
    $startDate = trim($input['start_date'] ?? '');
    $endDate = trim($input['end_date'] ?? '');
    $days = floatval($input['days_count'] ?? 1.0);
    $reason = trim($input['reason'] ?? '');
    $isHalfDay = !empty($input['is_half_day']) ? 1 : 0;

    if (empty($empId) || empty($startDate) || empty($endDate) || empty($reason)) {
        json_out(["success" => false, "error" => "All leave fields are required."], 400);
    }

    // Fetch employee name
    $empStmt = $pdo->prepare("SELECT full_name, employee_code, department FROM employees WHERE id = :id OR employee_code = :code LIMIT 1");
    $empStmt->execute([':id' => $empId, ':code' => $empId]);
    $emp = $empStmt->fetch();

    $name = $emp ? $emp['full_name'] : ($input['employee_name'] ?? ($currentUser['display_name'] ?? 'Employee'));
    $code = $emp ? $emp['employee_code'] : ($currentUser['employee_code'] ?? '');
    $dept = $emp ? $emp['department'] : ($currentUser['department'] ?? 'Operations');

    $stmt = $pdo->prepare("
        INSERT INTO leave_applications (
            employee_id, employee_code, employee_name, department, leave_type,
            start_date, end_date, days_count, is_half_day, reason, status
        ) VALUES (
            :eid, :code, :name, :dept, :lt,
            :sd, :ed, :days, :ihd, :reason, 'PENDING'
        )
    ");
    $stmt->execute([
        ':eid' => $empId,
        ':code' => $code,
        ':name' => $name,
        ':dept' => $dept,
        ':lt' => $leaveType,
        ':sd' => $startDate,
        ':ed' => $endDate,
        ':days' => $days,
        ':ihd' => $isHalfDay,
        ':reason' => $reason
    ]);

    json_out(["success" => true, "message" => "Leave application submitted successfully for review."]);
}
?>