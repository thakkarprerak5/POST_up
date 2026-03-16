"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClickableProfilePhoto } from "@/components/clickable-profile-photo";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Share2,
  AlertTriangle,
  Send
} from "lucide-react";
import { RankBadge } from "@/components/ui/rank-badge";
import PostOptionsMenu from "@/components/PostOptionsMenu";
import { CommentItem } from "@/components/CommentItem";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image?: string;
    author: {
      id: string;
      name: string;
      photo?: string;
      image?: string;
      role: string;
      account_status?: 'ACTIVE' | 'SOFT_BANNED' | 'PROPER_BANNED';
    };
    likeCount: number;
    commentCount: number;
    createdAt: string;
    likedByUser?: boolean;
    type?: 'post' | 'project';
    title?: string;
    likes?: string[];
    tags?: string[];
  };
  onProfilePhotoClick: (imageUrl: string, name: string) => void;
  currentUser?: {
    id: string;
    fullName: string;
    photo?: string;
    image?: string;
  };
  rank?: number;
  showTrendingIndicator?: boolean;
}

interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  author?: {
    id: string;
    fullName: string;
    photo?: string;
  };
}

export function PostCard({ post, onProfilePhotoClick, currentUser, rank, showTrendingIndicator }: PostCardProps) {
  const router = useRouter();

  const initialLikedState = currentUser && post.likes?.includes(currentUser.id);
  const [isLiked, setIsLiked] = useState(initialLikedState || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const formatTimeAgo = (timestamp: string) => {
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
      return 'some time ago';
    }
  };

  const handleProfileClick = () => {
    router.push(`/profile/${post.author.id}`);
  };

  const handleLike = async () => {
    if (!currentUser || isLiking) return;

    setIsLiking(true);
    try {
      const response = await fetch(`/api/like-post/${post.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          action: 'like'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!currentUser || !commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          content: commentText.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCommentText("");
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    const confirmed = window.confirm('Are you sure you want to delete this comment?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id
        })
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          content: newContent.trim()
        })
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, post.id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.author.name}`,
        text: post.content,
        url: `${window.location.origin}/posts/${post.id}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
    }
  };

  const authorAccountStatus = post.author.account_status || 'ACTIVE';
  const isAuthorBanned = authorAccountStatus === 'SOFT_BANNED' || authorAccountStatus === 'PROPER_BANNED';

  if (isAuthorBanned) {
    return (
      <Card className="border-0 shadow-sm bg-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="rounded-full bg-gray-200 p-3">
                  <AlertTriangle className="h-8 w-8 text-gray-500" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Content Unavailable</p>
                <p className="text-xs text-gray-500 mt-1">
                  This user is under administrative review.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      data-reportable="true"
      data-reportable-type="project"
      data-reportable-id={post.id}
      data-reported-user-id={post.author.id}
      data-reportable-title={post.title || 'Post'}
      data-reportable-description={post.content.substring(0, 100)}
      data-reportable-author={post.author.name}
      data-reportable-content={post.content}
    >
      <Card className="border border-border/40 ring-1 ring-border/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 ease-out bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ClickableProfilePhoto
                imageUrl={post.author.photo || post.author.image}
                name={post.author.name}
                size="md"
                className="h-10 w-10 ring-2 ring-background hover:ring-primary/20 transition-all duration-200"
                onPhotoClick={onProfilePhotoClick}
              />
              <div>
                <button
                  onClick={handleProfileClick}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors duration-200"
                >
                  {post.author.name}
                </button>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {post.author.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    • {formatTimeAgo(post.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <PostOptionsMenu
              projectId={post.id}
              className="ml-2"
            />
          </div>

          <div className="mb-4">
            {post.type === 'project' && post.title && (
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {post.title}
              </h3>
            )}
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, index) => (
                <button
                  key={`${tag}-${index}`}
                  onClick={() => router.push(`/feed/category/${encodeURIComponent(tag)}`)}
                  className="bg-secondary/60 hover:bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {post.image && (
            <div className="mb-4 rounded-xl overflow-hidden border border-border/50 relative">
              <Image
                src={post.image}
                alt="Post image"
                width={600}
                height={400}
                className="w-full object-cover"
              />
              {rank && (
                <div className="absolute top-3 left-3">
                  <RankBadge rank={rank} />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!currentUser || isLiking}
                className={`h-8 px-3 gap-2 transition-all duration-200 ${isLiked
                  ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                  : 'hover:text-primary hover:bg-primary/5'
                  }`}
              >
                <Heart
                  className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`}
                />
                <span className="text-xs font-medium">{likeCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="h-8 px-3 gap-2 hover:text-primary hover:bg-primary/5 transition-all duration-200"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs font-medium">{post.commentCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 px-3 gap-2 hover:text-primary hover:bg-primary/5 transition-all duration-200"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-border/50">
              {currentUser && (
                <div className="flex gap-2 mb-4">
                  <ClickableProfilePhoto
                    imageUrl={currentUser.image || currentUser.photo}
                    avatar="/placeholder-user.jpg"
                    name={currentUser.fullName}
                    size="sm"
                    className="h-8 w-8"
                    onPhotoClick={onProfilePhotoClick}
                  />
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                    />
                    <Button
                      size="sm"
                      onClick={handleComment}
                      disabled={!commentText.trim() || isCommenting}
                      className="h-8 px-3"
                    >
                      {isCommenting ? (
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment, index) => {
                    const commentId = comment.id || `comment-${index}`;
                    return (
                      <CommentItem
                        key={`${commentId}-${index}`}
                        comment={comment}
                        index={index}
                        currentUser={currentUser}
                        onProfilePhotoClick={onProfilePhotoClick}
                        onDelete={handleDeleteComment}
                        onEdit={handleEditComment}
                        editingCommentId={editingCommentId}
                        setEditingCommentId={setEditingCommentId}
                        reportable={{
                          type: 'comment',
                          id: commentId,
                          reportedUserId: comment.userId || comment.author?.id || '',
                          content: comment.content,
                          authorName: comment.author?.fullName || 'Unknown User'
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
