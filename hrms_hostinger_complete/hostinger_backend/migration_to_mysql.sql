-- ==============================================================================
-- DIALLO HRMS ENTERPRISE â€” COMPLETE MYSQL MIGRATION SCRIPT
-- Strictly migrating from Firebase to 100% Hostinger MySQL
-- Target Database: u147377699_HRMS
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. AUTH TOKENS TABLE (Secure Session & Bearer Token Management)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `auth_tokens` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `token` VARCHAR(128) UNIQUE NOT NULL,
    `user_id` INT NOT NULL,
    `user_uid` VARCHAR(128) DEFAULT NULL,
    `user_email` VARCHAR(120) NOT NULL,
    `role_id` VARCHAR(50) NOT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_token_lookup` (`token`),
    INDEX `idx_token_user` (`user_id`),
    INDEX `idx_token_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. PASSWORD RESETS TABLE (Cryptographic Single-Use Expiring Tokens)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_resets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(120) NOT NULL,
    `token` VARCHAR(128) UNIQUE NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `used` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_pwd_reset_token` (`token`),
    INDEX `idx_pwd_reset_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TEAMS & ORGANIZATIONAL HIERARCHY TABLE
-- Company -> Department -> Team -> Team Lead (TL) -> Employees
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teams` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `department_id` INT DEFAULT NULL,
    `department_name` VARCHAR(100) DEFAULT 'Sales',
    `name` VARCHAR(120) NOT NULL,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `lead_employee_id` VARCHAR(128) DEFAULT NULL,
    `lead_name` VARCHAR(150) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_team_dept` (`department_name`),
    INDEX `idx_team_lead` (`lead_employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. DOCUMENTS & COMPLIANCE FILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `documents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` VARCHAR(128) NOT NULL,
    `employee_code` VARCHAR(50) DEFAULT NULL,
    `title` VARCHAR(200) NOT NULL,
    `category` VARCHAR(80) NOT NULL DEFAULT 'GENERAL',
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` TEXT NOT NULL,
    `file_size` INT DEFAULT 0,
    `file_type` VARCHAR(100) DEFAULT NULL,
    `uploaded_by` VARCHAR(128) DEFAULT NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_doc_emp` (`employee_id`),
    INDEX `idx_doc_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. ATTENDANCE BREAK SESSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `breaks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `attendance_record_id` INT DEFAULT NULL,
    `employee_id` VARCHAR(128) NOT NULL,
    `date` DATE NOT NULL,
    `start_time_iso` DATETIME NOT NULL,
    `end_time_iso` DATETIME DEFAULT NULL,
    `duration_seconds` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_break_emp_date` (`employee_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. ENSURE USERS TABLE SCHEMA AND CANONICAL 7 ROLES
-- ------------------------------------------------------------------------------
ALTER TABLE `users` 
    MODIFY COLUMN `role_id` VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
    ADD COLUMN IF NOT EXISTS `failed_attempts` INT NOT NULL DEFAULT 0 AFTER `status`,
    ADD COLUMN IF NOT EXISTS `locked_until` DATETIME DEFAULT NULL AFTER `failed_attempts`;

-- Normalize all legacy roles in `users` to the strict 7 canonical roles
UPDATE `users` SET `role_id` = 'ADMIN' WHERE `role_id` IN ('SUPER_ADMIN', 'COMPANY_ADMIN');
UPDATE `users` SET `role_id` = 'HR' WHERE `role_id` IN ('HR_MANAGER');
UPDATE `users` SET `role_id` = 'OPS' WHERE `role_id` IN ('OPERATIONS_MANAGER', 'PROCESS_OWNER');
UPDATE `users` SET `role_id` = 'COMPLIANCE' WHERE `role_id` IN ('COMPLIANCE_OFFICER');
UPDATE `users` SET `role_id` = 'MANAGER' WHERE `role_id` IN ('DEPARTMENT_MANAGER');
UPDATE `users` SET `role_id` = 'TL' WHERE `role_id` IN ('TEAM_LEAD');
UPDATE `users` SET `role_id` = 'EMPLOYEE' WHERE `role_id` NOT IN ('ADMIN', 'HR', 'OPS', 'COMPLIANCE', 'MANAGER', 'TL', 'EMPLOYEE');

-- ------------------------------------------------------------------------------
-- 7. ENSURE EMPLOYEES TABLE SCHEMA AND TEAM HIERARCHY
-- ------------------------------------------------------------------------------
ALTER TABLE `employees`
    ADD COLUMN IF NOT EXISTS `team_id` INT DEFAULT NULL AFTER `department`,
    ADD COLUMN IF NOT EXISTS `team_name` VARCHAR(120) DEFAULT NULL AFTER `team_id`,
    ADD COLUMN IF NOT EXISTS `team_lead_id` VARCHAR(128) DEFAULT NULL AFTER `manager`,
    ADD COLUMN IF NOT EXISTS `team_lead` VARCHAR(150) DEFAULT NULL AFTER `team_lead_id`;

-- Normalize all legacy roles in `employees` to the strict 7 canonical roles
UPDATE `employees` SET `role_id` = 'ADMIN' WHERE `role_id` IN ('SUPER_ADMIN', 'COMPANY_ADMIN');
UPDATE `employees` SET `role_id` = 'HR' WHERE `role_id` IN ('HR_MANAGER');
UPDATE `employees` SET `role_id` = 'OPS' WHERE `role_id` IN ('OPERATIONS_MANAGER', 'PROCESS_OWNER');
UPDATE `employees` SET `role_id` = 'COMPLIANCE' WHERE `role_id` IN ('COMPLIANCE_OFFICER');
UPDATE `employees` SET `role_id` = 'MANAGER' WHERE `role_id` IN ('DEPARTMENT_MANAGER');
UPDATE `employees` SET `role_id` = 'TL' WHERE `role_id` IN ('TEAM_LEAD');
UPDATE `employees` SET `role_id` = 'EMPLOYEE' WHERE `role_id` NOT IN ('ADMIN', 'HR', 'OPS', 'COMPLIANCE', 'MANAGER', 'TL', 'EMPLOYEE');

-- ------------------------------------------------------------------------------
-- 8. SEED STANDARD TEAMS BASED ON EXISTING SALES & OPS TEAM LEADS
-- ------------------------------------------------------------------------------
INSERT INTO `teams` (`name`, `code`, `department_name`, `lead_name`, `lead_employee_id`, `description`, `status`)
VALUES 
    ('Team Ritik', 'TEAM-RITIK', 'Sales', 'Ritik Shukla', 'L2u3UOfMgCKyX7fnuzbn', 'Sales Acquisition & Client Relations Alpha', 'ACTIVE'),
    ('Team Mayur', 'TEAM-MAYUR', 'Sales', 'Mayur Kaskar', 'U4c04DJS9tsBvrL7cbqb', 'Sales Acquisition & Client Relations Beta', 'ACTIVE'),
    ('Team Saif', 'TEAM-SAIF', 'Sales', 'Saif Shaikh', 'hHqB26x8oiEehrpLRs0L', 'Sales Acquisition & Client Relations Gamma', 'ACTIVE'),
    ('Team Viren', 'TEAM-VIREN', 'Sales', 'Viren Gupta', 'DC8ysmuBAfqzI0ZNv3PO', 'Sales Strategic Account Management', 'ACTIVE'),
    ('Team Ajay', 'TEAM-AJAY', 'Sales', 'Ajay Ahire', 'oJ6dWmioDlXoyhZPxcis', 'Sales Territory Group Delta', 'ACTIVE'),
    ('Team Digital', 'TEAM-DIGI', 'Digital', 'Omkar Tapshale', 'RJ5YWsxAdN0TGsRLrJ8F', 'Creative, Tech & Digital Marketing Operations', 'ACTIVE')
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;

-- Automatically assign team_id & team_lead on employees based on manager / team lead
UPDATE `employees` e
JOIN `teams` t ON t.lead_name = e.manager OR t.lead_employee_id = e.manager_id
SET e.team_id = t.id, e.team_name = t.name, e.team_lead_id = t.lead_employee_id, e.team_lead = t.lead_name
WHERE e.role_id = 'EMPLOYEE' AND e.manager IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 9. STRICT 7 CANONICAL ROLES IN ROLES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
    `id` VARCHAR(50) PRIMARY KEY,
    `name` VARCHAR(80) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `permissions` JSON DEFAULT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `name`, `description`, `permissions`, `status`) VALUES
('ADMIN', 'System Administrator', 'Full system configuration, organization structure, audit records, and all administrative governance.', '["*"]', 'ACTIVE'),
('HR', 'Human Resources', 'Employee lifecycle management, company directory, attendance administration, leave approvals, documents and HR reporting.', '["people.*", "attendance.*", "leave.*", "payroll.*", "reports.view", "communication.*", "documents.*"]', 'ACTIVE'),
('OPS', 'Operations Portal', 'Operational workflows, shift management, assigned employee rosters, and workflow monitoring.', '["people.view", "attendance.*", "leave.view", "workflows.*", "reports.view", "team.view", "ess.view"]', 'ACTIVE'),
('COMPLIANCE', 'Compliance Workspace', 'Statutory compliance, legal records, audit documentation, policy reviews, and labor governance.', '["compliance.*", "documents.view", "audit.view", "reports.view", "people.view", "ess.view"]', 'ACTIVE'),
('MANAGER', 'Manager Portal', 'Reporting team oversight, attendance approvals, leave reviews, and team performance visibility.', '["team.*", "attendance.view", "leave.view", "leave.approve", "performance.view", "reports.view", "ess.view"]', 'ACTIVE'),
('TL', 'Team Leader Portal', 'Assigned team attendance tracking, timecards, daily roster execution, and team employee visibility.', '["team.view", "attendance.view", "leave.view", "performance.view", "ess.view"]', 'ACTIVE'),
('EMPLOYEE', 'Employee Self-Service (ESS)', 'Self-service web timecard, live clock, punch logs, leave applications, documents, and personal profile.', '["ess.view", "attendance.punch", "attendance.view", "leave.create", "leave.view", "documents.view"]', 'ACTIVE')
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`),
    `description` = VALUES(`description`),
    `permissions` = VALUES(`permissions`),
    `status` = 'ACTIVE';

SET FOREIGN_KEY_CHECKS = 1;
