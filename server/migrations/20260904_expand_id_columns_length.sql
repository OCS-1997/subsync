-- Migration to expand ID columns to VARCHAR(50) to support 18-20 character generated IDs (e.g. SUB260903230943545)
SET FOREIGN_KEY_CHECKS = 0;

-- Subscriptions & related
ALTER TABLE subscriptions MODIFY COLUMN sub_id VARCHAR(50) NOT NULL;
ALTER TABLE subscriptions MODIFY COLUMN customer_id VARCHAR(50) NOT NULL;
ALTER TABLE subscription_items MODIFY COLUMN sub_id VARCHAR(50) NOT NULL;
ALTER TABLE subscription_history MODIFY COLUMN sub_id VARCHAR(50) NOT NULL;
ALTER TABLE notification_logs MODIFY COLUMN subscription_id VARCHAR(50) NULL;

-- Customers & related
ALTER TABLE customers MODIFY COLUMN customer_id VARCHAR(50) NOT NULL;
ALTER TABLE birthdays MODIFY COLUMN customer_id VARCHAR(50) NULL;
ALTER TABLE birthdays MODIFY COLUMN user_id VARCHAR(50) NULL;
ALTER TABLE time_projects MODIFY COLUMN customer_id VARCHAR(50) NULL;
ALTER TABLE time_entries MODIFY COLUMN customer_id VARCHAR(50) NULL;
ALTER TABLE webhook_events MODIFY COLUMN customer_id VARCHAR(50) NULL;

-- Domains & related
ALTER TABLE domains MODIFY COLUMN domain_id VARCHAR(50) NOT NULL;
ALTER TABLE domains MODIFY COLUMN customer_id VARCHAR(50) NOT NULL;
ALTER TABLE domain_name_servers MODIFY COLUMN domain_id VARCHAR(50) NOT NULL;
ALTER TABLE contacts MODIFY COLUMN domain_id VARCHAR(50) NULL;
ALTER TABLE dcr_entries MODIFY COLUMN domain_id VARCHAR(50) NULL;
ALTER TABLE time_entries MODIFY COLUMN domain_id VARCHAR(50) NULL;

-- Contacts & related
ALTER TABLE contacts MODIFY COLUMN contact_id VARCHAR(50) NOT NULL;
ALTER TABLE dcr_entries MODIFY COLUMN contact_id VARCHAR(50) NULL;

-- Assets & related
ALTER TABLE assets MODIFY COLUMN asset_id VARCHAR(50) NOT NULL;
ALTER TABLE asset_attachments MODIFY COLUMN asset_id VARCHAR(50) NOT NULL;
ALTER TABLE asset_history MODIFY COLUMN asset_id VARCHAR(50) NOT NULL;

-- Opportunities & related
ALTER TABLE opportunities MODIFY COLUMN opportunity_id VARCHAR(50) NOT NULL;
ALTER TABLE opportunities MODIFY COLUMN customer_id VARCHAR(50) NULL;
ALTER TABLE time_entries MODIFY COLUMN opportunity_id VARCHAR(50) NULL;

-- Time entries, Vendors, Leave, Permissions & Taxes
ALTER TABLE time_entries MODIFY COLUMN entry_id VARCHAR(50) NOT NULL;
ALTER TABLE vendors MODIFY COLUMN vendor_id VARCHAR(50) NOT NULL;
ALTER TABLE leave_requests MODIFY COLUMN request_id VARCHAR(50) NOT NULL;
ALTER TABLE permission_requests MODIFY COLUMN request_id VARCHAR(50) NOT NULL;
ALTER TABLE tax_rates MODIFY COLUMN tax_id VARCHAR(50) NOT NULL;
ALTER TABLE tax_groups MODIFY COLUMN group_id VARCHAR(50) NOT NULL;
ALTER TABLE tax_group_members MODIFY COLUMN group_id VARCHAR(50) NOT NULL;
ALTER TABLE tax_group_members MODIFY COLUMN tax_id VARCHAR(50) NOT NULL;
ALTER TABLE tax_settings MODIFY COLUMN setting_id VARCHAR(50) NOT NULL;

SET FOREIGN_KEY_CHECKS = 1;
