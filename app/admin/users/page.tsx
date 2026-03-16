"use client";

import { useState, useEffect } from "react";
import { User, Search, Edit, Trash2, Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals
  const [editModal, setEditModal] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [banModal, setBanModal] = useState<any>(null);

  const fetchUsers = async (search?: string) => {
    setLoading(true);
    try {
      const url = search
        ? `/api/admin/users?search=${encodeURIComponent(search)}`
        : '/api/admin/users';
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = () => {
    fetchUsers(searchQuery);
  };

  const handleUpdateUser = async () => {
    if (!editModal) return;
    setActionLoading(editModal._id);

    try {
      const res = await fetch(`/api/admin/users/${editModal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editModal.type,
          fullName: editModal.fullName,
          email: editModal.email
        })
      });

      if (!res.ok) throw new Error('Update failed');

      toast.success("User updated successfully");
      setEditModal(null);
      fetchUsers(searchQuery);
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async () => {
    if (!banModal) return;
    setActionLoading(banModal._id);

    try {
      const res = await fetch(`/api/admin/users/${banModal._id}?action=ban`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Ban failed');

      toast.success("User banned successfully");
      setBanModal(null);
      fetchUsers(searchQuery);
    } catch (error) {
      toast.error("Failed to ban user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    setActionLoading(deleteModal._id);

    try {
      const res = await fetch(`/api/admin/users/${deleteModal._id}?action=delete`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete failed');

      toast.success("User deleted successfully");
      setDeleteModal(null);
      fetchUsers(searchQuery);
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Users</h1>
          <p className="text-slate-500">Manage all registered users</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
          Total: {users.length}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-900">User</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Role</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Email</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Joined</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photo || user.image} alt={user.fullName || user.name || "User"} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                            {user.fullName?.[0] || user.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-slate-900">
                          {user.fullName || user.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${user.type === 'admin' || user.type === 'super-admin' ? 'bg-purple-100 text-purple-800' :
                          user.type === 'mentor' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'}`}>
                        {user.type || user.role || "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{user.email}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${user.account_status === 'PROPER_BANNED' ? 'bg-red-50 text-red-700' :
                          user.account_status === 'SOFT_BANNED' ? 'bg-orange-50 text-orange-700' :
                            'bg-green-50 text-green-700'}`}>
                        {user.account_status === 'PROPER_BANNED' ? 'Banned' :
                          user.account_status === 'SOFT_BANNED' ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditModal(user)}
                          disabled={actionLoading === user._id}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBanModal(user)}
                          disabled={actionLoading === user._id || user.account_status === 'PROPER_BANNED'}
                          className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteModal(user)}
                          disabled={actionLoading === user._id}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role</DialogDescription>
          </DialogHeader>
          {editModal && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={editModal.fullName || ''}
                  onChange={(e) => setEditModal({ ...editModal, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={editModal.email || ''}
                  onChange={(e) => setEditModal({ ...editModal, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={editModal.type} onValueChange={(val) => setEditModal({ ...editModal, type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super-admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(null)}>Cancel</Button>
            <Button onClick={handleUpdateUser} disabled={!!actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Modal */}
      <Dialog open={!!banModal} onOpenChange={() => setBanModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban <strong>{banModal?.fullName}</strong>? They will not be able to access the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBanUser} disabled={!!actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{deleteModal?.fullName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={!!actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
