<?php
// ==============================================================================
// DIALLO HRMS — ATTENDANCE & TIMECARD REST API
// Strictly 100% Hostinger MySQL & PHP (No Firebase dependencies)
// Accurate server-side state persistence across page refreshes and sessions
// ==============================================================================

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = get_json_input();

if (empty($action) && isset($input['action'])) {
    $action = $input['action'];
}

/**
 * Auto Punch-Out Maintenance Routine:
 * If an employee forgets to punch out:
 * 1. For any past date: automatically close the shift at 09:00 PM and record status as HALF_DAY.
 * 2. For today: if current IST time is >= 21:00 (9:00 PM), automatically close the shift at 09:00 PM and record status as HALF_DAY.
 */
function trigger_auto_punchout_maintenance($pdo) {
    if (!$pdo) return;
    try {
        $today = date('Y-m-d');
        $nowTime = date('H:i');

        $sql = "
            UPDATE attendance_records
            SET check_out = '09:00 PM',
                check_out_iso = CONCAT(date, ' 21:00:00'),
                status = 'HALF_DAY',
                is_on_break = 0,
                device = CASE 
                    WHEN device IS NULL OR device = '' THEN 'Auto Punched Out (9:00 PM System)'
                    WHEN device NOT LIKE '%Auto Punched Out%' THEN CONCAT(device, ' | Auto Punched Out (9:00 PM System)')
                    ELSE device
                END,
                gross_minutes = GREATEST(0, TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(date, ' ', check_in), '%Y-%m-%d %h:%i %p'), STR_TO_DATE(CONCAT(date, ' 09:00 PM'), '%Y-%m-%d %h:%i %p'))),
                gross_hours_formatted = CONCAT(
                    FLOOR(GREATEST(0, TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(date, ' ', check_in), '%Y-%m-%d %h:%i %p'), STR_TO_DATE(CONCAT(date, ' 09:00 PM'), '%Y-%m-%d %h:%i %p'))) / 60),
                    'h ',
                    LPAD(MOD(GREATEST(0, TIMESTAMPDIFF(MINUTE, STR_TO_DATE(CONCAT(date, ' ', check_in), '%Y-%m-%d %h:%i %p'), STR_TO_DATE(CONCAT(date, ' 09:00 PM'), '%Y-%m-%d %h:%i %p'))), 60), 2, '0'),
                    'm'
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE check_in IS NOT NULL AND check_in != ''
              AND (check_out IS NULL OR check_out = '' OR check_out = '-')
              AND (
                  date < :today
                  OR (date = :today AND :now_time >= '21:00')
              )
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':today' => $today,
            ':now_time' => $nowTime
        ]);
    } catch (\Throwable $e) {
        // Non-blocking maintenance failure
    }
}

/**
 * Ensures attendance_regularizations table exists
 */
function ensure_regularizations_table($pdo) {
    if (!$pdo) return;
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS attendance_regularizations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_id VARCHAR(100) DEFAULT 'comp_diallo_india',
                employee_id VARCHAR(100) NOT NULL,
                employee_code VARCHAR(50) DEFAULT NULL,
                employee_name VARCHAR(150) DEFAULT NULL,
                date DATE NOT NULL,
                check_in VARCHAR(20) DEFAULT NULL,
                check_out VARCHAR(20) DEFAULT NULL,
                reason TEXT DEFAULT NULL,
                type VARCHAR(50) DEFAULT 'MISSED_PUNCH',
                status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
                reviewed_by VARCHAR(150) DEFAULT NULL,
                reviewed_by_id VARCHAR(100) DEFAULT NULL,
                reviewed_at DATETIME DEFAULT NULL,
                rejection_reason TEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_reg_emp (employee_id),
                INDEX idx_reg_date (date),
                INDEX idx_reg_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
    } catch (\Throwable $e) {}
}

// Automatically execute auto punch-out sweep on every access
trigger_auto_punchout_maintenance($pdo);

if ($action === 'auto_punchout') {
    json_out(["success" => true, "message" => "Auto punch-out maintenance executed successfully."]);
}

try {
    // -------------------------------------------------------------------------
    // GET: Today's Status or Filtered Attendance Records
    // -------------------------------------------------------------------------
    if ($method === 'GET') {
        $currentUser = get_current_user_or_null($pdo);
        $userRole = $currentUser ? canonical_role($currentUser['role_id']) : null;
        $myEmpId = $currentUser ? ($currentUser['employee_id'] ?? $currentUser['uid']) : '';
        $myTeamId = $currentUser ? ($currentUser['team_id'] ?? null) : null;

        $empId = trim($_GET['employee_id'] ?? $_GET['id'] ?? '');
        $empCode = trim($_GET['employee_code'] ?? '');
        $date = trim($_GET['date'] ?? '');

        // Safe parameter splitting if query contains double-question-marks
        if (strpos($action, '?') !== false) {
            $parts = explode('?', $action);
            $action = $parts[0];
            parse_str(implode('&', array_slice($parts, 1)), $extraGet);
            if (empty($empId) && !empty($extraGet['employee_id'])) {
                $empId = trim($extraGet['employee_id']);
            }
            if (empty($empCode) && !empty($extraGet['employee_code'])) {
                $empCode = trim($extraGet['employee_code']);
            }
            if (empty($date) && !empty($extraGet['date'])) {
                $date = trim($extraGet['date']);
            }
        }

        // ---------------------------------------------------------------------
        // 1. TODAY'S RECORD FOR AN EMPLOYEE
        // ---------------------------------------------------------------------
        if ($action === 'today') {
            $checkDate = !empty($date) ? $date : date('Y-m-d');
            if (empty($empId) && empty($empCode) && $currentUser) {
                $empId = $myEmpId;
                $empCode = $currentUser['employee_code'] ?? '';
            }

            if (empty($empId) && empty($empCode)) {
                json_out([
                    "success" => true,
                    "record" => null,
                    "is_punched_in" => false,
                    "is_completed" => false,
                    "is_on_break" => false
                ]);
            }

            // Self-service scoping: Non-managers can only query their own attendance
            if ($userRole === 'EMPLOYEE' && $currentUser) {
                $myAllowedCodes = array_filter([$myEmpId, $currentUser['employee_code'] ?? '', $currentUser['uid'] ?? '', (string)($currentUser['id'] ?? '')]);
                $cleanEmpId = preg_replace('/^emp_/i', '', $empId);
                $isSelf = in_array($empId, $myAllowedCodes) || in_array($cleanEmpId, $myAllowedCodes) || (!empty($empCode) && in_array($empCode, $myAllowedCodes));
                if (!$isSelf) {
                    $empId = $myEmpId;
                    $empCode = $currentUser['employee_code'] ?? '';
                }
            }

            // Clean candidate identifiers
            $cleanCandidate = preg_replace('/^emp_/i', '', $empId);
            $cleanCode = !empty($empCode) ? str_replace('-', '', $empCode) : str_replace('-', '', $cleanCandidate);

            // Robust multi-key lookup across ID, Employee Code, or record_key
            $stmt = $pdo->prepare("
                SELECT * FROM attendance_records 
                WHERE (
                    employee_id = :eid 
                    OR employee_id = :cleanEid 
                    OR employee_code = :eid 
                    OR employee_code = :cleanEid 
                    OR (:ecode != '' AND (employee_code = :ecode OR employee_id = :ecode))
                    OR REPLACE(employee_code, '-', '') = :cleanCode 
                    OR record_key LIKE :rk1 
                    OR record_key LIKE :rk2
                ) 
                  AND date = :d 
                LIMIT 1
            ");
            $stmt->execute([
                ':eid' => $empId,
                ':cleanEid' => $cleanCandidate,
                ':ecode' => $empCode,
                ':cleanCode' => $cleanCode,
                ':rk1' => $empId . '_%',
                ':rk2' => $cleanCandidate . '_%',
                ':d' => $checkDate
            ]);
            $record = $stmt->fetch();

            // Insensitive / fuzzy match for UID font ambiguities (e.g. 1 vs i/I/l)
            if (!$record && strlen($empId) > 8) {
                $variants = [
                    str_replace(['1', 'I'], 'i', $empId),
                    str_replace(['i', 'I'], '1', $empId),
                    str_replace(['l', '1'], 'i', $empId),
                    str_replace(['l', 'i'], '1', $empId)
                ];
                foreach ($variants as $v) {
                    if ($v !== $empId) {
                        $stmt = $pdo->prepare("SELECT * FROM attendance_records WHERE (employee_id = :eid OR record_key LIKE :rk) AND date = :d LIMIT 1");
                        $stmt->execute([':eid' => $v, ':rk' => $v . '_%', ':d' => $checkDate]);
                        $record = $stmt->fetch();
                        if ($record) break;
                    }
                }
            }

            // Fallback lookup via users table
            if (!$record) {
                $uLookup = $pdo->prepare("SELECT uid, employee_code FROM users WHERE id = :eid OR uid = :eid OR employee_code = :eid LIMIT 1");
                $uLookup->execute([':eid' => $empId]);
                $foundUser = $uLookup->fetch();
                if ($foundUser) {
                    $rawCode = $foundUser['employee_code'];
                    $cleanCode = str_replace('-', '', $rawCode);
                    $stmt = $pdo->prepare("SELECT * FROM attendance_records WHERE (employee_id = :uid OR employee_code = :code OR REPLACE(employee_code, '-', '') = :ccode OR record_key LIKE :rk) AND date = :d LIMIT 1");
                    $stmt->execute([':uid' => $foundUser['uid'], ':code' => $rawCode, ':ccode' => $cleanCode, ':rk' => $foundUser['uid'] . '_%', ':d' => $checkDate]);
                    $record = $stmt->fetch();
                }
            }

            // Fallback lookup via employees table
            if (!$record) {
                $empLookup = $pdo->prepare("SELECT id, user_id, employee_code FROM employees WHERE id = :eid OR user_id = :eid OR employee_code = :eid OR email = :eid LIMIT 1");
                $empLookup->execute([':eid' => $empId]);
                $foundEmp = $empLookup->fetch();
                if ($foundEmp) {
                    $rawCode = $foundEmp['employee_code'];
                    $cleanCode = str_replace('-', '', $rawCode);
                    $stmt = $pdo->prepare("SELECT * FROM attendance_records WHERE (employee_id = :id OR employee_id = :uid OR employee_code = :code OR REPLACE(employee_code, '-', '') = :ccode) AND date = :d LIMIT 1");
                    $stmt->execute([':id' => $foundEmp['id'], ':uid' => $foundEmp['user_id'] ?: $foundEmp['id'], ':code' => $rawCode, ':ccode' => $cleanCode, ':d' => $checkDate]);
                    $record = $stmt->fetch();
                }
            }

            // Universal session-aware fallback: Match via session email, UID, ID, or employee code
            if (!$record && $currentUser) {
                $sessionCode = $currentUser['employee_code'] ?? '';
                $sessionId = $currentUser['id'] ?? '';
                $sessionUid = $currentUser['uid'] ?? '';
                $sessionEmail = $currentUser['email'] ?? '';

                $sessStmt = $pdo->prepare("
                    SELECT a.* FROM attendance_records a
                    LEFT JOIN employees e ON (a.employee_id = e.id OR a.employee_code = e.employee_code)
                    WHERE a.date = :d 
                      AND (
                           a.employee_id = :sid 
                        OR a.employee_id = :suid 
                        OR a.employee_code = :scode 
                        OR e.email = :semail1 
                        OR e.work_email = :semail2
                      )
                    LIMIT 1
                ");
                $sessStmt->execute([
                    ':d' => $checkDate,
                    ':sid' => $sessionId,
                    ':suid' => $sessionUid,
                    ':scode' => $sessionCode,
                    ':semail1' => $sessionEmail,
                    ':semail2' => $sessionEmail
                ]);
                $record = $sessStmt->fetch();
            }

            $isPunchedIn = ($record && !empty($record['check_in']) && empty($record['check_out']));
            $isCompleted = ($record && !empty($record['check_out']));
            $isOnBreak = ($record && !empty($record['is_on_break']));

            json_out([
                "success" => true,
                "record" => $record ?: null,
                "is_punched_in" => $isPunchedIn,
                "is_completed" => $isCompleted,
                "is_on_break" => $isOnBreak,
                "check_in" => $record ? $record['check_in'] : null,
                "check_out" => $record ? $record['check_out'] : null,
                "check_in_iso" => $record ? $record['check_in_iso'] : null,
                "check_out_iso" => $record ? $record['check_out_iso'] : null,
                "last_break_start_iso" => $record ? $record['last_break_start_iso'] : null,
                "last_break_end_iso" => $record ? $record['last_break_end_iso'] : null,
                "total_break_seconds" => $record ? intval($record['total_break_seconds']) : 0,
                "total_break_minutes" => $record ? intval($record['total_break_minutes']) : 0,
                "break_formatted" => $record ? ($record['break_formatted'] ?: '0m') : '0m',
                "server_time_iso" => date('c')
            ]);
        }

        // ---------------------------------------------------------------------
        // 2. HOLIDAYS & SHIFTS
        // ---------------------------------------------------------------------
        if ($action === 'holidays') {
            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS holidays (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        company_id VARCHAR(100) DEFAULT 'comp_diallo_india',
                        branch_id VARCHAR(100) DEFAULT 'All',
                        name VARCHAR(255) NOT NULL,
                        date DATE NOT NULL,
                        type VARCHAR(50) DEFAULT 'NATIONAL',
                        status VARCHAR(50) DEFAULT 'ACTIVE',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY uq_holiday (date, name)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");
                $hStmt = $pdo->query("SELECT * FROM holidays ORDER BY date ASC");
                $holidays = $hStmt->fetchAll();
                json_out(["success" => true, "holidays" => $holidays]);
            } catch (\Throwable $e) {
                json_out(["success" => true, "holidays" => []]);
            }
        }

        if ($action === 'shifts') {
            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS shifts (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        company_id VARCHAR(100) DEFAULT 'comp_diallo_india',
                        name VARCHAR(255) NOT NULL,
                        start_time VARCHAR(20) DEFAULT '10:00',
                        end_time VARCHAR(20) DEFAULT '19:00',
                        break_minutes INT DEFAULT 60,
                        grace_minutes INT DEFAULT 10,
                        status VARCHAR(50) DEFAULT 'ACTIVE',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");
                $sStmt = $pdo->query("SELECT * FROM shifts ORDER BY id ASC");
                $shifts = $sStmt->fetchAll();
                json_out(["success" => true, "shifts" => $shifts]);
            } catch (\Throwable $e) {
                json_out(["success" => true, "shifts" => []]);
            }
        }

        // ---------------------------------------------------------------------
        // 1.5. GET ATTENDANCE REGULARIZATION REQUESTS
        // ---------------------------------------------------------------------
        if ($action === 'get_regularizations' || $action === 'regularizations') {
            ensure_regularizations_table($pdo);
            $regStatus = trim($_GET['status'] ?? '');
            $rSql = "SELECT r.* FROM attendance_regularizations r LEFT JOIN employees e ON (r.employee_id = e.id OR r.employee_code = e.employee_code) WHERE 1=1";
            $rParams = [];

            if ($userRole === 'EMPLOYEE') {
                $rSql .= " AND (r.employee_id = :self_eid OR r.employee_code = :self_code)";
                $rParams[':self_eid'] = $myEmpId;
                $rParams[':self_code'] = $currentUser['employee_code'] ?? '';
            } elseif ($userRole === 'TL') {
                $myCode = $currentUser['employee_code'] ?? '';
                $rSql .= " AND (r.employee_id = :self_eid OR r.employee_code = :self_code OR e.team_lead_id = :tlid OR e.team_lead_id = :tlcode OR (e.team_id > 0 AND e.team_id = :myTeamId))";
                $rParams[':self_eid'] = $myEmpId;
                $rParams[':self_code'] = $myCode;
                $rParams[':tlid'] = $myEmpId;
                $rParams[':tlcode'] = $myCode;
                $rParams[':myTeamId'] = $myTeamId ?: 0;
            } elseif ($userRole === 'MANAGER') {
                $myCode = $currentUser['employee_code'] ?? '';
                $rSql .= " AND (r.employee_id = :self_eid OR r.employee_code = :self_code OR e.manager_id = :mgrid OR e.manager_id = :mgrcode)";
                $rParams[':self_eid'] = $myEmpId;
                $rParams[':self_code'] = $myCode;
                $rParams[':mgrid'] = $myEmpId;
                $rParams[':mgrcode'] = $myCode;
            }
            // ADMIN, HR, OPS see all across their organization

            if (!empty($regStatus) && $regStatus !== 'All') {
                $rSql .= " AND r.status = :st";
                $rParams[':st'] = $regStatus;
            }

            $rSql .= " ORDER BY r.created_at DESC";
            $rStmt = $pdo->prepare($rSql);
            $rStmt->execute($rParams);
            $regs = $rStmt->fetchAll();

            json_out(["success" => true, "count" => count($regs), "regularizations" => $regs]);
        }

        // ---------------------------------------------------------------------
        // 2. LIST ATTENDANCE RECORDS (ROSTER / HISTORY / REPORTS)
        // ---------------------------------------------------------------------
        $targetDate = !empty($date) ? $date : (!empty($_GET['for_date']) ? $_GET['for_date'] : '');
        $month = trim($_GET['month'] ?? '');
        $year = trim($_GET['year'] ?? '');
        $dept = trim($_GET['department'] ?? '');
        $teamId = intval($_GET['team_id'] ?? 0);
        $status = trim($_GET['status'] ?? '');

        $sql = "
            SELECT a.*,
                   COALESCE(e.team_id, 0) as team_id,
                   COALESCE(e.team_name, '') as team_name,
                   COALESCE(e.team_lead_id, '') as team_lead_id,
                   COALESCE(e.team_lead, '') as team_lead
            FROM attendance_records a
            LEFT JOIN employees e ON (e.id = a.employee_id OR e.employee_code = a.employee_code)
            WHERE 1=1
        ";
        $params = [];

        // Strict Server-Side Scope Filtering
        if ($userRole === 'TL') {
            $myCode = $currentUser['employee_code'] ?? '';
            $myName = $currentUser['display_name'] ?? trim(($currentUser['first_name'] ?? '') . ' ' . ($currentUser['last_name'] ?? ''));
            $tlDocId = $myEmpId;
            try {
                $tlDocStmt = $pdo->prepare("SELECT id FROM employees WHERE user_id = :uid OR employee_code = :c OR id = :id LIMIT 1");
                $tlDocStmt->execute([':uid' => $myEmpId, ':c' => $myCode, ':id' => $myEmpId]);
                $tlDoc = $tlDocStmt->fetch();
                if ($tlDoc && !empty($tlDoc['id'])) $tlDocId = $tlDoc['id'];
            } catch (\Throwable $e) {}

            $sql .= " AND (
                e.team_lead_id = :myTLId 
                OR e.team_lead_id = :myTLDocId
                OR e.team_lead_id = :myTLCode 
                OR e.team_lead LIKE :myTLName
                OR e.manager_id = :myTLId 
                OR e.manager_id = :myTLDocId
                OR e.manager_id = :myTLCode 
                OR e.manager LIKE :myTLPattern
                OR (e.team_id > 0 AND e.team_id = :myTeamId)
                OR a.employee_id = :myTLId 
                OR a.employee_id = :myTLDocId
                OR a.employee_code = :myTLCode
            )";
            $params[':myTLId'] = $myEmpId;
            $params[':myTLDocId'] = $tlDocId;
            $params[':myTLCode'] = $myCode;
            $params[':myTLName'] = '%' . trim($myName) . '%';
            $params[':myTLPattern'] = '%' . trim($myCode ?: $myName) . '%';
            $params[':myTeamId'] = $myTeamId ?: 0;
        } elseif ($userRole === 'MANAGER') {
            $myCode = $currentUser['employee_code'] ?? '';
            $myName = $currentUser['display_name'] ?? trim(($currentUser['first_name'] ?? '') . ' ' . ($currentUser['last_name'] ?? ''));
            $mgrDocId = $myEmpId;
            try {
                $mDocStmt = $pdo->prepare("SELECT id FROM employees WHERE user_id = :uid OR employee_code = :c OR id = :id LIMIT 1");
                $mDocStmt->execute([':uid' => $myEmpId, ':c' => $myCode, ':id' => $myEmpId]);
                $mDoc = $mDocStmt->fetch();
                if ($mDoc && !empty($mDoc['id'])) $mgrDocId = $mDoc['id'];
            } catch (\Throwable $e) {}

            $sql .= " AND (
                e.manager_id = :myMgrId 
                OR e.manager_id = :myMgrDocId
                OR e.manager_id = :myMgrCode 
                OR e.manager LIKE :myMgrPattern
                OR e.team_lead_id = :myMgrId
                OR e.team_lead_id = :myMgrDocId
                OR a.employee_id = :myMgrId 
                OR a.employee_id = :myMgrDocId
                OR a.employee_code = :myMgrCode
            )";
            $params[':myMgrId'] = $myEmpId;
            $params[':myMgrDocId'] = $mgrDocId;
            $params[':myMgrCode'] = $myCode;
            $params[':myMgrPattern'] = '%' . trim($myCode ?: $myName) . '%';
        }

        // Roles ADMIN, HR, and OPS have full administrative/operational visibility across their departments/teams

        if (!empty($targetDate)) {
            $sql .= " AND a.date = :d";
            $params[':d'] = $targetDate;
        } elseif (!empty($month) && !empty($year)) {
            $sql .= " AND MONTH(a.date) = :m AND YEAR(a.date) = :y";
            $params[':m'] = intval($month);
            $params[':y'] = intval($year);
        }

        // Robust Employee Filter & Alias Resolution across ID, UID, Code, and Email
        $empCode = trim($_GET['employee_code'] ?? '');
        $filterEmp = !empty($empId) ? $empId : ($userRole === 'EMPLOYEE' ? $myEmpId : '');
        $filterCode = !empty($empCode) ? $empCode : ($userRole === 'EMPLOYEE' ? ($currentUser['employee_code'] ?? '') : '');

        if (!empty($filterEmp) || !empty($filterCode)) {
            $keysToLookup = array_unique(array_filter([$filterEmp, $filterCode]));
            $aliases = $keysToLookup;
            foreach ($keysToLookup as $k) {
                $cleanK = str_replace('-', '', $k);
                $aliases[] = $cleanK;
                $aliases[] = preg_replace('/^emp_/i', '', $k);
                $aliases[] = 'emp_' . strtolower($cleanK);

                try {
                    $lStmt = $pdo->prepare("
                        SELECT id, user_id, employee_code, email, work_email 
                        FROM employees 
                        WHERE id = :k OR user_id = :k OR employee_code = :k OR REPLACE(employee_code, '-', '') = :ck OR email = :k OR work_email = :k
                        LIMIT 1
                    ");
                    $lStmt->execute([':k' => $k, ':ck' => $cleanK]);
                    $f = $lStmt->fetch();
                    if ($f) {
                        if (!empty($f['id'])) $aliases[] = $f['id'];
                        if (!empty($f['user_id'])) $aliases[] = $f['user_id'];
                        if (!empty($f['employee_code'])) {
                            $aliases[] = $f['employee_code'];
                            $aliases[] = str_replace('-', '', $f['employee_code']);
                            $aliases[] = 'emp_' . strtolower(str_replace('-', '', $f['employee_code']));
                        }
                    }
                } catch (\Throwable $e) {}

                try {
                    $uStmt = $pdo->prepare("
                        SELECT id, uid, employee_id, employee_code, email 
                        FROM users 
                        WHERE uid = :k OR id = :k OR employee_code = :k OR REPLACE(employee_code, '-', '') = :ck OR email = :k
                        LIMIT 1
                    ");
                    $uStmt->execute([':k' => $k, ':ck' => $cleanK]);
                    $u = $uStmt->fetch();
                    if ($u) {
                        if (!empty($u['uid'])) $aliases[] = $u['uid'];
                        if (!empty($u['id'])) $aliases[] = $u['id'];
                        if (!empty($u['employee_id'])) $aliases[] = $u['employee_id'];
                        if (!empty($u['employee_code'])) {
                            $aliases[] = $u['employee_code'];
                            $aliases[] = str_replace('-', '', $u['employee_code']);
                            $aliases[] = 'emp_' . strtolower(str_replace('-', '', $u['employee_code']));
                        }
                    }
                } catch (\Throwable $e) {}
            }
            $aliases = array_values(array_unique(array_filter($aliases)));

            $inPlaceholders = [];
            foreach ($aliases as $idx => $aliasVal) {
                $pName = ":ealias_{$idx}";
                $inPlaceholders[] = $pName;
                $params[$pName] = $aliasVal;
            }
            $inClause = implode(',', $inPlaceholders);
            $sql .= " AND (a.employee_id IN ($inClause) OR a.employee_code IN ($inClause) OR REPLACE(a.employee_code, '-', '') IN ($inClause) OR e.id IN ($inClause) OR e.employee_code IN ($inClause))";
        }

        if (!empty($dept) && $dept !== 'All') {
            $sql .= " AND (a.department = :dept OR e.department = :dept)";
            $params[':dept'] = $dept;
        }

        if ($teamId > 0) {
            $sql .= " AND e.team_id = :tid";
            $params[':tid'] = $teamId;
        }

        if (!empty($status) && $status !== 'All') {
            $sql .= " AND a.status = :st";
            $params[':st'] = $status;
        }

        $sql .= " ORDER BY a.date DESC, a.check_in ASC, a.employee_name ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $records = $stmt->fetchAll();

        json_out([
            "success" => true,
            "count" => count($records),
            "records" => $records
        ]);
    }

    // -------------------------------------------------------------------------
    // POST / PUT: Punch Actions & Timecard Management
    // -------------------------------------------------------------------------
    if ($method === 'POST') {
        $currentUser = get_current_user_or_null($pdo);
        $myEmpId = $currentUser ? ($currentUser['employee_id'] ?? $currentUser['uid']) : '';

        $actionName = trim($_GET['action'] ?? $input['action'] ?? '');
        $empId = trim($input['employee_id'] ?? $input['employeeId'] ?? $myEmpId);
        $punchType = trim($input['punch_type'] ?? $input['punchType'] ?? '');

        // Map punch type from action name or payload
        if (empty($punchType)) {
            if (in_array($actionName, ['punch_in', 'check_in', 'in'])) {
                $punchType = 'In';
            } elseif (in_array($actionName, ['punch_out', 'check_out', 'out'])) {
                $punchType = 'Out';
            } elseif (in_array($actionName, ['break_in', 'start_break'])) {
                $punchType = 'Break In';
            } elseif (in_array($actionName, ['break_out', 'end_break'])) {
                $punchType = 'Break Out';
            } else {
                $punchType = 'In';
            }
        }

        $timeStr = trim($input['time'] ?? $input['check_in'] ?? $input['check_out'] ?? date('h:i A'));
        $dateStr = trim($input['date'] ?? date('Y-m-d'));
        $location = trim($input['location'] ?? 'Web Attendance Terminal');
        $device = trim($input['device'] ?? 'ESS Web Terminal');
        $lat = isset($input['latitude']) && $input['latitude'] !== null ? floatval($input['latitude']) : null;
        $lng = isset($input['longitude']) && $input['longitude'] !== null ? floatval($input['longitude']) : null;
        $dist = isset($input['distance_meters']) ? floatval($input['distance_meters']) : null;

        // ---------------------------------------------------------------------
        // Attendance Regularization Actions
        // ---------------------------------------------------------------------
        if ($actionName === 'request_regularization') {
            ensure_regularizations_table($pdo);
            $reqDate = trim($input['requestedDate'] ?? $input['date'] ?? date('Y-m-d'));
            $reqIn = trim($input['requestedCheckIn'] ?? $input['check_in'] ?? '09:00 AM');
            $reqOut = trim($input['requestedCheckOut'] ?? $input['check_out'] ?? '06:00 PM');
            $reason = trim($input['reason'] ?? 'Punch adjustment requested');
            $empName = trim($input['employeeName'] ?? ($currentUser['display_name'] ?? 'Employee'));
            $empCode = trim($input['employeeCode'] ?? ($currentUser['employee_code'] ?? ''));

            $insStmt = $pdo->prepare("
                INSERT INTO attendance_regularizations (
                    company_id, employee_id, employee_code, employee_name,
                    date, check_in, check_out, reason, status
                ) VALUES (
                    'comp_diallo_india', :eid, :ecode, :ename,
                    :d, :cin, :cout, :reason, 'PENDING'
                )
            ");
            $insStmt->execute([
                ':eid' => $empId,
                ':ecode' => $empCode,
                ':ename' => $empName,
                ':d' => $reqDate,
                ':cin' => $reqIn,
                ':cout' => $reqOut,
                ':reason' => $reason
            ]);
            $newId = $pdo->lastInsertId();

            json_out([
                "success" => true,
                "id" => $newId,
                "message" => "Attendance regularization request submitted successfully."
            ], 201);
        }

        if ($actionName === 'approve_regularization') {
            ensure_regularizations_table($pdo);
            $userRole = canonical_role($currentUser['role_id'] ?? 'EMPLOYEE');
            $canApprove = in_array($userRole, ['ADMIN', 'HR', 'OPS', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'TL']);
            if (!$canApprove) {
                json_out(["success" => false, "error" => "Unauthorized: Only Managers, Team Leads, OPS, or HR can approve regularizations."], 403);
            }

            $reqId = intval($input['id'] ?? $input['requestId'] ?? 0);
            $rStmt = $pdo->prepare("SELECT * FROM attendance_regularizations WHERE id = :id LIMIT 1");
            $rStmt->execute([':id' => $reqId]);
            $reg = $rStmt->fetch();
            if (!$reg) {
                json_out(["success" => false, "error" => "Regularization request not found."], 404);
            }

            // Anti-self-approval rule
            if ($userRole !== 'ADMIN' && $userRole !== 'SUPER_ADMIN' && ($reg['employee_id'] === $myEmpId || $reg['employee_code'] === ($currentUser['employee_code'] ?? ''))) {
                json_out(["success" => false, "error" => "Security Violation: You cannot approve your own attendance regularization request."], 403);
            }

            $revBy = !empty($input['reviewedBy']) ? trim($input['reviewedBy']) : (!empty($currentUser['display_name']) ? $currentUser['display_name'] : 'HR Admin');
            $revId = !empty($input['reviewedById']) ? trim($input['reviewedById']) : $myEmpId;
            $pdo->prepare("
                UPDATE attendance_regularizations
                SET status = 'APPROVED', reviewed_by = :rb, reviewed_by_id = :rid, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = :id
            ")->execute([':rb' => $revBy, ':rid' => $revId, ':id' => $reqId]);

            // Update attendance_records for that employee on that date
            $targetDate = $reg['date'];
            $targetEmpId = $reg['employee_id'];
            $targetCode = $reg['employee_code'];
            $cin = $input['requestedCheckIn'] ?? $reg['check_in'] ?? '09:00 AM';
            $cout = $input['requestedCheckOut'] ?? $reg['check_out'] ?? '06:00 PM';

            // Calculate gross minutes
            $cin24 = date('H:i', strtotime($cin));
            $cout24 = date('H:i', strtotime($cout));
            $cinMins = intval(substr($cin24, 0, 2)) * 60 + intval(substr($cin24, 3, 2));
            $coutMins = intval(substr($cout24, 0, 2)) * 60 + intval(substr($cout24, 3, 2));
            $grossMins = max(0, $coutMins - $cinMins);
            $grossFmt = floor($grossMins / 60) . 'h ' . str_pad($grossMins % 60, 2, '0', STR_PAD_LEFT) . 'm';

            // Upsert attendance record
            $recKey = "{$targetEmpId}_{$targetDate}";
            $devText = "Regularized (Approved by {$revBy})";
            $upStmt = $pdo->prepare("
                INSERT INTO attendance_records (
                    record_key, company_id, employee_id, employee_code, employee_name,
                    date, check_in, check_out, gross_minutes, gross_hours_formatted,
                    status, device
                ) VALUES (
                    :rk, 'comp_diallo_india', :eid, :code, :name,
                    :d, :cin, :cout, :gm, :ghf,
                    'REGULARIZED', :dev
                )
                ON DUPLICATE KEY UPDATE
                    check_in = VALUES(check_in),
                    check_out = VALUES(check_out),
                    gross_minutes = VALUES(gross_minutes),
                    gross_hours_formatted = VALUES(gross_hours_formatted),
                    status = 'REGULARIZED',
                    device = VALUES(device),
                    updated_at = CURRENT_TIMESTAMP
            ");
            $upStmt->execute([
                ':rk' => $recKey,
                ':eid' => $targetEmpId,
                ':code' => $targetCode,
                ':name' => $reg['employee_name'],
                ':d' => $targetDate,
                ':cin' => $cin,
                ':cout' => $cout,
                ':gm' => $grossMins,
                ':ghf' => $grossFmt,
                ':dev' => $devText
            ]);

            json_out(["success" => true, "message" => "Attendance regularization approved and attendance record regularized."]);
        }

        if ($actionName === 'reject_regularization') {
            ensure_regularizations_table($pdo);
            $userRole = canonical_role($currentUser['role_id'] ?? 'EMPLOYEE');
            $canApprove = in_array($userRole, ['ADMIN', 'HR', 'OPS', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'TL']);
            if (!$canApprove) {
                json_out(["success" => false, "error" => "Unauthorized."], 403);
            }
            $reqId = intval($input['id'] ?? $input['requestId'] ?? 0);
            $reason = trim($input['reason'] ?? $input['rejectionReason'] ?? 'Rejected by supervisor');
            $revBy = !empty($input['reviewedBy']) ? trim($input['reviewedBy']) : (!empty($currentUser['display_name']) ? $currentUser['display_name'] : 'HR Admin');
            $revId = !empty($input['reviewedById']) ? trim($input['reviewedById']) : $myEmpId;

            $pdo->prepare("
                UPDATE attendance_regularizations
                SET status = 'REJECTED', rejection_reason = :r, reviewed_by = :rb, reviewed_by_id = :rid, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = :id
            ")->execute([':r' => $reason, ':rb' => $revBy, ':rid' => $revId, ':id' => $reqId]);

            json_out(["success" => true, "message" => "Attendance regularization request rejected."]);
        }

        if ($actionName === 'cancel_regularization') {
            ensure_regularizations_table($pdo);
            $reqId = intval($input['id'] ?? $input['requestId'] ?? 0);
            $pdo->prepare("UPDATE attendance_regularizations SET status = 'CANCELLED' WHERE id = :id")->execute([':id' => $reqId]);
            json_out(["success" => true, "message" => "Regularization request cancelled."]);
        }

        // Holiday Management
        if ($actionName === 'create_holiday' || $actionName === 'holiday') {
            $name = trim($input['name'] ?? '');
            $hDate = trim($input['date'] ?? '');
            $type = trim($input['type'] ?? 'NATIONAL');
            if (empty($name) || empty($hDate)) {
                json_out(["success" => false, "error" => "Holiday name and date are required."], 400);
            }
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS holidays (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    company_id VARCHAR(100) DEFAULT 'comp_diallo_india',
                    branch_id VARCHAR(100) DEFAULT 'All',
                    name VARCHAR(255) NOT NULL,
                    date DATE NOT NULL,
                    type VARCHAR(50) DEFAULT 'NATIONAL',
                    status VARCHAR(50) DEFAULT 'ACTIVE',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_holiday (date, name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
            $stmt = $pdo->prepare("
                INSERT INTO holidays (name, date, type, status)
                VALUES (:name, :d, :t, 'ACTIVE')
                ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type)
            ");
            $stmt->execute([':name' => $name, ':d' => $hDate, ':t' => $type]);
            json_out(["success" => true, "message" => "Holiday saved successfully."]);
        }

        // Shift Management
        if ($actionName === 'create_shift' || $actionName === 'shift') {
            $name = trim($input['name'] ?? '');
            $st = trim($input['startTime'] ?? $input['start_time'] ?? '10:00');
            $et = trim($input['endTime'] ?? $input['end_time'] ?? '19:00');
            $bm = intval($input['breakMinutes'] ?? $input['break_minutes'] ?? 60);
            $gm = intval($input['graceMinutes'] ?? $input['grace_minutes'] ?? 10);
            if (empty($name)) {
                json_out(["success" => false, "error" => "Shift name is required."], 400);
            }
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS shifts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    company_id VARCHAR(100) DEFAULT 'comp_diallo_india',
                    name VARCHAR(255) NOT NULL,
                    start_time VARCHAR(20) DEFAULT '10:00',
                    end_time VARCHAR(20) DEFAULT '19:00',
                    break_minutes INT DEFAULT 60,
                    grace_minutes INT DEFAULT 10,
                    status VARCHAR(50) DEFAULT 'ACTIVE',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
            $stmt = $pdo->prepare("
                INSERT INTO shifts (name, start_time, end_time, break_minutes, grace_minutes, status)
                VALUES (:name, :st, :et, :bm, :gm, 'ACTIVE')
            ");
            $stmt->execute([':name' => $name, ':st' => $st, ':et' => $et, ':bm' => $bm, ':gm' => $gm]);
            json_out(["success" => true, "message" => "Shift created successfully."]);
        }

        if (empty($empId)) {
            json_out(["success" => false, "error" => "Employee ID is required."], 400);
        }

        // Fetch employee metadata with robust cross-table alias resolution
        $cleanCandidate = preg_replace('/^emp_/i', '', $empId);
        $cleanCode = str_replace('-', '', $cleanCandidate);

        $empStmt = $pdo->prepare("
            SELECT * FROM employees 
            WHERE id = :id 
               OR user_id = :id 
               OR employee_code = :id 
               OR REPLACE(employee_code, '-', '') = :cleanCode
               OR email = :id 
               OR work_email = :id
            LIMIT 1
        ");
        $empStmt->execute([':id' => $empId, ':cleanCode' => $cleanCode]);
        $emp = $empStmt->fetch();

        if (!$emp) {
            $uStmt = $pdo->prepare("
                SELECT * FROM users 
                WHERE uid = :id 
                   OR id = :id 
                   OR employee_code = :id 
                   OR REPLACE(employee_code, '-', '') = :cleanCode
                   OR email = :id
                LIMIT 1
            ");
            $uStmt->execute([':id' => $empId, ':cleanCode' => $cleanCode]);
            $uFound = $uStmt->fetch();
            if ($uFound) {
                $empLookupKey = $uFound['employee_id'] ?? $uFound['employee_code'] ?? $uFound['uid'];
                $empStmt2 = $pdo->prepare("
                    SELECT * FROM employees 
                    WHERE id = :k OR user_id = :k OR employee_code = :k OR email = :email LIMIT 1
                ");
                $empStmt2->execute([':k' => $empLookupKey, ':email' => $uFound['email'] ?? '']);
                $emp = $empStmt2->fetch();
                if (!$emp) {
                    $actualEmpId = $uFound['uid'] ?: ($uFound['id'] ?: $empId);
                    $actualEmpCode = $uFound['employee_code'] ?: ($input['employee_code'] ?? $empId);
                    $empName = $uFound['display_name'] ?: trim(($uFound['first_name'] ?? '') . ' ' . ($uFound['last_name'] ?? ''));
                    $dept = $uFound['department'] ?? 'Operations';
                }
            }
        }

        if ($emp) {
            $actualEmpId = $emp['id'];
            $actualEmpCode = $emp['employee_code'] ?: ($input['employee_code'] ?? $empId);
            $empName = $emp['full_name'] ?: ($emp['name'] ?: ($input['name'] ?? 'Employee'));
            $dept = $emp['department'] ?: ($input['department'] ?? 'Operations');
            $mgrId = $emp['manager_id'] ?? null;
            $mgrName = $emp['manager'] ?? null;
        } else if (!isset($actualEmpId)) {
            $actualEmpId = $empId;
            $actualEmpCode = $input['employee_code'] ?? $empId;
            $empName = $input['name'] ?? ($currentUser['display_name'] ?? 'Employee');
            $dept = $input['department'] ?? ($currentUser['department'] ?? 'Operations');
            $mgrId = null;
            $mgrName = null;
        }

        $recordKey = "{$actualEmpId}_{$dateStr}";

        // Always log raw punch event in punch_logs
        try {
            $pdo->prepare("
                INSERT INTO punch_logs (employee_id, punch_type, time, date, location, latitude, longitude, distance_meters, device)
                VALUES (:eid, :pt, :time, :d, :loc, :lat, :lng, :dist, :dev)
            ")->execute([
                ':eid' => $actualEmpId,
                ':pt' => $punchType,
                ':time' => $timeStr,
                ':d' => $dateStr,
                ':loc' => $location,
                ':lat' => $lat,
                ':lng' => $lng,
                ':dist' => $dist,
                ':dev' => $device
            ]);
        } catch (\Throwable $e) {}

        // Fetch today's existing record across doc ID, user UID, and employee codes
        $recStmt = $pdo->prepare("
            SELECT * FROM attendance_records 
            WHERE (employee_id = :eid OR employee_id = :empIdInput OR employee_code = :ecode OR REPLACE(employee_code, '-', '') = :cleanCode) AND date = :d 
            LIMIT 1
        ");
        $recStmt->execute([
            ':eid' => $actualEmpId,
            ':empIdInput' => $empId,
            ':ecode' => $actualEmpCode,
            ':cleanCode' => str_replace('-', '', $actualEmpCode),
            ':d' => $dateStr
        ]);
        $existing = $recStmt->fetch();

        // ---------------------------------------------------------------------
        // PUNCH IN / RESUME SHIFT
        // ---------------------------------------------------------------------
        if ($punchType === 'In' || $punchType === 'In (Resume)') {
            if ($existing && !empty($existing['check_out'])) {
                // Resume daily shift: reset check_out, keep original check_in and check_in_iso
                $pdo->prepare("
                    UPDATE attendance_records 
                    SET check_out = NULL, check_out_iso = NULL, status = 'PRESENT', is_on_break = 0, updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id
                ")->execute([':id' => $existing['id']]);

                $recStmt->execute([
                    ':eid' => $actualEmpId,
                    ':empIdInput' => $empId,
                    ':ecode' => $actualEmpCode,
                    ':cleanCode' => str_replace('-', '', $actualEmpCode),
                    ':d' => $dateStr
                ]);
                $updated = $recStmt->fetch();

                log_audit($pdo, $actualEmpId, $currentUser['email'] ?? '', 'PUNCH_IN_RESUME', 'attendance_records', $existing['id']);

                json_out([
                    "success" => true,
                    "message" => "Shift resumed successfully at {$timeStr}.",
                    "record" => $updated,
                    "is_punched_in" => true,
                    "is_completed" => false,
                    "is_on_break" => false
                ]);
            }

            if ($existing && !empty($existing['check_in'])) {
                json_out([
                    "success" => true,
                    "message" => "You are already punched in for today.",
                    "record" => $existing,
                    "is_punched_in" => true,
                    "is_completed" => false,
                    "is_on_break" => false
                ]);
            }

            $nowIso = date('Y-m-d H:i:s');
            $nowMinutes = intval(date('H')) * 60 + intval(date('i'));
            $shiftStartMins = 10 * 60; // 10:00 AM
            $graceMins = 10; // 10:10 AM
            $halfDayMins = 10 * 60 + 70; // 11:10 AM

            $status = 'PRESENT';
            $lateMinutes = 0;
            if ($nowMinutes > $halfDayMins) {
                $status = 'HALF_DAY';
                $lateMinutes = max(0, $nowMinutes - $shiftStartMins);
            } elseif ($nowMinutes > ($shiftStartMins + $graceMins)) {
                $status = 'LATE';
                $lateMinutes = max(0, $nowMinutes - $shiftStartMins);
            }

            $stmt = $pdo->prepare("
                INSERT INTO attendance_records (
                    record_key, employee_id, employee_code, employee_name, department, manager_id, manager,
                    date, check_in, check_in_iso, check_out, check_out_iso, status, late_minutes,
                    gross_minutes, gross_hours_formatted, total_break_seconds, total_break_minutes,
                    break_formatted, is_on_break, location, latitude, longitude, distance_meters, device
                ) VALUES (
                    :rk, :eid, :ecode, :name, :dept, :mid, :mgr,
                    :d, :cin, :cin_iso, NULL, NULL, :st, :late,
                    0, '0h 00m', 0, 0,
                    '0m', 0, :loc, :lat, :lng, :dist, :dev
                )
                ON DUPLICATE KEY UPDATE
                    check_in = COALESCE(check_in, VALUES(check_in)),
                    check_in_iso = COALESCE(check_in_iso, VALUES(check_in_iso)),
                    status = VALUES(status),
                    late_minutes = VALUES(late_minutes),
                    is_on_break = 0,
                    updated_at = CURRENT_TIMESTAMP
            ");
            $stmt->execute([
                ':rk' => $recordKey,
                ':eid' => $actualEmpId,
                ':ecode' => $actualEmpCode,
                ':name' => $empName,
                ':dept' => $dept,
                ':mid' => $mgrId,
                ':mgr' => $mgrName,
                ':d' => $dateStr,
                ':cin' => $timeStr,
                ':cin_iso' => $nowIso,
                ':st' => $status,
                ':late' => $lateMinutes,
                ':loc' => $location,
                ':lat' => $lat,
                ':lng' => $lng,
                ':dist' => $dist,
                ':dev' => $device
            ]);

            $recStmt->execute([
                ':eid' => $actualEmpId,
                ':empIdInput' => $empId,
                ':ecode' => $actualEmpCode,
                ':cleanCode' => str_replace('-', '', $actualEmpCode),
                ':d' => $dateStr
            ]);
            $updated = $recStmt->fetch();

            log_audit($pdo, $actualEmpId, $currentUser['email'] ?? '', 'PUNCH_IN', 'attendance_records', $recordKey);

            json_out([
                "success" => true,
                "message" => "Punch in recorded successfully at {$timeStr}.",
                "record" => $updated,
                "is_punched_in" => true,
                "is_completed" => false,
                "is_on_break" => false
            ]);
        }

        // ---------------------------------------------------------------------
        // PUNCH OUT
        // ---------------------------------------------------------------------
        if ($punchType === 'Out') {
            if (!$existing || empty($existing['check_in'])) {
                json_out(["success" => false, "error" => "No check-in found for today. Please punch in first."], 400);
            }

            if (!empty($existing['check_out'])) {
                json_out(["success" => false, "error" => "Shift already completed and punched out for today."], 400);
            }

            $nowIso = date('Y-m-d H:i:s');
            $cinIso = !empty($existing['check_in_iso']) ? $existing['check_in_iso'] : ($dateStr . ' 10:00:00');

            // Exact local timestamp parsing immune to UTC/timezone offset skew
            $cinTime = strtotime($cinIso);
            $coutTime = strtotime($nowIso);
            if (!empty($existing['check_in'])) {
                $cinCandidate = strtotime($dateStr . ' ' . $existing['check_in']);
                if ($cinCandidate !== false && $cinCandidate > 0) {
                    $cinTime = $cinCandidate;
                }
            }
            if (!empty($timeStr)) {
                $coutCandidate = strtotime($dateStr . ' ' . $timeStr);
                if ($coutCandidate !== false && $coutCandidate > 0) {
                    $coutTime = $coutCandidate;
                }
            }

            $grossSec = max(0, $coutTime - $cinTime);
            $grossMinutes = round($grossSec / 60);
            $grossHrs = sprintf('%dh %02dm', floor($grossMinutes / 60), $grossMinutes % 60);

            // If user was on break, close the break first
            $totalBreakSec = intval($existing['total_break_seconds'] ?? 0);
            if (!empty($existing['is_on_break']) && !empty($existing['last_break_start_iso'])) {
                $breakElapsed = max(0, strtotime($nowIso) - strtotime($existing['last_break_start_iso']));
                $totalBreakSec += $breakElapsed;
            }

            $totalBreakMins = round($totalBreakSec / 60);
            $breakFmt = sprintf('%dh %02dm', floor($totalBreakMins / 60), $totalBreakMins % 60);
            $workedMinutes = max(0, $grossMinutes - $totalBreakMins);

            $status = $existing['status'];
            if ($workedMinutes < 240) { // Under 4 hours
                $status = 'HALF_DAY';
            } elseif ($status !== 'LATE') {
                $status = 'PRESENT';
            }

            $stmt = $pdo->prepare("
                UPDATE attendance_records 
                SET check_out = :cout,
                    check_out_iso = :cout_iso,
                    gross_minutes = :gm,
                    gross_hours_formatted = :gh,
                    total_break_seconds = :tbs,
                    total_break_minutes = :tbm,
                    break_formatted = :bf,
                    is_on_break = 0,
                    last_break_end_iso = :lbe,
                    status = :st,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            ");
            $stmt->execute([
                ':cout' => $timeStr,
                ':cout_iso' => $nowIso,
                ':gm' => $grossMinutes,
                ':gh' => $grossHrs,
                ':tbs' => $totalBreakSec,
                ':tbm' => $totalBreakMins,
                ':bf' => $breakFmt,
                ':lbe' => $nowIso,
                ':st' => $status,
                ':id' => $existing['id']
            ]);

            $recStmt->execute([
                ':eid' => $actualEmpId,
                ':empIdInput' => $empId,
                ':ecode' => $actualEmpCode,
                ':cleanCode' => str_replace('-', '', $actualEmpCode),
                ':d' => $dateStr
            ]);
            $updated = $recStmt->fetch();

            log_audit($pdo, $actualEmpId, $currentUser['email'] ?? '', 'PUNCH_OUT', 'attendance_records', $existing['id']);

            json_out([
                "success" => true,
                "message" => "Punch out recorded successfully at {$timeStr}. Shift completed.",
                "record" => $updated,
                "is_punched_in" => false,
                "is_completed" => true,
                "is_on_break" => false
            ]);
        }

        // ---------------------------------------------------------------------
        // BREAK IN (START BREAK)
        // ---------------------------------------------------------------------
        if ($punchType === 'Break In') {
            if (!$existing || empty($existing['check_in'])) {
                json_out(["success" => false, "error" => "Please punch in before starting a break."], 400);
            }
            if (!empty($existing['check_out'])) {
                json_out(["success" => false, "error" => "Shift completed. Breaks cannot be started after punch out."], 400);
            }

            $nowIso = date('Y-m-d H:i:s');
            $stmt = $pdo->prepare("
                UPDATE attendance_records 
                SET is_on_break = 1,
                    last_break_start_iso = :lbs,
                    status = 'ON_BREAK',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            ");
            $stmt->execute([':lbs' => $nowIso, ':id' => $existing['id']]);

            // Insert into breaks table
            try {
                $pdo->prepare("
                    INSERT INTO breaks (attendance_record_id, employee_id, date, start_time_iso)
                    VALUES (:arid, :eid, :d, :st)
                ")->execute([':arid' => $existing['id'], ':eid' => $actualEmpId, ':d' => $dateStr, ':st' => $nowIso]);
            } catch (\Throwable $e) {}

            $recStmt->execute([
                ':eid' => $actualEmpId,
                ':empIdInput' => $empId,
                ':ecode' => $actualEmpCode,
                ':cleanCode' => str_replace('-', '', $actualEmpCode),
                ':d' => $dateStr
            ]);
            $updated = $recStmt->fetch();

            json_out([
                "success" => true,
                "message" => "Break started at {$timeStr}.",
                "record" => $updated,
                "is_punched_in" => true,
                "is_on_break" => true
            ]);
        }

        // ---------------------------------------------------------------------
        // BREAK OUT (END BREAK / RESUME SHIFT)
        // ---------------------------------------------------------------------
        if ($punchType === 'Break Out') {
            if (!$existing || empty($existing['check_in'])) {
                json_out(["success" => false, "error" => "No active shift record found."], 400);
            }

            $nowIso = date('Y-m-d H:i:s');
            $lastStart = !empty($existing['last_break_start_iso']) ? $existing['last_break_start_iso'] : $nowIso;
            $breakElapsed = max(0, strtotime($nowIso) - strtotime($lastStart));

            $totalSec = intval($existing['total_break_seconds'] ?? 0) + $breakElapsed;
            $totalMins = round($totalSec / 60);
            $breakFmt = sprintf('%dm %02ds', floor($totalSec / 60), $totalSec % 60);

            $status = ($existing['late_minutes'] > 0) ? 'LATE' : 'PRESENT';

            $stmt = $pdo->prepare("
                UPDATE attendance_records 
                SET is_on_break = 0,
                    last_break_end_iso = :lbe,
                    total_break_seconds = :tbs,
                    total_break_minutes = :tbm,
                    break_formatted = :bf,
                    status = :st,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            ");
            $stmt->execute([
                ':lbe' => $nowIso,
                ':tbs' => $totalSec,
                ':tbm' => $totalMins,
                ':bf' => $breakFmt,
                ':st' => $status,
                ':id' => $existing['id']
            ]);

            // Close latest break in breaks table
            try {
                $pdo->prepare("
                    UPDATE breaks 
                    SET end_time_iso = :end, duration_seconds = :dur 
                    WHERE employee_id = :eid AND date = :d AND end_time_iso IS NULL 
                    ORDER BY id DESC LIMIT 1
                ")->execute([':end' => $nowIso, ':dur' => $breakElapsed, ':eid' => $actualEmpId, ':d' => $dateStr]);
            } catch (\Throwable $e) {}

            $recStmt->execute([
                ':eid' => $actualEmpId,
                ':empIdInput' => $empId,
                ':ecode' => $actualEmpCode,
                ':cleanCode' => str_replace('-', '', $actualEmpCode),
                ':d' => $dateStr
            ]);
            $updated = $recStmt->fetch();

            json_out([
                "success" => true,
                "message" => "Break ended at {$timeStr}. Shift resumed.",
                "record" => $updated,
                "is_punched_in" => true,
                "is_on_break" => false
            ]);
        }

        json_out(["success" => false, "error" => "Unsupported punch action."], 400);
    }

    json_out(["success" => false, "error" => "Method not supported."], 405);

} catch (\Throwable $e) {
    error_log("[Attendance API Error] " . $e->getMessage());
    json_out(["success" => false, "error" => "Attendance service error: " . $e->getMessage()], 500);
}
?>
