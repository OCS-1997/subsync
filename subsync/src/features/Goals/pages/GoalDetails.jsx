import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import { toast } from 'react-toastify';
import {
    Loader2, Target, Calendar, User, Users, Flag, Edit, Trash2, ArrowLeft,
    Paperclip, MessageSquare, History, Clock, CheckCircle2, AlertTriangle, Upload, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { goalService } from '../services/goalService';
import GoalFormModal from '../components/GoalFormModal';
import { usePermissions } from '@/context/PermissionsContext';
import { PERMISSIONS } from '@/constants/permissions';

export default function GoalDetails() {
    const { id, username } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const baseUrl = `/${username || 'admin'}/dashboard`;

    const [goal, setGoal] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentSubmitting, setCommentSubmitting] = useState(false);

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadGoalDetails();
    }, [id]);

    const loadGoalDetails = async () => {
        try {
            setLoading(true);
            const [data, logs] = await Promise.all([
                goalService.getGoalById(id),
                goalService.getActivityLogs(id).catch(() => [])
            ]);
            setGoal(data);
            setActivityLogs(logs || []);
        } catch (error) {
            toast.error('Failed to load goal details');
        } finally {
            setLoading(false);
        }
    };

    const handleProgressQuickUpdate = async (newVal) => {
        try {
            const res = await goalService.patchProgress(id, newVal);
            toast.success(`Progress updated to ${res.progress}%`);
            loadGoalDetails();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update progress');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this goal?')) return;
        try {
            await goalService.deleteGoal(id);
            toast.success('Goal deleted successfully');
            navigate(`${baseUrl}/goals`);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete goal');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            await goalService.uploadAttachment(id, formData);
            toast.success('Attachment uploaded');
            loadGoalDetails();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to upload attachment');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAttachment = async (attId) => {
        if (!confirm('Delete this attachment?')) return;
        try {
            await goalService.deleteAttachment(id, attId);
            toast.success('Attachment removed');
            loadGoalDetails();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete attachment');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setCommentSubmitting(true);
            await goalService.addComment(id, newComment);
            toast.success('Comment added');
            setNewComment('');
            loadGoalDetails();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add comment');
        } finally {
            setCommentSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!goal) {
        return (
            <div className="p-12 text-center space-y-4">
                <p className="text-sm font-bold text-slate-500">Goal not found.</p>
                <Button onClick={() => navigate(`${baseUrl}/goals`)}>Back to Goals</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen bg-slate-50/30 dark:bg-transparent px-4 sm:px-8 py-4 sm:py-8 max-w-[1600px] mx-auto">
            <PageHeader
                title={goal.title}
                description={`${goal.goal_id} • ${goal.financial_year} • ${goal.quarter} • Category: ${goal.category_name}`}
                breadcrumbItems={[
                    { label: 'Goals', href: `${baseUrl}/goals` },
                    { label: goal.goal_id }
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(`${baseUrl}/goals`)} className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        {hasPermission(PERMISSIONS.GOALS_EDIT) && (
                            <button onClick={() => navigate(`${baseUrl}/goals/${goal.goal_id}/edit`)} className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                                <Edit className="w-4 h-4" /> Edit Goal
                            </button>
                        )}
                        {hasPermission(PERMISSIONS.GOALS_DELETE) && (
                            <button onClick={handleDelete} className="px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 hover:bg-rose-100 transition-all">
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        )}
                    </div>
                }
            />


            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Target Date</span>
                        <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-xl font-black text-slate-900 dark:text-white">
                        {format(new Date(goal.target_date), 'dd MMM yyyy')}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Business Impact</span>
                        <Target className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {goal.business_impact_name || 'N/A'}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Priority</span>
                        <Flag className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                        {goal.priority || 'Medium'}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Progress</span>
                        <span className="font-black text-blue-600">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2 rounded-full" />
                </div>
            </div>

            {/* Tabbed View matching System Pill design */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-1 max-w-xl">
                    <TabsTrigger value="overview" className="rounded-xl text-xs font-bold">Overview</TabsTrigger>
                    <TabsTrigger value="timeline" className="rounded-xl text-xs font-bold">Timeline & Activity</TabsTrigger>
                    <TabsTrigger value="attachments" className="rounded-xl text-xs font-bold">Attachments ({goal.attachments?.length || 0})</TabsTrigger>
                    <TabsTrigger value="comments" className="rounded-xl text-xs font-bold">Comments ({goal.comments?.length || 0})</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Goal Objective & Description</h3>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {goal.description || 'No detailed description provided.'}
                                </p>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Remarks / Next Action Steps</h4>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {goal.remarks || 'No remarks recorded.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Side Details */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" /> Assigned Team Owners
                                </h3>
                                <div className="space-y-2">
                                    {goal.owners && goal.owners.length > 0 ? (
                                        goal.owners.map((owner) => (
                                            <div key={owner.username} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                                                    {owner.name?.charAt(0) || owner.username.charAt(0)}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{owner.name || owner.username}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono truncate">{owner.email || owner.username}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400 font-medium">No owners assigned.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Progress Update</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {[25, 50, 75, 100].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => handleProgressQuickUpdate(val)}
                                            className={`p-2.5 rounded-xl text-xs font-black transition-all ${
                                                goal.progress === val
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                            }`}
                                        >
                                            {val}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* TIMELINE TAB */}
                <TabsContent value="timeline" className="mt-6 space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <History className="w-4 h-4 text-blue-500" /> Audit & Activity Trail
                        </h3>
                        {activityLogs.length === 0 ? (
                            <p className="text-xs text-slate-400 font-medium py-4 text-center">No activity history logged yet.</p>
                        ) : (
                            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                {activityLogs.map((log) => (
                                    <div key={log.id} className="relative pl-8 space-y-1">
                                        <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-black text-slate-900 dark:text-white">{log.action}</span>
                                            <span className="text-slate-400 font-mono text-[10px]">
                                                {format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                            By <span className="font-bold text-slate-900 dark:text-white">{log.user_display_name || log.username}</span>
                                            {log.field_name ? ` (${log.field_name}: ${log.old_value || 'N/A'} → ${log.new_value})` : ''}
                                        </p>
                                        {log.details && (
                                            <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60">
                                                {log.details}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* ATTACHMENTS TAB */}
                <TabsContent value="attachments" className="mt-6 space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Goal Attachments</h3>
                            {hasPermission(PERMISSIONS.GOALS_EDIT) && (
                                <label className="cursor-pointer">
                                    <input type="file" onChange={handleFileUpload} className="hidden" />
                                    <span className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold inline-flex items-center gap-2 hover:bg-slate-800 shadow-md">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        Upload Attachment
                                    </span>
                                </label>
                            )}
                        </div>

                        {goal.attachments?.length === 0 ? (
                            <p className="text-xs text-slate-400 font-medium py-8 text-center">No attachments uploaded yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {goal.attachments?.map((att) => (
                                    <div key={att.attachment_id} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Paperclip className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{att.original_name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">{(att.file_size / 1024).toFixed(1)} KB &bull; {att.uploaded_by}</p>
                                            </div>
                                        </div>
                                        {hasPermission(PERMISSIONS.GOALS_EDIT) && (
                                            <button onClick={() => handleDeleteAttachment(att.attachment_id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* COMMENTS TAB */}
                <TabsContent value="comments" className="mt-6 space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Team Discussion & Activity</h3>

                        <form onSubmit={handleAddComment} className="space-y-3">
                            <Textarea
                                rows={3}
                                placeholder="Post an update or comment on this goal..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs font-medium"
                            />
                            <div className="flex justify-end">
                                <button type="submit" disabled={commentSubmitting || !newComment.trim()} className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20">
                                    {commentSubmitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null} Post Comment
                                </button>
                            </div>
                        </form>

                        <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                            {goal.comments?.length === 0 ? (
                                <p className="text-xs text-slate-400 font-medium text-center py-4">No comments recorded.</p>
                            ) : (
                                goal.comments?.map((c) => (
                                    <div key={c.comment_id} className="p-4 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-black text-slate-900 dark:text-white">{c.user_display_name || c.username}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{format(new Date(c.created_at), 'dd MMM yyyy, HH:mm')}</span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* EDIT MODAL */}
            <GoalFormModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                goalToEdit={goal}
                onSuccess={loadGoalDetails}
            />
        </div>
    );
}
