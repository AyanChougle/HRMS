<?php
require_once 'db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = strtolower(trim($_GET['action'] ?? ''));

// -----------------------------------------------------------------------------
// 1. TEMPLATE DOWNLOAD
// -----------------------------------------------------------------------------
if ($action === 'template') {
    $filename = "hrms_employee_import_template.csv";
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');
    echo "\xEF\xBB\xBF";

    $output = fopen('php://output', 'w');
    fputcsv($output, [
        'Employee Code', 'First Name', 'Last Name', 'Work Email', 'Phone',
        'Role', 'Department', 'Designation', 'Reporting Manager', 'Team Lead',
        'Branch', 'Employment Status', 'Joining Date', 'Initial Password'
    ]);
    fputcsv($output, [
        'D09991', 'Aarav', 'Sharma', 'aarav.sharma@tradeforwealth.co.in', '9876543210',
        'EMPLOYEE', 'Operations', 'Relationship Manager', 'Ritik Shukla', 'Ritik Shukla',
        'Trade For Wealth - HQ Mumbai', 'ACTIVE', '2026-01-15', 'Diallo@2026'
    ]);
    fputcsv($output, [
        'D09992', 'Priya', 'Patel', 'priya.patel@tradeforwealth.co.in', '9876543211',
        'TL', 'Operations', 'Team Lead', 'Arshad Majothi', 'Priya Patel',
        'Trade For Wealth - HQ Mumbai', 'ACTIVE', '2025-06-01', 'Diallo@2026'
    ]);
    fclose($output);
    exit;
}

if ($method !== 'POST') {
    json_out(["success" => false, "error" => "Only POST method is supported for imports."], 405);
}

try {
    $currentUser = get_current_user_or_null($pdo);
    $userRole = canonical_role($currentUser['role_id'] ?? $_POST['role'] ?? 'EMPLOYEE');

    if (!in_array($userRole, ['ADMIN', 'HR'])) {
        json_out(["success" => false, "error" => "Access denied. Only ADMIN or HR can import employees."], 403);
    }

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        json_out(["success" => false, "error" => "No file uploaded or file upload error occurred."], 400);
    }

    $tmpPath = $_FILES['file']['tmp_name'];
    $origName = $_FILES['file']['name'];
    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

    if (!in_array($ext, ['csv', 'txt'])) {
        // If client sends xlsx, we recommend exporting as CSV or using frontend SheetJS
        json_out(["success" => false, "error" => "Server expects CSV format. Please export spreadsheet as CSV (.csv)."], 400);
    }

    $handle = fopen($tmpPath, 'r');
    if (!$handle) {
        json_out(["success" => false, "error" => "Could not read uploaded file."], 500);
    }

    // Skip UTF-8 BOM if present
    $bom = fread($handle, 3);
    if ($bom !== "\xEF\xBB\xBF") {
        rewind($handle);
    }

    $rawHeader = fgetcsv($handle);
    if (!$rawHeader || count($rawHeader) < 3) {
        fclose($handle);
        json_out(["success" => false, "error" => "Invalid CSV header. Template requires at least Employee Code, First Name, Work Email."], 400);
    }

    // Normalize header map
    $headerMap = [];
    foreach ($rawHeader as $idx => $col) {
        $cleanCol = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $col)));
        $headerMap[$cleanCol] = $idx;
    }

    $colCode = $headerMap['employeecode'] ?? $headerMap['code'] ?? $headerMap['empid'] ?? null;
    $colFirst = $headerMap['firstname'] ?? $headerMap['first'] ?? null;
    $colLast = $headerMap['lastname'] ?? $headerMap['last'] ?? null;
    $colEmail = $headerMap['workemail'] ?? $headerMap['email'] ?? null;
    $colPhone = $headerMap['phone'] ?? $headerMap['mobile'] ?? null;
    $colRole = $headerMap['role'] ?? $headerMap['roleid'] ?? null;
    $colDept = $headerMap['department'] ?? $headerMap['dept'] ?? null;
    $colDesig = $headerMap['designation'] ?? $headerMap['title'] ?? null;
    $colMgr = $headerMap['reportingmanager'] ?? $headerMap['manager'] ?? $headerMap['mgr'] ?? null;
    $colTL = $headerMap['teamlead'] ?? $headerMap['teamleader'] ?? $headerMap['tl'] ?? null;
    $colBranch = $headerMap['branch'] ?? $headerMap['branchname'] ?? $headerMap['location'] ?? null;
    $colStatus = $headerMap['employmentstatus'] ?? $headerMap['status'] ?? null;
    $colJoin = $headerMap['joiningdate'] ?? $headerMap['doj'] ?? null;
    $colPass = $headerMap['initialpassword'] ?? $headerMap['password'] ?? $headerMap['loginpassword'] ?? null;

    if ($colCode === null || $colEmail === null) {
        fclose($handle);
        json_out(["success" => false, "error" => "Header must include 'Employee Code' and 'Work Email' columns."], 400);
    }

    $rows = [];
    $validationErrors = [];
    $existingCodes = [];
    $existingEmails = [];

    // Fetch existing codes and emails from DB for duplicate checking
    $codeStmt = $pdo->query("SELECT employee_code FROM employees WHERE employee_code IS NOT NULL AND employee_code != ''");
    while ($c = $codeStmt->fetchColumn()) {
        $existingCodes[strtoupper(trim($c))] = true;
    }

    $emailStmt = $pdo->query("SELECT LOWER(TRIM(work_email)) FROM employees WHERE work_email IS NOT NULL AND work_email != ''");
    while ($em = $emailStmt->fetchColumn()) {
        $existingEmails[$em] = true;
    }

    $rowNum = 1; // 1 was header
    while (($data = fgetcsv($handle)) !== false) {
        $rowNum++;
        // Skip empty lines
        if (empty(array_filter($data, 'trim'))) continue;

        $code = strtoupper(trim($data[$colCode] ?? ''));
        $first = trim($colFirst !== null ? ($data[$colFirst] ?? '') : '');
        $last = trim($colLast !== null ? ($data[$colLast] ?? '') : '');
        $email = strtolower(trim($data[$colEmail] ?? ''));
        $phone = trim($colPhone !== null ? ($data[$colPhone] ?? '') : '');
        $rawRole = trim($colRole !== null ? ($data[$colRole] ?? 'EMPLOYEE') : 'EMPLOYEE');
        $dept = trim($colDept !== null ? ($data[$colDept] ?? 'Operations') : 'Operations');
        $desig = trim($colDesig !== null ? ($data[$colDesig] ?? 'Staff') : 'Staff');
        $mgr = trim($colMgr !== null ? ($data[$colMgr] ?? '') : '');
        $tl = trim($colTL !== null ? ($data[$colTL] ?? '') : '');
        $branch = trim($colBranch !== null ? ($data[$colBranch] ?? 'Trade For Wealth - HQ Mumbai') : 'Trade For Wealth - HQ Mumbai');
        $pass = trim($colPass !== null ? ($data[$colPass] ?? 'TradeForWealth@2026') : 'TradeForWealth@2026');
        $status = strtoupper(trim($colStatus !== null ? ($data[$colStatus] ?? 'ACTIVE') : 'ACTIVE'));
        if (!in_array($status, ['ACTIVE', 'INACTIVE', 'SUSPENDED'])) $status = 'ACTIVE';
        $joinDate = trim($colJoin !== null ? ($data[$colJoin] ?? date('Y-m-d')) : date('Y-m-d'));

        $fullName = trim("$first $last");
        if (empty($fullName)) $fullName = $email ? explode('@', $email)[0] : "Employee $code";

        $canonicalRole = canonical_role($rawRole);

        // Validation checks
        $errors = [];
        if (empty($code)) $errors[] = "Employee Code is required";
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "Valid Work Email is required";

        $isDuplicateCode = isset($existingCodes[$code]);
        $isDuplicateEmail = isset($existingEmails[$email]);

        $rowItem = [
            'row' => $rowNum,
            'code' => $code,
            'name' => $fullName,
            'first_name' => $first,
            'last_name' => $last,
            'email' => $email,
            'phone' => $phone,
            'role' => $canonicalRole,
            'department' => $dept,
            'designation' => $desig,
            'manager' => $mgr,
            'team_lead' => $tl,
            'branch' => $branch,
            'password' => $pass,
            'status' => $status,
            'joining_date' => $joinDate,
            'is_duplicate' => ($isDuplicateCode || $isDuplicateEmail),
            'errors' => $errors
        ];

        if (!empty($errors)) {
            $validationErrors[] = "Row $rowNum: " . implode(', ', $errors);
        }

        $rows[] = $rowItem;
    }
    fclose($handle);

    $totalRows = count($rows);
    $validCount = count(array_filter($rows, fn($r) => empty($r['errors'])));
    $duplicateCount = count(array_filter($rows, fn($r) => $r['is_duplicate']));

    // -------------------------------------------------------------------------
    // PREVIEW MODE
    // -------------------------------------------------------------------------
    if ($action === 'preview' || isset($_POST['preview'])) {
        json_out([
            "success" => true,
            "mode" => "preview",
            "total_rows" => $totalRows,
            "valid_count" => $validCount,
            "duplicate_count" => $duplicateCount,
            "error_count" => count($validationErrors),
            "errors" => array_slice($validationErrors, 0, 20),
            "preview_rows" => array_slice($rows, 0, 10)
        ]);
    }

    // -------------------------------------------------------------------------
    // COMMIT MODE: Persist to MySQL
    // -------------------------------------------------------------------------
    $insertedCount = 0;
    $updatedCount = 0;
    $failedCount = 0;

    $pdo->beginTransaction();

    $empStmt = $pdo->prepare("
        INSERT INTO employees (
            id, user_id, employee_code, first_name, last_name, full_name, work_email, email, phone,
            role_id, department, designation, manager, team_lead, branch_name, location,
            employment_status, status, joining_date, date_of_joining, company_id
        ) VALUES (
            :id, :uid, :code, :first, :last, :full, :email, :email2, :phone,
            :role, :dept, :desig, :mgr, :tl, :bname, :loc,
            :status, :status2, :join, :join2, 'comp_diallo_india'
        )
        ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            full_name = VALUES(full_name),
            phone = VALUES(phone),
            role_id = VALUES(role_id),
            department = VALUES(department),
            designation = VALUES(designation),
            manager = COALESCE(NULLIF(VALUES(manager), ''), manager),
            team_lead = COALESCE(NULLIF(VALUES(team_lead), ''), team_lead),
            branch_name = COALESCE(NULLIF(VALUES(branch_name), ''), branch_name),
            location = COALESCE(NULLIF(VALUES(location), ''), location),
            employment_status = VALUES(employment_status),
            status = VALUES(status),
            joining_date = VALUES(joining_date),
            date_of_joining = VALUES(date_of_joining)
    ");

    $userStmt = $pdo->prepare("
        INSERT INTO users (
            uid, employee_code, email, password_hash, initial_password, display_name, first_name, last_name, phone,
            role_id, department, designation, branch_name, status, company_id
        ) VALUES (
            :uid, :code, :email, :phash, :pinit, :name, :first, :last, :phone,
            :role, :dept, :desig, :bname, :status, 'comp_diallo_india'
        )
        ON DUPLICATE KEY UPDATE
            employee_code = VALUES(employee_code),
            display_name = VALUES(display_name),
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            phone = VALUES(phone),
            role_id = VALUES(role_id),
            department = VALUES(department),
            designation = VALUES(designation),
            branch_name = COALESCE(NULLIF(VALUES(branch_name), ''), branch_name),
            status = VALUES(status)
    ");

    $leaveBalStmt = $pdo->prepare("
        INSERT IGNORE INTO leave_balances (employee_id, leave_type, year, total_credited, used, available)
        VALUES 
            (:eid1, 'Casual Leave', :y1, 12, 0, 12),
            (:eid2, 'Sick Leave', :y2, 12, 0, 12),
            (:eid3, 'Earned Leave', :y3, 15, 0, 15)
    ");

    $currentYear = intval(date('Y'));

    foreach ($rows as $r) {
        if (!empty($r['errors'])) {
            $failedCount++;
            continue;
        }

        try {
            $empId = 'emp_' . strtolower($r['code']);
            $userUid = 'usr_' . strtolower($r['code']);
            $rawPass = !empty($r['password']) ? $r['password'] : 'TradeForWealth@2026';
            $passHash = password_hash($rawPass, PASSWORD_BCRYPT);

            $empStmt->execute([
                ':id' => $empId,
                ':uid' => $userUid,
                ':code' => $r['code'],
                ':first' => $r['first_name'],
                ':last' => $r['last_name'],
                ':full' => $r['name'],
                ':email' => $r['email'],
                ':email2' => $r['email'],
                ':phone' => $r['phone'],
                ':role' => $r['role'],
                ':dept' => $r['department'],
                ':desig' => $r['designation'],
                ':mgr' => $r['manager'],
                ':tl' => $r['team_lead'],
                ':bname' => $r['branch'],
                ':loc' => $r['branch'],
                ':status' => $r['status'],
                ':status2' => $r['status'],
                ':join' => $r['joining_date'],
                ':join2' => $r['joining_date']
            ]);

            $userStmt->execute([
                ':uid' => $userUid,
                ':code' => $r['code'],
                ':email' => $r['email'],
                ':phash' => $passHash,
                ':pinit' => $rawPass,
                ':name' => $r['name'],
                ':first' => $r['first_name'],
                ':last' => $r['last_name'],
                ':phone' => $r['phone'],
                ':role' => $r['role'],
                ':dept' => $r['department'],
                ':desig' => $r['designation'],
                ':bname' => $r['branch'],
                ':status' => $r['status']
            ]);

            // Seed initial leave balances
            $leaveBalStmt->execute([
                ':eid1' => $empId, ':y1' => $currentYear,
                ':eid2' => $empId, ':y2' => $currentYear,
                ':eid3' => $empId, ':y3' => $currentYear
            ]);

            if ($r['is_duplicate']) {
                $updatedCount++;
            } else {
                $insertedCount++;
            }
        } catch (\Throwable $rowErr) {
            $failedCount++;
            $validationErrors[] = "Error saving {$r['code']}: " . $rowErr->getMessage();
        }
    }

    $pdo->commit();

    json_out([
        "success" => true,
        "mode" => "commit",
        "total_rows" => $totalRows,
        "inserted" => $insertedCount,
        "updated" => $updatedCount,
        "failed" => $failedCount,
        "message" => "Import completed: {$insertedCount} inserted, {$updatedCount} updated, {$failedCount} failed."
    ]);

} catch (\Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("[Import API Error] " . $e->getMessage());
    json_out(["success" => false, "error" => $e->getMessage()], 500);
}
