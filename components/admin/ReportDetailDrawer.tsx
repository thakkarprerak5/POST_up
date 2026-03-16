"use client";

import React, { useState } from "react";
import {
  X,
  User,
  FileText,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flag,
  Eye,
  MoreHorizontal,
  Calendar,
  Mail,
  Info,
  Trash,
  UserMinus,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    projectStatus?: string;
    parentId?: string; // For comments: ID of the parent project/post
    parentTitle?: string; // For comments: Title of the parent project/post
    mentorInfo?: {
      name: string;
      email: string;
    };
  };
  reason: 'spam' | 'inappropriate_content' | 'harassment' | 'copyright_violation' | 'fake_account' | 'other';
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  handledBy?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ReportDetailDrawerProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    _id: string;
    fullName: string;
    email: string;
    type: 'admin' | 'super-admin' | 'student' | 'mentor';
  };
  onAction: (reportId: string, action: string, resolutionNotes?: string) => void;
  actionLoading: string | null;
}

export default function ReportDetailDrawer({
  report,
  isOpen,
  onClose,
  currentUser,
  onAction,
  actionLoading
}: ReportDetailDrawerProps) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolutionInput, setShowResolutionInput] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);

  if (!report) return null;

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
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'user': return <User className="h-5 w-5" />;
      case 'project': return <FileText className="h-5 w-5" />;
      case 'comment': return <MessageSquare className="h-5 w-5 " />;
      case 'chat': return <MessageSquare className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handleAction = (action: string) => {
    if (['resolve', 'reject'].includes(action) && !resolutionNotes.trim()) {
      setShowResolutionInput(true);
      return;
    }

    onAction(report._id, action, resolutionNotes);
    setShowResolutionInput(false);
    setResolutionNotes('');
  };

  return (
    <TooltipProvider>
      {/* Global style override to force white background */}
      <style jsx global>{`
        .report-drawer-white {
          background-color: white !important;
        }
        .report-drawer-white * {
          background-color: white !important;
        }
        .report-drawer-white > * {
          background-color: white !important;
        }
        .report-drawer-white > * > * {
          background-color: white !important;
        }
        .report-drawer-white > * > * > * {
          background-color: white !important;
        }
        .report-drawer-white > * > * > * > * {
          background-color: white !important;
        }
      `}</style>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ease-out"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out report-drawer-white ${isOpen ? 'translate-x-0' : 'translate-x-full'
        }`} style={{ backgroundColor: 'white !important' }}>
        <div className="h-full flex flex-col bg-white report-drawer-white" style={{ backgroundColor: 'white !important' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-1 h-8 rounded-full ${getPriorityColor(report.priority)}`}></div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
                <p className="text-sm text-gray-500">ID: {report._id}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white report-drawer-white" style={{ backgroundColor: 'white !important' }}>
            <div className="report-drawer-white" style={{ backgroundColor: 'white !important' }}>
              {/* Report Info */}
              <Card className="bg-white border border-gray-200 shadow-sm rounded-xl" style={{ backgroundColor: 'white !important' }}>
                <CardHeader className="pb-4" style={{ backgroundColor: 'white !important' }}>
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Flag className="h-5 w-5 text-gray-600" />
                    Report Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" style={{ backgroundColor: 'white !important' }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Status</span>
                      <div className="mt-1">
                        <Badge className={getStatusColor(report.status)}>
                          {report.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Priority</span>
                      <div className="mt-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(report.priority)}`}></div>
                          <span className="font-semibold text-gray-900 capitalize">{report.priority}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Reason</span>
                      <div className="mt-1">
                        <Badge variant="outline" className="border-2 border-orange-400 text-orange-500">{getReasonLabel(report.reason)}</Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Created</span>
                      <div className="mt-1">
                        <div className="flex items-center gap-1 text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-600" />
                          {formatDate(report.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {report.description && (
                    <div>
                      <span className="text-sm text-gray-600">Description</span>
                      <div className="mt-1 p-3 bg-white rounded-lg text-gray-900">
                        {report.description}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reporter Info */}
              <Card className="mt-4 bg-white border border-gray-200 shadow-sm rounded-xl" style={{ backgroundColor: 'white !important' }}>
                <CardHeader className="pb-4" style={{ backgroundColor: 'white !important' }}>
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    Reporter Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" style={{ backgroundColor: 'white !important' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{report.reporterName}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {report.reporterEmail}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Target Preview */}
              <Card className="bg-white mt-4 border border-gray-200 shadow-sm rounded-xl" style={{ backgroundColor: 'white !important' }}>
                <CardHeader className="pb-4" style={{ backgroundColor: 'white !important' }}>
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {getTargetIcon(report.targetType)}
                    Target Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" style={{ backgroundColor: 'white !important' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Type:</span>
                    <Badge variant="outline" className="capitalize border-2 border-orange-400 text-orange-500">
                      {report.targetType}
                    </Badge>
                    {report.targetDetails?.projectType && (
                      <Badge variant="outline" className="capitalize border-gray-300">
                        {report.targetDetails.projectType}
                      </Badge>
                    )}
                  </div>

                  {/* View Original Content Button */}
                  <div className="pt-2 pb-2">
                    <a
                      href={(() => {
                        // Helper function to generate content link
                        const getContentLink = (report: Report): string => {
                          switch (report.targetType.toLowerCase()) {
                            case 'project':
                              return `/projects/${report.targetId}`;
                            case 'post':
                              return `/posts/${report.targetId}`;
                            case 'comment':
                              // Deep link to parent with comment anchor
                              if (report.targetDetails?.parentId) {
                                return `/projects/${report.targetDetails.parentId}#comment-${report.targetId}`;
                              }
                              // Fallback if no parentId
                              return `/projects/${report.targetId}`;
                            case 'user':
                              return `/profile/${report.targetId}`;
                            case 'chat':
                              return `/messages?chatId=${report.targetId}`;
                            default:
                              return '#';
                          }
                        };
                        return getContentLink(report);
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-gray-600 font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Original Content
                    </a>
                  </div>

                  {/* Context for Comments */}
                  {report.targetType === 'comment' && report.targetDetails?.parentTitle && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-sm text-blue-900 font-medium">Comment Context:</span>
                          <div className="text-sm text-blue-700 mt-1">
                            Commented on Project: <span className="font-semibold">{report.targetDetails.parentTitle}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {report.targetDetails?.title && (
                    <div>
                      <span className="text-sm text-gray-400">Title:</span>
                      <div className="mt-1 font-semibold text-gray-900">
                        {report.targetDetails.title}
                      </div>
                    </div>
                  )}

                  {report.targetDetails?.groupName && (
                    <div>
                      <span className="text-sm text-gray-400">Group Name:</span>
                      <div className="mt-1 font-semibold text-gray-900">
                        {report.targetDetails.groupName}
                      </div>
                    </div>
                  )}

                  {report.targetDetails?.authorName && (
                    <div>
                      <span className="text-sm text-gray-400">Author:</span>
                      <div className="mt-1 font-semibold text-gray-900">
                        {report.targetDetails.authorName}
                      </div>
                    </div>
                  )}

                  {report.targetDetails?.content && (
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Content Preview:</span>
                      <div className="mt-2 p-4 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                          {isContentExpanded
                            ? report.targetDetails.content
                            : report.targetDetails.content?.substring(0, 300)}
                          {!isContentExpanded && report.targetDetails.content?.length > 300 && '...'}
                        </div>
                        {report.targetDetails.content?.length > 300 && (
                          <button
                            onClick={() => setIsContentExpanded(!isContentExpanded)}
                            className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 transition-colors"
                          >
                            {isContentExpanded ? (
                              <>
                                <span>Show Less</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </>
                            ) : (
                              <>
                                <span>Read More</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {report.targetDetails?.members && report.targetDetails.members.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-400">Group Members:</span>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {report.targetDetails.members.map((member, index) => (
                          <Badge key={index} variant="outline" className="border-gray-300 text-gray-700">
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mentor Info for Active Projects */}
                  {report.targetDetails?.mentorInfo && report.targetDetails?.projectStatus === 'ACTIVE' && (
                    <div>
                      <span className="text-sm text-gray-400">Assigned Mentor:</span>
                      <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                        <div className="font-semibold text-blue-900">{report.targetDetails.mentorInfo.name}</div>
                        <div className="text-sm text-blue-700">{report.targetDetails.mentorInfo.email}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* History Timeline */}
              <Card className="mt-4 bg-white border border-gray-200 shadow-sm rounded-xl" style={{ backgroundColor: 'white !important' }}>
                <CardHeader className="pb-4" style={{ backgroundColor: 'white !important' }}>
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    History Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" style={{ backgroundColor: 'white !important' }}>
                  <div className="space-y-3">
                    {/* Created */}
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Report Created</div>
                        <div className="text-sm text-gray-500">{formatDate(report.createdAt)}</div>
                      </div>
                    </div>

                    {/* Updated */}
                    {report.updatedAt && report.updatedAt !== report.createdAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Report Updated</div>
                          <div className="text-sm text-gray-500">{formatDate(report.updatedAt)}</div>
                        </div>
                      </div>
                    )}

                    {/* Assigned */}
                    {report.assignedTo && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Assigned to Admin</div>
                          <div className="text-sm text-gray-500">Report assigned for review</div>
                        </div>
                      </div>
                    )}

                    {/* Resolved */}
                    {report.resolvedAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Report {report.status}</div>
                          <div className="text-sm text-gray-500">{formatDate(report.resolvedAt)}</div>
                          {report.resolutionNotes && (
                            <div className="mt-1 p-2 bg-green-50 rounded text-sm text-green-800">
                              {report.resolutionNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-6 bg-white" style={{ backgroundColor: 'white !important' }}>
              <div className="space-y-4">
                {showResolutionInput && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <label className="block text-sm font-semibold text-amber-900 mb-2">
                      Resolution Notes (Required)
                    </label>
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Please provide notes for this resolution..."
                      className="w-full bg-white border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => setShowResolutionInput(false)}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction('resolve')}
                        disabled={!resolutionNotes.trim() || actionLoading === report._id}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {actionLoading === report._id ? 'Processing...' : 'Submit'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Admin Actions */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('review')}
                        disabled={actionLoading === report._id || report.status !== 'PENDING'}
                        className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mark as under review</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('resolve')}
                        disabled={actionLoading === report._id}
                        className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolve
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Resolve report</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('reject')}
                        disabled={actionLoading === report._id || report.status !== 'PENDING'}
                        className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reject report</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Super Admin Actions */}
                  {currentUser.type === 'super-admin' && (
                    <>
                      <Separator orientation="vertical" className="h-6 border-gray-300" />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction('escalate')}
                            disabled={actionLoading === report._id}
                            className="flex items-center gap-2 border-orange-600 text-orange-600 hover:bg-orange-50"
                          >
                            <AlertCircle className="h-4 w-4" />
                            Escalate
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Escalate to super admin</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction('deleteContent')}
                            disabled={actionLoading === report._id}
                            className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4" />
                            Delete Content
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete reported content</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction('banUser')}
                            disabled={actionLoading === report._id}
                            className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <UserMinus className="h-4 w-4" />
                            Ban User
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ban reported user</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>

                {currentUser.type === 'super-admin' && (
                  <div className="mt-2">
                    <Badge className="bg-red-900 text-red-800 border-red-200 rounded-full px-3 py-1 text-xs font-bold">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Super Admin Actions Available
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
