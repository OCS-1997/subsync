-- Migration: Add customer_details JSON field for New Customer opportunities
-- Date: 2026-01-02
-- Description: Allows storing customer information as JSON for "New" opportunity type

-- Add customer_details JSON column
ALTER TABLE opportunities 
ADD COLUMN customer_details JSON NULL 
COMMENT 'Customer details for new/prospective customers (JSON format)' 
AFTER customer_id;

-- Make customer_id nullable to support new customer entries
ALTER TABLE opportunities 
MODIFY COLUMN customer_id VARCHAR(50) NULL;

-- Add check constraint to ensure either customer_id or customer_details exists (but not both)
ALTER TABLE opportunities
ADD CONSTRAINT chk_customer_data CHECK (
  (customer_id IS NOT NULL AND customer_details IS NULL) OR
  (customer_id IS NULL AND customer_details IS NOT NULL)
);
