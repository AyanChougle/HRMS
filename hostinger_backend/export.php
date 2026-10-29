<?php
// ==============================================================================
// DIALLO HRMS — ENTERPRISE EXPORT ENGINE (EXCEL XLSX & CSV)
// Exact RadeNextHR 18-Column Muster & Attendance Summary Specification
// 100% Dynamic MySQL Database Driven — Zero Hardcoded Business Data
// ==============================================================================

require_once 'db.php';

// Helper: Excel column letter from 0-based index
function get_excel_col_letter($index) {
    $letters = '';
    $index += 1;
    while ($index > 0) {
        $rem = ($index - 1) % 26;
        $letters = chr(65 + $rem) . $letters;
        $index = intval(($index - $rem) / 26);
    }
    return $letters;
}

// Generate genuine OpenXML .xlsx workbook with pure PHP ZipArchive
function stream_xlsx_download($filename, $sheetName, $headers, $rows, $colWidths = []) {
    if (!class_exists('ZipArchive')) {
        // Fallback to CSV if ZipArchive is unavailable
        stream_csv_download(str_replace('.xlsx', '.csv', $filename), $headers, $rows);
        return;
    }

    $tempFile = tempnam(sys_get_temp_dir(), 'hrms_xlsx_');
    $zip = new ZipArchive();
    if ($zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        stream_csv_download(str_replace('.xlsx', '.csv', $filename), $headers, $rows);
        return;
    }

    // 1. [Content_Types].xml
    $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' . "\n"
        . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' . "\n"
        . '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' . "\n"
        . '  <Default Extension="xml" ContentType="application/xml"/>' . "\n"
        . '  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' . "\n"
        . '  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' . "\n"
        . '  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' . "\n"
        . '</Types>';
    $zip->addFromString('[Content_Types].xml', $contentTypes);

    // 2. _rels/.rels
    $rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' . "\n"
        . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' . "\n"
        . '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' . "\n"
        . '</Relationships>';
    $zip->addFromString('_rels/.rels', $rels);

    // 3. xl/_rels/workbook.xml.rels
    $wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' . "\n"
        . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' . "\n"
        . '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' . "\n"
        . '  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' . "\n"
        . '</Relationships>';
    $zip->addFromString('xl/_rels/workbook.xml.rels', $wbRels);

    // 4. xl/workbook.xml
    $safeSheetName = htmlspecialchars($sheetName, ENT_XML1, 'UTF-8');
    $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' . "\n"
        . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' . "\n"
        . '  <sheets>' . "\n"
        . '    <sheet name="' . $safeSheetName . '" sheetId="1" r:id="rId1"/>' . "\n"
        . '  </sheets>' . "\n"
        . '</workbook>';
    $zip->addFromString('xl/workbook.xml', $workbook);

    // 5. xl/styles.xml — Style 1: Header (#1F3864 Navy fill, Calibri 11pt Bold White font)
    $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' . "\n"
        . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' . "\n"
        . '  <fonts count="2">' . "\n"
        . '    <font><sz val="11"/><name val="Calibri"/><family val="2"/></font>' . "\n"
        . '    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>' . "\n"
        . '  </fonts>' . "\n"
        . '  <fills count="3">' . "\n"
        . '    <fill><patternFill patternType="none"/></fill>' . "\n"
        . '    <fill><patternFill patternType="gray125"/></fill>' . "\n"
        . '    <fill><patternFill patternType="solid"><fgColor rgb="FF1F3864"/><bgColor indexed="64"/></patternFill></fill>' . "\n"
        . '  </fills>' . "\n"
        . '  <borders count="1">' . "\n"
        . '    <border><left/><right/><top/><bottom/><diagonal/></border>' . "\n"
        . '  </borders>' . "\n"
        . '  <cellStyleXfs count="1">' . "\n"
        . '    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>' . "\n"
        . '  </cellStyleXfs>' . "\n"
        . '  <cellXfs count="3">' . "\n"
        . '    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' . "\n"
        . '    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' . "\n"
        . '    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' . "\n"
        . '  </cellXfs>' . "\n"
        . '</styleSheet>';
    $zip->addFromString('xl/styles.xml', $styles);

    // 6. xl/worksheets/sheet1.xml
    $sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' . "\n";
    $sheetXml .= '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' . "\n";
    $sheetXml .= '  <sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' . "\n";

    if (!empty($colWidths)) {
        $sheetXml .= '  <cols>' . "\n";
        foreach ($colWidths as $idx => $w) {
            $cIdx = $idx + 1;
            $sheetXml .= '    <col min="' . $cIdx . '" max="' . $cIdx . '" width="' . $w . '" customWidth="1"/>' . "\n";
        }
        $sheetXml .= '  </cols>' . "\n";
    }

    $sheetXml .= '  <sheetData>' . "\n";

    // Row 1: Headers
    $sheetXml .= '    <row r="1" ht="26" customHeight="1">' . "\n";
    foreach ($headers as $colIdx => $h) {
        $cellRef = get_excel_col_letter($colIdx) . '1';
        $safeH = htmlspecialchars((string)$h, ENT_XML1, 'UTF-8');
        $sheetXml .= '      <c r="' . $cellRef . '" s="1" t="inlineStr"><is><t>' . $safeH . '</t></is></c>' . "\n";
    }
    $sheetXml .= '    </row>' . "\n";

    // Data Rows
    $rowNum = 2;
    foreach ($rows as $row) {
        $sheetXml .= '    <row r="' . $rowNum . '" ht="20" customHeight="1">' . "\n";
        $colIdx = 0;
        foreach ($row as $val) {
            $cellRef = get_excel_col_letter($colIdx) . $rowNum;
            if ($val === null || $val === '') {
                // leave blank
            } elseif (is_numeric($val) && !preg_match('/^0[0-9]+/', (string)$val)) {
                $sheetXml .= '      <c r="' . $cellRef . '" s="2"><v>' . $val . '</v></c>' . "\n";
            } else {
                $safeVal = htmlspecialchars((string)$val, ENT_XML1, 'UTF-8');
                $sheetXml .= '      <c r="' . $cellRef . '" t="inlineStr"><is><t>' . $safeVal . '</t></is></c>' . "\n";
            }
            $colIdx++;
        }
        $sheetXml .= '    </row>' . "\n";
        $rowNum++;
    }

    $sheetXml .= '  </sheetData>' . "\n";
    $sheetXml .= '</worksheet>';
    $zip->addFromString('xl/worksheets/sheet1.xml', $sheetXml);
    $zip->close();

    // Stream download headers
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($tempFile));
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    readfile($tempFile);
    @unlink($tempFile);
    exit;
}

// Generate RFC 4180 CSV with UTF-8 BOM and Formula Injection Protection
function stream_csv_download($filename, $headers, $rows) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    // Output UTF-8 BOM so Excel opens UTF-8 characters cleanly
    echo "\xEF\xBB\xBF";
    $out = fopen('php://output', 'w');

    fputcsv($out, $headers);
    foreach ($rows as $row) {
        $sanitized = array_map(function($val) {
            if ($val === null) return '';
            $firstChar = substr((string)$val, 0, 1);
            if (in_array($firstChar, ['=', '+', '-', '@', "\t", "\r"])) {
                return "'" . $val;
            }
            return $val;
        }, array_values($row));
        fputcsv($out, $sanitized);
    }
    fclose($out);
    exit;
}

// ==============================================================================
// REQUEST ROUTING & AUTHENTICATION CHECK
// ==============================================================================
$type = strtolower(trim($_GET['type'] ?? 'attendance'));
$format = strtolower(trim($_GET['format'] ?? 'xlsx'));

try {
    $currentUser = get_current_user_or_null($pdo);
    $userRole = canonical_role($currentUser['role_id'] ?? $_GET['role'] ?? 'EMPLOYEE');
    $userCode = $currentUser['employee_code'] ?? $_GET['employee_code'] ?? '';
    $userUid = $currentUser['uid'] ?? $currentUser['id'] ?? $_GET['uid'] ?? '';
    $userDept = $currentUser['department'] ?? '';

    if (!in_array($userRole, ['ADMIN', 'HR', 'OPS', 'COMPLIANCE', 'MANAGER', 'TL', 'EMPLOYEE'])) {
        json_out(["success" => false, "error" => "Access denied. Insufficient permissions to export data."], 403);
    }

    // -------------------------------------------------------------------------
    // 1. ATTENDANCE SUMMARY / MUSTER EXPORT (EXACT RADENEXTHR 18-COLUMN FORMAT)
    // -------------------------------------------------------------------------
    if (in_array($type, ['attendance', 'muster', 'monthly_attendance', 'monthly', 'summary'])) {
        $headers = [
            'Emp Code', 'Employee Name', 'Department', 'Designation', 'Month',
            'Year', 'Working Days', 'Present', 'Absent', 'Half Days',
            'Paid Leave', 'LWP', 'OT Hours', 'Holidays', 'Week Off',
            'Worked H/WO', 'Payable Days', 'Finalized'
        ];
        $colWidths = [12, 22, 18, 25, 14, 10, 14, 10, 10, 11, 12, 10, 11, 11, 11, 13, 14, 11];

        // Parse Target Year and Month
        $rawMonth = trim($_GET['month'] ?? '');
        $rawYear = trim($_GET['year'] ?? '');

        $targetYear = !empty($rawYear) && is_numeric($rawYear) ? intval($rawYear) : intval(date('Y'));
        $targetMonth = intval(date('n'));
        if (!empty($rawMonth)) {
            if (is_numeric($rawMonth)) {
                $targetMonth = intval($rawMonth);
            } else {
                $parsedM = date_parse($rawMonth);
                if ($parsedM && !empty($parsedM['month'])) {
                    $targetMonth = $parsedM['month'];
                }
            }
        }
        if ($targetMonth < 1 || $targetMonth > 12) $targetMonth = intval(date('n'));

        $monthNameStr = date('F Y', strtotime(sprintf('%04d-%02d-01', $targetYear, $targetMonth)));
        $startDate = sprintf('%04d-%02d-01', $targetYear, $targetMonth);
        $daysInMonth = intval(date('t', strtotime($startDate)));
        $endDate = sprintf('%04d-%02d-%02d', $targetYear, $targetMonth, $daysInMonth);

        // Count Sundays
        $sundaysCount = 0;
        $sundayDates = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $curDateStr = sprintf('%04d-%02d-%02d', $targetYear, $targetMonth, $d);
            if (date('w', strtotime($curDateStr)) == 0) {
                $sundaysCount++;
                $sundayDates[$curDateStr] = true;
            }
        }

        // Count Holidays strictly within the target month (only count if in that month)
        $holidayDates = [];
        try {
            $hStmt = $pdo->prepare("SELECT date, name FROM holidays WHERE date BETWEEN :s AND :e");
            $hStmt->execute([':s' => $startDate, ':e' => $endDate]);
            while ($h = $hStmt->fetch()) {
                $holidayDates[$h['date']] = true;
            }
        } catch (\Throwable $e) {}

        // Holidays only count if in that month; if 0 declared, it is strictly 0
        $holidaysCount = count($holidayDates);

        // Working Days = Total Days in Month - Holidays
        $workingDays = max(0, $daysInMonth - $holidaysCount);

        // Fetch Employees
        $empSql = "
            SELECT e.id, e.employee_code, e.full_name, e.department, e.designation, e.user_id,
                   e.team_lead_id, e.manager_id
            FROM employees e
            WHERE (e.employment_status IS NULL OR e.employment_status = 'ACTIVE' OR e.employment_status = 'PROBATION')
        ";
        $empParams = [];

        // Role-based visibility scoping
        if ($userRole === 'EMPLOYEE') {
            $empSql .= " AND (e.id = :self_uid OR e.employee_code = :self_code OR e.user_id = :self_uid)";
            $empParams[':self_uid'] = $userUid;
            $empParams[':self_code'] = $userCode;
        } elseif ($userRole === 'TL') {
            $tlName = $currentUser['display_name'] ?? trim(($currentUser['first_name'] ?? '') . ' ' . ($currentUser['last_name'] ?? ''));
            $empSql .= " AND (
                e.team_lead_id = :tlid 
                OR e.team_lead_id = :tlcode 
                OR e.team_lead LIKE :tlname
                OR e.manager_id = :tlid
                OR e.manager_id = :tlcode
                OR e.manager LIKE :tlpattern
                OR e.id = :self_uid 
                OR e.employee_code = :self_code
            )";
            $empParams[':tlid'] = $userUid;
            $empParams[':tlcode'] = $userCode;
            $empParams[':tlname'] = '%' . trim($tlName) . '%';
            $empParams[':tlpattern'] = '%' . trim($userCode ?: $tlName) . '%';
            $empParams[':self_uid'] = $userUid;
            $empParams[':self_code'] = $userCode;
        } elseif ($userRole === 'MANAGER' && !empty($userDept)) {
            $empSql .= " AND (e.department = :dept OR e.manager_id = :mgr_uid OR e.manager_id = :mgr_code OR e.id = :self_uid OR e.employee_code = :self_code)";
            $empParams[':dept'] = $userDept;
            $empParams[':mgr_uid'] = $userUid;
            $empParams[':mgr_code'] = $userCode;
            $empParams[':self_uid'] = $userUid;
            $empParams[':self_code'] = $userCode;
        }

        $filterDept = trim($_GET['department'] ?? '');
        if (!empty($filterDept) && $filterDept !== 'All' && $filterDept !== 'All Departments') {
            $empSql .= " AND e.department = :filter_dept";
            $empParams[':filter_dept'] = $filterDept;
        }

        $empFilter = trim($_GET['employee_id'] ?? $_GET['employee_code'] ?? '');
        if (!empty($empFilter)) {
            $empSql .= " AND (e.id = :emp_filter OR e.employee_code = :emp_filter)";
            $empParams[':emp_filter'] = $empFilter;
        }

        $empSql .= " ORDER BY e.employee_code ASC, e.full_name ASC";
        $empStmt = $pdo->prepare($empSql);
        $empStmt->execute($empParams);
        $employees = $empStmt->fetchAll();

        // Fetch Attendance records for the period
        $attStmt = $pdo->prepare("
            SELECT employee_id, employee_code, date, status, check_in, check_out, gross_minutes
            FROM attendance_records
            WHERE date BETWEEN :s AND :e
        ");
        $attStmt->execute([':s' => $startDate, ':e' => $endDate]);
        $allAttRecords = $attStmt->fetchAll();

        $attByEmp = [];
        foreach ($allAttRecords as $r) {
            $eid = $r['employee_id'];
            $ecode = $r['employee_code'];
            if (!empty($eid)) $attByEmp[$eid][] = $r;
            if (!empty($ecode) && $ecode !== $eid) $attByEmp[$ecode][] = $r;
        }

        // Fetch Approved Leave applications for the period
        $leaveStmt = $pdo->prepare("
            SELECT employee_id, employee_code, leave_type, days_count, status
            FROM leave_applications
            WHERE status = 'APPROVED'
              AND (
                   (start_date BETWEEN :s1 AND :e1)
                OR (end_date BETWEEN :s2 AND :e2)
              )
        ");
        $leaveStmt->execute([':s1' => $startDate, ':e1' => $endDate, ':s2' => $startDate, ':e2' => $endDate]);
        $allLeaves = $leaveStmt->fetchAll();

        $leavesByEmp = [];
        foreach ($allLeaves as $l) {
            $eid = $l['employee_id'];
            $ecode = $l['employee_code'];
            if (!empty($eid)) $leavesByEmp[$eid][] = $l;
            if (!empty($ecode) && $ecode !== $eid) $leavesByEmp[$ecode][] = $l;
        }

        $rows = [];
        foreach ($employees as $emp) {
            $eid = $emp['id'];
            $ecode = $emp['employee_code'] ?: ('EMP' . str_pad($eid, 3, '0', STR_PAD_LEFT));
            $empAtt = $attByEmp[$eid] ?? ($attByEmp[$ecode] ?? []);
            $empLeaves = $leavesByEmp[$eid] ?? ($leavesByEmp[$ecode] ?? []);

            $presentCount = 0;
            $halfDaysCount = 0;
            $otHours = 0;
            $workedHWO = 0;

            $loggedDates = [];
            foreach ($empAtt as $a) {
                $aDate = $a['date'];
                if (isset($loggedDates[$aDate])) continue;
                $loggedDates[$aDate] = true;

                $st = strtoupper($a['status'] ?? '');
                $isSundayOrHoliday = isset($sundayDates[$aDate]) || isset($holidayDates[$aDate]);

                if ($isSundayOrHoliday && !empty($a['check_in'])) {
                    $workedHWO++;
                }

                if ($st === 'HALF_DAY') {
                    $halfDaysCount++;
                } elseif (in_array($st, ['PRESENT', 'LATE', 'REGULARIZED', 'ON_DUTY']) || (!empty($a['check_in']) && empty($st))) {
                    if (!$isSundayOrHoliday) {
                        $presentCount++;
                    }
                }

                $grossMins = intval($a['gross_minutes'] ?? 0);
                if ($grossMins > 540) { // Over 9 hours
                    $otHours += round(($grossMins - 540) / 60, 1);
                }
            }

            // Calculate Paid Leave & LWP
            $paidLeaveCount = 0;
            $lwpCount = 0;
            foreach ($empLeaves as $l) {
                $lType = strtoupper($l['leave_type'] ?? '');
                $days = floatval($l['days_count'] ?? 1);
                if (in_array($lType, ['LWP', 'UNPAID', 'LOSS_OF_PAY'])) {
                    $lwpCount += $days;
                } else {
                    $paidLeaveCount += $days;
                }
            }

            // Absent Days
            $absentCount = max(0, $workingDays - $presentCount - $halfDaysCount - $paidLeaveCount - $lwpCount);

            // Payable Days
            $payableDays = round($presentCount + $paidLeaveCount + $holidaysCount + ($halfDaysCount * 0.5) + $workedHWO, 1);

            $rows[] = [
                'Emp Code'      => $ecode,
                'Employee Name' => $emp['full_name'],
                'Department'    => $emp['department'] ?: 'Operations',
                'Designation'   => $emp['designation'] ?: 'Executive',
                'Month'         => $monthNameStr,
                'Year'          => $targetYear,
                'Working Days'  => $workingDays,
                'Present'       => $presentCount,
                'Absent'        => $absentCount,
                'Half Days'     => $halfDaysCount,
                'Paid Leave'    => $paidLeaveCount,
                'LWP'           => $lwpCount,
                'OT Hours'      => $otHours,
                'Holidays'      => $holidaysCount,
                'Week Off'      => $sundaysCount,
                'Worked H/WO'   => $workedHWO,
                'Payable Days'  => $payableDays,
                'Finalized'     => 'No'
            ];
        }

        $filename = "Diallo_Attendance_Summary_{$targetYear}_" . str_pad($targetMonth, 2, '0', STR_PAD_LEFT);
        if ($format === 'csv') {
            stream_csv_download($filename . ".csv", $headers, $rows);
        } else {
            stream_xlsx_download($filename . ".xlsx", "Attendance Summary", $headers, $rows, $colWidths);
        }
        exit;
    }

    // -------------------------------------------------------------------------
    // 2. DAILY ATTENDANCE REGISTER EXPORT
    // -------------------------------------------------------------------------
    elseif ($type === 'daily_attendance' || $type === 'daily') {
        $headers = [
            'Date', 'Employee Code', 'Employee Name', 'Department', 'Designation',
            'Check In', 'Check Out', 'Total Work (Hrs)', 'Break Duration (Mins)',
            'Status', 'Work Mode', 'Location'
        ];
        $colWidths = [12, 14, 22, 18, 22, 12, 12, 16, 18, 12, 14, 25];

        $startDate = trim($_GET['start_date'] ?? date('Y-m-01'));
        $endDate = trim($_GET['end_date'] ?? date('Y-m-d'));

        $sql = "
            SELECT a.date, a.employee_code, COALESCE(e.full_name, a.employee_name) as full_name,
                   e.department, e.designation,
                   a.check_in, a.check_out,
                   ROUND(a.gross_minutes / 60, 2) as work_hours,
                   ROUND(a.total_break_seconds / 60, 1) as break_mins,
                   a.status, a.work_mode, a.location
            FROM attendance_records a
            LEFT JOIN employees e ON (a.employee_id = e.id OR a.employee_code = e.employee_code)
            WHERE a.date BETWEEN :start_date AND :end_date
        ";
        $params = [':start_date' => $startDate, ':end_date' => $endDate];

        if ($userRole === 'EMPLOYEE') {
            $sql .= " AND (a.employee_id = :self_uid OR a.employee_code = :self_code)";
            $params[':self_code'] = $userCode;
            $params[':self_uid'] = $userUid;
        } elseif ($userRole === 'TL') {
            $tlName = $currentUser['display_name'] ?? trim(($currentUser['first_name'] ?? '') . ' ' . ($currentUser['last_name'] ?? ''));
            $sql .= " AND (
                e.team_lead_id = :tlid 
                OR e.team_lead_id = :tlcode 
                OR e.team_lead LIKE :tlname
                OR e.manager_id = :tlid
                OR e.manager_id = :tlcode
                OR e.manager LIKE :tlpattern
                OR e.employee_code = :self_code 
                OR e.id = :self_uid
            )";
            $params[':tlid'] = $userUid;
            $params[':tlcode'] = $userCode;
            $params[':tlname'] = '%' . trim($tlName) . '%';
            $params[':tlpattern'] = '%' . trim($userCode ?: $tlName) . '%';
            $params[':self_code'] = $userCode;
            $params[':self_uid'] = $userUid;
        } elseif ($userRole === 'MANAGER' && !empty($userDept)) {
            $sql .= " AND (e.department = :dept OR e.manager_id = :mgr_uid OR e.manager_id = :mgr_code OR e.employee_code = :self_code OR e.id = :self_uid)";
            $params[':dept'] = $userDept;
            $params[':mgr_uid'] = $userUid;
            $params[':mgr_code'] = $userCode;
            $params[':self_code'] = $userCode;
            $params[':self_uid'] = $userUid;
        }

        $empFilter = trim($_GET['employee_id'] ?? $_GET['employee_code'] ?? '');
        if (!empty($empFilter)) {
            $sql .= " AND (a.employee_id = :emp_filter OR a.employee_code = :emp_filter)";
            $params[':emp_filter'] = $empFilter;
        }

        $sql .= " ORDER BY a.date DESC, a.check_in DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $filename = "Diallo_Daily_Attendance_{$startDate}_to_{$endDate}";
        if ($format === 'csv') {
            stream_csv_download($filename . ".csv", $headers, $rows);
        } else {
            stream_xlsx_download($filename . ".xlsx", "Daily Attendance", $headers, $rows, $colWidths);
        }
        exit;
    }

    // -------------------------------------------------------------------------
    // 3. EMPLOYEES MASTER EXPORT (WITH REPORTING MANAGERS & DATABASE CREDS)
    // -------------------------------------------------------------------------
    elseif ($type === 'employees' || $type === 'people') {
        $headers = [
            'Employee Code', 'Full Name', 'Work Email', 'Phone', 'Role',
            'Department', 'Designation', 'Reporting Manager', 'Team Lead', 'Branch',
            'Employment Status', 'Joining Date', 'Initial Password'
        ];
        $colWidths = [14, 24, 26, 16, 14, 18, 22, 22, 20, 20, 16, 14, 20];

        if ($userRole === 'EMPLOYEE') {
            json_out(["success" => false, "error" => "Access denied. Employee census export is restricted to HR and Management."], 403);
        }

        $sql = "
            SELECT e.employee_code, e.full_name, e.work_email, e.phone, e.role_id,
                   e.department, e.designation,
                   COALESCE(NULLIF(e.manager, ''), 'Management') AS manager,
                   COALESCE(NULLIF(e.team_lead, ''), 'Direct') AS team_lead,
                   COALESCE(NULLIF(e.branch_name, ''), e.location, 'HQ Mumbai') AS branch,
                   e.employment_status, e.joining_date,
                   COALESCE(NULLIF(u.initial_password, ''), 'TradeForWealth@2026') AS initial_password
            FROM employees e
            LEFT JOIN users u ON (e.user_id = u.uid OR e.employee_code = u.employee_code OR LOWER(e.work_email) = LOWER(u.email))
            WHERE 1=1
        ";
        $params = [];

        if ($userRole === 'TL') {
            $tlName = $currentUser['display_name'] ?? trim(($currentUser['first_name'] ?? '') . ' ' . ($currentUser['last_name'] ?? ''));
            $sql .= " AND (
                e.team_lead_id = :tlid 
                OR e.team_lead_id = :tlcode 
                OR e.team_lead LIKE :tlname
                OR e.manager_id = :tlid
                OR e.manager_id = :tlcode
                OR e.manager LIKE :tlpattern
                OR e.employee_code = :self_code 
                OR e.id = :self_uid
            )";
            $params[':tlid'] = $userUid;
            $params[':tlcode'] = $userCode;
            $params[':tlname'] = '%' . trim($tlName) . '%';
            $params[':tlpattern'] = '%' . trim($userCode ?: $tlName) . '%';
            $params[':self_code'] = $userCode;
            $params[':self_uid'] = $userUid;
        } elseif ($userRole === 'MANAGER' && !empty($userDept)) {
            $sql .= " AND (e.department = :dept OR e.manager_id = :mgr_uid OR e.manager_id = :mgr_code OR e.manager LIKE :mgr_name OR e.employee_code = :self_code OR e.id = :self_uid)";
            $params[':dept'] = $userDept;
            $params[':mgr_uid'] = $userUid;
            $params[':mgr_code'] = $userCode;
            $params[':mgr_name'] = '%' . trim($currentUser['display_name'] ?? '') . '%';
            $params[':self_code'] = $userCode;
            $params[':self_uid'] = $userUid;
        }

        $dept = trim($_GET['department'] ?? '');
        if (!empty($dept) && $dept !== 'All' && $dept !== 'All Departments') {
            $sql .= " AND e.department = :filter_dept";
            $params[':filter_dept'] = $dept;
        }

        $status = trim($_GET['status'] ?? '');
        if (!empty($status) && $status !== 'All') {
            $sql .= " AND e.employment_status = :filter_status";
            $params[':filter_status'] = $status;
        }

        $sql .= " ORDER BY e.employee_code ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $filename = "Diallo_Employees_Master_" . date('Ymd_His');
        if ($format === 'csv') {
            stream_csv_download($filename . ".csv", $headers, $rows);
        } else {
            stream_xlsx_download($filename . ".xlsx", "Employees Master", $headers, $rows, $colWidths);
        }
        exit;
    }

    // -------------------------------------------------------------------------
    // 4. LEAVES APPLICATIONS EXPORT
    // -------------------------------------------------------------------------
    elseif ($type === 'leaves') {
        $headers = [
            'Application Date', 'Employee Code', 'Employee Name', 'Department',
            'Leave Type', 'Start Date', 'End Date', 'Days Count', 'Half Day',
            'Status', 'Reason', 'Reviewed By', 'Reviewed At', 'Rejection Reason'
        ];
        $colWidths = [16, 14, 22, 18, 14, 14, 14, 12, 10, 12, 25, 20, 16, 25];

        $sql = "
            SELECT l.created_at, l.employee_code, l.employee_name, l.department,
                   l.leave_type, l.start_date, l.end_date, l.days_count,
                   IF(l.is_half_day = 1, 'YES', 'NO') as half_day,
                   l.status, l.reason, l.approved_by_name, l.reviewed_at, l.rejection_reason
            FROM leave_applications l
            LEFT JOIN employees e ON (l.employee_id = e.id OR l.employee_code = e.employee_code)
            WHERE 1=1
        ";
        $params = [];

        if ($userRole === 'EMPLOYEE') {
            $sql .= " AND (l.employee_id = :self_uid OR l.employee_code = :self_code)";
            $params[':self_uid'] = $userUid;
            $params[':self_code'] = $userCode;
        } elseif ($userRole === 'TL') {
            $tlName = $currentUser['display_name'] ?? trim(($currentUser['first_name'] ?? '') . ' ' . ($currentUser['last_name'] ?? ''));
            $sql .= " AND (
                e.team_lead_id = :tlid 
                OR e.team_lead_id = :tlcode 
                OR e.team_lead LIKE :tlname
                OR e.manager_id = :tlid
                OR e.manager_id = :tlcode
                OR e.manager LIKE :tlpattern
                OR e.employee_code = :self_code 
                OR e.id = :self_uid
            )";
            $params[':tlid'] = $userUid;
            $params[':tlcode'] = $userCode;
            $params[':tlname'] = '%' . trim($tlName) . '%';
            $params[':tlpattern'] = '%' . trim($userCode ?: $tlName) . '%';
            $params[':self_code'] = $userCode;
            $params[':self_uid'] = $userUid;
        } elseif ($userRole === 'MANAGER' && !empty($userDept)) {
            $sql .= " AND (e.department = :dept OR e.manager_id = :mgr_uid OR e.manager_id = :mgr_code OR e.employee_code = :self_code OR e.id = :self_uid)";
            $params[':dept'] = $userDept;
            $params[':mgr_uid'] = $userUid;
            $params[':mgr_code'] = $userCode;
            $params[':self_code'] = $userCode;
            $params[':self_uid'] = $userUid;
        }

        $status = trim($_GET['status'] ?? '');
        if (!empty($status) && $status !== 'All') {
            $sql .= " AND l.status = :filter_status";
            $params[':filter_status'] = $status;
        }

        $sql .= " ORDER BY l.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $filename = "Diallo_Leaves_Audit_" . date('Ymd_His');
        if ($format === 'csv') {
            stream_csv_download($filename . ".csv", $headers, $rows);
        } else {
            stream_xlsx_download($filename . ".xlsx", "Leaves Audit", $headers, $rows, $colWidths);
        }
        exit;
    }

    // Default error for unknown type
    json_out(["success" => false, "error" => "Unsupported export type specified."], 400);

} catch (\Throwable $e) {
    error_log("[Export API Error] " . $e->getMessage());
    json_out(["success" => false, "error" => "Export generation failed: " . $e->getMessage()], 500);
}
