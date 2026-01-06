'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AlertCircle, ExternalLink, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProjectInteractions } from '@/components/project-interactions';
import { useToast } from '@/hooks/use-toast';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

interface IProject {
  _id: string;
  title: string;
  description: string;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  images: string[];
  tags: string[];
  github?: string;
  liveUrl?: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    createdAt: string;
  }>;
  shareCount: number;
  likes: string[];
  likedByUser?: boolean;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { data: session } = useSession();
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { toast } = useToast();
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const getProjectId = async () => {
      const resolvedParams = await params;
      setProjectId(resolvedParams.id);
    };
    
    getProjectId();
  }, [params]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error('Failed to load project');
        }
        const data = await response.json();
        setProject(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load project');
        console.error('Project fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.email) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to post a comment',
        variant: 'destructive'
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Comment cannot be empty',
        description: 'Please enter your comment',
        variant: 'destructive'
      });
      return;
    }

    if (!project) return;

    setIsSubmittingComment(true);
    
    try {
      const response = await fetch(`/api/projects/${project._id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: newComment,
          userId: session.user.id || session.user.email,
          userName: session.user.name || session.user.email
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add comment');
      }

      // Update the UI with the new comment
      setProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [data.comment, ...(prev.comments || [])]
        };
      });
      
      // Clear the comment input
      setNewComment('');
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Your comment has been posted!',
        variant: 'default'
      });
      
    } catch (error: any) {
      console.error('Error adding comment:', error);
      
      // Show error message
      toast({
        title: 'Error',
        description: error.message || 'Failed to add comment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    if (!project) return;

    setDeletingCommentId(commentId);
    
    try {
      const response = await fetch(`/api/projects/${project._id}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete comment');
      }

      // Update the UI by removing the deleted comment
      setProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.filter(comment => comment.id !== commentId)
        };
      });
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
        variant: 'default'
      });
      
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      
      // Show error message
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Project not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isAuthor = session?.user?.email === project.author.email;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div 
          className="mb-6"
          data-reportable="true"
          data-reportable-type="project"
          data-reportable-id={project._id}
          data-reported-user-id={project.author._id}
          data-reportable-title={project.title}
          data-reportable-description={project.description}
          data-reportable-author={project.author.name}
        >
          <h1 className="text-4xl font-bold mb-2">{project.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link 
              href={`/profile/${project.author._id}`}
              className="flex items-center gap-2 hover:underline"
            >
              {project.author.avatar && (
                <Image
                  src={project.author.avatar}
                  alt={project.author.name}
                  width={24}
                  height={24}
                  className="rounded-full w-6 h-6"
                />
              )}
              <span>{project.author.name}</span>
            </Link>
            <span>•</span>
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Images */}
        {project.images.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.images.slice(0, 4).map((image, idx) => (
              <div key={idx} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src={image}
                  alt={`${project.title} ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold mb-3">About</h2>
          <p className="text-foreground whitespace-pre-wrap">{project.description}</p>
        </Card>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Links */}
        <div className="mb-6 flex gap-3">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              <Github size={18} />
              GitHub
              <ExternalLink size={14} />
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              View Live
              <ExternalLink size={14} />
            </a>
          )}
          {isAuthor && (
            <Link
              href={`/upload?edit=${project._id}`}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"
            >
              Edit Project
            </Link>
          )}
        </div>

        {/* Interactions */}
        <Card className="mb-6 p-6">
          <ProjectInteractions
            projectId={project._id?.toString() || ''}
            initialLikes={project.likeCount || 0}
            initialComments={project.comments || []}
            initialShares={project.shareCount || 0}
            likedByUser={project.likedByUser || false}
            authorId={project.author._id}
            githubUrl={project.github || ""}
            liveUrl={project.liveUrl || ""}
            images={project.images || []}
          />
        </Card>

        {/* Comments Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Comments {project.comments?.length ? `(${project.comments.length})` : ''}
          </h2>

          {session?.user ? (
            <form onSubmit={handleAddComment} className="mb-6 pb-6 border-b">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-3 border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                disabled={isSubmittingComment}
              />
              <div className="mt-3 flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          ) : (
            <Alert className="mb-6">
              <AlertDescription>
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
                {' '}to comment
              </AlertDescription>
            </Alert>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {!project.comments || project.comments.length === 0 ? (
              <p className="text-muted-foreground">No comments yet. Be the first!</p>
            ) : (
              project.comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="p-4 bg-secondary/30 rounded-lg relative group"
                  data-reportable="true"
                  data-reportable-type="comment"
                  data-reportable-id={comment.id}
                  data-reported-user-id={comment.userId}
                  data-reportable-content={comment.text}
                  data-reportable-author={comment.userName}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {comment.userAvatar ? (
                        <Image
                          src={comment.userAvatar}
                          alt={comment.userName}
                          width={32}
                          height={32}
                          className="rounded-full w-8 h-8 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{comment.userName || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {(session?.user?.id === comment.userId || isAuthor) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 -m-1"
                        title="Delete comment"
                      >
                        {deletingCommentId === comment.id ? 'Deleting...' : '×'}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground pl-10">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}