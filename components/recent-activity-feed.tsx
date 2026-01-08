'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface RecentActivity {
  _id: string;
  type: 'project_upload' | 'comment' | 'like' | 'follow';
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  project?: {
    _id: string;
    title: string;
  };
  timestamp: string;
  description: string;
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/activity/recent?limit=10');
        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (error) {
        console.error('Failed to fetch recent activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading activities...</p>
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-sm text-muted-foreground">No recent activities</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity._id} className="flex gap-3 pb-4 border-b last:border-b-0">
            {/* Profile Photo - Same logic as project card */}
            <Link href={`/profile/${activity.user._id}`}>
              <Avatar className="w-10 h-10">
                {/* Check if user has actual uploaded photo (not placeholder) */}
                {activity.user.avatar && activity.user.avatar !== '/placeholder-user.jpg' ? (
                  <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                ) : (
                  <AvatarFallback>
                    {activity.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/profile/${activity.user._id}`}
                  className="font-medium text-sm hover:underline"
                >
                  {activity.user.name}
                </Link>
                <Badge variant="outline" className="text-xs">
                  {activity.type === 'project_upload' && 'Uploaded Project'}
                  {activity.type === 'comment' && 'Commented'}
                  {activity.type === 'like' && 'Liked'}
                  {activity.type === 'follow' && 'Started Following'}
                </Badge>
              </div>
              {activity.project && (
                <Link
                  href={`/projects/${activity.project._id}`}
                  className="text-sm text-muted-foreground hover:text-primary line-clamp-1"
                >
                  {activity.description}
                </Link>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(activity.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
