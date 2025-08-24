import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import api from "@/lib/axiosInstance";
import { UserPlus, UserRoundPen, ArrowLeft } from "lucide-react";

const ROLES = ["Admin", "Manager", "User"];

const AddUser = () => {
  const { editUsername } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Robust editing logic: true if editUsername param is a non-empty string
  const editing = !!editUsername;
  // console.log('AddUser.jsx editUsername:', editUsername, 'editing:', editing);
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
      // Reset form for new user
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
    if (!editing) return; // Only fetch user data if editing
    // If user data is passed via state, use it, else fetch from API
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
        // Don't send password if empty
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
    <div className="py-8 px-4 flex items-center justify-center">
      <ToastContainer position="top-right" />
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border border-blue-100 dark:border-gray-800 animate-fadeIn">
        <button
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 animate-slideInLeft"
          disabled={loading}
        >
          <ArrowLeft size={20} className="animate-bounce-x" />
          <span className="font-medium">Back</span>
        </button>

        <div className="flex items-center gap-2 mb-6">
          {editing ? <UserRoundPen size={28} className="text-blue-600" /> : <UserPlus size={28} className="text-blue-600" />}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {editing ? "Edit User" : "Add User"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
              disabled={editing}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
              Password {editing && <span className="text-xs text-gray-400">(leave blank to keep unchanged)</span>}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required={!editing}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            >
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              id="is_active"
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <label htmlFor="is_active" className="text-gray-700 dark:text-gray-200 font-medium">Active</label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition disabled:opacity-50"
              disabled={loading}
            >
              {editing ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.95);}
          100% { opacity: 1; transform: scale(1);}
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes slideInLeft {
          0% { opacity: 0; transform: translateX(-20px);}
          100% { opacity: 1; transform: translateX(0);}
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease;
        }
        
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-3px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default AddUser;