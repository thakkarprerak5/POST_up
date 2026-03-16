'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    User,
    Users,
    Clock,
    AlertTriangle,
    CheckCircle,
    Flag,
    X,
    RotateCcw,
    FileText,
    History
} from 'lucide-react';

interface RemovedStudentAssignment {
    _id: string;
    assignedToType: 'student' | 'group';
    studentId?: {
        _id: string;
        fullName: string;
        email: string;
        photo?: string;
    };
    groupId?: {
        _id: string;
        name: string;
        description?: string;
    };
    projectId?: {
        _id: string;
        title: string;
        description?: string;
    };
    mentorId: {
        _id: string;
        fullName: string;
        email: string;
        photo?: string;
    };
    removalReason: 'project_completed' | 'report_issue' | 'other';
    removalDetails?: string;
    removedBy: {
        _id: string;
        fullName: string;
        email: string;
    };
    removedAt: string;
    reportId?: {
        _id: string;
        title: string;
        status: string;
    };
}

interface RemovedStudentCardProps {
    assignment: RemovedStudentAssignment;
    onReassign: (assignmentId: string) => void;
    onViewReport?: (reportId: string) => void;
    onViewHistory?: (assignmentId: string) => void;
}

export function RemovedStudentCard({
    assignment,
    onReassign,
    onViewReport,
    onViewHistory
}: RemovedStudentCardProps) {
    const isStudent = assignment.assignedToType === 'student';
    const targetName = isStudent
        ? assignment.studentId?.fullName ?? 'Unknown Student'
        : assignment.groupId?.name ?? 'Unknown Group';
    const targetEmail = isStudent ? assignment.studentId?.email : undefined;
    const targetPhoto = isStudent ? assignment.studentId?.photo : undefined;

    const getReasonConfig = () => {
        switch (assignment.removalReason) {
            case 'project_completed':
                return {
                    icon: CheckCircle,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    badgeColor: 'bg-green-100 text-green-800 border-green-300',
                    label: 'Project Completed'
                };
            case 'report_issue':
                return {
                    icon: Flag,
                    color: 'text-amber-600',
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-200',
                    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
                    label: 'Report Issue'
                };
            case 'other':
                return {
                    icon: X,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    badgeColor: 'bg-red-100 text-red-800 border-red-300',
                    label: 'Other Reason'
                };
            default:
                // Fallback for unexpected values
                return {
                    icon: AlertTriangle,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    badgeColor: 'bg-gray-100 text-gray-800 border-gray-300',
                    label: 'Unknown Reason'
                };
        }
    };

    const reasonConfig = getReasonConfig();
    const ReasonIcon = reasonConfig.icon;

    return (
        <Card className={`border-2 ${reasonConfig.borderColor} ${reasonConfig.bgColor} hover:shadow-lg transition-all duration-300`}>
            <CardContent className="p-6 space-y-4">
                {/* Header with Type Badge */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isStudent ? (
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm flex-shrink-0">
                                <AvatarImage
                                    src={targetPhoto && targetPhoto.trim() ? targetPhoto : undefined}
                                    alt={targetName}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                                    {targetName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 truncate">{targetName}</h3>
                            {targetEmail && (
                                <p className="text-sm text-gray-600 truncate">{targetEmail}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                            {isStudent ? (
                                <><User className="h-3 w-3 mr-1" /> Individual</>
                            ) : (
                                <><Users className="h-3 w-3 mr-1" /> Group</>
                            )}
                        </Badge>
                        <Badge variant="outline" className={reasonConfig.badgeColor}>
                            <ReasonIcon className="h-3 w-3 mr-1" />
                            {reasonConfig.label}
                        </Badge>
                    </div>
                </div>

                {/* Project Information */}
                {assignment.projectId && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-500">Project</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {assignment.projectId.title ?? 'Untitled Project'}
                                </p>
                                {assignment.projectId.description && (
                                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                        {assignment.projectId.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Previous Mentor Record */}
                <div className="p-4 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-3">
                        Previous Record
                    </h4>
                    <div className="space-y-3">
                        {/* Previous Mentor */}
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-blue-200 flex-shrink-0">
                                <AvatarImage
                                    src={assignment.mentorId?.photo && assignment.mentorId.photo.trim() ? assignment.mentorId.photo : undefined}
                                    alt={assignment.mentorId?.fullName ?? 'Mentor'}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold">
                                    {(assignment.mentorId?.fullName ?? 'M').charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">Previous Mentor</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {assignment.mentorId?.fullName ?? 'Unknown Mentor'}
                                </p>
                                <p className="text-xs text-gray-600 truncate">
                                    {assignment.mentorId?.email ?? 'No email'}
                                </p>
                            </div>
                        </div>

                        {/* Removal Info */}
                        <div className="pt-3 border-t border-gray-200 space-y-2">
                            <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Removed On</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {new Date(assignment.removedAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Removal Reason Details */}
                            {assignment.removalDetails && (
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Reason Details</p>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
                                            {assignment.removalDetails}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Report Link if exists */}
                            {assignment.reportId && (
                                <div className="flex items-center justify-between p-2 bg-amber-50 rounded border border-amber-200">
                                    <div className="flex items-center gap-2">
                                        <Flag className="h-4 w-4 text-amber-600" />
                                        <div>
                                            <p className="text-xs font-medium text-amber-900">
                                                Report: {assignment.reportId.title ?? 'Untitled Report'}
                                            </p>
                                            <p className="text-xs text-amber-700">
                                                Status: {assignment.reportId.status ?? 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                    {onViewReport && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewReport(assignment.reportId!._id)}
                                            className="h-7 px-2 text-xs hover:bg-amber-100"
                                        >
                                            View Report
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    {/* Only show reassign for "other" reason */}
                    {assignment.removalReason === 'other' && (
                        <Button
                            onClick={() => onReassign(assignment._id)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                            size="sm"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reassign Mentor
                        </Button>
                    )}
                    {onViewHistory && (
                        <Button
                            variant="outline"
                            onClick={() => onViewHistory(assignment._id)}
                            className="flex-1 border-gray-300 hover:bg-gray-50 font-semibold"
                            size="sm"
                        >
                            <History className="h-4 w-4 mr-2" />
                            View History
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
