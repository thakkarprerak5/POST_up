'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface ProjectInteractionsProps {
  projectId: string;
  initialLikes: number;
  initialComments: number;
  initialShares: number;
  initialLiked?: boolean;
  initialShared?: boolean;
}

export function ProjectInteractions({
  projectId,
  initialLikes,
  initialComments,
  initialShares,
  initialLiked = false,
  initialShared = false
}: ProjectInteractionsProps) {
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [commentCount, setCommentCount] = useState(initialComments);
  const [shareCount, setShareCount] = useState(initialShares);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isShared, setIsShared] = useState(initialShared);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [isLoadingShare, setIsLoadingShare] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    // Validate projectId is a proper MongoDB ObjectId (24 hex chars)
    if (!projectId || !/^[0-9a-f]{24}$/i.test(String(projectId))) {
      toast({
        title: 'Sample Project',
        description: 'This is a sample project. Upload a real project to like it!',
        variant: 'destructive'
      });
      return;
    }

    setIsLoadingLike(true);
    try {
      const endpoint = `/api/projects/${projectId}/like`;
      console.log('Calling like endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Like response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Like endpoint error:', response.status, errorData);
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
      console.error('Like error:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to like project',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingLike(false);
    }
  };

  const handleShare = async () => {
    // Validate projectId is a proper MongoDB ObjectId (24 hex chars)
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
      const response = await fetch(`/api/projects/${projectId}/share`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to share project');
      }

      const { shared, shareCount: newCount } = await response.json();
      setIsShared(shared);
      setShareCount(newCount);
      
      if (shared) {
        toast({
          title: 'Shared!',
          description: 'Project shared successfully'
        });
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

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={isLoadingLike}
        className={isLiked ? 'text-red-500' : ''}
      >
        <Heart
          size={16}
          className={`mr-1 ${isLiked ? 'fill-current' : ''}`}
        />
        <span>{likeCount}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="cursor-default hover:bg-transparent"
      >
        <MessageCircle size={16} className="mr-1" />
        <span>{commentCount}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        disabled={isLoadingShare}
        className={isShared ? 'text-blue-500' : ''}
      >
        <Share2
          size={16}
          className={`mr-1 ${isShared ? 'fill-current' : ''}`}
        />
        <span>{shareCount}</span>
      </Button>
    </div>
  );
}
