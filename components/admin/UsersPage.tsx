"use client"

import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  User, 
  Mail, 
  Calendar, 
  Ban,
  UserCheck,
  UserX
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  _id: string;
  fullName: string;
  email: string;
  type: 'student' | 'mentor' | 'admin' | 'super_admin';
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
  profile: {
    bio?: string;
    department?: string;
    course?: string;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const isSuperAdmin = session?.user?.role === 'super_admin';

  useEffect(() => {
    fetchUsers();
  }, [search, typeFilter, statusFilter, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string, role?: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, role }),
      });

      if (response.ok) fetchUsers();
    } catch (error) {
      console.error('Failed to perform user action:', error);
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'super_admin': return 'border border-purple-400 text-purple-800 bg-transparent';
      case 'admin': return 'border border-blue-400 text-blue-800 bg-transparent';
      case 'mentor': return 'border border-green-400 text-green-800 bg-transparent';
      case 'student': return 'border border-gray-400 text-gray-800 bg-transparent';
      default: return 'border border-gray-400 text-gray-800 bg-transparent';
    }
  };

  const getUserStatusColor = (user: User) => {
    if (user.isBlocked) return 'border border-red-400 text-red-800 bg-transparent';
    if (!user.isActive) return 'border border-yellow-400 text-yellow-800 bg-transparent';
    return 'border border-green-400 text-green-800 bg-transparent';
  };

  const getUserStatusText = (user: User) => {
    if (user.isBlocked) return 'Blocked';
    if (!user.isActive) return 'Inactive';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">User Management</h1>
        <p className="text-black mt-2">
          Manage and monitor all platform users
        </p>
      </div>

{/* Filters */}
<Card className="bg-white border border-black rounded-xl">
  <CardHeader>
    <CardTitle className="text-black">Filters</CardTitle>
  </CardHeader>

  <CardContent className="bg-white">
    <div className="flex flex-col sm:flex-row gap-4">

      {/* Search */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 h-5 w-5" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              !bg-white text-black pl-10
              border border-black
              opacity-100
              hover:!bg-white
              focus:!bg-white
              focus-visible:ring-0
              focus-visible:ring-offset-0
            "
          />
        </div>
      </div>

      {/* User Type */}
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger
          className="
            w-full sm:w-48
            !bg-white text-black
            border border-black
            hover:!bg-white
            focus:!bg-white
            data-[state=open]:!bg-white
            [&>svg]:!text-black
            [&>svg]:!opacity-100
          "
        >
          <SelectValue placeholder="All Types" />
        </SelectTrigger>

        <SelectContent className="bg-white text-black border border-black shadow-lg">
          <SelectItem
            value="all"
            className="
              cursor-pointer
              hover:bg-blue-100
              focus:bg-blue-100
              data-[state=checked]:bg-blue-600
              data-[state=checked]:text-white
              data-[state=checked]:hover:bg-blue-600
            "
          >
            All Types
          </SelectItem>

          <SelectItem
            value="student"
            className="
              cursor-pointer
              hover:bg-blue-100
              focus:bg-blue-100
              data-[state=checked]:bg-blue-600
              data-[state=checked]:text-white
              data-[state=checked]:hover:bg-blue-600
            "
          >
            Students
          </SelectItem>

          <SelectItem
            value="mentor"
            className="
              cursor-pointer
              hover:bg-blue-100
              focus:bg-blue-100
              data-[state=checked]:bg-blue-600
              data-[state=checked]:text-white
              data-[state=checked]:hover:bg-blue-600
            "
          >
            Mentors
          </SelectItem>

          <SelectItem
            value="admin"
            className="
              cursor-pointer
              hover:bg-blue-100
              focus:bg-blue-100
              data-[state=checked]:bg-blue-600
              data-[state=checked]:text-white
              data-[state=checked]:hover:bg-blue-600
            "
          >
            Admins
          </SelectItem>

          {isSuperAdmin && (
            <SelectItem
              value="super_admin"
              className="
                cursor-pointer
                hover:bg-blue-100
                focus:bg-blue-100
                data-[state=checked]:bg-blue-600
                data-[state=checked]:text-white
                data-[state=checked]:hover:bg-blue-600
              "
            >
              Super Admins
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger
          className="
            w-full sm:w-48
            !bg-white text-black
            border border-black
            hover:!bg-white
            focus:!bg-white
            data-[state=open]:!bg-white
            [&>svg]:!text-black
            [&>svg]:!opacity-100
          "
        >
          <SelectValue placeholder="All Status" />
        </SelectTrigger>

        <SelectContent className="bg-white text-black border border-black shadow-lg">
          <SelectItem
            value="all"
            className="
              cursor-pointer
              hover:bg-blue-100
              focus:bg-blue-100
              data-[state=checked]:bg-blue-600
              data-[state=checked]:text-white
              data-[state=checked]:hover:bg-blue-600
            "
          >
            All Status
          </SelectItem>

          <SelectItem
            value="active"
            className="
              cursor-pointer
              hover:bg-blue-100
              focus:bg-blue-100
              data-[state=checked]:bg-blue-600
              data-[state=checked]:text-white
              data-[state=checked]:hover:bg-blue-600
            "
          >
            Active
          </SelectItem>

          <SelectItem
            value="inactive"
            className="
              cursor-pointer
              hover:bg-blue-100
              focus:bg-blue-100
              data-[state=checked]:bg-blue-600
              data-[state=checked]:text-white
              data-[state=checked]:hover:bg-blue-600
            "
          >
            Inactive
          </SelectItem>

          <SelectItem
            value="blocked"
            className="
              cursor-pointer
              hover:bg-blue-100
              focus:bg-blue-100
              data-[state=checked]:bg-blue-600
              data-[state=checked]:text-white
              data-[state=checked]:hover:bg-blue-600
            "
          >
            Blocked
          </SelectItem>
        </SelectContent>
      </Select>

    </div>
  </CardContent>
</Card>

{/* Users List */}
<Card className="bg-white border border-black rounded-xl">
  <CardHeader>
    <CardTitle className="text-black">
      Users ({pagination.total})
    </CardTitle>
    <CardDescription className="text-black/70">
      Showing {users.length} of {pagination.total} users
    </CardDescription>
  </CardHeader>

  <CardContent>
    {loading ? (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ) : (
      <div className="space-y-4">

        {users.map((user) => (
          <div
            key={user._id}
            className="
              group
              flex items-center justify-between
              p-4 border border-black rounded-lg
              text-black
              transition-colors
              hover:text-white
              hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600
            "
          >
            {/* Left */}
            <div className="flex items-center space-x-4">
              <div
                className="
                  w-10 h-10 border border-black rounded-full
                  flex items-center justify-center
                  transition-colors
                  group-hover:border-white
                "
              >
                <User className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center space-x-2 ">
                  <h3 className="font-medium ">{user.fullName}</h3>

                  <Badge className={getUserTypeColor(user.type)}>
                    {user.type.replace('_', ' ')}
                  </Badge>

                  <Badge className={getUserStatusColor(user)}>
                    {getUserStatusText(user)}
                  </Badge>
                </div>

                <div className="flex items-center space-x-4 text-sm text-black/70 mt-1 group-hover:text-white/90">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {user.profile?.bio && (
                  <p className="text-sm text-black/70 mt-1 line-clamp-1 group-hover:text-white/90">
                    {user.profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-2">

              {/* Role Select */}
              {isSuperAdmin && (
                <Select
                  value={user.type}
                  onValueChange={(value) =>
                    handleUserAction(user._id, 'change_role', value)
                  }
                >
                  <SelectTrigger
                    className="
                      w-32
                      !bg-white text-black
                      border border-black
                      hover:!bg-white
                      focus:!bg-white
                      data-[state=open]:!bg-white
                      [&>svg]:!text-black
                      [&>svg]:!opacity-100
                      group-hover:!bg-white
                    "
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="bg-white text-black border border-black shadow-lg">
                    {[
                      ['student', 'Student'],
                      ['mentor', 'Mentor'],
                      ['admin', 'Admin'],
                      ['super_admin', 'Super Admin'],
                    ].map(([value, label]) => (
                      <SelectItem
                        key={value}
                        value={value}
                        className="
                          cursor-pointer
                          hover:bg-blue-100
                          focus:bg-blue-100
                          data-[state=checked]:bg-blue-600
                          data-[state=checked]:text-white
                          data-[state=checked]:hover:bg-blue-600
                        "
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Block / Unblock */}
              <Button
                
                size="sm"
                onClick={() =>
                  handleUserAction(
                    user._id,
                    user.isBlocked ? 'unblock' : 'block'
                  )
                }
                className="
                  text-black border-black
                  bg-white border
                  hover:text-white
                  hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600
                "
              >
                {user.isBlocked ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Unblock
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-1" />
                    Block
                  </>
                )}
              </Button>

              {/* Activate / Deactivate */}
              <Button
                
                size="sm"
                onClick={() =>
                  handleUserAction(
                    user._id,
                    user.isActive ? 'deactivate' : 'activate'
                  )
                }
                className="
                  text-black border-black
                  bg-white border
                  hover:text-white
                  hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600
                "
              >
                {user.isActive ? (
                  <>
                    <UserX className="h-4 w-4 mr-1" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Activate
                  </>
                )}
              </Button>

            </div>
          </div>
        ))}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-black/70">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                className="text-black border-black hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                className="text-black border-black hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600"
              >
                Next
              </Button>
            </div>
          </div>
        )}

      </div>
    )}
  </CardContent>
</Card>
    </div>
  );
}
