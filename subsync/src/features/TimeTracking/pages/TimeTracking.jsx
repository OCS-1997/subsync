import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Timer, LayoutGrid, Tag, PieChart as PieChartIcon, Briefcase } from 'lucide-react';
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

const TimeTracking = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editingEntry, setEditingEntry] = useState(null);

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

    const handleEdit = (entry) => {
        setEditingEntry(entry);
        // Scroll to form
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

            <Tabs defaultValue="track" className="space-y-8">
                <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl w-fit border border-gray-100 dark:border-slate-800 shadow-sm inline-flex">
                    <TabsList className="bg-transparent border-none gap-1">
                        <TabsTrigger 
                            value="track" 
                            className="rounded-xl px-6 font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300 hover:text-slate-900 dark:hover:text-slate-200"
                        >
                            <Timer className="w-3.5 h-3.5 mr-2" />
                            Track Time
                        </TabsTrigger>
                        <TabsTrigger 
                            value="projects" 
                            className="rounded-xl px-6 font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300 hover:text-slate-900 dark:hover:text-slate-200"
                        >
                            <Briefcase className="w-3.5 h-3.5 mr-2" />
                            Projects
                        </TabsTrigger>
                        <TabsTrigger 
                            value="categories" 
                            className="rounded-xl px-6 font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300 hover:text-slate-900 dark:hover:text-slate-200"
                        >
                            <Tag className="w-3.5 h-3.5 mr-2" />
                            Categories
                        </TabsTrigger>
                        <TabsTrigger 
                            value="reports" 
                            className="rounded-xl px-6 font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300 hover:text-slate-900 dark:hover:text-slate-200"
                        >
                            <PieChartIcon className="w-3.5 h-3.5 mr-2" />
                            Reports
                        </TabsTrigger>
                    </TabsList>
                </div>


                <TabsContent value="track" className="space-y-8 outline-none">
                    <div className="grid gap-8 lg:grid-cols-12">
                        <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <TimeEntryForm
                                onSubmit={handleTimeEntrySubmit}
                                initialData={editingEntry}
                                customers={customers}
                                projects={projects}
                                categories={categories}
                            />
                            <TimeEntriesList
                                refresh={refreshKey}
                                onEdit={handleEdit}
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
                </TabsContent>

                <TabsContent value="projects" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
                    <ProjectManagement customers={customers} />
                </TabsContent>

                <TabsContent value="categories" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
                    <CategoryManagement />
                </TabsContent>

                <TabsContent value="reports" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
                    <TimeTrackingReports />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TimeTracking;

