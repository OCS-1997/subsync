-- Dashboard Time Tracking Integration Migration
-- Simplified version - ignores duplicate errors
-- Run: Execute in MySQL/MariaDB after 20260114_dashboard_rbac.sql

START TRANSACTION;

-- ============================================
-- STEP 1: Add Time Tracking tab (ignore if exists)
-- ============================================
INSERT IGNORE INTO dashboard_tabs (tab_key, name, description, icon, tab_order, is_enabled) 
VALUES ('time_tracking', 'Time Tracking', 'Time tracking analytics and productivity metrics', 'Clock', 6, 1);

-- ============================================
-- STEP 2: Add Time Tracking widgets (ignore if exist)
-- ============================================
INSERT IGNORE INTO dashboard_widgets (widget_key, tab_key, name, description, widget_order) VALUES
('time_today_stats', 'time_tracking', 'Today''s Time', 'Current day tracked time summary', 1),
('time_week_stats', 'time_tracking', 'Weekly Summary', 'This week''s time tracking overview', 2),
('time_activity_breakdown', 'time_tracking', 'Activity Breakdown', 'Time distribution by activity type', 3),
('time_productivity_trend', 'time_tracking', 'Productivity Trend', '7-day productivity trend chart', 4),
('time_project_distribution', 'time_tracking', 'Project Distribution', 'Time allocation across different projects', 5),
('time_client_summary', 'time_tracking', 'Client Summary', 'Time distribution per client/customer', 6),
('time_team_overview', 'time_tracking', 'Team Overview', 'Team-level time tracking summary (admin only)', 7),
('time_user_rankings', 'time_tracking', 'Top Performers', 'User rankings by tracked hours (admin only)', 8);

-- ============================================
-- STEP 3: Set default permissions for all roles (ignore duplicates)
-- ============================================
INSERT IGNORE INTO dashboard_tab_role_permissions (role_id, tab_key, is_visible)
SELECT r.id, 'time_tracking', 1
FROM roles r;

INSERT IGNORE INTO dashboard_widget_role_permissions (role_id, widget_key, is_visible)
SELECT r.id, w.widget_key, 1
FROM roles r
CROSS JOIN dashboard_widgets w
WHERE w.tab_key = 'time_tracking';

COMMIT;

-- ============================================
-- STEP 4: Add indexes (run separately if needed)
-- Note: If indexes already exist, these will fail but won't affect the data
-- You can run this in a separate transaction or skip if errors occur
-- ============================================

-- Ignore errors for these - they're optional optimizations
-- Copy and run manually if the above succeeds:

-- ALTER TABLE time_entries ADD INDEX idx_time_user_active (user_id, deleted_at, start_time);
-- ALTER TABLE time_entries ADD INDEX idx_time_team_active (team_id, deleted_at, start_time);
-- ALTER TABLE time_entries ADD INDEX idx_time_activity_period (activity_type_id, start_time, deleted_at);
-- ALTER TABLE time_entries ADD INDEX idx_time_user_daterange (user_id, start_time, end_time, deleted_at);
-- ALTER TABLE time_entries ADD INDEX idx_time_active_entries (deleted_at, start_time, end_time);
