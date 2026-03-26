-- Migration: Add Permission Leave Type
-- File: 20260326_add_permission_leave_type.sql

START TRANSACTION;

-- Add Permission leave type if it doesn't exist
INSERT IGNORE INTO leave_types (name, code, description, total_days_per_year, is_encashable, max_carry_forward) 
VALUES ('Permission', 'PERM', 'Short duration permission (tracked in hours)', 24.00, 0, 0.00);

-- Initialize balance for all existing users for 2026
INSERT IGNORE INTO leave_balances (user_id, leave_type_id, year, allocated)
SELECT u.username, lt.id, 2026, lt.total_days_per_year
FROM users u
CROSS JOIN leave_types lt
WHERE lt.code = 'PERM';

COMMIT;
