-- Dashboard RBAC Migration - Clean Slate
-- Drops existing tables and creates fresh dashboard RBAC schema

START TRANSACTION;

-- ============================================
-- STEP 1: Drop existing tables (in correct order)
-- ============================================
DROP TABLE IF EXISTS dashboard_widget_permissions;
DROP TABLE IF EXISTS dashboard_layout_presets;
DROP TABLE IF EXISTS dashboard_layouts;
DROP TABLE IF EXISTS dashboard_widgets;

-- ============================================
-- STEP 2: Create dashboard_tabs table
-- ============================================
CREATE TABLE dashboard_tabs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tab_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    icon VARCHAR(50),
    tab_order INT DEFAULT 0,
    is_enabled TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tab_key (tab_key),
    INDEX idx_tab_order (tab_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 3: Create dashboard_widgets table
-- ============================================
CREATE TABLE dashboard_widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    widget_key VARCHAR(100) NOT NULL UNIQUE,
    tab_key VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    widget_order INT NOT NULL DEFAULT 0,
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_widget_key (widget_key),
    INDEX idx_tab_key (tab_key),
    INDEX idx_enabled (is_enabled),
    CONSTRAINT fk_widget_tab FOREIGN KEY (tab_key) REFERENCES dashboard_tabs(tab_key) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 4: Create dashboard_tab_role_permissions table
-- ============================================
CREATE TABLE dashboard_tab_role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    tab_key VARCHAR(50) NOT NULL,
    is_visible TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_role_tab (role_id, tab_key),
    INDEX idx_role_id (role_id),
    INDEX idx_tab_key (tab_key),
    CONSTRAINT fk_tab_perm_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_tab_perm_tab FOREIGN KEY (tab_key) REFERENCES dashboard_tabs(tab_key) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 5: Create dashboard_widget_role_permissions table
-- ============================================
CREATE TABLE dashboard_widget_role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    widget_key VARCHAR(100) NOT NULL,
    is_visible TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_role_widget (role_id, widget_key),
    INDEX idx_role_id (role_id),
    INDEX idx_widget_key (widget_key),
    CONSTRAINT fk_widget_perm_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_widget_perm_widget FOREIGN KEY (widget_key) REFERENCES dashboard_widgets(widget_key) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 6: Insert default tabs
-- ============================================
INSERT INTO dashboard_tabs (tab_key, name, description, icon, tab_order, is_enabled) VALUES
('overview', 'Overview', 'Main dashboard overview with key metrics', 'LayoutGrid', 1, 1),
('subscriptions', 'Subscriptions', 'Subscription management and renewals', 'Package', 2, 1),
('dcr', 'DCR', 'Daily Call Report tracking', 'Phone', 3, 1),
('opportunities', 'Opportunities', 'Sales pipeline and opportunities', 'Target', 4, 1),
('kb', 'Knowledge Base', 'Knowledge base articles and documentation', 'BookOpen', 5, 1);

-- ============================================
-- STEP 7: Insert default widgets
-- ============================================
-- Overview tab widgets
INSERT INTO dashboard_widgets (widget_key, tab_key, name, description, widget_order) VALUES
('overview_customers', 'overview', 'Customers Count', 'Total customers stat card', 1),
('overview_subscriptions', 'overview', 'Active Subscriptions', 'Active subscriptions stat card', 2),
('overview_revenue', 'overview', 'Revenue', 'Monthly revenue with trend', 3),
('overview_renewals', 'overview', 'Renewals Due', 'Renewals due today stat card', 4),
('overview_renewal_alerts', 'overview', 'Renewal Alerts', 'List of urgent renewals', 5),
('overview_quick_actions', 'overview', 'Quick Actions', 'Quick action buttons', 6),
('overview_expired', 'overview', 'Expired Count', 'Expired subscriptions stat', 7),
('overview_dcr', 'overview', 'Today DCR', 'Today''s DCR count', 8),
('overview_opportunities', 'overview', 'Open Opportunities', 'Open opportunities count', 9),
('overview_kb', 'overview', 'Knowledge Base', 'KB articles count', 10);

-- Subscriptions tab widgets
INSERT INTO dashboard_widgets (widget_key, tab_key, name, description, widget_order) VALUES
('sub_stats', 'subscriptions', 'Subscription Stats', 'Total/Active/Expired/Expiring stats', 1),
('sub_list', 'subscriptions', 'Subscriptions List', 'Expiring and expired subscriptions list', 2),
('sub_distribution', 'subscriptions', 'Status Distribution', 'Pie chart of subscription statuses', 3),
('sub_revenue', 'subscriptions', 'Monthly Revenue', 'Monthly subscription revenue display', 4);

-- DCR tab widgets
INSERT INTO dashboard_widgets (widget_key, tab_key, name, description, widget_order) VALUES
('dcr_today_stats', 'dcr', 'Today''s DCR Stats', 'Today''s DCR count and time', 1),
('dcr_week_stats', 'dcr', 'Weekly DCR Stats', 'This week''s DCR summary', 2),
('dcr_team_stats', 'dcr', 'Team DCR Stats', 'Team performance table (admin only)', 3),
('dcr_activity_chart', 'dcr', 'Daily Activity Chart', 'DCR activity line chart', 4),
('dcr_call_types', 'dcr', 'Call Types Distribution', 'Call types pie chart', 5),
('dcr_summary', 'dcr', 'DCR 30 Day Summary', 'Last 30 days summary stats', 6),
('dcr_top_domains', 'dcr', 'Top Domains', 'Most contacted domains bar chart', 7),
('dcr_quick_actions', 'dcr', 'DCR Quick Actions', 'New DCR and View All buttons', 8);

-- Opportunities tab widgets
INSERT INTO dashboard_widgets (widget_key, tab_key, name, description, widget_order) VALUES
('opp_stats', 'opportunities', 'Opportunity Stats', 'Total/Open/Won/WinRate stats', 1),
('opp_pipeline_value', 'opportunities', 'Pipeline Value', 'Total pipeline value display', 2),
('opp_stage_chart', 'opportunities', 'Pipeline Stages', 'Stage distribution bar chart', 3),
('opp_recent', 'opportunities', 'Recent Opportunities', 'Recent opportunities list', 4),
('opp_quick_actions', 'opportunities', 'Opportunity Quick Actions', 'New opportunity and view all buttons', 5);

-- Knowledge Base tab widgets
INSERT INTO dashboard_widgets (widget_key, tab_key, name, description, widget_order) VALUES
('kb_search', 'kb', 'KB Search', 'Knowledge base search bar', 1),
('kb_categories', 'kb', 'KB Categories', 'Category list/grid', 2),
('kb_recent', 'kb', 'Recent Articles', 'Recently updated articles', 3),
('kb_popular', 'kb', 'Popular Articles', 'Most viewed articles', 4),
('kb_quick_actions', 'kb', 'KB Quick Actions', 'New article button', 5);

-- ============================================
-- STEP 8: Add dashboard.configure permission
-- ============================================
INSERT INTO permissions (permission_key, resource, action, description)
SELECT 'dashboard.configure', 'dashboard', 'configure', 'Configure dashboard tabs and widgets visibility'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_key = 'dashboard.configure');

-- Grant dashboard.configure to admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.permission_key = 'dashboard.configure'
WHERE r.role_key = 'admin';

-- ============================================
-- STEP 9: Set default permissions (all visible for all roles)
-- ============================================
INSERT IGNORE INTO dashboard_tab_role_permissions (role_id, tab_key, is_visible)
SELECT r.id, t.tab_key, 1
FROM roles r
CROSS JOIN dashboard_tabs t;

INSERT IGNORE INTO dashboard_widget_role_permissions (role_id, widget_key, is_visible)
SELECT r.id, w.widget_key, 1
FROM roles r
CROSS JOIN dashboard_widgets w;

COMMIT;
