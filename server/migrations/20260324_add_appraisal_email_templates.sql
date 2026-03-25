-- Migration to add appraisal activation email template
INSERT INTO email_templates (template_key, name, subject, body_html, active)
VALUES (
    'appraisal_activated',
    'Appraisal Period Activated',
    'Appraisal Form Active - {{quarter}} {{year}}',
    '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appraisal Period Activated</title>
    <style>
        body { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; background-color: #f7fafc; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
        .content { padding: 40px; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #2d3748; }
        .message { font-size: 16px; color: #4a5568; margin-bottom: 24px; }
        .details-card { background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 32px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #edf2f7; padding-bottom: 12px; }
        .detail-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
        .label { font-size: 14px; font-weight: 600; color: #718096; text-transform: uppercase; }
        .value { font-size: 15px; font-weight: 500; color: #2d3748; }
        .button-container { text-align: center; margin-top: 32px; }
        .button { background-color: #4A90E2; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s; }
        .button:hover { background-color: #357ABD; }
        .footer { padding: 24px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Performance Appraisal</h1>
        </div>
        <div class="content">
            <div class="greeting">Hi {{name}},</div>
            <div class="message">
                We are pleased to announce that the performance appraisal cycle for <strong>{{quarter}} {{year}}</strong> is now active. This is an opportunity for you to reflect on your achievements and areas for growth.
            </div>
            
            <div class="details-card">
                <div class="detail-row">
                    <span class="label">Period</span>
                    <span class="value">{{quarter}} {{year}}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Start Date</span>
                    <span class="value">{{start_date}}</span>
                </div>
                <div class="detail-row">
                    <span class="label">End Date</span>
                    <span class="value">{{end_date}}</span>
                </div>
            </div>

            <div class="message">
                Please take a moment to fill out your self-appraisal form and submit it before the deadline.
            </div>

            <div class="button-container">
                <a href="{{appraisal_link}}" class="button">Start Self-Appraisal</a>
            </div>
        </div>
        <div class="footer">
            &copy; {{current_year}} Online Consultancy Services (OCS). All rights reserved.<br>
            If you have any questions, please contact the HR department.
        </div>
    </div>
</body>
</html>',
    1
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    subject = VALUES(subject),
    body_html = VALUES(body_html),
    active = VALUES(active),
    updated_at = CURRENT_TIMESTAMP;
