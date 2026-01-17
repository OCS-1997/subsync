-- Asset Management Dashboard Tab Migration
-- Adds Assets tab and widgets to dashboard RBAC system

START TRANSACTION;

-- ============================================
-- STEP 1: Insert Assets tab
-- ============================================
INSERT INTO dashboard_tabs (tab_key, name, description, icon, tab_order, is_enabled) 
SELECT 'assets', 'Assets', 'Asset management and tracking', 'HardDrive', 6, 1
WHERE NOT EXISTS (SELECT 1 FROM dashboard_tabs WHERE tab_key = 'assets');

-- ============================================
-- STEP 2: Insert Assets tab widgets
-- ============================================
INSERT INTO dashboard_widgets (widget_key, tab_key, name, description, widget_order) 
SELECT 'assets_total', 'assets', 'Total Assets', 'Total assets count stat card', 1
WHERE NOT EXISTS (SELECT 1 FROM dashboard_widgets WHERE widget_key = 'assets_total')
UNION ALL
SELECT 'assets_active', 'assets', 'Active Assets', 'Active assets count stat card', 2
WHERE NOT EXISTS (SELECT 1 FROM dashboard_widgets WHERE widget_key = 'assets_active')
UNION ALL
SELECT 'assets_maintenance', 'assets', 'In Maintenance', 'Assets in maintenance count', 3
WHERE NOT EXISTS (SELECT 1 FROM dashboard_widgets WHERE widget_key = 'assets_maintenance')
UNION ALL
SELECT 'assets_warranty', 'assets', 'Warranty Expiring', 'Assets with warranty expiring in 30 days', 4
WHERE NOT EXISTS (SELECT 1 FROM dashboard_widgets WHERE widget_key = 'assets_warranty')
UNION ALL
SELECT 'assets_value', 'assets', 'Total Asset Value', 'Total value of all assets', 5
WHERE NOT EXISTS (SELECT 1 FROM dashboard_widgets WHERE widget_key = 'assets_value')
UNION ALL
SELECT 'assets_book_value', 'assets', 'Current Book Value', 'Depreciated book value of assets', 6
WHERE NOT EXISTS (SELECT 1 FROM dashboard_widgets WHERE widget_key = 'assets_book_value')
UNION ALL
SELECT 'assets_by_category', 'assets', 'Assets by Category', 'Pie chart of assets by category', 7
WHERE NOT EXISTS (SELECT 1 FROM dashboard_widgets WHERE widget_key = 'assets_by_category')
UNION ALL
SELECT 'assets_recent_assignments', 'assets', 'Recent Assignments', 'Recently assigned assets list', 8
WHERE NOT EXISTS (SELECT 1 FROM dashboard_widgets WHERE widget_key = 'assets_recent_assignments')
UNION ALL
SELECT 'assets_quick_actions', 'assets', 'Asset Quick Actions', 'Add asset and view all buttons', 9
WHERE NOT EXISTS (SELECT 1 FROM dashboard_widgets WHERE widget_key = 'assets_quick_actions');

-- ============================================
-- STEP 3: Set default tab permissions (visible for all roles)
-- ============================================
INSERT IGNORE INTO dashboard_tab_role_permissions (role_id, tab_key, is_visible)
SELECT r.id, 'assets', 1
FROM roles r;

-- ============================================
-- STEP 4: Set default widget permissions (visible for all roles)
-- ============================================
INSERT IGNORE INTO dashboard_widget_role_permissions (role_id, widget_key, is_visible)
SELECT r.id, w.widget_key, 1
FROM roles r
CROSS JOIN dashboard_widgets w
WHERE w.tab_key = 'assets';

COMMIT;
