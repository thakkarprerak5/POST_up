"use client"

import { Github, Linkedin, Globe, Edit, Trash2, ExternalLink, RotateCcw, Clock } from "lucide-react"
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect } from 'react'

interface StudentProfileProps {
  student: {
    name: string
    username: string
    avatar: string
    bannerImage?: string
    bannerColor?: string
    course: string
    branch: string
    bio: string
    skills: string[]
    socialLinks: {
      github?: string
      linkedin?: string
      portfolio?: string
    }
    projects: {
      id: number
      title: string
      image: string
      tags: string[]
    }[]
    uploadedProjects?: {
      _id: string
      id: string
      title: string
      description: string
      tags: string[]
      images: string[]
      githubUrl?: string
      liveUrl?: string
      createdAt: string
      likeCount: number
      commentCount: number
    }[]
    joinedDate: string
    location?: string
    email: string
  }
  isOwner?: boolean
}

export function StudentProfile({ student, isOwner = false }: StudentProfileProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [deletedProjects, setDeletedProjects] = useState<any[]>([]);
  const [showDeletedProjects, setShowDeletedProjects] = useState(false);

  // Fetch deleted projects when component mounts
  useEffect(() => {
    if (isOwner) {
      fetchDeletedProjects();
    }
  }, [isOwner]);

  const fetchDeletedProjects = async () => {
    try {
      const response = await fetch('/api/projects/deleted');
      if (response.ok) {
        const projects = await response.json();
        setDeletedProjects(projects);
      }
    } catch (error) {
      console.error('Error fetching deleted projects:', error);
    }
  };

  const formatTimeRemaining = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${(hours % 24) !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  const handleEditProject = (projectId: string) => {
    router.push(`/projects/${projectId}/edit`);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? You can restore it within 24 hours.')) {
      return;
    }

    setIsDeleting(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      const result = await response.json();
      alert(result.message || 'Project deleted successfully!');
      
      // Refresh the page and fetch deleted projects
      router.refresh();
      fetchDeletedProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to restore this project?')) {
      return;
    }

    setIsRestoring(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restore project');
      }

      const result = await response.json();
      alert(result.message || 'Project restored successfully!');
      
      // Refresh the page and fetch deleted projects
      router.refresh();
      fetchDeletedProjects();
    } catch (error) {
      console.error('Error restoring project:', error);
      alert((error as Error).message || 'Failed to restore project. Please try again.');
    } finally {
      setIsRestoring(null);
    }
  };
  return (
    <div className="space-y-6">
      {/* Profile Header Card with Banner */}
      <Card className="bg-card border-border overflow-hidden">
        {/* Banner */}
        <div 
          className="h-32 w-full relative"
          style={{
            backgroundColor: student.bannerImage ? 'transparent' : (student.bannerColor || '#3b82f6'),
            backgroundImage: student.bannerImage ? `url(${student.bannerImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Test color block */}
          {!student.bannerImage && (
            <div 
              className="absolute inset-0"
              style={{ backgroundColor: student.bannerColor || '#3b82f6' }}
            />
          )}
          {!student.bannerImage && !student.bannerColor && (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No Banner</span>
            </div>
          )}
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-center gap-4 -mt-12">
            <div className="relative">
              <Image
                src={student.avatar || "/placeholder.svg"}
                alt={student.name}
                width={190}
                height={190}
                className="rounded-full object-cover border-2 border-border bg-background"
              />
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute -bottom-4 -right-2 rounded-full w-8 h-8 p-0 bg-background"
                  onClick={() => router.push('/profile/edit')}
                  title="Edit profile"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
              <p className="text-sm text-muted-foreground">{student.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                📅 Joined {student.joinedDate}
              </p>
            </div>
          </div>
          {student.bio && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{student.bio}</p>
            </div>
          )}
          {/* Social Links */}
          <div className="flex gap-3 mt-4">
            {student.socialLinks.github && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => window.open(student.socialLinks.github, '_blank')}
              >
                <Github className="h-4 w-4" />
              </Button>
            )}
            {student.socialLinks.linkedin && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => window.open(student.socialLinks.linkedin, '_blank')}
              >
                <Linkedin className="h-4 w-4" />
              </Button>
            )}
            {student.socialLinks.portfolio && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => window.open(student.socialLinks.portfolio, '_blank')}
              >
                <Globe className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Course / Branch */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Education</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{student.course}</p>
              <p className="text-sm text-muted-foreground">{student.branch}</p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="bg-secondary text-secondary-foreground">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bio & Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{student.bio}</p>
            </CardContent>
          </Card>

          {/* Projects Uploaded */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 flex flex-row justify-between items-center">
              <CardTitle className="text-lg">
                Projects Uploaded ({(student.uploadedProjects?.length || 0) + (student.projects?.length || 0)})
              </CardTitle>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.push('/upload')}
                >
                  <Edit className="h-4 w-4" />
                  Upload New
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {/* Show uploaded projects first */}
              {student.uploadedProjects && student.uploadedProjects.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">Recently Uploaded</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {student.uploadedProjects.map((project) => (
                      <div
                        key={project._id || project.id}
                        className="group rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors"
                      >
                        <div className="aspect-video relative bg-muted">
                          <Image
                            src={project.images?.[0] || "/placeholder.svg"}
                            alt={project.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-foreground flex-1">{project.title}</h4>
                            {isOwner && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditProject(project._id || project.id)}
                                  title="Edit project"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteProject(project._id || project.id)}
                                  disabled={isDeleting === (project._id || project.id)}
                                  title="Delete project"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{project.description}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {project.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                            <div className="flex gap-3">
                              <span>❤️ {project.likeCount}</span>
                              <span>💬 {project.commentCount}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={() => router.push(`/projects/${project._id || project.id}`)}
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </Button>
                            {project.githubUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => window.open(project.githubUrl, '_blank')}
                              >
                                <Github className="h-3 w-3" />
                              </Button>
                            )}
                            {project.liveUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => window.open(project.liveUrl, '_blank')}
                              >
                                <Globe className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show legacy profile projects */}
              {student.projects && student.projects.length > 0 && (
                <div>
                  {student.uploadedProjects && student.uploadedProjects.length > 0 && (
                    <h4 className="font-medium text-foreground mb-3">Other Projects</h4>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {student.projects.map((project) => (
                      <div
                        key={project.id}
                        className="group rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <div className="aspect-video relative bg-muted">
                          <Image
                            src={project.image || "/placeholder.svg"}
                            alt={project.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-foreground mb-2">{project.title}</h4>
                          <div className="flex flex-wrap gap-1">
                            {project.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No projects message */}
              {(!student.uploadedProjects || student.uploadedProjects.length === 0) && 
               (!student.projects || student.projects.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No projects uploaded yet.</p>
                  {isOwner && (
                    <Button onClick={() => router.push('/upload')}>
                      Upload Your First Project
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deleted Projects Section - Only for owners */}
          {isOwner && deletedProjects.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-orange-600">
                    Deleted Projects ({deletedProjects.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeletedProjects(!showDeletedProjects)}
                  >
                    {showDeletedProjects ? 'Hide' : 'Show'} Deleted
                  </Button>
                </div>
              </CardHeader>
              {showDeletedProjects && (
                <CardContent>
                  <div className="space-y-3">
                    {deletedProjects.map((project) => (
                      <div
                        key={project._id || project.id}
                        className="border border-orange-200 bg-orange-50/50 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">{project.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-orange-600">
                              <Clock className="h-4 w-4" />
                              <span>
                                {formatTimeRemaining(project.timeRemaining)} remaining to restore
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleRestoreProject(project._id || project.id)}
                            disabled={isRestoring === (project._id || project.id)}
                          >
                            {isRestoring === (project._id || project.id) ? (
                              <RotateCcw className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Restore
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Deleted on {new Date(project.deletedAt).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {project.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <strong>Note:</strong> Projects can be restored within 24 hours of deletion. 
                      After that, they will be permanently deleted.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
