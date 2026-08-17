import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePermissions } from '@/context/PermissionsContext';
import { PERMISSIONS } from '@/constants/permissions';
import { taskService } from '../services/taskService';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Clock,
  User,
  Tag,
  AlertCircle,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Paperclip,
  History,
  Plus,
  Trash2,
  Upload,
  Download,
  Send,
  RotateCcw,
  Edit2,
} from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb.jsx';
import { Button } from '@/components/ui/button';
import CreateTaskModal from '../components/CreateTaskModal';
import { getLoggedUser } from '@/utils/userUtils';

function formatActivityValue(val) {
  if (!val) return null;
  if (typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}: ${v}`)
      .join(', ');
  }
  if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
    try {
      const parsed = JSON.parse(val);
      return Object.entries(parsed)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}: ${v}`)
        .join(', ');
    } catch (e) {
      return val;
    }
  }
  return val;
}

export default function TaskDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasAnyPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);

  // New item states
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [manageableUsers, setManageableUsers] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const currentUser = getLoggedUser();
  const canReassign = hasAnyPermission([PERMISSIONS.TASKS_REASSIGN, PERMISSIONS.TASKS_ASSIGN, PERMISSIONS.TASKS_MANAGE_ALL]);

  const loadTaskDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await taskService.getTaskById(id);
      if (res.success && res.data) {
        setTask(res.data);
        setSelectedAssignee(res.data.assigned_to);
      } else {
        toast.error('Task not found');
        navigate('/dashboard/tasks');
      }
    } catch (err) {
      toast.error(err.normalizedMessage || 'Error loading task');
      navigate('/dashboard/tasks');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTaskDetail();
  }, [loadTaskDetail]);

  useEffect(() => {
    if (canReassign) {
      taskService.getManageableUsers()
        .then((res) => {
          if (res.success) setManageableUsers(res.data);
        })
        .catch((err) => console.error(err));
    }
  }, [canReassign]);

  // Handle status update
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await taskService.changeStatus(id, newStatus);
      if (res.success) {
        toast.success(`Task status changed to ${newStatus}`);
        setTask(res.data);
      }
    } catch (err) {
      toast.error(err.normalizedMessage || 'Failed to change status');
    }
  };

  // Handle Reassignment
  const handleReassign = async () => {
    if (!selectedAssignee || selectedAssignee === task.assigned_to) return;
    try {
      setReassigning(true);
      const res = await taskService.reassignTask(id, selectedAssignee);
      if (res.success) {
        toast.success('Task reassigned successfully');
        setTask(res.data);
      }
    } catch (err) {
      toast.error(err.normalizedMessage || 'Failed to reassign task');
    } finally {
      setReassigning(false);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
    try {
      const res = await taskService.deleteTask(id);
      if (res.success) {
        toast.success('Task deleted');
        navigate('/dashboard/tasks');
      }
    } catch (err) {
      toast.error(err.normalizedMessage || 'Failed to delete task');
    }
  };

  // Handle Checklist operations
  const handleToggleChecklist = async (item) => {
    try {
      const res = await taskService.updateChecklistItem(id, item.id, {
        completed: !item.completed,
      });
      if (res.success) setTask(res.data);
    } catch (err) {
      toast.error('Failed to update checklist item');
    }
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    try {
      const res = await taskService.addChecklistItem(id, newChecklistTitle.trim());
      if (res.success) {
        setTask(res.data);
        setNewChecklistTitle('');
      }
    } catch (err) {
      toast.error('Failed to add checklist item');
    }
  };

  const handleDeleteChecklist = async (itemId) => {
    try {
      const res = await taskService.deleteChecklistItem(id, itemId);
      if (res.success) setTask(res.data);
    } catch (err) {
      toast.error('Failed to delete checklist item');
    }
  };

  // Handle Comment Posting
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await taskService.addComment(id, newComment.trim());
      if (res.success) {
        setTask(res.data);
        setNewComment('');
        toast.success('Comment added');
      }
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  // Handle Attachment Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await taskService.uploadAttachment(id, file);
      if (res.success) {
        setTask(res.data);
        toast.success('Attachment uploaded successfully');
      }
    } catch (err) {
      toast.error('Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Delete attachment?')) return;
    try {
      const res = await taskService.deleteAttachment(id, attachmentId);
      if (res.success) {
        setTask(res.data);
        toast.success('Attachment deleted');
      }
    } catch (err) {
      toast.error('Failed to delete attachment');
    }
  };

  if (loading || !task) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const checklistTotal = task.checklists?.length || 0;
  const checklistCompleted = task.checklists?.filter((c) => c.completed).length || 0;
  const progressPercent = checklistTotal > 0 ? Math.round((checklistCompleted / checklistTotal) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <Breadcrumb
        items={[
          { label: 'My Work Group', href: '/dashboard/tasks' },
          { label: 'Tasks', href: '/dashboard/tasks' },
          { label: task.title || 'Task Detail' },
        ]}
      />

      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard/tasks')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </button>

        {/* Status Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {task.status === 'TODO' && (
            <Button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2"
            >
              Start Task (In Progress)
            </Button>
          )}

          {task.status === 'IN_PROGRESS' && (
            <>
              <Button
                onClick={() => handleStatusChange('COMPLETED')}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Complete Task
              </Button>
              <Button
                onClick={() => handleStatusChange('BLOCKED')}
                variant="outline"
                className="rounded-xl border-amber-300 text-amber-700 dark:text-amber-400 text-xs px-3.5 py-2"
              >
                Mark Blocked
              </Button>
            </>
          )}

          {task.status === 'BLOCKED' && (
            <Button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2"
            >
              Resume Task (In Progress)
            </Button>
          )}

          {task.status === 'COMPLETED' && (
            <Button
              onClick={() => handleStatusChange('TODO')}
              variant="outline"
              className="rounded-xl border-slate-300 text-slate-700 dark:text-slate-300 text-xs px-3.5 py-2 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reopen Task
            </Button>
          )}

          {task.status !== 'CANCELLED' && task.status !== 'COMPLETED' && (
            <Button
              onClick={() => handleStatusChange('CANCELLED')}
              variant="outline"
              className="rounded-xl border-rose-300 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs px-3 py-2"
            >
              Cancel Task
            </Button>
          )}

          {/* Edit Task */}
          {(currentUser.username === task.created_by || currentUser.username === task.assigned_to || currentUser.roleKey === 'admin' || hasAnyPermission([PERMISSIONS.TASKS_MANAGE_ALL])) && (
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              className="rounded-xl text-xs px-3 py-2 flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Task
            </Button>
          )}

          {/* Delete Task */}
          {(currentUser.username === task.created_by || currentUser.roleKey === 'admin') && (
            <Button
              onClick={handleDeleteTask}
              variant="destructive"
              className="rounded-xl text-xs px-3 py-2"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Task Title & Badges */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1 text-xs font-extrabold rounded-lg uppercase tracking-wider flex items-center gap-1.5 ${
            task.priority === 'URGENT'
              ? 'bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white shadow-md shadow-rose-500/25'
              : task.priority === 'HIGH'
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
              : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
          }`}>
            {task.priority === 'URGENT' && <Flame className="w-3.5 h-3.5 fill-white text-white shrink-0" />}
            {task.priority} Priority
          </span>
          <span className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Status: {task.status.replace('_', ' ')}
          </span>
          {task.category && (
            <span className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              Category: {task.category}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
          {task.title}
        </h1>

        {task.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Metadata info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <div className="text-slate-400 font-medium mb-1">Assignee</div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              {task.assignee_name || task.assigned_to}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium mb-1">Created By</div>
            <div className="font-bold text-slate-900 dark:text-white">
              {task.creator_name || task.created_by}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium mb-1">Start Date</div>
            <div className="font-bold text-slate-900 dark:text-white">
              {task.start_date ? format(parseISO(task.start_date), 'MMM dd, yyyy') : '—'}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium mb-1">Due Date</div>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              {task.due_date ? format(parseISO(task.due_date), 'MMM dd, yyyy') : '—'}
            </div>
          </div>
        </div>

        {/* Reassign Selector for Managers */}
        {canReassign && (
          <div className="pt-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Reassign Task:</span>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value={task.assigned_to}>Current: {task.assignee_name || task.assigned_to}</option>
              {manageableUsers
                .filter((u) => u.username !== task.assigned_to)
                .map((u) => (
                  <option key={u.username} value={u.username}>
                    {u.name || u.username} ({u.roleName || u.roleKey})
                  </option>
                ))}
            </select>
            {selectedAssignee !== task.assigned_to && (
              <Button
                onClick={handleReassign}
                disabled={reassigning}
                className="rounded-xl text-xs px-3 py-1.5 bg-blue-600 text-white"
              >
                {reassigning ? 'Saving...' : 'Confirm Reassign'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Grid layout for Checklist & Attachments / Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Checklist & Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Checklist Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Checklist ({checklistCompleted}/{checklistTotal})
                </h3>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
            </div>

            {/* Progress Bar */}
            {checklistTotal > 0 && (
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Items */}
            <div className="space-y-2.5 pt-2">
              {task.checklists?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={!!item.completed}
                      onChange={() => handleToggleChecklist(item)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={`text-sm ${
                        item.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200 font-medium'
                      }`}
                    >
                      {item.title}
                    </span>
                  </label>
                  <button
                    onClick={() => handleDeleteChecklist(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Checklist Item Form */}
            <form onSubmit={handleAddChecklist} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add a new checklist item..."
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Button type="submit" className="rounded-xl text-xs bg-blue-600 text-white px-4 py-2.5">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </form>
          </div>

          {/* Comments Feed */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Comments ({task.comments?.length || 0})
              </h3>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                rows={3}
                placeholder="Add a comment or update..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-3.5 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
              <div className="flex justify-end">
                <Button type="submit" className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Post Comment
                </Button>
              </div>
            </form>

            {/* List of comments */}
            <div className="space-y-3 pt-2">
              {task.comments?.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {c.author_name || c.author_id}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {format(parseISO(c.created_at), 'MMM dd, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Attachments & Audit Activity Timeline */}
        <div className="space-y-6">
          {/* Attachments Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Attachments ({task.attachments?.length || 0})
                </h3>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                <Upload className="w-3.5 h-3.5" /> Upload
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {uploading && <div className="text-xs text-blue-500 animate-pulse">Uploading file...</div>}

            <div className="space-y-2">
              {task.attachments?.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{att.file_name}</div>
                    <div className="text-[10px] text-slate-400">
                      {(att.file_size / 1024).toFixed(1)} KB • {att.uploaded_by_name || att.uploaded_by}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => taskService.downloadAttachmentFile(id, att.id, att.file_name)}
                      className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                      title="Download Attachment"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Audit Trail Timeline */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Activity Log</h3>
            </div>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {task.activities?.map((act) => (
                <div key={act.id} className="relative pl-7 text-xs space-y-0.5">
                  <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {act.actor_name || act.actor_id}{' '}
                    <span className="font-normal text-slate-500">{act.action.replace('_', ' ')}</span>
                  </div>
                  {act.new_value && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg mt-1 font-mono">
                      {formatActivityValue(act.new_value)}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400">
                    {format(parseISO(act.created_at), 'MMM dd, h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <CreateTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUser={currentUser}
        taskToEdit={task}
        onTaskCreated={(updatedTask) => {
          setTask(updatedTask);
          fetchTaskDetails();
        }}
      />
    </div>
  );
}
