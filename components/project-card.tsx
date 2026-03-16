'use client';

import { Github, ExternalLink, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectInteractions } from "@/components/project-interactions";
import { ClickableProfilePhoto } from "@/components/clickable-profile-photo";
import Link from "next/link";

import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface ProjectCardProps {
  project: {
    _id?: string;
    id?: number;
    author: {
      id?: string;
      _id?: string;
      authorId?: string;
      userId?: string;
      name: string;
      avatar: string;
      image?: string;
      username: string;
    };
    title: string;
    description: string;
    tags: string[];
    images: string[];
    video?: string;
    githubUrl: string;
    liveUrl: string;
    likeCount?: number;
    likes?: string[];
    comments?: any[];
    shareCount?: number;
    createdAt?: string | Date;
    likedByUser?: boolean;
  };
  variant?: "default" | "embedded";
}

// Simple formatTimeAgo function
function formatTimeAgo(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}h ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}d ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function ProjectCard({
  project,
  variant = "default",
}: ProjectCardProps) {
  const { data: session } = useSession();
  const [api, setApi] = useState<any>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const router = useRouter();
  
  // Check if current user can manage this project
  const canManageProject = session?.user?.id === project.author?.id;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Project:', JSON.parse(JSON.stringify(project)));
    console.log({
      projectId: project._id,
      projectTitle: project.title,
      sessionUserId: session?.user?.id,
      authorId: project.author?.id,
      canManageProject
    });
  }
  
  const handleAuthorClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Use author.id which is now dynamically fetched and always correct
    const authorId = project.author?.id;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('=== AUTHOR CLICK DEBUG ===');
      console.log('Author ID from project.author.id:', authorId);
      console.log('Complete author object:', project.author);
    }
    
    if (authorId && authorId !== 'undefined' && authorId !== 'null' && authorId !== '') {
      console.log('✅ Navigating to profile with ID:', authorId);
      router.push(`/profile/${authorId}`);
    } else {
      console.log('❌ No valid author ID found');
      console.log('❌ Available author data:', project.author);
    }
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = e.currentTarget.parentElement?.querySelector('video');
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  const handleEditProject = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const projectId = project._id;
    if (projectId) {
      router.push(`/projects/${projectId}/edit`);
    }
  };

  const handleDeleteProject = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    const projectId = project._id;
    if (!projectId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the page to show updated project list
        window.location.reload();
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      console.error('Delete project error:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  return (
    <Card 
      data-project-id={project._id || project.id}
      className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${
        variant === "embedded" ? "border-0 shadow-none bg-transparent" : "bg-card"
      }`}
    >
      <CardContent className="p-0">
        {/* Media Section */}
        {project.images && project.images.length > 0 ? (
          <div className="relative overflow-hidden rounded-t-xl">
            {project.images.length === 1 ? (
              <div className="relative">
                <AspectRatio ratio={16 / 9}>
                  <Image
                    src={project.images[0]}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw"
                    loading="lazy"
                    onError={(e) => {
                      if (process.env.NODE_ENV === 'development') {
                        console.error('Image failed to load:', project.images[0]);
                      }
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `
                        <div class="w-full h-full bg-muted flex items-center justify-center text-xs font-medium">
                          ${(project.author?.name || '?').charAt(0).toUpperCase()}
                        </div>
                      `;
                    }}
                  />
                </AspectRatio>
              </div>
            ) : (
              <Carousel className="w-full">
                <CarouselContent>
                  {project.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <AspectRatio ratio={16 / 9}>
                        <Image
                          src={image}
                          alt={`${project.title} - Image ${index + 1}`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw"
                          loading="lazy"
                          onError={(e) => {
                            console.error('Image failed to load:', image);
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `
                              <div class="w-full h-full bg-muted flex items-center justify-center text-xs font-medium">
                                ${project.author.name.charAt(0).toUpperCase()}
                              </div>
                            `;
                          }}
                        />
                      </AspectRatio>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/95 text-foreground border border-border/50 rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110" />
                <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/95 text-foreground border border-border/50 rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110" />
              </Carousel>
            )}
          </div>
        ) : project.video ? (
          <AspectRatio ratio={16 / 9}>
            <video
              src={project.video}
              className="w-full h-full object-cover"
              controls={false}
              onClick={handlePlayPause}
            />
            <div 
              className="absolute inset-0 flex items-center justify-center bg-background/60 cursor-pointer"
              onClick={handlePlayPause}
            >
              <div className="w-16 h-16 rounded-full bg-background/80 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[16px] border-l-transparent border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-0 ml-1"></div>
              </div>
            </div>
          </AspectRatio>
        ) : null}

        {/* Content Section */}
        <div className="p-6">
          {/* Author Section */}
          <div className="flex items-center gap-3 mb-4">
            <ClickableProfilePhoto
              imageUrl={project.author?.image || project.author?.avatar}
              avatar={project.author?.avatar}
              name={project.author?.name ?? "Unknown Author"}
              size="md"
              className="h-10 w-10 ring-2 ring-background group-hover:ring-primary/20 transition-all duration-200"
            />
            
            <div className="flex-1">
              <a 
                href={`/profile/${project.author?.id || ''}`}
                className="text-sm font-semibold text-foreground hover:text-primary cursor-pointer transition-colors duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  const authorId = project.author?.id;
                  if (process.env.NODE_ENV === 'development') {
                    console.log('🔍 Clicked author:', project.author?.name);
                    console.log('🔍 Author ID:', authorId);
                    console.log('🔍 Navigation URL:', `/profile/${authorId}`);
                  }
                  
                  if (authorId && authorId !== 'undefined' && authorId !== 'null' && authorId !== '') {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('✅ Navigating to:', `/profile/${authorId}`);
                    }
                    window.location.href = `/profile/${authorId}`;
                  } else {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('❌ Author ID is invalid:', authorId);
                    }
                  }
                }}
              >
                {project.author?.name ?? "Unknown Author"}
              </a>
              <p className="text-xs text-muted-foreground font-medium">
                {project.author?.username || 'unknown'}
              </p>
              {project.createdAt && (
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(project.createdAt)}
                </p>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-xl line-clamp-2 mb-3 text-foreground">{project.title}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {project.description}
          </p>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs font-medium bg-secondary/50 hover:bg-secondary transition-colors">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Links */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {project.githubUrl && project.githubUrl !== "#" && (
              <Button variant="outline" size="sm" className="flex items-center gap-1 hover:bg-primary/5 hover:border-primary/50 transition-colors" asChild>
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4" />
                  Code
                </a>
              </Button>
            )}
            {project.liveUrl && project.liveUrl !== "#" && (
              <Button variant="outline" size="sm" className="flex items-center gap-1 hover:bg-primary/5 hover:border-primary/50 transition-colors" asChild>
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Live
                </a>
              </Button>
            )}
            
            {/* Edit and Delete buttons - only visible to project author */}
            {canManageProject && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 hover:bg-primary/5 hover:border-primary/50 transition-colors" 
                  onClick={handleEditProject}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex items-center gap-1" 
                  onClick={handleDeleteProject}
                >
                  <Trash className="w-4 h-4" />
                  Delete
                </Button>
              </>
            )}
          </div>

          {/* Interactions */}
          <div className="mt-4 pt-4 border-t">
            <ProjectInteractions
              projectId={project._id || (project.id?.toString() || '')}
              initialLikes={project.likeCount || 0}
              initialComments={project.comments || []}
              initialShares={project.shareCount || 0}
              authorId={project.author?.id || ''}
              initialLiked={project.likedByUser}
              githubUrl={project.githubUrl}
              liveUrl={project.liveUrl}
              images={project.images}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
