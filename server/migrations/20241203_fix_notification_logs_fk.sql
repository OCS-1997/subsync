-- Migration to fix notification_logs foreign key constraint for DCR reports
-- DCR reports and other system notifications don't have a subscription_id
-- This migration makes subscription_id nullable and updates the foreign key

START TRANSACTION;

-- Drop the existing foreign key constraint
ALTER TABLE notification_logs
    DROP FOREIGN KEY fk_notification_logs_subscription;

-- Drop the existing unique constraint (it includes subscription_id)
ALTER TABLE notification_logs
    DROP INDEX uq_notification;

-- Make subscription_id nullable
ALTER TABLE notification_logs
    MODIFY COLUMN subscription_id VARCHAR(15) NULL;

-- Add back the unique constraint
-- Note: In MySQL, NULL values are considered distinct, so multiple NULL subscription_ids
-- can exist with the same template_key and date
ALTER TABLE notification_logs
    ADD UNIQUE KEY uq_notification (subscription_id, template_key, (DATE(sent_at)));

-- Add back the foreign key constraint
-- This will only be enforced when subscription_id is NOT NULL
ALTER TABLE notification_logs
    ADD CONSTRAINT fk_notification_logs_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(sub_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

COMMIT;
