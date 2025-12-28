-- Add index to domain_name for better filtering performance
START TRANSACTION;

-- Add index on subscriptions.domain_name for notification log filtering
ALTER TABLE subscriptions
ADD INDEX idx_subscriptions_domain_name (domain_name);

COMMIT;
