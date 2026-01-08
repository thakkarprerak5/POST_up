'use client';

import { Github, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectInteractions } from "@/components/project-interactions";
import Link from "next/link";

import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [api, setApi] = useState<any>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const router = useRouter();
  
  const handleAuthorClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Comprehensive debugging
    console.log('=== AUTHOR CLICK DEBUG ===');
    console.log('Complete project object:', project);
    console.log('Author object:', project.author);
    console.log('Available author fields:', project.author ? Object.keys(project.author) : 'No author object');
    
    // Try multiple possible ID fields
    const possibleIds = [
      project.author?.id,
      project.author?._id,
      project.author?.authorId,
      project.author?.userId,
      project.author?.author?._id,
      project.author?.author?.id
    ];
    
    // Find first valid ID
    const validId = possibleIds.find(id => id && id !== 'undefined' && id !== 'null' && id !== '');
    
    console.log('Possible IDs found:', possibleIds);
    console.log('First valid ID:', validId);
    
    if (validId) {
      console.log('✅ Navigating to profile with ID:', validId);
      router.push(`/profile/${validId}`);
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

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-0">
        {/* Media Section */}
        {project.images && project.images.length > 0 ? (
          <div className="relative">
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
                      console.error('Image failed to load:', project.images[0]);
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `
                        <div class="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                          ${project.author.name.charAt(0).toUpperCase()}
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
                              <div class="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                                ${project.author.name.charAt(0).toUpperCase()}
                              </div>
                            `;
                          }}
                        />
                      </AspectRatio>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-70 hover:bg-opacity-90 text-white border border-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110" />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-70 hover:bg-opacity-90 text-white border border-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110" />
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
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 cursor-pointer"
              onClick={handlePlayPause}
            >
              <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[16px] border-l-transparent border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-0 ml-1"></div>
              </div>
            </div>
          </AspectRatio>
        ) : null}

        {/* Content Section */}
        <div className="p-4">
          {/* Author Section - CLEAN VERSION FOR ALL USERS */}
          <div className="flex items-center gap-2 mb-3">
            {/* Profile Photo - WORKS FOR ALL USERS */}
            <Avatar className="w-8 h-8 cursor-pointer" onClick={handleAuthorClick}>
              {/* Check if user has actual uploaded photo (not placeholder) */}
              {project.author.image && project.author.image !== '/placeholder-user.jpg' ? (
                <AvatarImage src={project.author.image} alt={project.author.name} />
              ) : (
                <AvatarImage src={project.author.avatar} alt={project.author.name} />
              )}
              <AvatarFallback>
                {project.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <a 
                href={`/profile/${project.author?.id || ''}`}
                className="text-sm font-medium hover:underline text-blue-600 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  const authorId = project.author?.id;
                  console.log('🔍 Clicked author:', project.author?.name);
                  console.log('🔍 Author ID:', authorId);
                  console.log('🔍 Navigation URL:', `/profile/${authorId}`);
                  
                  if (authorId && authorId !== 'undefined' && authorId !== 'null' && authorId !== '') {
                    console.log('✅ Navigating to:', `/profile/${authorId}`);
                    window.location.href = `/profile/${authorId}`;
                  } else {
                    console.log('❌ Author ID is invalid:', authorId);
                  }
                }}
              >
                {project.author?.name || 'Unknown Author'}
              </a>
              <p className="text-xs text-muted-foreground">
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
          <h3 className="font-semibold text-lg line-clamp-2">{project.title}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
            {project.description}
          </p>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {project.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Links */}
          <div className="flex gap-2 mt-3">
            {project.githubUrl && project.githubUrl !== "#" && (
              <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4" />
                  Code
                </a>
              </Button>
            )}
            {project.liveUrl && project.liveUrl !== "#" && (
              <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Live
                </a>
              </Button>
            )}
          </div>

          {/* Interactions */}
          <div className="mt-4 pt-4 border-t">
            <ProjectInteractions
              projectId={project._id || (project.id?.toString() || '')}
              initialLikes={project.likeCount || 0}
              initialComments={project.comments || []}
              initialShares={project.shareCount || 0}
              authorId={project.author.id}
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
