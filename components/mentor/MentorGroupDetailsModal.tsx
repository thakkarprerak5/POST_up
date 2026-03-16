"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Users,
    Mail,
    Calendar,
    Info,
    X,
    Crown,
    CheckCircle2,
    Briefcase,
    Loader2,
} from "lucide-react";
import { useRouter } from 'next/navigation';

interface GroupMember {
    _id?: string;
    id?: string;
    fullName?: string;
    name?: string;
    email?: string;
    photo?: string;
    avatarUrl?: string;
    status?: string;
}

interface GroupData {
    id?: string;
    _id?: string;
    name?: string;
    description?: string;
    lead?: GroupMember;
    members?: GroupMember[];
    studentIds?: GroupMember[]; // API often returns this
    project?: {
        title: string;
        description: string;
        status?: string;
    };
    createdAt?: string;
    status?: string;
}

interface MentorGroupDetailsModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    trigger?: React.ReactNode;
    isOwner?: boolean;
    groupId?: string | { _id: string } | any;

    // New props for data injection
    groupData?: GroupData | any;
    isLoading?: boolean;

    // Fallback props for snapshot data
    projectTitle?: string;
    projectDescription?: string;
    submittedAt?: string | Date;
    category?: string;
    requestedBy?: {
        name: string;
        email: string;
        avatarUrl?: string;
    };
    groupSnapshot?: {
        id: string;
        name: string;
        lead?: {
            name: string;
            email: string;
            avatarUrl?: string;
        };
        members: Array<{
            name: string;
            email: string;
            avatarUrl?: string;
            status?: string;
        }>;
    };
}

export function MentorGroupDetailsModal({
    isOpen,
    onClose,
    trigger,
    isOwner = false,
    groupId,
    groupData,
    isLoading: externalLoading,
    // Fallbacks
    projectTitle,
    projectDescription,
    groupSnapshot
}: MentorGroupDetailsModalProps) {
    const router = useRouter();
    // Backward compatibility: if isOpen is not provided, use internal state
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isControlled = isOpen !== undefined;
    const modalIsOpen = isControlled ? isOpen : internalIsOpen;

    const [fetchedGroup, setFetchedGroup] = useState<any>(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        if (isControlled && onClose) {
            onClose();
        } else {
            setInternalIsOpen(false);
        }
    };

    // Determine effective data
    const effectiveLoading = externalLoading || internalLoading;

    // Prioritize injected groupData, then fetched internal data, then snapshot fallback
    const displayData = groupData || fetchedGroup || (groupSnapshot ? {
        name: groupSnapshot.name,
        lead: groupSnapshot.lead ? { ...groupSnapshot.lead, fullName: groupSnapshot.lead.name, photo: groupSnapshot.lead.avatarUrl } : undefined,
        members: groupSnapshot.members.map(m => ({ ...m, fullName: m.name, photo: m.avatarUrl })),
        project: {
            title: projectTitle,
            description: projectDescription
        }
    } : null);

    // Normalize members for display (handle different API structures: members vs studentIds)
    const members = displayData?.members && displayData.members.length > 0
        ? displayData.members
        : (displayData?.studentIds || []);

    const lead = displayData?.lead;

    useEffect(() => {
        // Only fetch internally if:
        // 1. Modal is open
        // 2. No injected groupData is provided
        // 3. We have a groupId
        if (modalIsOpen && !groupData && groupId && !fetchedGroup) {
            const fetchGroupDetails = async () => {
                setInternalLoading(true);
                setError(null);
                try {
                    const id = typeof groupId === 'string' ? groupId : (groupId._id || groupId.id);
                    if (!id) return;

                    console.log('🔍 Modal fetching group details for ID:', id);

                    // Try groups endpoint 
                    const res = await fetch(`/api/groups/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setFetchedGroup(data.group || data);
                    } else {
                        // Try assignments endpoint as fallback
                        const res2 = await fetch(`/api/assignments/${id}`);
                        if (res2.ok) {
                            const data = await res2.json();
                            const transformedData = {
                                ...(data.group || data.assignment?.group),
                                project: data.project || data.assignment?.project
                            };
                            setFetchedGroup(transformedData);
                        } else {
                            setError("Could not load group details");
                        }
                    }
                } catch (error) {
                    console.error('❌ Error fetching group details:', error);
                    setError('Network error');
                } finally {
                    setInternalLoading(false);
                }
            };

            fetchGroupDetails();
        }
    }, [modalIsOpen, groupId, groupData, fetchedGroup]);

    // Reset internal state when modal closes or groupId changes
    useEffect(() => {
        if (!modalIsOpen) {
            setFetchedGroup(null);
            setError(null);
        }
    }, [modalIsOpen, groupId]);


    return (
        <Dialog open={modalIsOpen} onOpenChange={isControlled ? onClose : setInternalIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="hidden">
                        Trigger
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-5xl w-[95vw] h-auto max-h-[85vh] bg-white text-slate-900 rounded-2xl shadow-2xl border-0 overflow-hidden p-0 flex flex-col">

                {/* Header */}
                <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            {displayData?.name || "Group Details"}
                            {displayData?.status && (
                                <Badge variant="secondary" className="text-xs font-normal bg-slate-100 text-slate-600">
                                    {displayData.status}
                                </Badge>
                            )}
                        </DialogTitle>
                        {/* Custom Close Button for cleaner look */}
                        <DialogClose className="rounded-full p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-0">
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close</span>
                        </DialogClose>
                    </div>
                </DialogHeader>

                {/* Content */}
                <ScrollArea className="flex-1 bg-white">
                    <div className="p-8">
                        {effectiveLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                                <p className="text-slate-500 font-medium">Loading group roster...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                                <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
                                    <Info className="h-6 w-6 text-red-500" />
                                </div>
                                <p className="text-slate-800 font-medium">{error}</p>
                                <p className="text-slate-500 text-sm">Please try again later.</p>
                            </div>
                        ) : !displayData ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Users className="h-12 w-12 text-slate-300 mb-4" />
                                <p className="text-slate-500">No group information available.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">

                                {/* Project Card */}
                                {(displayData.project || projectTitle) && (
                                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Briefcase className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                                    {displayData.project?.title || projectTitle}
                                                </h3>
                                                <p className="text-slate-600 leading-relaxed text-sm">
                                                    {displayData.project?.description || projectDescription || "No description provided."}
                                                </p>

                                                <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>
                                                            Created {displayData.createdAt ? new Date(displayData.createdAt).toLocaleDateString() : (submittedAt ? new Date(submittedAt).toLocaleDateString() : "Unknown")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="h-4 w-4" />
                                                        <span>{members.length + (lead ? 1 : 0)} Members</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Roster Section */}
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-slate-500" />
                                        Team Roster
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Team Lead Card */}
                                        {lead && (
                                            <div className="relative overflow-hidden group p-4 border border-blue-200 bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-4">
                                                <div className="absolute top-3 right-3">
                                                    <Badge className="bg-blue-600 text-white border-0 text-[10px] px-2 py-0.5 h-5">
                                                        LEAD
                                                    </Badge>
                                                </div>

                                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                                    <AvatarImage src={lead.photo || lead.avatarUrl} />
                                                    <AvatarFallback className="bg-blue-600 text-white font-bold">
                                                        {(lead.fullName || lead.name || "L").charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-900 truncate">
                                                        {lead.fullName || lead.name || "Team Lead"}
                                                    </div>
                                                    <div className="text-sm text-slate-500 truncate flex items-center gap-1.5">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        {lead.email}
                                                    </div>
                                                </div>

                                                {lead._id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full"
                                                        onClick={() => router.push(`/profile/${lead._id}`)}
                                                    >
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {/* Members */}
                                        {members.length > 0 ? (
                                            members.map((member: any, idx: number) => (
                                                <div key={idx} className="p-4 border border-slate-100 bg-white rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-4 shadow-sm hover:shadow-md">
                                                    <Avatar className="h-12 w-12 border-2 border-slate-50">
                                                        <AvatarImage src={member.photo || member.avatarUrl} />
                                                        <AvatarFallback className="bg-slate-800 text-white font-bold">
                                                            {(member.fullName || member.name || "M").charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-slate-900 truncate">
                                                            {member.fullName || member.name || "Team Member"}
                                                        </div>
                                                        <div className="text-sm text-slate-500 truncate flex items-center gap-1.5">
                                                            <Mail className="h-3.5 w-3.5" />
                                                            {member.email}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-green-500" title="Active"></div>
                                                        {(member._id || member.id) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                                                onClick={() => router.push(`/profile/${member._id || member.id}`)}
                                                            >
                                                                <Info className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            !lead && (
                                                <div className="col-span-1 md:col-span-2 py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                                    <p className="text-slate-500">No members found in this group.</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer (Optional, mostly for close button redundancy or actions) */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <Button variant="outline" onClick={handleClose} className="border-slate-200 hover:bg-white text-slate-700">
                        Close
                    </Button>
                </div>
`            </DialogContent>
        </Dialog>
    );
}
