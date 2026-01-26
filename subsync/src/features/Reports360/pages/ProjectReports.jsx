import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Activity, Clock, Inbox, AlertTriangle } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { useSearchParams } from 'react-router-dom';

const ProjectReports = () => {
    const [searchParams] = useSearchParams();
    const type = window.location.pathname.split('/').pop();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        fetchProjects();
    }, [type]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await api.get('/time-tracking/projects');
            setProjects(response.data.data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch(type) {
            case 'inactive': return 'Inactive Projects';
            case 'overview': return 'Project Overview';
            case 'monthly-report': return 'Monthly Project Report';
            default: return 'Project Details';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Briefcase className="text-white w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">{getTitle()}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Project Performance Analytics</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Card key={project.id} className="dark:bg-slate-900 border-none rounded-[2rem] shadow-sm overflow-hidden group">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                    <Briefcase className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div style={{ backgroundColor: project.color + '20', color: project.color }} className="text-[9px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest border border-current opacity-70">
                                    {project.status || 'Active'}
                                </div>
                            </div>
                            
                            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">{project.project_name}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{project.customer_name || 'Internal Project'}</p>

                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50 dark:border-slate-800">
                                <div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Hours</div>
                                    <div className="text-lg font-black text-slate-900 dark:text-white tracking-tighter italic">128.5h</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Activity</div>
                                    <div className="text-lg font-black text-indigo-600 tracking-tighter italic">84%</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {projects.length === 0 && (
                <div className="py-24 text-center">
                    <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Projects Found</h3>
                </div>
            )}
        </div>
    );
};

export default ProjectReports;
