# Database Migration Checklist

## Reminder System Module (Module A)

### Required Migrations (Run in Order):

1. **20241201_reminder_system_schema.sql**
   - ✅ Creates `reminder_policies` table
   - ✅ Creates `reminder_policy_offsets` table
   - ✅ Creates `email_templates` table
   - ✅ Creates `notification_logs` table
   - ✅ Creates `failed_jobs` table
   - ✅ Adds `reminder_policy_id` and `archived_at` columns to `subscriptions` table
   - ✅ Adds foreign key constraint for `reminder_policy_id`
   - ✅ Inserts default reminder policy
   - ✅ Inserts default email templates
   - ✅ Inserts default policy offsets

2. **20241201_add_reminder_permissions.sql**
   - ✅ Adds reminder policy permissions
   - ✅ Adds email template permissions
   - ✅ Adds notification logs permission
   - ✅ Assigns permissions to roles

### Migration Order:

```bash
# Step 1: Create reminder system tables
mysql -u your_user -p your_database < migrations/20241201_reminder_system_schema.sql

# Step 2: Add RBAC permissions
mysql -u your_user -p your_database < migrations/20241201_add_reminder_permissions.sql
```

## DCR Module (Module B)

### Required Migrations (Run in Order):

1. **20241202_dcr_schema.sql**
   - ✅ Creates `dcr_entries` table
   - ✅ Creates `dcr_categories` table
   - ✅ Inserts default categories

2. **20241202_add_dcr_permissions.sql**
   - ✅ Adds DCR permissions
   - ✅ Assigns permissions to roles

### Migration Order:

```bash
# Step 1: Create DCR tables
mysql -u your_user -p your_database < migrations/20241202_dcr_schema.sql

# Step 2: Add DCR RBAC permissions
mysql -u your_user -p your_database < migrations/20241202_add_dcr_permissions.sql
```

## Complete Migration Sequence

If setting up from scratch, run migrations in this order:

```bash
# 1. Base RBAC schema (if not already run)
mysql -u your_user -p your_database < migrations/20241125_rbac_schema.sql

# 2. Reminder System Module A
mysql -u your_user -p your_database < migrations/20241201_reminder_system_schema.sql
mysql -u your_user -p your_database < migrations/20241201_add_reminder_permissions.sql

# 3. DCR Module B
mysql -u your_user -p your_database < migrations/20241202_dcr_schema.sql
mysql -u your_user -p your_database < migrations/20241202_add_dcr_permissions.sql

# 4. Other migrations (if needed)
mysql -u your_user -p your_database < migrations/add_billing_cycle_type.sql
mysql -u your_user -p your_database < migrations/subscription_history_table.sql
```

## Verification

After running migrations, verify tables exist:

```sql
-- Check reminder system tables
SHOW TABLES LIKE 'reminder%';
SHOW TABLES LIKE 'email%';
SHOW TABLES LIKE 'notification%';
SHOW TABLES LIKE 'failed_jobs';

-- Check DCR tables
SHOW TABLES LIKE 'dcr%';

-- Check subscriptions table has new columns
DESCRIBE subscriptions;
-- Should show: reminder_policy_id, archived_at

-- Check permissions
SELECT permission_key FROM permissions WHERE resource IN ('reminder_policies', 'email_templates', 'notification_logs', 'dcr');
```

## Common Issues

### Issue: Foreign Key Constraint Fails

**Error:** `Cannot add foreign key constraint`

**Solution:** Ensure `reminder_policies` table is created before adding the foreign key. The migration should handle this, but if you get this error, check:
1. `reminder_policies` table exists
2. `reminder_policies.id` is BIGINT AUTO_INCREMENT PRIMARY KEY
3. No existing data violates the constraint

### Issue: Unique Constraint on notification_logs

**Error:** `Duplicate entry for key 'uq_notification'`

**Solution:** This is expected behavior - the unique constraint prevents duplicate notifications. If you need to resend, use a different date or clear existing logs.

### Issue: Missing Default Policy

**Error:** Default reminder policy not found

**Solution:** The migration should create it automatically. If missing, run:
```sql
INSERT INTO reminder_policies (name, is_default, created_by)
VALUES ('Default Reminder Policy', 1, NULL);
```

## Rollback (if needed)

To rollback migrations (use with caution):

```sql
-- Remove foreign key constraint
ALTER TABLE subscriptions DROP FOREIGN KEY fk_subscriptions_reminder_policy;

-- Drop columns
ALTER TABLE subscriptions 
    DROP COLUMN reminder_policy_id,
    DROP COLUMN archived_at;

-- Drop tables (will cascade delete related data)
DROP TABLE IF EXISTS reminder_policy_offsets;
DROP TABLE IF EXISTS reminder_policies;
DROP TABLE IF EXISTS email_templates;
DROP TABLE IF EXISTS notification_logs;
DROP TABLE IF EXISTS failed_jobs;
DROP TABLE IF EXISTS dcr_entries;
DROP TABLE IF EXISTS dcr_categories;
```

