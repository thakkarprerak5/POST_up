'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Award,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Tag,
  Heart,
  MessageCircle,
  Loader2,
  FileText
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Function to generate thumbnail from first page of PDF
const generateProposalThumbnail = async (proposalFileUrl: string): Promise<string | null> => {
  try {
    console.log('🖼️ Attempting to generate thumbnail for:', proposalFileUrl);

    // Use uploads path which will be rewritten to proxy API by Next.js
    const proxyUrl = `/uploads/${proposalFileUrl}`;
    console.log('🔍 Using uploads URL (will be rewritten):', proxyUrl);

    // Check if it's a PDF file
    if (proposalFileUrl.toLowerCase().endsWith('.pdf')) {
      console.log('📄 PDF detected, using PDF icon instead of image loading');
      // For PDF files, return a PDF icon or placeholder instead of trying to render as image
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxNjBWMTQwSDgwVjYwWiIgZmlsbD0iI0U1NDQ0NCIvPgo8cGF0aCBkPSJNOTAgNzBIMTQwVjgwSDkwVjcwWiIgZmlsbD0id2hpdGUiLz4KPHA+PHNwYW4gc3R5bGU9ImZvbnQtZmFtaWx5OiBBcmlhbCwgc2Fucy1zZXJpZjsgZm9udC1zaXplOiAxNHB4OyBmaWxsOiAjNjY2NjY2OyB0ZXh0LWFuY2hvcjogbWlkZGxlOyBkaXNwbGF5OiBibG9jazsgbWFyZ2luLXRvcDogNjBweDsiPlBERiBEb2N1bWVudDwvc3Bhbj48L3A+Cjwvc3ZnPgo=';
    }

    // For image files, try to load them as before
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = 300;
    canvas.height = 200;

    // Create image element
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';

    return new Promise((resolve, reject) => {
      // Set timeout for image loading
      const timeout = setTimeout(() => {
        reject(new Error('Image loading timeout - could be CORS or network issue'));
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        console.log('✅ Image loaded successfully, generating thumbnail');

        // Draw the image onto the canvas
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob and create data URL
        canvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            reject(new Error('Failed to generate thumbnail'));
            return;
          }

          const thumbnailUrl = URL.createObjectURL(blob);
          console.log('✅ Thumbnail generated successfully');
          resolve(thumbnailUrl);

          // Clean up after a short delay
          setTimeout(() => {
            URL.revokeObjectURL(thumbnailUrl);
          }, 1000);
        });
      };

      img.onerror = () => {
        clearTimeout(timeout);
        console.error('❌ Failed to load image:', proposalFileUrl);
        reject(new Error(`Failed to load image: ${proposalFileUrl}`));
      };

      img.src = proxyUrl;
    });
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
};

interface SupervisedProject {
  id: string;
  title: string;
  description: string;
  image: string;
  images: string[];
  tags: string[];
  studentName: string;
  studentEmail: string;
  studentPhoto: string;
  mentorId: string;
  invitationId: string;
  acceptedAt: string;
  createdAt: string;
  proposalFile?: string;
  proposalThumbnail?: string; // Add thumbnail field
  likeCount: number;
  commentsCount: number;
  permissions: {
    canEdit: boolean;
    canUpdateDescription: boolean;
    canManageFiles: boolean;
    canDelete: boolean;
  };
}

interface SupervisedProjectsProps {
  mentorId: string;
  isOwner?: boolean;
  refreshKey?: number; // External refresh trigger
}

export function SupervisedProjects({ mentorId, isOwner = false, refreshKey }: SupervisedProjectsProps) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<SupervisedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({}); // Store generated thumbnails
  const router = useRouter();

  // Check if current user can manage these projects
  const canManageProjects = isOwner || session?.user?.id === mentorId;

  useEffect(() => {
    fetchSupervisedProjects();
  }, [mentorId, refreshKey]); // Added refreshKey as dependency

  const fetchSupervisedProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/mentors/supervised-projects?mentorId=${mentorId}&t=${Date.now()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch supervised projects: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Generate thumbnails for projects with proposal files
        const projectsWithThumbnails = await Promise.all(
          data.projects.map(async (project: SupervisedProject) => {
            if (project.proposalFile) {
              const thumbnail = await generateProposalThumbnail(project.proposalFile);
              return { ...project, proposalThumbnail: thumbnail };
            }
            return project;
          })
        );

        setProjects(projectsWithThumbnails);
        console.log('🔍 Supervised projects loaded:', projectsWithThumbnails.length);
      } else {
        throw new Error(data.error || 'Failed to load supervised projects');
      }
    } catch (error) {
      console.error('Failed to fetch supervised projects:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = (projectId: string) => {
    router.push(`/projects/${projectId}/edit`);
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleManageFiles = (projectId: string) => {
    router.push(`/projects/${projectId}/files`);
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-border border-gray-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Supervised Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Loading supervised projects...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gray-800 border-border border-gray-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Supervised Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">Error loading supervised projects</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchSupervisedProjects} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-border border-gray-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Supervised Projects ({projects.length})
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setLoading(true);
            fetchSupervisedProjects();
          }}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No supervised projects yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              {canManageProjects
                ? "Projects will appear here when you accept student invitations or when admins assign you to projects."
                : "This mentor hasn't accepted any project invitations yet."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={`supervised-project-${project.id}`}
                className="group border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-200"
              >
                {/* Project Image */}
                <div className="aspect-video relative bg-muted">
                  {project.proposalThumbnail ? (
                    <Image
                      src={project.proposalThumbnail}
                      alt={`${project.title || 'Project'} thumbnail`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Image
                      src={project.image}
                      alt={project.title || "Project Image"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  {/* Accepted Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="bg-green-600 text-white text-xs">
                      Supervised
                    </Badge>
                  </div>
                </div>

                {/* Project Content */}
                <div className="p-4">
                  {/* Title and Actions */}
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground flex-1 mr-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </h4>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProject(project.id)}
                        className="h-8 w-8 p-0"
                        title="View project"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManageProjects && project.permissions.canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProject(project.id)}
                          className="h-8 w-8 p-0"
                          title="Edit project"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {project.description}
                  </p>

                  {/* Proposal File */}
                  {project.proposalFile && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-muted-foreground">Proposal:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(project.proposalFile, '_blank')}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Proposal
                      </Button>
                      {/* Proposal Thumbnail */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => project.proposalFile && generateProposalThumbnail(project.proposalFile)}
                        className="text-green-600 border-green-200 hover:bg-green-50 ml-2"
                        title="Generate thumbnail from first page"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Thumbnail
                      </Button>
                    </div>
                  )}

                  {/* Student Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={project.studentPhoto && project.studentPhoto.trim() ? project.studentPhoto : undefined} alt={project.studentName} />
                      <AvatarFallback className="text-xs">
                        {project.studentName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {project.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.studentEmail}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                          key={`tag-${index}-${tag}`}
                          variant="secondary"
                          className="text-xs px-2 py-0.5"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          +{project.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {project.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {project.commentsCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.acceptedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {canManageProjects && (
                      <div className="flex gap-1">
                        {project.permissions.canManageFiles && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageFiles(project.id)}
                            className="text-xs h-6 px-2"
                          >
                            Files
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
