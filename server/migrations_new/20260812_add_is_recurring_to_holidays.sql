-- Migration: Add is_recurring to holidays table
-- File: 20260812_add_is_recurring_to_holidays.sql

START TRANSACTION;

ALTER TABLE holidays 
ADD COLUMN IF NOT EXISTS is_recurring TINYINT(1) DEFAULT 0 AFTER is_optional;

-- Mark standard annual fixed holidays as recurring
UPDATE holidays 
SET is_recurring = 1 
WHERE name LIKE '%New Year%' 
   OR name LIKE '%Republic%' 
   OR name LIKE '%Independence%' 
   OR name LIKE '%Gandhi%' 
   OR name LIKE '%Christmas%';

COMMIT;
