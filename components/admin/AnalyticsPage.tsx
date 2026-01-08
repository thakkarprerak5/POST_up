'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  FolderOpen, 
  Heart, 
  MessageCircle, 
  Share2,
  Trophy,
  Activity
} from 'lucide-react';

interface AnalyticsData {
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
  topProjects: Array<{
    _id: string;
    title: string;
    author: { name: string };
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
    totalComments: number;
  }>;
  engagementTrends: {
    avgLikesPerProject: number;
    avgCommentsPerProject: number;
    avgSharesPerProject: number;
    totalProjects: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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

  if (!data) {
    return (
      <div className="text-center py-8 bg-white">
        <p className="text-red-600">Failed to load analytics data</p>
      </div>
    );
  }

  // Prepare data for charts
  const userGrowthData = data.userStats.map(stat => ({
    date: stat._id,
    students: stat.students,
    mentors: stat.mentors,
    total: stat.total
  }));

  const projectActivityData = data.projectStats.map(stat => ({
    date: stat._id,
    projects: stat.projects,
    likes: stat.totalLikes,
    comments: stat.totalComments,
    shares: stat.totalShares
  }));

  const userTypeData = [
    { name: 'Students', value: data.userStats.reduce((sum, stat) => sum + stat.students, 0) },
    { name: 'Mentors', value: data.userStats.reduce((sum, stat) => sum + stat.mentors, 0) }
  ];

  return (
    <div className="space-y-6 bg-white text-gray-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Analytics & Insights</h1>
          <p className="text-black mt-2">
            Platform performance and user engagement metrics
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32 !bg-white text-black border border-black hover:!bg-white focus:!bg-white data-[state=open]:!bg-white [&>svg]:!text-black [&>svg]:!opacity-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white text-black border border-black shadow-lg">
            <SelectItem value="7" className="cursor-pointer hover:bg-blue-100 focus:bg-blue-100 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:hover:bg-blue-600">Last 7 days</SelectItem>
            <SelectItem value="30" className="cursor-pointer hover:bg-blue-100 focus:bg-blue-100 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:hover:bg-blue-600">Last 30 days</SelectItem>
            <SelectItem value="90" className="cursor-pointer hover:bg-blue-100 focus:bg-blue-100 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white data-[state=checked]:hover:bg-blue-600">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Total Projects</CardTitle>
            <FolderOpen className="h-6 w-6 text-gray-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{data.engagementTrends.totalProjects}</div>
            <p className="text-xs text-black/70">
              Across all time
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Total Likes</CardTitle>
            <Heart className="h-6 w-6 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{data.engagementTrends.totalLikes}</div>
            <p className="text-xs text-black/70">
              {data.engagementTrends.avgLikesPerProject.toFixed(1)} avg per project
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Total Comments</CardTitle>
            <MessageCircle className="h-6 w-6 text-gray-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{data.engagementTrends.totalComments}</div>
            <p className="text-xs text-black/70">
              {data.engagementTrends.avgCommentsPerProject.toFixed(1)} avg per project
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Total Shares</CardTitle>
            <Share2 className="h-6 w-6 text-gray-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{data.engagementTrends.totalShares}</div>
            <p className="text-xs text-black/70">
              {data.engagementTrends.avgSharesPerProject.toFixed(1)} avg per project
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="bg-white border border-black rounded-xl">
          <CardHeader>
            <CardTitle className="text-black">User Growth</CardTitle>
            <CardDescription className="text-black/70">Daily user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#8884d8" name="Students" />
                <Line type="monotone" dataKey="mentors" stroke="#82ca9d" name="Mentors" />
                <Line type="monotone" dataKey="total" stroke="#ffc658" name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Activity Chart */}
        <Card className="bg-white border border-black rounded-xl">
          <CardHeader>
            <CardTitle className="text-black">Project Activity</CardTitle>
            <CardDescription className="text-black/70">Daily project uploads and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="projects" fill="#8884d8" name="Projects" />
                <Bar dataKey="likes" fill="#82ca9d" name="Likes" />
                <Bar dataKey="comments" fill="#ffc658" name="Comments" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Type Distribution */}
        <Card className="bg-white border border-black rounded-xl">
          <CardHeader>
            <CardTitle className="text-black">User Distribution</CardTitle>
            <CardDescription className="text-black/70">Breakdown of user types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card className="bg-white border border-black rounded-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-black">Top Projects</CardTitle>
            <CardDescription className="text-black/70">Most liked projects on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProjects.slice(0, 5).map((project, index) => (
                <div key={project._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 border border-black rounded-full">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-black">{project.title}</p>
                      <p className="text-sm text-black/70">by {project.author.name}</p>
                    </div>
                  </div>
                  <div className="text-right text-black/70">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span>{project.likeCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Share2 className="h-3 w-3 text-blue-500" />
                        <span>{project.shareCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Active Users */}
      <Card className="bg-white border border-black rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Most Active Users</CardTitle>
          <CardDescription className="text-black/70">Users with highest engagement and project contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topActiveUsers.slice(0, 10).map((user, index) => (
              <div key={user.email} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 border border-black rounded-full">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-black">{user.fullName}</p>
                    <p className="text-sm text-black/70">{user.email} • {user.type}</p>
                  </div>
                </div>
                <div className="text-right text-black/70">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <FolderOpen className="h-3 w-3 text-gray-500" />
                      <span>{user.projectCount} projects</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-3 w-3 text-red-600" />
                      <span>{user.totalLikes} likes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-3 w-3 text-blue-500" />
                      <span>{user.totalComments} comments</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
