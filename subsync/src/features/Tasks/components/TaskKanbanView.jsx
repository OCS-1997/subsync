/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { format, isBefore, isToday, parseISO } from 'date-fns';
import { CheckSquare, Clock, AlertTriangle, MessageSquare, Paperclip, Plus, ArrowRight, Edit2, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-slate-500', bgHeader: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-indigo-500', bgHeader: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' },
  { id: 'BLOCKED', title: 'Blocked', color: 'bg-amber-500', bgHeader: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-emerald-500', bgHeader: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
  { id: 'CANCELLED', title: 'Cancelled', color: 'bg-rose-500', bgHeader: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' },
];

const priorityColors = {
  LOW: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  MEDIUM: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  HIGH: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  URGENT: 'bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white font-extrabold shadow-sm shadow-rose-500/30',
};

// Draggable Task Card Item
function KanbanCard({ task, isDraggingOverlay = false, onEdit }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.3 : 1,
      }
    : undefined;

  const totalItems = task.checklist_total || 0;
  const completedItems = task.checklist_completed || 0;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  let isOverdue = false;
  let isDueToday = false;
  if (task.due_date && task.status !== 'COMPLETED' && task.status !== 'CANCELLED') {
    const due = parseISO(task.due_date);
    isDueToday = isToday(due);
    isOverdue = isBefore(due, new Date()) && !isDueToday;
  }

  const isUrgent = task.priority === 'URGENT';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/dashboard/tasks/${task.id}`)}
      className={cn(
        'p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-grab active:cursor-grabbing space-y-3 relative overflow-hidden',
        isUrgent && 'border-rose-400/80 dark:border-rose-600/80 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 dark:from-rose-950/40 dark:via-slate-900 dark:to-amber-950/20 shadow-[0_0_15px_rgba(244,63,94,0.18)]',
        isDraggingOverlay && 'shadow-2xl border-blue-500 ring-2 ring-blue-500/20 scale-105'
      )}
    >
      {isUrgent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />
      )}

      <div className="flex items-center justify-between gap-2">
        <span className={cn(
          'px-2 py-0.5 text-[11px] font-bold rounded-md flex items-center gap-1',
          isUrgent ? priorityColors.URGENT : (priorityColors[task.priority] || priorityColors.MEDIUM)
        )}>
          {isUrgent && <Flame className="w-3.5 h-3.5 fill-white text-white shrink-0" />}
          {task.priority}
        </span>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Task"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {task.category && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {task.category}
            </span>
          )}
        </div>
      </div>

      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
        {task.title}
      </h4>

      {totalItems > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-blue-500" />
              {completedItems}/{totalItems}
            </span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          {task.due_date ? (
            <span
              className={cn(
                'flex items-center gap-1 font-medium',
                isOverdue && 'text-rose-600 dark:text-rose-400 font-semibold',
                isDueToday && 'text-amber-600 dark:text-amber-400 font-semibold'
              )}
            >
              <Clock className="w-3 h-3" />
              {format(parseISO(task.due_date), 'MMM dd')}
            </span>
          ) : (
            <span className="text-slate-400">No date</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.comment_count > 0 && (
            <span className="flex items-center gap-0.5 text-slate-400">
              <MessageSquare className="w-3 h-3" />
              {task.comment_count}
            </span>
          )}
          <div
            className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[9px] flex items-center justify-center border border-blue-200 dark:border-blue-800"
            title={`Assignee: ${task.assignee_name || task.assigned_to}`}
          >
            {(task.assignee_name || task.assigned_to || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Droppable Column Component
function KanbanColumn({ column, tasks, onStatusChange, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[280px] w-full max-w-xs rounded-3xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-3 transition-all duration-200 min-h-[500px]',
        isOver && 'ring-2 ring-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20'
      )}
    >
      {/* Column Header */}
      <div className={cn('flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-xs', column.bgHeader)}>
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', column.color)} />
          <span>{column.title}</span>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-white/60 dark:bg-slate-900/60">
          {tasks.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] scrollbar-thin">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onEdit={onEdit} />
        ))}

        {tasks.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
            No {column.title.toLowerCase()} tasks
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaskKanbanView({ tasks, onStatusChange, onEdit }) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    const task = event.active.data.current?.task;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id.toString().replace('task-', '');
    const newStatus = over.id; // column ID (TODO, IN_PROGRESS, etc.)

    const targetTask = tasks.find((t) => t.id.toString() === taskId);
    if (targetTask && targetTask.status !== newStatus && COLUMNS.some((c) => c.id === newStatus)) {
      onStatusChange?.(taskId, newStatus);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          return (
            <KanbanColumn key={column.id} column={column} tasks={columnTasks} onStatusChange={onStatusChange} onEdit={onEdit} />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} isDraggingOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
