const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tempDir = path.join(__dirname, 'temp_patch');
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });

fs.mkdirSync(path.join(tempDir, 'css'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'hostinger_backend'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'js', 'firebase'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'js', 'services'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'js', 'views'), { recursive: true });

const filesToCopy = [
  ['index.html', 'index.html'],
  ['login.html', 'login.html'],
  ['css/components.css', 'css/components.css'],
  ['js/app.js', 'js/app.js'],
  ['js/firebase/auth-guard.js', 'js/firebase/auth-guard.js'],
  ['js/services/authService.js', 'js/services/authService.js'],
  ['js/services/apiClient.js', 'js/services/apiClient.js'],
  ['js/services/departmentService.js', 'js/services/departmentService.js'],
  ['js/services/employeeService.js', 'js/services/employeeService.js'],
  ['js/services/organizationService.js', 'js/services/organizationService.js'],
  ['js/views/people-view.js', 'js/views/people-view.js'],
  ['js/views/dashboard-view.js', 'js/views/dashboard-view.js'],
  ['hostinger_backend/auth.php', 'hostinger_backend/auth.php'],
  ['hostinger_backend/db.php', 'hostinger_backend/db.php'],
  ['hostinger_backend/departments.php', 'hostinger_backend/departments.php'],
  ['hostinger_backend/employees.php', 'hostinger_backend/employees.php'],
  ['hostinger_backend/migrate_from_firebase.php', 'hostinger_backend/migrate_from_firebase.php'],
  ['hostinger_backend/sync_roles.php', 'hostinger_backend/sync_roles.php']
];

filesToCopy.forEach(([src, dest]) => {
  const fullSrc = path.join(__dirname, src);
  const fullDest = path.join(tempDir, dest);
  fs.mkdirSync(path.dirname(fullDest), { recursive: true });
  fs.copyFileSync(fullSrc, fullDest);
});

const zipPath = path.join(__dirname, 'diallo_hrms_patch.zip');
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

execSync(`tar -a -c -f "${zipPath}" -C "${tempDir}" .`);
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('Successfully created', zipPath, 'Size:', fs.statSync(zipPath).size, 'bytes');
