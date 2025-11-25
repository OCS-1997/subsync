-- Add billing_cycle_type column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN billing_cycle_type ENUM('contract', 'financial_year', 'calendar_year') 
NOT NULL DEFAULT 'contract' 
AFTER repeat_every_unit;
