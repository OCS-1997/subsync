START TRANSACTION;

-- Create opportunity_statuses table
CREATE TABLE IF NOT EXISTS `opportunity_statuses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status_name` VARCHAR(50) NOT NULL UNIQUE,
  `status_color` VARCHAR(20) DEFAULT '#3b82f6', -- Default blue-500
  `description` TEXT,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default statuses
INSERT IGNORE INTO `opportunity_statuses` (`status_name`, `status_color`, `sort_order`) VALUES
('Proposal Sent', '#3b82f6', 1),
('in Progress', '#3b82f6', 2),
('Demo Provided', '#3b82f6', 3),
('Closed / Won', '#22c55e', 4), -- green-500
('Closed / Lost', '#ef4444', 5), -- red-500
('Pending Client', '#f59e0b', 6), -- amber-500
('Pending OCS', '#6366f1', 7), -- indigo-500
('Completed', '#10b981', 8), -- emerald-500
('Dropped', '#6b7280', 9), -- gray-500
('Evaluation Requirements', '#8b5cf6', 10); -- violet-500

-- Create opportunities table
CREATE TABLE IF NOT EXISTS `opportunities` (
  `opportunity_id` VARCHAR(15) PRIMARY KEY,
  `opportunity_date` DATE NOT NULL,
  `customer_id` VARCHAR(15) NOT NULL,
  `contact_person_id` INT NULL, -- Can be null if selecting existing but no contact or new customer initially
  `opportunity_type` ENUM('New', 'Existing') NOT NULL DEFAULT 'Existing',
  `referred_by` VARCHAR(255) DEFAULT NULL,
  `domain` VARCHAR(255) DEFAULT NULL,
  `owner` VARCHAR(32) NOT NULL, -- references users.username
  `product_services` TEXT NOT NULL,
  `last_contacted_at` DATE DEFAULT NULL,
  `status_id` INT NOT NULL,
  `remarks` TEXT,
  `opportunity_value` DECIMAL(15, 2) DEFAULT 0.00,
  `is_deleted` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_opp_customer` (`customer_id`),
  INDEX `idx_opp_status` (`status_id`),
  INDEX `idx_opp_owner` (`owner`),
  INDEX `idx_opp_date` (`opportunity_date`),
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  FOREIGN KEY (`status_id`) REFERENCES `opportunity_statuses` (`id`),
  FOREIGN KEY (`owner`) REFERENCES `users` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
