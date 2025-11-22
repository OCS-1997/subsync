-- Migration: Create subscription_history table
-- Description: Track all changes made to subscriptions with detailed field-level history

CREATE TABLE IF NOT EXISTS subscription_history (
  history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sub_id VARCHAR(15) NOT NULL,
  changed_by VARCHAR(255) NULL, -- username who made the change
  change_type ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL DEFAULT 'UPDATE',
  field_name VARCHAR(100) NULL, -- field that changed (NULL for full record changes)
  old_value TEXT NULL, -- previous value (JSON for complex objects)
  new_value TEXT NULL, -- new value (JSON for complex objects)
  change_summary TEXT NULL, -- human-readable summary of changes
  ip_address VARCHAR(45) NULL, -- IP address of the user making the change
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_history_sub (sub_id),
  INDEX idx_history_created (created_at),
  INDEX idx_history_changed_by (changed_by),
  
  CONSTRAINT fk_history_subscription
    FOREIGN KEY (sub_id)
    REFERENCES subscriptions(sub_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

