<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = get_json_input();

if (empty($action) && isset($input['action'])) {
    $action = $input['action'];
}

// -----------------------------------------------------------------------------
// GET: Today's Status or Attendance History
// -----------------------------------------------------------------------------
if ($method === 'GET') {
    $empId = trim($_GET['employee_id'] ?? '');
    $date = trim($_GET['date'] ?? '');

    // Check today's record
    if ($action === 'today') {
        $checkDate = !empty($date) ? $date : date('Y-m-d');
        if (empty($empId)) json_out(["success" => false, "error" => "Employee ID is required."], 400);

        $stmt = $pdo->prepare("SELECT * FROM attendance_records WHERE (employee_id = :eid OR employee_code = :eid) AND date = :d LIMIT 1");
        $stmt->execute([':eid' => $empId, ':d' => $checkDate]);
        $record = $stmt->fetch();

        json_out([
            "success" => true,
            "record" => $record ?: null,
            "is_punched_in" => ($record && !empty($record['check_in']) && empty($record['check_out'])),
            "is_completed" => ($record && !empty($record['check_out'])),
            "is_on_break" => ($record && !empty($record['is_on_break']))
        ]);
    }

    // Specific Date Query
    if (!empty($date)) {
        $sql = "SELECT * FROM attendance_records WHERE date = :d";
        $params = [':d' => $date];
        if (!empty($empId)) {
            $sql .= " AND (employee_id = :eid OR employee_code = :eid)";
            $params[':eid'] = $empId;
        }
        $sql .= " ORDER BY check_in DESC, employee_name ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $records = $stmt->fetchAll();

        json_out([
            "success" => true,
            "count" => count($records),
            "records" => $records
        ]);
    }

    // Monthly or Range Attendance History
    $month = trim($_GET['month'] ?? date('m'));
    $year = trim($_GET['year'] ?? date('Y'));

    $sql = "SELECT * FROM attendance_records WHERE MONTH(date) = :m AND YEAR(date) = :y";
    $params = [':m' => $month, ':y' => $year];

    if (!empty($empId)) {
        $sql .= " AND (employee_id = :eid OR employee_code = :eid)";
        $params[':eid'] = $empId;
    }

    $sql .= " ORDER BY date DESC, check_in DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $records = $stmt->fetchAll();

    json_out([
        "success" => true,
        "count" => count($records),
        "records" => $records
    ]);
}

// -----------------------------------------------------------------------------
// POST: Punch In / Out / Breaks
// -----------------------------------------------------------------------------
if ($method === 'POST') {
    $empId = trim($input['employee_id'] ?? '');
    $punchType = trim($input['punch_type'] ?? 'In');
    $time = trim($input['time'] ?? date('h:i A'));
    $date = trim($input['date'] ?? date('Y-m-d'));
    $lat = isset($input['latitude']) && $input['latitude'] !== null ? floatval($input['latitude']) : null;
    $lng = isset($input['longitude']) && $input['longitude'] !== null ? floatval($input['longitude']) : null;
    $location = trim($input['location'] ?? 'Web Punch Terminal');
    $device = trim($input['device'] ?? 'ESS Web Terminal');
    $distance = isset($input['distance_meters']) ? floatval($input['distance_meters']) : null;

    if (empty($empId)) {
        json_out(["success" => false, "error" => "Employee ID is required."], 400);
    }

    // Fetch employee details
    $empStmt = $pdo->prepare("SELECT * FROM employees WHERE id = :id OR employee_code = :id LIMIT 1");
    $empStmt->execute([':id' => $empId]);
    $emp = $empStmt->fetch();

    $empName = $emp ? $emp['full_name'] : ($input['name'] ?? 'Employee');
    $empCode = $emp ? $emp['employee_code'] : 'EMP-001';
    $dept = $emp ? $emp['department'] : 'Operations';

    // 1. Log every raw punch in punch_logs
    $logStmt = $pdo->prepare("
        INSERT INTO punch_logs (employee_id, punch_type, time, date, location, latitude, longitude, distance_meters, device)
        VALUES (:eid, :pt, :time, :d, :loc, :lat, :lng, :dist, :dev)
    ");
    $logStmt->execute([
        ':eid' => $empId,
        ':pt' => $punchType,
        ':time' => $time,
        ':d' => $date,
        ':loc' => $location,
        ':lat' => $lat,
        ':lng' => $lng,
        ':dist' => $distance,
        ':dev' => $device
    ]);

    // 2. Fetch or initialize today's daily attendance record
    $recStmt = $pdo->prepare("SELECT * FROM attendance_records WHERE employee_id = :eid AND date = :d LIMIT 1");
    $recStmt->execute([':eid' => $empId, ':d' => $date]);
    $record = $recStmt->fetch();

    $recordKey = "{$empId}_{$date}";

    if ($punchType === 'In' || $punchType === 'In (Resume)') {
        if ($record && !empty($record['check_out'])) {
            json_out(["success" => false, "error" => "Shift completed for today. The station is locked until tomorrow."], 400);
        }

        if (!$record) {
            $nowMinutes = intval(date('H')) * 60 + intval(date('i'));
            $lateMinutes = max(0, $nowMinutes - (10 * 60 + 10)); // Shift starts 10:00 AM + 10m grace
            $status = $lateMinutes > 60 ? 'HALF_DAY' : ($lateMinutes > 0 ? 'LATE' : 'PRESENT');

            $insStmt = $pdo->prepare("
                INSERT INTO attendance_records (
                    record_key, employee_id, employee_code, employee_name, department, date,
                    check_in, check_in_iso, status, late_minutes, location, latitude, longitude, distance_meters, device
                ) VALUES (
                    :key, :eid, :code, :name, :dept, :d,
                    :cin, NOW(), :st, :late, :loc, :lat, :lng, :dist, :dev
                )
            ");
            $insStmt->execute([
                ':key' => $recordKey,
                ':eid' => $empId,
                ':code' => $empCode,
                ':name' => $empName,
                ':dept' => $dept,
                ':d' => $date,
                ':cin' => $time,
                ':st' => $status,
                ':late' => $lateMinutes,
                ':loc' => $location,
                ':lat' => $lat,
                ':lng' => $lng,
                ':dist' => $distance,
                ':dev' => $device
            ]);
        }

        json_out(["success" => true, "message" => "Punched IN successfully at {$time}."]);
    }

    if ($punchType === 'Out') {
        if (!$record || empty($record['check_in'])) {
            json_out(["success" => false, "error" => "You must check in before checking out."], 400);
        }

        // Calculate gross duration
        $totalWorkSec = intval($input['total_work_seconds'] ?? 0);
        $grossMins = round($totalWorkSec / 60);
        $hrs = floor($grossMins / 60);
        $mins = $grossMins % 60;
        $formatted = sprintf('%02dh %02dm', $hrs, $mins);

        $upStmt = $pdo->prepare("
            UPDATE attendance_records 
            SET check_out = :cout, check_out_iso = NOW(), is_on_break = 0,
                gross_minutes = :gm, gross_hours_formatted = :gh,
                total_break_seconds = :tbs, total_break_minutes = ROUND(:tbs / 60),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");
        $upStmt->execute([
            ':cout' => $time,
            ':gm' => $grossMins,
            ':gh' => $formatted,
            ':tbs' => intval($input['total_break_seconds'] ?? ($record['total_break_seconds'] ?? 0)),
            ':id' => $record['id']
        ]);

        json_out(["success" => true, "message" => "Punched OUT successfully at {$time}. Today's shift concluded."]);
    }

    if ($punchType === 'Break In') {
        if ($record) {
            $pdo->prepare("UPDATE attendance_records SET is_on_break = 1, last_break_start_iso = NOW() WHERE id = :id")->execute([':id' => $record['id']]);
        }
        json_out(["success" => true, "message" => "Break started."]);
    }

    if ($punchType === 'Break Out') {
        if ($record) {
            $breakSec = intval($input['break_duration'] ?? 0);
            $totalBreak = intval($record['total_break_seconds']) + $breakSec;
            $pdo->prepare("UPDATE attendance_records SET is_on_break = 0, last_break_end_iso = NOW(), total_break_seconds = :tbs, total_break_minutes = ROUND(:tbs / 60) WHERE id = :id")
                ->execute([':tbs' => $totalBreak, ':id' => $record['id']]);
        }
        json_out(["success" => true, "message" => "Break ended. Resumed shift."]);
    }

    // -------------------------------------------------------------------------
    // ACTION: Save or Sync Full Attendance Record (Direct Web Check-in & Sync)
    // -------------------------------------------------------------------------
    if ($action === 'save_record' || $action === 'sync') {
        $eid = trim($input['employee_id'] ?? $input['employeeId'] ?? '');
        $code = strtoupper(trim($input['employee_code'] ?? $input['employeeCode'] ?? ''));
        $name = trim($input['employee_name'] ?? $input['employeeName'] ?? '');
        $dept = trim($input['department'] ?? 'Operations');
        $mId = trim($input['manager_id'] ?? $input['managerId'] ?? '');
        $mgr = trim($input['manager'] ?? '');
        $d = trim($input['date'] ?? date('Y-m-d'));
        $cin = trim($input['check_in'] ?? $input['checkIn'] ?? '');
        $cout = trim($input['check_out'] ?? $input['checkOut'] ?? '');
        $status = strtoupper(trim($input['status'] ?? 'PRESENT'));
        $lateMins = intval($input['late_minutes'] ?? $input['lateMinutes'] ?? 0);
        $grossMins = intval($input['gross_minutes'] ?? $input['grossMinutes'] ?? 0);
        $grossHrs = trim($input['gross_hours_formatted'] ?? $input['grossHoursFormatted'] ?? '0h 00m');
        $breakSec = intval($input['total_break_seconds'] ?? $input['totalBreakSeconds'] ?? 0);
        $breakMins = intval($input['total_break_minutes'] ?? $input['totalBreakMinutes'] ?? round($breakSec / 60));
        $breakFmt = trim($input['break_formatted'] ?? $input['breakFormatted'] ?? '0m');
        $onBreak = !empty($input['is_on_break'] ?? $input['isOnBreak']) ? 1 : 0;
        $loc = trim($input['location'] ?? 'Web Attendance Terminal');
        $key = trim($input['record_key'] ?? "{$eid}_{$d}");

        $validStatuses = ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'WEEKLY_OFF', 'HOLIDAY', 'ON_BREAK'];
        if (!in_array($status, $validStatuses)) $status = 'PRESENT';

        $stmt = $pdo->prepare("
            INSERT INTO attendance_records (
                record_key, employee_id, employee_code, employee_name, department, manager_id, manager,
                date, check_in, check_out, status, late_minutes, gross_minutes, gross_hours_formatted,
                total_break_seconds, total_break_minutes, break_formatted, is_on_break, location
            ) VALUES (
                :k, :eid, :code, :name, :dept, :mid, :mgr,
                :d, :cin, :cout, :st, :late, :gm, :gh,
                :tbs, :tbm, :bf, :ob, :loc
            ) ON DUPLICATE KEY UPDATE
                employee_code = VALUES(employee_code),
                employee_name = VALUES(employee_name),
                department = VALUES(department),
                manager_id = VALUES(manager_id),
                manager = VALUES(manager),
                check_in = VALUES(check_in),
                check_out = VALUES(check_out),
                status = VALUES(status),
                late_minutes = VALUES(late_minutes),
                gross_minutes = VALUES(gross_minutes),
                gross_hours_formatted = VALUES(gross_hours_formatted),
                total_break_seconds = VALUES(total_break_seconds),
                total_break_minutes = VALUES(total_break_minutes),
                break_formatted = VALUES(break_formatted),
                is_on_break = VALUES(is_on_break),
                updated_at = CURRENT_TIMESTAMP
        ");
        $stmt->execute([
            ':k' => $key,
            ':eid' => $eid,
            ':code' => $code,
            ':name' => $name,
            ':dept' => $dept,
            ':mid' => $mId ?: null,
            ':mgr' => $mgr ?: null,
            ':d' => $d,
            ':cin' => $cin ?: null,
            ':cout' => $cout ?: null,
            ':st' => $status,
            ':late' => $lateMins,
            ':gm' => $grossMins,
            ':gh' => $grossHrs,
            ':tbs' => $breakSec,
            ':tbm' => $breakMins,
            ':bf' => $breakFmt,
            ':ob' => $onBreak,
            ':loc' => $loc
        ]);

        json_out(["success" => true, "message" => "Attendance record successfully saved to Hostinger MySQL.", "record_key" => $key]);
    }

    // -------------------------------------------------------------------------
    // ACTION: Bulk Sync Attendance Records into MySQL
    // -------------------------------------------------------------------------
    if ($action === 'bulk_sync') {
        $records = $input['records'] ?? [];
        $saved = 0;
        foreach ($records as $r) {
            $eid = trim($r['employee_id'] ?? $r['employeeId'] ?? '');
            if (empty($eid)) continue;
            $code = strtoupper(trim($r['employee_code'] ?? $r['employeeCode'] ?? ''));
            $name = trim($r['employee_name'] ?? $r['employeeName'] ?? '');
            $dept = trim($r['department'] ?? 'Operations');
            $mId = trim($r['manager_id'] ?? $r['managerId'] ?? '');
            $mgr = trim($r['manager'] ?? '');
            $d = trim($r['date'] ?? date('Y-m-d'));
            $cin = trim($r['check_in'] ?? $r['checkIn'] ?? '');
            $cout = trim($r['check_out'] ?? $r['checkOut'] ?? '');
            $status = strtoupper(trim($r['status'] ?? 'PRESENT'));
            $lateMins = intval($r['late_minutes'] ?? $r['lateMinutes'] ?? 0);
            $grossMins = intval($r['gross_minutes'] ?? $r['grossMinutes'] ?? 0);
            $grossHrs = trim($r['gross_hours_formatted'] ?? $r['grossHoursFormatted'] ?? '0h 00m');
            $breakSec = intval($r['total_break_seconds'] ?? $r['totalBreakSeconds'] ?? 0);
            $breakMins = intval($r['total_break_minutes'] ?? $r['totalBreakMinutes'] ?? round($breakSec / 60));
            $breakFmt = trim($r['break_formatted'] ?? $r['breakFormatted'] ?? '0m');
            $onBreak = !empty($r['is_on_break'] ?? $r['isOnBreak']) ? 1 : 0;
            $loc = trim($r['location'] ?? 'Web Attendance Terminal');
            $key = trim($r['record_key'] ?? "{$eid}_{$d}");

            $validStatuses = ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'WEEKLY_OFF', 'HOLIDAY', 'ON_BREAK'];
            if (!in_array($status, $validStatuses)) $status = 'PRESENT';

            $stmt = $pdo->prepare("
                INSERT INTO attendance_records (
                    record_key, employee_id, employee_code, employee_name, department, manager_id, manager,
                    date, check_in, check_out, status, late_minutes, gross_minutes, gross_hours_formatted,
                    total_break_seconds, total_break_minutes, break_formatted, is_on_break, location
                ) VALUES (
                    :k, :eid, :code, :name, :dept, :mid, :mgr,
                    :d, :cin, :cout, :st, :late, :gm, :gh,
                    :tbs, :tbm, :bf, :ob, :loc
                ) ON DUPLICATE KEY UPDATE
                    employee_code = VALUES(employee_code),
                    employee_name = VALUES(employee_name),
                    department = VALUES(department),
                    manager_id = VALUES(manager_id),
                    manager = VALUES(manager),
                    check_in = VALUES(check_in),
                    check_out = VALUES(check_out),
                    status = VALUES(status),
                    late_minutes = VALUES(late_minutes),
                    gross_minutes = VALUES(gross_minutes),
                    gross_hours_formatted = VALUES(gross_hours_formatted),
                    total_break_seconds = VALUES(total_break_seconds),
                    total_break_minutes = VALUES(total_break_minutes),
                    break_formatted = VALUES(break_formatted),
                    is_on_break = VALUES(is_on_break),
                    updated_at = CURRENT_TIMESTAMP
            ");
            $stmt->execute([
                ':k' => $key,
                ':eid' => $eid,
                ':code' => $code,
                ':name' => $name,
                ':dept' => $dept,
                ':mid' => $mId ?: null,
                ':mgr' => $mgr ?: null,
                ':d' => $d,
                ':cin' => $cin ?: null,
                ':cout' => $cout ?: null,
                ':st' => $status,
                ':late' => $lateMins,
                ':gm' => $grossMins,
                ':gh' => $grossHrs,
                ':tbs' => $breakSec,
                ':tbm' => $breakMins,
                ':bf' => $breakFmt,
                ':ob' => $onBreak,
                ':loc' => $loc
            ]);
            $saved++;
        }
        json_out(["success" => true, "message" => "Synced {$saved} records into MySQL attendance_records.", "count" => $saved]);
    }

    json_out(["success" => false, "error" => "Unknown punch action."], 400);
}
?>
