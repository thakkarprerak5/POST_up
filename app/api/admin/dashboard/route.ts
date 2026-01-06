import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User, { findUserById } from '@/models/User';
import Project from '@/models/Project';
import { createActivityLog } from '@/models/AdminActivityLog';
import Report from '@/models/Report';

// Helper function to check if user is super admin
const isSuperAdmin = (userRole: string) => userRole === 'super_admin';

// Helper function to get admin info from request headers
const getAdminInfo = (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  const userEmail = request.headers.get('x-user-email');
  
  if (!userId || !userRole || !userEmail) {
    throw new Error('Admin authentication required');
  }
  
  return { userId, userRole, userEmail };
};

// GET /api/admin/dashboard - Dashboard stats
export async function GET(request: NextRequest) {
  try {
    const adminInfo = getAdminInfo(request);
    await connectDB();

    // Get dashboard stats
    const [
      totalUsers,
      totalProjects,
      totalReports,
      studentCount,
      mentorCount,
      adminCount,
      recentProjects,
      recentReports,
      activityLogs
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Project.countDocuments({ isDeleted: { $ne: true } }),
      Report.countDocuments(),
      User.countDocuments({ type: 'student', isActive: true }),
      User.countDocuments({ type: 'mentor', isActive: true }),
      User.countDocuments({ type: { $in: ['admin', 'super_admin'] }, isActive: true }),
      Project.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5),
      Report.find().sort({ createdAt: -1 }).limit(5),
      isSuperAdmin(adminInfo.userRole) 
        ? await import('@/models/AdminActivityLog').then(m => m.getActivityLogs({ limit: 10 }))
        : []
    ]);

    // Get engagement metrics
    const engagementStats = await Project.aggregate([
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likeCount' },
          totalComments: { $sum: { $size: '$comments' } },
          totalShares: { $sum: '$shareCount' },
          avgLikesPerProject: { $avg: '$likeCount' }
        }
      }
    ]);

    const stats = {
      users: {
        total: totalUsers,
        students: studentCount,
        mentors: mentorCount,
        admins: adminCount
      },
      projects: {
        total: totalProjects,
        recent: recentProjects
      },
      reports: {
        total: totalReports,
        recent: recentReports
      },
      engagement: engagementStats[0] || {
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        avgLikesPerProject: 0
      },
      activityLogs
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
