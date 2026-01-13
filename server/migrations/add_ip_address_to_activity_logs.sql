-- Migration: Add IP Address column to activity_logs table
-- Date: 2025-01-16
-- Description: Add ip_address column to track user IP addresses in activity logs

-- Add ip_address column to activity_logs table
ALTER TABLE activity_logs 
ADD COLUMN ip_address VARCHAR(45) AFTER resource_id;

-- Update existing login records to include IP from details if available
UPDATE activity_logs 
SET ip_address = JSON_UNQUOTE(JSON_EXTRACT(details, '$.ip'))
WHERE action IN ('LOGIN_SUCCESS', 'LOGIN_FAILED') 
  AND details IS NOT NULL 
  AND JSON_VALID(details) 
  AND JSON_EXTRACT(details, '$.ip') IS NOT NULL;

-- Add index on ip_address for better query performance
CREATE INDEX idx_activity_logs_ip_address ON activity_logs(ip_address);

-- Add composite index for common queries
CREATE INDEX idx_activity_logs_composite ON activity_logs(username, action, timestamp);