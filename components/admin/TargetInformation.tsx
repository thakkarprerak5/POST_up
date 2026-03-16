"use client";

import { ExternalLink, FileText, MessageSquare, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface TargetInformationProps {
    report: {
        targetType: 'user' | 'project' | 'post' | 'comment' | 'chat';
        targetId: string;
        targetDetails: {
            title?: string;
            description?: string;
            content?: string;
            authorName?: string;
            authorPhoto?: string;
            authorId?: string;
            parentId?: string; // For comments - the parent project/post ID
        };
    };
}

export function TargetInformation({ report }: TargetInformationProps) {
    const router = useRouter();

    const getTargetIcon = () => {
        switch (report.targetType) {
            case 'user':
                return <UserIcon className="h-5 w-5 text-blue-600" />;
            case 'project':
            case 'post':
                return <FileText className="h-5 w-5 text-purple-600" />;
            case 'comment':
                return <MessageSquare className="h-5 w-5 text-green-600" />;
            default:
                return <FileText className="h-5 w-5 text-gray-600" />;
        }
    };

    const getTargetTypeColor = () => {
        switch (report.targetType) {
            case 'user':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'project':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'post':
                return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'comment':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getViewOriginalLink = () => {
        switch (report.targetType) {
            case 'project':
            case 'post':
                return `/projects/${report.targetId}`;
            case 'comment':
                // Deep link to comment with scroll
                return `/projects/${report.targetDetails.parentId}?commentId=${report.targetId}`;
            case 'user':
                return `/profile/${report.targetId}`;
            default:
                return null;
        }
    };

    const handleViewOriginal = () => {
        const link = getViewOriginalLink();
        if (link) {
            router.push(link);
        }
    };

    return (
        <Card className="border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-slate-50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        {getTargetIcon()}
                        Target Information
                    </CardTitle>
                    <Badge className={`${getTargetTypeColor()} border px-3 py-1 text-xs font-bold uppercase`}>
                        {report.targetType}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
                {/* Author Information */}
                {report.targetDetails.authorName && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <Avatar className="h-10 w-10 ring-2 ring-white">
                            <AvatarImage src={report.targetDetails.authorPhoto} alt={report.targetDetails.authorName} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                                {report.targetDetails.authorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">Author</p>
                            <p className="text-base font-semibold text-gray-900">{report.targetDetails.authorName}</p>
                        </div>
                    </div>
                )}

                {/* Content Title */}
                {report.targetDetails.title && (
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</p>
                        <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                            {report.targetDetails.title}
                        </p>
                    </div>
                )}

                {/* Content Body */}
                {(report.targetDetails.content || report.targetDetails.description) && (
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Content</p>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                                {report.targetDetails.content || report.targetDetails.description}
                            </p>
                        </div>
                    </div>
                )}

                {/* View Original Button */}
                {getViewOriginalLink() && (
                    <Button
                        onClick={handleViewOriginal}
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Original {report.targetType.charAt(0).toUpperCase() + report.targetType.slice(1)}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
