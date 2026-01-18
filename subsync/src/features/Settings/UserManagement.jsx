import React, { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "react-toastify";
import {
  UserPlus,
  UserRoundPen,
  UserRoundMinus,
  Search,
  Mail,
  Shield,
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  ShieldCheck,
  UserCheck,
  Filter,
  MoreHorizontal,
  AtSign,
  Cake,
  History,
  ExternalLink,
  Clock
} from "lucide-react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import api from "@/lib/axiosInstance";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { motion, AnimatePresence } from "framer-motion";
import Hamster from "@/components/animations/Hamster.jsx";

const StatsCard = ({ title, value, icon: Icon, color, description }) => (
  <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/30">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 shadow-inner`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { username } = useParams();
  const { hasPermission } = usePermissions();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const canCreate = hasPermission(PERMISSIONS.USERS_CREATE);
  const canEdit = hasPermission(PERMISSIONS.USERS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.USERS_DELETE);
  const debounceTimeout = useRef();

  // Debounce search
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [search]);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Delete user
  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.username}`);
      setUsers(users.filter(u => u.username !== userToDelete.username));
      toast.success("User deleted successfully!");
    } catch {
      toast.error("Failed to delete user");
    }
    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  // Filter users by search and role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.role?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.username?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesRole = roleFilter === "all" || u.roleKey === roleFilter || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, debouncedSearch, roleFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const admins = users.filter(u => u.role === 'Admin' || u.roleKey === 'admin').length;
    return { total, active, admins };
  }, [users]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(users.map(u => u.role));
    return Array.from(roles).filter(Boolean);
  }, [users]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Breadcrumb
            items={[
              { label: "Settings", href: `/${username}/dashboard/settings` },
              { label: "User Management" }
            ]}
          />
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Securely manage your team and their access permissions.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => navigate(`/${username}/dashboard/settings/user-management/add-user`)}
            className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 py-6 px-6 rounded-xl"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Add New User
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.total}
          icon={Users}
          color="bg-blue-500"
          description="Total users in the system"
        />
        <StatsCard
          title="Active Users"
          value={stats.active}
          icon={UserCheck}
          color="bg-emerald-500"
          description={`${((stats.active / stats.total) * 100 || 0).toFixed(1)}% of total`}
        />
        <StatsCard
          title="Administrators"
          value={stats.admins}
          icon={ShieldCheck}
          color="bg-indigo-500"
          description="Users with high-level access"
        />
      </div>

      {/* Main Content Card */}
      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row items-center gap-4 border-b border-border/50">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50 border-none focus-visible:ring-1 transition-all h-11"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium whitespace-nowrap">
              <Filter className="w-4 h-4" /> Filter by:
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] bg-background/50 border-none h-11">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-h-[400px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col justify-center items-center p-20">
              <Hamster />
              <p className="text-muted-foreground mt-6 text-lg animate-pulse">Gathering user data...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-left">
                    <th className="p-5 font-semibold text-muted-foreground first:pl-8">User Details</th>
                    <th className="p-5 font-semibold text-muted-foreground">Role & Access</th>
                    <th className="p-5 font-semibold text-muted-foreground text-center">Status</th>
                    <th className="p-5 font-semibold text-muted-foreground">Joining Date</th>
                    {(canEdit || canDelete) && <th className="p-5 font-semibold text-muted-foreground text-right last:pr-8">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.map((user, idx) => (
                      <motion.tr
                        key={user.username}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                        className="group border-b border-border/30 last:border-0 hover:bg-muted/30 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetailDialog(true);
                        }}
                      >
                        <td className="p-5 first:pl-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm relative group-hover:scale-110 transition-transform">
                              {user.name?.charAt(0).toUpperCase()}
                              {user.is_active && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-base group-hover:text-blue-600 transition-colors tracking-tight">{user.name}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <Mail className="w-3.5 h-3.5" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <Shield className={`w-4 h-4 ${user.role === 'Admin' ? 'text-blue-500' :
                              user.role === 'Manager' ? 'text-purple-500' : 'text-slate-400'
                              }`} />
                            <Badge variant="outline" className={`font-medium py-1 px-3 ${user.role === 'Admin' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                              user.role === 'Manager' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                                'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900/10 dark:text-slate-400'
                              }`}>
                              {user.role}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="flex justify-center">
                            {user.is_active ? (
                              <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800/50">
                                <XCircle className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Blocked</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-5 font-medium text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 opacity-50" />
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : "-"}
                          </div>
                        </td>
                        {(canEdit || canDelete) && (
                          <td className="p-5 text-right last:pr-8" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-muted">
                                  <MoreHorizontal className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    setSelectedUser(user);
                                    setTimeout(() => setShowDetailDialog(true), 50);
                                  }}
                                  className="rounded-lg gap-2 cursor-pointer focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-900/10"
                                >
                                  <Shield className="w-4 h-4 text-blue-500" />
                                  View Details
                                </DropdownMenuItem>
                                {canEdit && (
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      navigate(`/${username}/dashboard/settings/user-management/add-user/${user.username}`, { state: { user } })
                                    }}
                                    className="rounded-lg gap-2 cursor-pointer focus:bg-blue-50 focus:text-blue-700 dark:focus:bg-blue-900/20"
                                  >
                                    <UserRoundPen className="w-4 h-4" />
                                    Edit Profile
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      setUserToDelete(user);
                                      setTimeout(() => setShowDeleteDialog(true), 50);
                                    }}
                                    className="rounded-lg gap-2 cursor-pointer focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/20"
                                  >
                                    <UserRoundMinus className="w-4 h-4" />
                                    Remove User
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-muted to-background rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-border">
                <Users className="w-12 h-12 text-muted-foreground/50" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">No Results Found</h3>
              <p className="text-muted-foreground max-w-sm mt-3 text-lg leading-relaxed">
                {debouncedSearch || roleFilter !== "all"
                  ? "We couldn't find any users matching your filters. Try search something else."
                  : "Start building your team by inviting members to join Subsync."}
              </p>
              {!debouncedSearch && roleFilter === "all" && canCreate && (
                <Button
                  onClick={() => navigate(`/${username}/dashboard/settings/user-management/add-user`)}
                  className="mt-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-6 h-auto text-base shadow-lg shadow-blue-500/20"
                >
                  <UserPlus className="w-5 h-5 mr-3" /> Add Your First User
                </Button>
              )}
              {(debouncedSearch || roleFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-6 rounded-xl"
                  onClick={() => { setSearch(""); setRoleFilter("all"); }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setUserToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl [&>button]:hidden">
          <div className="bg-destructive/10 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4 ring-8 ring-destructive/5">
              <UserRoundMinus className="w-8 h-8 text-destructive" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-destructive">Delete User?</DialogTitle>
              <DialogDescription className="text-base pt-2 font-medium">
                You are about to permanently remove <span className="font-bold text-foreground">"{userToDelete?.name}"</span> from the system.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-card">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This action is irreversible. The user will lose access to all modules and historical data associated with their account will be archived.
            </p>
            <DialogFooter className="mt-8 gap-3">
              <Button
                variant="ghost"
                className="flex-1 rounded-xl h-11"
                onClick={() => setShowDeleteDialog(false)}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-destructive/20"
                onClick={confirmDelete}
              >
                Delete User
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      <Dialog
        open={showDetailDialog}
        onOpenChange={(open) => {
          setShowDetailDialog(open);
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-card [&>button]:hidden">
          <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-600">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-8 w-8 z-10"
              onClick={() => setShowDetailDialog(false)}
            >
              <XCircle className="w-5 h-5" />
            </Button>
            <div className="absolute -bottom-12 left-8 p-1 bg-card rounded-[2rem]">
              <div className="w-24 h-24 rounded-[1.8rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                {selectedUser?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="pt-16 pb-8 px-8 space-y-8 text-card-foreground">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">{selectedUser?.name}</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AtSign className="w-4 h-4" />
                  <span className="font-medium">{selectedUser?.username}</span>
                  <Badge variant="outline" className="ml-2 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50 font-bold uppercase tracking-wider text-[10px]">
                    {selectedUser?.role}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      navigate(`/${username}/dashboard/settings/user-management/add-user/${selectedUser?.username}`, { state: { user: selectedUser } });
                    }}
                    className="rounded-xl shadow-lg shadow-blue-500/10"
                  >
                    <UserRoundPen className="w-4 h-4 mr-2" /> Edit
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </div>
                <p className="font-semibold text-sm truncate">{selectedUser?.email}</p>
              </div>
              <div className="space-y-1.5 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                  <Cake className="w-3.5 h-3.5" /> Date of Birth
                </div>
                <p className="font-semibold text-sm">
                  {selectedUser?.date_of_birth ? new Date(selectedUser.date_of_birth).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }) : "Not specified"}
                </p>
              </div>
              <div className="space-y-1.5 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                  <History className="w-3.5 h-3.5" /> Account Joined
                </div>
                <p className="font-semibold text-sm">
                  {selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  }) : "-"}
                </p>
              </div>
              <div className="space-y-1.5 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                  <ShieldCheck className="w-3.5 h-3.5" /> Status
                </div>
                <div className="pt-0.5">
                  {selectedUser?.is_active ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-2 py-0 text-[10px] h-5">ACTIVE</Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600 border-none px-2 py-0 text-[10px] h-5">BLOCKED</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Teams Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-[0.2em] flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Functional Teams
                </h4>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-none px-2 h-5 text-[9px] font-black">
                  {selectedUser?.teams?.length || 0} ASSIGNED
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedUser?.teams?.map((team) => (
                  <Badge 
                    key={team.id} 
                    variant="outline" 
                    className="rounded-xl px-3 py-1.5 border-none shadow-sm flex items-center gap-2 hover:scale-105 transition-transform cursor-default"
                    style={{ backgroundColor: `${team.color}15`, color: team.color }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: team.color }} />
                    <span className="font-bold text-[11px] uppercase tracking-tight">{team.name}</span>
                  </Badge>
                ))}
                {(selectedUser?.teams?.length === 0 || !selectedUser?.teams) && (
                  <div className="w-full py-4 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/20">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">No teams assigned</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 italic">
                <Clock className="w-3 h-3" /> Last updated: {selectedUser?.updated_at ? new Date(selectedUser.updated_at).toLocaleDateString() : 'N/A'}
              </span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-blue-600 font-bold"
                onClick={() => {
                  setShowDetailDialog(false);
                  navigate(`/${username}/dashboard/settings/user-management/overrides/${selectedUser?.username}`);
                }}
              >
                Manage Permissions <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Outlet />
    </div>
  );
};

export default UserManagement;
