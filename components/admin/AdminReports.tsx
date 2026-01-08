'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Flag, 
  Clock,
  User,
  MessageSquare,
  FileText,
  Trash2,
  Ban,
  AlertTriangle,
  Filter,
  Search,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface Report {
  _id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reportedUserId: string;
  targetType: 'user' | 'project' | 'comment' | 'chat';
  targetId: string;
  targetDetails: {
    title?: string;
    description?: string;
    authorName?: string;
    content?: string;
  };
  reason: 'spam' | 'inappropriate_content' | 'harassment' | 'copyright_violation' | 'fake_account' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  handledBy?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportStats {
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byTargetType: Record<string, number>;
}

interface AdminReportsProps {
  userRole: 'admin' | 'super_admin';
}

const AdminReports: React.FC<AdminReportsProps> = ({ userRole }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    targetType: '',
    priority: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.targetType) params.append('targetType', filters.targetType);
      if (filters.priority) params.append('priority', filters.priority);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const data = await response.json();
      setReports(data.reports);
      setStats(data.stats);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters, pagination.page]);

  const handleReview = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        fetchReports();
        setSelectedReport(null);
      }
    } catch (err) {
      setError('Failed to review report');
    }
  };

  const handleClose = async (reportId: string, notes: string) => {
    if (userRole !== 'super_admin') {
      setError('Only Super Admins can close reports');
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'closed',
          resolutionNotes: notes 
        })
      });
      
      if (response.ok) {
        fetchReports();
        setSelectedReport(null);
      }
    } catch (err) {
      setError('Failed to close report');
    }
  };

  const handleDeleteContent = async (reportId: string) => {
    if (userRole !== 'super_admin') {
      setError('Only Super Admins can delete content');
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports/${reportId}/super-admin`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchReports();
        setSelectedReport(null);
      }
    } catch (err) {
      setError('Failed to delete content');
    }
  };

  const handleBanUser = async (reportId: string, action: 'ban' | 'suspend', reason: string) => {
    if (userRole !== 'super_admin') {
      setError('Only Super Admins can ban users');
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports/${reportId}/super-admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          banReason: reason 
        })
      });
      
      if (response.ok) {
        fetchReports();
        setSelectedReport(null);
      }
    } catch (err) {
      setError('Failed to ban user');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'user': return <User className="h-4 w-4 text-black" />;
      case 'project': return <FileText className="h-4 w-4 text-black" />;
      case 'comment': return <MessageSquare className="h-4 w-4 text-black" />;
      case 'chat': return <MessageSquare className="h-4 w-4 text-black" />;
      default: return <Flag className="h-4 w-4 text-black" />;
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white text-gray-900 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Report Management</h1>
        <p className="text-black mt-2">
          {userRole === 'super_admin' ? 'Super Admin' : 'Admin'} Dashboard
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border border-black rounded-xl">
            <CardHeader>
              <CardTitle className="text-black">By Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="capitalize text-sm text-black">{status}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-black rounded-xl">
            <CardHeader>
              <CardTitle className="text-black">By Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byPriority).map(([priority, count]) => (
                  <div key={priority} className="flex justify-between items-center">
                    <span className="capitalize text-sm text-black">{priority}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-black rounded-xl">
            <CardHeader>
              <CardTitle className="text-black">By Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byTargetType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {getTargetIcon(type)}
                      <span className="capitalize text-sm text-black">{type}</span>
                    </div>
                    <span className="text-sm font-medium text-black">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white border border-black rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Filters</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-black">Filters:</span>
            </div>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all_status' ? '' : value }))}>
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
                  value="all_status"
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
                  value="pending"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  Pending
                </SelectItem>
                <SelectItem
                  value="reviewed"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  Reviewed
                </SelectItem>
                <SelectItem
                  value="closed"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  Closed
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.targetType} onValueChange={(value) => setFilters(prev => ({ ...prev, targetType: value === 'all_types' ? '' : value }))}>
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
                  value="all_types"
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
                  value="user"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  User
                </SelectItem>
                <SelectItem
                  value="project"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  Project
                </SelectItem>
                <SelectItem
                  value="comment"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  Comment
                </SelectItem>
                <SelectItem
                  value="chat"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  Chat
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value === 'all_priorities' ? '' : value }))}>
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
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black border border-black shadow-lg">
                <SelectItem
                  value="all_priorities"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  All Priorities
                </SelectItem>
                <SelectItem
                  value="low"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  Low
                </SelectItem>
                <SelectItem
                  value="medium"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  Medium
                </SelectItem>
                <SelectItem
                  value="high"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  High
                </SelectItem>
                <SelectItem
                  value="critical"
                  className="
                    cursor-pointer
                    hover:bg-blue-100
                    focus:bg-blue-100
                    data-[state=checked]:bg-blue-600
                    data-[state=checked]:text-white
                    data-[state=checked]:hover:bg-blue-600
                  "
                >
                  Critical
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                <Input
                  placeholder="Search reports..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Reports Table */}
      <Card className="bg-white border border-black rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Reports ({pagination.total})</CardTitle>
          <CardDescription className="text-black/70">
            Showing {reports.length} of {pagination.total} reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-black">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 border border-black rounded-full flex items-center justify-center">
                          {getTargetIcon(report.targetType)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-black">
                            {report.targetDetails?.title || report.targetId}
                          </div>
                          <div className="text-xs text-black/70 capitalize">
                            {report.targetType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-black capitalize">
                        {report.reason.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-black/70 truncate max-w-xs">
                        {report.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">{report.reporterName}</div>
                      <div className="text-xs text-black/70">{report.reporterEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black/70">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                          className="
                            text-blue-600 border-blue-600 border
                            bg-white
                            hover:text-white
                            hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600
                            hover:border-blue-600
                          "
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {report.status === 'pending' && userRole === 'admin' && (
                          <Button
                            size="sm"
                            onClick={() => handleReview(report._id)}
                            className="
                              text-yellow-600 border-yellow-600 border
                              bg-white
                              hover:text-white
                              hover:bg-gradient-to-r hover:from-yellow-400 hover:to-yellow-600
                              hover:border-yellow-600
                            "
                            title="Mark as Reviewed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {userRole === 'super_admin' && report.status !== 'closed' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleDeleteContent(report._id)}
                              className="
                                text-red-600 border-red-600 border
                                bg-white
                                hover:text-white
                                hover:bg-gradient-to-r hover:from-red-400 hover:to-red-600
                                hover:border-red-600
                              "
                              title="Delete Content"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                const reason = prompt('Enter ban reason:');
                                if (reason) handleBanUser(report._id, 'ban', reason);
                              }}
                              className="
                                text-red-600 border-red-600 border
                                bg-white
                                hover:text-white
                                hover:bg-gradient-to-r hover:from-red-400 hover:to-red-600
                                hover:border-red-600
                              "
                              title="Ban User"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-gray-100 px-6 py-3 flex items-center justify-between border-t border-black">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="text-black border-black hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="text-black border-black hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-black/70">
                    Showing <span className="font-medium text-black">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium text-black">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                    <span className="font-medium text-black">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className={`
                          relative inline-flex items-center px-4 py-2 border text-sm font-medium
                          ${
                            page === pagination.page
                              ? 'z-10 bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-black text-black hover:bg-blue-100'
                          }
                        `}
                      >
                        {page}
                      </Button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          userRole={userRole}
          onClose={() => setSelectedReport(null)}
          onReview={handleReview}
          onCloseReport={handleClose}
          onDeleteContent={handleDeleteContent}
          onBanUser={handleBanUser}
        />
      )}
    </div>
  );
};

interface ReportDetailModalProps {
  report: Report;
  userRole: 'admin' | 'super_admin';
  onClose: () => void;
  onReview: (reportId: string) => void;
  onCloseReport: (reportId: string, notes: string) => void;
  onDeleteContent: (reportId: string) => void;
  onBanUser: (reportId: string, action: 'ban' | 'suspend', reason: string) => void;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  userRole,
  onClose,
  onReview,
  onCloseReport,
  onDeleteContent,
  onBanUser
}) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCloseReport = () => {
    if (!notes.trim()) {
      alert('Please provide resolution notes');
      return;
    }
    setLoading(true);
    onCloseReport(report._id, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-black">
        <div className="p-6 border-b border-black">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black">Report Details</h2>
            <Button
              onClick={onClose}
              className="text-black border-black bg-white hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600"
            >
              <XCircle className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Target Information */}
          <div>
            <h3 className="text-sm font-medium text-black mb-3">Target Information</h3>
            <div className="bg-gray-100 p-4 rounded-lg border border-black">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 border border-black rounded-full flex items-center justify-center">
                  {(() => {
                    switch (report.targetType) {
                      case 'user': return <User className="h-5 w-5 text-blue-600" />;
                      case 'project': return <FileText className="h-5 w-5 text-green-600" />;
                      case 'comment': return <MessageSquare className="h-5 w-5 text-purple-600" />;
                      case 'chat': return <MessageSquare className="h-5 w-5 text-orange-600" />;
                      default: return <Flag className="h-5 w-5 text-red-600" />;
                    }
                  })()}
                </div>
                <span className="font-medium capitalize text-black">{report.targetType}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                  {report.priority}
                </span>
              </div>
              <p className="text-sm text-black font-medium">
                {report.targetDetails?.title || report.targetId}
              </p>
              {report.targetDetails?.description && (
                <p className="text-sm text-black/70 mt-1">{report.targetDetails.description}</p>
              )}
              {report.targetDetails?.content && (
                <p className="text-sm text-black/70 mt-1 italic">{report.targetDetails.content}</p>
              )}
            </div>
          </div>

          {/* Report Reason */}
          <div>
            <h3 className="text-sm font-medium text-black mb-3">Report Reason</h3>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium capitalize text-red-900">
                  {report.reason.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-red-800">{report.description}</p>
            </div>
          </div>

          {/* Reporter Information */}
          <div>
            <h3 className="text-sm font-medium text-black mb-3">Reporter Information</h3>
            <div className="bg-gray-100 p-4 rounded-lg border border-black">
              <p className="text-sm font-medium text-black">{report.reporterName}</p>
              <p className="text-sm text-black/70">{report.reporterEmail}</p>
              <p className="text-xs text-black/70 mt-1">
                Reported on {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Status and Actions */}
          <div>
            <h3 className="text-sm font-medium text-black mb-3">Status & Actions</h3>
            <div className="bg-gray-100 p-4 rounded-lg border border-black">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                  {report.status.toUpperCase()}
                </span>
                {report.handledBy && (
                  <span className="text-sm text-black/70">
                    Handled by admin
                  </span>
                )}
                {report.resolvedBy && (
                  <span className="text-sm text-black/70">
                    Resolved by super admin
                  </span>
                )}
              </div>

              {report.resolutionNotes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-black mb-1">Resolution Notes:</p>
                  <p className="text-sm text-black/70">{report.resolutionNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {report.status === 'pending' && userRole === 'admin' && (
                  <Button
                    onClick={() => onReview(report._id)}
                    disabled={loading}
                    className="w-full bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Mark as Reviewed
                  </Button>
                )}

                {userRole === 'super_admin' && report.status !== 'closed' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => onDeleteContent(report._id)}
                      disabled={loading}
                      className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete Content
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt('Enter ban reason:');
                        if (reason) onBanUser(report._id, 'ban', reason);
                      }}
                      disabled={loading}
                      className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Ban User
                    </Button>
                  </div>
                )}

                {userRole === 'super_admin' && report.status !== 'closed' && (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add resolution notes..."
                      className="
                        w-full px-3 py-2 border border-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                        !bg-white text-black
                        hover:!bg-white
                        focus:!bg-white
                      "
                      rows={3}
                    />
                    <Button
                      onClick={handleCloseReport}
                      disabled={loading || !notes.trim()}
                      className="w-full bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                      Close Report
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions (moved outside to avoid re-creation)
function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'reviewed': return 'bg-blue-100 text-blue-800';
    case 'closed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default AdminReports;
