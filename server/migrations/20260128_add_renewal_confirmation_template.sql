-- Add renewal_confirmation email template
-- This migration adds a new email template for subscription renewal confirmations

START TRANSACTION;

INSERT INTO email_templates (template_key, name, subject, body_html, active)
SELECT 
    'renewal_confirmation', 
    'Renewal Confirmation', 
    '✅ Subscription Renewed Successfully - {{domain_name}}', 
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Renewed</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 40px;">
                ✅
            </div>
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Subscription Renewed!</h1>
            <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Your subscription has been successfully renewed</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                Dear {{customer_name}},
            </p>
            
            <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                Great news! Your subscription has been successfully renewed on <strong>{{renewal_date}}</strong>.
            </p>

            <!-- Subscription Details Box -->
            <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 15px; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Subscription Details</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Subscription ID:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: bold; text-align: right;">{{subscription_id}}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Domain:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: bold; text-align: right;">{{domain_name}}</td>
                    </tr>
                    {{#if old_end_date}}
                    <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Previous End Date:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280; text-decoration: line-through; text-align: right;">{{old_end_date}}</td>
                    </tr>
                    {{/if}}
                    <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">New End Date:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #10b981; font-weight: bold; text-align: right;">{{end_date}}</td>
                    </tr>
                    <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="padding: 12px 0; font-size: 16px; color: #111827; font-weight: bold;">Total Amount:</td>
                        <td style="padding: 12px 0; font-size: 18px; color: #10b981; font-weight: bold; text-align: right;">{{currency}} {{total}}</td>
                    </tr>
                </table>
            </div>

            <!-- Invoice Section -->
            <div style="margin: 30px 0;">
                {{{invoice_html}}}
            </div>

            <p style="margin: 30px 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                All pending reminder notifications have been cleared, and new reminders have been scheduled based on your updated subscription period.
            </p>

            <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                Thank you for your continued trust in our services!
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="{{renewal_link}}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                    View Subscription Details
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                Need help? Contact us at <a href="mailto:{{support_email}}" style="color: #10b981; text-decoration: none;">{{support_email}}</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © {{current_year}} {{company_name}}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>', 
    1
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE template_key = 'renewal_confirmation');

COMMIT;
