'use client';

import React, { useState, useEffect } from 'react';
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
      case 'user': return <User className="h-4 w-4" />;
      case 'project': return <FileText className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report Management</h1>
            <p className="text-gray-600">
              {userRole === 'super_admin' ? 'Super Admin' : 'Admin'} Dashboard
            </p>
          </div>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">By Status</h3>
            <div className="space-y-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="capitalize text-sm">{status}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">By Priority</h3>
            <div className="space-y-2">
              {Object.entries(stats.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center">
                  <span className="capitalize text-sm">{priority}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">By Type</h3>
            <div className="space-y-2">
              {Object.entries(stats.byTargetType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {getTargetIcon(type)}
                    <span className="capitalize text-sm">{type}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filters.targetType}
            onChange={(e) => setFilters(prev => ({ ...prev, targetType: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="user">User</option>
            <option value="project">Project</option>
            <option value="comment">Comment</option>
            <option value="chat">Chat</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {getTargetIcon(report.targetType)}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.targetDetails?.title || report.targetId}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {report.targetType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 capitalize">
                      {report.reason.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {report.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.reporterName}</div>
                    <div className="text-xs text-gray-500">{report.reporterEmail}</div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {report.status === 'pending' && userRole === 'admin' && (
                        <button
                          onClick={() => handleReview(report._id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Mark as Reviewed"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      {userRole === 'super_admin' && report.status !== 'closed' && (
                        <>
                          <button
                            onClick={() => handleDeleteContent(report._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Content"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter ban reason:');
                              if (reason) handleBanUser(report._id, 'ban', reason);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Ban User"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
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
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setPagination(prev => ({ ...prev, page }))}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Target Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Target Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                {(() => {
                  switch (report.targetType) {
                    case 'user': return <User className="h-5 w-5 text-blue-600" />;
                    case 'project': return <FileText className="h-5 w-5 text-green-600" />;
                    case 'comment': return <MessageSquare className="h-5 w-5 text-purple-600" />;
                    case 'chat': return <MessageSquare className="h-5 w-5 text-orange-600" />;
                    default: return <Flag className="h-5 w-5 text-red-600" />;
                  }
                })()}
                <span className="font-medium capitalize">{report.targetType}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                  {report.priority}
                </span>
              </div>
              <p className="text-sm text-gray-900 font-medium">
                {report.targetDetails?.title || report.targetId}
              </p>
              {report.targetDetails?.description && (
                <p className="text-sm text-gray-600 mt-1">{report.targetDetails.description}</p>
              )}
              {report.targetDetails?.content && (
                <p className="text-sm text-gray-600 mt-1 italic">{report.targetDetails.content}</p>
              )}
            </div>
          </div>

          {/* Report Reason */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Report Reason</h3>
            <div className="bg-red-50 p-4 rounded-lg">
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
            <h3 className="text-sm font-medium text-gray-900 mb-3">Reporter Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{report.reporterName}</p>
              <p className="text-sm text-gray-600">{report.reporterEmail}</p>
              <p className="text-xs text-gray-500 mt-1">
                Reported on {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Status and Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Status & Actions</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                  {report.status.toUpperCase()}
                </span>
                {report.handledBy && (
                  <span className="text-sm text-gray-600">
                    Handled by admin
                  </span>
                )}
                {report.resolvedBy && (
                  <span className="text-sm text-gray-600">
                    Resolved by super admin
                  </span>
                )}
              </div>

              {report.resolutionNotes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Resolution Notes:</p>
                  <p className="text-sm text-gray-600">{report.resolutionNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {report.status === 'pending' && userRole === 'admin' && (
                  <button
                    onClick={() => onReview(report._id)}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Mark as Reviewed
                  </button>
                )}

                {userRole === 'super_admin' && report.status !== 'closed' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onDeleteContent(report._id)}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete Content
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter ban reason:');
                        if (reason) onBanUser(report._id, 'ban', reason);
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Ban User
                    </button>
                  </div>
                )}

                {userRole === 'super_admin' && report.status !== 'closed' && (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add resolution notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <button
                      onClick={handleCloseReport}
                      disabled={loading || !notes.trim()}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      Close Report
                    </button>
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
