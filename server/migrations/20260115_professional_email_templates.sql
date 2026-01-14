-- Migration: Add renewal_reminder template and update existing templates to be more professional
-- This migration adds the missing renewal_reminder template and updates all templates with professional styling

START TRANSACTION;

-- Add renewal_reminder template (the default manual reminder template)
INSERT INTO email_templates (template_key, name, subject, body_html, active)
SELECT 'renewal_reminder', 'Manual Renewal Reminder', 'Subscription Renewal Reminder - Action Required',
'<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Renewal Reminder</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f7fa; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa; padding: 40px 20px;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 40px 30px; text-align:center;">
<h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">Subscription Renewal Reminder</h1>
<p style="margin:10px 0 0; color:rgba(255,255,255,0.9); font-size:14px;">Action required for your subscription</p>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding: 40px;">
<p style="margin:0 0 20px; color:#334155; font-size:16px; line-height:1.6;">Dear <strong style="color:#0f172a;">{{customer_name}}</strong>,</p>
<p style="margin:0 0 25px; color:#334155; font-size:16px; line-height:1.6;">This is a reminder regarding your subscription. Please review the details below and take necessary action to ensure uninterrupted service.</p>

<!-- Subscription Details Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border-radius:12px; margin:25px 0;">
<tr>
<td style="padding:24px;">
<h3 style="margin:0 0 16px; color:#0f172a; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Subscription Details</h3>
<table width="100%" style="font-size:14px;">
<tr>
<td style="padding:8px 0; color:#64748b; width:140px;">Subscription ID:</td>
<td style="padding:8px 0; color:#0f172a; font-weight:600;">{{subscription_id}}</td>
</tr>
<tr>
<td style="padding:8px 0; color:#64748b;">Domain:</td>
<td style="padding:8px 0; color:#0f172a; font-weight:600;">{{domain_name}}</td>
</tr>
<tr>
<td style="padding:8px 0; color:#64748b;">Expiry Date:</td>
<td style="padding:8px 0; color:#ef4444; font-weight:600;">{{end_date}}</td>
</tr>
<tr>
<td style="padding:8px 0; color:#64748b;">Days Remaining:</td>
<td style="padding:8px 0; color:#f59e0b; font-weight:700;">{{days_left}} days</td>
</tr>
</table>
</td>
</tr>
</table>

<!-- Items Table -->
{{#if items_table_html}}
<div style="margin:25px 0;">
<h3 style="margin:0 0 16px; color:#0f172a; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Services Included</h3>
{{{items_table_html}}}
</div>
{{/if}}

<!-- Total -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #059669 0%, #047857 100%); border-radius:12px; margin:25px 0;">
<tr>
<td style="padding:20px 24px;">
<table width="100%">
<tr>
<td style="color:rgba(255,255,255,0.9); font-size:14px;">Total Amount</td>
<td align="right" style="color:#ffffff; font-size:24px; font-weight:700;">{{currency}} {{total}}</td>
</tr>
</table>
</td>
</tr>
</table>

<p style="margin:25px 0 0; color:#334155; font-size:16px; line-height:1.6;">Please renew your subscription to ensure continued access to all services. If you have any questions, feel free to contact our support team.</p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#f8fafc; padding:30px 40px; border-top:1px solid #e2e8f0;">
<p style="margin:0; color:#64748b; font-size:12px; text-align:center;">This is an automated reminder from your subscription management system.</p>
<p style="margin:10px 0 0; color:#94a3b8; font-size:11px; text-align:center;">© {{current_year}} Your Company. All rights reserved.</p>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>', 1
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE template_key = 'renewal_reminder');

-- Update before_30 template with professional styling
UPDATE email_templates SET body_html = 
'<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f7fa; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa; padding: 40px 20px;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
<tr>
<td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align:center;">
<h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">30-Day Renewal Notice</h1>
<p style="margin:10px 0 0; color:rgba(255,255,255,0.9); font-size:14px;">Your subscription expires in 30 days</p>
</td>
</tr>
<tr>
<td style="padding: 40px;">
<p style="margin:0 0 20px; color:#334155; font-size:16px; line-height:1.6;">Dear <strong>{{customer_name}}</strong>,</p>
<p style="margin:0 0 25px; color:#334155; font-size:16px; line-height:1.6;">This is a friendly reminder that your subscription will expire in <strong style="color:#f59e0b;">{{days_left}} days</strong>.</p>
<table width="100%" style="background-color:#f8fafc; border-radius:12px; margin:25px 0;">
<tr><td style="padding:24px;">
<table width="100%" style="font-size:14px;">
<tr><td style="padding:8px 0; color:#64748b;">Subscription ID:</td><td style="color:#0f172a; font-weight:600;">{{subscription_id}}</td></tr>
<tr><td style="padding:8px 0; color:#64748b;">Domain:</td><td style="color:#0f172a; font-weight:600;">{{domain_name}}</td></tr>
<tr><td style="padding:8px 0; color:#64748b;">Expiry Date:</td><td style="color:#ef4444; font-weight:600;">{{end_date}}</td></tr>
<tr><td style="padding:8px 0; color:#64748b;">Amount Due:</td><td style="color:#059669; font-weight:700;">{{currency}} {{total}}</td></tr>
</table>
</td></tr>
</table>
{{#if items_table_html}}<div style="margin:25px 0;">{{{items_table_html}}}</div>{{/if}}
<p style="margin:25px 0 0; color:#334155;">Renew now to ensure uninterrupted service. Thank you for your continued trust.</p>
</td>
</tr>
<tr><td style="background-color:#f8fafc; padding:20px 40px; text-align:center;"><p style="margin:0; color:#94a3b8; font-size:11px;">© {{current_year}} Your Company</p></td></tr>
</table>
</td>
</tr>
</table>
</body>
</html>'
WHERE template_key = 'before_30';

-- Update before_7 template
UPDATE email_templates SET body_html = 
'<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f7fa; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa; padding: 40px 20px;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
<tr>
<td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align:center;">
<h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">⚠️ Urgent: 7 Days Left</h1>
<p style="margin:10px 0 0; color:rgba(255,255,255,0.9); font-size:14px;">Your subscription expires very soon</p>
</td>
</tr>
<tr>
<td style="padding: 40px;">
<p style="margin:0 0 20px; color:#334155; font-size:16px; line-height:1.6;">Dear <strong>{{customer_name}}</strong>,</p>
<p style="margin:0 0 25px; color:#334155; font-size:16px; line-height:1.6;"><strong style="color:#dc2626;">URGENT:</strong> Your subscription will expire in just <strong style="color:#dc2626;">{{days_left}} days</strong>. Please renew immediately to avoid service interruption.</p>
<table width="100%" style="background-color:#fef3c7; border-radius:12px; border: 2px solid #f59e0b; margin:25px 0;">
<tr><td style="padding:24px;">
<table width="100%" style="font-size:14px;">
<tr><td style="padding:8px 0; color:#92400e;">Subscription ID:</td><td style="color:#78350f; font-weight:600;">{{subscription_id}}</td></tr>
<tr><td style="padding:8px 0; color:#92400e;">Domain:</td><td style="color:#78350f; font-weight:600;">{{domain_name}}</td></tr>
<tr><td style="padding:8px 0; color:#92400e;">Expiry Date:</td><td style="color:#dc2626; font-weight:700;">{{end_date}}</td></tr>
<tr><td style="padding:8px 0; color:#92400e;">Amount Due:</td><td style="color:#059669; font-weight:700;">{{currency}} {{total}}</td></tr>
</table>
</td></tr>
</table>
{{#if items_table_html}}<div style="margin:25px 0;">{{{items_table_html}}}</div>{{/if}}
<p style="margin:25px 0 0; color:#334155;">Please renew immediately to avoid any service disruption. Contact us if you need assistance.</p>
</td>
</tr>
<tr><td style="background-color:#f8fafc; padding:20px 40px; text-align:center;"><p style="margin:0; color:#94a3b8; font-size:11px;">© {{current_year}} Your Company</p></td></tr>
</table>
</td>
</tr>
</table>
</body>
</html>'
WHERE template_key = 'before_7';

-- Update on_expiry template
UPDATE email_templates SET body_html = 
'<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f7fa; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa; padding: 40px 20px;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
<tr>
<td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px; text-align:center;">
<h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">🚨 Subscription Expired</h1>
<p style="margin:10px 0 0; color:rgba(255,255,255,0.9); font-size:14px;">Your subscription has expired today</p>
</td>
</tr>
<tr>
<td style="padding: 40px;">
<p style="margin:0 0 20px; color:#334155; font-size:16px; line-height:1.6;">Dear <strong>{{customer_name}}</strong>,</p>
<p style="margin:0 0 25px; color:#334155; font-size:16px; line-height:1.6;">Your subscription has <strong style="color:#dc2626;">expired today</strong>. Your services may be interrupted. Please renew immediately to restore access.</p>
<table width="100%" style="background-color:#fef2f2; border-radius:12px; border: 2px solid #dc2626; margin:25px 0;">
<tr><td style="padding:24px;">
<table width="100%" style="font-size:14px;">
<tr><td style="padding:8px 0; color:#991b1b;">Subscription ID:</td><td style="color:#7f1d1d; font-weight:600;">{{subscription_id}}</td></tr>
<tr><td style="padding:8px 0; color:#991b1b;">Domain:</td><td style="color:#7f1d1d; font-weight:600;">{{domain_name}}</td></tr>
<tr><td style="padding:8px 0; color:#991b1b;">Expired On:</td><td style="color:#dc2626; font-weight:700;">{{end_date}}</td></tr>
<tr><td style="padding:8px 0; color:#991b1b;">Amount Due:</td><td style="color:#059669; font-weight:700;">{{currency}} {{total}}</td></tr>
</table>
</td></tr>
</table>
{{#if items_table_html}}<div style="margin:25px 0;">{{{items_table_html}}}</div>{{/if}}
<p style="margin:25px 0 0; color:#334155;">Renew now to restore your services immediately. Contact us if you have any questions.</p>
</td>
</tr>
<tr><td style="background-color:#f8fafc; padding:20px 40px; text-align:center;"><p style="margin:0; color:#94a3b8; font-size:11px;">© {{current_year}} Your Company</p></td></tr>
</table>
</td>
</tr>
</table>
</body>
</html>'
WHERE template_key = 'on_expiry';

-- Update after_7 template
UPDATE email_templates SET body_html = 
'<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f7fa; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa; padding: 40px 20px;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
<tr>
<td style="background: linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%); padding: 40px; text-align:center;">
<h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">❌ Service Suspended</h1>
<p style="margin:10px 0 0; color:rgba(255,255,255,0.9); font-size:14px;">Action required - Expired 7+ days ago</p>
</td>
</tr>
<tr>
<td style="padding: 40px;">
<p style="margin:0 0 20px; color:#334155; font-size:16px; line-height:1.6;">Dear <strong>{{customer_name}}</strong>,</p>
<p style="margin:0 0 25px; color:#334155; font-size:16px; line-height:1.6;">Your subscription expired <strong style="color:#dc2626;">7 days ago</strong> and your services have been suspended. Immediate action is required to restore access.</p>
<table width="100%" style="background-color:#fef2f2; border-radius:12px; border: 2px solid #7f1d1d; margin:25px 0;">
<tr><td style="padding:24px;">
<table width="100%" style="font-size:14px;">
<tr><td style="padding:8px 0; color:#991b1b;">Subscription ID:</td><td style="color:#7f1d1d; font-weight:600;">{{subscription_id}}</td></tr>
<tr><td style="padding:8px 0; color:#991b1b;">Domain:</td><td style="color:#7f1d1d; font-weight:600;">{{domain_name}}</td></tr>
<tr><td style="padding:8px 0; color:#991b1b;">Expired On:</td><td style="color:#dc2626; font-weight:700;">{{end_date}}</td></tr>
<tr><td style="padding:8px 0; color:#991b1b;">Overdue By:</td><td style="color:#dc2626; font-weight:700;">7+ days</td></tr>
<tr><td style="padding:8px 0; color:#991b1b;">Amount Due:</td><td style="color:#059669; font-weight:700;">{{currency}} {{total}}</td></tr>
</table>
</td></tr>
</table>
{{#if items_table_html}}<div style="margin:25px 0;">{{{items_table_html}}}</div>{{/if}}
<p style="margin:25px 0 0; color:#dc2626; font-weight:600;">Please renew immediately to avoid permanent data deletion. Contact support if you need assistance.</p>
</td>
</tr>
<tr><td style="background-color:#f8fafc; padding:20px 40px; text-align:center;"><p style="margin:0; color:#94a3b8; font-size:11px;">© {{current_year}} Your Company</p></td></tr>
</table>
</td>
</tr>
</table>
</body>
</html>'
WHERE template_key = 'after_7';

-- Update renewal_invoice template
UPDATE email_templates SET body_html = 
'<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f7fa; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa; padding: 40px 20px;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
<tr>
<td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px; text-align:center;">
<h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">✅ Renewal Invoice</h1>
<p style="margin:10px 0 0; color:rgba(255,255,255,0.9); font-size:14px;">Thank you for renewing your subscription</p>
</td>
</tr>
<tr>
<td style="padding: 40px;">
<p style="margin:0 0 20px; color:#334155; font-size:16px; line-height:1.6;">Dear <strong>{{customer_name}}</strong>,</p>
<p style="margin:0 0 25px; color:#334155; font-size:16px; line-height:1.6;">Thank you for renewing your subscription! Your invoice is attached below.</p>
<table width="100%" style="background-color:#ecfdf5; border-radius:12px; border: 2px solid #059669; margin:25px 0;">
<tr><td style="padding:24px;">
<table width="100%" style="font-size:14px;">
<tr><td style="padding:8px 0; color:#047857;">Subscription ID:</td><td style="color:#064e3b; font-weight:600;">{{subscription_id}}</td></tr>
<tr><td style="padding:8px 0; color:#047857;">Domain:</td><td style="color:#064e3b; font-weight:600;">{{domain_name}}</td></tr>
<tr><td style="padding:8px 0; color:#047857;">New Expiry Date:</td><td style="color:#059669; font-weight:700;">{{end_date}}</td></tr>
</table>
</td></tr>
</table>
{{#if items_table_html}}<div style="margin:25px 0;">{{{items_table_html}}}</div>{{/if}}
<table width="100%" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius:12px; margin:25px 0;">
<tr><td style="padding:20px 24px;"><table width="100%"><tr><td style="color:rgba(255,255,255,0.9); font-size:14px;">Total Paid</td><td align="right" style="color:#ffffff; font-size:24px; font-weight:700;">{{currency}} {{total}}</td></tr></table></td></tr>
</table>
<p style="margin:25px 0 0; color:#334155;">Thank you for your continued business. If you have any questions, please contact our support team.</p>
</td>
</tr>
<tr><td style="background-color:#f8fafc; padding:20px 40px; text-align:center;"><p style="margin:0; color:#94a3b8; font-size:11px;">© {{current_year}} Your Company</p></td></tr>
</table>
</td>
</tr>
</table>
</body>
</html>'
WHERE template_key = 'renewal_invoice';

COMMIT;
