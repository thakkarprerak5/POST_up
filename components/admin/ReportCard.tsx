"use client";

import {
  AlertTriangle,
  User,
  FileText,
  MessageSquare,
  Clock,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  UserMinus,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

interface ReportCardProps {
  report: Report;
  currentUser: User | null;
  actionLoading: string | null;
  onAction: (reportId: string, action: string) => void;
  onViewDetails: (report: Report) => void;
}

export function ReportCard({ report, currentUser, actionLoading, onAction, onViewDetails }: ReportCardProps) {
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
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'user': return <User className="h-4 w-4" />;
      case 'project': return <FileText className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4 text-gray-800" />;
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

  return (
    <Card className="
      bg-white 
      border border-gray-200 
      shadow-sm 
      rounded-xl 
      hover:shadow-md 
      transition-all 
      duration-300 
      hover:-translate-y-[1px] 
      p-6
    ">
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          {/* Left Content */}
          <div className="flex-1">
            {/* Header with Status and Priority Indicator */}
            <div className="flex items-center gap-3 mb-3">
              {/* Priority Dot */}
              <div className={`w-2 h-2 rounded-full ${report.priority === 'critical' ? 'bg-red-500' :
                report.priority === 'high' ? 'bg-orange-500' :
                  report.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                }`}></div>

              {/* Status Badge */}
              <Badge className={`${getStatusColor(report.status)} border border-amber-200 rounded-full px-3 py-1 text-xs font-bold`}>
                {report.status}
              </Badge>

              {/* Time */}
              <span className="text-sm text-gray-500">
                {getRelativeTime(report.createdAt)}
              </span>
            </div>

            {/* Reporter and Target Information */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-900 font-semibold">{report.reporterName}</span>
                <span className="text-gray-400">reported</span>
                <div className="flex items-center gap-1">
                  {getTargetIcon(report.targetType)}
                  <span className="text-gray-900 capitalize">{report.targetType}</span>
                </div>
              </div>
              {report.targetDetails?.title && (
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-700">{report.targetDetails.title}</span>
                </div>
              )}
            </div>

            {/* Reason and Description */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-900">Reason:</span>
                <Badge variant="outline" className="text-xs border-2 border-orange-400 text-orange-500">
                  {getReasonLabel(report.reason)}
                </Badge>
              </div>
              {report.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {report.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction(report._id, 'review')}
                  disabled={actionLoading === report._id || report.status !== 'PENDING'}
                  className={`h-8 w-8 p-0 ${report.status === 'RESOLVED' ? 'hidden' : 'text-gray-500 hover:text-blue-600'}`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>

            {report.status === 'RESOLVED' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAction(report._id, 'delete')}
                    disabled={actionLoading === report._id}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Report</p>
                </TooltipContent>
              </Tooltip>
            ) : report.status === 'REJECTED' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAction(report._id, 'delete')}
                    disabled={actionLoading === report._id}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Report</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAction(report._id, 'resolve')}
                      disabled={actionLoading === report._id}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-green-600"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Resolve</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAction(report._id, 'reject')}
                      disabled={actionLoading === report._id}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reject</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {currentUser?.type === 'super-admin' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAction(report._id, 'escalate')}
                      disabled={actionLoading === report._id}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-orange-600"
                    >
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Escalate</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAction(report._id, 'deleteContent')}
                      disabled={actionLoading === report._id}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete Content</p>
                  </TooltipContent>
                </Tooltip>

                {/* Conditionally render Ban User button only if reportedUserId is valid */}
                {report.reportedUserId && report.reportedUserId !== 'unknown' && report.reportedUserId !== 'null' ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction(report._id, 'banUser')}
                        disabled={actionLoading === report._id}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ban User (Soft/Proper)</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-50 text-gray-500 border-gray-300">
                    User Deleted / Anonymous
                  </Badge>
                )}
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(report)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                  disabled={false}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>More Information</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
