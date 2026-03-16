"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Users,
    User,
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    XCircle,
    Mail,
    UserCheck,
    Trash2,
    Eye,
    Info,
} from "lucide-react";

import { toast } from "sonner";
import { GroupDetailsModal, GroupSnapshot as ModalGroupSnapshot } from "@/components/admin/GroupDetailsModal";

interface LocalGroupMember {
    userId?: string;
    email: string;
    name?: string;
    status: 'active' | 'pending';
}

interface LocalGroupSnapshot {
    lead: {
        id: string;
        name: string;
        email: string;
    };
    members: LocalGroupMember[];
}

interface AssignmentRequest {
    _id: string;
    projectTitle: string;
    projectDescription: string;
    proposalFile?: string;
    requestedToType: 'student' | 'group';
    status: 'pending' | 'assigned' | 'cancelled' | 'removed';
    createdAt: string;
    assignedAt?: string;
    requestedBy: {
        _id: string;
        fullName: string;
        email: string;
        photo?: string;
    };
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
        studentIds: string[];
    };
    groupSnapshot?: LocalGroupSnapshot;
    assignedMentorId?: {
        _id: string;
        fullName: string;
        email: string;
        photo?: string;
        expertise?: string[];
    };
}

interface AssignmentRequestCardProps {
    request: AssignmentRequest;
    onAssignMentor: (requestId: string) => void;
    onViewDetails: (requestId: string) => void;
    onCancelRequest: (requestId: string) => void;
    onRemoveRequest: (requestId: string) => void; // NEW: Remove canceled request
}

export function AssignmentRequestCard({
    request,
    onAssignMentor,
    onViewDetails,
    onCancelRequest,
    onRemoveRequest,
}: AssignmentRequestCardProps) {
    const getStatusBadge = () => {
        switch (request.status) {
            case 'pending':
                return (
                    <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white border-0 px-4 py-2 text-xs font-bold rounded-full shadow-lg shadow-amber-500/25">
                        <Clock className="h-4 w-4 mr-2" />
                        Pending
                    </Badge>
                );
            case 'assigned':
                return (
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-4 py-2 text-xs font-bold rounded-full shadow-lg shadow-green-500/25">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Assigned
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 px-4 py-2 text-xs font-bold rounded-full shadow-lg shadow-red-500/25">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelled
                    </Badge>
                );
            case 'removed':
                return (
                    <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 px-4 py-2 text-xs font-bold rounded-full shadow-lg shadow-gray-500/25">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Removed
                    </Badge>
                );
        }
    };

    const getTypeBadge = () => {
        if (request.requestedToType === 'group') {
            return (
                <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-300/50 px-4 py-2 text-xs font-bold rounded-full shadow-md">
                    <Users className="h-4 w-4 mr-2" />
                    Group
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-purple-300/50 px-4 py-2 text-xs font-bold rounded-full shadow-md">
                <User className="h-4 w-4 mr-2" />
                Individual
            </Badge>
        );

    };

    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [showGroupDetails, setShowGroupDetails] = useState(false);
    const [detailedGroupSnapshot, setDetailedGroupSnapshot] = useState<ModalGroupSnapshot | null>(null);

    const handleGroupDetailsClick = async () => {
        // 1. If we already fetched it, just open
        if (detailedGroupSnapshot) {
            setShowGroupDetails(true);
            return;
        }

        // 2. Determine ID
        const groupId = request.groupId?._id || (typeof request.groupId === 'string' ? request.groupId : null);

        if (!groupId) {
            // Fallback for some reason if no ID
            setShowGroupDetails(true);
            return;
        }

        setIsLoadingDetails(true);
        try {
            const response = await fetch(`/api/groups/${groupId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch group details");
            }
            const data = await response.json();

            // 3. Map to ModalGroupSnapshot
            if (data.group) {
                const mappedSnapshot: ModalGroupSnapshot = {
                    id: data.group.id,
                    name: data.group.name || "Group Project", // Ensure name exists
                    lead: {
                        name: data.group.lead?.fullName || data.group.lead?.name || "Unknown Lead",
                        email: data.group.lead?.email || "",
                        avatarUrl: data.group.lead?.photo
                    },
                    members: (data.group.members || []).map((m: any) => ({
                        name: m.fullName || m.name || "Unknown Member",
                        email: m.email || "",
                        avatarUrl: m.photo,
                        status: 'active' // Default to active since API returns current members
                    }))
                };
                setDetailedGroupSnapshot(mappedSnapshot);
            }
            setShowGroupDetails(true);
        } catch (error) {
            console.error("Error fetching group details:", error);
            toast.error("Could not load latest group details");
            // Optionally open anyway with stale/local data if available?
            // For now, let's open anyway to show partial data if we have it
            setShowGroupDetails(true);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-7 space-y-6">
                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        {getTypeBadge()}
                        {getStatusBadge()}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-4">
                            {request.projectTitle}
                        </h3>
                        <p className="text-base text-slate-600 leading-relaxed line-clamp-2 font-medium">
                            {request.projectDescription}
                        </p>
                    </div>
                </div>
                {/* Requested By */}
                {request.requestedBy && (
                    <div className="flex items-center gap-5 p-5 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl border border-slate-200/50">
                        <Avatar className="h-14 w-14 border-3 border-white shadow-lg">
                            <AvatarImage src={request.requestedBy?.photo} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xl">
                                {request.requestedBy?.fullName?.[0] || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-lg font-bold text-slate-900 truncate">
                                {request.requestedBy?.fullName || 'Unknown User'}
                            </p>
                            <p className="text-sm text-slate-600 flex items-center gap-2 truncate font-medium">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                {request.requestedBy?.email || 'No email'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Group Members (if group project) */}
                {(() => {
                    const debugInfo = {
                        requestedToType: request.requestedToType,
                        hasGroupSnapshot: !!request.groupSnapshot,
                        hasGroupSnapshotMembers: !!request.groupSnapshot?.members,
                        groupSnapshot: request.groupSnapshot,
                        requestedToTypeIsGroup: request.requestedToType === 'group'
                    };
                    console.log('🔍 Debug - Group section conditions:', JSON.stringify(debugInfo, null, 2));

                    // Show group section for any group project, even without groupSnapshot
                    return request.requestedToType === 'group';
                })() && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3 border border-blue-200/50 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-sm font-bold text-blue-900">
                                    <Users className="h-4 w-4" />
                                    Group Members {request.groupSnapshot?.members ? `(${request.groupSnapshot.members.length})` : '(Group Project)'}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGroupDetailsClick}
                                    disabled={isLoadingDetails}
                                    className="bg-white/90 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200"
                                >
                                    {isLoadingDetails ? (
                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Info className="h-4 w-4 mr-2" />
                                    )}
                                    Group Details
                                </Button>

                                <GroupDetailsModal
                                    isOpen={showGroupDetails}
                                    onClose={() => setShowGroupDetails(false)}
                                    groupSnapshot={detailedGroupSnapshot || {
                                        id: request.groupId?._id || "unknown",
                                        name: request.groupId?.name || "Group Project",
                                        lead: {
                                            name: request.requestedBy?.fullName || "Unknown",
                                            email: request.requestedBy?.email || "",
                                            avatarUrl: request.requestedBy?.photo
                                        },
                                        members: request.groupSnapshot?.members.map(m => ({
                                            name: m.name || "Unknown",
                                            email: m.email || "",
                                            status: m.status === 'active' ? 'active' : 'inactive'
                                        })) || []
                                    }}
                                    projectTitle={request.projectTitle}
                                    projectDescription={request.projectDescription}
                                    requestedBy={{
                                        name: request.requestedBy?.fullName || "Unknown",
                                        email: request.requestedBy?.email || "",
                                        avatarUrl: request.requestedBy?.photo
                                    }}
                                    submittedAt={request.createdAt}
                                    trigger={<span className="hidden" />} // Hide default trigger since we use our own button
                                />
                            </div>

                            {/* Show basic group info if no groupSnapshot */}
                            {!request.groupSnapshot && !detailedGroupSnapshot && (
                                <div className="text-sm text-blue-700 bg-blue-100 rounded-lg p-3">
                                    <p>Group project submitted by {request.requestedBy?.fullName}</p>
                                    <p className="text-xs mt-1">Detailed group information will be available after processing.</p>
                                </div>
                            )}
                        </div>
                    )}

                {/* Assigned Mentor (if assigned) */}
                {request.status === 'assigned' && request.assignedMentorId && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50 shadow-lg">
                        <div className="flex items-center gap-3 text-sm font-bold text-green-900 mb-3">
                            <UserCheck className="h-4 w-4" />
                            Assigned Mentor
                        </div>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-3 border-white shadow-lg">
                                <AvatarImage src={request.assignedMentorId.photo} />
                                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-lg">
                                    {request.assignedMentorId.fullName?.[0] || 'M'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-bold text-slate-900 truncate">
                                    {request.assignedMentorId.fullName}
                                </p>
                                <p className="text-sm text-slate-600 truncate font-medium">{request.assignedMentorId.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-6 text-xs text-slate-500 pt-4 border-t border-slate-200/50">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">{new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    {request.proposalFile && (
                        <a
                            href={request.proposalFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
                        >
                            <FileText className="h-4 w-4" />
                            View Proposal
                        </a>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-5 pt-5">
                    {request.status === 'pending' && (
                        <div className="flex gap-5">
                            <Button
                                size="lg"
                                onClick={() => onAssignMentor(request._id)}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 h-12 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-105"
                            >
                                <UserCheck className="h-5 w-5 mr-3" />
                                Assign Mentor
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => onCancelRequest(request._id)}
                                className="flex-1 bg-gradient-to-r from-red-50 to-red-100 border-0 border-red-200 text-red-700 font-bold hover:from-red-500 hover:to-red-600 hover:text-white hover:border-red-500 h-12 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-red-500/25 transform hover:scale-105"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Request
                            </Button>
                        </div>
                    )}
                    {request.status === 'cancelled' && (
                        <div className="flex gap-5">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => onViewDetails(request._id)}
                                className="flex-1 bg-gradient-to-r from-blue-300 to-blue-10 border-0 border-blue-200 text-white font-bold hover:from-blue-500 hover:to-blue-600 hover:text-white hover:border-blue-500 h-12 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => onRemoveRequest(request._id)}
                                className="flex-1 bg-gradient-to-r from-red-50 to-red-100 border-0 border-red-200 text-red-700 font-bold hover:from-red-600 hover:to-red-700 hover:text-white hover:border-red-500 h-12 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-red-500/25 transform hover:scale-105"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Request
                            </Button>
                        </div>
                    )}
                    {request.status === 'assigned' && (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => onViewDetails(request._id)}
                            className="w-full bg-gradient-to-r from-blue-400 to-blue-300 border-0 border-blue-200 text-blue-700 font-bold hover:from-blue-500 hover:to-blue-600 hover:text-white hover:border-blue-500 h-12 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
