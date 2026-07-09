import { getDetailedReports, getEntriesForExport } from "../models/reportsModel.js";
import { format } from "date-fns";

/**
 * Generate heuristic insights, achievements, improvements and recommendations based on user time tracking data.
 * @param {Object} user - User profile object
 * @param {Object} reportsData - Detailed reports data for the user
 * @returns {Object} User insights structure
 */
export function generateUserInsights(user, reportsData) {
    const summary = reportsData.summary || {};
    const totalMinutes = parseInt(summary.total_minutes) || 0;
    const totalHours = parseFloat((totalMinutes / 60).toFixed(1));
    const billableMinutes = parseInt(summary.billable_minutes) || 0;
    const billableHours = parseFloat((billableMinutes / 60).toFixed(1));
    const billablePercent = totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0;
    const entryCount = parseInt(summary.total_entries) || 0;
    
    const byProject = reportsData.byProject || [];
    const byActivity = reportsData.byActivity || [];
    const byCustomer = reportsData.byCustomer || [];
    const dailyTrend = reportsData.dailyTrend || [];

    // Calculate active days & average hours
    const activeDays = dailyTrend.filter(d => d.total_minutes > 0).length || 1;
    const dailyAvgHours = parseFloat((totalHours / activeDays).toFixed(1));

    // Heuristics for Performance Score (0-100)
    const targetHoursPerDay = 8;
    const dailyConsistency = Math.max(0, 1 - Math.abs(dailyAvgHours - targetHoursPerDay) / targetHoursPerDay);
    const performanceScore = Math.min(100, Math.round(( (billableMinutes / (totalMinutes || 1)) * 60 + dailyConsistency * 40 )));

    // Determine Sentiment
    let sentiment = 'Neutral';
    let sentimentDescription = 'Consistent engagement with regular tracking habits.';
    if (totalHours > 0) {
        if (dailyAvgHours > 9.5) {
            sentiment = 'Burnout Risk';
            sentimentDescription = 'High daily working hours. Alert for fatigue and balance issues.';
        } else if (billablePercent > 75) {
            sentiment = 'Excellent';
            sentimentDescription = 'High billable efficiency and focused productivity.';
        } else if (billablePercent < 45 && totalHours > 15) {
            sentiment = 'Low Utilization';
            sentimentDescription = 'Considerable time allocated to internal administrative categories.';
        } else if (totalHours < 8) {
            sentiment = 'Low Engagement';
            sentimentDescription = 'Minimal activity tracked. Recommended check-in on log entries.';
        }
    }

    // Generate Achievements, Improvements, and Recommendations
    const achievements = [];
    const improvements = [];
    const recommendations = [];
    const timeline = [];

    if (totalHours > 0) {
        // Achievements
        achievements.push(`Tracked a total of ${totalHours} hours across ${entryCount} logs this period.`);
        if (billablePercent >= 60) {
            achievements.push(`Maintained a strong billable utilization rate of ${billablePercent}%.`);
        }
        if (byProject.length > 0) {
            achievements.push(`Successfully delivered contributions on ${byProject.length} active projects.`);
        }
        if (activeDays >= 4) {
            achievements.push(`Demonstrated consistent daily logging across ${activeDays} days.`);
        }

        // Improvements & Recommendations
        if (billablePercent < 50) {
            improvements.push(`High ratio of non-billable overhead tasks (${100 - billablePercent}% internal).`);
            recommendations.push("Review administrative tasks and meetings to identify automation or delegation opportunities.");
        }
        if (dailyAvgHours > 9.2) {
            improvements.push(`Extended working hours detected, averaging ${dailyAvgHours} hours/day.`);
            recommendations.push("Implement strict boundaries on daily hours and coordinate with lead to redistribute workload.");
        }
        
        // Find if they spent more than 25% of time in meetings/coordination
        const meetingCategory = byActivity.find(a => a.type_name?.toLowerCase().includes('meeting') || a.type_name?.toLowerCase().includes('call'));
        if (meetingCategory && (meetingCategory.total_minutes / totalMinutes) > 0.25) {
            const meetingPct = Math.round((meetingCategory.total_minutes / totalMinutes) * 100);
            improvements.push(`Significant time spent in communication or coordination categories (${meetingPct}% of total hours).`);
            recommendations.push("Audit recurring meetings and block focused focus-time slots on calendar.");
        }

        if (byProject.length > 3) {
            const smallProjects = byProject.filter(p => (p.total_minutes / totalMinutes) < 0.1);
            if (smallProjects.length >= 2) {
                improvements.push(`Fragmentation across multiple minor tasks (${smallProjects.length} projects each under 10% effort).`);
                recommendations.push("Consolidate minor tasks or allocate dedicated days to reduce context switching overhead.");
            }
        }

        // Default fallbacks
        if (improvements.length === 0) {
            improvements.push("No operational bottlenecks detected in logging habits.");
        }
        if (recommendations.length === 0) {
            recommendations.push("Continue current logging patterns and maintain established work-life balance.");
        }

        // Timeline Insights
        const primaryProject = byProject[0]?.project_name || 'Internal';
        const primaryProjectPct = byProject[0] ? Math.round((byProject[0].total_minutes / totalMinutes) * 100) : 0;
        timeline.push({
            date: format(new Date(), 'yyyy-MM-dd'),
            title: 'Primary Project Focus',
            category: 'Activity Summary',
            text: `Allocated largest share of effort to project '${primaryProject}' (${primaryProjectPct}% of total tracked time).`
        });
        if (billableHours > 0) {
            timeline.push({
                date: format(new Date(), 'yyyy-MM-dd'),
                title: 'Value Creation',
                category: 'Client Billing',
                text: `Contributed ${billableHours} hours of directly billable value across customer accounts.`
            });
        }
    } else {
        achievements.push("No time log entries registered during this period.");
        improvements.push("Missing tracking data for performance score calculation.");
        recommendations.push("Ensure all project contributions, meetings, and client support hours are logged in the time tracker.");
        timeline.push({
            date: format(new Date(), 'yyyy-MM-dd'),
            title: 'Awaiting logs',
            category: 'Status',
            text: 'User has no time log entries in the active period.'
        });
    }

    return {
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role || 'Member',
        department: user.teams?.map(t => t.name).join(', ') || 'General',
        performanceScore,
        sentiment,
        sentimentDescription,
        totalHours,
        billableHours,
        billablePercent,
        activeProjects: byProject.length,
        activeClients: byCustomer.length,
        entryCount,
        dailyAvgHours,
        achievements,
        improvements,
        recommendations,
        timeline,
        breakdowns: {
            byProject,
            byActivity,
            byCustomer,
            dailyTrend
        }
    };
}

/**
 * Compile detailed reports and compute insights for a group of users
 * @param {Array<Object>} users - List of user profiles
 * @param {Object} params - Query parameters (startDate, endDate, etc.)
 * @returns {Promise<Array<Object>>} Compiled list of user insights
 */
export async function compileUsersInsights(users, params) {
    const results = [];
    for (const user of users) {
        try {
            const reports = await getDetailedReports({
                userId: user.username,
                startDate: params.startDate,
                endDate: params.endDate,
                customerId: params.customerId,
                projectId: params.projectId,
                activityTypeId: params.activityTypeId,
                isBillable: params.isBillable
            });
            const rawLogs = await getEntriesForExport({
                userId: user.username,
                startDate: params.startDate,
                endDate: params.endDate,
                customerId: params.customerId,
                projectId: params.projectId,
                activityTypeId: params.activityTypeId,
                isBillable: params.isBillable
            });
            const userInsight = generateUserInsights(user, reports);
            userInsight.rawLogs = rawLogs || [];
            results.push(userInsight);
        } catch (err) {
            console.error(`Error compiling insights for user ${user.username}:`, err);
        }
    }
    return results;
}
