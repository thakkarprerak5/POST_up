import { useState, useEffect, useMemo, useCallback } from 'react';
import { Heart, MessageCircle, Share2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface ProjectInteractionsProps {
  projectId: string;
  initialLikes: number;
  initialComments: any[];
  initialShares: number;
  authorId?: string;
  initialLiked?: boolean;
  initialShared?: boolean;
  likedByUser?: boolean;
  githubUrl?: string;
  liveUrl?: string;
  images?: string[];
}

interface Comment {
  id: string;
  userId: string;
  content: string;
  text?: string; // Add text field for API compatibility
  createdAt: string;
  userName?: string; // Add userName field for API compatibility
  user?: {
    name: string;
    image?: string;
  };
}

export function ProjectInteractions({
  projectId,
  initialLikes,
  initialComments,
  initialShares,
  authorId,
  initialLiked = false,
  initialShared = false,
  likedByUser = false,
  githubUrl = "",
  liveUrl = "",
  images = []
}: ProjectInteractionsProps) {
  const { data: session } = useSession();
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [shareCount, setShareCount] = useState(initialShares);
  const [isLiked, setIsLiked] = useState(likedByUser || initialLiked);
  const [isShared, setIsShared] = useState(initialShared);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [isLoadingShare, setIsLoadingShare] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const { toast } = useToast();

  // Fetch comments when modal opens
  useEffect(() => {
    if (showCommentsModal && projectId) {
      fetchComments();
    }
  }, [showCommentsModal, projectId]);

  // Sync like state when likedByUser prop changes
  useEffect(() => {
    setIsLiked(likedByUser || initialLiked);
  }, [likedByUser, initialLiked]);

  // Sync like count when initialLikes prop changes
  useEffect(() => {
    setLikeCount(initialLikes);
  }, [initialLikes]);

  // Sync comments when initialComments prop changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Sync share count when initialShares prop changes
  useEffect(() => {
    setShareCount(initialShares);
  }, [initialShares]);

  const fetchComments = async () => {
    if (!projectId || !/^[0-9a-f]{24}$/i.test(String(projectId))) {
      return;
    }

    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim() || !session?.user) return;

    if (!projectId || !/^[0-9a-f]{24}$/i.test(String(projectId))) {
      toast({
        title: 'Sample Project',
        description: 'This is a sample project. Upload a real project to comment!',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: comment.trim(), // Use 'text' field as expected by API
          userId: session.user.id,
          userName: session.user.name,
          userAvatar: session.user.image
        }),
      });
      if (response.ok) {
        const newComment = await response.json();
        // Add new comment to the local state
        setComments(prev => [{
          id: newComment.comment.id,
          userId: newComment.comment.userId,
          userName: newComment.comment.userName,
          content: newComment.comment.text, // Map text to content for consistency
          text: newComment.comment.text,
          createdAt: newComment.comment.createdAt
        }, ...prev]);
        setComment('');
        toast({
          title: 'Comment posted!',
          description: 'Your comment has been added successfully.',
        });
      } else {
        throw new Error('Failed to post comment');
      }
    } catch (error) {
      console.error('Comment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      const response = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast({
          title: 'Comment deleted',
          description: 'Your comment has been removed.',
        });
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive'
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const startEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditText(currentText);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const saveEditComment = async (commentId: string) => {
    if (!editText.trim()) {
      toast({
        title: 'Error',
        description: 'Comment cannot be empty',
        variant: 'destructive'
      });
      return;
    }
    
    await handleEditComment(commentId, editText.trim());
    setEditingCommentId(null);
    setEditText('');
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!projectId || !/^[0-9a-f]{24}$/i.test(String(projectId))) {
      toast({
        title: 'Sample Project',
        description: 'This is a sample project. Cannot edit comments.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newContent }),
      });
      if (response.ok) {
        const updatedComment = await response.json();
        // Update the comment in local state
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { 
                ...c, 
                content: updatedComment.comment.text,
                text: updatedComment.comment.text,
                updatedAt: updatedComment.comment.updatedAt
              }
            : c
        ));
        toast({
          title: 'Comment updated',
          description: 'Your comment has been edited.',
        });
      } else {
        throw new Error('Failed to update comment');
      }
    } catch (error) {
      console.error('Edit comment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment',
        variant: 'destructive'
      });
    }
  };

  const handleLike = async () => {
    if (!projectId || !/^[0-9a-f]{24}$/i.test(String(projectId))) {
      toast({
        title: 'Sample Project',
        description: 'This is a sample project. Upload a real project to like it!',
        variant: 'destructive'
      });
      return;
    }

    setIsLoadingLike(true);
    const previousLikedState = isLiked;
    const previousLikeCount = likeCount;
    
    try {
      const endpoint = `/api/projects/${projectId}/like`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to like project (${response.status})`);
      }

      const data = await response.json();
      setIsLiked(data.liked);
      setLikeCount(data.likeCount);

      toast({
        title: 'Success',
        description: data.liked ? 'Project liked!' : 'Like removed',
      });
    } catch (error) {
      // Rollback state on error
      setIsLiked(previousLikedState);
      setLikeCount(previousLikeCount);
      
      console.error('Like error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to like project',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingLike(false);
    }
  };

  const handleShare = async () => {
    if (!projectId || !/^[0-9a-f]{24}$/i.test(String(projectId))) {
      toast({
        title: 'Sample Project',
        description: 'This is a sample project. Upload a real project to share it!',
        variant: 'destructive'
      });
      return;
    }

    setIsLoadingShare(true);
    try {
      const shareUrl = `${window.location.origin}/projects/${projectId}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Check out this project',
            text: 'I found this amazing project on POST_up',
            url: shareUrl,
          });
          
          // Update share count after successful native share
          const response = await fetch(`/api/projects/${projectId}/share`, {
            method: 'POST'
          });
          
          if (response.ok) {
            const { shared, shareCount: newCount } = await response.json();
            setIsShared(shared);
            setShareCount(newCount);
          }
        } catch (error) {
          console.error('Share failed:', error);
          if ((error as any).name !== 'AbortError') {
            // User cancelled the share dialog, don't show error
            toast({
              title: 'Share failed',
              description: 'Please copy this link: ' + shareUrl,
              variant: 'destructive',
            });
          }
        }
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copied!',
          description: 'Project link copied to clipboard',
        });
        
        // Update share count after clipboard copy
        const response = await fetch(`/api/projects/${projectId}/share`, {
          method: 'POST'
        });
        
        if (response.ok) {
          const { shared, shareCount: newCount } = await response.json();
          setIsShared(shared);
          setShareCount(newCount);
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Error',
        description: 'Failed to share project',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingShare(false);
    }
  };

  const toggleCommentsModal = () => {
    setShowCommentsModal(!showCommentsModal);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
  };

  // Check if this is a sample project based on content characteristics
  // Sample projects have generic URLs and no real uploaded images
  const isSampleProject = useMemo(() => {
    const hasGenericGithubUrl = githubUrl === "https://github.com" || githubUrl === "#";
    const hasGenericLiveUrl = liveUrl === "https://example.com" || liveUrl === "#";
    const hasGenericUrls = hasGenericGithubUrl && hasGenericLiveUrl;
    
    const hasRealUploadedImages = images && images.length > 0 && 
      images.some((img: string) => img.startsWith('/uploads/'));
    
    // Sample projects have generic URLs AND no real uploaded images
    return hasGenericUrls && !hasRealUploadedImages;
  }, [githubUrl, liveUrl, images]);

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
      <button 
        onClick={handleLike}
        disabled={isLoadingLike || isSampleProject}
        className={`flex items-center gap-1 px-2 py-1 text-sm rounded-md transition-colors ${
          isLiked ? 'text-red-500' : 'hover:text-foreground'
        } ${isSampleProject ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isLiked ? 'Unlike this project' : 'Like this project'}
        title={isSampleProject ? 'Likes disabled for demo projects' : ''}
      >
        <Heart 
          className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} 
          aria-hidden="true" 
        />
        <span>{likeCount}</span>
      </button>
      
      <button 
        onClick={toggleCommentsModal}
        disabled={isSampleProject}
        className={`flex items-center gap-1 px-2 py-1 text-sm rounded-md hover:text-foreground transition-colors ${
          isSampleProject ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label="View comments"
        title={isSampleProject ? 'Comments disabled for demo projects' : ''}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        {comments.length > 0 && <span className="ml-1 text-xs">{comments.length}</span>}
      </button>
      
      <button 
        onClick={handleShare}
        className={`flex items-center gap-1 px-2 py-1 text-sm rounded-md hover:text-foreground transition-colors ${
          isSampleProject ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label="Share project"
        title={isSampleProject ? 'Sharing disabled for demo projects' : 'Share project'}
      >
        <Share2 
          className={`h-5 w-5 ${isShared ? 'text-blue-500' : ''}`} 
          aria-hidden="true" 
        />
        <span>{shareCount}</span>
      </button>

      {showCommentsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={toggleCommentsModal}
          role="dialog"
          aria-modal="true"
          id="comments-modal"
        >
          <div 
            className="bg-background rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Comments ({comments.length})</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleCommentsModal}
                className="h-8 w-8"
                aria-label="Close comments"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingComments ? (
                <div className="flex items-center justify-center h-32" aria-live="polite">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden="true" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" aria-live="polite">
                  <p>No comments yet</p>
                  <p className="text-sm mt-2">Be the first to comment!</p>
                </div>
              ) : (
                comments.map(comment => {
                  const canEdit = session?.user?.id === comment.userId || session?.user?.id === authorId;
                  // Handle both user.name and userName fields for API compatibility
                  const userName = comment.user?.name || comment.userName || 'Anonymous User';
                  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  // Handle both content and text fields for API compatibility
                  const commentContent = comment.content || comment.text || '';
                  
                  return (
                    <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {userInitials}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                          {canEdit && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditComment(comment.id, commentContent)}
                                disabled={editingCommentId === comment.id}
                                aria-label="Edit comment"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingCommentId === comment.id}
                                aria-label="Delete comment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-sm">
                          {editingCommentId === comment.id ? (
                            <div className="flex gap-2">
                              <Input
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                placeholder="Edit your comment..."
                                className="flex-1"
                                disabled={isSubmitting}
                              />
                              <Button
                                onClick={() => saveEditComment(comment.id)}
                                disabled={!editText.trim() || isSubmitting}
                                size="icon"
                              >
                                <Check2 className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={cancelEditComment}
                                variant="ghost"
                                size="icon"
                                disabled={isSubmitting}
                              >
                                <X2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <p>{commentContent}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
