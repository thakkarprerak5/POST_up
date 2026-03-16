"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReportDetailDrawer from "@/components/admin/ReportDetailDrawer";
import { ReportCard } from "@/components/admin/ReportCard";
import { FilterBar } from "@/components/admin/FilterBar";
import { DeleteContentModal } from "@/components/admin/DeleteContentModal";
import { BanUserModal } from "@/components/admin/BanUserModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
    groupName?: string;
    members?: string[];
    projectType?: string;
  };
  reason: 'spam' | 'inappropriate_content' | 'harassment' | 'copyright_violation' | 'fake_account' | 'other';
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  action_taken?: 'NONE' | 'SOFT_BAN' | 'PROPER_BAN' | 'CONTENT_DELETED';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  handledBy?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  type: 'admin' | 'super-admin' | 'student' | 'mentor';
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [currentActionReport, setCurrentActionReport] = useState<Report | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    // Fetch reports data
    fetch("/api/admin/reports").then(async (res) => {
      if (!res.ok) {
        console.warn('Reports fetch failed:', res.status);
        return [];
      }
      try {
        return await res.json();
      } catch (error) {
        console.warn('Reports JSON parse failed:', error);
        return [];
      }
    }).catch((error) => {
      console.warn('Reports fetch error:', error);
      return [];
    }).then((reportsData) => {
      setReports(reportsData);
      setLoading(false);
    });

    // Get current user info
    fetch('/api/auth/session').then(async (res) => {
      if (res.ok) {
        try {
          const sessionData = await res.json();
          if (sessionData?.user) {
            setCurrentUser(sessionData.user);
          }
        } catch (error) {
          console.warn('Session JSON parse failed:', error);
        }
      }
    }).catch((error) => {
      console.warn('Session fetch error:', error);
    });
  }, []);

  const handleAction = async (reportId: string, action: string) => {
    const report = reports.find(r => r._id === reportId);
    if (!report) return;

    // Handle modal-based actions
    if (action === 'deleteContent') {
      setCurrentActionReport(report);
      setDeleteModalOpen(true);
      return;
    }

    if (action === 'banUser') {
      setCurrentActionReport(report);
      setBanModalOpen(true);
      return;
    }

    // Handle report deletion
    if (action === 'delete') {
      if (!window.confirm('Are you sure you want to delete this report? This cannot be undone.')) {
        return;
      }

      setActionLoading(reportId);
      try {
        const response = await fetch(`/api/admin/reports/${reportId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Delete failed');
        }

        // Remove from local state
        setReports(reports.filter(r => r._id !== reportId));
        toast.success('Report deleted successfully');
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error.message || 'Failed to delete report');
      } finally {
        setActionLoading(null);
      }
      return;
    }

    // Handle direct actions (resolve, reject)
    setActionLoading(reportId);

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Action failed');
      }

      const result = await response.json();

      // Update local state
      setReports(reports.map(r =>
        r._id === reportId
          ? { ...r, status: result.report.status, updatedAt: new Date() }
          : r
      ));

      toast.success(result.message || `Report ${action}d successfully`);
    } catch (error: any) {
      console.error('Action failed:', error);
      toast.error(error.message || 'Failed to perform action');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteContent = async () => {
    if (!currentActionReport) return;

    setActionLoading(currentActionReport._id);

    try {
      const response = await fetch(`/api/admin/reports/${currentActionReport._id}/delete-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      const result = await response.json();

      // Update local state
      setReports(reports.map(r =>
        r._id === currentActionReport._id
          ? { ...r, action_taken: 'CONTENT_DELETED', updatedAt: new Date() }
          : r
      ));

      toast.success('Content permanently deleted');
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error(error.message || 'Failed to delete content');
    } finally {
      setActionLoading(null);
      setCurrentActionReport(null);
    }
  };

  const handleBanUser = async (banType: 'SOFT_BAN' | 'PROPER_BAN', reason: string) => {
    if (!currentActionReport) return;

    setActionLoading(currentActionReport._id);

    try {
      const response = await fetch(`/api/admin/reports/${currentActionReport._id}/ban-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banType, reason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ban failed');
      }

      const result = await response.json();

      // Update local state
      setReports(reports.map(r =>
        r._id === currentActionReport._id
          ? { ...r, action_taken: banType, updatedAt: new Date() }
          : r
      ));

      toast.success(result.message || `User ${banType === 'SOFT_BAN' ? 'soft banned' : 'proper banned'} successfully`);
    } catch (error: any) {
      console.error('Ban failed:', error);
      toast.error(error.message || 'Failed to ban user');
    } finally {
      setActionLoading(null);
      setCurrentActionReport(null);
    }
  };

  const openReportDrawer = (report: Report) => {
    setSelectedReport(report);
    setIsDrawerOpen(true);
  };

  // Filter and sort reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporterName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.targetType === typeFilter;
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      default:
        return 0;
    }
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-1">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="text-gray-500 mt-1">Manage user-reported content efficiently</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-4 py-2 rounded-lg font-medium border border-blue-200">
                  Total: {reports.length}
                </div>
                {currentUser?.type === 'super-admin' && (
                  <Badge className="bg-red-100 text-red-800 border-red-200 px-3 py-1">
                    SUPER
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {currentUser && currentUser.type !== 'super-admin' ? (
            <Card className="bg-white border-2 border-red-200 shadow-lg rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <CardContent className="flex flex-col items-center justify-center py-20 px-10 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h3>
                <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
                  The Reports Management system is reserved for Super-Administrators only.
                  Your current account (<strong>{currentUser.type}</strong>) does not have sufficient permissions to view or manage reports.
                </p>
                <Button
                  onClick={() => window.location.href = '/admin'}
                  className="bg-gray-900 hover:bg-black text-white px-8 py-6 rounded-xl font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filter Bar */}
              <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
              />

              {/* Reports List */}
              <div className="space-y-4 mt-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading reports...</p>
                  </div>
                ) : sortedReports.length === 0 ? (
                  <Card className="bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-all duration-300 hover:-translate-y-[1px]">
                    <CardContent className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
                      <p className="text-gray-500">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all'
                          ? 'No reports match your current filters.'
                          : 'All clear! No reports to review at this time.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  sortedReports.map((report) => (
                    <ReportCard
                      key={report._id}
                      report={report}
                      currentUser={currentUser}
                      actionLoading={actionLoading}
                      onAction={handleAction}
                      onViewDetails={openReportDrawer}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Report Detail Drawer */}
        <ReportDetailDrawer
          report={selectedReport}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedReport(null);
          }}
          currentUser={currentUser || { _id: '', fullName: '', email: '', type: 'admin' }}
          onAction={handleAction}
          actionLoading={actionLoading}
        />

        {/* Delete Content Modal */}
        <DeleteContentModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setCurrentActionReport(null);
          }}
          onConfirm={handleDeleteContent}
          contentType={currentActionReport?.targetType || ''}
          contentTitle={currentActionReport?.targetDetails?.title}
        />

        {/* Ban User Modal */}
        <BanUserModal
          isOpen={banModalOpen}
          onClose={() => {
            setBanModalOpen(false);
            setCurrentActionReport(null);
          }}
          onConfirm={handleBanUser}
          userName={currentActionReport?.targetDetails?.authorName}
        />
      </div>
    </TooltipProvider>
  );
}
