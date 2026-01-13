-- =============================================
-- Backup Email Templates Migration
-- Created: 2024-12-16
-- Description: Email templates for backup notifications
-- =============================================

-- Insert backup email templates
INSERT INTO email_templates (template_key, name, subject, body_html, active) VALUES

-- Success template
('backup_success', 'Backup Success Notification', 'Backup Completed Successfully - {{config_name}}', 
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">✅ Backup Completed Successfully</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #059669; margin-top: 0;">Backup Summary</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Configuration:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{config_name}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Database:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{database_name}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Started:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{started_at}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Completed:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{completed_at}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Duration:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{duration_seconds}} seconds</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">File Size:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{file_size_formatted}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; font-weight: bold;">Checksum:</td>
                    <td style="padding: 10px; font-family: monospace; font-size: 12px;">{{checksum}}</td>
                </tr>
            </table>
            
            <p style="margin-top: 30px; color: #666;">
                Your backup has been completed successfully and is securely stored. 
                This backup can be restored at any time from the Backup Management interface.
            </p>
            
            <p style="margin-top: 20px;">
                Best regards,<br>
                <strong>Subsync Backup System</strong>
            </p>
        </div>
    </div>
</body>
</html>', 1),

-- Failure template
('backup_failure', 'Backup Failure Alert', '⚠️ Backup Failed - {{config_name}}',
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">⚠️ Backup Failed</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #dc2626; margin-top: 0;">Backup Failure Alert</h2>
            
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Action Required</p>
                <p style="margin: 5px 0 0 0;">A backup operation has failed and requires immediate attention.</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Configuration:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{config_name}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Database:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{database_name}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Failed At:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{completed_at}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Retry Count:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{retry_count}}</td>
                </tr>
            </table>
            
            <div style="background: #fff; border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #dc2626;">Error Details:</h3>
                <p style="font-family: monospace; font-size: 13px; color: #666; margin: 0;">{{error_message}}</p>
            </div>
            
            <p style="margin-top: 30px; color: #666;">
                Please investigate this issue as soon as possible to ensure your data is properly backed up.
            </p>
            
            <p style="margin-top: 20px;">
                Best regards,<br>
                <strong>Subsync Backup System</strong>
            </p>
        </div>
    </div>
</body>
</html>', 1),

-- Restore template
('backup_restore', 'Backup Restore Notification', 'Database Restored from Backup - {{config_name}}',
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">🔄 Database Restored</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2563eb; margin-top: 0;">Restore Operation Completed</h2>
            
            <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Important Notice</p>
                <p style="margin: 5px 0 0 0;">A database restore operation has been performed.</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Backup:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{config_name}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Database:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{database_name}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Restored At:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{restored_at}}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Restored By:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{restored_by}}</td>
                </tr>
            </table>
            
            <p style="margin-top: 30px; color: #666;">
                The database has been successfully restored from the selected backup. 
                Please verify that all data is correct and functioning as expected.
            </p>
            
            <p style="margin-top: 20px;">
                Best regards,<br>
                <strong>Subsync Backup System</strong>
            </p>
        </div>
    </div>
</body>
</html>', 1);

-- Success message
SELECT 'Backup email templates created successfully!' as status;
SELECT COUNT(*) as backup_templates FROM email_templates WHERE template_key LIKE 'backup_%';
