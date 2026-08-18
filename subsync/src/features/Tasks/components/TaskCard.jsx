/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckSquare, Clock, AlertTriangle, User, MessageSquare, Paperclip, Edit2, Flame } from 'lucide-react';
import { format, isBefore, isToday, parseISO } from 'date-fns';

const priorityColors = {
  LOW: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  MEDIUM: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  HIGH: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  URGENT: 'bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white border-transparent font-extrabold shadow-sm shadow-rose-500/30',
};

const statusColors = {
  TODO: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  IN_PROGRESS: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  BLOCKED: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700',
  COMPLETED: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  CANCELLED: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 line-through',
};

export default function TaskCard({ task, onEdit, viewMode = 'grid' }) {
  const navigate = useNavigate();

  const totalItems = task.checklist_total || 0;
  const completedItems = task.checklist_completed || 0;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Due date checks
  let isOverdue = false;
  let isDueToday = false;
  if (task.due_date && task.status !== 'COMPLETED' && task.status !== 'CANCELLED') {
    try {
      const due = typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date);
      if (due && !isNaN(due.getTime())) {
        isDueToday = isToday(due);
        isOverdue = isBefore(due, new Date()) && !isDueToday;
      }
    } catch (err) {
      console.error('Error parsing due date:', err);
    }
  }

  const isUrgent = task.priority === 'URGENT';

  // LIST VIEW LAYOUT
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
        className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-850 transition-all cursor-pointer border-b border-slate-100 dark:border-slate-800/80 last:border-0 ${
          isUrgent ? 'border-l-4 border-l-rose-500' : ''
        }`}
      >
        {/* Left Section: Priority, Category, Title */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-md border shrink-0 flex items-center gap-1 ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
            {isUrgent && <Flame className="w-3 h-3 fill-white text-white shrink-0" />}
            {task.priority}
          </span>

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                {task.title}
              </h3>
              {task.category && (
                <span className="px-2 py-0.2 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                  {task.category}
                </span>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xl">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Checklist, Due Date, Status, Assignee, Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800 text-xs">
          {totalItems > 0 && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] min-w-[80px]">
              <CheckSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="font-semibold">{completedItems}/{totalItems}</span>
              <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden md:block">
                <div
                  className={`h-full ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Due Date */}
          <div className="min-w-[100px] text-right sm:text-left">
            {task.due_date ? (
              <span
                className={`flex items-center gap-1 font-medium text-[11px] ${
                  isOverdue
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : isDueToday
                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {isOverdue ? <AlertTriangle className="w-3 h-3 shrink-0" /> : <Clock className="w-3 h-3 shrink-0" />}
                {(() => {
                  try {
                    const parsed = typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date);
                    return !isNaN(parsed.getTime()) ? format(parsed, 'MMM dd') : task.due_date;
                  } catch (err) {
                    return String(task.due_date);
                  }
                })()}
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">No date</span>
            )}
          </div>

          {/* Status Badge */}
          <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md whitespace-nowrap shrink-0 ${statusColors[task.status] || statusColors.TODO}`}>
            {task.status.replace('_', ' ')}
          </span>

          {/* Assignee */}
          <div
            className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0"
            title={`Assigned to: ${task.assignee_name || task.assigned_to}`}
          >
            {(task.assignee_name || task.assigned_to || 'U').charAt(0).toUpperCase()}
          </div>

          {/* Edit Button */}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // GRID VIEW LAYOUT (DEFAULT)
  return (
    <div
      onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
      className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer overflow-hidden ${
        isUrgent
          ? 'border-rose-400/80 dark:border-rose-600/80 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 dark:from-rose-950/40 dark:via-slate-900 dark:to-amber-950/20 shadow-[0_0_15px_rgba(244,63,94,0.18)] hover:shadow-lg'
          : 'border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500'
      }`}
    >
      {isUrgent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />
      )}

      {/* Top Bar: Category, Priority, Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border flex items-center gap-1 shrink-0 ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
              {isUrgent && <Flame className="w-3.5 h-3.5 fill-white text-white shrink-0" />}
              {task.priority}
            </span>
            {task.category && (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[110px]">
                {task.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Task"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap ${statusColors[task.status] || statusColors.TODO}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1.5 break-words">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed break-words">
            {task.description}
          </p>
        )}
      </div>

      {/* Checklist Progress Bar */}
      <div>
        {totalItems > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 font-medium">
                <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                Checklist ({completedItems}/{totalItems})
              </span>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer: Date, Assignee, Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            {task.due_date ? (
              <span
                className={`flex items-center gap-1 font-medium ${
                  isOverdue
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : isDueToday
                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {isOverdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {isOverdue ? 'Overdue: ' : isDueToday ? 'Due Today: ' : ''}
                {(() => {
                  try {
                    const parsed = typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date);
                    return !isNaN(parsed.getTime()) ? format(parsed, 'MMM dd') : task.due_date;
                  } catch (err) {
                    return String(task.due_date);
                  }
                })()}
              </span>
            ) : (
              <span className="text-slate-400">No due date</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {task.comment_count > 0 && (
              <span className="flex items-center gap-1 text-slate-400">
                <MessageSquare className="w-3.5 h-3.5" />
                {task.comment_count}
              </span>
            )}
            {task.attachment_count > 0 && (
              <span className="flex items-center gap-1 text-slate-400">
                <Paperclip className="w-3.5 h-3.5" />
                {task.attachment_count}
              </span>
            )}
            <div
              className="flex items-center gap-1.5 pl-1 shrink-0"
              title={`Assigned to: ${task.assignee_name || task.assigned_to}`}
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center border border-blue-200 dark:border-blue-800">
                {(task.assignee_name || task.assigned_to || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
