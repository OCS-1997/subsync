-- Migration: Add is_recurring to holidays table
SET @dbname = DATABASE();
SET @tablename = 'holidays';
SET @columnname = 'is_recurring';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE holidays ADD COLUMN is_recurring TINYINT(1) DEFAULT 0 AFTER is_optional'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

UPDATE holidays 
SET is_recurring = 1 
WHERE name LIKE '%New Year%' 
   OR name LIKE '%Republic%' 
   OR name LIKE '%Independence%' 
   OR name LIKE '%Gandhi%' 
   OR name LIKE '%Christmas%';
