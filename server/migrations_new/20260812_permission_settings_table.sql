-- Migration: Create permission_settings table
-- File: 20260812_permission_settings_table.sql

START TRANSACTION;

CREATE TABLE IF NOT EXISTS permission_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    yearly_hours_quota DECIMAL(5,2) DEFAULT 24.00,
    monthly_hours_quota DECIMAL(5,2) DEFAULT 4.00,
    max_hours_per_request DECIMAL(5,2) DEFAULT 2.00,
    max_requests_per_month INT DEFAULT 2,
    is_active TINYINT(1) DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert default row if table is empty
INSERT INTO permission_settings (id, yearly_hours_quota, monthly_hours_quota, max_hours_per_request, max_requests_per_month, is_active)
SELECT 1, 24.00, 4.00, 2.00, 2, 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM permission_settings WHERE id = 1);

COMMIT;
