'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw } from 'lucide-react';
import { ClickableProfilePhoto } from '@/components/clickable-profile-photo';

interface RecentActivity {
  _id: string;
  type: 'project_upload' | 'comment' | 'like' | 'follow' | 'mentor_assignment';
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

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/activity/recent?limit=10&t=${Date.now()}`);
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

  useEffect(() => {
    fetchActivities();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading activities...</p>
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6 border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-center text-sm text-muted-foreground">No recent activities</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <button
          onClick={fetchActivities}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded-md transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity._id} className="flex gap-3 pb-4 border-b last:border-b-0">
            {/* Profile Photo - Same logic as project card */}
            <ClickableProfilePhoto
              imageUrl={activity.user.avatar}
              avatar="/placeholder-user.jpg"
              name={activity.user.name}
              size="lg"
            />
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
                  {activity.type === 'mentor_assignment' && activity.description?.includes('accepted') && (
                    <>
                      <Badge variant="default" className="text-xs">
                        Mentor Assignment Accepted
                      </Badge>
                      <Badge variant="default" className="text-xs ml-2">
                        Accepted
                      </Badge>
                    </>
                  )}
                </Badge>
              </div>
              {activity.project ? (
                <Link
                  href={`/projects/${activity.project._id}`}
                  className="text-sm text-muted-foreground hover:text-primary line-clamp-1"
                >
                  {activity.description}
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {activity.description}
                </p>
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
