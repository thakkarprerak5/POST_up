'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FolderOpen, 
  AlertTriangle, 
  Heart, 
  MessageCircle, 
  Share2,
  TrendingUp,
  Activity,
  ArrowLeft
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    students: number;
    mentors: number;
    admins: number;
  };
  projects: {
    total: number;
    recent: Array<{
      _id: string;
      title: string;
      author: { name: string };
      createdAt: string;
    }>;
  };
  reports: {
    total: number;
    recent: Array<{
      _id: string;
      reason: string;
      targetType: string;
      createdAt: string;
    }>;
  };
  engagement: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgLikesPerProject: number;
  };
  activityLogs?: Array<{
    action: string;
    description: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchDashboardStats();
    }
  }, [status, router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 bg-white">
        <p className="text-red-600">Failed to load dashboard data</p>
      </div>
    );
  }

  const isSuperAdmin = session?.user?.role === 'super_admin';

  return (
    <div className="space-y-6 bg-white text-gray-900 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
        <p className="text-black mt-2">
          Welcome back, {session?.user?.name}. Here's what's happening on POST_up today.
        </p>
        <Badge className="bg-blue-100 text-blue-800">
          {isSuperAdmin ? 'Super Admin' : 'Admin'}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Stats */}
        <Card className="bg-white border border-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl text-bold font-medium text-black">Total Users</CardTitle>
            <Users className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.users.total}</div>
            <div className="text-xs text-black space-y-1">
              <div>Students: {stats.users.students}</div>
              <div>Mentors: {stats.users.mentors}</div>
              {isSuperAdmin && <div>Admins: {stats.users.admins}</div>}
            </div>
          </CardContent>
        </Card>

        {/* Projects Stats */}
        <Card className="bg-white border border-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Total Projects</CardTitle>
            <FolderOpen className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.projects.total}</div>
            <p className="text-xs text-black">
              Active projects
            </p>
          </CardContent>
        </Card>

        {/* Reports Stats */}
        <Card className="bg-white border border-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Reports</CardTitle>
            <AlertTriangle className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.reports.total}</div>
            <p className="text-xs text-black">
              Pending review
            </p>
          </CardContent>
        </Card>

        {/* Engagement Stats */}
        <Card className="bg-white border border-black">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Engagement</CardTitle>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.engagement.totalLikes}</div>
            <p className="text-xs text-black">
              Total likes • {stats.engagement.totalComments} comments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white border border-black">
          <CardHeader>
            <CardTitle className="text-black">Engagement Overview</CardTitle>
            <CardDescription className="text-blue-500">Platform engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center w-18 h-18 bg-gray-100 rounded-full mx-auto">
                  <Heart className="h-8 w-8 text-red-600" fill="currentColor" />
                </div>
                <div className="text-2xl font-bold text-blue-700">{stats.engagement.totalLikes}</div>
                <div className="text-sm text-black">Total Likes</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center w-18 h-18 bg-gray-100 rounded-full mx-auto">
                  <MessageCircle className="h-8 w-8 text-black"  />
                </div>
                <div className="text-2xl font-bold text-blue-700">{stats.engagement.totalComments}</div>
                <div className="text-sm text-black">Comments</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center w-18 h-18 bg-gray-100 rounded-full mx-auto">
                  <Share2 className="h-8 w-8 text-black" />
                </div>
                <div className="text-2xl font-bold text-blue-700">{stats.engagement.totalShares}</div>
                <div className="text-sm text-black">Shares</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-100">
              <div className="text-sm text-black">
                Average likes per project: <span className="font-semibold text-blue-700">{stats.engagement.avgLikesPerProject.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity (Super Admin only) */}
        {isSuperAdmin && stats.activityLogs && (
          <Card className="bg-white border border-black">
            <CardHeader>
              <CardTitle className="text-black">Recent Activity</CardTitle>
              <CardDescription className="text-blue-500">Latest admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.activityLogs.slice(0, 5).map((log: any, index: any) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">
                        {log.action}
                      </p>
                      <p className="text-xs text-blue-500">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Projects */}
      <Card className="bg-white border border-black">
        <CardHeader>
          <CardTitle className="text-black">Recent Projects</CardTitle>
          <CardDescription className="text-blue-500">Latest project submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.projects.recent.map((project: any) => (
              <div key={project._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black">{project.title}</p>
                  <p className="text-sm text-blue-500">by {project.author.name}</p>
                </div>
                <div className="text-sm text-blue-500">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button className="border-white-600 text-white hover:bg-blue-50 hover:text-black" onClick={() => router.push('/admin/projects')}>
              View All Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
