# Subscription Reminder & Details Enhancement Implementation Plan

**Date:** December 28, 2025  
**Complexity:** High  
**Estimated Implementation Time:** 2-3 hours

---

## Objectives

### 1. Enable Send Reminder Functionality
- Add "Send Reminder" button/action to subscription list and details page
- Integrate with existing reminder service
- Show confirmation dialog before sending
- Display success/error feedback
- Log reminder sends to notification_logs

### 2. Enhanced Subscription Details View
- Display ALL available subscription data in organized sections
- Include financial breakdown
- Show billing cycle information
- Display reminder policy details
- Show subscription history timeline
- Add email recipients list  
- Display terms & conditions

---

## Files to Modify

### Frontend
1. `ListSubscriptions.jsx` - Add send reminder action
2. `ViewSubscription.jsx` - Enhance details display + send reminder button
3. `ViewSubscriptionPage.jsx` - Update data fetching if needed

### Backend
4. `appRoutes.js` - Add send reminder endpoint (if not exists)
5. `subscriptionReminderController.js` - Add manual send reminder function
6. `reminderService.js` - Ensure manual trigger support

---

## Implementation Steps

### Phase 1: Backend - Send Reminder Endpoint ✅

**File:** `server/routes/appRoutes.js`
```javascript
// Add route
router.post('/subscriptions/:id/send-reminder', 
  isAuthenticated, 
  authorize(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  sendManualReminderController
);
```

**File:** `server/controllers/subscriptionReminderController.js`
```javascript
export const sendManualReminderController = async (req, res) => {
  try {
    const { id } = req.params;
    const { template_key } = req.body; // optional, defaults to appropriate template
    
    // Validate subscription exists and is active
    const subscription = await getSubscriptionById(id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Send reminder
    const result = await sendReminderEmail(id, template_key || 'manual_reminder', new Date());
    
    if (result.success) {
      // Log activity
      await logActivity({
        username: req.user.username,
        action: 'SEND_MANUAL_REMINDER',
        resourceType: 'Subscription',
        resourceId: id,
        ipAddress: req.ip
      });
      
      res.json({ 
        success: true, 
        message: 'Reminder sent successfully',
        providerId: result.providerId 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error sending manual reminder:', error);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
};
```

### Phase 2: Frontend - Send Reminder Button (List View)

**File:** `ListSubscriptions.jsx`

Add action menu item:
```jsx
<DropdownMenuItem onClick={() => handleSendReminder(subscription.sub_id)}>
  <Mail className="w-4 h-4 mr-2" />
  Send Reminder
</DropdownMenuItem>
```

Add handler:
```jsx
const handleSendReminder = async (subId) => {
  if (!confirm('Send reminder email for this subscription?')) return;
  
  try {
    await api.post(`/subscriptions/${subId}/send-reminder`);
    toast.success('Reminder sent successfully!');
  } catch (error) {
    toast.error(error.response?.data?.error || 'Failed to send reminder');
  }
};
```

### Phase 3: Enhanced Subscription Details View

**File:** `ViewSubscription.jsx`

Current sections:
- Basic Info
- Subscription Items
- Payment Info

NEW sections to add:
1. **Header Actions** - Add "Send Reminder" button
2. **Financial Summary Card** - Detailed breakdown
3. **Billing Cycle Card** - Dates, renewal info
4. **Reminder Policy Card** - Show assigned policy
5. **Email Recipients Card** - List all recipients
6. **Notes & Terms Card** - T&C and notes
7. **Status Timeline** - Subscription history

**Enhanced Layout Structure:**
```jsx
<div className="space-y-6">
  {/* Header with Actions */}
  <div className="flex justify-between items-center">
    <h2>Subscription Details</h2>
    <div className="flex gap-2">
      <Button onClick={handleSendReminder}>
        <Mail className="w-4 h-4 mr-2" />
        Send Reminder
      </Button>
      {showActions && (
        <>
          <Button onClick={onEdit}>Edit</Button>
          <Button variant="destructive" onClick={onDelete}>Delete</Button>
        </>
      )}
    </div>
  </div>

  {/* Info Grid - Row 1 */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card>/* Subscription Info */</Card>
    <Card>/* Customer Info */</Card>
    <Card>/* Status & Dates */</Card>
  </div>

  {/* Financial Summary - Row 2 */}
  <Card>
    <CardHeader>
      <CardTitle>Financial Summary</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{currency} {subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax Total</span>
          <span>{currency} {tax_total}</span>
        </div>
        {discount_value > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount ({discount_type})</span>
            <span>- {currency} {discount_value}</span>
          </div>
        )}
        {rounding !== 0 && (
          <div className="flex justify-between">
            <span>Rounding</span>
            <span>{currency} {rounding}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Grand Total</span>
          <span>{currency} {total}</span>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Subscription Items Table */}
  <Card>/* Existing items table */</Card>

  {/* Additional Info Grid - Row 3 */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card>
      <CardHeader>
        <CardTitle>Billing Cycle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <p className="font-medium">{billing_cycle_type}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Repeat:</span>
            <p className="font-medium">
              {never_expires ? 'Never Expires' : `Every ${repeat_every_value} ${repeat_every_unit}`}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Start Date:</span>
            <p className="font-medium">{formatDate(start_date)}</p>
          </div>
          {end_date && (
            <div>
              <span className="text-muted-foreground">End Date:</span>
              <p className="font-medium">{formatDate(end_date)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Email Recipients</CardTitle>
      </CardHeader>
      <CardContent>
        {email_list && email_list.length > 0 ? (
          <ul className="space-y-1">
            {email_list.map((email, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{email}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No custom recipients. Using customer email.</p>
        )}
      </CardContent>
    </Card>
  </div>

  {/* Notes & Terms */}
  {(notes || terms_and_conditions) && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{notes}</p>
          </CardContent>
        </Card>
      )}
      {terms_and_conditions && (
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{terms_and_conditions}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )}
</div>
```

---

## Testing Checklist

### Send Reminder Feature
- [ ] Send reminder from list view
- [ ] Send reminder from details view
- [ ] Verify email is sent
- [ ] Check notification_logs entry created
- [ ] Test with subscription that has no email
- [ ] Test with archived subscription (should fail or warn)
- [ ] Verify activity log entry

### Enhanced Details View
- [ ] All fields display correctly
- [ ] Financial calculations are accurate
- [ ] Billing cycle info shows properly
- [ ] Email list displays
- [ ] Notes/terms display when present
- [ ] Layout is responsive
- [ ] No data shows proper "N/A" or empty states

---

## Permissions Required

```javascript
PERMISSIONS.SUBSCRIPTIONS_VIEW - To view details
PERMISSIONS.SUBSCRIPTIONS_MANAGE - To send reminders
```

---

## Database Schema Reference

### subscriptions table fields:
- sub_id, customer_id, domain_name
- start_date, end_date, never_expires
- repeat_every_value, repeat_every_unit
- billing_cycle_type
- currency, subtotal, tax_total
- discount_type, discount_value
- rounding, total
- notes, terms_and_conditions
- email_list (JSON)
- status, reminder_policy_id
- archived_at, created_at, updated_at

---

**Next Steps:**
1. Implement backend endpoint
2. Add frontend send reminder buttons
3. Enhance ViewSubscription.jsx layout
4. Test all functionality
5. Update documentation

