import SubscriptionStatusWidget from './SubscriptionStatusWidget.jsx';
import RenewalsTimelineWidget from './RenewalsTimelineWidget.jsx';
import ExpiringSoonWidget from './ExpiringSoonWidget.jsx';
import DCRSummaryWidget from './DCRSummaryWidget.jsx';
import TeamDCRWidget from './TeamDCRWidget.jsx';
import DCRTrendsWidget from './DCRTrendsWidget.jsx';
import NotificationStatusWidget from './NotificationStatusWidget.jsx';
import QueueHealthWidget from './QueueHealthWidget.jsx';
import ActivityLogWidget from './ActivityLogWidget.jsx';
import BirthdayWidget from './BirthdayWidget.jsx';
import QuickActionsWidget from './QuickActionsWidget.jsx';

const WIDGET_COMPONENTS = {
    subscription_status: SubscriptionStatusWidget,
    renewals_timeline: RenewalsTimelineWidget,
    expiring_soon: ExpiringSoonWidget,
    dcr_summary: DCRSummaryWidget,
    team_dcr: TeamDCRWidget,
    dcr_trends: DCRTrendsWidget,
    notification_status: NotificationStatusWidget,
    queue_health: QueueHealthWidget,
    activity_log: ActivityLogWidget,
    birthdays: BirthdayWidget,
    quick_actions: QuickActionsWidget,
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

