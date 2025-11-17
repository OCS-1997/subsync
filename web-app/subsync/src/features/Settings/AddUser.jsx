import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import { UserPlus, UserRoundPen, ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";

const ROLES = ["Admin", "Manager", "User"];

const AddUser = () => {
  const { editUsername } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const editing = !!editUsername;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "User",
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
        role: "User",
        is_active: true,
      });
      setLoading(false);
    }
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
        role: user.role,
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
            role: res.data.role,
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
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Go back"
              disabled={loading}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs text-gray-500">
                Settings {`>`} User Management {`>`} {editing ? 'Edit' : 'New'}
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
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
                    className={editing ? "bg-gray-50" : ""}
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
                  <Label htmlFor="password">
                    Password {editing && <span className="text-xs text-gray-500 font-normal">(leave blank to keep unchanged)</span>}
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
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
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

              <div className="flex justify-end gap-3 pt-4 border-t">
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
