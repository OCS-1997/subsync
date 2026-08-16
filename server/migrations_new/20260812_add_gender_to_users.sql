-- Migration: Add gender column to users table if not exists
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'gender';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  "ALTER TABLE users ADD COLUMN gender ENUM('male', 'female', 'other') DEFAULT 'other' AFTER email"
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
