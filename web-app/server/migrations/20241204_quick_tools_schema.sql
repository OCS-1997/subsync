START TRANSACTION;

-- Create quick_tools table
CREATE TABLE IF NOT EXISTS quick_tools (
    tool_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url_template VARCHAR(500) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    roles_allowed JSON NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quick_tools_active (is_active),
    INDEX idx_quick_tools_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default tools
INSERT INTO quick_tools (name, url_template, icon, roles_allowed, is_active, sort_order)
SELECT 'DNS Checker', 'https://dnschecker.org/#A/{{domain}}', 'fa-globe', JSON_ARRAY('admin', 'manager', 'sales', 'support', 'viewer'), 1, 1
WHERE NOT EXISTS (SELECT 1 FROM quick_tools WHERE name = 'DNS Checker')
UNION ALL
SELECT 'Google Toolbox', 'https://toolbox.googleapps.com/apps/dig/#A/{{domain}}', 'fa-google', JSON_ARRAY('admin', 'manager', 'sales', 'support', 'viewer'), 1, 2
WHERE NOT EXISTS (SELECT 1 FROM quick_tools WHERE name = 'Google Toolbox')
UNION ALL
SELECT 'MXToolbox MX', 'https://mxtoolbox.com/SuperTool.aspx?action=mx:{{domain}}', 'fa-envelope', JSON_ARRAY('admin', 'manager', 'sales', 'support', 'viewer'), 1, 3
WHERE NOT EXISTS (SELECT 1 FROM quick_tools WHERE name = 'MXToolbox MX')
UNION ALL
SELECT 'Whois Lookup', 'https://who.is/whois/{{domain}}', 'fa-search', JSON_ARRAY('admin', 'manager', 'sales', 'support', 'viewer'), 1, 4
WHERE NOT EXISTS (SELECT 1 FROM quick_tools WHERE name = 'Whois Lookup')
UNION ALL
SELECT 'SSL Labs', 'https://www.ssllabs.com/ssltest/analyze.html?d={{domain}}', 'fa-lock', JSON_ARRAY('admin', 'manager', 'support'), 1, 5
WHERE NOT EXISTS (SELECT 1 FROM quick_tools WHERE name = 'SSL Labs');

COMMIT;

