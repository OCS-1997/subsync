START TRANSACTION;

-- Remove DCR permissions from role_permissions
DELETE FROM role_permissions 
WHERE permission_id IN (
    SELECT id FROM permissions WHERE resource = 'dcr'
);

-- Remove DCR permissions
DELETE FROM permissions WHERE resource = 'dcr';

-- Drop DCR tables
DROP TABLE IF EXISTS dcr_entries;
DROP TABLE IF EXISTS dcr_categories;

COMMIT;
