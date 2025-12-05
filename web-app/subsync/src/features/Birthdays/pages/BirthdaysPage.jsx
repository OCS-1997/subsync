import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Gift, Search, RefreshCw, Calendar, User, Building2, Users, Loader2, Cake } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

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

    const getTypeIcon = (type) => {
        switch (type) {
            case 'user':
                return <User className="h-4 w-4" />;
            case 'customer':
                return <Building2 className="h-4 w-4" />;
            case 'contact_person':
                return <Users className="h-4 w-4" />;
            default:
                return <User className="h-4 w-4" />;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'user':
                return 'Team Member';
            case 'customer':
                return 'Customer';
            case 'contact_person':
                return 'Contact Person';
            default:
                return type;
        }
    };

    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'user':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'customer':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'contact_person':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const calculateAge = (dateOfBirth) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    const getNextBirthday = (dateOfBirth) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        const currentYear = today.getFullYear();

        let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());

        if (nextBirthday < today) {
            nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
        }

        return nextBirthday;
    };

    const getDaysUntilBirthday = (dateOfBirth) => {
        const today = new Date();
        const nextBirthday = getNextBirthday(dateOfBirth);
        const diffTime = nextBirthday - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
                        <Cake className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Birthdays</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Manage birthdays for team members, customers, and contacts
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleSync}
                    disabled={syncing}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                    {syncing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Syncing...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sync Birthdays
                        </>
                    )}
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="user">Team Members</SelectItem>
                                <SelectItem value="customer">Customers</SelectItem>
                                <SelectItem value="contact_person">Contact Persons</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSearch}>
                            <Search className="mr-2 h-4 w-4" />
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Birthdays</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalRecords}</p>
                            </div>
                            <Gift className="h-8 w-8 text-pink-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Members</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {birthdays.filter(b => b.type === 'user').length}
                                </p>
                            </div>
                            <User className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Customers</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {birthdays.filter(b => b.type === 'customer').length}
                                </p>
                            </div>
                            <Building2 className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Persons</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {birthdays.filter(b => b.type === 'contact_person').length}
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Birthdays List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Birthdays</CardTitle>
                    <CardDescription>
                        Showing {birthdays.length} of {totalRecords} birthdays
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                        </div>
                    ) : birthdays.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                            <p className="mt-4 text-gray-500 dark:text-gray-400">No birthdays found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {birthdays.map((birthday) => {
                                const daysUntil = getDaysUntilBirthday(birthday.date_of_birth);
                                const age = calculateAge(birthday.date_of_birth);

                                return (
                                    <div
                                        key={birthday.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`p-2 rounded-full ${getTypeBadgeColor(birthday.type)}`}>
                                                {getTypeIcon(birthday.type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {birthday.name}
                                                    </h3>
                                                    <Badge className={getTypeBadgeColor(birthday.type)}>
                                                        {getTypeLabel(birthday.type)}
                                                    </Badge>
                                                    {birthday.company_name && birthday.type === 'contact_person' && (
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            @ {birthday.company_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{birthday.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {format(new Date(birthday.date_of_birth), 'MMMM dd, yyyy')}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Age: {age} years
                                                </p>
                                            </div>
                                            <div className="text-right min-w-[100px]">
                                                {daysUntil === 0 ? (
                                                    <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                                        Today! 🎉
                                                    </Badge>
                                                ) : daysUntil === 1 ? (
                                                    <Badge className="bg-blue-500 hover:bg-blue-600">
                                                        Tomorrow
                                                    </Badge>
                                                ) : daysUntil <= 7 ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600">
                                                        In {daysUntil} days
                                                    </Badge>
                                                ) : (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        In {daysUntil} days
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default BirthdaysPage;
