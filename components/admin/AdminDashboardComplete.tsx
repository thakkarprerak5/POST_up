'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users,
  FolderOpen,
  AlertTriangle,
  BarChart3,
  Settings,
  TrendingUp,
  Activity,
  Heart,
  MessageCircle,
  Share2,
  Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
    _id: string;
    action: string;
    timestamp: string;
  }>;
}

/**
 * MERGED: Professional Admin Dashboard with complete functionality
 * Combines all history updates:
 * - Professional white/light blue theme
 * - Complete stats display
 * - Super admin features
 * - Professional styling and interactions
 */
export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Failed to fetch dashboard stats');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = session?.user?.role === 'super-admin';

  return (
    <div className="space-y-8">
      {/* Professional Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {session?.user?.name}. Here's what's happening on POST_up today.
        </p>
        <Badge className="mt-3 bg-blue-100 text-blue-800">
          {isSuperAdmin ? 'Super Admin' : 'Admin'}
        </Badge>
      </div>

      {/* Professional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-6 w-6 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.users.total}</div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Students: {stats.users.students}</div>
              <div>Mentors: {stats.users.mentors}</div>
              {isSuperAdmin && <div>Admins: {stats.users.admins}</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
            <FolderOpen className="h-6 w-6 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.projects.total}</div>
            <p className="text-xs text-gray-500">Active projects</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reports</CardTitle>
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.reports.total}</div>
            <p className="text-xs text-gray-500">Pending review</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Engagement</CardTitle>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.engagement.totalLikes}</div>
            <p className="text-xs text-gray-500">Total likes • {stats.engagement.totalComments} comments</p>
          </CardContent>
        </Card>
      </div>

      {/* Professional Engagement Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Engagement Overview</CardTitle>
            <CardDescription className="text-gray-600">Platform engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mx-auto">
                  <Heart className="h-8 w-8 text-red-500" fill="currentColor" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.engagement.totalLikes}</div>
                <div className="text-sm text-gray-600">Total Likes</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mx-auto">
                  <MessageCircle className="h-8 w-8 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.engagement.totalComments}</div>
                <div className="text-sm text-gray-600">Comments</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mx-auto">
                  <Share2 className="h-8 w-8 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.engagement.totalShares}</div>
                <div className="text-sm text-gray-600">Shares</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Average likes per project: <span className="font-semibold text-gray-900">{stats.engagement.avgLikesPerProject.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity (Super Admin only) */}
        {isSuperAdmin && stats.activityLogs && (
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Activity</CardTitle>
              <CardDescription className="text-gray-600">Latest admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.activityLogs.slice(0, 5).map((log: any, index: any) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{log.action}</p>
                      <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Projects */}
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Projects</CardTitle>
          <CardDescription className="text-gray-600">Latest project submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.projects.recent.map((project: any) => (
              <div key={project._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{project.title}</p>
                  <p className="text-sm text-gray-600">by {project.author.name}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button 
              className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2" 
              onClick={() => router.push('/admin/projects')}
            >
              View All Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
