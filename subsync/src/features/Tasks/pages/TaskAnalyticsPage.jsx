import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Users,
  Calendar,
  RefreshCw,
  ArrowLeft,
  Filter,
  CheckCircle2,
  AlertCircle,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PieChart,
  Activity,
  Layers,
  Search,
  RotateCcw,
  SlidersHorizontal,
  FileText,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { Breadcrumb } from '@/components/ui/breadcrumb.jsx';
import CategorySelect from '../components/CategorySelect.jsx';
import { taskService } from '../services/taskService';
import { useTheme } from '@/context/ThemeContext';
import { getLoggedUser } from '@/utils/userUtils';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TaskAnalyticsPage() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const currentUser = getLoggedUser();

  // Collapsible Filters State
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // Filters State
  const [dateRange, setDateRange] = useState('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [manageableUsers, setManageableUsers] = useState([]);

  // Fetch Analytics Data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await taskService.getTaskAnalytics({
        dateRange,
        startDate: dateRange === 'custom' ? startDate : undefined,
        endDate: dateRange === 'custom' ? endDate : undefined,
        status: selectedStatus,
        priority: selectedPriority,
        category: selectedCategory,
        assignedTo: selectedAssignee,
        search: searchQuery,
      });
      if (res?.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load task analytics:', err);
      toast.error('Failed to load task analytics data');
    } finally {
      setLoading(false);
    }
  }, [
    dateRange,
    startDate,
    endDate,
    selectedStatus,
    selectedPriority,
    selectedCategory,
    selectedAssignee,
    searchQuery,
  ]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await taskService.getManageableUsers();
      if (res?.success) {
        setManageableUsers(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch manageable users:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleResetFilters = () => {
    setDateRange('30d');
    setStartDate('');
    setEndDate('');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSelectedCategory('ALL');
    setSelectedAssignee('ALL');
    setSearchQuery('');
  };

  // Active filters counter & summary calculation
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateRange !== '30d') count++;
    if (selectedStatus !== 'ALL') count++;
    if (selectedPriority !== 'ALL') count++;
    if (selectedCategory !== 'ALL') count++;
    if (selectedAssignee !== 'ALL') count++;
    if (searchQuery.trim() !== '') count++;
    return count;
  }, [dateRange, selectedStatus, selectedPriority, selectedCategory, selectedAssignee, searchQuery]);

  const activeFiltersSummaryText = useMemo(() => {
    const parts = [];
    parts.push(`Timeframe: ${dateRange === 'custom' ? `${startDate || 'Start'} to ${endDate || 'End'}` : dateRange.toUpperCase()}`);
    if (selectedStatus !== 'ALL') parts.push(`Status: ${selectedStatus}`);
    if (selectedPriority !== 'ALL') parts.push(`Priority: ${selectedPriority}`);
    if (selectedCategory !== 'ALL') parts.push(`Category: ${selectedCategory}`);
    if (selectedAssignee !== 'ALL') parts.push(`Assignee: ${selectedAssignee}`);
    if (searchQuery.trim()) parts.push(`Search: "${searchQuery.trim()}"`);
    return parts.join(' | ');
  }, [dateRange, startDate, endDate, selectedStatus, selectedPriority, selectedCategory, selectedAssignee, searchQuery]);

  const kpi = analytics?.kpi || {
    totalTasks: 0,
    completedCount: 0,
    inProgressCount: 0,
    todoCount: 0,
    blockedCount: 0,
    cancelledCount: 0,
    overdueCount: 0,
    highPriorityOpenCount: 0,
    completionRate: 0,
    overdueRate: 0,
    onTimeRate: 100,
    avgCompletionDays: 0,
  };

  // Categories available
  const availableCategories = useMemo(() => {
    const defaultCats = [
      'General',
      'Project',
      'Bug',
      'Feature',
      'Client Support',
      'Maintenance',
      'Operations',
      'HR/Admin',
    ];
    const serverCats = (analytics?.categoryBreakdown || []).map((c) => c.category);
    return Array.from(new Set([...defaultCats, ...serverCats]));
  }, [analytics?.categoryBreakdown]);

  // Export Executive PDF Report
  const handleExportPDF = () => {
    try {
      setExporting(true);
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const author = currentUser?.name || currentUser?.username || 'System Administrator';

      // 1. Report Title & Header
      doc.setFillColor(30, 41, 59); // Dark slate header #1e293b
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('OCS365 OPERATIONAL TASK & PERFORMANCE REPORT', 14, 12);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Executive Summary & Team Workload Intelligence Report', 14, 18);

      doc.setFontSize(7.5);
      doc.text(`Generated: ${timestamp}  |  By: ${author}  |  Scope: Tasks Intelligence`, 14, 24);

      // 2. Active Filters Box
      doc.setFillColor(241, 245, 249);
      doc.rect(14, 32, 182, 14, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, 32, 182, 14, 'S');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORT PARAMETERS & APPLIED FILTERS:', 18, 37);
      doc.setFont('helvetica', 'normal');
      doc.text(activeFiltersSummaryText.substring(0, 110), 18, 42);

      // 3. Executive KPI Summary Table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive KPI Metric Summary', 14, 53);

      autoTable(doc, {
        startY: 56,
        head: [['Metric Name', 'Metric Value', 'Operational Status / Detail']],
        body: [
          ['Total Tasks', `${kpi.totalTasks}`, `${kpi.completedCount} Tasks Completed`],
          ['Completion Rate', `${kpi.completionRate}%`, `${kpi.completedCount} of ${kpi.totalTasks} Tasks Resolved`],
          ['Overdue Tasks', `${kpi.overdueCount}`, `Overdue Rate: ${kpi.overdueRate}%`],
          ['Avg Resolution Speed', `${kpi.avgCompletionDays} days`, 'Creation to Final Resolution'],
          ['High / Urgent Open', `${kpi.highPriorityOpenCount}`, 'Open High Priority Items'],
          ['On-Time Delivery Rate', `${kpi.onTimeRate}%`, 'Met Original Target Due Date'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      // 4. Team Workload & Efficiency Leaderboard
      const currentY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Team Workload & Resolution Efficiency Leaderboard', 14, currentY);

      const teamRows = (analytics?.assigneeWorkload || []).map((row) => [
        row.name || row.username,
        `@${row.username}`,
        `${row.totalAssigned}`,
        `${row.completedCount}`,
        `${row.inProgressCount}`,
        `${row.overdueCount}`,
        `${row.completionRate}%`,
        row.avgCompletionDays > 0 ? `${row.avgCompletionDays} days` : 'N/A',
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['Team Member', 'Username', 'Assigned', 'Completed', 'In Progress', 'Overdue', 'Completion %', 'Avg Speed']],
        body: teamRows.length ? teamRows : [['No team members found for current filters', '', '', '', '', '', '', '']],
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      // 5. Critical & Overdue Watchlist
      const watchlistY = doc.lastAutoTable.finalY + 10;
      if (watchlistY < 250) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Critical & Overdue Task Watchlist', 14, watchlistY);

        const overdueRows = (analytics?.overdueWatchlist || []).map((task) => [
          task.title,
          task.priority,
          task.assignee_name || task.assigned_to || 'Unassigned',
          `${task.days_overdue} days overdue`,
        ]);

        autoTable(doc, {
          startY: watchlistY + 3,
          head: [['Task Title', 'Priority', 'Assignee', 'Days Overdue']],
          body: overdueRows.length ? overdueRows : [['No overdue tasks. All operational tasks on schedule.', '', '', '']],
          theme: 'grid',
          headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2.5 },
        });
      }

      // Page Footers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`OCS365 Operational Task Intelligence Report — Confidential — Page ${i} of ${pageCount}`, 14, 287);
      }

      doc.save(`task_analytics_report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Executive PDF report generated and downloaded!');
    } catch (err) {
      console.error('Failed to export PDF report:', err);
      toast.error('Failed to export PDF report');
    } finally {
      setExporting(false);
    }
  };

  // Export Clean Excel / CSV Spreadsheet Report
  const handleExportExcel = () => {
    try {
      setExporting(true);
      const timestamp = new Date().toLocaleString();
      const author = currentUser?.name || currentUser?.username || 'System Administrator';

      const exportRows = [];

      // Metadata Header
      exportRows.push({ 'REPORT SECTION': 'OCS365 OPERATIONAL TASK & PERFORMANCE REPORT', 'FIELD / MEMBER': '', 'METRIC 1': '', 'METRIC 2': '', 'METRIC 3': '' });
      exportRows.push({ 'REPORT SECTION': 'Generated On', 'FIELD / MEMBER': timestamp, 'METRIC 1': '', 'METRIC 2': '', 'METRIC 3': '' });
      exportRows.push({ 'REPORT SECTION': 'Generated By', 'FIELD / MEMBER': author, 'METRIC 1': '', 'METRIC 2': '', 'METRIC 3': '' });
      exportRows.push({ 'REPORT SECTION': 'Applied Filters', 'FIELD / MEMBER': activeFiltersSummaryText, 'METRIC 1': '', 'METRIC 2': '', 'METRIC 3': '' });
      exportRows.push({});

      // Executive KPIs
      exportRows.push({ 'REPORT SECTION': '--- EXECUTIVE KPI SUMMARY ---', 'FIELD / MEMBER': '', 'METRIC 1': '', 'METRIC 2': '', 'METRIC 3': '' });
      exportRows.push({ 'REPORT SECTION': 'Total Tasks', 'FIELD / MEMBER': kpi.totalTasks, 'METRIC 1': `Completed: ${kpi.completedCount}`, 'METRIC 2': `In Progress: ${kpi.inProgressCount}`, 'METRIC 3': `To Do: ${kpi.todoCount}` });
      exportRows.push({ 'REPORT SECTION': 'Completion Rate', 'FIELD / MEMBER': `${kpi.completionRate}%`, 'METRIC 1': '', 'METRIC 2': '', 'METRIC 3': '' });
      exportRows.push({ 'REPORT SECTION': 'Overdue Tasks', 'FIELD / MEMBER': kpi.overdueCount, 'METRIC 1': `Overdue Rate: ${kpi.overdueRate}%`, 'METRIC 2': '', 'METRIC 3': '' });
      exportRows.push({ 'REPORT SECTION': 'Avg Resolution Speed', 'FIELD / MEMBER': `${kpi.avgCompletionDays} days`, 'METRIC 1': '', 'METRIC 2': '', 'METRIC 3': '' });
      exportRows.push({ 'REPORT SECTION': 'High/Urgent Open', 'FIELD / MEMBER': kpi.highPriorityOpenCount, 'METRIC 1': '', 'METRIC 2': '', 'METRIC 3': '' });
      exportRows.push({ 'REPORT SECTION': 'On-Time Delivery', 'FIELD / MEMBER': `${kpi.onTimeRate}%`, 'METRIC 1': '', 'METRIC 2': '', 'METRIC 3': '' });
      exportRows.push({});

      // Team Workload
      exportRows.push({ 'REPORT SECTION': '--- TEAM WORKLOAD LEADERBOARD ---', 'FIELD / MEMBER': '', 'METRIC 1': '', 'METRIC 2': '', 'METRIC 3': '' });
      (analytics?.assigneeWorkload || []).forEach((row) => {
        exportRows.push({
          'REPORT SECTION': row.name || row.username,
          'FIELD / MEMBER': `@${row.username}`,
          'METRIC 1': `Assigned: ${row.totalAssigned}`,
          'METRIC 2': `Completed: ${row.completedCount} (${row.completionRate}%)`,
          'METRIC 3': `Overdue: ${row.overdueCount} | Speed: ${row.avgCompletionDays}d`,
        });
      });
      exportRows.push({});

      // Overdue Watchlist
      exportRows.push({ 'REPORT SECTION': '--- OVERDUE TASK WATCHLIST ---', 'FIELD / MEMBER': '', 'METRIC 1': '', 'METRIC 2': '', 'METRIC 3': '' });
      (analytics?.overdueWatchlist || []).forEach((task) => {
        exportRows.push({
          'REPORT SECTION': task.title,
          'FIELD / MEMBER': `Priority: ${task.priority}`,
          'METRIC 1': `Assignee: ${task.assignee_name || task.assigned_to || 'Unassigned'}`,
          'METRIC 2': `${task.days_overdue} days overdue`,
          'METRIC 3': '',
        });
      });

      const csv = Papa.unparse(exportRows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `task_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Task Analytics report exported to Excel/CSV successfully!');
    } catch (err) {
      console.error('Failed to export Excel/CSV report:', err);
      toast.error('Failed to export report to Excel/CSV');
    } finally {
      setExporting(false);
    }
  };

  // Status Doughnut Chart Data
  const statusChartData = useMemo(() => {
    return {
      labels: ['To Do', 'In Progress', 'Blocked', 'Completed', 'Cancelled'],
      datasets: [
        {
          data: [
            kpi.todoCount || 0,
            kpi.inProgressCount || 0,
            kpi.blockedCount || 0,
            kpi.completedCount || 0,
            kpi.cancelledCount || 0,
          ],
          backgroundColor: [
            '#64748B', // TODO (Slate)
            '#3B82F6', // IN_PROGRESS (Blue)
            '#EF4444', // BLOCKED (Red)
            '#10B981', // COMPLETED (Emerald)
            '#9CA3AF', // CANCELLED (Gray)
          ],
          borderWidth: 2,
          borderColor: isDark ? '#1F2937' : '#FFFFFF',
          hoverOffset: 6,
        },
      ],
    };
  }, [kpi, isDark]);

  // Priority Bar Chart Data
  const priorityChartData = useMemo(() => {
    const p = analytics?.priorityBreakdown || {};
    return {
      labels: ['Urgent', 'High', 'Medium', 'Low'],
      datasets: [
        {
          label: 'Task Count',
          data: [p.URGENT || 0, p.HIGH || 0, p.MEDIUM || 0, p.LOW || 0],
          backgroundColor: [
            'rgba(239, 68, 68, 0.85)',   // Urgent
            'rgba(249, 115, 22, 0.85)',  // High
            'rgba(59, 130, 246, 0.85)',  // Medium
            'rgba(107, 114, 128, 0.85)', // Low
          ],
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  }, [analytics?.priorityBreakdown]);

  // Trend View Mode: 'daily' | 'monthly'
  const [trendViewMode, setTrendViewMode] = useState('monthly');

  // Trend Timeline Line Chart Data
  const trendChartData = useMemo(() => {
    if (trendViewMode === 'monthly') {
      const monthly = analytics?.monthlyTrend || [];
      const labels = monthly.map((item) => {
        if (!item.month_str) return 'N/A';
        const [y, m] = item.month_str.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
        return dateObj.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      });

      return {
        labels: labels.length ? labels : ['No Data'],
        datasets: [
          {
            label: 'Tasks Created',
            data: monthly.map((item) => item.created_count || 0),
            borderColor: '#6366F1',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            fill: true,
            tension: 0.35,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'Tasks Completed',
            data: monthly.map((item) => item.completed_count || 0),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            tension: 0.35,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      };
    }

    const timeline = analytics?.trendTimeline || [];
    const labels = timeline.map((item) => {
      const d = new Date(item.date_str);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    return {
      labels: labels.length ? labels : ['No Data'],
      datasets: [
        {
          label: 'Tasks Created',
          data: timeline.map((item) => item.created_count || 0),
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Tasks Completed',
          data: timeline.map((item) => item.completed_count || 0),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [analytics?.trendTimeline, analytics?.monthlyTrend, trendViewMode]);

  const chartOptionsBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDark ? '#D1D5DB' : '#374151',
          font: { family: 'Inter, sans-serif', size: 11, weight: 500 },
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#111827' : '#FFFFFF',
        titleColor: isDark ? '#F9FAFB' : '#111827',
        bodyColor: isDark ? '#E5E7EB' : '#374151',
        borderColor: isDark ? '#374151' : '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      },
    },
  };

  const lineChartOptions = {
    ...chartOptionsBase,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDark ? '#9CA3AF' : '#6B7280', font: { size: 10 } },
      },
      y: {
        grid: { color: isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.8)' },
        ticks: { color: isDark ? '#9CA3AF' : '#6B7280', precision: 0, font: { size: 10 } },
        beginAtZero: true,
      },
    },
  };

  const barChartOptions = {
    ...chartOptionsBase,
    plugins: {
      ...chartOptionsBase.plugins,
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDark ? '#9CA3AF' : '#6B7280', font: { size: 10, weight: 600 } },
      },
      y: {
        grid: { color: isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.8)' },
        ticks: { color: isDark ? '#9CA3AF' : '#6B7280', precision: 0, font: { size: 10 } },
        beginAtZero: true,
      },
    },
  };

  const doughnutChartOptions = {
    ...chartOptionsBase,
    cutout: '70%',
  };

  return (
    <div className="min-h-screen  dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <div>
          <Breadcrumb
            items={[
              { label: 'MY WORK', href: `/${username}/dashboard/tasks` },
              { label: 'Tasks', href: `/${username}/dashboard/tasks` },
              { label: 'Analytics & Intelligence' },
            ]}
          />
          <div className="flex items-center gap-3 mt-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Task Analytics & Operational Intelligence
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Single-page unified dashboard for task metrics, team workload, and resolution performance.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Board, Export Excel, Export PDF, Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate(`/${username}/dashboard/tasks`)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Task Board
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-sm disabled:opacity-50 font-semibold"
            title="Export full analytics report to Excel / CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Export Excel
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50 font-semibold"
            title="Export formatted executive PDF report"
          >
            <FileText className="h-4 w-4" />
            Export PDF Report
          </button>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Unified Collapsible Filters Toolbar */}
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all ${isFilterCollapsed ? 'overflow-hidden' : 'overflow-visible'}`}>
        <div className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none" onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Analytics Filter Controls
                </h2>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>
              {isFilterCollapsed && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xl">
                  {activeFiltersSummaryText}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetFilters();
                }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            )}
            <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              {isFilterCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Filter Body */}
        {!isFilterCollapsed && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {/* Search Filter */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Search Tasks
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, description, category..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Date Range Preset */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Timeframe
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="ytd">Year to Date</option>
                  <option value="custom">Custom Date Range</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Category
                </label>
                <CategorySelect
                  value={selectedCategory}
                  onChange={(newCat) => setSelectedCategory(newCat)}
                  categories={availableCategories}
                  placeholder="Category: All"
                  buttonVariant="filter"
                  className="w-full h-[34px] flex items-center justify-between"
                />
              </div>

              {/* Assignee / Team Member Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Team Member
                </label>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Assignees</option>
                  {manageableUsers.map((u) => (
                    <option key={u.username} value={u.username}>
                      {u.name || u.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Date Inputs (If 'custom' selected) */}
            {dateRange === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Tasks */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {loading ? '...' : kpi.totalTasks}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">tasks recorded</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            {kpi.completedCount} completed
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completion Rate
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {loading ? '...' : `${kpi.completionRate}%`}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpi.completionRate)}%` }}
            />
          </div>
        </div>

        {/* Overdue Rate */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overdue Tasks
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {loading ? '...' : kpi.overdueCount}
            </span>
            <span className="text-xs text-rose-500 font-bold">({kpi.overdueRate}%)</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {kpi.overdueCount > 0 ? 'Requires action' : 'All on schedule'}
          </div>
        </div>

        {/* Avg Resolution Speed */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg Resolution
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {loading ? '...' : kpi.avgCompletionDays}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">days</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Creation to completion
          </div>
        </div>

        {/* High Priority Open */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              High Priority Open
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {loading ? '...' : kpi.highPriorityOpenCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">tasks</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
            Urgent items
          </div>
        </div>

        {/* On-Time Rate */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              On-Time Delivery
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {loading ? '...' : `${kpi.onTimeRate}%`}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Met due date
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Status Breakdown & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="h-4 w-4 text-blue-500" />
                Status Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Proportion of tasks across workflow states
              </p>
            </div>
          </div>

          <div className="relative h-64 flex items-center justify-center">
            {loading ? (
              <div className="animate-pulse flex items-center justify-center text-xs text-slate-400">
                Loading status chart...
              </div>
            ) : (
              <Doughnut data={statusChartData} options={doughnutChartOptions} />
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-500" />
                Task Priority Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Volume of tasks categorized by priority level
              </p>
            </div>
          </div>

          <div className="h-64">
            {loading ? (
              <div className="animate-pulse h-full flex items-center justify-center text-xs text-slate-400">
                Loading priority chart...
              </div>
            ) : (
              <Bar data={priorityChartData} options={barChartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Throughput Trend Timeline & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Creation vs Completion Trend Line Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                Task Creation vs Completion Velocity ({trendViewMode === 'monthly' ? 'Monthly View' : 'Daily View'})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {trendViewMode === 'monthly' ? 'Month-by-month team performance and task throughput' : 'Daily timeline tracking task inflow and resolution rate'}
              </p>
            </div>

            {/* Granularity Switcher: Daily vs Monthly */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTrendViewMode('daily')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  trendViewMode === 'daily'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setTrendViewMode('monthly')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  trendViewMode === 'monthly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="h-72">
            {loading ? (
              <div className="animate-pulse h-full flex items-center justify-center text-xs text-slate-400">
                Loading trend chart...
              </div>
            ) : (
              <Line data={trendChartData} options={lineChartOptions} />
            )}
          </div>

          {/* Monthly Performance Breakdown Table when Monthly View is selected */}
          {trendViewMode === 'monthly' && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Month-by-Month Performance Metrics
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-2 rounded-l-lg">Month</th>
                      <th className="p-2 text-right">Created</th>
                      <th className="p-2 text-right">Completed</th>
                      <th className="p-2 text-right">Overdue</th>
                      <th className="p-2 text-right rounded-r-lg">Avg Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(analytics?.monthlyTrend || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 text-xs">No monthly records found</td>
                      </tr>
                    ) : (
                      (analytics?.monthlyTrend || []).map((m) => {
                        const [y, monthNum] = (m.month_str || '').split('-');
                        const monthLabel = m.month_str ? new Date(parseInt(y), parseInt(monthNum) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Unknown';
                        return (
                          <tr key={m.month_str} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-slate-900 dark:text-white">{monthLabel}</td>
                            <td className="p-2 text-right font-medium text-indigo-600 dark:text-indigo-400">{m.created_count || 0}</td>
                            <td className="p-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">{m.completed_count || 0}</td>
                            <td className="p-2 text-right font-semibold text-rose-500">{m.overdue_count || 0}</td>
                            <td className="p-2 text-right font-medium text-slate-500 dark:text-slate-400">
                              {m.avg_completion_days ? `${Number(m.avg_completion_days).toFixed(1)} days` : 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Category Spread
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Top operational task categories
            </p>

            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                ))}
              </div>
            ) : (analytics?.categoryBreakdown || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No categories recorded</div>
            ) : (
              <div className="space-y-3">
                {(analytics?.categoryBreakdown || []).map((catItem) => {
                  const pct = kpi.totalTasks > 0 ? Math.round((catItem.count / kpi.totalTasks) * 100) : 0;
                  return (
                    <div key={catItem.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 dark:text-slate-200">{catItem.category}</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {catItem.count} tasks ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Team Workload & Leaderboard Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Team Workload & Resolution Efficiency
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Task distribution, completion rates, and overdue metrics per team member
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                <th className="px-5 py-3.5">Team Member</th>
                <th className="px-4 py-3.5 text-center">Total Assigned</th>
                <th className="px-4 py-3.5 text-center">Completed</th>
                <th className="px-4 py-3.5 text-center">In Progress</th>
                <th className="px-4 py-3.5 text-center">Overdue</th>
                <th className="px-4 py-3.5 text-center">Completion %</th>
                <th className="px-4 py-3.5 text-center">Avg Resolution Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    Loading team workload data...
                  </td>
                </tr>
              ) : (analytics?.assigneeWorkload || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No team task records found for current filters.
                  </td>
                </tr>
              ) : (
                (analytics?.assigneeWorkload || []).map((row) => (
                  <tr
                    key={row.username}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                        {row.name ? row.name.charAt(0) : row.username.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{row.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{row.username}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-900 dark:text-white">
                      {row.totalAssigned}
                    </td>
                    <td className="px-4 py-3.5 text-center text-emerald-600 font-semibold">
                      {row.completedCount}
                    </td>
                    <td className="px-4 py-3.5 text-center text-blue-600 font-medium">
                      {row.inProgressCount}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {row.overdueCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                          {row.overdueCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${row.completionRate}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {row.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium text-slate-600 dark:text-slate-300">
                      {row.avgCompletionDays > 0 ? `${row.avgCompletionDays} days` : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Critical Overdue & At-Risk Watchlist */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              Critical & Overdue Task Watchlist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tasks past their due date requiring immediate administrative action
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading risk watchlist...</div>
        ) : (analytics?.overdueWatchlist || []).length === 0 ? (
          <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            No overdue tasks matching current filters. All operational tasks are on schedule.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(analytics?.overdueWatchlist || []).map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/${username}/dashboard/tasks/${task.id}`)}
                className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-800 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        task.priority === 'URGENT'
                          ? 'bg-rose-600 text-white'
                          : 'bg-orange-500 text-white'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Assignee: {task.assignee_name || task.assigned_to || 'Unassigned'}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      {task.days_overdue} days overdue
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
