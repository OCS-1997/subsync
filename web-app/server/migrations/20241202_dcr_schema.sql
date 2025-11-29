START TRANSACTION;

ALTER TABLE users
    CONVERT TO CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Create dcr_entries table
CREATE TABLE IF NOT EXISTS dcr_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    timestamp_date DATE AS (DATE(timestamp)) STORED,
    company VARCHAR(255),
    domain VARCHAR(255),
    contact_person VARCHAR(255),
    call_type ENUM('Inbound', 'Outbound') NOT NULL DEFAULT 'Inbound',
    category VARCHAR(50) NOT NULL,
    contact_number VARCHAR(20),
    description TEXT,
    time_spent_minutes INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dcr_timestamp (timestamp),
    INDEX idx_dcr_user_id (user_id),
    INDEX idx_dcr_domain (domain),
    INDEX idx_dcr_category (category),
    INDEX idx_dcr_date (timestamp_date),
    CONSTRAINT fk_dcr_user FOREIGN KEY (user_id) REFERENCES users(username) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create dcr_categories table (optional seed data)
CREATE TABLE IF NOT EXISTS dcr_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT INTO dcr_categories (name)
SELECT 'Domain' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'Domain')
UNION ALL
SELECT 'Email Issue' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'Email Issue')
UNION ALL
SELECT 'GWS' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'GWS')
UNION ALL
SELECT 'M365' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'M365')
UNION ALL
SELECT 'SSL' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'SSL')
UNION ALL
SELECT 'Hosting' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'Hosting')
UNION ALL
SELECT 'Cloud Hosting' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'Cloud Hosting')
UNION ALL
SELECT 'Website' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'Website')
UNION ALL
SELECT 'Payments' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'Payments')
UNION ALL
SELECT 'Renewal Followup' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'Renewal Followup')
UNION ALL
SELECT 'Digital Marketing' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'Digital Marketing')
UNION ALL
SELECT 'Enquiry' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'Enquiry')
UNION ALL
SELECT 'Others' WHERE NOT EXISTS (SELECT 1 FROM dcr_categories WHERE name = 'Others');

COMMIT;

