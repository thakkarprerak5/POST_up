'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface FollowButtonProps {
  userId: string;
  userEmail?: string;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  userEmail,
  initialFollowing = false,
  onFollowChange
}: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Don't show follow button for own profile
  if (session?.user?.email === userEmail) {
    return null;
  }

  const handleFollow = async () => {
    if (!session?.user?.email) {
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to update follow status');
      }

      const { following } = await response.json();
      setIsFollowing(following);
      onFollowChange?.(following);

      toast({
        title: following ? 'Following' : 'Unfollowed',
        description: following ? 'You are now following this user' : 'You unfollowed this user'
      });
    } catch (error: any) {
      console.error('Follow error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update follow status',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      variant={isFollowing ? 'secondary' : 'default'}
    >
      {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
