-- Birthday Experience Engine Configuration Schema
CREATE TABLE IF NOT EXISTS birthday_admin_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  enable_theme TINYINT(1) NOT NULL DEFAULT 1,
  enable_confetti TINYINT(1) NOT NULL DEFAULT 1,
  enable_dashboard_hero TINYINT(1) NOT NULL DEFAULT 1,
  animation_duration INT NOT NULL DEFAULT 6,
  company_greeting TEXT NOT NULL,
  enable_birthday_badge TINYINT(1) NOT NULL DEFAULT 1,
  enable_team_notification TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default row if not exists
INSERT INTO birthday_admin_settings (id, enabled, enable_theme, enable_confetti, enable_dashboard_hero, animation_duration, company_greeting, enable_birthday_badge, enable_team_notification)
SELECT 1, 1, 1, 1, 1, 6, 'Thank you for everything you do. We hope this year brings new opportunities, great achievements, good health, and continued success. Have an amazing birthday!', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM birthday_admin_settings WHERE id = 1);
