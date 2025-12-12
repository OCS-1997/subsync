-- Migration: Add date_of_birth, is_private, and created_by to contacts table
-- Created: 2025-12-12
-- Description: Adding date of birth field for birthday reminders and privacy settings for contacts

-- USE ocs_srms;

-- Add new columns to contacts table
ALTER TABLE contacts 
    ADD COLUMN date_of_birth DATE DEFAULT NULL COMMENT 'Contact date of birth for birthday reminders',
    ADD COLUMN is_private TINYINT(1) DEFAULT 0 COMMENT '0 = public (viewable by all), 1 = private (only viewable by creator)',
    ADD COLUMN created_by VARCHAR(20) DEFAULT NULL COMMENT 'Username of the user who created this contact';

-- Add index on created_by for privacy filtering performance
CREATE INDEX idx_contacts_created_by ON contacts(created_by);

-- Add index on is_private for filtering
CREATE INDEX idx_contacts_is_private ON contacts(is_private);

-- Add composite index for privacy filtering by user
CREATE INDEX idx_contacts_privacy_filter ON contacts(is_private, created_by);

-- Add foreign key constraint for created_by referencing users table
ALTER TABLE contacts
    ADD CONSTRAINT fk_contacts_created_by 
    FOREIGN KEY (created_by) REFERENCES users(username) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- If you need to rollback this migration, run:
-- ALTER TABLE contacts 
--     DROP FOREIGN KEY fk_contacts_created_by,
--     DROP INDEX idx_contacts_created_by,
--     DROP INDEX idx_contacts_is_private,
--     DROP INDEX idx_contacts_privacy_filter,
--     DROP COLUMN date_of_birth,
--     DROP COLUMN is_private,
--     DROP COLUMN created_by;
