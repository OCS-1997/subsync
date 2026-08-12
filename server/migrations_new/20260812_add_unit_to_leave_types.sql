-- Migration: Add unit to leave_types (days vs hours)
-- File: 20260812_add_unit_to_leave_types.sql

START TRANSACTION;

ALTER TABLE leave_types 
ADD COLUMN IF NOT EXISTS unit ENUM('days', 'hours') DEFAULT 'days' AFTER total_days_per_year;

UPDATE leave_types 
SET unit = 'hours' 
WHERE code = 'PERM' OR name = 'Permission';

COMMIT;
