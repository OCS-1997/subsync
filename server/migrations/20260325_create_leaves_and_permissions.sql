-- Migration: Create Leaves and Permissions Tables
-- File: 20260325_create_leaves_and_permissions.sql

START TRANSACTION;

-- 1. Leave Types Definition
CREATE TABLE IF NOT EXISTS leave_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    total_days_per_year DECIMAL(5,2) DEFAULT 0.00,
    is_encashable TINYINT(1) DEFAULT 0,
    max_carry_forward DECIMAL(5,2) DEFAULT 0.00,
    min_service_months INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    requires_document_after INT DEFAULT 3 COMMENT 'Require medical certificate after X days',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_leave_type_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL UNIQUE,
    user_id VARCHAR(32) NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days DECIMAL(5,2) NOT NULL,
    half_day_type ENUM('none', 'first_half', 'second_half') DEFAULT 'none',
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    applied_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actioned_by VARCHAR(32) NULL,
    actioned_on TIMESTAMP NULL,
    comments TEXT COMMENT 'Approver/Rejecter comments',
    attachment_url VARCHAR(255) NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (actioned_by) REFERENCES users(username) ON DELETE SET NULL,
    
    INDEX idx_leave_user_date (user_id, start_date),
    INDEX idx_leave_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Leave Balances Tracking
CREATE TABLE IF NOT EXISTS leave_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    leave_type_id INT NOT NULL,
    year INT NOT NULL,
    allocated DECIMAL(5,2) DEFAULT 0.00,
    carried_forward DECIMAL(5,2) DEFAULT 0.00,
    used DECIMAL(5,2) DEFAULT 0.00,
    remaining DECIMAL(5,2) GENERATED ALWAYS AS (allocated + carried_forward - used) STORED,
    encashed DECIMAL(5,2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_leave_year (user_id, leave_type_id, year),
    FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Short-duration Permission Requests
CREATE TABLE IF NOT EXISTS permission_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL UNIQUE,
    user_id VARCHAR(32) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    actioned_by VARCHAR(32) NULL,
    actioned_on TIMESTAMP NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (actioned_by) REFERENCES users(username) ON DELETE SET NULL,
    
    INDEX idx_perm_user_date (user_id, date),
    INDEX idx_perm_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Holidays Calendar
CREATE TABLE IF NOT EXISTS holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    holiday_date DATE NOT NULL,
    description TEXT,
    is_optional TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_holiday_date (holiday_date),
    INDEX idx_holiday_date (holiday_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed default industrial standard leave types
INSERT IGNORE INTO leave_types (name, code, description, total_days_per_year, is_encashable, max_carry_forward) VALUES
('Sick Leave', 'SL', 'Leave for medical reasons', 12.00, 0, 0.00),
('Casual Leave', 'CL', 'Short leave for personal work', 12.00, 0, 0.00),
('Annual Leave', 'AL', 'Earned leave for vacations', 15.00, 1, 30.00),
('Maternity Leave', 'ML', 'Leave for child birth', 180.00, 0, 0.00),
('Paternity Leave', 'PL', 'Leave for new fathers', 15.00, 0, 0.00),
('Compensatory Off', 'COFF', 'Leave in lieu of working on holidays', 0.00, 0, 0.00);

-- Seed some standard holidays for 2024 (Example)
INSERT IGNORE INTO holidays (name, holiday_date, description) VALUES
('New Year Day', '2024-01-01', 'First day of the year'),
('Republic Day', '2024-01-26', 'Republic Day of India'),
('Independence Day', '2024-08-15', 'Independence Day of India'),
('Gandhi Jayanti', '2024-10-02', 'Birthday of Mahatma Gandhi'),
('Christmas', '2024-12-25', 'Christmas Day');

COMMIT;
