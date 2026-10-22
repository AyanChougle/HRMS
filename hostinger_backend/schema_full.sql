-- ==============================================================================
-- DIALLO HRMS ENTERPRISE CLOUD SUITE — COMPLETE MYSQL DATABASE SCHEMA
-- Target Database: u147377699_HRMS (Hostinger MySQL 8.0+)
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. USERS & AUTHENTICATION TABLE
-- Stores login credentials, roles, and account security states
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `uid` VARCHAR(128) UNIQUE NOT NULL,
    `employee_code` VARCHAR(50) DEFAULT NULL,
    `email` VARCHAR(120) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) DEFAULT NULL,
    `display_name` VARCHAR(150) NOT NULL,
    `first_name` VARCHAR(80) DEFAULT NULL,
    `last_name` VARCHAR(80) DEFAULT NULL,
    `phone` VARCHAR(30) DEFAULT NULL,
    `role_id` ENUM(
        'SUPER_ADMIN',
        'HR_MANAGER',
        'MANAGER',
        'OPERATIONS_MANAGER',
        'TEAM_LEAD',
        'MENTOR_TRAINER',
        'TRAINEE',
        'EMPLOYEE'
    ) NOT NULL DEFAULT 'EMPLOYEE',
    `company_id` VARCHAR(80) DEFAULT 'comp_diallo_india',
    `company_name` VARCHAR(150) DEFAULT 'Diallo India Private Limited',
    `branch_id` VARCHAR(80) DEFAULT 'branch_mumbai',
    `branch_name` VARCHAR(150) DEFAULT 'Ghansoli - Navi Mumbai, Maharashtra',
    `department` VARCHAR(100) DEFAULT 'Operations',
    `designation` VARCHAR(100) DEFAULT 'Associate',
    `status` ENUM('ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `last_login_at` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role_id`),
    INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. EMPLOYEES & PERSONNEL MASTER TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employees` (
    `id` VARCHAR(128) PRIMARY KEY,
    `user_id` VARCHAR(128) DEFAULT NULL,
    `employee_code` VARCHAR(50) UNIQUE NOT NULL,
    `first_name` VARCHAR(80) NOT NULL,
    `middle_name` VARCHAR(80) DEFAULT NULL,
    `last_name` VARCHAR(80) NOT NULL,
    `full_name` VARCHAR(160) NOT NULL,
    `email` VARCHAR(120) DEFAULT NULL,
    `work_email` VARCHAR(120) DEFAULT NULL,
    `personal_email` VARCHAR(120) DEFAULT NULL,
    `phone` VARCHAR(30) DEFAULT NULL,
    `profile_photo_url` TEXT DEFAULT NULL,
    `company_id` VARCHAR(80) DEFAULT 'comp_diallo_india',
    `company_name` VARCHAR(150) DEFAULT 'Diallo India Private Limited',
    `branch_id` VARCHAR(80) DEFAULT 'branch_mumbai',
    `branch_name` VARCHAR(150) DEFAULT 'Ghansoli - Navi Mumbai, Maharashtra',
    `location` VARCHAR(150) DEFAULT 'Ghansoli - Navi Mumbai, Maharashtra',
    `department_id` VARCHAR(80) DEFAULT NULL,
    `department` VARCHAR(100) NOT NULL DEFAULT 'Operations',
    `designation_id` VARCHAR(80) DEFAULT NULL,
    `designation` VARCHAR(100) NOT NULL DEFAULT 'Associate',
    `grade_id` VARCHAR(30) DEFAULT 'G2',
    `role_id` VARCHAR(50) DEFAULT 'EMPLOYEE',
    `manager_id` VARCHAR(128) DEFAULT NULL,
    `manager` VARCHAR(150) DEFAULT NULL,
    `mentor` VARCHAR(150) DEFAULT NULL,
    `date_of_joining` DATE DEFAULT NULL,
    `date_of_birth` DATE DEFAULT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') DEFAULT 'PREFER_NOT_TO_SAY',
    `marital_status` ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED') DEFAULT 'SINGLE',
    `blood_group` VARCHAR(10) DEFAULT NULL,
    `emergency_contact_name` VARCHAR(120) DEFAULT NULL,
    `emergency_contact_phone` VARCHAR(30) DEFAULT NULL,
    `emergency_contact_relation` VARCHAR(50) DEFAULT NULL,
    `pan` VARCHAR(30) DEFAULT NULL,
    `aadhar` VARCHAR(30) DEFAULT NULL,
    `uan` VARCHAR(30) DEFAULT NULL,
    `pf_number` VARCHAR(50) DEFAULT NULL,
    `esi_number` VARCHAR(50) DEFAULT NULL,
    `bank_name` VARCHAR(100) DEFAULT NULL,
    `bank_account_number` VARCHAR(50) DEFAULT NULL,
    `bank_ifsc` VARCHAR(30) DEFAULT NULL,
    `bank_branch` VARCHAR(100) DEFAULT NULL,
    `current_address` TEXT DEFAULT NULL,
    `permanent_address` TEXT DEFAULT NULL,
    `employment_status` ENUM('ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'SUSPENDED', 'RESIGNED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    `status` VARCHAR(50) DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_emp_code` (`employee_code`),
    INDEX `idx_emp_dept` (`department`),
    INDEX `idx_emp_manager` (`manager_id`),
    INDEX `idx_emp_status` (`employment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. ATTENDANCE DAILY RECORDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `record_key` VARCHAR(150) UNIQUE DEFAULT NULL, -- e.g. EMP123_2026-10-22
    `employee_id` VARCHAR(128) NOT NULL,
    `employee_code` VARCHAR(50) NOT NULL,
    `employee_name` VARCHAR(150) NOT NULL,
    `company_id` VARCHAR(80) DEFAULT 'comp_diallo_india',
    `branch_name` VARCHAR(150) DEFAULT 'Ghansoli - Navi Mumbai, Maharashtra',
    `department` VARCHAR(100) DEFAULT 'Operations',
    `manager_id` VARCHAR(128) DEFAULT NULL,
    `manager` VARCHAR(150) DEFAULT NULL,
    `date` DATE NOT NULL,
    `check_in` VARCHAR(20) DEFAULT NULL,
    `check_out` VARCHAR(20) DEFAULT NULL,
    `check_in_iso` DATETIME DEFAULT NULL,
    `check_out_iso` DATETIME DEFAULT NULL,
    `status` ENUM('PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'WEEKLY_OFF', 'HOLIDAY', 'ON_BREAK') NOT NULL DEFAULT 'PRESENT',
    `late_minutes` INT DEFAULT 0,
    `gross_minutes` INT DEFAULT 0,
    `gross_hours_formatted` VARCHAR(30) DEFAULT '0h 00m',
    `total_break_seconds` INT DEFAULT 0,
    `total_break_minutes` INT DEFAULT 0,
    `break_formatted` VARCHAR(30) DEFAULT '0h 00m',
    `is_on_break` TINYINT(1) DEFAULT 0,
    `last_break_start_iso` DATETIME DEFAULT NULL,
    `last_break_end_iso` DATETIME DEFAULT NULL,
    `location` TEXT DEFAULT NULL,
    `latitude` DECIMAL(10, 8) DEFAULT NULL,
    `longitude` DECIMAL(11, 8) DEFAULT NULL,
    `distance_meters` DECIMAL(10, 2) DEFAULT NULL,
    `device` VARCHAR(100) DEFAULT 'Web Attendance Terminal',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_att_emp_date` (`employee_id`, `date`),
    INDEX `idx_att_date` (`date`),
    INDEX `idx_att_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. ATTENDANCE PUNCH AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `punch_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` VARCHAR(128) NOT NULL,
    `punch_type` VARCHAR(50) NOT NULL, -- 'In', 'Out', 'Break In', 'Break Out'
    `time` VARCHAR(30) NOT NULL,
    `date` DATE NOT NULL,
    `status` VARCHAR(50) DEFAULT 'Logged',
    `location` TEXT DEFAULT NULL,
    `latitude` DECIMAL(10, 8) DEFAULT NULL,
    `longitude` DECIMAL(11, 8) DEFAULT NULL,
    `distance_meters` DECIMAL(10, 2) DEFAULT NULL,
    `device` VARCHAR(100) DEFAULT 'ESS Web Terminal',
    `break_duration` INT DEFAULT 0,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_punch_emp` (`employee_id`),
    INDEX `idx_punch_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. LEAVE APPLICATIONS & BALANCES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `leave_applications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` VARCHAR(128) NOT NULL,
    `employee_code` VARCHAR(50) DEFAULT NULL,
    `employee_name` VARCHAR(150) NOT NULL,
    `department` VARCHAR(100) DEFAULT NULL,
    `leave_type` VARCHAR(50) NOT NULL, -- Casual Leave, Sick Leave, Earned Leave
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `days_count` DECIMAL(4, 1) NOT NULL DEFAULT 1.0,
    `is_half_day` TINYINT(1) DEFAULT 0,
    `half_day_type` VARCHAR(20) DEFAULT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `approved_by_id` VARCHAR(128) DEFAULT NULL,
    `approved_by_name` VARCHAR(150) DEFAULT NULL,
    `rejection_reason` TEXT DEFAULT NULL,
    `reviewed_at` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_leave_emp` (`employee_id`),
    INDEX `idx_leave_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leave_balances` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` VARCHAR(128) NOT NULL,
    `leave_type` VARCHAR(50) NOT NULL,
    `year` INT NOT NULL,
    `total_credited` DECIMAL(5, 1) NOT NULL DEFAULT 12.0,
    `used` DECIMAL(5, 1) NOT NULL DEFAULT 0.0,
    `available` DECIMAL(5, 1) NOT NULL DEFAULT 12.0,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_emp_leave_year` (`employee_id`, `leave_type`, `year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. DEPARTMENTS, BRANCHES & ORGANIZATION CONFIG
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) UNIQUE NOT NULL,
    `code` VARCHAR(30) DEFAULT NULL,
    `head_employee_id` VARCHAR(128) DEFAULT NULL,
    `head_name` VARCHAR(150) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `branches` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(50) UNIQUE DEFAULT NULL,
    `address` TEXT NOT NULL,
    `city` VARCHAR(80) DEFAULT 'Navi Mumbai',
    `state` VARCHAR(80) DEFAULT 'Maharashtra',
    `is_hq` TINYINT(1) DEFAULT 0,
    `latitude` DECIMAL(10, 8) DEFAULT 19.075975,
    `longitude` DECIMAL(11, 8) DEFAULT 72.87738,
    `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. EXPENSES & CLAIMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` VARCHAR(128) NOT NULL,
    `employee_name` VARCHAR(150) NOT NULL,
    `category` VARCHAR(80) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) DEFAULT 'INR',
    `expense_date` DATE NOT NULL,
    `merchant` VARCHAR(150) DEFAULT NULL,
    `description` TEXT NOT NULL,
    `receipt_url` TEXT DEFAULT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID') NOT NULL DEFAULT 'SUBMITTED',
    `approved_by_name` VARCHAR(150) DEFAULT NULL,
    `rejection_reason` TEXT DEFAULT NULL,
    `settled_at` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_exp_emp` (`employee_id`),
    INDEX `idx_exp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. IT ASSETS MANAGEMENT TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `asset_tag` VARCHAR(50) UNIQUE NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `category` VARCHAR(80) NOT NULL, -- Laptop, Monitor, Keyboard, SIM, Mobile
    `model` VARCHAR(120) DEFAULT NULL,
    `serial_number` VARCHAR(100) DEFAULT NULL,
    `purchase_date` DATE DEFAULT NULL,
    `status` ENUM('AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED') NOT NULL DEFAULT 'AVAILABLE',
    `assigned_employee_id` VARCHAR(128) DEFAULT NULL,
    `assigned_employee_name` VARCHAR(150) DEFAULT NULL,
    `assigned_date` DATE DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_asset_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. 7-DAY TRAINING CURRICULUM PROGRESS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `training_progress` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` VARCHAR(128) UNIQUE NOT NULL,
    `employee_name` VARCHAR(150) NOT NULL,
    `mentor_name` VARCHAR(150) DEFAULT NULL,
    `current_day` INT DEFAULT 1,
    `day1_status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'IN_PROGRESS',
    `day2_status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
    `day3_status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
    `day4_status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
    `day5_status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
    `day6_status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
    `day7_status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
    `certified_at` DATETIME DEFAULT NULL,
    `certificate_url` TEXT DEFAULT NULL,
    `status` ENUM('IN_TRAINING', 'CERTIFIED', 'DROPPED') DEFAULT 'IN_TRAINING',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. RECRUITMENT & CANDIDATE PIPELINE TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `candidates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(30) DEFAULT NULL,
    `applied_role` VARCHAR(100) NOT NULL,
    `department` VARCHAR(100) DEFAULT 'Operations',
    `experience_years` DECIMAL(3, 1) DEFAULT 0.0,
    `current_stage` ENUM('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED') DEFAULT 'APPLIED',
    `resume_url` TEXT DEFAULT NULL,
    `rating` INT DEFAULT 0,
    `notes` TEXT DEFAULT NULL,
    `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. AUDIT LOGS & SYSTEM CONFIGURATION TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `operation_id` VARCHAR(100) DEFAULT NULL,
    `actor_user_id` VARCHAR(128) DEFAULT NULL,
    `actor_email` VARCHAR(120) DEFAULT NULL,
    `actor_name` VARCHAR(150) DEFAULT NULL,
    `actor_role` VARCHAR(50) DEFAULT NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource_type` VARCHAR(80) NOT NULL,
    `resource_id` VARCHAR(128) DEFAULT NULL,
    `severity` ENUM('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'INFO',
    `result` ENUM('SUCCESS', 'FAILED', 'DENIED') DEFAULT 'SUCCESS',
    `metadata_json` LONGTEXT DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_actor` (`actor_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_config` (
    `config_key` VARCHAR(100) PRIMARY KEY,
    `config_value` LONGTEXT NOT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- SEED INITIAL DATA: Standard Departments & Super Admin Profile
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO `departments` (`name`, `code`, `description`) VALUES
('Digital Team', 'DIGITAL', 'Digital Marketing, Media, & Lead Operations'),
('Operations', 'OPS', 'Core Day-to-Day Operations & Roster Execution'),
('Sales', 'SALES', 'Business Development & Client Acquisition'),
('Real Estate', 'REAL_ESTATE', 'Property Brokerage, Leasing & Portfolio'),
('Car Rental', 'CAR_RENTAL', 'Fleet Operations, Logistics & Dispatch'),
('Compliance', 'COMPLIANCE', 'Statutory, Legal, Labor & Governance'),
('Training', 'TRAINING', 'New Hire Onboarding & 7-Day Curriculum'),
('Human Resources', 'HR', 'People Operations, Attendance, Leave & Payroll');

INSERT IGNORE INTO `branches` (`name`, `code`, `address`, `city`, `state`, `is_hq`, `latitude`, `longitude`) VALUES
('HQ - Navi Mumbai', 'HQ_MUMBAI', 'Ghansoli, Navi Mumbai, Maharashtra 400701', 'Navi Mumbai', 'Maharashtra', 1, 19.075975, 72.87738);

-- Default Super Admin account seed (Password: Diallo@2026)
INSERT IGNORE INTO `users` (`uid`, `employee_code`, `email`, `password_hash`, `display_name`, `first_name`, `last_name`, `role_id`, `department`, `designation`, `status`) VALUES
('super_admin_ayan', 'D00001', 'ayanislight@gmail.com', '$2y$10$wZk0oZ7u5Zc9WfIu8U3G8uL8G5P1lK2pQ0Z9Y8X7V6U5T4S3R2Q1P', 'Ayan', 'Ayan', 'Admin', 'SUPER_ADMIN', 'Human Resources', 'Super Administrator', 'ACTIVE');

SET FOREIGN_KEY_CHECKS = 1;
