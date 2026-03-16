"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Users,
    UserCheck,
    Mail,
    Calendar,
    Info,
    X,
    Crown,
    Users2,
    Clock,
} from "lucide-react";

export interface GroupMember {
    userId?: string;
    email: string;
    name?: string;
    status: 'active' | 'inactive' | 'pending';
}

export interface GroupSnapshot {
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
        status: 'active' | 'inactive';
    }>;
}

interface GroupDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectTitle: string;
    projectDescription?: string;
    submittedAt?: string | Date;
    category?: string;
    requestedBy: {
        name: string;
        email: string;
        avatarUrl?: string;
    };
    groupSnapshot: GroupSnapshot;
    trigger?: React.ReactNode;
}

export function GroupDetailsModal({
    isOpen,
    onClose,
    projectTitle,
    projectDescription,
    submittedAt,
    category = "Group Project",
    requestedBy,
    groupSnapshot,
    trigger,
}: GroupDetailsModalProps) {
    // Backward compatibility: if isOpen is not provided, use internal state
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isControlled = isOpen !== undefined;
    const modalIsOpen = isControlled ? isOpen : internalIsOpen;

    const handleClose = () => {
        if (isControlled && onClose) {
            onClose();
        } else {
            setInternalIsOpen(false);
        }
    };

    const formatDate = (date?: string | Date) => {
        if (!date) return new Date().toLocaleDateString();
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <Dialog open={modalIsOpen} onOpenChange={isControlled ? onClose : setInternalIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
                        <Info className="h-4 w-4 mr-2" />
                        Group Details
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent
                className="p-0 gap-0 bg-white overflow-hidden rounded-2xl shadow-2xl border-slate-200 min-h-[70vh]"
                style={{
                    width: '70vw',
                    maxWidth: 'none',
                    left: '85%',
                    top: '95%',
                    transform: 'translate(-50%, -50%)',
                }}
            >

                {/* Sticky Header */}
                <DialogHeader className="sticky top-0 z-50 bg-white border-b border-slate-200 p-6">
                    <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        Group Project Details
                    </DialogTitle>
                </DialogHeader>

                {/* Close Button - Absolute Position */}
                <Button
                    variant="outline"
                    size="lg"
                    onClick={handleClose}
                    className="absolute top-6 right-6 h-12 w-12 p-0 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-full border-slate-200 bg-white shadow-md transition-all duration-200 z-50"
                >
                    <X className="h-6 w-6" />
                </Button>

                {/* Scrollable Body */}
                <ScrollArea className="h-[75vh]">
                    <div className="p-6 space-y-8">
                        {/* Section 1: Project Identity (Hero Card) */}
                        <Card className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
                                        {projectTitle}
                                    </h2>
                                    {projectDescription && (
                                        <p className="text-lg text-slate-600 leading-relaxed">
                                            {projectDescription}
                                        </p>
                                    )}
                                </div>

                                {/* Badges */}
                                <div className="flex items-center gap-4 flex-wrap">
                                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 text-sm font-medium">
                                        <Clock className="h-4 w-4 mr-2" />
                                        {formatDate(submittedAt)}
                                    </Badge>
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-2 text-sm font-medium">
                                        {category}
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                        {/* Section 2: The Team Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* The Lead (Col Span 4) */}
                            <div className="md:col-span-4">
                                <Card className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-white border border-blue-200 rounded-2xl p-8 flex flex-col items-center text-center shadow-lg">
                                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <div className="h-1 w-8 bg-blue-600 rounded-full"></div>
                                        Team Lead
                                        <div className="h-1 w-8 bg-blue-600 rounded-full"></div>
                                    </div>

                                    <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg mb-4">
                                        <AvatarImage src={groupSnapshot.lead?.avatarUrl} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold">
                                            {groupSnapshot.lead?.name?.[0] || 'L'}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="space-y-2 mb-4">
                                        <p className="text-xl font-bold text-slate-900">
                                            {groupSnapshot.lead?.name || 'Team Lead'}
                                        </p>
                                        <p className="text-sm text-slate-600 flex items-center justify-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            {groupSnapshot.lead?.email}
                                        </p>
                                    </div>

                                    <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 text-sm font-medium shadow-md">
                                        <Crown className="h-4 w-4 mr-2" />
                                        Team Lead
                                    </Badge>
                                </Card>
                            </div>

                            {/* The Members (Col Span 8) */}
                            <div className="md:col-span-8">
                                <Card className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Users2 className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700">
                                                    Team Members
                                                </span>
                                            </div>
                                            <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                                                {groupSnapshot.members?.length || 0}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Member Rows */}
                                    <div className="divide-y divide-slate-100">
                                        {groupSnapshot.members?.map((member, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-all duration-200 group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <Avatar className="h-12 w-12 ring-2 ring-slate-100">
                                                            <AvatarImage src={member.avatarUrl} />
                                                            <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white font-semibold">
                                                                {member?.name?.[0] || member?.email?.[0]?.toUpperCase() || 'M'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${member?.status === 'active' ? 'bg-green-500' : 'bg-slate-400'
                                                            }`} />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-slate-900 text-base">
                                                            {member?.name || 'Team Member'}
                                                        </p>
                                                        <p className="text-sm text-slate-600 flex items-center gap-2">
                                                            <Mail className="h-4 w-4" />
                                                            {member?.email}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Badge
                                                    className={`px-3 py-1 text-sm font-medium ${member?.status === 'active'
                                                            ? 'bg-green-100 text-green-700 border-green-200'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}
                                                >
                                                    {member?.status === 'active' ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                        )) || (
                                                <div className="p-12 text-center">
                                                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Users className="h-8 w-8 text-slate-400" />
                                                    </div>
                                                    <p className="text-slate-500 font-medium">No team members yet</p>
                                                    <p className="text-sm text-slate-400 mt-1">Team members will appear here once added</p>
                                                </div>
                                            )}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Footer (Requested By) */}
                        <Card className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-slate-600 font-medium">Requested by</div>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                            <AvatarImage src={requestedBy?.avatarUrl} />
                                            <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white font-bold">
                                                {requestedBy?.name?.[0] || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-slate-900">{requestedBy?.name}</p>
                                            <p className="text-sm text-slate-600">{requestedBy?.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Contact Information</p>
                                    <p className="text-sm text-slate-600 font-medium">{requestedBy?.email}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
