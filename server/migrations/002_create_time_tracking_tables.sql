-- Migration: Create Time Tracking Tables
-- File: 002_create_time_tracking_tables.sql
-- Run: Execute in MySQL/MariaDB

CREATE TABLE IF NOT EXISTS time_activity_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    type_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    color VARCHAR(7) DEFAULT '#6b7280',
    icon VARCHAR(50) DEFAULT 'Clock',
    is_billable_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default activity types
INSERT INTO time_activity_types (type_name, type_code, color, icon, display_order) VALUES
('Meeting', 'meeting', '#3b82f6', 'Users', 1),
('Project Work', 'project_work', '#10b981', 'Code', 2),
('Administrative', 'administrative', '#f59e0b', 'FileText', 3),
('Support', 'support', '#8b5cf6', 'HelpCircle', 4),
('Training', 'training', '#06b6d4', 'GraduationCap', 5),
('Break', 'break', '#6b7280', 'Coffee', 6),
('Other', 'other', '#64748b', 'MoreHorizontal', 99)
ON DUPLICATE KEY UPDATE type_name=type_name;

CREATE TABLE IF NOT EXISTS time_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    project_code VARCHAR(50) UNIQUE,
    customer_id VARCHAR(15) NULL,
    team_id INT NULL,
    description TEXT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    estimated_hours DECIMAL(10,2) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(username) ON DELETE SET NULL,
    
    INDEX idx_active (is_active),
    INDEX idx_customer (customer_id),
    INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS time_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entry_id VARCHAR(20) UNIQUE NOT NULL,
    user_id VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    duration_minutes INT NULL,
    is_timer_running BOOLEAN DEFAULT FALSE,
    last_ping_at DATETIME NULL,
    
    activity_type_id INT NOT NULL,
    project_id INT NULL,
    customer_id VARCHAR(15) NULL,
    domain_id VARCHAR(20) NULL,
    opportunity_id VARCHAR(20) NULL,
    team_id INT NULL,
    
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    notes TEXT NULL,
    
    is_billable BOOLEAN DEFAULT FALSE,
    billable_rate DECIMAL(10,2) NULL,
    
    tags JSON NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (activity_type_id) REFERENCES time_activity_types(id),
    FOREIGN KEY (project_id) REFERENCES time_projects(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    
    INDEX idx_user_date (user_id, start_time),
    INDEX idx_activity (activity_type_id),
    INDEX idx_running (is_timer_running),
    INDEX idx_dates (start_time, end_time),
    INDEX idx_customer (customer_id),
    INDEX idx_project (project_id),
    INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
