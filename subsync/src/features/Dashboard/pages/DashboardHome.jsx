import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RefreshCw, LayoutGrid, Package, Phone, Target, BookOpen, HardDrive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/axiosInstance';

// Tab Components
import OverviewTab from '../components/tabs/OverviewTab';
import SubscriptionsTab from '../components/tabs/SubscriptionsTab';
import DCRTab from '../components/tabs/DCRTab';
import OpportunitiesTab from '../components/tabs/OpportunitiesTab';
import KnowledgeBaseTab from '../components/tabs/KnowledgeBaseTab';
import AssetsTab from '../components/tabs/AssetsTab';

const TAB_ICONS = {
    overview: LayoutGrid,
    subscriptions: Package,
    dcr: Phone,
    opportunities: Target,
    kb: BookOpen,
    assets: HardDrive,
};

const TAB_COMPONENTS = {
    overview: OverviewTab,
    subscriptions: SubscriptionsTab,
    dcr: DCRTab,
    opportunities: OpportunitiesTab,
    kb: KnowledgeBaseTab,
    assets: AssetsTab,
};

function DashboardHome() {
    const { user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dashboardConfig, setDashboardConfig] = useState({ tabs: [], widgets: [] });

    // Fetch dashboard config
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoading(true);
                const response = await api.get('/dashboard/config');
                setDashboardConfig(response.data || { tabs: [], widgets: [] });

                // Set active tab to first visible tab or saved preference
                const savedTab = localStorage.getItem('dashboard_active_tab');
                const visibleTabs = response.data?.tabs || [];

                if (savedTab && visibleTabs.some(t => t.tabKey === savedTab)) {
                    setActiveTab(savedTab);
                } else if (visibleTabs.length > 0) {
                    setActiveTab(visibleTabs[0].tabKey);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard config:', err);
                // Fallback to all tabs visible
                setDashboardConfig({
                    tabs: [
                        { tabKey: 'overview', name: 'Overview', icon: 'LayoutGrid' },
                        { tabKey: 'subscriptions', name: 'Subscriptions', icon: 'Package' },
                        { tabKey: 'assets', name: 'Assets', icon: 'HardDrive' },
                        { tabKey: 'dcr', name: 'DCR', icon: 'Phone' },
                        { tabKey: 'opportunities', name: 'Opportunities', icon: 'Target' },
                        { tabKey: 'kb', name: 'Knowledge Base', icon: 'BookOpen' },
                    ],
                    widgets: []
                });
                setActiveTab('overview');
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    // Save tab preference
    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        localStorage.setItem('dashboard_active_tab', tabKey);
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const visibleWidgets = useMemo(() => {
        return new Set(dashboardConfig.widgets || []);
    }, [dashboardConfig.widgets]);

    const renderTabContent = () => {
        const TabComponent = TAB_COMPONENTS[activeTab];
        if (!TabComponent) return null;

        return <TabComponent key={refreshKey} visibleWidgets={visibleWidgets} />;
    };

    if (loading) {
        return (
            <div className="min-h-screen dark:bg-slate-950 px-6 py-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-sm text-slate-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen  dark:bg-slate-950 px-6 py-8">
            <div className="max-w-[1800px] mx-auto space-y-8">
                {/* Welcome Header */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {getGreeting()}, <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">{user?.name || 'User'}</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                                Here's what's happening with your business today
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            className="h-12 w-12 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        >
                            <RefreshCw className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation */}
                {dashboardConfig.tabs.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 rounded-2xl w-fit shadow-sm">
                            {dashboardConfig.tabs.map((tab) => {
                                const Icon = TAB_ICONS[tab.tabKey] || LayoutGrid;
                                const isActive = activeTab === tab.tabKey;

                                return (
                                    <button
                                        key={tab.tabKey}
                                        onClick={() => handleTabChange(tab.tabKey)}
                                        className={cn(
                                            "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300",
                                            isActive
                                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{tab.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tab Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
}

export default DashboardHome;
