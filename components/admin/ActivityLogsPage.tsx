'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Activity, 
  User,
  Calendar,
  Settings,
  Trash2,
  Edit,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ActivityLog {
  _id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'restore' | 'block' | 'unblock' | 'role_change' | 'system_setting';
  targetType: 'user' | 'project' | 'comment' | 'report' | 'system';
  targetId: string;
  targetName?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivityResponse {
  logs: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const isSuperAdmin = session?.user?.role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchActivityLogs();
    }
  }, [search, actionTypeFilter, targetTypeFilter, adminFilter, startDate, endDate, pagination.page]);

  const fetchActivityLogs = async () => {
    if (!isSuperAdmin) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(actionTypeFilter !== 'all' && { actionType: actionTypeFilter }),
        ...(targetTypeFilter !== 'all' && { targetType: targetTypeFilter }),
        ...(adminFilter !== 'all' && { adminId: adminFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await fetch(`/api/admin/activity?${params}`);
      if (response.ok) {
        const data: ActivityResponse = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'restore': return 'bg-yellow-100 text-yellow-800';
      case 'block': return 'bg-red-100 text-red-800';
      case 'unblock': return 'bg-green-100 text-green-800';
      case 'role_change': return 'bg-purple-100 text-purple-800';
      case 'system_setting': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType) {
      case 'user': return <User className="h-4 w-4" />;
      case 'project': return <Settings className="h-4 w-4" />;
      case 'comment': return <Activity className="h-4 w-4" />;
      case 'report': return <AlertTriangle className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only Super Admins can view activity logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity & Audit Logs</h1>
        <p className="text-gray-600 mt-2">
          Complete audit trail of all admin and super admin actions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="restore">Restore</SelectItem>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="unblock">Unblock</SelectItem>
                <SelectItem value="role_change">Role Change</SelectItem>
                <SelectItem value="system_setting">System Setting</SelectItem>
              </SelectContent>
            </Select>
            <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Target Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="comment">Comment</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {/* This would be populated with actual admin IDs in a real implementation */}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs ({pagination.total})</CardTitle>
          <CardDescription>
            Showing {logs.length} of {pagination.total} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log._id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full mt-1">
                      {getTargetTypeIcon(log.targetType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{log.action}</h3>
                        <Badge className={getActionTypeColor(log.actionType)}>
                          {log.actionType.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.targetType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{log.adminName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        {log.targetName && (
                          <div className="flex items-center space-x-1">
                            <Settings className="h-3 w-3" />
                            <span>Target: {log.targetName}</span>
                          </div>
                        )}
                      </div>
                      {log.ipAddress && (
                        <div className="text-xs text-gray-400 mt-1">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
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
