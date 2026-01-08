'use client';

import { Github, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectInteractions } from "@/components/project-interactions";

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
  innerPadding?: string;
  showInteractions?: boolean;
  showAuthor?: boolean;
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

export function ProjectCard({ project, innerPadding = "", showInteractions = true, showAuthor = true }: ProjectCardProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedByUser, setLikedByUser] = useState(false);
  const [likesCount, setLikesCount] = useState(project.likeCount || 0);
  const [commentsCount, setCommentsCount] = useState(project.comments?.length || 0);
  const [shareCount, setShareCount] = useState(project.shareCount || 0);

  const handleAuthorClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (project.author.id) {
      router.push(`/profile/${project.author.id}`);
    }
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardContent className={`p-0 ${innerPadding}`}>
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
                        />
                      </AspectRatio>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-6" />
                <CarouselNext className="-right-6" />
              </Carousel>
            )}
          </div>
        ) : project.video ? (
          <AspectRatio ratio={16 / 9}>
            <video
              ref={videoRef}
              src={project.video}
              className="w-full h-full object-cover"
              controls={false}
              onClick={handlePlayPause}
            />
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 cursor-pointer"
                onClick={handlePlayPause}
              >
                <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[16px] border-l-transparent border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-0 ml-1"></div>
                </div>
              </div>
            )}
          </AspectRatio>
        ) : null}

        {/* Content Section */}
        <div className={`${innerPadding} pt-1`}>
          {/* Author Section */}
          {showAuthor && (
            <div className="flex items-center gap-2">
              {/* Profile Photo - NEW IMPLEMENTATION */}
              <div className="w-8 h-8 rounded-full overflow-hidden cursor-pointer" onClick={handleAuthorClick}>
                {/* Check if user has actual uploaded photo */}
                {project.author.image && project.author.image !== '/placeholder-user.jpg' ? (
                  <img 
                    src={project.author.image} 
                    alt={project.author.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initial letter if image fails
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `
                        <div class="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                          ${project.author.name.charAt(0).toUpperCase()}
                        </div>
                      `;
                    }}
                  />
                ) : (
                  /* Show initial letter fallback */
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                    {project.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="cursor-pointer" onClick={handleAuthorClick}>
                <p className="text-sm font-medium hover:underline">{project.author.name}</p>
                <p className="text-xs text-muted-foreground hover:underline">
                  {project.author.username}
                </p>
                {project.createdAt && (
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(project.createdAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 mt-2">{project.title}</h3>

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
          {showInteractions && (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
