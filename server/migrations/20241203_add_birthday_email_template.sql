START TRANSACTION;

-- Insert birthday email template
INSERT INTO email_templates (template_key, name, subject, body_html, active)
SELECT 'birthday_wish', 'Birthday Wish', 'Happy Birthday {{name}}!', 
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 32px;">🎉 Happy Birthday! 🎉</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Dear {{name}},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
                On this special day, we want to take a moment to celebrate you! 
                {{#if isCustomer}}
                Thank you for being a valued customer and for your continued trust in our services.
                {{else}}
                Thank you for being an integral part of our team and for all your hard work and dedication.
                {{/if}}
            </p>
            <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 0;">
                    Wishing you a wonderful year ahead filled with joy, success, and happiness!
                </p>
            </div>
            <p style="font-size: 16px; margin-top: 30px;">
                Best regards,<br>
                <strong>The Subsync Team</strong>
            </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated birthday wish from Subsync</p>
        </div>
    </div>
</body>
</html>', 1
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE template_key = 'birthday_wish');

COMMIT;

