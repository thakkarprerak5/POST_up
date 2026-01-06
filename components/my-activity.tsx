'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Heart, MessageCircle, Users } from 'lucide-react';

interface UserActivity {
  _id: string;
  type: 'project_upload' | 'comment' | 'like' | 'follow';
  target?: {
    _id: string;
    title?: string;
    name?: string;
  };
  timestamp: string;
  description: string;
}

interface UserProfile {
  _id: string;
  name: string;
  avatar?: string;
  username?: string;
  stats?: {
    projects: number;
    followers: number;
    following: number;
  };
}

export function MyActivity() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First get session to check if user is authenticated
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        
        if (!sessionData?.user) {
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        // Set basic profile from session immediately
        const basicProfile = {
          _id: sessionData.user.id,
          name: sessionData.user.name || 'User',
          avatar: sessionData.user.image || null,
          username: sessionData.user.email?.split('@')[0] || 'user',
          email: sessionData.user.email,
          stats: { projects: 0 }
        };
        setUserProfile(basicProfile);
        
        // Try to get detailed profile
        try {
          const profileResponse = await fetch('/api/users/me');
          if (profileResponse.ok) {
            const detailedProfile = await profileResponse.json();
            console.log('Detailed profile from API:', JSON.stringify(detailedProfile, null, 2));
            
            // Log specific fields we need
            console.log('Available fields:', Object.keys(detailedProfile));
            console.log('Name fields:', {
              name: detailedProfile.name,
              fullName: detailedProfile.fullName,
              photo: detailedProfile.photo,
              avatar: detailedProfile.avatar,
              profilePhoto: detailedProfile.profilePhoto
            });
            console.log('Stats fields:', {
              stats: detailedProfile.stats,
              followerCount: detailedProfile.followerCount,
              followingCount: detailedProfile.followingCount
            });
            
            // Map the API response to our expected format
            const mappedProfile = {
              _id: detailedProfile._id,
              name: detailedProfile.name || detailedProfile.fullName || sessionData.user.name,
              avatar: detailedProfile.photo || detailedProfile.avatar || detailedProfile.profilePhoto || detailedProfile.profile?.photo || sessionData.user.image,
              username: detailedProfile.username || sessionData.user.email?.split('@')[0] || 'user',
              email: detailedProfile.email || sessionData.user.email,
              profile: detailedProfile.profile || {},
              stats: {
                projects: detailedProfile.stats?.projects || 0
              }
            };
            
            console.log('Mapped profile:', JSON.stringify(mappedProfile, null, 2));
            setUserProfile(mappedProfile);
          }
        } catch (profileError) {
          console.log('Profile API error, using session data:', profileError);
        }
        
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading your profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userProfile) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">Please sign in to view your profile</p>
            <Button size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* User Profile Section */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={userProfile.avatar} alt={userProfile.name || "User"} />
            <AvatarFallback>
              {(userProfile.name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{userProfile.name || "User"}</h3>
            <p className="text-xs text-muted-foreground">
              @{userProfile.username || (userProfile.name || "user").toLowerCase().replace(/\s+/g, '')}
            </p>
            {userProfile.email && (
              <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
            )}
          </div>
        </div>

        {/* Additional Profile Details */}
        {userProfile.profile && (
          <div className="space-y-2">
            {userProfile.profile.bio && (
              <p className="text-xs text-muted-foreground">
                {userProfile.profile.bio.replace(/Data scientist|data scientist|Data Scientist/gi, '').trim()}
              </p>
            )}
            {userProfile.profile.location && (
              <p className="text-xs text-muted-foreground">📍 {userProfile.profile.location}</p>
            )}
            {userProfile.profile.website && (
              <a 
                href={userProfile.profile.website} 
                className="text-xs text-primary hover:underline block"
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗 {userProfile.profile.website}
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
