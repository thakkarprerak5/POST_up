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
  params: { id: string };
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
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { data: session } = useSession();
  const [project, setProject] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${params.id}`);
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

    fetchProject();
  }, [params.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user?.email) {
      toast({
        title: 'Error',
        description: 'Please sign in and enter a comment',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/projects/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const { comment } = await response.json();
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [...prev.comments, comment]
        };
      });
      setNewComment('');
      toast({
        title: 'Success',
        description: 'Comment added'
      });
    } catch (error: any) {
      console.error('Comment error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add comment',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingComment(false);
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
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">{project.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link href={`/profile/${project.author._id}`}>
              {project.author.avatar && (
                <Image
                  src={project.author.avatar}
                  alt={project.author.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="hover:underline">{project.author.name}</span>
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
            projectId={project._id}
            initialLikes={project.likeCount}
            initialComments={project.comments.length}
            initialShares={project.shareCount}
            initialLiked={project.likes.includes(session?.user?.email || '')}
          />
        </Card>

        {/* Comments Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Comments ({project.comments.length})</h2>

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
            {project.comments.length === 0 ? (
              <p className="text-muted-foreground">No comments yet. Be the first!</p>
            ) : (
              project.comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {comment.userAvatar && (
                      <Image
                        src={comment.userAvatar}
                        alt={comment.userName}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">{comment.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
