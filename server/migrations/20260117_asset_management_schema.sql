-- Asset Management Module Schema Migration
-- Run this migration to create the asset management tables

START TRANSACTION;

-- =============================================
-- Asset Categories
-- =============================================
CREATE TABLE IF NOT EXISTS `asset_categories` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `icon` VARCHAR(50) DEFAULT 'Folder',
    `color` VARCHAR(20) DEFAULT '#3b82f6',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================
-- Asset Types (custom user-defined types)
-- =============================================
CREATE TABLE IF NOT EXISTS `asset_types` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `type_name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `icon` VARCHAR(50) DEFAULT 'Package',
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================
-- Assets (main table)
-- =============================================
CREATE TABLE IF NOT EXISTS `assets` (
    `asset_id` VARCHAR(15) PRIMARY KEY,
    `asset_name` VARCHAR(255) NOT NULL,
    `category_id` INT,
    `type_id` INT,
    `serial_number` VARCHAR(100),
    `model` VARCHAR(150),
    `manufacturer` VARCHAR(150),
    `purchase_date` DATE,
    `purchase_price` DECIMAL(15,2) DEFAULT 0,
    `warranty_expiry` DATE,
    `assigned_to` VARCHAR(32),
    `assigned_date` TIMESTAMP NULL,
    `location` VARCHAR(255),
    `status` ENUM('Active','Inactive','Maintenance','Retired') DEFAULT 'Active',
    `expected_life_years` INT,
    `salvage_value` DECIMAL(15,2) DEFAULT 0,
    `depreciation_method` ENUM('Straight-Line','Declining Balance') DEFAULT 'Straight-Line',
    `notes` TEXT,
    `custom_fields` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_assets_category` FOREIGN KEY (`category_id`) REFERENCES `asset_categories`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_assets_type` FOREIGN KEY (`type_id`) REFERENCES `asset_types`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_assets_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`username`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================
-- Asset History (audit trail)
-- =============================================
CREATE TABLE IF NOT EXISTS `asset_history` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `asset_id` VARCHAR(15) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `changed_by` VARCHAR(32),
    `details` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_asset_history_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`asset_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================
-- Asset Attachments
-- =============================================
CREATE TABLE IF NOT EXISTS `asset_attachments` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `asset_id` VARCHAR(15) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_type` VARCHAR(100),
    `file_size` INT,
    `uploaded_by` VARCHAR(32),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_asset_attachments_asset` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`asset_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX `idx_assets_status` ON `assets`(`status`);
CREATE INDEX `idx_assets_category` ON `assets`(`category_id`);
CREATE INDEX `idx_assets_type` ON `assets`(`type_id`);
CREATE INDEX `idx_assets_assigned` ON `assets`(`assigned_to`);
CREATE INDEX `idx_assets_warranty` ON `assets`(`warranty_expiry`);
CREATE INDEX `idx_assets_purchase_date` ON `assets`(`purchase_date`);
CREATE INDEX `idx_asset_history_asset` ON `asset_history`(`asset_id`);
CREATE INDEX `idx_asset_attachments_asset` ON `asset_attachments`(`asset_id`);

-- =============================================
-- Default Categories
-- =============================================
INSERT INTO `asset_categories` (`name`, `description`, `icon`, `color`) VALUES
('IT Equipment', 'Computers, laptops, servers, and networking equipment', 'Monitor', '#3b82f6'),
('Office Furniture', 'Desks, chairs, cabinets, and other furniture', 'Armchair', '#10b981'),
('Software Licenses', 'Software and application licenses', 'FileCode', '#8b5cf6'),
('Vehicles', 'Company vehicles and transportation assets', 'Car', '#f59e0b'),
('Communication', 'Phones, headsets, and communication devices', 'Phone', '#ec4899');

-- =============================================
-- Default Asset Types
-- =============================================
INSERT INTO `asset_types` (`type_name`, `description`, `icon`) VALUES
('Hardware', 'Physical computer hardware and devices', 'HardDrive'),
('Software', 'Software applications and licenses', 'Package'),
('License', 'Digital licenses and subscriptions', 'Key'),
('Equipment', 'General office and industrial equipment', 'Wrench'),
('Furniture', 'Office furniture and fixtures', 'Armchair'),
('Vehicle', 'Company vehicles', 'Car');

COMMIT;
