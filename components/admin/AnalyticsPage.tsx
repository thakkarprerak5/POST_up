'use client';

import { useState, useEffect } from 'react';
import { AnalyticsHeader } from '@/components/admin/analytics/AnalyticsHeader';
import { InsightCard } from '@/components/admin/analytics/InsightCard';
import { exportAnalyticsToCSV } from '@/lib/utils/exportToCSV';
import { DateRange } from "react-day-picker";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Users,
  FolderOpen,
  Heart,
  MessageCircle,
  Share2,
  Trophy,
  Activity,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Zap,
  Repeat
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    studentCount: number;
    mentorCount: number;
    activeUsers: number;
    totalProjects: number;
    activeProjects: number;
    pendingReports: number;
    userGrowth: number;
  };
  userStats: Array<{
    _id: string;
    students: number;
    mentors: number;
    total: number;
  }>;
  projectStats: Array<{
    _id: string;
    projects: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
  }>;
  projectDistribution: {
    status: Record<string, number>;
    type: Record<string, number>;
  };
  engagementTrends: {
    avgLikesPerProject: number;
    avgCommentsPerProject: number;
    avgSharesPerProject: number;
    totalProjects: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
  };
  moderation: {
    pendingReports: number;
    statusDistribution: Record<string, number>;
    trend: Array<{ _id: string; count: number }>;
  };
  topProjects: Array<{
    _id: string;
    title: string;
    author: { name: string; id: string };
    likeCount: number;
    shareCount: number;
    createdAt: string;
  }>;
  topActiveUsers: Array<{
    fullName: string;
    email: string;
    type: string;
    projectCount: number;
    totalLikes: number;
  }>;
}

// Enterprise-grade color palette
const CHART_COLORS = {
  blue: {
    stroke: '#3b82f6',
    fill: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.05)'
  },
  emerald: {
    stroke: '#10b981',
    fill: '#10b981',
    background: 'rgba(16, 185, 129, 0.05)'
  },
  slate: {
    stroke: '#64748b',
    fill: '#64748b',
    background: 'rgba(100, 116, 139, 0.05)'
  },
  amber: {
    stroke: '#f59e0b',
    fill: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.05)'
  },
  rose: {
    stroke: '#f43f5e',
    fill: '#f43f5e',
    background: 'rgba(244, 63, 94, 0.05)'
  },
  violet: {
    stroke: '#8b5cf6',
    fill: '#8b5cf6',
    background: 'rgba(139, 92, 246, 0.05)'
  }
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#6366f1', '#8b5cf6', '#f59e0b', '#64748b'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll for data every 60 seconds
  useEffect(() => {
    fetchAnalytics(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchAnalytics(true); // Background refresh
    }, 60000);

    return () => clearInterval(intervalId);
  }, [period, dateRange]);

  const fetchAnalytics = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setLoading(true);
      else setIsRefreshing(true);

      // Build URL with period or custom date range
      let url = `/api/admin/analytics?period=${period}`;
      if (period === 'custom' && dateRange?.from) {
        url += `&startDate=${dateRange.from.toISOString()}`;
        if (dateRange.to) url += `&endDate=${dateRange.to.toISOString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      if (!isBackgroundRefresh) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    if (!data) return;

    // Prepare data for CSV export
    const exportData = [
      ...data.userStats.map(stat => ({
        Date: new Date(stat._id).toLocaleDateString(),
        'Total Users': stat.total,
        'Students': stat.students,
        'Mentors': stat.mentors,
        'Category': 'User Growth'
      })),
      ...data.projectStats.map(stat => ({
        Date: new Date(stat._id).toLocaleDateString(),
        'Total Projects': stat.projects,
        'Likes': stat.totalLikes,
        'Comments': stat.totalComments,
        'Shares': stat.totalShares,
        'Category': 'Project Activity'
      }))
    ];

    exportAnalyticsToCSV(exportData, `analytics-report-${period}d`);
  };

  // Calculate BI Metrics (Frontend)
  const calculateBIMetrics = () => {
    if (!data) return null;

    // 1. User Retention Rate: (Active Users / Total Users) * 100
    const retentionRate = data.overview.totalUsers > 0
      ? (data.overview.activeUsers / data.overview.totalUsers) * 100
      : 0;

    // 2. Content Velocity: (New Projects this week / Total Projects) * 100
    // Approximate "this week" as projects in the selected period
    const newProjectsCount = data.projectStats.reduce((sum, stat) => sum + stat.projects, 0);
    const contentVelocity = data.overview.totalProjects > 0
      ? (newProjectsCount / data.overview.totalProjects) * 100
      : 0;

    // 3. Engagement Ratio: (Total Likes + Comments) / Total Users
    const totalEngagement = data.engagementTrends.totalLikes + data.engagementTrends.totalComments;
    const engagementRatio = data.overview.totalUsers > 0
      ? totalEngagement / data.overview.totalUsers
      : 0;

    return {
      retentionRate: retentionRate.toFixed(1),
      contentVelocity: contentVelocity.toFixed(1),
      engagementRatio: engagementRatio.toFixed(1)
    };
  };

  const biMetrics = calculateBIMetrics();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 font-medium animate-pulse">Computing platform metrics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Failed to load analytics</h3>
        <p className="text-slate-500 max-w-md">We couldn't retrieve the latest data. Please check your connection and try again.</p>
        <button
          onClick={() => fetchAnalytics(false)}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Formatting helper
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const projectStatusData = Object.entries(data.projectDistribution.status).map(([name, value]) => ({ name, value }));
  const projectTypeData = Object.entries(data.projectDistribution.type).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-[1600px] mx-auto pb-24 bg-[#fafafa]/50 min-h-screen">

      <AnalyticsHeader
        timeRange={period}
        setTimeRange={setPeriod}
        onExport={handleExport}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchAnalytics(true)}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out group border border-gray-200/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Total Users</h3>
            <div className="flex items-center justify-center w-13 h-13 bg-gradient-to-br from-blue-50/50 to-blue-100/50 rounded-2xl shadow-md group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-blue-200/20">
              <Users className="h-7 w-7 text-blue-500 group-hover:text-blue-600 transition-colors duration-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{formatNumber(data.overview.totalUsers)}</span>
            {data.overview.userGrowth !== 0 && (
              <span className={`text-xs font-bold ${data.overview.userGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.overview.userGrowth >= 0 ? '↑' : '↓'} {Math.abs(data.overview.userGrowth)}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Total registered accounts</p>
        </div>

        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out group border border-gray-200/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Active Projects</h3>
            <div className="flex items-center justify-center w-13 h-13 bg-gradient-to-br from-emerald-50/50 to-emerald-100/50 rounded-2xl shadow-md group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-emerald-200/20">
              <FolderOpen className="h-7 w-7 text-emerald-500 group-hover:text-emerald-600 transition-colors duration-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{formatNumber(data.overview.activeProjects)}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(data.overview.activeProjects / (data.overview.totalProjects || 1)) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {((data.overview.activeProjects / (data.overview.totalProjects || 1)) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out group border border-gray-200/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Engagement</h3>
            <div className="flex items-center justify-center w-13 h-13 bg-gradient-to-br from-green-50/50 to-green-100/50 rounded-2xl shadow-md group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-green-200/20">
              <Activity className="h-7 w-7 text-green-500 group-hover:text-green-600 transition-colors duration-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{formatNumber(data.engagementTrends.totalLikes + data.engagementTrends.totalComments)}</div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-[10px] font-bold text-slate-500">Likes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-slate-500">Comments</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out group border border-gray-200/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-rose-500 uppercase tracking-[0.1em]">Pending Reports</h3>
            <div className="flex items-center justify-center w-13 h-13 bg-gradient-to-br from-red-50/50 to-red-100/50 rounded-2xl shadow-md group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-red-200/20">
              <ShieldAlert className="h-7 w-7 text-red-500 group-hover:text-red-600 transition-colors duration-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-900">{data.overview.pendingReports}</span>
            {data.overview.pendingReports > 0 && (
              <div className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded uppercase tracking-wider">
                Action Required
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Awaiting moderation</p>
        </div>
      </div>

      {/* Business Intelligence Widgets */}
      {biMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InsightCard
            title="User Retention Rate"
            value={`${biMetrics.retentionRate}%`}
            trend={2.4}
            trendLabel="Active vs Total Users"
            icon={Repeat}
          />
          <InsightCard
            title="Content Velocity"
            value={`${biMetrics.contentVelocity}%`}
            trend={5.1}
            trendLabel="New Project Ratio"
            icon={Zap}
          />
          <InsightCard
            title="Engagement Ratio"
            value={biMetrics.engagementRatio}
            trend={-1.2}
            trendLabel="Interactions Per User"
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Main Trends Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30">
          <div className="p-6 pb-2">
            <h2 className="text-base font-bold text-slate-900">User Growth Trend</h2>
            <p className="text-slate-400 text-xs font-medium">Daily registration activity</p>
          </div>
          <div className="p-6 pt-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.userStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.blue.stroke} stopOpacity={0.08} />
                      <stop offset="95%" stopColor={CHART_COLORS.blue.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="_id"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                  <Tooltip
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', padding: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                    labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '11px', fontWeight: 700 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={CHART_COLORS.blue.stroke}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Registrations"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30">
          <div className="p-6 pb-2">
            <h2 className="text-base font-bold text-slate-900">Engagement Overview</h2>
            <p className="text-slate-400 text-xs font-medium">Community interaction velocity</p>
          </div>
          <div className="p-6 pt-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.projectStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="_id"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                  <Tooltip
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', padding: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalLikes"
                    stroke={CHART_COLORS.rose.stroke}
                    strokeWidth={2.5}
                    dot={{ r: 0 }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    name="Likes"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalComments"
                    stroke={CHART_COLORS.blue.stroke}
                    strokeWidth={2.5}
                    dot={{ r: 0 }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    name="Comments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30">
          <div className="pb-0">
            <h2 className="text-sm font-bold text-slate-800">Project Status</h2>
          </div>
          <div className="p-6 pt-2">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%" >
                <PieChart >
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {projectStatusData.map((stat, i) => (
                <div key={stat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30">
          <div className="pb-0">
            <h2 className="text-sm font-bold text-slate-800">Registration Type</h2>
          </div>
          <div className="p-6 pt-2">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {projectTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 3) % PIE_COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {projectTypeData.map((stat, i) => (
                <div key={stat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[(i + 3) % PIE_COLORS.length] }} />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30">
          <div className="pb-0">
            <h2 className="text-sm font-bold text-slate-800">Moderation Velocity</h2>
          </div>
          <div className="p-6 pt-2">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.moderation.trend} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="_id"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.rose.stroke} radius={[4, 4, 0, 0]} barSize={20} name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-rose-100 rounded-lg">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Queue</p>
                  <p className="text-xs font-bold text-slate-700">{data.moderation.pendingReports} Active Cases</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30">
          <div className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Top Performing Projects</h2>
              <p className="text-slate-400 text-xs font-medium">Ranked by community engagement</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-xl">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="p-0">
            <div className="divide-y divide-slate-100/60">
              {data.topProjects.map((project, idx) => (
                <div key={project._id} className="p-5 hover:bg-slate-50/50 transition-all group flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <span className="text-sm font-black text-slate-300 w-4 group-hover:text-slate-500">#{idx + 1}</span>
                    <div>
                      <p className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase text-[12px] tracking-tight">{project.title}</p>
                      <p className="text-[11px] text-slate-400 font-medium">Authored by <span className="text-slate-600">{project.author?.name || 'Unknown'}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 rounded-lg">
                        <Heart className="w-3 h-3 text-rose-500" />
                        <span className="text-xs font-bold text-rose-700">{project.likeCount}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-lg">
                        <Share2 className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-bold text-blue-700">{project.shareCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out border border-gray-200/30">
          <div className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Platform Power Users</h2>
              <p className="text-slate-400 text-xs font-medium">Most active community contributors</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100/60">
                  <tr>
                    <th className="px-6 py-4">Identity</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Projects</th>
                    <th className="px-6 py-4 text-right">Reputation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {data.topActiveUsers.map((user) => (
                    <tr key={user.email} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-[12px] tracking-tight truncate max-w-[150px]">{user.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${user.type === 'mentor' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                          {user.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-black text-slate-700">{user.projectCount}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-xs font-black text-slate-900">{user.totalLikes}</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(100, (user.totalLikes / ((data.engagementTrends.totalLikes / (data.overview.totalUsers || 1)) * 5 || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}