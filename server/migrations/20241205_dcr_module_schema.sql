START TRANSACTION;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- Alter table domains utf8mb4_unicode_ci compatible
ALTER TABLE domains 
CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE domain_name_servers
CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

-- Create contacts table (minimal for DCR integration)
CREATE TABLE IF NOT EXISTS contacts (
    contact_id VARCHAR(15) PRIMARY KEY,
    domain_id VARCHAR(15) NULL,
    domain_free_text VARCHAR(255) NULL,
    company_name VARCHAR(255) NULL,
    salutation ENUM('Mr.', 'Ms.', 'Mrs.', 'Dr.') NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NULL,
    email VARCHAR(255) NULL,
    country_code VARCHAR(5) DEFAULT '+91',
    phone_number VARCHAR(15) NULL,
    designation VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_domain_id (domain_id),
    INDEX idx_email (email),
    FOREIGN KEY (domain_id) REFERENCES domains(domain_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dcr_entries table
CREATE TABLE IF NOT EXISTS dcr_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    timestamp DATETIME NOT NULL,
    call_type ENUM('incoming', 'outgoing', 'follow-up') NOT NULL DEFAULT 'incoming',
    time_spent_minutes INT NOT NULL,
    domain_id VARCHAR(15) NULL,
    domain_free_text VARCHAR(255) NULL,
    company_name VARCHAR(255) NULL,
    contact_name VARCHAR(255) NULL,
    contact_phone_country_code VARCHAR(5) NULL,
    contact_phone_number VARCHAR(15) NULL,
    contact_email VARCHAR(255) NULL,
    contact_id VARCHAR(15) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_domain_id (domain_id),
    INDEX idx_contact_id (contact_id),
    FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (domain_id) REFERENCES domains(domain_id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(contact_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

COMMIT;


