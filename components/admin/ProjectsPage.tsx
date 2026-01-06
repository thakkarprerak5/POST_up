'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  FolderOpen, 
  Eye,
  Trash2,
  RotateCcw,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Project {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  images?: string[];
  githubUrl?: string;
  liveUrl?: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  likes: string[];
  likeCount: number;
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    createdAt: string;
  }>;
  shares: string[];
  shareCount: number;
  createdAt: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  restoreAvailableUntil?: string;
}

interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const isSuperAdmin = session?.user?.role === 'super_admin';

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter, pagination.page]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        ...(search && { search })
      });

      const response = await fetch(`/api/admin/projects?${params}`);
      if (response.ok) {
        const data: ProjectsResponse = await response.json();
        setProjects(data.projects);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectAction = async (projectId: string, action: 'delete' | 'restore' | 'permanent_delete') => {
    try {
      let url = `/api/admin/projects/${projectId}`;
      let method = 'DELETE';

      if (action === 'restore') {
        url = `/api/admin/projects/${projectId}/restore`;
        method = 'PUT';
      } else if (action === 'permanent_delete') {
        url = `/api/admin/projects/${projectId}/permanent`;
        method = 'DELETE';
      }

      const response = await fetch(url, { method });
      if (response.ok) {
        fetchProjects(); // Refresh the list
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Failed to perform project action:', error);
    }
  };

  const getStatusColor = (project: Project) => {
    if (project.isDeleted) {
      const restoreExpired = project.restoreAvailableUntil && 
        new Date() > new Date(project.restoreAvailableUntil);
      return restoreExpired ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (project: Project) => {
    if (project.isDeleted) {
      const restoreExpired = project.restoreAvailableUntil && 
        new Date() > new Date(project.restoreAvailableUntil);
      return restoreExpired ? 'Permanently Deleted' : 'Soft Deleted';
    }
    return 'Active';
  };

  const canRestore = (project: Project) => {
    return project.isDeleted && 
           project.restoreAvailableUntil && 
           new Date() <= new Date(project.restoreAvailableUntil);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Project Moderation</h1>
        <p className="text-gray-600 mt-2">
          Manage and moderate all platform projects
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="all">All Projects</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>Projects ({pagination.total})</CardTitle>
          <CardDescription>
            Showing {projects.length} of {pagination.total} projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{project.title}</h3>
                        <Badge className={getStatusColor(project)}>
                          {getStatusText(project)}
                        </Badge>
                        {project.isDeleted && project.restoreAvailableUntil && (
                          <Badge variant="outline" className="text-xs">
                            Expires: {new Date(project.restoreAvailableUntil).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{project.author.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                        {project.isDeleted && project.deletedAt && (
                          <div className="flex items-center space-x-1">
                            <Trash2 className="h-3 w-3 text-red-500" />
                            <span>Deleted {new Date(project.deletedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3" />
                          <span>{project.likeCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{project.comments.length}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Share2 className="h-3 w-3" />
                          <span>{project.shareCount}</span>
                        </div>
                      </div>
                      {project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                          {project.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{project.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProject(project)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    {!project.isDeleted ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProjectAction(project._id, 'delete')}
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    ) : (
                      <>
                        {canRestore(project) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProjectAction(project._id, 'restore')}
                            className="border-green-600 text-green-600 hover:bg-green-50"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProjectAction(project._id, 'permanent_delete')}
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Permanent Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{selectedProject.title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProject(null)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedProject.author.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Badge className={getStatusColor(selectedProject)}>
                    {getStatusText(selectedProject)}
                  </Badge>
                </div>

                <p className="text-gray-700">{selectedProject.description}</p>

                {selectedProject.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center justify-center space-x-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="font-semibold">{selectedProject.likeCount}</span>
                    </div>
                    <p className="text-xs text-gray-600">Likes</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center justify-center space-x-1">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">{selectedProject.comments.length}</span>
                    </div>
                    <p className="text-xs text-gray-600">Comments</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center justify-center space-x-1">
                      <Share2 className="h-4 w-4 text-green-500" />
                      <span className="font-semibold">{selectedProject.shareCount}</span>
                    </div>
                    <p className="text-xs text-gray-600">Shares</p>
                  </div>
                </div>

                {(selectedProject.githubUrl || selectedProject.liveUrl) && (
                  <div>
                    <h3 className="font-medium mb-2">Links</h3>
                    <div className="space-y-2">
                      {selectedProject.githubUrl && (
                        <a 
                          href={selectedProject.githubUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          GitHub Repository
                        </a>
                      )}
                      {selectedProject.liveUrl && (
                        <a 
                          href={selectedProject.liveUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm block"
                        >
                          Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {selectedProject.isDeleted && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        This project is deleted
                      </span>
                    </div>
                    {selectedProject.deletedAt && (
                      <p className="text-xs text-yellow-700 mt-1">
                        Deleted on: {new Date(selectedProject.deletedAt).toLocaleDateString()}
                      </p>
                    )}
                    {selectedProject.restoreAvailableUntil && (
                      <p className="text-xs text-yellow-700">
                        Restore available until: {new Date(selectedProject.restoreAvailableUntil).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  {!selectedProject.isDeleted ? (
                    <Button
                      onClick={() => handleProjectAction(selectedProject._id, 'delete')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Project
                    </Button>
                  ) : (
                    <>
                      {canRestore(selectedProject) && (
                        <Button
                          onClick={() => handleProjectAction(selectedProject._id, 'restore')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore Project
                        </Button>
                      )}
                      {isSuperAdmin && (
                        <Button
                          onClick={() => handleProjectAction(selectedProject._id, 'permanent_delete')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Permanent Delete
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
