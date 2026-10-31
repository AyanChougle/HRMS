<?php
/**
 * DIALLO HRMS — ONE-CLICK AUTO-UPDATER & PATCH EXTRACTOR
 * Place this file in public_html and open https://hrmstfw.com/update.php in your browser.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Diallo HRMS — One-Click Patch Updater</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; line-height: 1.6; }
    .card { max-width: 680px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); border: 1px solid #334155; }
    h1 { margin-top: 0; color: #38bdf8; font-size: 1.6rem; display: flex; align-items: center; gap: 10px; }
    .log { background: #090d16; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 0.9rem; max-height: 380px; overflow-y: auto; margin: 20px 0; border: 1px solid #1e293b; }
    .ok { color: #4ade80; }
    .warn { color: #facc15; }
    .err { color: #f87171; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 10px; cursor: pointer; border: none; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-success { background: #16a34a; color: #fff; }
  </style>
</head>
<body>
  <div class="card">
    <h1>
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
      Diallo HRMS Auto-Updater
    </h1>
    <p style="color: #94a3b8; font-size: 0.95rem;">Extracting latest fixes directly into <code>public_html</code>...</p>
    
    <div class="log">
<?php
$targetDir = __DIR__;
$zipFile = $targetDir . '/diallo_hrms_patch.zip';

$extracted = 0;
$errors = 0;

if (!file_exists($zipFile)) {
    echo "<div class='warn'>[INFO] diallo_hrms_patch.zip not found locally. Downloading from GitHub...</div>";
    $githubUrl = 'https://raw.githubusercontent.com/AyanChougle/HRMS/main/diallo_hrms_patch.zip';
    $zipData = @file_get_contents($githubUrl);
    if ($zipData && strlen($zipData) > 50000) {
        file_put_contents($zipFile, $zipData);
        echo "<div class='ok'>[OK] Downloaded patch from GitHub (" . strlen($zipData) . " bytes)</div>";
    } else {
        echo "<div class='err'>[ERROR] Could not download diallo_hrms_patch.zip. Please upload diallo_hrms_patch.zip to public_html/ via File Manager first.</div>";
        $errors++;
    }
}

if (file_exists($zipFile) && class_exists('ZipArchive')) {
    $zip = new ZipArchive();
    $res = $zip->open($zipFile);
    if ($res === TRUE) {
        echo "<div class='ok'>[OK] Opened diallo_hrms_patch.zip (" . $zip->numFiles . " files inside)</div>";
        
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $filename = $zip->getNameIndex($i);
            // Skip directory entries
            if (substr($filename, -1) === '/') continue;

            $destPath = $targetDir . '/' . $filename;
            $destSubdir = dirname($destPath);
            if (!is_dir($destSubdir)) {
                mkdir($destSubdir, 0755, true);
            }

            $content = $zip->getFromIndex($i);
            if ($content !== false) {
                file_put_contents($destPath, $content);
                $extracted++;
                echo "<div class='ok'>&nbsp;&nbsp;✔ Updated: {$filename}</div>";
            }
        }
        $zip->close();
        echo "<div class='ok'><strong>[SUCCESS] Extracted {$extracted} files directly into public_html!</strong></div>";
    } else {
        echo "<div class='err'>[ERROR] Could not open zip file (Code: {$res})</div>";
        $errors++;
    }
} elseif (!class_exists('ZipArchive')) {
    echo "<div class='err'>[ERROR] ZipArchive PHP extension not enabled on this server.</div>";
    $errors++;
}

// Database Connection & Schema Verification
echo "<hr style='border-color: #334155; margin: 15px 0;'>";
echo "<div>[INFO] Verifying Hostinger Database and Columns...</div>";
try {
    require_once $targetDir . '/hostinger_backend/db.php';
    if ($pdo) {
        echo "<div class='ok'>[OK] Connected to Hostinger MySQL database: " . htmlspecialchars($dbName) . "</div>";
        
        // Ensure initial_password exists
        try {
            $hasInit = $pdo->query("SHOW COLUMNS FROM users LIKE 'initial_password'")->fetch();
            if (!$hasInit) {
                $pdo->exec("ALTER TABLE users ADD COLUMN initial_password VARCHAR(255) DEFAULT NULL AFTER password_hash");
                echo "<div class='ok'>&nbsp;&nbsp;✔ Added initial_password column to users table</div>";
            }
        } catch (\Throwable $e) {}

        // Ensure employees initial_password exists
        try {
            $hasEmpInit = $pdo->query("SHOW COLUMNS FROM employees LIKE 'initial_password'")->fetch();
            if (!$hasEmpInit) {
                $pdo->exec("ALTER TABLE employees ADD COLUMN initial_password VARCHAR(255) DEFAULT NULL");
                echo "<div class='ok'>&nbsp;&nbsp;✔ Added initial_password column to employees table</div>";
            }
        } catch (\Throwable $e) {}

        // Check users count
        $uCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        echo "<div class='ok'>&nbsp;&nbsp;✔ Users in database: {$uCount}</div>";

        // Check employees count
        $eCount = $pdo->query("SELECT COUNT(*) FROM employees")->fetchColumn();
        echo "<div class='ok'>&nbsp;&nbsp;✔ Employees in database: {$eCount}</div>";

        // Auto sync missing logins from employees to users table
        try {
            $missingStmt = $pdo->query("SELECT id, user_id, employee_code, email, work_email, full_name, first_name, last_name, phone, role_id, department, designation, initial_password FROM employees");
            $allEmps = $missingStmt->fetchAll();
            $syncedCount = 0;
            foreach ($allEmps as $emp) {
                $eMail = strtolower(trim(!empty($emp['email']) ? $emp['email'] : ($emp['work_email'] ?? '')));
                if (empty($eMail)) continue;
                $chk = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = :e OR (employee_code != '' AND employee_code = :c) LIMIT 1");
                $chk->execute([':e' => $eMail, ':c' => $emp['employee_code']]);
                if (!$chk->fetch()) {
                    $uUid = !empty($emp['user_id']) ? $emp['user_id'] : ('emp_' . strtolower(str_replace(['-', ' '], '', $emp['employee_code'] ?: bin2hex(random_bytes(4)))));
                    $uPass = !empty($emp['initial_password']) ? $emp['initial_password'] : 'TradeForWealth@2026';
                    $pdo->prepare("
                        INSERT INTO users (uid, employee_code, email, password_hash, initial_password, display_name, first_name, last_name, phone, role_id, department, designation, status, company_id)
                        VALUES (:uid, :code, :email, :hash, :init_pwd, :name, :first, :last, :phone, :role, :dept, :desig, 'ACTIVE', 'comp_diallo_india')
                    ")->execute([
                        ':uid' => $uUid,
                        ':code' => $emp['employee_code'],
                        ':email' => $eMail,
                        ':hash' => password_hash($uPass, PASSWORD_BCRYPT),
                        ':init_pwd' => $uPass,
                        ':name' => $emp['full_name'],
                        ':first' => $emp['first_name'] ?? '',
                        ':last' => $emp['last_name'] ?? '',
                        ':phone' => $emp['phone'] ?? '',
                        ':role' => canonical_role($emp['role_id']),
                        ':dept' => $emp['department'] ?? 'Operations',
                        ':desig' => $emp['designation'] ?? 'Associate'
                    ]);
                    $syncedCount++;
                }
            }
            if ($syncedCount > 0) {
                echo "<div class='ok'>&nbsp;&nbsp;✔ Provisioned {$syncedCount} missing user login accounts from employees table</div>";
            }
        } catch (\Throwable $e) {}
    }
} catch (\Throwable $ex) {
    echo "<div class='warn'>[NOTICE] DB verification: " . htmlspecialchars($ex->getMessage()) . "</div>";
}
?>
    </div>

    <?php if ($errors === 0 && $extracted > 0): ?>
      <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid #16a34a; padding: 14px; border-radius: 8px; color: #4ade80; margin-bottom: 20px;">
        ✅ <strong>HRMS has been successfully upgraded!</strong> All latest scripts, authentication fixes, and employee creation handlers are live.
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="login.html?v=<?php echo time(); ?>" class="btn btn-primary">Go to Login Page</a>
        <a href="index.html#create-employee" class="btn btn-success">Go to Create Employee</a>
        <a href="index.html#attendance" class="btn btn-primary" style="background: #475569;">Go to Attendance</a>
      </div>
    <?php else: ?>
      <p style="color: #f87171;">Some errors occurred. Please make sure <code>diallo_hrms_patch.zip</code> is uploaded to <code>public_html/</code>.</p>
    <?php endif; ?>
  </div>
</body>
</html>
