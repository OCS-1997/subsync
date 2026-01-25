import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Clock, Timer, LayoutGrid, Tag, PieChart as PieChartIcon, Briefcase, Plus } from 'lucide-react';
import TimerWidget from '../components/TimerWidget';
import TimeEntryForm from '../components/TimeEntryForm';
import TimeEntriesList from '../components/TimeEntriesList';
import ProjectManagement from '../components/ProjectManagement';
import CategoryManagement from '../components/CategoryManagement';
import TimeTrackingReports from './TimeTrackingReports';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { PERMISSIONS } from '@/constants/permissions';
import PermissionGate from '@/components/auth/PermissionGate';

const TimeTracking = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editingEntry, setEditingEntry] = useState(null);
    const [activeTab, setActiveTab] = useState('track');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [customersRes, projectsRes, categoriesRes] = await Promise.all([
                api.get('/all-customers?limit=1000'), // Request all customers with high limit
                api.get('/time-tracking/projects'),
                api.get('/time-tracking/categories')
            ]);
            setCustomers(customersRes.data.customers || []);
            setProjects(projectsRes.data.projects || []);
            setCategories(categoriesRes.data.categories || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleTimeEntrySubmit = async (entryData, isTimer = false) => {
        try {
            if (isTimer) {
                await api.post('/time-tracking/timer/start', entryData);
                toast.success('Timer started successfully');
            } else {
                if (editingEntry) {
                    await api.put(`/time-tracking/entries/${editingEntry.entry_id}`, entryData);
                    toast.success('Time entry updated');
                    setEditingEntry(null);
                } else {
                    await api.post('/time-tracking/entries', entryData);
                    toast.success('Time entry saved');
                }
            }
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error saving time entry:', error);
            toast.error(error.response?.data?.error || 'Failed to save time entry');
        }
    };

    const handleTimerUpdate = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        const handleCustomUpdate = () => {
            fetchData();
            setRefreshKey(prev => prev + 1);
        };

        window.addEventListener('timeTrackingUpdated', handleCustomUpdate);
        return () => window.removeEventListener('timeTrackingUpdated', handleCustomUpdate);
    }, []);

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNewEntry = () => {
        setEditingEntry(null);
        // Dispatch event to clear form in child if needed, 
        // but since editingEntry is passed as prop, TimeEntryForm handles it via useEffect
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container mx-auto py-8 max-w-[120rem] mx-auto px-4 md:px-0">
            <PageHeader
                breadcrumbItems={[
                    { label: 'Management', href: '#' },
                    { label: 'Time Tracking' }
                ]}
            />
            
            <div className="mb-10">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-2 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-blue-500" />
                    Precision Time Tracking
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">
                    Measure productivity with millisecond accuracy and automated analytics
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
                <div className="flex items-center justify-between gap-4">
                    <div className="bg-white/80 dark:bg-slate-900/50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)] p-1 rounded-full w-fit border border-slate-200 dark:border-slate-800 backdrop-blur-xl inline-flex">
                        <TabsList className="bg-transparent border-none h-11 pointer-events-auto gap-1">
                            <TabsTrigger 
                                value="track" 
                                className="rounded-full px-8 h-full font-black text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 transition-all duration-300 hover:text-slate-900 dark:hover:text-slate-200"
                            >
                                <Timer className="w-3.5 h-3.5 mr-2.5" />
                                Track Time
                            </TabsTrigger>
                            <PermissionGate permission={PERMISSIONS.TIME_TRACKING_MANAGE}>
                                <TabsTrigger 
                                    value="projects" 
                                    className="rounded-full px-8 h-full font-black text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 transition-all duration-300 hover:text-slate-900 dark:hover:text-slate-200"
                                >
                                    <Briefcase className="w-3.5 h-3.5 mr-2.5" />
                                    Projects
                                </TabsTrigger>
                            </PermissionGate>
                            <PermissionGate permission={PERMISSIONS.TIME_TRACKING_MANAGE}>
                                <TabsTrigger 
                                    value="categories" 
                                    className="rounded-full px-8 h-full font-black text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 transition-all duration-300 hover:text-slate-900 dark:hover:text-slate-200"
                                >
                                    <Tag className="w-3.5 h-3.5 mr-2.5" />
                                    Categories
                                </TabsTrigger>
                            </PermissionGate>
                            <TabsTrigger 
                                value="reports" 
                                className="rounded-full px-8 h-full font-black text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25 transition-all duration-300 hover:text-slate-900 dark:hover:text-slate-200"
                            >
                                <PieChartIcon className="w-3.5 h-3.5 mr-2.5" />
                                Reports
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {activeTab === 'track' && (
                        <Button 
                            onClick={handleNewEntry}
                            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 transition-all group active:scale-95 border-none"
                        >
                            <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
                            New Log
                        </Button>
                    )}
                </div>


                <TabsContent value="track" className="space-y-8 outline-none">
                    {/* Top Section: Form and Widgets Side by Side */}
                    <div className="grid gap-8 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="lg:col-span-8 space-y-8">
                            <TimeEntryForm
                                onSubmit={handleTimeEntrySubmit}
                                initialData={editingEntry}
                                customers={customers}
                                projects={projects}
                                categories={categories}
                            />
                        </div>
                        <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <TimerWidget onTimerUpdate={handleTimerUpdate} />
                            
                            <Card className="dark:bg-slate-900/50 dark:border-slate-800 rounded-[2rem] border-dashed">
                                <CardContent className="pt-8 text-center p-8">
                                    <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <LayoutGrid className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-widest mb-2">Automated Logs</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Your activity is automatically correlated with project milestones for accurate billing.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Full Width Section: Time Entries List */}
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <TimeEntriesList
                            refresh={refreshKey}
                            onEdit={handleEdit}
                            customers={customers}
                            projects={projects}
                            categories={categories}
                        />
                    </div>
                </TabsContent>

                <PermissionGate permission={PERMISSIONS.TIME_TRACKING_MANAGE}>
                    <TabsContent value="projects" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
                        <ProjectManagement customers={customers} />
                    </TabsContent>
                </PermissionGate>

                <PermissionGate permission={PERMISSIONS.TIME_TRACKING_MANAGE}>
                    <TabsContent value="categories" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
                        <CategoryManagement />
                    </TabsContent>
                </PermissionGate>

                <TabsContent value="reports" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
                    <TimeTrackingReports />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TimeTracking;

