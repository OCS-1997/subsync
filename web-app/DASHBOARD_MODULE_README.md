# Role-Based Dashboard Module - Implementation Guide

## Overview

This module implements a fully configurable, role-based dashboard system with dynamic widget rendering, birthday reminders, and comprehensive permission controls. The dashboard displays relevant information based on user roles and configurable widget visibility settings.

## Features

- **Role-Based Widget System**: Widgets are dynamically shown/hidden based on user role and permissions
- **11 Dashboard Widgets**: Comprehensive widgets covering subscriptions, DCR, notifications, birthdays, and more
- **Birthday Reminder System**: Automatic birthday tracking and email notifications for customers and internal users
- **Admin Widget Management**: UI for admins to configure which widgets are visible to each role
- **No Revenue KPIs**: All revenue-related metrics have been removed as requested
- **Queue Health Monitoring**: Real-time BullMQ queue status (admin only)

## Database Migrations

Run these migrations in order:

```bash
# 1. Dashboard widgets and permissions schema
mysql -u your_user -p your_database < server/migrations/20241203_dashboard_widgets_schema.sql

# 2. Birthday email template
mysql -u your_user -p your_database < server/migrations/20241203_add_birthday_email_template.sql
```

## Widgets Implemented

1. **SubscriptionStatusWidget** - Counts by status (active, soon expiring, expired, archived)
2. **RenewalsTimelineWidget** - Upcoming renewals (30/60/90 days)
3. **ExpiringSoonWidget** - Subscriptions expiring within 7 days
4. **DCRSummaryWidget** - Today's call register summary
5. **TeamDCRWidget** - Team performance metrics (admin/manager only)
6. **DCRTrendsWidget** - Call trends over last 30 days
7. **NotificationStatusWidget** - Email notification success/failure rates
8. **QueueHealthWidget** - BullMQ queue status (admin only)
9. **ActivityLogWidget** - Recent system activity
10. **BirthdayWidget** - Today and upcoming birthdays (next 7 days)
11. **QuickActionsWidget** - Role-based quick action buttons

## API Endpoints

### Dashboard Data
- `GET /api/dashboard` - Get dashboard data for current user (role-based)
- `GET /api/dashboard/birthdays` - Get upcoming birthdays
- `GET /api/dashboard/queue-health` - Get queue health (admin only)

### Widget Management (Admin Only)
- `GET /api/dashboard/widgets` - List all available widgets
- `GET /api/dashboard/widgets/permissions` - Get widget permissions matrix
- `POST /api/dashboard/widgets/permissions` - Update widget permissions

## Frontend Routes

- `/:username/dashboard` - Main dashboard (replaces old Home component)
- `/:username/dashboard/settings/widget-permissions` - Admin widget permissions management

## Role-Based Widget Visibility

### Default Permissions

**Admin**: Sees ALL widgets (cannot be modified)

**Manager**: 
- subscription_status
- renewals_timeline
- expiring_soon
- dcr_summary
- team_dcr
- notification_status
- birthdays
- quick_actions

**Sales**:
- subscription_status
- renewals_timeline
- expiring_soon
- dcr_summary
- dcr_trends
- birthdays
- quick_actions

**Support**:
- subscription_status
- expiring_soon
- dcr_summary
- dcr_trends
- birthdays
- quick_actions

**Viewer**:
- subscription_status
- renewals_timeline
- expiring_soon
- birthdays

## Birthday System

### Database Schema

The system tracks birthdays in two ways:
1. **Direct fields**: `users.date_of_birth` and `customers.date_of_birth`
2. **Birthdays table**: Consolidated table for easier querying

### Birthday Email Template

A default birthday email template (`birthday_wish`) is created with the migration. It supports:
- `{{name}}` - Person's name
- `{{email}}` - Person's email
- `{{isCustomer}}` - Boolean for customer vs user
- `{{isUser}}` - Boolean for user vs customer
- `{{type}}` - 'customer' or 'user'

### Automatic Birthday Emails

A cron job runs daily at 09:00 UTC (14:30 IST) to send birthday emails to:
- Internal users with `date_of_birth` set
- Customers with `date_of_birth` set

The system respects the `email_send` flag (if implemented in your user/customer data).

### Manual Birthday Sync

To sync birthdays from users/customers tables to the birthdays table:

```javascript
import { syncBirthdays } from './services/birthdayService.js';
await syncBirthdays();
```

## Admin Widget Permissions Management

1. Navigate to `Settings → Widget Permissions`
2. Toggle checkboxes to show/hide widgets for each role
3. Click "Save Changes" to apply
4. Changes take effect immediately for new dashboard loads

**Note**: Admin role always sees all widgets and cannot be modified.

## Quick Actions by Role

### Admin
- View Queues
- Send DCR Report
- View Notification Logs
- Manage Widgets

### Manager
- DCR Statistics
- Send DCR Report
- View Renewals

### Sales
- Add Subscription
- Log DCR Entry
- My Renewals

### Support
- Log DCR Entry
- View Subscriptions

### Viewer
- None (read-only access)

## Component Structure

```
src/features/Dashboard/
├── components/
│   ├── KPICard.jsx
│   ├── SubscriptionStatusWidget.jsx
│   ├── RenewalsTimelineWidget.jsx
│   ├── ExpiringSoonWidget.jsx
│   ├── DCRSummaryWidget.jsx
│   ├── TeamDCRWidget.jsx
│   ├── DCRTrendsWidget.jsx
│   ├── NotificationStatusWidget.jsx
│   ├── QueueHealthWidget.jsx
│   ├── ActivityLogWidget.jsx
│   ├── BirthdayWidget.jsx
│   ├── QuickActionsWidget.jsx
│   └── DashboardWidgetRenderer.jsx
├── pages/
│   ├── DashboardHome.jsx (main dashboard)
│   └── AdminWidgetPermissions.jsx
└── hooks/
    └── useDashboardData.js
```

## Usage Example

The dashboard automatically loads when users navigate to `/:username/dashboard`. The system:

1. Detects user role from JWT token
2. Fetches widget permissions for that role
3. Loads data for visible widgets only
4. Renders widgets in the configured order

## Customization

### Adding a New Widget

1. Create widget component in `components/`
2. Add to `WIDGET_COMPONENTS` in `DashboardWidgetRenderer.jsx`
3. Add widget entry to `dashboard_widgets` table
4. Add data fetching logic in `dashboardController.js`
5. Set default permissions in migration or admin UI

### Modifying Widget Order

Update `widget_order` in `dashboard_widgets` table or modify the migration.

## Testing

### Manual Testing

1. **Test Dashboard Loading**:
   ```bash
   # Login as different roles and verify correct widgets appear
   ```

2. **Test Widget Permissions**:
   - Login as admin
   - Navigate to Widget Permissions
   - Toggle permissions
   - Login as affected role and verify changes

3. **Test Birthday System**:
   - Add `date_of_birth` to a user or customer
   - Verify birthday appears in widget
   - Test email sending (check logs)

4. **Test Queue Health**:
   - Login as admin
   - Verify queue status appears
   - Check that non-admins don't see it

## Troubleshooting

### Widgets Not Appearing

1. Check user role in database
2. Verify widget permissions in `dashboard_widget_permissions` table
3. Check browser console for errors
4. Verify API endpoint returns correct data

### Birthday Emails Not Sending

1. Check cron job is running: `setupBirthdayCron()` in `reconciliationCron.js`
2. Verify email template exists: `SELECT * FROM email_templates WHERE template_key = 'birthday_wish'`
3. Check `email_send` flag in user/customer data
4. Review server logs for errors

### Queue Health Not Loading

1. Verify Redis connection
2. Check BullMQ queues are initialized
3. Verify admin role has access
4. Check browser console for errors

## Future Enhancements

- [ ] Widget drag-and-drop reordering
- [ ] Custom widget layouts per user
- [ ] Widget refresh intervals
- [ ] Birthday email customization per person
- [ ] Widget export/import functionality
- [ ] Real-time dashboard updates via WebSocket

## Support

For issues or questions, refer to the main project documentation or contact the development team.

