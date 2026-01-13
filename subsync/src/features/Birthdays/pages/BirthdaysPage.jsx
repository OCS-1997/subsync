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
    RefreshCw,
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
import { format, isToday as isDateToday, isTomorrow as isDateTomorrow, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths } from 'date-fns';
import PermissionGate from '@/components/auth/PermissionGate.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';

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
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Dialog States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedBirthday, setSelectedBirthday] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSendingWish, setIsSendingWish] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        date_of_birth: '',
        type: 'contact_person',
        email_send: true,
        include_in_communication: true
    });

    useEffect(() => {
        fetchBirthdays();
    }, [page, typeFilter]);

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

    const handleSync = async () => {
        try {
            setSyncing(true);
            await api.post('/birthdays/sync');
            toast.success('Birthdays synced successfully!');
            fetchBirthdays();
        } catch (error) {
            console.error('Error syncing birthdays:', error);
            toast.error('Failed to sync birthdays');
        } finally {
            setSyncing(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const data = { ...formData };
            if (selectedBirthday?.id) data.id = selectedBirthday.id;

            await api.post('/birthdays', data);
            toast.success(selectedBirthday ? 'Birthday updated successfully' : 'Birthday added successfully');
            setIsAddDialogOpen(false);
            resetForm();
            fetchBirthdays();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save birthday');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsSubmitting(true);
            await api.delete(`/birthdays/${selectedBirthday.id}`);
            toast.success('Birthday deleted successfully');
            setIsDeleteDialogOpen(false);
            setSelectedBirthday(null);
            fetchBirthdays();
        } catch (error) {
            toast.error('Failed to delete birthday');
        } finally {
            setIsSubmitting(false);
        }
    };

    const sendWish = async (birthday) => {
        try {
            setIsSendingWish(true);
            await api.post(`/birthdays/${birthday.id}/wish`);
            toast.success(`Birthday wish sent to ${birthday.name}!`);
        } catch (error) {
            toast.error('Failed to send wish: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setIsSendingWish(false);
        }
    };

    const openEditDialog = (birthday) => {
        setSelectedBirthday(birthday);
        setFormData({
            name: birthday.name,
            email: birthday.email,
            date_of_birth: birthday.date_of_birth ? format(new Date(birthday.date_of_birth), 'yyyy-MM-dd') : '',
            type: birthday.type,
            email_send: birthday.email_send === 1 || birthday.email_send === true,
            include_in_communication: birthday.include_in_communication === 1 || birthday.include_in_communication === true
        });
        setIsAddDialogOpen(true);
    };

    const openDeleteDialog = (birthday) => {
        setSelectedBirthday(birthday);
        setIsDeleteDialogOpen(true);
    };

    const resetForm = () => {
        setSelectedBirthday(null);
        setFormData({
            name: '',
            email: '',
            date_of_birth: '',
            type: 'contact_person',
            email_send: true,
            include_in_communication: true
        });
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

    // Summary totals logic
    const summary = useMemo(() => {
        const todayCount = birthdays.filter(b => getDaysUntilBirthday(b.date_of_birth) === 0).length;
        const upcomingCount = birthdays.filter(b => {
            const days = getDaysUntilBirthday(b.date_of_birth);
            return days > 0 && days <= 7;
        }).length;
        return { todayCount, upcomingCount };
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
                    <PermissionGate permissions={[PERMISSIONS.BIRTHDAYS_SYNC]}>
                        <Button
                            variant="outline"
                            onClick={handleSync}
                            disabled={syncing}
                            className="bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                        >
                            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Sync
                        </Button>
                    </PermissionGate>

                    <PermissionGate permissions={[PERMISSIONS.BIRTHDAYS_MANAGE]}>
                        <Button
                            onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
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
                    { label: 'Team Members', value: birthdays.filter(b => b.type === 'user').length, icon: User, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
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
                        isSendingWish={isSendingWish}
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
                        isSendingWish={isSendingWish}
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
                        isSendingWish={isSendingWish}
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
                                        isSendingWish={isSendingWish}
                                    />
                                </div>
                            )
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Add/Edit Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{selectedBirthday ? 'Edit Birthday' : 'New Birthday'}</DialogTitle>
                        <DialogDescription>
                            Enter details to keep track of a special day.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dob" className="text-right">Birthday</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={formData.date_of_birth}
                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v) => setFormData({ ...formData, type: v })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">Team Member</SelectItem>
                                    <SelectItem value="customer">Customer</SelectItem>
                                    <SelectItem value="contact_person">Contact Person</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between space-x-2 pt-4 border-t">
                            <div className="space-y-0.5">
                                <Label>Send Emails</Label>
                                <p className="text-[0.8rem] text-muted-foreground">Automatically send wishes</p>
                            </div>
                            <Switch
                                checked={formData.email_send}
                                onCheckedChange={(c) => setFormData({ ...formData, email_send: c })}
                            />
                        </div>
                    </form>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSubmitting} className="bg-rose-500 hover:bg-rose-600">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

function BirthdayGrid({ birthdays, loading, emptyMessage = "No magic found here yet ✨", onEdit, onDelete, onSendWish, isSendingWish }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse" />
                ))}
            </div>
        );
    }

    if (birthdays.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800">
                    <Calendar className="h-12 w-12 text-slate-300" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">{emptyMessage}</h3>
                    <p className="text-slate-500">Wait for the next sync or add one manually</p>
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
                        isSendingWish={isSendingWish}
                    />
                ))}
            </AnimatePresence>
        </motion.div>
    );
}

function BirthdayCard({ person, onEdit, onDelete, onSendWish, isSendingWish }) {
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
            case 'user': return 'bg-blue-100/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
            case 'customer': return 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
            case 'contact_person': return 'bg-violet-100/50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300';
            default: return 'bg-slate-100/50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-300';
        }
    };

    const isToday = daysUntil === 0;

    return (
        <motion.div
            variants={itemVariants}
            layout
            className={`group relative overflow-hidden rounded-3xl border-2 transition-all duration-300 p-6 
                ${isToday
                    ? 'border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 shadow-lg shadow-rose-200 dark:shadow-rose-900/20'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-100 dark:hover:border-rose-900 shadow-sm'
                }`}
        >
            {/* Background Decoration */}
            {isToday && (
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full" />
            )}

            <div className="flex flex-col h-full gap-4 relative">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${getTypeBadgeColor(person.type)} transition-transform group-hover:scale-110 duration-300`}>
                            {getTypeIcon(person.type)}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
                                {person.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className={`${getTypeBadgeColor(person.type)} border-none py-0 px-2 h-5 text-[10px] uppercase font-bold`}>
                                    {person.type === 'user' ? 'Member' : person.type === 'customer' ? 'Client' : 'Contact'}
                                </Badge>
                                {person.company_name && (
                                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">@ {person.company_name}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => onEdit(person)}>
                            <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500" onClick={() => onDelete(person)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4 py-2 border-y border-slate-50 dark:border-slate-800/50">
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Born</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{format(new Date(person.date_of_birth), 'MMM dd')}</p>
                    </div>
                    <div className="flex-1 text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Age</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{calculateAge(person.date_of_birth)} Yrs</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="space-y-1">
                        {isToday ? (
                            <div className="flex items-center gap-2 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-bounce shadow-md">
                                <PartyPopper className="h-3 w-3" />
                                <span>HAPPY BIRTHDAY!</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">
                                    {daysUntil === 1 ? 'Tomorrow!' : `In ${daysUntil} days`}
                                </span>
                            </div>
                        )}
                    </div>

                    <Button
                        size="sm"
                        disabled={isSendingWish}
                        onClick={() => onSendWish(person)}
                        className={`rounded-xl h-9 px-4 transition-all duration-300
                            ${isToday
                                ? 'bg-white text-rose-600 hover:bg-rose-50 dark:bg-slate-900 shadow-sm border border-rose-100 dark:border-rose-900'
                                : 'bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-rose-500 hover:text-white border-none'
                            }`}
                    >
                        {isSendingWish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-2" />}
                        Send Wish
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

export default BirthdaysPage;
