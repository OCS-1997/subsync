import React, { useState, useEffect } from "react";
import { toast} from "react-toastify";
import { UserPlus, UserRoundPen, UserRoundMinus } from "lucide-react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import api from "@/lib/axiosInstance";
import { useSelector } from 'react-redux';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { username } = useParams();
  const role = useSelector(state => state.auth.role);
  const isAdmin = role === 'Admin';

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

  // Filter users by search
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-4 px-2">
  
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">User Management</h2>
          
            {isAdmin && (
              <button
                onClick={() => navigate(`/${username}/dashboard/settings/user-management/add-user`)}
                className="inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-lg shadow-lg hover:bg-blue-600 transition font-semibold"
              >
              <UserPlus size={20} />
              Add User
            </button>
          )}
        </div>
       <hr className="mb-10 border-gray-200 dark:border-gray-700" />
        <div className="flex items-center justify-between mb-6">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs px-4 py-1 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>
        <div className="overflow-x-auto rounded-lg shadow-lg bg-white dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-blue-500 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Username</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Active</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Updated</th>
                {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.username} className="hover:bg-blue-50 dark:hover:bg-gray-800 transition">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{user.username}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{user.name}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === "Admin"
                          ? "bg-blue-100 text-blue-800" : user.role === "Manager"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{user.created_at ? new Date(user.created_at).toLocaleString() : ""}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{user.updated_at ? new Date(user.updated_at).toLocaleString() : ""}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 space-x-2">
                        <button
                          onClick={() => navigate(`/${username}/dashboard/settings/user-management/add-user/${user.username}`, { state: { user } })}
                          className="inline-flex items-center gap-1 text-cyan-500 hover:text-cyan-700 px-2 py-1.5 rounded-lg hover:shadow transition"
                          title="Edit"
                        >
                          <UserRoundPen size={18} />
                        </button>
                        <button
                          onClick={() => { setUserToDelete(user); setShowDeleteDialog(true); }}
                          className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:shadow transition"
                          title="Delete"
                        >
                          <UserRoundMinus size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Dialog */}
      {isAdmin && showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-red-100 dark:border-gray-800 animate-fadeIn">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Confirm Delete</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete user <strong>{userToDelete?.name}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.95);}
          100% { opacity: 1; transform: scale(1);}
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease;
        }
      `}</style>
      <Outlet />
    </div>
  );
};

export default UserManagement;