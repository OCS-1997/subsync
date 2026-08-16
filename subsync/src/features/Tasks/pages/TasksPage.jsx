import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/context/PermissionsContext';
import { PERMISSIONS } from '@/constants/permissions';
import { taskService } from '../services/taskService';
import TaskCard from '../components/TaskCard';
import TaskKanbanView from '../components/TaskKanbanView';
import CreateTaskModal from '../components/CreateTaskModal';
import { Breadcrumb } from '@/components/ui/breadcrumb.jsx';
import { toast } from 'react-toastify';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Plus,
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  User,
  CheckSquare,
  Sparkles,
  LayoutGrid,
  List,
  Kanban,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { getLoggedUser } from '@/utils/userUtils';

export default function TasksPage() {
  const navigate = useNavigate();
  const { hasAnyPermission } = usePermissions();

  const canViewAnalytics = hasAnyPermission([
    PERMISSIONS.TASKS_VIEW_ANALYTICS,
    PERMISSIONS.TASKS_VIEW_ALL,
    PERMISSIONS.TASKS_MANAGE_ALL,
  ]);
  const canManage = hasAnyPermission([
    PERMISSIONS.TASKS_CREATE_FOR_OTHERS,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.TASKS_VIEW_ALL,
    PERMISSIONS.TASKS_MANAGE_ALL,
  ]);

  const [viewMode, setViewMode] = useState('my_tasks'); // 'my_tasks' | 'assigned_by_me' | 'management'
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, TODAY, UPCOMING, OVERDUE, COMPLETED
  const [layoutMode, setLayoutMode] = useState('kanban'); // 'kanban' | 'grid' | 'list'

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total_tasks: 0,
    todo_count: 0,
    in_progress_count: 0,
    blocked_count: 0,
    completed_count: 0,
    due_today_count: 0,
    overdue_count: 0,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assignedToFilter, setAssignedToFilter] = useState('ALL');
  const [manageableUsers, setManageableUsers] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const currentUser = getLoggedUser();

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setIsCreateModalOpen(true);
  };

  // Load KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await taskService.getTaskStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load task stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Manageable Users for filter
  useEffect(() => {
    if (canManage) {
      taskService.getManageableUsers()
        .then((res) => {
          if (res.success) setManageableUsers(res.data);
        })
        .catch((err) => console.error(err));
    }
  }, [canManage]);

  // Load Tasks List
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        tab: viewMode,
        search,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        assignedTo: assignedToFilter !== 'ALL' ? assignedToFilter : undefined,
      };

      if (viewMode === 'my_tasks') {
        if (activeTab === 'TODAY') params.dueDate = 'today';
        if (activeTab === 'UPCOMING') params.dueDate = 'upcoming';
        if (activeTab === 'OVERDUE') params.overdue = true;
        if (activeTab === 'COMPLETED') params.status = 'COMPLETED';
      }

      const res = await taskService.getTasks(params);
      if (res.success && res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, activeTab, search, statusFilter, priorityFilter, assignedToFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await taskService.changeStatus(taskId, newStatus);
      if (res.success) {
        toast.success(`Task status changed to ${newStatus.replace('_', ' ')}`);
        fetchTasks();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.normalizedMessage || 'Failed to update task status');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'My Work Group', href: '/dashboard/tasks' },
          { label: 'Tasks' },
        ]}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Task Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize, assign, track, and manage team tasks with ease.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              fetchStats();
              fetchTasks();
            }}
            variant="outline"
            className="rounded-xl p-2.5"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {canViewAnalytics && (
            <Button
              onClick={() => navigate(`/${getLoggedUser()?.username}/dashboard/tasks/analytics`)}
              variant="outline"
              className="rounded-xl px-3.5 py-2.5 flex items-center gap-2 font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Analytics
            </Button>
          )}

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 px-4 py-2.5 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Task
          </Button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tasks</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {statsLoading ? '...' : stats.total_tasks}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Due Today</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {statsLoading ? '...' : stats.due_today_count}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {statsLoading ? '...' : stats.overdue_count}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">In Progress</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {statsLoading ? '...' : stats.in_progress_count}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5 col-span-2 lg:col-span-1">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {statsLoading ? '...' : stats.completed_count}
            </div>
          </div>
        </div>
      </div>

      {/* Main View Mode Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => {
              setViewMode('my_tasks');
              setActiveTab('ALL');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'my_tasks'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Tasks
          </button>

          <button
            onClick={() => {
              setViewMode('assigned_by_me');
              setActiveTab('ALL');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'assigned_by_me'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Assigned by Me
          </button>

          {canManage && (
            <button
              onClick={() => {
                setViewMode('management');
                setActiveTab('ALL');
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'management'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Team Tasks
            </button>
          )}
        </div>

        {/* Layout Mode Selector: Grid / List / Kanban */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            onClick={() => setLayoutMode('grid')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              layoutMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" /> Grid
          </button>
          <button
            onClick={() => setLayoutMode('list')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              layoutMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => setLayoutMode('kanban')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              layoutMode === 'kanban'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Kanban Board View"
          >
            <Kanban className="w-4 h-4" /> Kanban
          </button>
        </div>
      </div>

      {/* Filter / Tabs Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Sub-tabs for My Tasks */}
        {viewMode === 'my_tasks' ? (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Tasks' },
              { id: 'TODAY', label: 'Today', badge: stats.due_today_count },
              { id: 'UPCOMING', label: 'Upcoming' },
              { id: 'OVERDUE', label: 'Overdue', badge: stats.overdue_count, color: 'text-rose-500' },
              { id: 'COMPLETED', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            All Team Tasks ({tasks.length})
          </div>
        )}

        {/* Search & Select Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Priority: All</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          {/* Assignee Filter (for Management View) */}
          {canManage && viewMode === 'management' && (
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">Assignee: All</option>
              {manageableUsers.map((u) => (
                <option key={u.username} value={u.username}>
                  {u.name || u.username}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Task List / Grid / Kanban Container */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-3">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No tasks found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
            {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'No tasks match your current filters. Try resetting search or filters.'
              : 'You have no active tasks. Create a new task to get started.'}
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Create Task
          </Button>
        </div>
      ) : layoutMode === 'kanban' ? (
        <TaskKanbanView tasks={tasks} onStatusChange={handleStatusChange} onEdit={handleEditTask} />
      ) : layoutMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
          ))}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        taskToEdit={taskToEdit}
        onTaskCreated={() => {
          fetchStats();
          fetchTasks();
        }}
      />
    </div>
  );
}
