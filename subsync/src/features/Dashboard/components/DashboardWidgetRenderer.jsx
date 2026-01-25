import SubscriptionStatusWidget from './SubscriptionStatusWidget.jsx';
import RenewalsTimelineWidget from './RenewalsTimelineWidget.jsx';
import ExpiringSoonWidget from './ExpiringSoonWidget.jsx';
import NotificationStatusWidget from './NotificationStatusWidget.jsx';
import QueueHealthWidget from './QueueHealthWidget.jsx';
import ActivityLogWidget from './ActivityLogWidget.jsx';
import BirthdayWidget from './BirthdayWidget.jsx';
import QuickActionsWidget from './QuickActionsWidget.jsx';
import DCRWidget from './DCRWidget.jsx';
import {
    TodayTimeStatsWidget,
    WeekTimeStatsWidget,
    ActivityBreakdownWidget,
    ProductivityTrendWidget,
    TeamOverviewWidget,
    TopPerformersWidget
} from './TimeTrackingWidgets.jsx';

const WIDGET_COMPONENTS = {
    subscription_status: SubscriptionStatusWidget,
    renewals_timeline: RenewalsTimelineWidget,
    expiring_soon: ExpiringSoonWidget,
    notification_status: NotificationStatusWidget,
    queue_health: QueueHealthWidget,
    activity_log: ActivityLogWidget,
    birthdays: BirthdayWidget,
    quick_actions: QuickActionsWidget,
    dcr: DCRWidget,
    // Time Tracking widgets
    time_today_stats: TodayTimeStatsWidget,
    time_week_stats: WeekTimeStatsWidget,
    time_activity_breakdown: ActivityBreakdownWidget,
    time_productivity_trend: ProductivityTrendWidget,
    time_team_overview: TeamOverviewWidget,
    time_user_rankings: TopPerformersWidget,
};

function DashboardWidgetRenderer({ widgetKey, data }) {
    const WidgetComponent = WIDGET_COMPONENTS[widgetKey];

    if (!WidgetComponent) {
        console.warn(`Unknown widget key: ${widgetKey}`);
        return null;
    }

    return <WidgetComponent data={data} />;
}

export default DashboardWidgetRenderer;

