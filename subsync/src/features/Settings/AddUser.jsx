import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import {
  UserPlus,
  UserRoundPen,
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Lock,
  Calendar,
  Shield,
  Activity,
  ChevronLeft,
  Users as UsersIcon,
  UserCheck
} from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.jsx";
import { Switch } from "@/components/ui/switch.jsx";
import { motion, AnimatePresence } from "framer-motion";

const AddUser = () => {
  const { editUsername } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const isPrivileged = currentUser?.roleKey === 'admin' || currentUser?.roleKey === 'manager';
  const editing = !!editUsername;
  const [loading, setLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [teamOptions, setTeamOptions] = useState([]);
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    date_of_birth: "",
    roleKey: "",
    is_active: true,
    teams: [], // Array of team IDs
  });

  // Reset form when switching between add/edit modes
  useEffect(() => {
    if (!editing) {
      setForm({
        username: "",
        name: "",
        email: "",
        password: "",
        date_of_birth: "",
        roleKey: "",
        is_active: true,
        teams: [],
      });
      setLoading(false);
    }
  }, [editing]);

  useEffect(() => {
    const fetchRolesAndTeams = async () => {
      try {
        const [{ data: roles }, { data: teamsRes }] = await Promise.all([
          api.get("/rbac/roles"),
          api.get("/teams")
        ]);
        
        setRoleOptions(roles);
        setTeamOptions(teamsRes.teams || []);

        if (!editing) {
          setForm((prev) => ({
            ...prev,
            roleKey: roles.find((role) => role.roleKey === 'viewer')?.roleKey || roles[0]?.roleKey || ""
          }));
        }
      } catch (error) {
        toast.error("Failed to load roles or teams");
      }
    };
    fetchRolesAndTeams();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const user = location.state?.user;
    if (user) {
      setForm({
        username: user.username,
        name: user.name,
        email: user.email,
        password: "",
        date_of_birth: user.date_of_birth || "",
        roleKey: user.roleKey || "",
        is_active: !!user.is_active,
        teams: (user.teams || []).map(t => typeof t === 'object' ? t.id : t),
      });
    } else if (editUsername) {
      setLoading(true);
      api.get(`/users/${editUsername}`)
        .then(res => {
          setForm({
            username: res.data.username,
            name: res.data.name,
            email: res.data.email,
            password: "",
            date_of_birth: res.data.date_of_birth || "",
            roleKey: res.data.roleKey || res.data.role?.toLowerCase() || "",
            is_active: !!res.data.is_active,
            teams: (res.data.teams || []).map(t => typeof t === 'object' ? t.id : t),
          });
        })
        .catch(() => toast.error("Failed to load user"))
        .finally(() => setLoading(false));
    }
  }, [editing, editUsername, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setForm(f => ({ ...f, roleKey: value }));
  };

  const handleSwitchChange = (checked) => {
    setForm(f => ({ ...f, is_active: checked }));
  };

  const toggleTeam = (teamId) => {
    setForm(f => {
      const isSelected = f.teams.includes(teamId);
      const newTeams = isSelected 
        ? f.teams.filter(id => id !== teamId)
        : [...f.teams, teamId];
      return { ...f, teams: newTeams };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editUsername}`, payload);
        toast.success("User updated successfully!");
      } else {
        await api.post("/users", form);
        toast.success("User added successfully!");
      }
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save user");
    }
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="p-6 bg-gradient-to-b from-background to-muted/20 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb
              items={[
                { label: "Settings", href: `/${location.pathname.split('/')[1]}/dashboard/settings` },
                { label: "User Management", href: `/${location.pathname.split('/')[1]}/dashboard/settings/user-management` },
                { label: editing ? 'Edit User' : 'New User' }
              ]}
              className="mb-4"
            />
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {editing ? 'User Profile' : 'Add New Member'}
            </h1>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="rounded-xl hover:bg-muted group"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to List
          </Button>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Avatar & Basic Status */}
              <div className="md:col-span-1 space-y-6">
                <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl overflow-hidden text-center p-8">
                  <div className="mx-auto w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold mb-6 shadow-xl shadow-blue-500/20 transform hover:scale-105 transition-transform duration-300">
                    {form.name ? form.name.charAt(0).toUpperCase() : <User className="w-16 h-16" />}
                  </div>
                  <h3 className="text-xl font-bold truncate">{form.name || "New User"}</h3>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{form.email || "user@example.com"}</p>

                  <div className="mt-8 pt-8 border-t border-border/50">
                    <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border/50 group hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <Activity className={`w-5 h-5 ${form.is_active ? 'text-emerald-500' : 'text-red-500'}`} />
                        <div className="text-left">
                          <p className="text-sm font-semibold">Account Status</p>
                          <p className="text-xs text-muted-foreground">{form.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                      </div>
                      <Switch
                        checked={form.is_active}
                        onCheckedChange={handleSwitchChange}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Detailed Form Fields */}
              <div className="md:col-span-2 space-y-6">
                <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl">
                  <CardHeader className="border-b border-border/50 px-8 py-6">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Lock className="w-5 h-5 text-blue-600" /> Account Security
                    </CardTitle>
                    <CardDescription>Enter the user's primary credentials and access level.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="username"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            disabled={editing && !isPrivileged}
                            autoComplete="username"
                            placeholder="johndoe"
                            className={`pl-10 h-11 border-border/50 bg-background/50 focus:bg-background transition-all ${editing && !isPrivileged ? "bg-muted cursor-not-allowed" : ""}`}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roleKey" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Access Role</Label>
                        <Select
                          key={`role-select-${roleOptions.length}-${form.roleKey}`}
                          value={form.roleKey || ""}
                          onValueChange={handleSelectChange}
                        >
                          <SelectTrigger className="h-11 border-border/50 bg-background/50 focus:bg-background transition-all">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl">
                            {roleOptions.map(role => (
                              <SelectItem key={role.id} value={role.roleKey} className="rounded-lg">
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {editing ? "Change Password" : "Password"}
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required={!editing}
                            autoComplete="new-password"
                            placeholder={editing ? "••••••••" : "Min. 8 characters"}
                            className="pl-10 h-11 border-border/50 bg-background/50 focus:bg-background transition-all"
                          />
                        </div>
                        {editing && <p className="text-[10px] text-muted-foreground italic">Leave blank to keep current password.</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl">
                  <CardHeader className="border-b border-border/50 px-8 py-6">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" /> Personal Information
                    </CardTitle>
                    <CardDescription>These details are used for profile display and communications.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          autoComplete="name"
                          placeholder="John Doe"
                          className="h-11 border-border/50 bg-background/50 focus:bg-background transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            placeholder="john@subsync.com"
                            className="pl-10 h-11 border-border/50 bg-background/50 focus:bg-background transition-all"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="date_of_birth" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="date_of_birth"
                            type="date"
                            name="date_of_birth"
                            value={form.date_of_birth}
                            onChange={handleChange}
                            className="pl-10 h-11 border-border/50 bg-background/50 focus:bg-background transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl">
                  <CardHeader className="border-b border-border/50 px-8 py-6">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <UsersIcon className="w-5 h-5 text-blue-600" /> Team Assignments
                    </CardTitle>
                    <CardDescription>Assign this user to one or more functional teams.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamOptions.map((team) => {
                        const isSelected = form.teams.includes(team.id);
                        return (
                          <div
                            key={team.id}
                            onClick={() => toggleTeam(team.id)}
                            className={`flex flex-col p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                              isSelected 
                                ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/10" 
                                : "border-border/50 bg-background/50 hover:border-blue-200 dark:hover:border-blue-900/50"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                                style={{ backgroundColor: team.color }}
                              >
                                {team.team_name.charAt(0).toUpperCase()}
                              </div>
                              <span className={`font-bold text-sm ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-foreground'}`}>
                                {team.team_name}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-1 italic">
                              {team.description || "No description..."}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                              <Badge variant="outline" className="text-[9px] h-4 font-bold border-muted-foreground/30">
                                {team.member_count} Members
                              </Badge>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                  <UserCheck className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {teamOptions.length === 0 && (
                        <div className="col-span-full py-8 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                          <p className="text-sm text-muted-foreground font-medium">No teams available to assign.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    className="h-12 px-8 rounded-xl"
                  >
                    Discard
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 px-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 font-bold tracking-tight min-w-[160px]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editing ? "Save Changes" : "Create Account"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddUser;
