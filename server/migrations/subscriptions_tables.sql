CREATE TABLE subscriptions (
  sub_id VARCHAR(15) NOT NULL PRIMARY KEY,
  customer_id VARCHAR(15) NOT NULL,
  domain_name VARCHAR(255),
  start_date DATETIME NOT NULL,
  end_date DATETIME NULL,
  never_expires TINYINT(1) NOT NULL DEFAULT 0,
  repeat_every_value INT NULL,
  repeat_every_unit ENUM('days','weeks','months','years') NULL,
  billing_cycle_type ENUM('contract','financial_year','calendar_year') NOT NULL DEFAULT 'contract',
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_type ENUM('amount','percent') NOT NULL DEFAULT 'amount',
  discount_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  rounding DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  terms_and_conditions TEXT NULL,
  email_list JSON NULL,
  status ENUM('active','paused','cancelled') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  
  INDEX idx_subscriptions_customer (customer_id),
  INDEX idx_subscriptions_end_date (end_date),

  CONSTRAINT fk_subscriptions_customer
    FOREIGN KEY (customer_id)
    REFERENCES customers(customer_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscription_items (
  item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sub_id VARCHAR(15) NOT NULL,
  service_id INT NULL,
  service_name VARCHAR(255) NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- amount excludes tax
  INDEX idx_items_sub (sub_id),
  INDEX idx_items_service (service_id),
  CONSTRAINT fk_items_subscription
    FOREIGN KEY (sub_id) REFERENCES subscriptions(sub_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_items_service
    FOREIGN KEY (service_id) REFERENCES services(service_id)
    ON DELETE SET NULL ON UPDATE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;