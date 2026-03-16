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
  ArrowLeft,
  UserPlus
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
    // DEBUG: Log session status for debugging
    console.log('🔍 AdminDashboard Session Check:', {
      status,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userName: session?.user?.name
    });

    if (status === 'unauthenticated') {
      console.log('❌ AdminDashboard: User not authenticated, middleware should handle redirect');
      // Don't redirect here - let middleware handle it to avoid redirect loops
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

  const isSuperAdmin = session?.user?.role === 'super-admin' || (session?.user as any)?.type === 'super-admin';

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600 font-light leading-relaxed">
              Welcome back, {session?.user?.name}. Here's what's happening on POST_up today.
            </p>
          </div>
          <Badge className="mt-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200/50 shadow px-4 py-2 text-sm font-medium">
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </Badge>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Stats */}
        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out group border border-gray-200/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Total Users</h3>
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-50/50 to-blue-100/50 rounded-2xl group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-blue-200/20">
              <Users className="h-7 w-7 text-blue-500 group-hover:text-blue-600 transition-colors duration-500" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900 mb-3">{stats.users.total}</div>
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Students:</span>
              <span className="font-medium">{stats.users.students}</span>
            </div>
            <div className="flex justify-between">
              <span>Mentors:</span>
              <span className="font-medium">{stats.users.mentors}</span>
            </div>
            {isSuperAdmin && (
              <div className="flex justify-between">
                <span>Admins:</span>
                <span className="font-medium">{stats.users.admins}</span>
              </div>
            )}
          </div>
        </div>

        {/* Projects Stats */}
        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out group border border-gray-200/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Total Projects</h3>
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-50/50 to-emerald-100/50 rounded-2xl group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-emerald-200/20">
              <FolderOpen className="h-7 w-7 text-emerald-500 group-hover:text-emerald-600 transition-colors duration-500" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900 mb-3">{stats.projects.total}</div>
          <p className="text-sm text-gray-500 font-medium">
            Active projects
          </p>
        </div>

        {/* Reports Stats */}
        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out group border border-gray-200/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Reports</h3>
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-50/50 to-amber-100/50 rounded-2xl group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-amber-200/20">
              <AlertTriangle className="h-7 w-7 text-amber-500 group-hover:text-amber-600 transition-colors duration-500" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900 mb-3">{stats.reports.total}</div>
          <p className="text-sm text-gray-500 font-medium">
            Pending review
          </p>
        </div>

        {/* Engagement Stats */}
        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out group border border-gray-200/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Engagement</h3>
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-violet-50/50 to-violet-100/50 rounded-2xl group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-violet-200/20">
              <TrendingUp className="h-7 w-7 text-violet-500 group-hover:text-violet-600 transition-colors duration-500" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900 mb-3">{stats.engagement.totalLikes}</div>
          <p className="text-sm text-gray-500 font-medium">
            Total likes • {stats.engagement.totalComments} comments
          </p>
        </div>
      </div>

      {/* Engagement Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Engagement Overview</h2>
            <p className="text-sm text-gray-500 mt-1">Platform engagement metrics</p>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-50/60 to-pink-50/40 rounded-2xl mx-auto mb-3 group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-red-200/20">
                <Heart className="h-8 w-8 text-red-500 group-hover:text-red-600 transition-colors duration-500" fill="currentColor" />
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">{stats.engagement.totalLikes}</div>
              <div className="text-sm font-medium text-gray-600">Total Likes</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-2xl mx-auto mb-3 group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-blue-200/20">
                <MessageCircle className="h-8 w-8 text-blue-500 group-hover:text-blue-600 transition-colors duration-500" />
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">{stats.engagement.totalComments}</div>
              <div className="text-sm font-medium text-gray-600">Comments</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-50/60 to-green-50/40 rounded-2xl mx-auto mb-3 group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-emerald-200/20">
                <Share2 className="h-8 w-8 text-emerald-500 group-hover:text-emerald-600 transition-colors duration-500" />
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">{stats.engagement.totalShares}</div>
              <div className="text-sm font-medium text-gray-600">Shares</div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200/40">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average likes per project</span>
              <span className="text-lg font-semibold text-gray-900">{stats.engagement.avgLikesPerProject.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity (Super Admin only) */}
        {isSuperAdmin && stats.activityLogs && (
          <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Recent Activity</h2>
              <p className="text-sm text-gray-500 mt-1">Latest admin actions</p>
            </div>
            <div className="space-y-3">
              {stats.activityLogs.slice(0, 5).map((log: any, index: any) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors duration-500 group border border-gray-200/20">
                  <div className="p-1.5 bg-blue-50/50 rounded-lg group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-blue-200/20">
                    <Activity className="h-3.5 w-3.5 text-blue-500 group-hover:text-blue-600 transition-colors duration-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {log.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Projects */}
      <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-8 shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Recent Projects</h2>
          <p className="text-sm text-gray-500 mt-1">Latest project submissions</p>
        </div>
        <div className="space-y-4">
          {stats.projects.recent.map((project: any) => (
            <div key={project._id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors duration-500 group border border-gray-200/20">
              <div>
                <p className="font-semibold text-gray-900">{project.title}</p>
                <p className="text-sm text-gray-600 mt-1">by {project.author.name}</p>
              </div>
              <div className="text-sm text-gray-500 font-medium">
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Button
            className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-500 ease-in-out font-medium border border-blue-200/30"
            onClick={() => router.push('/admin/projects')}
          >
            View All Projects
          </Button>
        </div>
      </div>
    </div>
  );
}
