/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { usePermissions } from '@/context/PermissionsContext';
import { PERMISSIONS } from '@/constants/permissions';
import { taskService } from '../services/taskService';
import { toast } from 'react-toastify';
import { X, Plus, Edit2, Trash2, Calendar, User, Tag, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { getLoggedUser } from '@/utils/userUtils';

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated, taskToEdit, currentUser }) {
  const { hasAnyPermission } = usePermissions();
  const canAssignOthers = hasAnyPermission([
    PERMISSIONS.TASKS_CREATE_FOR_OTHERS,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.TASKS_MANAGE_ALL,
  ]);

  const activeUser = currentUser && currentUser.username ? currentUser : getLoggedUser();
  const userDisplayName = activeUser.name || activeUser.username || 'Myself';

  const isEditMode = Boolean(taskToEdit && taskToEdit.id);

  const todayFormatted = new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);
  const [manageableUsers, setManageableUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: activeUser?.username || '',
    priority: 'MEDIUM',
    category: 'General',
    startDate: todayFormatted,
    dueDate: '',
  });

  const [checklist, setChecklist] = useState(['']);

  useEffect(() => {
    if (isOpen) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (isEditMode) {
        setFormData({
          title: taskToEdit.title || '',
          description: taskToEdit.description || '',
          assignedTo: taskToEdit.assigned_to || currentUser?.username || '',
          priority: taskToEdit.priority || 'MEDIUM',
          category: taskToEdit.category || 'General',
          startDate: taskToEdit.start_date ? taskToEdit.start_date.substring(0, 10) : todayStr,
          dueDate: taskToEdit.due_date ? taskToEdit.due_date.substring(0, 10) : '',
        });
        setChecklist([]);
      } else {
        setFormData({
          title: '',
          description: '',
          assignedTo: currentUser?.username || '',
          priority: 'MEDIUM',
          category: 'General',
          startDate: todayStr,
          dueDate: '',
        });
        setChecklist(['']);
      }

      if (canAssignOthers) {
        taskService
          .getManageableUsers()
          .then((res) => {
            if (res.success && res.data) {
              setManageableUsers(res.data);
            }
          })
          .catch((err) => console.error('Failed to load manageable users:', err));
      }
    }
  }, [isOpen, taskToEdit, isEditMode, currentUser, canAssignOthers]);

  if (!isOpen) return null;

  const handleAddChecklist = () => {
    setChecklist([...checklist, '']);
  };

  const handleChecklistChange = (index, value) => {
    const updated = [...checklist];
    updated[index] = value;
    setChecklist(updated);
  };

  const handleRemoveChecklist = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (formData.startDate && formData.dueDate && new Date(formData.dueDate) < new Date(formData.startDate)) {
      toast.error('Due date cannot be before start date');
      return;
    }

    try {
      setLoading(true);
      const filteredChecklist = checklist.filter((item) => item && item.trim().length > 0);

      if (isEditMode) {
        const payload = {
          title: formData.title.trim(),
          description: formData.description,
          assignedTo: formData.assignedTo,
          priority: formData.priority,
          category: formData.category,
          startDate: formData.startDate || null,
          dueDate: formData.dueDate || null,
        };

        const res = await taskService.updateTask(taskToEdit.id, payload);
        if (res.success) {
          toast.success('Task updated successfully!');
          onTaskCreated?.(res.data);
          onClose();
        } else {
          toast.error(res.error?.message || 'Failed to update task');
        }
      } else {
        const payload = {
          ...formData,
          checklist: filteredChecklist,
        };

        const res = await taskService.createTask(payload);
        if (res.success) {
          toast.success('Task created successfully!');
          onTaskCreated?.(res.data);
          onClose();
        } else {
          toast.error(res.error?.message || 'Failed to create task');
        }
      }
    } catch (err) {
      toast.error(err.normalizedMessage || `Error ${isEditMode ? 'updating' : 'creating'} task`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {isEditMode ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditMode ? 'Edit Task' : 'Create New Task'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditMode ? 'Update task metadata, dates, or assignee.' : 'Add task details, assignee, dates, and checklist items.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Prepare Monthly Financial Report"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Detailed instructions or description of what needs to be done..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
            />
          </div>

          {/* Assignee & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Assignee
              </label>
              {canAssignOthers ? (
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value={activeUser?.username || ''}>Assign to Me ({userDisplayName})</option>
                  {manageableUsers
                    .filter((u) => u.username !== activeUser?.username)
                    .map((u) => (
                      <option key={u.username} value={u.username}>
                        {u.name || u.username} ({u.roleName || u.roleKey || 'User'})
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  value={userDisplayName !== 'Myself' ? `${userDisplayName} (Myself)` : 'Myself'}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent 🚨</option>
              </select>
            </div>
          </div>

          {/* Category & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. General, Finance, CRM"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* Checklist items (Only for New Task creation) */}
          {!isEditMode && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Checklist Items
                </label>
                <button
                  type="button"
                  onClick={handleAddChecklist}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Checklist item ${idx + 1}...`}
                      value={item}
                      onChange={(e) => handleChecklistChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    {checklist.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklist(idx)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20 px-5"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : isEditMode ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
