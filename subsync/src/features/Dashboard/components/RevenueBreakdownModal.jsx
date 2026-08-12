import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import {
    TrendingUp,
    DollarSign,
    Layers,
    Users,
    Package,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Info,
    Calendar,
    ChevronRight,
    PieChart as PieChartIcon,
    BarChart2,
    CheckCircle2,
    AlertCircle,
    Building2,
    Tag,
    X
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import api from '@/lib/axiosInstance';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];

export default function RevenueBreakdownModal({ isOpen, onClose }) {
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'mrr' | 'services' | 'customers' | 'trend'
    const [searchTerm, setSearchTerm] = useState('');
    const [showExplanation, setShowExplanation] = useState(true);

    const monthOptions = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const yearOptions = [
        now.getFullYear() - 1,
        now.getFullYear(),
        now.getFullYear() + 1
    ];

    useEffect(() => {
        if (!isOpen) return;

        const fetchBreakdown = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get('/dashboard/revenue-breakdown', {
                    params: { year: selectedYear, month: selectedMonth }
                });
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch revenue breakdown:', err);
                setError('Failed to load revenue breakdown data.');
            } finally {
                setLoading(false);
            }
        };

        fetchBreakdown();
    }, [isOpen, selectedYear, selectedMonth]);

    const formatExactCurrency = (value) => {
        const num = Number(value) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const formatCompactCurrency = (value) => {
        const val = Number(value) || 0;
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
        return `₹${val.toLocaleString('en-IN')}`;
    };

    // Filtered new subscriptions
    const filteredNewSubs = useMemo(() => {
        if (!data?.newSubscriptions) return [];
        if (!searchTerm.trim()) return data.newSubscriptions;
        const q = searchTerm.toLowerCase();
        return data.newSubscriptions.filter(s =>
            (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
            (s.domain_name && s.domain_name.toLowerCase().includes(q)) ||
            (s.sub_id && s.sub_id.toLowerCase().includes(q))
        );
    }, [data, searchTerm]);

    // Filtered MRR subscriptions
    const filteredMrrSubs = useMemo(() => {
        if (!data?.mrrSubscriptions) return [];
        if (!searchTerm.trim()) return data.mrrSubscriptions;
        const q = searchTerm.toLowerCase();
        return data.mrrSubscriptions.filter(s =>
            (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
            (s.domain_name && s.domain_name.toLowerCase().includes(q)) ||
            (s.sub_id && s.sub_id.toLowerCase().includes(q))
        );
    }, [data, searchTerm]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden p-0 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl flex flex-col">
                
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                Revenue Breakdown & Financial Insights
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Transparent derivation and itemized details for {data?.selectedPeriod?.label || 'Selected Period'}
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Month & Year Selectors */}
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {monthOptions.map((m, idx) => (
                                <option key={m} value={idx}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Main Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* How Revenue is Derived Banner */}
                    {showExplanation && (
                        <div className="relative overflow-hidden rounded-2xl border border-blue-200/70 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900/40 p-4 sm:p-5">
                            <button
                                onClick={() => setShowExplanation(false)}
                                className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                                    <Info className="w-5 h-5" />
                                </div>
                                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pr-6">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                        Understanding How Your Dashboard Revenue is Derived
                                    </h4>
                                    <p className="leading-relaxed">
                                        Your dashboard revenue metrics are separated into two transparent perspectives to ensure 100% accuracy without double-counting multi-year prepaid contracts:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                        <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40">
                                            <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">
                                                1. New & Renewed Bookings Revenue
                                            </span>
                                            Sum of contract amounts for subscriptions whose <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">start_date</code> falls within {data?.selectedPeriod?.label || 'this month'}. Shows real cash inflow and sales growth.
                                        </div>
                                        <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-purple-100 dark:border-purple-900/40">
                                            <span className="font-bold text-purple-600 dark:text-purple-400 block mb-1">
                                                2. Monthly Recurring Revenue (MRR)
                                            </span>
                                            Prorated monthly value of all active contracts. For example, a ₹1,20,000 12-month contract contributes ₹10,000 to each month's MRR.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading breakdown data...</p>
                        </div>
                    ) : error ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-red-500">
                            <AlertCircle className="w-10 h-10" />
                            <p className="text-sm font-semibold">{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* KPI Metrics Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                
                                {/* Card 1: New Bookings */}
                                <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/50 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-4 flex flex-col justify-between shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                            New Bookings Revenue
                                        </span>
                                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            <DollarSign className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                                            {formatExactCurrency(data?.summary?.newBookingsRevenue)}
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                            <span>{data?.summary?.newSubscriptionsCount || 0} subscriptions starting this month</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card 2: MRR */}
                                <div className="relative overflow-hidden rounded-2xl border border-purple-200/80 dark:border-purple-800/40 bg-gradient-to-br from-purple-50/50 via-white to-white dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900 p-4 flex flex-col justify-between shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                            Monthly Normalized (MRR)
                                        </span>
                                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                            <Layers className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                                            {formatExactCurrency(data?.summary?.mrr)}
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                                            Prorated monthly active share
                                        </div>
                                    </div>
                                </div>

                                {/* Card 3: Active Contracts */}
                                <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/50 via-white to-white dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 p-4 flex flex-col justify-between shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                            Active Contracts
                                        </span>
                                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <Package className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                                            {data?.summary?.activeContractsCount || 0}
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                                            Active subscriptions in effect
                                        </div>
                                    </div>
                                </div>

                                {/* Card 4: Growth Trend */}
                                <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50/50 via-white to-white dark:from-slate-800/30 dark:via-slate-900 dark:to-slate-900 p-4 flex flex-col justify-between shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            MoM Revenue Growth
                                        </span>
                                        <div className={`p-2 rounded-xl ${data?.summary?.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {data?.summary?.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                                                {data?.summary?.isPositive ? '+' : ''}{data?.summary?.percentChange}%
                                            </span>
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                                            Compared to previous month
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* View Navigation Tabs */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                                    {[
                                        { id: 'new', label: `New Subscriptions (${data?.newSubscriptions?.length || 0})`, icon: DollarSign },
                                        { id: 'mrr', label: `MRR Active (${data?.mrrSubscriptions?.length || 0})`, icon: Layers },
                                        { id: 'services', label: 'Service Breakdown', icon: Tag },
                                        { id: 'customers', label: 'Top Customers', icon: Building2 },
                                        { id: 'trend', label: '6-Month Trend', icon: BarChart2 }
                                    ].map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                                    isActive
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Search Bar for table tabs */}
                                {(activeTab === 'new' || activeTab === 'mrr') && (
                                    <div className="relative w-full sm:w-64">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            placeholder="Search customer, domain..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 h-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Tab 1: New Subscriptions */}
                            {activeTab === 'new' && (
                                <div className="space-y-3">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                        <span>Subscriptions starting or renewing in {data?.selectedPeriod?.label}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">Total: {formatExactCurrency(data?.summary?.newBookingsRevenue)}</span>
                                    </div>

                                    {filteredNewSubs.length === 0 ? (
                                        <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                            No subscriptions starting in this period matching your search.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500">
                                                        <th className="p-3">Customer / Domain</th>
                                                        <th className="p-3">Start Date</th>
                                                        <th className="p-3">End Date</th>
                                                        <th className="p-3">Included Services</th>
                                                        <th className="p-3 text-right">Contract Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                    {filteredNewSubs.map((sub) => (
                                                        <tr key={sub.sub_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                            <td className="p-3">
                                                                <div className="font-bold text-slate-900 dark:text-white">
                                                                    {sub.customer_name || 'Unassigned Customer'}
                                                                </div>
                                                                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                                                                    {sub.domain_name || sub.sub_id}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                {new Date(sub.start_date).toLocaleDateString()}
                                                            </td>
                                                            <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                {new Date(sub.end_date).toLocaleDateString()}
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {sub.services && sub.services.length > 0 ? (
                                                                        sub.services.map((svc, i) => (
                                                                            <Badge key={i} variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                                                {svc.service_name}
                                                                            </Badge>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-slate-400 text-[11px] italic">No line items</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                                                                {formatExactCurrency(sub.total)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 2: MRR Active Subscriptions */}
                            {activeTab === 'mrr' && (
                                <div className="space-y-3">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                        <span>Active subscriptions contributing to monthly recurring revenue</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">Total MRR: {formatExactCurrency(data?.summary?.mrr)}</span>
                                    </div>

                                    {filteredMrrSubs.length === 0 ? (
                                        <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                            No active subscriptions matching your search.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500">
                                                        <th className="p-3">Customer / Domain</th>
                                                        <th className="p-3">Contract Dates</th>
                                                        <th className="p-3 text-center">Duration</th>
                                                        <th className="p-3 text-right">Contract Total</th>
                                                        <th className="p-3 text-right">Monthly Share (MRR)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                                    {filteredMrrSubs.map((sub) => (
                                                        <tr key={sub.sub_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                            <td className="p-3">
                                                                <div className="font-bold text-slate-900 dark:text-white">
                                                                    {sub.customer_name || 'Unassigned Customer'}
                                                                </div>
                                                                <div className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">
                                                                    {sub.domain_name || sub.sub_id}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                {new Date(sub.start_date).toLocaleDateString()} - {new Date(sub.end_date).toLocaleDateString()}
                                                            </td>
                                                            <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                                                                <Badge variant="secondary" className="text-[10px]">
                                                                    {sub.durationMonths} {sub.durationMonths === 1 ? 'month' : 'months'}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                {formatExactCurrency(sub.total)}
                                                            </td>
                                                            <td className="p-3 text-right font-black text-purple-600 dark:text-purple-400 whitespace-nowrap">
                                                                {formatExactCurrency(sub.monthlyShare)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 3: Service Breakdown */}
                            {activeTab === 'services' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data?.serviceBreakdown || []}
                                                    dataKey="totalAmount"
                                                    nameKey="serviceName"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={90}
                                                    innerRadius={50}
                                                    paddingAngle={3}
                                                    label={({ serviceName, percent }) => `${serviceName} (${(percent * 100).toFixed(0)}%)`}
                                                >
                                                    {(data?.serviceBreakdown || []).map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => formatExactCurrency(value)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Service Line Contribution</h4>
                                        <div className="space-y-2">
                                            {(data?.serviceBreakdown || []).map((svc, index) => {
                                                const totalRevenue = data?.summary?.newBookingsRevenue || 1;
                                                const pct = Math.round((svc.totalAmount / (totalRevenue || 1)) * 100);
                                                return (
                                                    <div key={svc.serviceName} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                                                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                                <span>{svc.serviceName}</span>
                                                            </div>
                                                            <span>{formatExactCurrency(svc.totalAmount)}</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(100, Math.max(5, pct))}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 4: Top Customers */}
                            {activeTab === 'customers' && (
                                <div className="space-y-3">
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Top customers contributing to revenue in {data?.selectedPeriod?.label}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(data?.customerBreakdown || []).map((cust, idx) => (
                                            <div key={cust.customerId || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800/40">
                                                        #{idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                                                            {cust.customerName}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            {cust.count} {cust.count === 1 ? 'subscription' : 'subscriptions'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right font-black text-sm text-slate-900 dark:text-white">
                                                    {formatExactCurrency(cust.totalRevenue)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tab 5: 6-Month Trend */}
                            {activeTab === 'trend' && (
                                <div className="space-y-4">
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        6-Month revenue performance evolution
                                    </div>
                                    <div className="h-72 w-full pt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data?.trend || []}>
                                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => formatCompactCurrency(v)} />
                                                <Tooltip formatter={(value) => formatExactCurrency(value)} />
                                                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">
                        Calculated from SubSync Subscriptions & Billing Module
                    </span>
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="rounded-xl px-5 h-9 text-xs font-bold"
                    >
                        Close
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
