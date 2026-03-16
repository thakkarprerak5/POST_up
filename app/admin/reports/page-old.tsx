"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  User,
  FileText,
  MessageSquare,
  Users,
  Clock,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  UserMinus,
  Flag,
  MoreHorizontal,
  Info,
  Search,
  ChevronDown,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReportDetailDrawer } from "@/components/admin/ReportDetailDrawer";

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
  status: 'pending' | 'under_review' | 'resolved' | 'rejected' | 'escalated';
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

  useEffect(() => {
    // Fetch reports data only
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

    // Try to get current user info separately (non-blocking)
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

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'escalated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'user': return <User className="h-4 w-4" />;
      case 'project': return <FileText className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'spam': return 'Spam';
      case 'inappropriate_content': return 'Inappropriate Content';
      case 'harassment': return 'Harassment';
      case 'copyright_violation': return 'Copyright Violation';
      case 'fake_account': return 'Fake Account';
      case 'other': return 'Other';
      default: return reason;
    }
  };

  const handleAction = async (reportId: string, action: string, resolutionNotes?: string) => {
    setActionLoading(reportId);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, resolutionNotes }),
      });

      if (response.ok) {
        // Update the report in local state
        setReports(prev => prev.map(report =>
          report._id === reportId
            ? { ...report, status: action === 'resolve' ? 'resolved' : action === 'reject' ? 'rejected' : 'under_review' }
            : report
        ));

        // Close drawer if action was successful
        if (['resolve', 'reject'].includes(action)) {
          setIsDrawerOpen(false);
          setSelectedReport(null);
        }
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openReportDrawer = (report: Report) => {
    setSelectedReport(report);
    setIsDrawerOpen(true);
  };

  const canPerformAction = (action: string) => {
    if (!currentUser) return false;

    const isAdmin = currentUser.type === 'admin';
    const isSuperAdmin = currentUser.type === 'super-admin';

    switch (action) {
      case 'deleteContent':
      case 'banUser':
        return isSuperAdmin;
      case 'escalate':
        return isSuperAdmin;
      default:
        return isAdmin || isSuperAdmin;
    }
  };

  const getActionTooltip = (action: string) => {
    if (!currentUser) return '';

    const isAdmin = currentUser.type === 'admin';
    const isSuperAdmin = currentUser.type === 'super-admin';

    switch (action) {
      case 'deleteContent':
      case 'banUser':
        return !isSuperAdmin ? 'Super Admin only' : '';
      case 'escalate':
        return !isSuperAdmin ? 'Super Admin only' : '';
      default:
        return '';
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
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

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Filter Section */}
          <Card className="mb-6 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-[1px]">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                    <option value="escalated">Escalated</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                </div>

                {/* Target Type Filter */}
                <div className="relative">
                  <select
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="all">All Types</option>
                    <option value="user">User</option>
                    <option value="project">Project</option>
                    <option value="comment">Comment</option>
                    <option value="chat">Chat</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                </div>

                {/* Priority Filter */}
                <div className="relative">
                  <select
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="all">All Priority</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priority">Priority</option>
                  </select>
                  <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No reports found</h3>
                  <p className="text-slate-500">All clear! No reports to review at this time.</p>
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card
                  key={report._id}
                  className="hover:shadow-md transition-all duration-200 hover:-translate-y-[1px] rounded-xl border border-slate-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Priority Accent Bar */}
                      <div className={`w-1 rounded-full ${getPriorityColor(report.priority)} min-h-[100px]`}></div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            {/* Reporter and Target */}
                            <div className="flex items-center gap-6 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">Reporter:</span>
                                <span className="font-medium text-slate-900">{report.reporterName}</span>
                                <span className="text-xs text-slate-400">({report.reporterEmail})</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">Target:</span>
                                <div className="flex items-center gap-2">
                                  {getTargetIcon(report.targetType)}
                                  <span className="font-medium text-slate-900 capitalize">
                                    {report.targetType}
                                  </span>
                                  {report.targetDetails?.title && (
                                    <>
                                      <ChevronRight className="h-3 w-3 text-slate-400" />
                                      <span className="text-slate-700">
                                        {report.targetDetails.title}
                                      </span>
                                    </>
                                  )}
                                  {report.targetDetails?.groupName && (
                                    <>
                                      <ChevronRight className="h-3 w-3 text-slate-400" />
                                      <span className="text-slate-700">
                                        {report.targetDetails.groupName}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reason and Description */}
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-slate-500">Reason:</span>
                                <Badge variant="outline" className="text-xs">
                                  {getReasonLabel(report.reason)}
                                </Badge>
                              </div>
                              {report.description && (
                                <p className="text-sm text-slate-600 line-clamp-2">
                                  {report.description}
                                </p>
                              )}
                            </div>

                            {/* Status and Time */}
                            <div className="flex items-center gap-4">
                              <Badge className={getStatusColor(report.status)}>
                                {report.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                {getRelativeTime(report.createdAt)}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-4">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(report._id, 'review')}
                                  disabled={actionLoading === report._id || report.status !== 'pending'}
                                  className="h-8 px-3"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Review Report</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(report._id, 'resolve')}
                                  disabled={actionLoading === report._id || !['pending', 'under_review'].includes(report.status)}
                                  className="h-8 px-3 text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Resolve Report</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(report._id, 'reject')}
                                  disabled={actionLoading === report._id || !['pending', 'under_review'].includes(report.status)}
                                  className="h-8 px-3 text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reject Report</p>
                              </TooltipContent>
                            </Tooltip>

                            {currentUser?.type === 'super-admin' && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-3 text-orange-600 hover:text-orange-700"
                                    >
                                      <AlertCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Escalate Report</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-3 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete Content</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-3 text-red-600 hover:text-red-700"
                                    >
                                      <UserMinus className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ban User</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openReportDrawer(report)}
                                  className="h-8 px-3"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

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
      </div>
    </TooltipProvider>
  );
}
