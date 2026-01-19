import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
    UserPlus, UserMinus, Crown, Search, Filter, Mail, Shield, Eye,
    UserCheck, UserCog, Users as UsersIcon, LayoutGrid, List, Info, Calendar, X, Plus, Trash2, Edit2, Save, Loader2, MoreVertical
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GenericTable from '@/components/layouts/GenericTable';
import Pagination from '@/components/layouts/Pagination';
import { cn } from '@/lib/utils';

const COLOR_OPTIONS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Slate', value: '#64748b' },
    { name: 'Gray', value: '#9ca3af' },
    { name: 'Dark', value: '#1e293b' },
];

function TeamsSettings() {
    const { user } = useSelector((state) => state.auth);

    // State
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('team_name');
    const [sortOrder, setSortOrder] = useState('asc');
    
    // Dialog states
    const [teamDialog, setTeamDialog] = useState({ open: false, mode: 'add', data: null });
    const [membersDialog, setMembersDialog] = useState({ open: false, teamId: null });
    const [viewDialog, setViewDialog] = useState({ open: false, teamId: null });
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: "" });
    const [saving, setSaving] = useState(false);

    // Form states
    const [teamForm, setTeamForm] = useState({ 
        team_name: '', 
        description: '', 
        color: COLOR_OPTIONS[0].value,
        team_lead_username: '',
        members: [] // Array of usernames for initial selection
    });

    const [memberSearch, setMemberSearch] = useState('');
    const [formMemberSearch, setFormMemberSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [teamsRes, usersRes] = await Promise.all([
                api.get('/teams'),
                api.get('/all-users')
            ]);
            setTeams(teamsRes.data.teams || []);
            setAllUsers(usersRes.data || []);
        } catch (error) {
            toast.error('Failed to load teams or users');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (teamDialog.mode === 'add') {
                await api.post('/teams', teamForm);
                toast.success('Team created successfully');
            } else {
                await api.put(`/teams/${teamDialog.data.id}`, teamForm);
                toast.success('Team updated successfully');
            }
            loadData();
            closeTeamDialog();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/teams/${confirmDelete.id}`);
            toast.success('Team deleted successfully');
            loadData();
            setConfirmDelete({ open: false, id: null, name: "" });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Delete failed');
        }
    };

    const handleAddMember = async (teamId, username) => {
        try {
            await api.post(`/teams/${teamId}/members`, { username });
            toast.success('Member added successfully');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (teamId, username) => {
        try {
            await api.delete(`/teams/${teamId}/members/${username}`);
            toast.success('Member removed successfully');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to remove member');
        }
    };

    const openTeamDialog = (mode, team = null) => {
        if (mode === 'edit' && team) {
            setTeamForm({
                team_name: team.team_name,
                description: team.description || '',
                color: team.color || COLOR_OPTIONS[0].value,
                team_lead_username: team.team_lead_username || '',
                members: (team.members || []).map(m => m.username)
            });
        } else {
            setTeamForm({ 
                team_name: '', 
                description: '', 
                color: COLOR_OPTIONS[0].value,
                team_lead_username: '',
                members: []
            });
        }
        setTeamDialog({ open: true, mode, data: team });
        setFormMemberSearch('');
    };

    const closeTeamDialog = () => {
        setTeamDialog({ open: false, mode: 'add', data: null });
    };

    const openMembersDialog = (team) => {
        setMembersDialog({ open: true, teamId: team.id });
        setMemberSearch('');
    };

    const openViewDialog = (team) => {
        setViewDialog({ open: true, teamId: team.id });
    };

    const currentViewTeam = useMemo(() => {
        if (!viewDialog.teamId) return null;
        return teams.find(t => t.id === viewDialog.teamId);
    }, [teams, viewDialog.teamId]);

    const currentMembersTeam = useMemo(() => {
        if (!membersDialog.teamId) return null;
        return teams.find(t => t.id === membersDialog.teamId);
    }, [teams, membersDialog.teamId]);

    const filteredTeams = useMemo(() => {
        let result = teams.filter(team => 
            team.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            team.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Sorting
        result.sort((a, b) => {
            const valA = a[sortBy] || '';
            const valB = b[sortBy] || '';
            if (sortOrder === 'asc') return valA.toString().localeCompare(valB.toString());
            return valB.toString().localeCompare(valA.toString());
        });

        return result;
    }, [teams, searchQuery, sortBy, sortOrder]);

    const stats = useMemo(() => {
        const totalTeams = teams.length;
        const totalMembers = new Set(teams.flatMap(t => (t.members || []).map(m => m.username))).size;
        const teamsWithLead = teams.filter(t => t.team_lead_username).length;
        return { totalTeams, totalMembers, teamsWithLead };
    }, [teams]);

    const handleSort = (key) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('asc');
        }
    };

    const tableHeaders = [
        { key: 'team_name', label: 'Team Name', sortable: true },
        { key: 'description', label: 'Description' },
        { key: 'lead', label: 'Team Lead' },
        { key: 'members', label: 'Members', align: 'center' },
        { key: 'actions', label: 'Actions', align: 'right' }
    ];

    const tableData = filteredTeams.map(team => {
        const leadName = team.team_lead_name || (team.members || []).find(m => m.username === team.team_lead_username)?.user_name;
        return {
            ...team,
            team_name: (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: team.color }}>
                        {team.team_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-bold">{team.team_name}</div>
                        <div className="text-xs text-slate-500 font-medium">#{team.id}</div>
                    </div>
                </div>
            ),
            description: <div className="max-w-xs truncate text-slate-600 dark:text-slate-400">{team.description || '—'}</div>,
            lead: leadName ? (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">
                        {leadName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{leadName}</span>
                </div>
            ) : <span className="text-xs text-slate-400 italic">No lead</span>,
            members: (
                <div className="flex -space-x-2 justify-center">
                    {(team.members || []).slice(0, 3).map((m, idx) => (
                        <div key={idx} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-950 bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                            {m.user_name?.charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {(team.members || []).length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold z-10">
                            +{(team.members || []).length - 3}
                        </div>
                    )}
                </div>
            ),
            actions: (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openViewDialog(team)} className="h-8 w-8 p-0 rounded-lg hover:text-blue-600">
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openMembersDialog(team)} className="h-8 w-8 p-0 rounded-lg">
                        <UserCog className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openTeamDialog('edit', team)} className="h-8 w-8 p-0 rounded-lg">
                        <Edit2 className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete({ open: true, id: team.id, name: team.team_name })} className="h-8 w-8 p-0 rounded-lg hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        };
    });

    const filteredFormMembers = useMemo(() => {
        return allUsers.filter(u => 
            u.name.toLowerCase().includes(formMemberSearch.toLowerCase()) ||
            u.username.toLowerCase().includes(formMemberSearch.toLowerCase())
        );
    }, [allUsers, formMemberSearch]);

    const filteredMembers = useMemo(() => {
        if (!membersDialog.open) return [];
        return allUsers.filter(u => 
            u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
            u.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
            u.role.toLowerCase().includes(memberSearch.toLowerCase())
        );
    }, [allUsers, memberSearch, membersDialog.open]);

    return (
        <div className="container py-8 max-w-7xl mx-auto px-4">
            <PageHeader
                title="Teams Management"
                description="Create and organize teams for better collaboration"
                breadcrumbItems={[
                    { label: "Dashboard", href: `/${user?.username}/dashboard` },
                    { label: "Settings", href: `/${user?.username}/dashboard/settings` },
                    { label: "Teams" }
                ]}
                actions={
                    <Button onClick={() => openTeamDialog('add')} className="#bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all">
                        <Plus className="w-4 h-4" />
                        Create New Team
                    </Button>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <Card className="rounded-[2rem] border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                <UsersIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-blue-600/60 dark:text-blue-400">Total Teams</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalTeams}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400">Active Members</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalMembers}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg">
                                <Crown className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-amber-600/60 dark:text-amber-400">Team Leads</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.teamsWithLead}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
                <div className="relative w-full md:w-96 shadow-sm rounded-2xl group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Search teams by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Tabs value={viewMode} onValueChange={setViewMode} className="w-full md:w-auto">
                        <TabsList className="grid grid-cols-2 rounded-2xl p-1 bg-slate-100 dark:bg-slate-800 h-12">
                            <TabsTrigger value="grid" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold">
                                <LayoutGrid className="w-4 h-4 mr-2" />
                                Grid
                            </TabsTrigger>
                            <TabsTrigger value="table" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold">
                                <List className="w-4 h-4 mr-2" />
                                Table
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-[2rem] bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : filteredTeams.length > 0 ? (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300">
                    {filteredTeams.map((team) => {
                        const members = team.members || [];
                        const teamLeadName = team.team_lead_name || members.find(m => m.username === team.team_lead_username)?.user_name;
                        
                        return (
                            <Card key={team.id} className="rounded-3xl group border-slate-200 dark:border-slate-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 overflow-hidden relative cursor-pointer" onClick={() => openViewDialog(team)}>
                                <div 
                                    className="h-1.5 w-full opacity-80" 
                                    style={{ backgroundColor: team.color }}
                                />
                                <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-xl font-black truncate text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                {team.team_name}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-1.5 mt-1">
                                                <Badge variant="secondary" className="text-[10px] uppercase tracking-tighter font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2">
                                                    #{team.id}
                                                </Badge>
                                                <span className="text-xs font-medium text-slate-500">{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-200 dark:border-slate-800">
                                                    <DropdownMenuItem onClick={() => openViewDialog(team)} className="rounded-xl cursor-pointer">
                                                        <Eye className="w-4 h-4 mr-3 text-slate-500" />
                                                        <span className="font-semibold text-sm">View Details</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openTeamDialog('edit', team)} className="rounded-xl cursor-pointer">
                                                        <Edit2 className="w-4 h-4 mr-3 text-slate-500" />
                                                        <span className="font-semibold text-sm">Edit Team Info</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openMembersDialog(team)} className="rounded-xl cursor-pointer">
                                                        <UserCog className="w-4 h-4 mr-3 text-slate-500" />
                                                        <span className="font-semibold text-sm">Manage Members</span>
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                                                    <DropdownMenuItem 
                                                        onClick={() => setConfirmDelete({ open: true, id: team.id, name: team.team_name })}
                                                        className="rounded-xl cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950/20 dark:focus:bg-red-950/20"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-3" />
                                                        <span className="font-bold text-sm">Delete Team</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-5 flex flex-col h-full">
                                    <div className="flex-1">
                                        {team.description ? (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 line-clamp-2 italic">
                                                "{team.description}"
                                            </p>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic mb-6">No description provided...</p>
                                        )}
                                        
                                        <div className="mb-6 space-y-4">
                                            <div className="flex items-center justify-between group/lead">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team Lead</div>
                                                {teamLeadName ? (
                                                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 px-3 py-1.5 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                                                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                                                        <span className="text-xs font-black text-amber-700 dark:text-amber-400">{teamLeadName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-300 italic">Unassigned</span>
                                                )}
                                            </div>                                      <div className="space-y-2">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Members</div>
                                                {members.length > 0 ? (
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {members.slice(0, 4).map((m) => (
                                                            <div key={m.username} className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-slate-950 flex items-center justify-center text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                                {m.user_name?.charAt(0).toUpperCase()}
                                                            </div>
                                                        ))}
                                                        {members.length > 4 && (
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 border-2 border-white dark:border-slate-950">
                                                                +{members.length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 font-medium">No members yet</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        variant="outline" 
                                        onClick={(e) => { e.stopPropagation(); openMembersDialog(team); }}
                                        className="w-full rounded-2xl border-2 border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all group-hover:bg-white dark:group-hover:bg-slate-950"
                                    >
                                        Manage Members
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
                    ) : (
                        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white dark:bg-slate-950 p-2">
                            <GenericTable
                                headers={tableHeaders}
                                data={tableData}
                                onSort={handleSort}
                            />
                        </Card>
                    )}
                </>
            ) : (
                <Card className="rounded-[3rem] border-none shadow-sm p-20 text-center bg-white dark:bg-slate-950">
                    <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto mb-6">
                            <UsersIcon className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Teams Found</h3>
                        <p className="text-slate-500 mb-8 font-medium">
                            {searchQuery ? "No teams match your search criteria. Try a different term or clear the search." : "Ready to organize your workflow? Create your first team unit to get started."}
                        </p>
                        {searchQuery ? (
                            <Button variant="outline" onClick={() => setSearchQuery('')} className="rounded-xl">Clear Search</Button>
                        ) : (
                            <Button onClick={() => openTeamDialog('add')} className="rounded-xl gap-2 h-11 px-8">
                                <Plus className="w-4 h-4" />
                                Create Team
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            {/* Create/Edit Team Dialog */}
            <Dialog open={teamDialog.open} onOpenChange={(open) => !open && closeTeamDialog()}>
                <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden flex flex-col max-h-[95vh]">
                    <div className="h-2 w-full shrink-0" style={{ backgroundColor: teamForm.color }} />
                    <DialogHeader className="px-8 pt-8 text-left shrink-0">
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
                            {teamDialog.mode === 'add' ? 'Create New Team' : 'Update Team Unit'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Define the name, personality, and initial roster of your team unit.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Side: General Info */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="team_name" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Team Name</Label>
                                        <Input
                                            id="team_name"
                                            value={teamForm.team_name}
                                            onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })}
                                            className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-black focus:ring-blue-500 shadow-none text-base"
                                            placeholder="Engineering, Design, Marketing..."
                                            required
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={teamForm.description}
                                            onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                                            className="min-h-[100px] rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-medium focus:ring-blue-500 shadow-none resize-none"
                                            placeholder="What does this team do?"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="team_lead" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Team Lead</Label>
                                        <select
                                            id="team_lead"
                                            value={teamForm.team_lead_username}
                                            onChange={(e) => setTeamForm({ ...teamForm, team_lead_username: e.target.value })}
                                            className="w-full h-12 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold px-4 focus:ring-2 focus:ring-blue-500 outline-none shadow-none appearance-none"
                                        >
                                            <option value="">No Lead (Optional)</option>
                                            {allUsers.map((u) => (
                                                <option key={u.username} value={u.username}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Unit Signature Color</Label>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: teamForm.color }} />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{COLOR_OPTIONS.find(c => c.value === teamForm.color)?.name || 'Custom'}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                            {COLOR_OPTIONS.map((color) => (
                                                <button
                                                    key={color.value}
                                                    type="button"
                                                    onClick={() => setTeamForm({ ...teamForm, color: color.value })}
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg transition-all border-2 shadow-sm active:scale-95 hover:scale-110",
                                                        teamForm.color === color.value 
                                                            ? "border-white dark:border-slate-800 ring-2 ring-blue-500 scale-105" 
                                                            : "border-transparent opacity-80 hover:opacity-100"
                                                    )}
                                                    style={{ backgroundColor: color.value }}
                                                    title={color.name}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3 px-1 mt-2">
                                            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">or choose custom</span>
                                            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Input 
                                                type="color" 
                                                value={teamForm.color} 
                                                onChange={(e) => setTeamForm({ ...teamForm, color: e.target.value })}
                                                className="w-12 h-10 p-1 rounded-lg border-slate-100 dark:border-slate-800 cursor-pointer"
                                            />
                                            <Input 
                                                type="text" 
                                                value={teamForm.color.toUpperCase()} 
                                                onChange={(e) => setTeamForm({ ...teamForm, color: e.target.value })}
                                                className="h-10 rounded-lg border-slate-100 dark:border-slate-800 font-mono text-xs uppercase"
                                                placeholder="#HEXCODE"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Member Selection */}
                                <div className="space-y-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Select Initial Members</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Search users to add..."
                                            value={formMemberSearch}
                                            onChange={(e) => setFormMemberSearch(e.target.value)}
                                            className="h-11 pl-10 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold"
                                        />
                                    </div>
                                    <div className="h-[340px] overflow-y-auto pr-1 space-y-2 scrollbar-hide border border-slate-100 dark:border-slate-900 rounded-2xl p-2 bg-slate-50/30 dark:bg-slate-900/10">
                                        {filteredFormMembers.map((u) => {
                                            const isSelected = teamForm.members.includes(u.username);
                                            return (
                                                <div 
                                                    key={u.username} 
                                                    onClick={() => {
                                                        const newMembers = isSelected 
                                                            ? teamForm.members.filter(m => m !== u.username)
                                                            : [...teamForm.members, u.username];
                                                        setTeamForm({ ...teamForm, members: newMembers });
                                                    }}
                                                    className={cn(
                                                        "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
                                                        isSelected 
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                                                            : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black",
                                                            isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                        )}>
                                                            {u.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className={cn("text-xs font-black", isSelected ? "text-white" : "text-slate-900 dark:text-white")}>{u.name}</div>
                                                            <div className={cn("text-[9px] font-bold uppercase tracking-wider", isSelected ? "text-white/70" : "text-slate-400")}>{u.role}</div>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                                            <Plus className="w-3 h-3 text-white rotate-45" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center justify-between px-1">
                                        <span>Selected Roster</span>
                                        <span className="text-blue-600 font-black">{teamForm.members.length} USERS</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 p-8 border-t border-slate-100 dark:border-slate-900 shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
                            <Button type="button" variant="ghost" onClick={closeTeamDialog} className="flex-1 h-12 rounded-2xl font-black text-slate-500">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving} className="flex-1 h-12 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : teamDialog.mode === 'add' ? 'Launch Team unit' : 'Save Team Changes'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Members Dialog */}
            <Dialog open={membersDialog.open} onOpenChange={(open) => !open && setMembersDialog({ open: false, teamId: null })}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 max-h-[90vh]">
                    <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-hidden">
                        {/* Sidebar - Team Info */}
                        <div className="w-full md:w-80 bg-slate-50/80 dark:bg-slate-900 p-8 flex flex-col items-center text-center border-r border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="w-24 h-24 rounded-3xl mb-6 shadow-xl flex items-center justify-center text-3xl font-black text-white shrink-0" style={{ backgroundColor: currentMembersTeam?.color }}>
                                {currentMembersTeam?.team_name.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                                {currentMembersTeam?.team_name}
                            </h3>
                            <Badge variant="outline" className="rounded-full px-3 py-1 mb-6 border-slate-300 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                {currentMembersTeam?.members?.length || 0} Members
                            </Badge>
                            
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
                                Manage user assignments for this team unit. Members will gain access to team-specific resources.
                            </p>
                            
                            <div className="mt-auto w-full pt-6 border-t border-slate-200 dark:border-slate-800">
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Team Leader</div>
                                {currentMembersTeam?.team_lead_username ? (
                                    <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-3 rounded-2xl shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs">
                                            {allUsers.find(u => u.username === currentMembersTeam?.team_lead_username)?.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[120px]">
                                                {allUsers.find(u => u.username === currentMembersTeam?.team_lead_username)?.name}
                                            </div>
                                            <div className="text-[10px] text-amber-500 font-bold">Project Lead</div>
                                        </div>
                                    </div>
                                ) : (
                                    <Button variant="outline" className="w-full rounded-2xl border-dashed border-2 text-xs font-bold text-slate-400" onClick={() => { setMembersDialog({open: false, teamId: null}); openTeamDialog('edit', currentMembersTeam); }}>
                                        Appoint Lead
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Main - User List */}
                        <div className="flex-1 flex flex-col p-8 overflow-hidden bg-white dark:bg-slate-950">
                            <div className="mb-6 relative shrink-0">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Find users to add or remove..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    className="h-12 pl-12 pr-4 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold focus:ring-blue-500 shadow-none border-2"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {filteredMembers.map((u) => {
                                    const isMember = (currentMembersTeam?.members || []).some(m => m.username === u.username);
                                    const isLead = u.username === currentMembersTeam?.team_lead_username;
                                    
                                    return (
                                        <div key={u.username} className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl transition-all border group",
                                            isMember 
                                                ? "bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20 shadow-sm" 
                                                : "bg-white dark:bg-slate-950 border-slate-50 dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-800"
                                        )}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 font-black", 
                                                    isLead ? "bg-amber-100 text-amber-700" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                )}>
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                                        {u.name}
                                                        {u.username === user?.username && <Badge className="bg-blue-100 text-blue-600 border-none h-4 px-1.5 text-[8px] font-black">YOU</Badge>}
                                                        {isLead && <Crown className="w-3 h-3 text-amber-500" />}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</div>
                                                </div>
                                            </div>
                                            {isMember ? (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleRemoveMember(currentMembersTeam?.id, u.username)}
                                                    className="rounded-xl bg-white dark:bg-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold border-none shadow-sm hover:scale-110 active:scale-90 transition-all h-9"
                                                    title="Remove from team"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAddMember(currentMembersTeam?.id, u.username)}
                                                    className="rounded-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 font-bold h-9 hover:scale-110 active:scale-90 transition-all border-2"
                                                    title="Add to team"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                                {filteredMembers.length === 0 && (
                                    <div className="py-12 text-center">
                                        <p className="text-slate-400 font-bold">No users found for "{memberSearch}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
                                <Button onClick={() => setMembersDialog({ open: false, teamId: null })} className="rounded-2xl h-11 px-8 font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none shadow-lg active:scale-95 transition-all">
                                    Done
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Team Details Dialog */}
            <Dialog open={viewDialog.open} onOpenChange={(open) => !open && setViewDialog({ open: false, teamId: null })}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-950 max-h-[90vh] flex flex-col">
                    <div className="relative flex-1 overflow-y-auto custom-scrollbar">
                        {/* Header Banner */}
                        <div className="h-32 w-full relative overflow-hidden shrink-0" style={{ backgroundColor: currentViewTeam?.color }}>
                            <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                            <div className="absolute top-6 left-8 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                                    {(currentViewTeam?.team_name || 'T').charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <h2 className="text-3xl font-black text-white drop-shadow-md">
                                        {currentViewTeam?.team_name}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                                            #{currentViewTeam?.id}
                                        </Badge>
                                        <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">Global Team Unit</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                            {/* Left Pane - Stats & Lead */}
                            <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Team Leader</h4>
                                    {currentViewTeam?.team_lead_username ? (
                                        <div className="flex items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                                            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-lg shadow-sm">
                                                {allUsers.find(u => u.username === currentViewTeam?.team_lead_username)?.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-tight truncate max-w-[120px]">
                                                    {allUsers.find(u => u.username === currentViewTeam?.team_lead_username)?.name}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Crown className="w-3 h-3 text-amber-500" />
                                                    <span className="text-[9px] font-black text-amber-600/70 uppercase">Unit Lead</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs font-bold bg-white/50 dark:bg-slate-950/50">
                                            No leader assigned
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Quick Stats</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                            <div className="text-xl font-black text-blue-600">{currentViewTeam?.members?.length || 0}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">Members</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                                            <div className="text-xl font-black text-emerald-600">Active</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">Status</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                                    <Button onClick={() => { setViewDialog({open: false, teamId: null}); openTeamDialog('edit', currentViewTeam); }} className="w-full rounded-2xl h-12 font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none transition-transform active:scale-95 shadow-lg">
                                        Edit Team Info
                                    </Button>
                                    <Button variant="outline" onClick={() => { setViewDialog({open: false, teamId: null}); openMembersDialog(currentViewTeam); }} className="w-full rounded-2xl h-12 font-black border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-transform active:scale-95">
                                        Manage Members
                                    </Button>
                                </div>
                            </div>

                            {/* Right Pane - Content */}
                            <div className="md:col-span-2 p-8 space-y-8 bg-white dark:bg-slate-950">
                                <div className="text-left">
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3 flex items-center gap-2">
                                        <Info className="w-3 h-3" />
                                        Unit Description
                                    </h4>
                                    <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium italic border border-slate-100 dark:border-slate-800/50">
                                        {currentViewTeam?.description || "No description provided for this team unit. Set a description to help everyone understand the purpose and goals of this group."}
                                    </div>
                                </div>

                                <div className="text-left">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                            <UsersIcon className="w-3 h-3" />
                                            Team Roster
                                        </h4>
                                        <Badge variant="secondary" className="rounded-full px-2 text-[9px] font-black bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                            {currentViewTeam?.members?.length || 0} PERSONS
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                                        {(currentViewTeam?.members || []).map((m) => (
                                            <div key={m.username} className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 transition-all shadow-sm">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 shadow-inner">
                                                    {(m.user_name || m.username).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                                                        {m.user_name || m.username}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                        {m.username === currentViewTeam?.team_lead_username ? (
                                                            <>
                                                                <Crown className="w-2.5 h-2.5 text-amber-500" />
                                                                <span className="text-amber-600/70">Team Leader</span>
                                                            </>
                                                        ) : (
                                                            <span>Active Member</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(currentViewTeam?.members || []).length === 0 && (
                                            <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50/30 dark:bg-slate-900/10">
                                                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Roster is currently empty</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 flex justify-end">
                        <Button onClick={() => setViewDialog({ open: false, teamId: null })} className="rounded-2xl h-11 px-8 font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg active:scale-95 transition-all">Close Details</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={confirmDelete.open} onOpenChange={(open) => !open && setConfirmDelete({ open: false, id: null, name: "" })}>
                <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-white dark:bg-slate-950">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete Team Unit?</h3>
                        <p className="text-slate-500 font-medium mb-8">
                            Are you sure you want to delete <span className="text-slate-900 dark:text-white font-black">"{confirmDelete.name}"</span>? This action is permanent and will unassign all members.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setConfirmDelete({ open: false, id: null, name: "" })} className="flex-1 h-12 rounded-2xl font-black text-slate-500">
                                No, Keep it
                            </Button>
                            <Button onClick={handleDelete} className="flex-1 h-12 rounded-2xl font-black bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">
                                Yes, Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default TeamsSettings;
