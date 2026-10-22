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
    $date = trim($_GET['date'] ?? date('Y-m-d'));

    // Check today's record
    if ($action === 'today') {
        if (empty($empId)) json_out(["success" => false, "error" => "Employee ID is required."], 400);

        $stmt = $pdo->prepare("SELECT * FROM attendance_records WHERE employee_id = :eid AND date = :d LIMIT 1");
        $stmt->execute([':eid' => $empId, ':d' => $date]);
        $record = $stmt->fetch();

        json_out([
            "success" => true,
            "record" => $record ?: null,
            "is_punched_in" => ($record && !empty($record['check_in']) && empty($record['check_out'])),
            "is_completed" => ($record && !empty($record['check_out'])),
            "is_on_break" => ($record && !empty($record['is_on_break']))
        ]);
    }

    // Monthly or Range Attendance History
    $month = trim($_GET['month'] ?? date('m'));
    $year = trim($_GET['year'] ?? date('Y'));

    $sql = "SELECT * FROM attendance_records WHERE MONTH(date) = :m AND YEAR(date) = :y";
    $params = [':m' => $month, ':y' => $year];

    if (!empty($empId)) {
        $sql .= " AND employee_id = :eid";
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

    json_out(["success" => false, "error" => "Unknown punch action."], 400);
}
?>
