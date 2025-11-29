# Daily Call Register (DCR) Module

## Overview

The DCR module tracks daily support calls per user and sends a consolidated visual report to the admin (hari@ocsindia.net) at 6 PM IST daily, with manual trigger support.

## Features

- **Record DCR Entries**: Users can create, view, update, and delete their own call entries
- **Daily Automatic Email**: BullMQ recurring job sends report at 6 PM IST (12:00 UTC)
- **Manual Trigger**: API endpoint to generate and send reports on demand
- **Statistics Dashboard**: Visual charts and KPIs for analysis
- **Data Export**: CSV export functionality
- **RBAC Integration**: Full permission-based access control

## Installation

### 1. Database Migrations

Run the migrations in order:

```bash
# 1. Create DCR tables
mysql -u your_user -p your_database < server/migrations/20241202_dcr_schema.sql

# 2. Add DCR permissions
mysql -u your_user -p your_database < server/migrations/20241202_add_dcr_permissions.sql
```

### 2. Install Dependencies

**Backend:**
```bash
cd web-app/server
npm install chartjs-node-canvas
```

**Frontend:**
```bash
cd web-app/subsync
npm install recharts
```

### 3. Environment Variables

Add to your `.env` file:

```env
# DCR Configuration
DAILY_REPORT_ADMIN_EMAIL=hari@ocsindia.net
DCR_REPORT_TIME_IST=18:00

# Redis (required for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Provider
EMAIL_PROVIDER=sendgrid  # or 'smtp'
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMTP Configuration (if using SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
```

## API Endpoints

### DCR Entries

- `POST /api/dcr` - Create DCR entry (requires `dcr.create`)
- `GET /api/dcr` - List entries with filters (requires `dcr.view`)
- `GET /api/dcr/:id` - Get entry by ID (requires `dcr.view`)
- `PUT /api/dcr/:id` - Update entry (requires `dcr.update`)
- `DELETE /api/dcr/:id` - Delete entry (requires `dcr.delete`)

### Statistics & Reports

- `GET /api/dcr/stats` - Get statistics (requires `dcr.view`)
- `GET /api/dcr/export` - Export entries as CSV (requires `dcr.view`)
- `POST /api/dcr/send-daily-report` - Manually trigger report (requires `dcr.send_report`)
- `GET /api/dcr/categories` - Get all categories (requires `dcr.view`)

## Frontend Routes

- `/:username/dashboard/dcr` - DCR List page
- `/:username/dashboard/dcr/add` - Create new entry
- `/:username/dashboard/dcr/edit/:id` - Edit entry
- `/:username/dashboard/dcr/stats` - Statistics dashboard
- `/:username/dashboard/dcr/admin` - Admin actions (send report)

## Permissions

The following permissions are available:

- `dcr.view` - View DCR entries
- `dcr.create` - Create DCR entries
- `dcr.update` - Update DCR entries
- `dcr.delete` - Delete DCR entries
- `dcr.send_report` - Send daily reports

### Default Role Permissions

- **Admin**: All permissions
- **Manager**: view, create, update, send_report
- **Sales**: view, create, update
- **Support**: view, create, update
- **Viewer**: view only

## Usage

### Creating a DCR Entry

1. Navigate to DCR page
2. Click "New Entry"
3. Fill in the form:
   - Timestamp (auto-filled with current time)
   - Call Type (Inbound/Outbound)
   - Category (required)
   - Time Spent in HH:MM format (e.g., 01:30)
   - Company, Domain, Contact Person (optional)
   - Description (optional)
4. Click "Create"

### Viewing Statistics

1. Navigate to `/:username/dashboard/dcr/stats`
2. Select date range
3. View charts and KPIs:
   - Total calls
   - Total time spent
   - Time per category (pie chart)
   - Calls per category (bar chart)
   - Time per user (bar chart)

### Sending Daily Report

**Automatic:**
- Reports are automatically sent at 6 PM IST (12:00 UTC) daily
- Sent to `hari@ocsindia.net`
- Includes all entries for the current date

**Manual:**
1. Navigate to `/:username/dashboard/dcr/admin`
2. Select a date
3. Click "Send Report Now"

## Database Schema

### dcr_entries

```sql
CREATE TABLE dcr_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    company VARCHAR(255),
    domain VARCHAR(255),
    contact_person VARCHAR(255),
    call_type ENUM('Inbound', 'Outbound') NOT NULL DEFAULT 'Inbound',
    category VARCHAR(50) NOT NULL,
    contact_number VARCHAR(20),
    description TEXT,
    time_spent_minutes INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dcr_timestamp (timestamp),
    INDEX idx_dcr_user_id (user_id),
    INDEX idx_dcr_domain (domain),
    INDEX idx_dcr_category (category)
);
```

### dcr_categories

Pre-seeded categories:
- Domain
- Email Issue
- GWS
- M365
- SSL
- Hosting
- Cloud Hosting
- Website
- Payments
- Renewal Followup
- Digital Marketing
- Enquiry
- Others

## Queue & Worker

### BullMQ Queue

The DCR report queue (`dcrDailyReport`) is configured with:
- Recurring job: `0 12 * * *` (12:00 UTC = 6 PM IST)
- Retry attempts: 3
- Exponential backoff: 5 minutes

### Worker

The DCR report worker:
- Processes jobs from the queue
- Generates charts using `chartjs-node-canvas`
- Formats HTML email with inline base64 images
- Sends email via configured provider
- Logs to `notification_logs` table

## Email Report Format

The daily email includes:

1. **Summary Box**
   - Total calls
   - Total time spent (hours and minutes)
   - Total users

2. **Charts (Base64 Images)**
   - Pie chart: Time spent per category
   - Bar chart: Number of calls per category
   - Bar chart: Time spent per user

3. **Detailed Tables**
   - All call entries grouped by user
   - Summary by user (calls, time)
   - Summary by category (calls, time)

## Monitoring

### Bull Board

Access queue monitoring at:
```
http://localhost:3000/admin/queues
```

View:
- Queue status
- Job history
- Failed jobs
- Recurring jobs

### Notification Logs

Check notification logs in Settings → Notification Logs to see:
- Report send status
- Success/failure
- Error messages

## Troubleshooting

### Report Not Sending

1. Check Redis connection
2. Verify worker is running (check server logs)
3. Check email provider configuration
4. View Bull Board for job status
5. Check notification logs for errors

### Charts Not Generating

1. Verify `chartjs-node-canvas` is installed
2. Check server logs for errors
3. Ensure sufficient memory for image generation

### Permission Issues

1. Verify user has correct role
2. Check role permissions in Settings → Roles
3. Ensure permissions migration ran successfully

## Development

### Testing Manual Report

```bash
curl -X POST http://localhost:3000/api/dcr/send-daily-report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-12-02"}'
```

### Testing Queue

```javascript
import { dcrDailyReportQueue } from './queues/queueConfig.js';

// Add test job
await dcrDailyReportQueue.add('test-report', { date: '2024-12-02' });
```

## Notes

- Time format: HH:MM (e.g., 01:30 = 1 hour 30 minutes)
- Users can only edit/delete their own entries (unless admin)
- Reports are sent to `hari@ocsindia.net` (configurable via `DAILY_REPORT_ADMIN_EMAIL`)
- Charts are generated server-side and embedded as base64 images in email
- CSV export includes all filtered entries

