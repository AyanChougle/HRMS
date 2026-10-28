<?php
require_once 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') {
    json_out(["success" => false, "error" => "Only GET method is supported."], 405);
}

try {
    $currentUser = get_current_user_or_null($pdo);
    $userRole = canonical_role($currentUser['role_id'] ?? $_GET['role'] ?? 'EMPLOYEE');
    $userCode = $currentUser['employee_code'] ?? $_GET['employee_code'] ?? '';
    $userUid = $currentUser['uid'] ?? $currentUser['id'] ?? $_GET['uid'] ?? '';
    $userDept = $currentUser['department'] ?? '';

    // Date for stats
    $today = date('Y-m-d');
    $startDate = $_GET['start_date'] ?? $today;
    $endDate = $_GET['end_date'] ?? $today;

    // Scope conditions
    $empScopeSql = "employment_status = 'ACTIVE'";
    $empScopeParams = [];

    $attScopeSql = "date = :today";
    $attScopeParams = [':today' => $today];

    $leaveScopeSql = "1=1";
    $leaveScopeParams = [];

    // Role-based Scoping
    if ($userRole === 'TL') {
        // Scoped to team led by this TL
        $teamStmt = $pdo->prepare("SELECT id FROM teams WHERE team_lead_id = :tlid OR team_lead_id = :tlcode LIMIT 1");
        $teamStmt->execute([':tlid' => $userUid, ':tlcode' => $userCode]);
        $team = $teamStmt->fetch();
        $teamId = $team ? $team['id'] : 0;

        $empScopeSql .= " AND (team_id = :team_id OR team_lead_id = :tlid OR team_lead_id = :tlcode OR id = :self_uid OR employee_code = :self_code)";
        $empScopeParams[':team_id'] = $teamId;
        $empScopeParams[':tlid'] = $userUid;
        $empScopeParams[':tlcode'] = $userCode;
        $empScopeParams[':self_uid'] = $userUid;
        $empScopeParams[':self_code'] = $userCode;

        // For attendance & leaves of team members
        $attScopeSql .= " AND employee_id IN (SELECT id FROM employees WHERE team_id = :att_team_id OR team_lead_id = :att_tlid OR team_lead_id = :att_tlcode OR id = :att_self_uid OR employee_code = :att_self_code)";
        $attScopeParams[':att_team_id'] = $teamId;
        $attScopeParams[':att_tlid'] = $userUid;
        $attScopeParams[':att_tlcode'] = $userCode;
        $attScopeParams[':att_self_uid'] = $userUid;
        $attScopeParams[':att_self_code'] = $userCode;

        $leaveScopeSql .= " AND employee_id IN (SELECT id FROM employees WHERE team_id = :l_team_id OR team_lead_id = :l_tlid OR team_lead_id = :l_tlcode OR id = :l_self_uid OR employee_code = :l_self_code)";
        $leaveScopeParams[':l_team_id'] = $teamId;
        $leaveScopeParams[':l_tlid'] = $userUid;
        $leaveScopeParams[':l_tlcode'] = $userCode;
        $leaveScopeParams[':l_self_uid'] = $userUid;
        $leaveScopeParams[':l_self_code'] = $userCode;

    } elseif ($userRole === 'MANAGER') {
        // Scoped to department or reportees
        if (!empty($userDept)) {
            $empScopeSql .= " AND (department = :dept OR manager_id = :mgr_uid OR manager_id = :mgr_code OR id = :m_self_uid OR employee_code = :m_self_code)";
            $empScopeParams[':dept'] = $userDept;
            $empScopeParams[':mgr_uid'] = $userUid;
            $empScopeParams[':mgr_code'] = $userCode;
            $empScopeParams[':m_self_uid'] = $userUid;
            $empScopeParams[':m_self_code'] = $userCode;

            $attScopeSql .= " AND employee_id IN (SELECT id FROM employees WHERE department = :att_dept OR manager_id = :att_mgr_uid OR manager_id = :att_mgr_code OR id = :att_m_self_uid OR employee_code = :att_m_self_code)";
            $attScopeParams[':att_dept'] = $userDept;
            $attScopeParams[':att_mgr_uid'] = $userUid;
            $attScopeParams[':att_mgr_code'] = $userCode;
            $attScopeParams[':att_m_self_uid'] = $userUid;
            $attScopeParams[':att_m_self_code'] = $userCode;

            $leaveScopeSql .= " AND employee_id IN (SELECT id FROM employees WHERE department = :l_dept OR manager_id = :l_mgr_uid OR manager_id = :l_mgr_code OR id = :l_m_self_uid OR employee_code = :l_m_self_code)";
            $leaveScopeParams[':l_dept'] = $userDept;
            $leaveScopeParams[':l_mgr_uid'] = $userUid;
            $leaveScopeParams[':l_mgr_code'] = $userCode;
            $leaveScopeParams[':l_m_self_uid'] = $userUid;
            $leaveScopeParams[':l_m_self_code'] = $userCode;
        }
    } elseif ($userRole === 'EMPLOYEE') {
        // Scoped to self
        $empScopeSql .= " AND (id = :self_uid OR employee_code = :self_code)";
        $empScopeParams[':self_uid'] = $userUid;
        $empScopeParams[':self_code'] = $userCode;

        $attScopeSql .= " AND (employee_id = :att_self_uid OR employee_code = :att_self_code)";
        $attScopeParams[':att_self_uid'] = $userUid;
        $attScopeParams[':att_self_code'] = $userCode;

        $leaveScopeSql .= " AND (employee_id = :l_self_uid OR employee_code = :l_self_code)";
        $leaveScopeParams[':l_self_uid'] = $userUid;
        $leaveScopeParams[':l_self_code'] = $userCode;
    }
    // ADMIN, HR, OPS, COMPLIANCE have organization-wide scope

    // 1. Total Active Employees
    $empStmt = $pdo->prepare("SELECT COUNT(*) FROM employees WHERE $empScopeSql");
    $empStmt->execute($empScopeParams);
    $totalEmployees = (int)$empStmt->fetchColumn();

    // 2. Attendance KPIs for Today
    $attPresentStmt = $pdo->prepare("SELECT COUNT(*) FROM attendance_records WHERE $attScopeSql AND check_in IS NOT NULL");
    $attPresentStmt->execute($attScopeParams);
    $presentToday = (int)$attPresentStmt->fetchColumn();

    $attLateStmt = $pdo->prepare("SELECT COUNT(*) FROM attendance_records WHERE $attScopeSql AND (status = 'LATE' OR status = 'HALF_DAY_LATE')");
    $attLateStmt->execute($attScopeParams);
    $lateToday = (int)$attLateStmt->fetchColumn();

    // Break counts (either is_on_break = 1 in attendance_records OR active open break in breaks table)
    $attBreakStmt = $pdo->prepare("SELECT COUNT(*) FROM attendance_records WHERE $attScopeSql AND (is_on_break = 1 OR is_on_break = '1')");
    $attBreakStmt->execute($attScopeParams);
    $onBreakToday = (int)$attBreakStmt->fetchColumn();

    // Absent count
    $absentToday = max(0, $totalEmployees - $presentToday);

    // 3. Pending Leaves
    $leaveStmt = $pdo->prepare("SELECT COUNT(*) FROM leave_applications WHERE $leaveScopeSql AND status = 'PENDING'");
    $leaveStmt->execute($leaveScopeParams);
    $pendingLeaves = (int)$leaveStmt->fetchColumn();

    // 4. Approved Leaves Today
    $apprLeaveStmt = $pdo->prepare("SELECT COUNT(*) FROM leave_applications WHERE $leaveScopeSql AND status = 'APPROVED' AND :today BETWEEN start_date AND end_date");
    $leaveTodayParams = array_merge($leaveScopeParams, [':today' => $today]);
    $apprLeaveStmt->execute($leaveTodayParams);
    $onLeaveToday = (int)$apprLeaveStmt->fetchColumn();

    // 5. Recent Activity Feed (Latest 10 attendance events)
    $recentStmt = $pdo->prepare("
        SELECT a.id, a.employee_id, a.employee_code, a.date, a.check_in, a.check_out, a.status, a.work_mode,
               e.full_name, e.department, e.designation
        FROM attendance_records a
        LEFT JOIN employees e ON (a.employee_id = e.id OR a.employee_code = e.employee_code)
        WHERE $attScopeSql
        ORDER BY a.check_in DESC
        LIMIT 10
    ");
    $recentStmt->execute($attScopeParams);
    $recentActivities = $recentStmt->fetchAll();

    // 6. Department / Team breakdown (for Admin/HR/Ops/Manager)
    $deptBreakdown = [];
    if (in_array($userRole, ['ADMIN', 'HR', 'OPS', 'COMPLIANCE', 'MANAGER'])) {
        $deptStmt = $pdo->query("
            SELECT department, COUNT(*) as count 
            FROM employees 
            WHERE employment_status = 'ACTIVE' AND department IS NOT NULL AND department != ''
            GROUP BY department 
            ORDER BY count DESC
        ");
        $deptBreakdown = $deptStmt->fetchAll();
    }

    json_out([
        "success" => true,
        "role" => $userRole,
        "date" => $today,
        "metrics" => [
            "total_employees" => $totalEmployees,
            "present_today" => $presentToday,
            "absent_today" => $absentToday,
            "late_today" => $lateToday,
            "on_break_today" => $onBreakToday,
            "on_leave_today" => $onLeaveToday,
            "pending_leaves" => $pendingLeaves
        ],
        "department_distribution" => $deptBreakdown,
        "recent_activities" => $recentActivities
    ]);

} catch (\Throwable $e) {
    error_log("[Dashboard API Error] " . $e->getMessage());
    json_out(["success" => false, "error" => $e->getMessage()], 500);
}
