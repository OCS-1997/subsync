# Subscription Reminder System - Module A

## Overview

This module implements a production-ready subscription renewal reminder system with dynamic reminder policies, email templating, and BullMQ-based job scheduling. The system is designed to be idempotent, fault-tolerant, and scalable.

## Features

- **Dynamic Reminder Policies**: Create custom reminder policies with configurable offsets (days before/after expiry)
- **Email Template Management**: Template-driven emails using Handlebars with preview functionality
- **BullMQ Job Queue**: Reliable job scheduling with retry logic and exponential backoff
- **Idempotency**: Prevents duplicate notifications using database constraints
- **Reconciliation Cron**: Daily job to catch missed reminders
- **Archival System**: Automatically archives old subscriptions
- **Notification Logs**: Complete audit trail of all sent notifications
- **RBAC Integration**: Full permission system integration

## Installation

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Existing SRMS codebase

### Step 1: Install Dependencies

```bash
cd web-app/server
npm install
```

### Step 2: Database Migrations

Run the migrations in order:

```bash
# 1. Create reminder system tables
mysql -u your_user -p your_database < migrations/20241201_reminder_system_schema.sql

# 2. Add RBAC permissions
mysql -u your_user -p your_database < migrations/20241201_add_reminder_permissions.sql
```

### Step 3: Environment Variables

Add the following to your `.env` file:

```env
# Database (existing)
DB_HOST=localhost
DB_USER=your_user
DB_PASS=your_password
DB_NAME=your_database

# Redis (required for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional, leave empty if no password

# Email Provider (choose one)
EMAIL_PROVIDER=sendgrid  # or 'smtp'

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMTP Configuration (if using SMTP instead)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# Application
APP_BASE_URL=http://localhost:3000
NODE_PORT=3000

# Worker Configuration
WORKER_CONCURRENCY=10  # Number of concurrent reminder jobs

# Archival
ARCHIVAL_DELAY_DAYS=30  # Days after expiry to archive

# Bull Board (queue monitoring)
BULL_BOARD_AUTH=admin:admin  # Change in production!

# Admin Notifications
ADMIN_EMAILS=hari@ocsindia.net  # Comma-separated for failed job alerts
```

### Step 4: Start Services

1. **Start Redis**:
```bash
redis-server
```

2. **Start the server**:
```bash
cd web-app/server
npm run dev
```

The server will:
- Start the Express API
- Initialize BullMQ queues
- Start reminder workers
- Schedule cron jobs (reconciliation at 01:00 UTC, archival at 02:00 UTC)
- Mount Bull Board at `/admin/queues`

## API Endpoints

### Reminder Policies

- `GET /api/reminder-policies` - List all policies
- `GET /api/reminder-policies/:id` - Get policy by ID
- `POST /api/reminder-policies` - Create policy
- `PUT /api/reminder-policies/:id` - Update policy
- `DELETE /api/reminder-policies/:id` - Delete policy

### Email Templates

- `GET /api/email-templates` - List templates
- `GET /api/email-templates/:id` - Get template by ID
- `POST /api/email-templates` - Create/update template
- `PUT /api/email-templates/:id` - Update template
- `DELETE /api/email-templates/:id` - Delete template
- `POST /api/email-templates/:id/preview` - Preview template with sample data

### Notification Logs

- `GET /api/notification-logs` - List logs (supports filters: subscription_id, template_key, start_date, end_date, status)
- `GET /api/notification-logs/:id` - Get log by ID

### Subscription Operations

- `POST /api/subscriptions/:id/renew` - Renew subscription and enqueue new reminders
- `POST /api/subscriptions/:id/archive` - Archive subscription
- `POST /api/subscriptions/:id/enqueue-reminders` - Manually enqueue reminders

## How It Works

### Reminder Enqueueing

When a subscription is created or updated (with `end_date` or `reminder_policy_id` changes):

1. System fetches the reminder policy (or uses default)
2. For each active offset in the policy:
   - Calculates `runAt = end_date + days_offset`
   - Checks idempotency (has notification been sent?)
   - If not sent and `runAt >= now`, enqueues a BullMQ job with delay
   - Logs as "queued" in `notification_logs`

### Worker Processing

The BullMQ worker:

1. Receives job with `subscriptionId`, `templateKey`, `runAtISO`
2. Checks idempotency again (race condition protection)
3. Loads subscription, customer, and items
4. Renders email template with Handlebars
5. Sends email via configured provider
6. Updates `notification_logs` with status ('sent' or 'failed')
7. On failure, retries with exponential backoff (5 attempts)

### Reconciliation Cron

Runs daily at 01:00 UTC (06:30 IST):

- Scans subscriptions expiring within ±60 days
- Checks if all expected notifications were sent
- Enqueues missing jobs

### Archival Cron

Runs daily at 02:00 UTC (07:30 IST):

- Archives subscriptions where `end_date <= now - ARCHIVAL_DELAY_DAYS`
- Sets `archived_at` and `status = 'archived'`

## Email Templates

Templates use Handlebars syntax. Available variables:

- `{{customer_name}}` - Customer display name
- `{{customer_email}}` - Customer email
- `{{subscription_id}}` - Subscription ID
- `{{domain_name}}` - Domain name
- `{{start_date}}` - Start date (formatted)
- `{{end_date}}` - End date (formatted)
- `{{days_left}}` - Days until expiry
- `{{currency}}` - Currency code
- `{{subtotal}}` - Subtotal amount
- `{{tax_total}}` - Tax amount
- `{{total}}` - Total amount
- `{{items}}` - Array of subscription items
- `{{items_table_html}}` - Pre-formatted HTML table of items
- `{{renewal_link}}` - Link to renew subscription
- `{{subscription}}` - Full subscription object
- `{{customer}}` - Full customer object

## RBAC Permissions

New permissions added:

- `reminder_policies.view`
- `reminder_policies.create`
- `reminder_policies.update`
- `reminder_policies.delete`
- `email_templates.view`
- `email_templates.create`
- `email_templates.update`
- `email_templates.delete`
- `notification_logs.view`

Admin role gets all permissions. Manager role gets view/create/update (no delete).

## Monitoring

### Bull Board

Access queue monitoring at: `http://localhost:3000/admin/queues`

Default credentials: `admin:admin` (change `BULL_BOARD_AUTH` in production!)

### Notification Logs

Query logs via API or directly in database:

```sql
SELECT * FROM notification_logs 
WHERE subscription_id = 'SUB001' 
ORDER BY sent_at DESC;
```

### Failed Jobs

Check `failed_jobs` table for jobs that exhausted all retries:

```sql
SELECT * FROM failed_jobs 
ORDER BY last_failed_at DESC;
```

## Testing

### Manual Testing

1. **Create a reminder policy**:
```bash
curl -X POST http://localhost:3000/api/reminder-policies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Policy",
    "offsets": [
      {"days_offset": -7, "template_key": "before_7", "active": true, "sort_order": 1}
    ]
  }'
```

2. **Create a subscription** with `reminder_policy_id` and `end_date`

3. **Check queued jobs** in Bull Board

4. **Wait for job execution** or manually trigger worker

### Unit Tests

See `tests/` directory (to be implemented):

- `reminderService.test.js` - Service logic tests
- `emailService.test.js` - Email rendering tests
- `reminderWorker.test.js` - Worker idempotency tests

## Troubleshooting

### Jobs Not Processing

1. Check Redis connection: `redis-cli ping`
2. Check worker logs for errors
3. Verify Bull Board shows jobs in queue
4. Check `WORKER_CONCURRENCY` setting

### Emails Not Sending

1. Verify email provider credentials
2. Check `notification_logs` for error messages
3. Test email provider directly
4. Check rate limits (SendGrid: 100/day free tier)

### Duplicate Notifications

- System uses unique constraint: `(subscription_id, template_key, DATE(sent_at))`
- If duplicates occur, check for race conditions in worker
- Verify idempotency checks are working

## Production Deployment Checklist

- [ ] Update `BULL_BOARD_AUTH` with strong credentials
- [ ] Set up Redis persistence (AOF or RDB)
- [ ] Configure email provider production credentials
- [ ] Set `WORKER_CONCURRENCY` based on load
- [ ] Enable Redis password authentication
- [ ] Set up monitoring/alerting for failed jobs
- [ ] Configure backup for `notification_logs` table
- [ ] Test reconciliation cron in staging
- [ ] Set up log aggregation for structured logs
- [ ] Configure rate limiting for email provider
- [ ] Review and adjust `ARCHIVAL_DELAY_DAYS`
- [ ] Set up health checks for workers
- [ ] Configure process manager (PM2/systemd) for workers

## Timezone Handling

- All datetimes stored in UTC in database
- Scheduling uses UTC timestamps
- Email templates format dates in IST (Asia/Kolkata)
- Cron jobs run at UTC times (01:00 UTC = 06:30 IST)

## Future Enhancements

- [ ] Module B: Daily Consolidated Report (DCR)
- [ ] PDF invoice generation and attachment
- [ ] SMS notifications
- [ ] Webhook notifications
- [ ] Template versioning
- [ ] A/B testing for email templates
- [ ] Advanced analytics dashboard

## Support

For issues or questions, contact: hari@ocsindia.net

