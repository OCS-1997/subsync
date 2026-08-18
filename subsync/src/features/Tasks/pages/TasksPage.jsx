import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { usePermissions } from '@/context/PermissionsContext';
import { PERMISSIONS } from '@/constants/permissions';
import { taskService } from '../services/taskService';
import { fetchTaskStats } from '../taskSlice';
import TaskCard from '../components/TaskCard';
import TaskKanbanView from '../components/TaskKanbanView';
import CreateTaskModal from '../components/CreateTaskModal';
import { CategorySelect } from '../components/CategorySelect';
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
  ChevronRight,
  X,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { getLoggedUser } from '@/utils/userUtils';

export default function TasksPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [assignedToFilter, setAssignedToFilter] = useState('ALL');
  const [manageableUsers, setManageableUsers] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSplitupModalOpen, setIsSplitupModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const currentUser = getLoggedUser();

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setIsCreateModalOpen(true);
  };

  // Load // Fetch KPI stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      dispatch(fetchTaskStats());
      const res = await taskService.getTaskStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load task stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [dispatch]);

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

  // Load Categories for filter
  useEffect(() => {
    taskService.getTaskCategories()
      .then((res) => {
        if (res.success && res.data) {
          setAvailableCategories(res.data);
        }
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Load Tasks List
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const clientTodayStr = `${year}-${month}-${day}`;
      const params = {
        tab: viewMode,
        search,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        assignedTo: assignedToFilter !== 'ALL' ? assignedToFilter : undefined,
        clientDate: clientTodayStr,
      };

      if (activeTab === 'TODAY') params.dueDate = 'today';
      if (activeTab === 'UPCOMING') params.dueDate = 'upcoming';
      if (activeTab === 'OVERDUE') params.overdue = true;
      if (activeTab === 'COMPLETED') params.status = 'COMPLETED';

      const res = await taskService.getTasks(params);
      if (res.success && res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, activeTab, search, statusFilter, priorityFilter, categoryFilter, assignedToFilter]);

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
        dispatch(fetchTaskStats());
      }
    } catch (err) {
      toast.error(err.normalizedMessage || 'Failed to update task status');
    }
  };

  const getTabBadges = () => {
    if (viewMode === 'my_tasks') {
      return {
        today: Number(stats.my_due_today_count ?? stats.due_today_count ?? 0),
        overdue: Number(stats.my_overdue_count ?? stats.overdue_count ?? 0),
      };
    }
    if (viewMode === 'assigned_by_me') {
      return {
        today: Number(stats.created_by_due_today_count ?? stats.due_today_count ?? 0),
        overdue: Number(stats.created_by_overdue_count ?? stats.overdue_count ?? 0),
      };
    }
    if (viewMode === 'management') {
      if (assignedToFilter !== 'ALL' && Array.isArray(stats.by_assignee)) {
        const targetUser = stats.by_assignee.find((u) => u.username === assignedToFilter);
        return {
          today: Number(targetUser?.due_today_count ?? 0),
          overdue: Number(targetUser?.overdue_count ?? 0),
        };
      }
      return {
        today: Number(stats.due_today_count ?? 0),
        overdue: Number(stats.overdue_count ?? 0),
      };
    }
    return {
      today: Number(stats.due_today_count ?? 0),
      overdue: Number(stats.overdue_count ?? 0),
    };
  };

  const tabBadges = getTabBadges();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'MY WORK', href: '/dashboard/tasks' },
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

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
              className="rounded-xl px-3 sm:px-3.5 py-2.5 flex items-center gap-2 text-xs sm:text-sm font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden xs:inline">Analytics</span>
            </Button>
          )}

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Task
          </Button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Tasks Card (Interactive with Splitup) */}
        <div 
          onClick={() => setIsSplitupModalOpen(true)}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group flex flex-col justify-between"
          title="Click to view full task distribution splitup"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tasks</div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {statsLoading ? '...' : stats.total_tasks}
                </div>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center gap-0.5 shadow-sm shrink-0">
              Splitup <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium truncate">
              <User className="w-3 h-3 text-blue-500 shrink-0" /> Your Open Tasks:
            </span>
            <strong className="text-blue-600 dark:text-blue-400 font-extrabold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 shrink-0">
              {statsLoading ? '...' : (stats.my_open_tasks ?? 0)}
            </strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shrink-0">
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
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
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
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">In Progress</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {statsLoading ? '...' : stats.in_progress_count}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5 sm:col-span-2 md:col-span-1">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
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
        <div className="flex items-center gap-1 flex-wrap py-0.5">
          <button
            onClick={() => {
              setViewMode('my_tasks');
              setActiveTab('ALL');
            }}
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
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
            className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
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
              className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
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
        <div className="flex items-center justify-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60">
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

      {/* Filter / Tabs Container */}
      <div className="flex flex-col gap-3.5">
        {/* Sub-tabs Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All Tasks' },
            { 
              id: 'TODAY', 
              label: 'Today', 
              badge: tabBadges.today 
            },
            { id: 'UPCOMING', label: 'Upcoming' },
            { 
              id: 'OVERDUE', 
              label: 'Overdue', 
              badge: tabBadges.overdue, 
              color: 'text-rose-500' 
            },
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

        {/* Search & Select Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
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
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
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
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Priority: All</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          {/* Category Filter */}
          <CategorySelect
            value={categoryFilter}
            onChange={(newCat) => setCategoryFilter(newCat)}
            categories={availableCategories}
            buttonVariant="filter"
            allowCustom={true}
          />

          {/* Assignee Filter (for Management View) */}
          {canManage && viewMode === 'management' && (
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
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
            <TaskCard key={task.id} task={task} onEdit={handleEditTask} viewMode="grid" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={handleEditTask} viewMode="list" />
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

      {/* Task Splitup Modal */}
      {isSplitupModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {canManage ? 'Team Task Distribution & Splitup' : 'Your Tasks Splitup'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {canManage ? "Everyone's task assignments, stages, and status splitup." : 'Detailed breakdown of your assigned tasks.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSplitupModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 max-h-[75vh] scrollbar-thin">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                  <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {canManage ? 'Total Team Tasks' : 'Your Total Tasks'}
                  </div>
                  <div className="text-2xl font-black text-blue-950 dark:text-blue-100 mt-1">
                    {stats.total_tasks}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                  <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Your Open Tasks
                  </div>
                  <div className="text-2xl font-black text-indigo-950 dark:text-indigo-100 mt-1">
                    {stats.my_open_tasks ?? 0}
                  </div>
                </div>
              </div>

              {/* Status Breakdown List */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Status Stage Breakdown</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click status to filter</span>
                </div>

                <div className="space-y-2">
                  {[
                    { status: 'TODO', label: 'To Do', count: Number(stats.todo_count) || 0, color: 'bg-slate-500', badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
                    { status: 'IN_PROGRESS', label: 'In Progress', count: Number(stats.in_progress_count) || 0, color: 'bg-indigo-500', badgeClass: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' },
                    { status: 'BLOCKED', label: 'Blocked', count: Number(stats.blocked_count) || 0, color: 'bg-amber-500', badgeClass: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' },
                    { status: 'COMPLETED', label: 'Completed', count: Number(stats.completed_count) || 0, color: 'bg-emerald-500', badgeClass: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' },
                    { status: 'CANCELLED', label: 'Cancelled', count: Number(stats.cancelled_count) || 0, color: 'bg-rose-500', badgeClass: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' },
                  ].map((item) => {
                    const pct = Number(stats.total_tasks) > 0 ? Math.round((item.count / stats.total_tasks) * 100) : 0;
                    return (
                      <div
                        key={item.status}
                        onClick={() => {
                          setStatusFilter(item.status);
                          setIsSplitupModalOpen(false);
                        }}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                            {item.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-400">{pct}%</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${item.badgeClass}`}>
                              {item.count}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team Member Breakdown (Only for Admins / Managers with Permission) */}
              {canManage && stats.by_assignee && stats.by_assignee.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Team Member Splitup ({stats.by_assignee.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Click member to filter tasks</span>
                  </div>

                  <div className="space-y-2.5">
                    {stats.by_assignee.map((member) => {
                      const todo = Number(member.todo_count) || 0;
                      const inProg = Number(member.in_progress_count) || 0;
                      const blocked = Number(member.blocked_count) || 0;
                      const completed = Number(member.completed_count) || 0;
                      const total = Number(member.total) || 0;

                      return (
                        <div
                          key={member.username}
                          onClick={() => {
                            setViewMode('management');
                            setAssignedToFilter(member.username);
                            setIsSplitupModalOpen(false);
                          }}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer space-y-2.5 group hover:border-blue-400 dark:hover:border-blue-500 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800">
                                {(member.name || member.username || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {member.name || member.username}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  @{member.username}
                                </div>
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              {total} {total === 1 ? 'task' : 'tasks'}
                            </span>
                          </div>

                          {/* Member Stage Pills */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            {todo > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                                {todo} To Do
                              </span>
                            )}
                            {inProg > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                                {inProg} In Progress
                              </span>
                            )}
                            {blocked > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
                                {blocked} Blocked
                              </span>
                            )}
                            {completed > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                                {completed} Completed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
              <Button
                onClick={() => setIsSplitupModalOpen(false)}
                variant="outline"
                className="rounded-xl px-4 py-2 text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
