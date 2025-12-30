# Subscription System - Complete Technical Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Subscription Lifecycle](#subscription-lifecycle)
4. [Queue System](#queue-system)
5. [Reminder System](#reminder-system)
6. [Archive System](#archive-system)
7. [API Endpoints](#api-endpoints)
8. [Code Flow Diagrams](#code-flow-diagrams)
9. [Troubleshooting](#troubleshooting)

---

## 1. System Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Frontend   │───▶│   Backend    │───▶│   Database   │ │
│  │  React App   │    │  Express API │    │    MySQL     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                              │                              │
│                              ▼                              │
│                      ┌──────────────┐                       │
│                      │  Bull Queue  │                       │
│                      │   (Redis)    │                       │
│                      └──────────────┘                       │
│                              │                              │
│                              ▼                              │
│                      ┌──────────────┐                       │
│                      │    Worker    │                       │
│                      │ (Send Emails)│                       │
│                      └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React + React Router + Axios
- **Backend**: Node.js + Express
- **Database**: MySQL
- **Queue**: Bull (BullMQ) + Redis
- **Email**: SendGrid / SMTP (Nodemailer)

---

## 2. Database Schema

### 2.1 subscriptions Table

```sql
CREATE TABLE subscriptions (
  -- Identity
  sub_id VARCHAR(50) PRIMARY KEY,              -- e.g., SUB-20251229-12345
  
  -- Relationships
  customer_id VARCHAR(50) NOT NULL,            -- FK to customers table
  
  -- Basic Info
  domain_name VARCHAR(255),                    -- e.g., example.com
  
  -- Dates
  start_date DATE NOT NULL,                    -- When subscription starts
  end_date DATE,                               -- When subscription expires
  
  -- Never Expires Feature
  never_expires TINYINT(1) DEFAULT 0,          -- 1 = never expires
  repeat_every_value INT,                      -- e.g., 1, 2, 3
  repeat_every_unit ENUM('days','weeks','months','years'), -- e.g., 'years'
  
  -- Billing
  billing_cycle_type ENUM('contract','financial_year','calendar_year'),
  currency VARCHAR(3) DEFAULT 'INR',
  subtotal DECIMAL(12,2) NOT NULL,
  tax_total DECIMAL(12,2) NOT NULL,
  discount_type ENUM('amount','percent'),
  discount_value DECIMAL(12,2),
  rounding DECIMAL(12,2),
  total DECIMAL(12,2) NOT NULL,
  
  -- Additional Info
  notes TEXT,
  terms_and_conditions TEXT,
  email_list JSON,                             -- ["email1@example.com", "email2@example.com"]
  
  -- Status
  status ENUM('active','paused','cancelled') DEFAULT 'active',
  archived_at DATETIME NULL,                   -- NULL = active, NOT NULL = archived
  
  -- Reminder Policy
  reminder_policy_id BIGINT,                   -- FK to reminder_policies
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_customer (customer_id),
  INDEX idx_end_date (end_date),
  INDEX idx_archived_at (archived_at),
  INDEX idx_domain_name (domain_name)
);
```

**Key Fields Explained:**

- **sub_id**: Unique identifier (format: `SUB-YYYYMMDD-XXXXX`)
- **archived_at**: 
  - `NULL` = Active subscription (shows in main list)
  - `NOT NULL` = Archived subscription (shows in archived list)
- **never_expires**: 
  - `0` = Normal subscription with end_date
  - `1` = Never expires, uses calculated end_date for reminders
- **end_date**: 
  - For normal subscriptions: actual expiry date
  - For never_expires: calculated as `start_date + repeat_every`

### 2.2 subscription_items Table

```sql
CREATE TABLE subscription_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  sub_id VARCHAR(50) NOT NULL,
  service_id VARCHAR(50),                      -- FK to services table
  service_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  rate DECIMAL(12,2) NOT NULL,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL,               -- quantity * rate
  
  FOREIGN KEY (sub_id) REFERENCES subscriptions(sub_id) ON DELETE CASCADE
);
```

### 2.3 notification_logs Table

```sql
CREATE TABLE notification_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscription_id VARCHAR(50) NOT NULL,
  template_key VARCHAR(100) NOT NULL,          -- e.g., 'renewal_30_days'
  sent_at DATETIME NOT NULL,                   -- When email should be/was sent
  status ENUM('queued','sent','failed','skipped') DEFAULT 'queued',
  user_id INT,                                 -- Who triggered (NULL for auto)
  provider_id VARCHAR(255),                    -- Email provider message ID
  attempt INT DEFAULT 0,                       -- Retry attempt number
  error TEXT,                                  -- Error message if failed
  attachment_url VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(sub_id) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX idx_composite (subscription_id, template_key, sent_at),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

**Status Flow:**
```
queued → sent (success)
   ↓
queued → failed (error, will retry)
   ↓
queued → failed (max retries reached)
```

### 2.4 reminder_policies & reminder_policy_offsets Tables

```sql
CREATE TABLE reminder_policies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_default TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reminder_policy_offsets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  policy_id BIGINT NOT NULL,
  days_offset INT NOT NULL,                    -- Negative = before end_date
  template_key VARCHAR(100) NOT NULL,          -- Email template to use
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (policy_id) REFERENCES reminder_policies(id) ON DELETE CASCADE
);
```

**Example Default Policy:**
```
Policy: "Default Reminder Policy"
Offsets:
  - days_offset: -30, template_key: 'renewal_30_days'
  - days_offset: -15, template_key: 'renewal_15_days'
  - days_offset: -7,  template_key: 'renewal_7_days'
  - days_offset: -1,  template_key: 'renewal_1_day'
```

---

## 3. Subscription Lifecycle

### 3.1 CREATE Subscription

**User Action:** Fill form and click "Create Subscription"

**Frontend Flow:**
```javascript
// File: SubscriptionForm.jsx
const handleSubmit = async (formData) => {
  const response = await api.post('/subscriptions', {
    domain_name: formData.domain,
    customer_id: formData.customerId,
    start_date: formData.startDate,
    end_date: formData.endDate,
    never_expires: formData.neverExpires,
    repeat_every_value: formData.repeatValue,
    repeat_every_unit: formData.repeatUnit,
    items: formData.items, // Array of services
    total: formData.total,
    // ... other fields
  });
};
```

**Backend Flow:**
```
POST /api/subscriptions
    ↓
subscriptionController.createSubscription()
    ↓
1. Validate input
2. Generate sub_id (SUB-YYYYMMDD-XXXXX)
3. Calculate totals
4. INSERT into subscriptions table
5. INSERT items into subscription_items table
6. Call enqueueReminders(sub_id, user_id)
    ↓
reminderService.enqueueReminders()
    ↓
7. Get reminder policy (default or custom)
8. Get policy offsets (30, 15, 7, 1 days)
9. For each offset:
   a. Calculate runAt = end_date + days_offset
   b. Check if already sent (idempotency)
   c. Add job to Bull queue
   d. INSERT into notification_logs (status='queued')
    ↓
10. Return success
```

**Database State After Creation:**

```sql
-- subscriptions table
sub_id: SUB-20251229-12345
customer_id: CID123
domain_name: example.com
start_date: 2025-12-29
end_date: 2026-12-29
archived_at: NULL
status: active

-- subscription_items table
item_id: 1, sub_id: SUB-20251229-12345, service_name: Web Hosting, amount: 10000

-- notification_logs table (4 entries created)
id: 1, subscription_id: SUB-20251229-12345, template_key: renewal_30_days, sent_at: 2026-11-29, status: queued
id: 2, subscription_id: SUB-20251229-12345, template_key: renewal_15_days, sent_at: 2026-12-14, status: queued
id: 3, subscription_id: SUB-20251229-12345, template_key: renewal_7_days,  sent_at: 2026-12-22, status: queued
id: 4, subscription_id: SUB-20251229-12345, template_key: renewal_1_day,   sent_at: 2026-12-28, status: queued
```

**Bull Queue State:**

```javascript
// 4 jobs added to Redis queue
Job 1: {
  id: 'reminder_SUB-20251229-12345_renewal_30_days_2026-11-29',
  data: {
    subscriptionId: 'SUB-20251229-12345',
    templateKey: 'renewal_30_days',
    runAtISO: '2026-11-29T00:00:00.000Z',
    createdBy: 1
  },
  delay: 29808000000 // milliseconds until 2026-11-29
}
// ... 3 more jobs
```

### 3.2 VIEW Active Subscriptions

**User Action:** Navigate to Subscriptions page

**Frontend Flow:**
```javascript
// File: ListSubscriptions.jsx
const fetchData = async () => {
  const response = await api.get('/subscriptions', {
    params: {
      page: 1,
      search: searchTerm,
      statusFilter: 'active'
    }
  });
  setData(response.data.dataArray);
};
```

**Backend Flow:**
```
GET /api/subscriptions
    ↓
subscriptionController.getSubscriptions()
    ↓
subscriptionModel.getSubscriptions()
    ↓
SQL Query:
SELECT s.*, c.display_name as customer_name
FROM subscriptions s
LEFT JOIN customers c ON s.customer_id = c.customer_id
WHERE s.archived_at IS NULL  -- Only active subscriptions
ORDER BY s.created_at DESC
LIMIT 10 OFFSET 0
    ↓
For each subscription, calculate dynamic_status:
  - If end_date < today → "Expired"
  - If end_date < today + 30 days → "Soon Expiring"
  - Else → "Active"
    ↓
Return data to frontend
```

**Dynamic Status Calculation:**
```javascript
// Backend: subscriptionModel.js
const now = new Date();
const endDate = new Date(subscription.end_date);
const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

if (daysUntilExpiry < 0) {
  dynamic_status = 'Expired';
} else if (daysUntilExpiry <= 30) {
  dynamic_status = 'Soon Expiring';
} else {
  dynamic_status = 'Active';
}
```

---

## 4. Queue System

### 4.1 Bull Queue Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         BULL QUEUE                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐                                           │
│  │    Redis     │  ◀── Stores job data                      │
│  │  (Database)  │                                           │
│  └──────────────┘                                           │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Queue: subscriptionReminders             │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Delayed Jobs  │  Waiting Jobs  │  Active Jobs       │  │
│  │  (scheduled)   │  (ready to run)│  (processing)      │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                           │
│  │    Worker    │  ◀── Processes jobs                       │
│  │ (reminderWorker.js)                                      │
│  └──────────────┘                                           │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                           │
│  │ Send Email   │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Queue Configuration

**File:** `server/queues/queueConfig.js`

```javascript
import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Create queue
export const subscriptionRemindersQueue = new Queue('subscriptionReminders', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,                    // Retry up to 5 times
    backoff: {
      type: 'exponential',
      delay: 60000,                 // Start with 1 minute
    },
    removeOnComplete: {
      age: 7 * 24 * 3600,          // Keep completed jobs for 7 days
      count: 1000,
    },
    removeOnFail: {
      age: 30 * 24 * 3600,         // Keep failed jobs for 30 days
    },
  },
});
```

### 4.3 Adding Jobs to Queue

**File:** `server/services/reminderService.js`

```javascript
export async function enqueueReminders(subscriptionId, userId = null) {
  // 1. Get subscription
  const subscription = await getSubscriptionById(subscriptionId);
  
  // 2. Skip if archived
  if (subscription.archived_at) {
    return { enqueued: 0, cancelled: 0 };
  }
  
  // 3. Calculate effective end_date
  let effectiveEndDate = subscription.end_date;
  if (subscription.never_expires === 1) {
    // Calculate: start_date + repeat_every
    effectiveEndDate = calculateEndDate(
      subscription.start_date,
      subscription.repeat_every_value,
      subscription.repeat_every_unit
    );
  }
  
  // 4. Get reminder policy
  const policy = await getReminderPolicy(subscription.reminder_policy_id);
  const offsets = await getActivePolicyOffsets(policy.id);
  
  // 5. Cancel existing jobs
  await cancelPendingReminderJobs(subscriptionId);
  
  // 6. Enqueue new jobs
  for (const offset of offsets) {
    // Calculate when to run
    const runAt = new Date(effectiveEndDate);
    runAt.setDate(runAt.getDate() + offset.days_offset); // e.g., -30 days
    
    // Skip if too old
    const now = new Date();
    if (runAt <= now) {
      const daysPast = Math.floor((now - runAt) / (1000 * 60 * 60 * 24));
      if (daysPast > 7) continue; // Too old, skip
    }
    
    // Check if already sent
    const alreadySent = await isNotificationSent(subscriptionId, offset.template_key, runAt);
    if (alreadySent) continue;
    
    // Calculate delay
    const delay = Math.max(0, runAt.getTime() - now.getTime());
    
    // Add job to queue
    await subscriptionRemindersQueue.add(
      'send_reminder',
      {
        subscriptionId,
        templateKey: offset.template_key,
        runAtISO: runAt.toISOString(),
        createdBy: userId,
      },
      {
        delay,  // Delay in milliseconds
        jobId: `reminder_${subscriptionId}_${offset.template_key}_${runAt.toISOString().split('T')[0]}`,
      }
    );
    
    // Log as queued
    await upsertNotificationLog({
      subscription_id: subscriptionId,
      template_key: offset.template_key,
      sent_at: runAt,
      status: 'queued',
      user_id: userId,
      attempt: 0,
    });
  }
}
```

### 4.4 Worker Processing Jobs

**File:** `server/workers/reminderWorker.js`

```javascript
import { Worker } from 'bullmq';
import { sendReminderEmail } from '../services/emailService.js';
import { upsertNotificationLog, isNotificationSent } from '../models/notificationLogModel.js';

async function processReminderJob(job) {
  const { subscriptionId, templateKey, runAtISO, createdBy } = job.data;
  const runAt = new Date(runAtISO);
  const attempt = job.attemptsMade + 1;
  
  console.log(`Processing reminder job: ${subscriptionId}, ${templateKey}`);
  
  try {
    // Idempotency check
    const alreadySent = await isNotificationSent(subscriptionId, templateKey, runAt);
    if (alreadySent) {
      console.log('Already sent, skipping');
      await upsertNotificationLog({
        subscription_id: subscriptionId,
        template_key: templateKey,
        sent_at: runAt,
        status: 'skipped',
        user_id: createdBy,
        attempt,
        error: 'Notification already sent (idempotency check)',
      });
      return; // Job completed successfully (skipped)
    }
    
    // Send email
    const result = await sendReminderEmail(subscriptionId, templateKey, runAt);
    
    if (result.success) {
      // Log success
      await upsertNotificationLog({
        subscription_id: subscriptionId,
        template_key: templateKey,
        sent_at: runAt,
        status: 'sent',
        user_id: createdBy,
        provider_id: result.providerId,
        attempt,
        error: null,
      });
      console.log('✅ Email sent successfully');
    } else {
      // Log failure
      await upsertNotificationLog({
        subscription_id: subscriptionId,
        template_key: templateKey,
        sent_at: runAt,
        status: 'failed',
        user_id: createdBy,
        attempt,
        error: result.error,
      });
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('❌ Job failed:', error.message);
    throw error; // Re-throw to trigger retry
  }
}

// Create worker
export function createReminderWorker() {
  const worker = new Worker(
    'subscriptionReminders',
    async (job) => await processReminderJob(job),
    {
      connection: redisConnection,
      concurrency: 10, // Process 10 jobs simultaneously
    }
  );
  
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
  });
  
  return worker;
}
```

### 4.5 Job Lifecycle

```
1. Job Created (delayed)
   ↓
   Status: delayed
   Stored in Redis with delay timestamp
   
2. Delay Expires
   ↓
   Status: waiting
   Ready to be picked up by worker
   
3. Worker Picks Up Job
   ↓
   Status: active
   Worker processes job
   
4a. Success
   ↓
   Status: completed
   Removed after 7 days
   
4b. Failure
   ↓
   Status: failed
   Retry with exponential backoff
   ↓
   If max attempts reached:
     Status: failed (permanent)
     Kept for 30 days
```

---

## 5. Reminder System

### 5.1 How Reminders Work

**Timeline Example:**

```
Subscription Created: 2025-12-29
End Date: 2026-12-29

Reminders Scheduled:
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  2025-12-29          2026-11-29          2026-12-29         │
│      │                   │                   │              │
│   Created           30 days            Expires              │
│                     before                                  │
│                        │                                    │
│                        ▼                                    │
│                   Send Email                                │
│                                                              │
│  Also scheduled:                                            │
│  - 2026-12-14 (15 days before)                             │
│  - 2026-12-22 (7 days before)                              │
│  - 2026-12-28 (1 day before)                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Reminder Email Flow

**When Reminder Time Arrives:**

```
1. Bull Worker picks up job from queue
   ↓
2. Check: Is notification already sent?
   - Query notification_logs for status='sent'
   - If yes → Skip (idempotency)
   ↓
3. Fetch subscription details
   - Get domain_name, end_date, total
   ↓
4. Fetch customer details
   - Get customer name, email
   ↓
5. Fetch email template
   - Get template by template_key (e.g., 'renewal_30_days')
   ↓
6. Render email template
   - Replace placeholders:
     {{domain_name}} → example.com
     {{customer_name}} → John Doe
     {{end_date}} → 2026-12-29
     {{days_until_expiry}} → 30
     {{total}} → ₹10,000
   ↓
7. Send email via provider
   - SendGrid or SMTP
   ↓
8a. Success
   - Update notification_logs: status='sent', sent_at=NOW()
   ↓
8b. Failure
   - Update notification_logs: status='failed', error=message
   - Job will retry (up to 5 times)
```

### 5.3 Email Service

**File:** `server/services/emailService.js`

```javascript
export async function sendReminderEmail(subscriptionId, templateKey, runAt) {
  try {
    // 1. Get subscription
    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }
    
    // 2. Get customer
    const customer = await getCustomerById(subscription.customer_id);
    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }
    
    // 3. Get email template
    const template = await getEmailTemplateByKey(templateKey);
    if (!template) {
      return { success: false, error: 'Email template not found' };
    }
    
    // 4. Build context for template
    const context = {
      domain_name: subscription.domain_name,
      customer_name: customer.display_name,
      end_date: formatDate(subscription.end_date),
      days_until_expiry: calculateDaysUntilExpiry(subscription.end_date),
      total: formatCurrency(subscription.total),
      // ... more fields
    };
    
    // 5. Render template with Handlebars
    const compiledSubject = Handlebars.compile(template.subject);
    const compiledBody = Handlebars.compile(template.body);
    const subject = compiledSubject(context);
    const html = compiledBody(context);
    
    // 6. Get recipient emails
    const recipients = subscription.email_list || [customer.email];
    
    // 7. Send email
    const result = await sendEmail({
      to: recipients,
      subject,
      html,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return { success: false, error: error.message };
  }
}
```

---

## 6. Archive System

### 6.1 Archive Subscription

**User Action:** Click "Archive" button on active subscription

**Frontend Flow:**
```javascript
// File: ListSubscriptions.jsx
const handleArchive = async (subId) => {
  try {
    await api.post(`/subscriptions/${subId}/archive`);
    toast.success('Subscription archived');
    fetchData(); // Refresh list
  } catch (error) {
    toast.error('Failed to archive subscription');
  }
};
```

**Backend Flow:**
```
POST /api/subscriptions/:id/archive
    ↓
subscriptionReminderController.archiveSubscriptionController()
    ↓
2. Verify subscription exists
3. UPDATE subscriptions SET archived_at = NOW() WHERE sub_id = ?
4. Log activity (ARCHIVE_SUBSCRIPTION)
5. Return success
    ↓
Note: Pending reminder jobs remain in queue
      They will be skipped when processed (archived check)
```

**Database State After Archive:**

```sql
-- BEFORE
sub_id: SUB-20251229-12345
archived_at: NULL
status: active

-- AFTER
sub_id: SUB-20251229-12345
archived_at: 2025-12-29 20:30:00  ← Set to current timestamp
status: active                     ← Status unchanged
```

**Important Notes:**

1. **Status field unchanged**: `status` remains `active`, `paused`, or `cancelled`
2. **archived_at is the flag**: `NULL` = active, `NOT NULL` = archived
3. **Reminder jobs**: Jobs remain in queue but are skipped when processed
4. **Reversible**: Can be un-archived by renewing

### 6.2 View Archived Subscriptions

**User Action:** Navigate to "Archived Subscriptions" tab

**Frontend Flow:**
```javascript
// File: ArchivedSubscriptions.jsx
const fetchData = async () => {
  const response = await api.get('/subscriptions', {
    params: {
      page: 1,
      archivedOnly: true  // ← Key parameter
    }
  });
  setData(response.data.dataArray);
};
```

**Backend Flow:**
```
GET /api/subscriptions?archivedOnly=true
    ↓
subscriptionController.getSubscriptions()
    ↓
subscriptionModel.getSubscriptions()
    ↓
SQL Query:
SELECT s.*, c.display_name as customer_name
FROM subscriptions s
LEFT JOIN customers c ON s.customer_id = c.customer_id
WHERE s.archived_at IS NOT NULL  -- ← Only archived subscriptions
ORDER BY s.archived_at DESC
LIMIT 10 OFFSET 0
    ↓
Return data to frontend
```

### 6.3 Renew Subscription

**User Action:** Click "Renew" button on archived subscription

**Frontend Flow:**
```javascript
// File: ArchivedSubscriptions.jsx
const handleRenew = async (subId, newEndDate) => {
  try {
    await api.post(`/subscriptions/${subId}/renew`, {
      end_date: newEndDate
    });
    toast.success('Subscription renewed');
    fetchData(); // Refresh list
  } catch (error) {
    toast.error('Failed to renew subscription');
  }
};
```

**Backend Flow:**
```
POST /api/subscriptions/:id/renew
    ↓
subscriptionReminderController.renewSubscriptionController()
    ↓
reminderService.renewSubscription()
    ↓
1. Get subscription by ID
2. Verify subscription exists
3. UPDATE subscriptions 
   SET end_date = ?, 
       archived_at = NULL,  ← Un-archive
       updated_at = NOW()
   WHERE sub_id = ?
4. Cancel old pending reminder jobs
   - Remove jobs from Bull queue
5. Enqueue new reminders
   - Call enqueueReminders(sub_id, user_id)
   - Creates new jobs based on new end_date
6. Log activity (RENEW_SUBSCRIPTION)
7. Return success
```

**Database State After Renewal:**

```sql
-- BEFORE
sub_id: SUB-20251229-12345
end_date: 2026-12-29
archived_at: 2025-12-29 20:30:00
status: active

-- AFTER
sub_id: SUB-20251229-12345
end_date: 2027-12-29           ← Updated
archived_at: NULL              ← Cleared (un-archived)
status: active

-- notification_logs (new entries created)
id: 5, subscription_id: SUB-20251229-12345, template_key: renewal_30_days, sent_at: 2027-11-29, status: queued
id: 6, subscription_id: SUB-20251229-12345, template_key: renewal_15_days, sent_at: 2027-12-14, status: queued
id: 7, subscription_id: SUB-20251229-12345, template_key: renewal_7_days,  sent_at: 2027-12-22, status: queued
id: 8, subscription_id: SUB-20251229-12345, template_key: renewal_1_day,   sent_at: 2027-12-28, status: queued
```

---

## 7. API Endpoints

### 7.1 Subscription Endpoints

```
GET    /api/subscriptions
       Query params:
         - page: number (default: 1)
         - limit: number (default: 10)
         - search: string (searches domain_name, customer_name)
         - statusFilter: 'active' | 'soon' | 'expired'
         - archivedOnly: boolean (default: false)
       Response:
         {
           dataArray: [...subscriptions],
           totalCount: number,
           totalPages: number,
           currentPage: number
         }

GET    /api/subscriptions/:id
       Response:
         {
           subscription: {...},
           items: [...]
         }

POST   /api/subscriptions
       Body:
         {
           domain_name: string,
           customer_id: string,
           start_date: date,
           end_date: date,
           never_expires: boolean,
           repeat_every_value: number,
           repeat_every_unit: string,
           items: [...],
           total: number,
           ...
         }
       Response:
         {
           message: 'Subscription created successfully',
           subscription: {...}
         }

PUT    /api/subscriptions/:id
       Body: (same as POST)
       Response:
         {
           message: 'Subscription updated successfully'
         }

DELETE /api/subscriptions/:id
       Response:
         {
           message: 'Subscription deleted successfully'
         }

POST   /api/subscriptions/:id/archive
       Response:
         {
           message: 'Subscription archived successfully'
         }

POST   /api/subscriptions/:id/renew
       Body:
         {
           end_date: date
         }
       Response:
         {
           message: 'Subscription renewed. X reminders enqueued.'
         }

POST   /api/subscriptions/:id/enqueue-reminders
       Response:
         {
           message: 'X reminders enqueued'
         }
```

### 7.2 Notification Log Endpoints

```
GET    /api/notification-logs
       Query params:
         - page: number
         - limit: number
         - subscription_id: string
         - template_key: string
         - status: 'queued' | 'sent' | 'failed' | 'skipped'
         - start_date: date
         - end_date: date
       Response:
         {
           logs: [...],
           total: number,
           totalPages: number
         }

GET    /api/notification-logs/:id
       Response:
         {
           log: {...}
         }
```

---

## 8. Code Flow Diagrams

### 8.1 Complete Subscription Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER CREATES SUBSCRIPTION                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: SubscriptionForm.jsx                              │
│ - User fills form                                           │
│ - Clicks "Create"                                           │
│ - POST /api/subscriptions                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: subscriptionController.createSubscription()        │
│ 1. Validate input                                           │
│ 2. Generate sub_id                                          │
│ 3. Calculate totals                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE: Insert subscription                               │
│ INSERT INTO subscriptions (...)                             │
│ INSERT INTO subscription_items (...)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: reminderService.enqueueReminders()                 │
│ 1. Get reminder policy                                      │
│ 2. Get policy offsets (30, 15, 7, 1 days)                  │
│ 3. For each offset:                                         │
│    - Calculate runAt                                        │
│    - Add job to Bull queue                                  │
│    - Insert into notification_logs                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ REDIS: Store jobs                                           │
│ 4 jobs stored with delays                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Success message                                   │
│ "Subscription created successfully"                         │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Reminder Email Sending Flow

```
┌─────────────────────────────────────────────────────────────┐
│              REMINDER TIME ARRIVES (e.g., 30 days before)   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ BULL QUEUE: Job becomes ready                               │
│ Status: delayed → waiting                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ WORKER: reminderWorker.js picks up job                      │
│ Status: waiting → active                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ CHECK: Idempotency                                          │
│ Query notification_logs for status='sent'                   │
│ If already sent → Skip                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ FETCH: Subscription + Customer + Template                   │
│ - Get subscription details                                  │
│ - Get customer email                                        │
│ - Get email template                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ RENDER: Email template                                      │
│ Replace {{placeholders}} with actual data                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ SEND: Email via SendGrid/SMTP                               │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌───────────────┐       ┌───────────────┐
        │   SUCCESS     │       │    FAILURE    │
        └───────────────┘       └───────────────┘
                │                       │
                ▼                       ▼
    ┌───────────────────┐   ┌───────────────────┐
    │ UPDATE LOG:       │   │ UPDATE LOG:       │
    │ status='sent'     │   │ status='failed'   │
    │ sent_at=NOW()     │   │ error=message     │
    └───────────────────┘   └───────────────────┘
                │                       │
                ▼                       ▼
        ┌───────────────┐       ┌───────────────┐
        │ Job Complete  │       │  Retry Job    │
        └───────────────┘       │ (up to 5x)    │
                                └───────────────┘
```

### 8.3 Archive & Renew Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ARCHIVES SUBSCRIPTION                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Click "Archive" button                            │
│ POST /api/subscriptions/:id/archive                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: archiveSubscriptionController()                    │
│ UPDATE subscriptions SET archived_at = NOW()                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ RESULT: Subscription archived                               │
│ - Disappears from active list                               │
│ - Appears in archived list                                  │
│ - Pending jobs remain but will be skipped                   │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                    USER RENEWS SUBSCRIPTION                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Click "Renew" button                              │
│ POST /api/subscriptions/:id/renew {end_date}                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: renewSubscription()                                │
│ 1. UPDATE subscriptions SET                                 │
│    end_date = new_date,                                     │
│    archived_at = NULL                                       │
│ 2. Cancel old pending jobs                                  │
│ 3. Enqueue new reminders                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ RESULT: Subscription renewed                                │
│ - Disappears from archived list                             │
│ - Appears in active list                                    │
│ - New reminder jobs scheduled                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Troubleshooting

### 9.1 Common Issues

**Issue: Reminders not being sent**

Check:
1. Is Redis running? `redis-cli ping` should return `PONG`
2. Is worker running? Check server logs for "Reminder worker started"
3. Are jobs in queue? Check Bull Board: `http://localhost:3000/admin/queues`
4. Is email configured? Check `.env` for `SENDGRID_API_KEY` or SMTP settings
5. Check notification_logs table for status='failed' and error messages

**Issue: Subscription not appearing in active list**

Check:
1. Is `archived_at` NULL? `SELECT archived_at FROM subscriptions WHERE sub_id = ?`
2. Is search/filter hiding it?
3. Check pagination - might be on different page

**Issue: Archive button not working**

Check:
1. Browser console for errors
2. Server logs for errors
3. Database - is `archived_at` being set?
4. User permissions - does user have SUBSCRIPTIONS_UPDATE permission?

**Issue: Duplicate reminder emails**

Check:
1. notification_logs for duplicate 'sent' entries
2. Idempotency check is working (isNotificationSent function)
3. Job IDs are unique

### 9.2 Debugging Commands

**Check Queue Status:**
```bash
# Redis CLI
redis-cli
> KEYS *subscriptionReminders*
> GET bull:subscriptionReminders:id
```

**Check Database:**
```sql
-- Count subscriptions by status
SELECT 
  CASE WHEN archived_at IS NULL THEN 'active' ELSE 'archived' END as type,
  COUNT(*) as count
FROM subscriptions
GROUP BY type;

-- Check notification logs
SELECT status, COUNT(*) as count
FROM notification_logs
GROUP BY status;

-- Find subscriptions with pending reminders
SELECT s.sub_id, s.domain_name, COUNT(nl.id) as pending_count
FROM subscriptions s
LEFT JOIN notification_logs nl ON s.sub_id = nl.subscription_id AND nl.status = 'queued'
WHERE s.archived_at IS NULL
GROUP BY s.sub_id
HAVING pending_count > 0;
```

**Check Server Logs:**
```bash
# Watch server logs
cd e:\Subsync\subsync\web-app\server
npm start

# Look for:
# - "Enqueued reminder for..."
# - "Processing reminder job..."
# - "Email sent successfully"
# - Any error messages
```

---

## 10. Summary

### Key Takeaways

1. **Subscriptions** are stored in MySQL with `archived_at` flag
2. **Reminders** are scheduled using Bull Queue + Redis
3. **Workers** process jobs and send emails
4. **Archiving** sets `archived_at` timestamp (soft delete)
5. **Renewing** clears `archived_at` and schedules new reminders
6. **Idempotency** prevents duplicate emails
7. **Status** is calculated dynamically based on `end_date`

### Data Flow Summary

```
User Action → Frontend → API → Controller → Model → Database
                                    ↓
                              Queue Service
                                    ↓
                              Bull Queue (Redis)
                                    ↓
                                 Worker
                                    ↓
                              Email Service
                                    ↓
                            SendGrid/SMTP
```

### File Structure Summary

```
server/
├── controllers/
│   ├── subscriptionController.js       # CRUD operations
│   └── subscriptionReminderController.js # Archive, renew, enqueue
├── models/
│   ├── subscriptionModel.js            # Database queries
│   └── notificationLogModel.js         # Log queries
├── services/
│   ├── reminderService.js              # Queue management
│   └── emailService.js                 # Email sending
├── queues/
│   └── queueConfig.js                  # Bull queue setup
└── workers/
    └── reminderWorker.js               # Job processing

subsync/src/features/Subscriptions/
├── pages/
│   ├── ListSubscriptions.jsx           # Active subscriptions
│   ├── ArchivedSubscriptions.jsx       # Archived subscriptions
│   └── SubscriptionForm.jsx            # Create/Edit form
└── components/
    └── ReminderHistory.jsx             # Show notification logs
```

---

**End of Documentation**

For questions or issues, check the troubleshooting section or review the code files mentioned in each section.
