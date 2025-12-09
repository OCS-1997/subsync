import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import { UserPlus, UserRoundPen, ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";

const AddUser = () => {
  const { editUsername } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const editing = !!editUsername;
  const [loading, setLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    date_of_birth: "",
    roleKey: "",
    is_active: true,
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
      });
      setLoading(false);
    }
  }, [editing]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data } = await api.get("/rbac/roles");
        setRoleOptions(data);
        if (!editing) {
          setForm((prev) => ({ ...prev, roleKey: data.find((role) => role.roleKey === 'viewer')?.roleKey || data[0]?.roleKey || "" }));
        }
      } catch (error) {
        toast.error("Failed to load roles");
      }
    };
    fetchRoles();
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
      });
    } else {
      setLoading(true);
      api.get(`/users/${editUsername}`)
        .then(res => {
          setForm({
            username: res.data.username,
            name: res.data.name,
            email: res.data.email,
            password: "",
            date_of_birth: res.data.date_of_birth || "",
            roleKey: res.data.roleKey || "",
            is_active: !!res.data.is_active,
          });
        })
        .catch(() => toast.error("Failed to load user"))
        .finally(() => setLoading(false));
    }
  }, [editing, editUsername, location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
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

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="p-4 bg-background dark:bg-background min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header with Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Go back"
              disabled={loading}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs text-muted-foreground">
                Settings {`>`} User Management {`>`} {editing ? 'Edit' : 'New'}
              </div>
              <h1 className="text-2xl font-semibold text-foreground">
                {editing ? 'Edit User' : 'New User'}
              </h1>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editing ? <UserRoundPen className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
              {editing ? "Edit User" : "Add User"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    disabled={editing}
                    className={editing ? "bg-muted dark:bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">
                    Password {editing && <span className="text-xs text-muted-foreground font-normal">(leave blank to keep unchanged)</span>}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required={!editing}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleKey">Role</Label>
                  <select
                    id="roleKey"
                    name="roleKey"
                    value={form.roleKey}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="" disabled>Select a role</option>
                    {roleOptions.map(role => (
                      <option key={role.id} value={role.roleKey}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_active" className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                      id="is_active"
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span>Active Status</span>
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editing ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    editing ? "Update User" : "Add User"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddUser;
