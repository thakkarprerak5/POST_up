"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Users,
    Mail,
    Calendar,
    Info,
    ArrowLeft,
    Github,
    Globe,
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { PostCard } from "@/components/PostCard";

export default function MentorGroupDetailsPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (params.groupId) {
            fetchGroupDetails();
        }
    }, [params.groupId]);

    const fetchGroupDetails = async () => {
        try {
            const response = await fetch(`/api/groups/${params.groupId}`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                toast.error("Failed to load group details");
                router.push("/mentor/dashboard");
            }
        } catch (error) {
            console.error("Error fetching group:", error);
            toast.error("Error loading group details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data || !data.group) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold">Group not found</h2>
                <Button onClick={() => router.push("/mentor/dashboard")} className="mt-4">
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    const { group, project } = data;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" onClick={() => router.push("/mentor/dashboard")} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                    <Badge variant="outline" className="text-gray-600 bg-white">
                        Group
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Project & Discussions */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Project Overview Card */}
                        {project ? (
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center justify-between">
                                        {project.title}
                                        <div className="flex gap-2">
                                            <Badge className={
                                                project.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                    project.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                                                        'bg-gray-100 text-gray-700'
                                            }>
                                                {project.status || 'Active'}
                                            </Badge>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                        {project.description}
                                    </p>

                                    <div className="flex gap-4 pt-4 border-t">
                                        {project.repoUrl && (
                                            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                                                <Github className="h-5 w-5" />
                                                Repository
                                            </a>
                                        )}
                                        {project.liveUrl && (
                                            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                                                <Globe className="h-5 w-5" />
                                                Live Demo
                                            </a>
                                        )}
                                    </div>

                                    {project.tags && project.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {project.tags.map((tag: string) => (
                                                <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-600">
                                                    #{tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-0 shadow-sm bg-gray-50 border-dashed border-2 border-gray-200">
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                    <Info className="h-10 w-10 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900">No Project Linked</h3>
                                    <p className="text-gray-500">This group hasn't submitted a project yet.</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Discussions / Project Posts */}
                        {project && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    Project Updates & Discussion
                                </h3>
                                {/* 
                  Reuse PostCard to show the project itself as a post, which enables comments/discussions.
                  Construct a "post" object from the project data.
                */}
                                <PostCard
                                    post={{
                                        id: project.id,
                                        content: project.description,
                                        author: {
                                            id: project.author?._id || group.lead?._id,
                                            name: project.author?.fullName || group.lead?.fullName || 'Group Lead',
                                            photo: project.author?.photo || group.lead?.photo,
                                            role: 'Student', // Assuming student role
                                            account_status: 'ACTIVE'
                                        },
                                        likeCount: 0, // Need to implement likes for projects if tracked
                                        commentCount: project.comments?.length || 0,
                                        createdAt: project.createdAt,
                                        type: 'project',
                                        title: project.title,
                                        tags: project.tags,
                                        likes: [] // Add likes logic if available
                                    }}
                                    onProfilePhotoClick={() => { }} // Handle navigation
                                    currentUser={{
                                        id: session?.user?.id || '',
                                        fullName: session?.user?.name || 'Me',
                                        photo: session?.user?.image || undefined
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Column - Team Details */}
                    <div className="space-y-6">
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Team Members
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Team Lead */}
                                {group.lead && (
                                    <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                                        <Avatar className="h-10 w-10 ring-2 ring-white">
                                            <AvatarImage src={group.lead.photo} />
                                            <AvatarFallback>{group.lead.fullName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900">{group.lead.fullName}</p>
                                            <p className="text-xs text-gray-600">{group.lead.email}</p>
                                            <Badge className="mt-1 bg-blue-200 text-blue-800 hover:bg-blue-200 border-0 text-[10px] px-2 py-0">Team Lead</Badge>
                                        </div>
                                    </div>
                                )}

                                {/* Members */}
                                {group.members?.map((member: any) => (
                                    <div key={member._id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                        <Avatar className="h-10 w-10 text-xs">
                                            <AvatarImage src={member.photo} />
                                            <AvatarFallback>{member.fullName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{member.fullName}</p>
                                            <p className="text-xs text-gray-500">{member.email}</p>
                                        </div>
                                    </div>
                                ))}

                                {(!group.members || group.members.length === 0) && !group.lead && (
                                    <p className="text-sm text-gray-500 text-center py-4">No members found</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Info className="h-5 w-5 text-gray-500" />
                                    Group Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> Created</span>
                                    <span className="font-medium">{new Date(group.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Users className="h-4 w-4" /> Size</span>
                                    <span className="font-medium">{(group.members?.length || 0) + (group.lead ? 1 : 0)} Members</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
