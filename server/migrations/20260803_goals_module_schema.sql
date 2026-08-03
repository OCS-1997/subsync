-- Goals Management Schema Migration
-- Timestamp: 2026-08-03

CREATE TABLE IF NOT EXISTS `goal_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `is_deleted` TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `goal_business_impacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `impact_id` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `is_deleted` TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `goal_statuses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status_id` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `badge_color` VARCHAR(50) DEFAULT '#64748b',
  `icon` VARCHAR(50) DEFAULT 'Circle',
  `is_completed_status` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_default` TINYINT(1) DEFAULT 0,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `is_deleted` TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `goals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `goal_id` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `category_id` VARCHAR(50) NOT NULL,
  `business_impact_id` VARCHAR(50) NOT NULL,
  `quarter` ENUM('Q1', 'Q2', 'Q3', 'Q4') NOT NULL,
  `financial_year` VARCHAR(20) NOT NULL,
  `target_date` DATE NOT NULL,
  `status_id` VARCHAR(50) NOT NULL,
  `progress` INT DEFAULT 0,
  `priority` ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
  `remarks` TEXT DEFAULT NULL,
  `created_by` VARCHAR(100) NOT NULL,
  `updated_by` VARCHAR(100) DEFAULT NULL,
  `deleted_by` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `is_deleted` TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `goal_owners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `goal_id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_goal_id` (`goal_id`),
  KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `goal_activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `goal_id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `field_name` VARCHAR(100) DEFAULT NULL,
  `old_value` TEXT DEFAULT NULL,
  `new_value` TEXT DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_goal_act_goal_id` (`goal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `goal_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attachment_id` VARCHAR(50) NOT NULL UNIQUE,
  `goal_id` VARCHAR(50) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` INT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `uploaded_by` VARCHAR(100) NOT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) DEFAULT 0,
  KEY `idx_goal_att_goal_id` (`goal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `goal_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `comment_id` VARCHAR(50) NOT NULL UNIQUE,
  `goal_id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) DEFAULT 0,
  KEY `idx_goal_comm_goal_id` (`goal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Goal Categories
INSERT IGNORE INTO `goal_categories` (`category_id`, `name`, `description`, `display_order`) VALUES
('CAT_SALES', 'Sales', 'Sales targets and business development goals', 1),
('CAT_MKTG', 'Marketing', 'Marketing campaigns and brand initiatives', 2),
('CAT_DIG_MKTG', 'Digital Marketing', 'SEO, social media, online advertising, and digital presence', 3),
('CAT_SUPP', 'Customer Support', 'Support ticket SLAs, customer satisfaction, and desk ops', 4),
('CAT_DEV', 'Development', 'Software engineering, features, product delivery, and bug fixes', 5),
('CAT_HOSTING', 'Hosting', 'Infrastructure, server uptime, cloud performance, and hosting ops', 6),
('CAT_GWORKSPACE', 'Google Workspace', 'Google Workspace migration, security, and administration', 7),
('CAT_MS365', 'Microsoft 365', 'M365 integration, licensing, security, and administration', 8),
('CAT_AI_AUTO', 'AI & Automation', 'AI integrations, process automation, and workflow bots', 9),
('CAT_OPS', 'Operations', 'Core business processes and operational excellence', 10),
('CAT_FINANCE', 'Finance', 'Financial management, budgeting, and billing efficiency', 11),
('CAT_HR', 'HR', 'Human resources, hiring, employee retention, and culture', 12),
('CAT_LEARN_CERT', 'Learning & Certification', 'Skill acquisition, certifications, and internal training', 13),
('CAT_INT_PROJ', 'Internal Project', 'Internal tool building and process revamp', 14),
('CAT_COMPLIANCE', 'Compliance', 'Regulatory, data privacy, and legal compliance', 15);

-- Seed Default Business Impacts
INSERT IGNORE INTO `goal_business_impacts` (`impact_id`, `name`, `description`, `display_order`) VALUES
('IMP_REV_GROWTH', 'Revenue Growth', 'Directly impacts top-line revenue and sales growth', 1),
('IMP_CUST_ACQ', 'Customer Acquisition', 'Drives new client onboarding and expansion', 2),
('IMP_CUST_RET', 'Customer Retention', 'Reduces churn and improves account renewal rates', 3),
('IMP_CUST_EXP', 'Customer Experience', 'Enhances client satisfaction and service quality', 4),
('IMP_OPS_EFF', 'Operational Efficiency', 'Optimizes workflows and reduces operational friction', 5),
('IMP_COST_OPT', 'Cost Optimization', 'Reduces expenditure and optimizes resource usage', 6),
('IMP_QUAL_IMP', 'Quality Improvement', 'Increases standards, accuracy, and product durability', 7),
('IMP_COMPLIANCE', 'Compliance', 'Ensures alignment with industry regulations and standards', 8),
('IMP_RISK_RED', 'Risk Reduction', 'Mitigates technical, security, or financial risks', 9),
('IMP_BRAND_BLDG', 'Brand Building', 'Strengthens market reputation and brand visibility', 10),
('IMP_SKILL_DEV', 'Skill Development', 'Up-skills staff and enhances team competencies', 11),
('IMP_INNO_AUTO', 'Innovation & Automation', 'Fosters innovation and automates repetitive tasks', 12);

-- Seed Default Goal Statuses
INSERT IGNORE INTO `goal_statuses` (`status_id`, `name`, `code`, `description`, `badge_color`, `icon`, `is_completed_status`, `is_default`, `display_order`) VALUES
('STAT_NOT_STARTED', 'Not Started', 'not_started', 'Goal defined but work has not commenced', '#64748b', 'Clock', 0, 1, 1),
('STAT_IN_PROGRESS', 'In Progress', 'in_progress', 'Actively being worked on by the assigned owners', '#3b82f6', 'PlayCircle', 0, 0, 2),
('STAT_ON_HOLD', 'On Hold', 'on_hold', 'Temporarily paused due to dependencies or priority shift', '#f59e0b', 'PauseCircle', 0, 0, 3),
('STAT_COMPLETED', 'Completed', 'completed', 'Goal successfully achieved and target fulfilled', '#10b981', 'CheckCircle2', 1, 0, 4),
('STAT_AT_RISK', 'At Risk', 'at_risk', 'Goal is behind schedule or facing critical blockers', '#ef4444', 'AlertTriangle', 0, 0, 5),
('STAT_CANCELLED', 'Cancelled', 'cancelled', 'Goal discontinued or invalidated', '#94a3b8', 'XCircle', 0, 0, 6);
