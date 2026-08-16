-- Migration: Add unit to leave_types (days vs hours)
SET @dbname = DATABASE();
SET @tablename = 'leave_types';
SET @columnname = 'unit';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  "ALTER TABLE leave_types ADD COLUMN unit ENUM('days', 'hours') DEFAULT 'days' AFTER total_days_per_year"
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

UPDATE leave_types 
SET unit = 'hours' 
WHERE code = 'PERM' OR name = 'Permission';
