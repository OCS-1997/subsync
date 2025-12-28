-- Update email templates to use invoice-style rendering
START TRANSACTION;

UPDATE email_templates
SET body_html = '<html><body><div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;"><div style="padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; margin-bottom: 20px;"><h2 style="margin: 0 0 10px; color: #856404;">⚠️ Subscription Expiring Soon</h2><p style="margin: 0; color: #856404;">Your subscription will expire in <strong>{{days_left}}</strong> days. Please review the details below and renew to avoid service interruption.</p></div>{{{invoice_html}}}<div style="text-align: center; padding: 20px; background-color: #f9f9f9; margin-top: 20px;"><a href="{{renewal_link}}" style="display: inline-block; padding: 12px 24px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Renew Subscription</a></div><div style="text-align: center; padding: 20px; color: #666; font-size: 12px;"><p>Thank you for your business!</p><p>Support Team</p></div></div></body></html>'
WHERE template_key = 'before_30';

UPDATE email_templates
SET body_html = '<html><body><div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;"><div style="padding: 20px; background-color: #f8d7da; border-left: 4px solid #dc3545; margin-bottom: 20px;"><h2 style="margin: 0 0 10px; color: #721c24;">🚨 URGENT: Subscription Expiring in {{days_left}} Days</h2><p style="margin: 0; color: #721c24; font-weight: bold;">Immediate action required to avoid service disruption.</p></div>{{{invoice_html}}}<div style="text-align: center; padding: 20px; background-color: #f9f9f9; margin-top: 20px;"><a href="{{renewal_link}}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Renew Now</a></div><div style="text-align: center; padding: 20px; color: #666; font-size: 12px;"><p>Thank you for your business!</p><p>Support Team</p></div></div></body></html>'
WHERE template_key = 'before_7';

UPDATE email_templates
SET body_html = '<html><body><div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;"><div style="padding: 20px; background-color: #f8d7da; border-left: 4px solid #dc3545; margin-bottom: 20px;"><h2 style="margin: 0 0 10px; color: #721c24;">❌ Subscription Has Expired</h2><p style="margin: 0; color: #721c24;">Your subscription expired on <strong>{{end_date}}</strong>. Service has been discontinued. Please renew immediately to restore access.</p></div>{{{invoice_html}}}<div style="text-align: center; padding: 20px; background-color: #f9f9f9; margin-top: 20px;"><a href="{{renewal_link}}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Restore Service - Renew Now</a></div><div style="text-align: center; padding: 20px; color: #666; font-size: 12px;"><p>Thank you for your business!</p><p>Support Team</p></div></div></body></html>'
WHERE template_key = 'on_expiry';

UPDATE email_templates
SET body_html = '<html><body><div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;"><div style="padding: 20px; background-color: #f8d7da; border-left: 4px solid #dc3545; margin-bottom: 20px;"><h2 style="margin: 0 0 10px; color: #721c24;">⛔ Action Required: Subscription Expired {{days_left}} Days Ago</h2><p style="margin: 0; color: #721c24;">Your subscription has been expired for 7 days. Please renew immediately to restore service and prevent data loss.</p></div>{{{invoice_html}}}<div style="text-align: center; padding: 20px; background-color: #f9f9f9; margin-top: 20px;"><a href="{{renewal_link}}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Renew Immediately</a></div><div style="text-align: center; padding: 20px; color: #666; font-size: 12px;"><p>Thank you for your business!</p><p>Support Team</p></div></div></body></html>'
WHERE template_key = 'after_7';

UPDATE email_templates
SET body_html = '<html><body><div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;"><div style="padding: 20px; background-color: #d1ecf1; border-left: 4px solid #17a2b8; margin-bottom: 20px;"><h2 style="margin: 0 0 10px; color: #0c5460;">✅ Subscription Renewed Successfully</h2><p style="margin: 0; color: #0c5460;">Your subscription has been renewed. Thank you for your continued business!</p></div>{{{invoice_html}}}<div style="text-align: center; padding: 20px; color: #666; font-size: 12px;"><p>Thank you for your business!</p><p>Support Team</p></div></div></body></html>'
WHERE template_key = 'renewal_invoice';

COMMIT;
