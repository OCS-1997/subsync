-- Migration: Drop Leaves and Permissions Tables (Reference for deletion)
-- File: 20260325_drop_leaves_and_permissions.sql

START TRANSACTION;

-- Remove RBAC links first
SET @resource_ids = (SELECT GROUP_CONCAT(id) FROM permissions WHERE resource IN ('leaves', 'permissions', 'holidays'));
IF @resource_ids IS NOT NULL THEN
    SET @del_stmt = CONCAT('DELETE FROM role_permissions WHERE permission_id IN (', @resource_ids, ')');
    PREPARE stmt FROM @del_stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    DELETE FROM permissions WHERE resource IN ('leaves', 'permissions', 'holidays');
END IF;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS holidays;
DROP TABLE IF EXISTS permission_requests;
DROP TABLE IF EXISTS leave_balances;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS leave_types;

COMMIT;
