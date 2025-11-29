# Frontend Implementation Notes

## Completed Components

### 1. Reminder Policies (`ReminderPolicies.jsx`)
- ✅ Full CRUD interface
- ✅ Policy list with search
- ✅ Offset management with drag-to-reorder (up/down buttons)
- ✅ Template key selection dropdown
- ✅ Active/inactive toggle for offsets
- ✅ Default policy protection
- ✅ Delete confirmation dialogs

### 2. Email Templates (`EmailTemplates.jsx`)
- ✅ Template list with search
- ✅ Template editor with HTML textarea
- ✅ Preview functionality with sample data
- ✅ Active/inactive toggle
- ✅ Template variable reference in UI
- ✅ Delete confirmation

### 3. Notification Logs (`NotificationLogs.jsx`)
- ✅ Filterable log viewer
- ✅ Filters: subscription_id, template_key, date range, status
- ✅ Pagination support
- ✅ Status badges with icons
- ✅ Error message display
- ✅ Provider ID display

### 4. Navigation Updates
- ✅ Added links to NavBar settings menu
- ✅ Permission-gated access
- ✅ Icons: Bell, Mail, FileText

### 5. Routes Configuration
- ✅ Added routes for all three components
- ✅ Permission gates configured
- ✅ Nested under settings

### 6. Subscription Form Updates
- ✅ Added `reminder_policy_id` to form state
- ✅ Fetches reminder policies on load
- ✅ Dropdown selector in subscription form
- ✅ Includes in save payload

## Required Dependencies

Add to `package.json`:

```json
"@radix-ui/react-checkbox": "^1.1.1"
```

Then run:
```bash
npm install
```

## Missing Components

### Checkbox Component
Created `components/ui/checkbox.jsx` - uses `@radix-ui/react-checkbox`

## UI Patterns Used

All components follow the existing design system:
- shadcn/ui components (Button, Input, Dialog, Select, etc.)
- Framer Motion for animations
- Toast notifications for feedback
- Permission-based access control
- Consistent styling with existing pages

## Testing Checklist

- [ ] Test Reminder Policies CRUD
- [ ] Test Email Templates CRUD and preview
- [ ] Test Notification Logs filtering
- [ ] Test subscription form with reminder policy selection
- [ ] Verify permissions work correctly
- [ ] Test navigation links

## Known Issues / TODO

1. **Checkbox dependency**: Need to install `@radix-ui/react-checkbox`
2. **Drag-to-reorder**: Currently using up/down buttons instead of true drag-and-drop (can be enhanced later)
3. **Template editor**: Using textarea instead of WYSIWYG editor (can be enhanced with Monaco or similar)
4. **Email preview**: Uses sample data - could be enhanced to use actual subscription data

## Integration Points

### Backend API Endpoints Used:
- `GET /api/reminder-policies`
- `POST /api/reminder-policies`
- `PUT /api/reminder-policies/:id`
- `DELETE /api/reminder-policies/:id`
- `GET /api/email-templates`
- `POST /api/email-templates`
- `PUT /api/email-templates/:id`
- `DELETE /api/email-templates/:id`
- `POST /api/email-templates/:id/preview`
- `GET /api/notification-logs`
- `PUT /api/subscriptions/:id` (with reminder_policy_id)

All endpoints are protected with RBAC permissions.

