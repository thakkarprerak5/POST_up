"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tag } from "lucide-react";

export default function CategoryFeedPage() {
    const params = useParams();
    const router = useRouter();
    const categorySlug = params.slug as string;

    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Fetch current user
                const userRes = await fetch("/api/profile");
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setCurrentUser(userData && typeof userData === 'object' ? userData : null);
                }

                // Fetch projects for this category
                const response = await fetch(`/api/feed?category=${categorySlug}&limit=100`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && Array.isArray(data.projects)) {
                        setProjects(data.projects);
                    }
                }
            } catch (error) {
                console.error('Error loading category feed:', error);
            } finally {
                setLoading(false);
            }
        };

        if (categorySlug) {
            loadData();
        }
    }, [categorySlug]);

    const adaptProjectToPost = (project: any) => {
        const author = project.author || {};
        const authorName = author.fullName || author.name || "Anonymous Student";
        const authorPhoto = author.profileImage || author.image || author.avatar || '/placeholder-user.jpg';

        return {
            id: project._id || project.id,
            content: project.description || 'No description available',
            title: project.title,
            type: 'project' as const,
            image: project.images?.[0] || null,
            author: {
                id: author.id || project.authorId || '',
                name: authorName,
                photo: authorPhoto,
                role: author.type || 'student'
            },
            likeCount: project.likeCount || 0,
            commentCount: project.commentsCount || 0,
            createdAt: project.createdAt,
            likedByUser: project.likedByUser || false,
            likes: project.likes || [],
            tags: project.tags || []
        };
    };

    const handleProfilePhotoClick = (imageUrl: string, name: string) => {
        // This would typically open a modal - implement as needed
        console.log('Profile photo clicked:', name, imageUrl);
    };

    // Format category name for display
    const categoryName = categorySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>

                    {/* Project Skeletons */}
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-card rounded-lg p-6 shadow-sm animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 bg-gray-200 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                                        <div className="h-3 bg-gray-200 rounded w-1/6" />
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="h-4 bg-gray-200 rounded" />
                                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                                </div>
                                <div className="h-48 bg-gray-200 rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="mb-4 -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Tag className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">
                            #{categoryName}
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        {projects.length} {projects.length === 1 ? 'project' : 'projects'} in this category
                    </p>
                </div>

                {/* Projects */}
                {projects.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/30 flex items-center justify-center">
                            <Tag className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            No projects found
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            There are no projects tagged with #{categoryName} yet
                        </p>
                        <Button onClick={() => router.push('/')}>
                            Browse All Projects
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {projects.map((project) => (
                            <PostCard
                                key={project._id || project.id}
                                post={adaptProjectToPost(project)}
                                onProfilePhotoClick={handleProfilePhotoClick}
                                currentUser={currentUser}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
