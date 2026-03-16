"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { Flame } from "lucide-react";

interface TrendingFeedProps {
    onProfilePhotoClick: (imageUrl: string, name: string) => void;
    currentUser?: any;
}

export function TrendingFeed({ onProfilePhotoClick, currentUser }: TrendingFeedProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrendingProjects = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/feed/trending?limit=50');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && Array.isArray(data.projects)) {
                        setProjects(data.projects);
                    }
                }
            } catch (error) {
                console.error('Error fetching trending projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrendingProjects();
    }, []);

    const adaptProjectToPost = (project: any) => {
        // Enhanced error handling for author data
        const author = project.author || {};
        const authorName = author.fullName || author.name || "Anonymous Student";
        // Use the correct field names from API response
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
                    <div key={i} className="bg-card rounded-2xl shadow-sm hover:-translate-y-1 transition-all duration-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                                <div className="h-3 bg-gray-200 rounded w-1/6 animate-pulse" />
                            </div>
                            <div className="h-8 w-16 bg-gray-300 rounded-full animate-pulse" />
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                        </div>
                        <div className="h-48 bg-gray-200 rounded-xl relative animate-pulse">
                            <div className="absolute top-3 left-3 h-8 w-16 bg-gray-300 rounded-full animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                    <Flame className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No trending projects yet</h3>
                <p className="text-sm text-muted-foreground">Trending projects will appear here based on engagement</p>
            </div>
        );
    }

    // Check for projects with missing author info
    const projectsWithMissingAuthors = projects.filter(p => !p.author || !p.author.name || !p.author.photo);
    if (projectsWithMissingAuthors.length > 0) {
        console.warn('Projects with missing author info:', projectsWithMissingAuthors);
    }

    return (
        <div className="space-y-4">
            {/* Trending Header */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                <Flame className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-semibold text-orange-900">
                    Trending Projects - Ranked by Engagement
                </span>
            </div>

            {/* Trending Projects */}
            {projects.map((project) => (
                <div key={project._id || project.id} className="rounded-2xl shadow-sm hover:-translate-y-1 transition-all duration-200">
                    <PostCard
                        post={adaptProjectToPost(project)}
                        onProfilePhotoClick={onProfilePhotoClick}
                        currentUser={currentUser}
                        rank={project.rank}
                        showTrendingIndicator={true}
                    />
                </div>
            ))}
        </div>
    );
}
