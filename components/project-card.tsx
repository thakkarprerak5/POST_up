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
  type CarouselApi,
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
    likedByUser?: boolean; // Add this property
  };
  variant?: "default" | "embedded";
}

export function ProjectCard({
  project,
  variant = "default",
}: ProjectCardProps) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const router = useRouter();
  
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.author.id) {
      router.push(`/profile/${project.author.id}`);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (timestamp: string | Date) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'some time ago';
    }
  };
  const autoplayTimer = useRef<number | null>(null);
  const hasMedia =
    (project.images && project.images.length > 0) || !!project.video;
  const mediaItems = [
    ...(project.images || []).map((src) => ({ type: "image" as const, src })),
    ...(project.video ? [{ type: "video" as const, src: project.video }] : []),
  ];

  const outerCardClass =
    variant === "embedded"
      ? "bg-transparent border-none shadow-none rounded-none"
      : "bg-card border-border overflow-hidden";
  const innerPadding = variant === "embedded" ? "p-1 md:p-1" : "p-1";
  const mediaPadding = variant === "embedded" ? "p-1 md:p-1" : "p-1";
  const tagsBorder =
    variant === "embedded"
      ? "border-t border-border"
      : "border-t border-border";

  useEffect(() => {
    if (!api) return;
    if (!isAutoPlaying) {
      if (autoplayTimer.current) {
        window.clearInterval(autoplayTimer.current);
        autoplayTimer.current = null;
      }
      return;
    }
    autoplayTimer.current = window.setInterval(() => {
      api.scrollNext();
    }, 3500);
    return () => {
      if (autoplayTimer.current) {
        window.clearInterval(autoplayTimer.current);
        autoplayTimer.current = null;
      }
    };
  }, [api, isAutoPlaying]);

  return (
    <Card className={outerCardClass}>
      <CardContent className="p-0">
        <div className="flex flex-col max-w-[640px] mx-auto">
          <div className={`${innerPadding} pt-4 pb-0`}>
            <h3 className="text-xl font-semibold text-foreground">
              {project.title}
            </h3>
          </div>

          {hasMedia && (
            <div className={`${mediaPadding} pt-2`}>
              <Carousel
                opts={{ loop: true }}
                setApi={(a) => setApi(a)}
                className="relative"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              >
                <CarouselContent>
                  {mediaItems.map((item, idx) => (
                    <CarouselItem key={idx}>
                      <div className="rounded-md overflow-hidden bg-muted border border-border">
                        {item.type === "video" ? (
                          <AspectRatio ratio={16 / 9}>
                            <video
                              src={item.src}
                              controls
                              className="w-full h-full object-cover"
                              onPlay={() => setIsAutoPlaying(false)}
                              onPause={() => setIsAutoPlaying(true)}
                              onEnded={() => setIsAutoPlaying(true)}
                            />
                          </AspectRatio>
                        ) : (
                          <AspectRatio ratio={16 / 9}>
                            <Image
                              src={item.src}
                              alt={`Media ${idx + 1}`}
                              className="w-full h-full object-cover"
                              width={640}
                              height={360}
                            />
                          </AspectRatio>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-6" />
                <CarouselNext className="-right-6" />
              </Carousel>
            </div>
          )}

          <div className={`${innerPadding} pt-1`}>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 cursor-pointer" onClick={handleAuthorClick}>
                <AvatarImage src={project.author.image || project.author.avatar} alt={project.author.name} />
                <AvatarFallback>
                  {project.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
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
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">
              {project.description}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-border hover:border-primary hover:text-primary bg-transparent "
                asChild
              >
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-border hover:border-primary hover:text-primary bg-transparent"
                asChild
              >
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 " />
                  Live Link
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section - Interactions */}
        <div className="px-4 py-2 max-w-[640px] mx-auto">
          <ProjectInteractions
            projectId={(project._id?.toString() || project.id?.toString() || '')}
            initialLikes={project.likeCount || 0}
            initialComments={project.comments || []}
            initialShares={project.shareCount || 0}
            authorId={project.author?.id}
            likedByUser={project.likedByUser || false}
          />
        </div>

        {/* Bottom Section - Tags */}
        <div className={`p-4 ${tagsBorder} bg-muted/30 max-w-[640px] mx-auto`}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-secondary text-secondary-foreground text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
