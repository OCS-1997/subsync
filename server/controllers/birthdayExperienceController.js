import appDB from "../db/subsyncDB.js";
import { formatMySQLDate } from "../utils/dateFormatter.js";

/**
 * GET /api/birthday-experience/settings
 * Get global birthday experience configuration
 */
export const getAdminSettings = async (req, res) => {
    try {
        const [rows] = await appDB.query("SELECT * FROM birthday_admin_settings LIMIT 1");
        if (rows.length === 0) {
            const defaultSettings = {
                enabled: 1,
                enable_theme: 1,
                enable_confetti: 1,
                enable_dashboard_hero: 1,
                animation_duration: 6,
                company_greeting: "Thank you for everything you do. We hope this year brings new opportunities, great achievements, good health, and continued success. Have an amazing birthday!",
                enable_birthday_badge: 1,
                enable_team_notification: 1
            };
            return res.json({ success: true, settings: defaultSettings });
        }

        const settings = {
            enabled: !!rows[0].enabled,
            enable_theme: !!rows[0].enable_theme,
            enable_confetti: !!rows[0].enable_confetti,
            enable_dashboard_hero: !!rows[0].enable_dashboard_hero,
            animation_duration: rows[0].animation_duration || 6,
            company_greeting: rows[0].company_greeting || "",
            enable_birthday_badge: !!rows[0].enable_birthday_badge,
            enable_team_notification: !!rows[0].enable_team_notification,
            updated_at: rows[0].updated_at
        };

        res.json({ success: true, settings });
    } catch (error) {
        console.error("Error getting birthday admin settings:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to fetch birthday settings" });
    }
};

/**
 * PUT /api/birthday-experience/settings
 * Update global birthday experience configuration (Admin only)
 */
export const updateAdminSettings = async (req, res) => {
    try {
        const {
            enabled = true,
            enable_theme = true,
            enable_confetti = true,
            enable_dashboard_hero = true,
            animation_duration = 6,
            company_greeting = "",
            enable_birthday_badge = true,
            enable_team_notification = true
        } = req.body;

        const [rows] = await appDB.query("SELECT COUNT(*) as count FROM birthday_admin_settings");

        if (rows[0].count === 0) {
            await appDB.query(
                `INSERT INTO birthday_admin_settings 
                 (enabled, enable_theme, enable_confetti, enable_dashboard_hero, animation_duration, company_greeting, enable_birthday_badge, enable_team_notification)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    enabled ? 1 : 0,
                    enable_theme ? 1 : 0,
                    enable_confetti ? 1 : 0,
                    enable_dashboard_hero ? 1 : 0,
                    animation_duration,
                    company_greeting,
                    enable_birthday_badge ? 1 : 0,
                    enable_team_notification ? 1 : 0
                ]
            );
        } else {
            await appDB.query(
                `UPDATE birthday_admin_settings 
                 SET enabled = ?, enable_theme = ?, enable_confetti = ?, enable_dashboard_hero = ?, animation_duration = ?, company_greeting = ?, enable_birthday_badge = ?, enable_team_notification = ?
                 WHERE id = 1`,
                [
                    enabled ? 1 : 0,
                    enable_theme ? 1 : 0,
                    enable_confetti ? 1 : 0,
                    enable_dashboard_hero ? 1 : 0,
                    animation_duration,
                    company_greeting,
                    enable_birthday_badge ? 1 : 0,
                    enable_team_notification ? 1 : 0
                ]
            );
        }

        res.json({ success: true, message: "Birthday settings updated successfully" });
    } catch (error) {
        console.error("Error updating birthday admin settings:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to update birthday settings" });
    }
};

/**
 * GET /api/birthday-experience/today-team
 * Get employees celebrating their birthday today
 */
export const getTodayTeamBirthdays = async (req, res) => {
    try {
        const [rows] = await appDB.query(
            `SELECT username, name, email, date_of_birth, role 
             FROM users 
             WHERE date_of_birth IS NOT NULL 
               AND is_active = 1
               AND MONTH(date_of_birth) = MONTH(CURRENT_DATE())
               AND DAY(date_of_birth) = DAY(CURRENT_DATE())`
        );

        const birthdays = rows.map(r => ({
            username: r.username,
            name: r.name,
            email: r.email,
            date_of_birth: formatMySQLDate(r.date_of_birth),
            role: r.role
        }));

        res.json({ success: true, birthdays });
    } catch (error) {
        console.error("Error fetching today's team birthdays:", error);
        res.status(500).json({ success: false, error: error.message || "Failed to fetch today's team birthdays" });
    }
};
