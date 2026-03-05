import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Switch } from "@/components/ui/switch.jsx";
import {
    Gift,
    Search,
    Calendar,
    User,
    Building2,
    Users,
    Loader2,
    Cake,
    Plus,
    Edit2,
    Trash2,
    Send,
    MoreVertical,
    ChevronRight,
    PartyPopper,
    Filter,
} from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { format, isToday as isDateToday, isTomorrow as isDateTomorrow, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths, parseISO } from 'date-fns';
import PermissionGate from '@/components/auth/PermissionGate.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';
import { BirthdayFormDialog } from '../components/BirthdayFormDialog.jsx';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1
    }
};

function BirthdaysPage() {
    const navigate = useNavigate();
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    // Summary stats fetched from the dashboard endpoint (accurate, not page-limited)
    const [summary, setSummary] = useState({ todayCount: 0, upcomingCount: 0, teamCount: 0 });

    // Dialog States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedBirthday, setSelectedBirthday] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sendingWishId, setSendingWishId] = useState(null); // tracks which card's wish is in-flight

    useEffect(() => {
        fetchBirthdays();
    }, [page, typeFilter]);

    // Fetch summary stats once on mount and after mutations
    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const [upcomingRes, teamRes, totalRes] = await Promise.all([
                api.get('/dashboard/birthdays'),
                api.get('/birthdays', { params: { type: 'user', limit: 1, page: 1 } }),
                api.get('/birthdays', { params: { limit: 1, page: 1 } })
            ]);
            const { today = [], upcoming = [] } = upcomingRes.data;
            setSummary({
                todayCount: today.length,
                upcomingCount: upcoming.length,
                teamCount: teamRes.data.totalRecords || 0
            });
        } catch (err) {
            console.error('Failed to fetch birthday summary:', err);
        }
    };

    const fetchBirthdays = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 50,
                sort: 'date_of_birth',
                order: 'asc'
            };

            if (search) params.search = search;
            if (typeFilter && typeFilter !== 'all') params.type = typeFilter;

            const response = await api.get('/birthdays', { params });
            setBirthdays(response.data.birthdays || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalRecords(response.data.totalRecords || 0);
        } catch (error) {
            console.error('Error fetching birthdays:', error);
            toast.error('Failed to load birthdays');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchBirthdays();
    };

    const handleDelete = async () => {
        try {
            setIsSubmitting(true);
            await api.delete(`/birthdays/${selectedBirthday.id}`);
            toast.success('Birthday deleted successfully');
            setIsDeleteDialogOpen(false);
            setSelectedBirthday(null);
            fetchBirthdays();
            fetchSummary();
        } catch (error) {
            toast.error('Failed to delete birthday');
        } finally {
            setIsSubmitting(false);
        }
    };

    const sendWish = async (birthday) => {
        try {
            setSendingWishId(birthday.id);
            await api.post(`/birthdays/${birthday.id}/wish`);
            toast.success(`Birthday wish sent to ${birthday.name}!`);
        } catch (error) {
            toast.error('Failed to send wish: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setSendingWishId(null);
        }
    };

    const openEditDialog = (birthday) => {
        setSelectedBirthday(birthday);
        setIsAddDialogOpen(true);
    };

    const openDeleteDialog = (birthday) => {
        setSelectedBirthday(birthday);
        setIsDeleteDialogOpen(true);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'user': return <User className="h-4 w-4" />;
            case 'customer': return <Building2 className="h-4 w-4" />;
            case 'contact_person': return <Users className="h-4 w-4" />;
            default: return <User className="h-4 w-4" />;
        }
    };

    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'user': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'customer': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'contact_person': return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800';
        }
    };

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const getDaysUntilBirthday = (dateOfBirth) => {
        if (!dateOfBirth) return 999;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        const currentYear = today.getFullYear();
        let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        if (nextBirthday < today && !isDateToday(nextBirthday)) {
            nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
        }
        return differenceInDays(nextBirthday, today);
    };

    // Grouping logic for "Grouped" tab
    const groupedBirthdays = useMemo(() => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const groups = {};
        months.forEach(m => groups[m] = []);

        birthdays.forEach(b => {
            if (b.date_of_birth) {
                const month = months[new Date(b.date_of_birth).getMonth()];
                groups[month].push(b);
            }
        });
        return groups;
    }, [birthdays]);



    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8 min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-rose-500/20">
                        <Cake className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Birthdays</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Celebrate connections and keep the team spirit high</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <PermissionGate permissions={[PERMISSIONS.BIRTHDAYS_MANAGE]}>
                        <Button
                            onClick={() => { setSelectedBirthday(null); setIsAddDialogOpen(true); }}
                            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md shadow-rose-500/20"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Birthday
                        </Button>
                    </PermissionGate>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: totalRecords, icon: Gift, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10' },
                    { label: "Today's", value: summary.todayCount, icon: PartyPopper, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                    { label: 'Upcoming (7d)', value: summary.upcomingCount, icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { label: 'Team Members', value: summary.teamCount, icon: User, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="border-none shadow-sm dark:bg-slate-900/50 backdrop-blur-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-2 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content */}
            <Tabs defaultValue="all" className="w-full space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm">
                    <TabsList className="bg-slate-100 dark:bg-slate-800 border-none p-1 h-11">
                        <TabsTrigger value="all" className="rounded-lg px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">All</TabsTrigger>
                        <TabsTrigger value="today" className="rounded-lg px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Today</TabsTrigger>
                        <TabsTrigger value="upcoming" className="rounded-lg px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Next 7 Days</TabsTrigger>
                        <TabsTrigger value="grouped" className="rounded-lg px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Grouped</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2 w-full md:w-auto px-2">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search friends..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-9 bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-rose-500 rounded-xl"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-800 border-none rounded-xl">
                                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="user">Team</SelectItem>
                                <SelectItem value="customer">Client</SelectItem>
                                <SelectItem value="contact_person">Contact</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <TabsContent value="all" className="mt-0">
                    <BirthdayGrid
                        birthdays={birthdays}
                        loading={loading}
                        onEdit={openEditDialog}
                        onDelete={openDeleteDialog}
                        onSendWish={sendWish}
                        sendingWishId={sendingWishId}
                    />

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="rounded-xl border-slate-200 dark:border-slate-800"
                            >
                                Previous
                            </Button>
                            <span className="text-sm font-medium">Page {page} of {totalPages}</span>
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="rounded-xl border-slate-200 dark:border-slate-800"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="today" className="mt-0">
                    <BirthdayGrid
                        birthdays={birthdays.filter(b => getDaysUntilBirthday(b.date_of_birth) === 0)}
                        loading={loading}
                        emptyMessage="No birthdays today. Rest day! 😴"
                        onEdit={openEditDialog}
                        onDelete={openDeleteDialog}
                        onSendWish={sendWish}
                        sendingWishId={sendingWishId}
                    />
                </TabsContent>

                <TabsContent value="upcoming" className="mt-0">
                    <BirthdayGrid
                        birthdays={birthdays.filter(b => {
                            const days = getDaysUntilBirthday(b.date_of_birth);
                            return days > 0 && days <= 7;
                        })}
                        loading={loading}
                        emptyMessage="Silence before the storm. No upcoming birthdays! ☕"
                        onEdit={openEditDialog}
                        onDelete={openDeleteDialog}
                        onSendWish={sendWish}
                        sendingWishId={sendingWishId}
                    />
                </TabsContent>

                <TabsContent value="grouped" className="mt-0">
                    <div className="space-y-8 pb-12">
                        {Object.entries(groupedBirthdays).map(([month, items]) => (
                            items.length > 0 && (
                                <div key={month} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{month}</h3>
                                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                                        <Badge variant="outline" className="bg-white dark:bg-slate-900">{items.length}</Badge>
                                    </div>
                                    <BirthdayGrid
                                        birthdays={items}
                                        loading={false}
                                        onEdit={openEditDialog}
                                        onDelete={openDeleteDialog}
                                        onSendWish={sendWish}
                                        sendingWishId={sendingWishId}
                                    />
                                </div>
                            )
                        ))}
                    </div>
                </TabsContent>
            </Tabs>


            {/* Add/Edit Dialog with Autocomplete */}
            <BirthdayFormDialog
                open={isAddDialogOpen}
                onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) setSelectedBirthday(null);
                }}
                selectedBirthday={selectedBirthday}
                onSuccess={() => { fetchBirthdays(); fetchSummary(); }}
            />

            {/* Delete Confirmation */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-rose-600">Delete Birthday Record?</DialogTitle>
                        <DialogDescription>
                            This will remove <span className="font-bold">{selectedBirthday?.name}</span>'s birthday from the list. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Keep it</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Everything'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function BirthdayGrid({ birthdays, loading, emptyMessage = "No magic found here yet ✨", onEdit, onDelete, onSendWish, sendingWishId }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
                                <div className="h-3 w-1/2 rounded-lg bg-slate-100 dark:bg-slate-700" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1 h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
                            <div className="w-16 h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <div className="h-3 w-2/3 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                            <div className="h-7 w-28 rounded-full bg-slate-100 dark:bg-slate-800" />
                            <div className="h-8 w-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (birthdays.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-2 border-pink-100 dark:border-pink-900/30 shadow-sm">
                    <Cake className="h-12 w-12 text-rose-300 dark:text-rose-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{emptyMessage}</h3>
                    <p className="text-slate-400 dark:text-slate-500 mt-1 text-sm">Birthdays will appear here once synced or added manually</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            <AnimatePresence>
                {birthdays.map((person) => (
                    <BirthdayCard
                        key={person.id}
                        person={person}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onSendWish={onSendWish}
                        sendingWishId={sendingWishId}
                    />
                ))}
            </AnimatePresence>
        </motion.div>
    );
}

function BirthdayCard({ person, onEdit, onDelete, onSendWish, sendingWishId }) {
    const isWishing = sendingWishId === person.id;
    const daysUntil = useMemo(() => {
        const today = new Date();
        const birthDate = new Date(person.date_of_birth);
        const currentYear = today.getFullYear();
        let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        if (nextBirthday < today && !isDateToday(nextBirthday)) {
            nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
        }
        return differenceInDays(nextBirthday, today);
    }, [person.date_of_birth]);

    const calculateAge = (dateOfBirth) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const getTypeConfig = (type) => {
        switch (type) {
            case 'user': return {
                icon: <User className="h-3.5 w-3.5" />,
                label: 'Team Member',
                badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                avatar: 'from-blue-400 to-indigo-500',
                ring: 'ring-blue-200 dark:ring-blue-800',
            };
            case 'customer': return {
                icon: <Building2 className="h-3.5 w-3.5" />,
                label: 'Client',
                badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                avatar: 'from-emerald-400 to-teal-500',
                ring: 'ring-emerald-200 dark:ring-emerald-800',
            };
            case 'contact_person': return {
                icon: <Users className="h-3.5 w-3.5" />,
                label: 'Contact',
                badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
                avatar: 'from-violet-400 to-purple-500',
                ring: 'ring-violet-200 dark:ring-violet-800',
            };
            default: return {
                icon: <User className="h-3.5 w-3.5" />,
                label: 'Person',
                badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
                avatar: 'from-slate-400 to-slate-500',
                ring: 'ring-slate-200 dark:ring-slate-800',
            };
        }
    };

    const isToday = daysUntil === 0;
    const isTomorrow = daysUntil === 1;
    const typeConfig = getTypeConfig(person.type);
    const initials = person.name
        ? person.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';
    const age = calculateAge(person.date_of_birth);

    return (
        <motion.div
            variants={itemVariants}
            layout
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`group relative overflow-hidden rounded-3xl transition-all duration-300
                ${ isToday
                    ? 'bg-gradient-to-br from-white via-pink-50/60 to-rose-50/60 dark:from-slate-900 dark:via-pink-950/20 dark:to-rose-950/20 border-2 border-rose-300 dark:border-rose-700 shadow-xl shadow-rose-200/60 dark:shadow-rose-900/30'
                    : 'bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-pink-200 dark:hover:border-pink-900 shadow-sm hover:shadow-lg hover:shadow-pink-100/50 dark:hover:shadow-pink-900/20'
                }`}
        >
            {/* Today radial glow + confetti blobs */}
            {isToday && (
                <>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-400/15 via-transparent to-pink-400/10 pointer-events-none" />
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-400/20 rounded-full blur-2xl" />
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-pink-400/15 rounded-full blur-xl" />
                    <div className="absolute top-3 right-14 w-2 h-2 rounded-full bg-rose-300/70 dark:bg-rose-500/40" />
                    <div className="absolute top-8 right-8 w-1.5 h-1.5 rounded-full bg-pink-400/60 dark:bg-pink-500/40" />
                    <div className="absolute top-5 right-20 w-1 h-1 rounded-full bg-amber-300/70 dark:bg-amber-500/40" />
                </>
            )}

            <div className="relative p-5 flex flex-col gap-4">

                {/* Top: Avatar + Name + hover actions */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Gradient avatar initials */}
                        <div className={`relative flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${typeConfig.avatar} flex items-center justify-center shadow-lg ring-2 ${typeConfig.ring} group-hover:scale-105 transition-transform duration-300`}>
                            <span className="text-white font-black text-sm tracking-wide select-none">{initials}</span>
                            {isToday && (
                                <span className="absolute -top-1 -right-1 text-base leading-none animate-bounce select-none">🎂</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-50 truncate leading-tight">
                                {person.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${typeConfig.badge}`}>
                                    {typeConfig.icon}
                                    {typeConfig.label}
                                </span>
                                {person.company_name && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[90px]">
                                        @ {person.company_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Edit/Delete slide in on hover */}
                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                        <PermissionGate permissions={[PERMISSIONS.BIRTHDAYS_MANAGE]}>
                            <button
                                onClick={() => onEdit(person)}
                                className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-pink-100 dark:hover:bg-pink-900/40 hover:text-pink-600 dark:hover:text-pink-400 text-slate-500 transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                                onClick={() => onDelete(person)}
                                className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </PermissionGate>
                    </div>
                </div>

                {/* Stats: Date + Age pills */}
                <div className="flex items-center gap-3 px-1">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex-1">
                        <Calendar className="h-3.5 w-3.5 text-pink-400 dark:text-pink-500 flex-shrink-0" />
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Date</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                                {format(new Date(person.date_of_birth), 'MMM dd, yyyy')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                        <Cake className="h-3.5 w-3.5 text-rose-400 dark:text-rose-500 flex-shrink-0" />
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                {isToday ? 'Turns' : 'Age'}
                            </p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">{age}</p>
                        </div>
                    </div>
                </div>

                {/* Email */}
                {person.email && (
                    <div className="flex items-center gap-2 px-1 -mt-1">
                        <Send className="h-3 w-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{person.email}</span>
                    </div>
                )}

                {/* Bottom: Countdown + Wish button */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    {isToday ? (
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md shadow-rose-300/40 dark:shadow-rose-800/30 animate-pulse">
                            <PartyPopper className="h-3 w-3" />
                            Happy Birthday! 🎉
                        </div>
                    ) : isTomorrow ? (
                        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full text-[11px] font-semibold">
                            <Gift className="h-3 w-3" />
                            Tomorrow!
                        </div>
                    ) : daysUntil <= 7 ? (
                        <div className="flex items-center gap-1.5 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-400 px-3 py-1.5 rounded-full text-[11px] font-semibold">
                            <Calendar className="h-3 w-3" />
                            In {daysUntil} days
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[11px] font-medium px-1">
                            <Calendar className="h-3 w-3" />
                            {daysUntil} days away
                        </div>
                    )}

                    <PermissionGate permissions={[PERMISSIONS.BIRTHDAYS_MANAGE]}>
                        <Button
                            size="sm"
                            disabled={isWishing}
                            onClick={() => onSendWish(person)}
                            className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm
                                ${ isToday
                                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 hover:shadow-md'
                                    : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-none shadow-rose-200/50 dark:shadow-rose-800/30 hover:shadow-lg hover:shadow-rose-300/40'
                                }`}
                        >
                            {isWishing
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <><Send className="h-3 w-3 mr-1.5" />Wish</>
                            }
                        </Button>
                    </PermissionGate>
                </div>
            </div>
        </motion.div>
    );
}

export default BirthdaysPage;
