-- Fix notification_logs.subscription_id column to support system-level notifications
-- Issue: subscription_id VARCHAR(15) is too short for identifiers like 'DCR_DAILY_REPORT' (16 chars)
-- Solution: Increase length to VARCHAR(50) and make it nullable for system notifications

START TRANSACTION;

-- Temporarily drop the foreign key constraint
ALTER TABLE notification_logs
    DROP FOREIGN KEY fk_notification_logs_subscription;

-- Modify the subscription_id column to be longer and nullable
ALTER TABLE notification_logs
    MODIFY COLUMN subscription_id VARCHAR(50) NULL;

-- Recreate the foreign key constraint (will allow NULL values)
ALTER TABLE notification_logs
    ADD CONSTRAINT fk_notification_logs_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(sub_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

COMMIT;
