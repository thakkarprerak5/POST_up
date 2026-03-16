"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/PostCard";

interface ProjectFeedProps {
    onProfilePhotoClick: (imageUrl: string, name: string) => void;
    currentUser?: any;
}

export function ProjectFeed({ onProfilePhotoClick, currentUser }: ProjectFeedProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/feed?limit=100&sort=latest');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && Array.isArray(data.projects)) {
                        setProjects(data.projects);
                    }
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const adaptProjectToPost = (project: any) => {
        // Use same logic as TrendingFeed for consistency
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
            tags: project.tags || [] // Pass tags to PostCard
        };
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
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
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/30 flex items-center justify-center">
                    <div className="w-8 h-8 text-muted-foreground">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
                <p className="text-sm text-muted-foreground">Projects and updates will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {projects.map((project) => (
                <PostCard
                    key={project._id || project.id}
                    post={adaptProjectToPost(project)}
                    onProfilePhotoClick={onProfilePhotoClick}
                    currentUser={currentUser}
                />
            ))}
        </div>
    );
}
