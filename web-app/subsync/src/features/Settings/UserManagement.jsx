import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { UserPlus, UserRoundPen, UserRoundMinus, Search } from "lucide-react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import api from "@/lib/axiosInstance";
import { useSelector } from 'react-redux';

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import Hamster from "@/components/animations/Hamster.jsx";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { username } = useParams();
  const role = useSelector(state => state.auth.role);
  const isAdmin = role === 'Admin';
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

  // Filter users by search
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.role?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const headers = [
    { key: "username", label: "Username" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Created" },
    { key: "updated_at", label: "Updated" },
    ...(isAdmin ? [{ key: "actions", label: "Actions" }] : [])
  ];

  const tableData = filteredUsers.map(user => ({
    ...user,
    role: (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
        user.role === "Admin"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          : user.role === "Manager"
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      }`}>
        {user.role}
      </span>
    ),
    status: (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
        user.is_active
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {user.is_active ? 'Active' : 'Inactive'}
      </span>
    ),
    created_at: user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : "-",
    updated_at: user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : "-",
    actions: isAdmin ? (
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate(`/${username}/dashboard/settings/user-management/add-user/${user.username}`, { state: { user } })}
          className="h-8 w-8 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
          title="Edit"
        >
          <UserRoundPen className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => { setUserToDelete(user); setShowDeleteDialog(true); }}
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Delete"
        >
          <UserRoundMinus className="w-4 h-4" />
        </Button>
      </div>
    ) : null
  }));

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">User Management</h1>
        {isAdmin && (
          <Button
            onClick={() => navigate(`/${username}/dashboard/settings/user-management/add-user`)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </Button>
        )}
      </div>
      <hr className="mb-6 border-blue-500 border-1" />
      <div className="flex items-center gap-3 mb-3">
        <SearchFilterForm
          search={search}
          setSearch={setSearch}
          handleSearch={() => {}}
        />
      </div>

      {loading ? (
        <div className="p-6 flex flex-col justify-center items-center">
          <Hamster />
        </div>
      ) : filteredUsers.length > 0 ? (
        <GenericTable
          headers={headers}
          data={tableData}
          primaryKey="username"
        />
      ) : (
        <div className="p-10 border rounded-md bg-white text-center">
          {debouncedSearch ? (
            <>
              <div className="text-lg font-semibold mb-2">No results found</div>
              <div className="text-sm text-gray-600 mb-4">Try adjusting your search criteria.</div>
            </>
          ) : (
            <>
              <div className="text-lg font-semibold mb-2">No users yet</div>
              <div className="text-sm text-gray-600 mb-4">Create your first user to get started.</div>
              {isAdmin && (
                <Button onClick={() => navigate(`/${username}/dashboard/settings/user-management/add-user`)}>
                  <UserPlus className="w-4 h-4" /> Add User
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user <strong>{userToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Outlet />
    </div>
  );
};

export default UserManagement;
