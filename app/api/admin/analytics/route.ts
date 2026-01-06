import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { createActivityLog } from '@/models/AdminActivityLog';

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

// Helper function to check if user is super admin
const isSuperAdmin = (userRole: string) => userRole === 'super_admin';

// GET /api/admin/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const adminInfo = getAdminInfo(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // User analytics
    const userStats = await User.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          students: {
            $sum: { $cond: [{ $eq: ["$type", "student"] }, 1, 0] }
          },
          mentors: {
            $sum: { $cond: [{ $eq: ["$type", "mentor"] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Project analytics
    const Project = await import('@/models/Project').then(m => m.default);
    const projectStats = await Project.aggregate([
      { $match: { createdAt: { $gte: daysAgo }, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          projects: { $sum: 1 },
          totalLikes: { $sum: "$likeCount" },
          totalComments: { $sum: { $size: "$comments" } },
          totalShares: { $sum: "$shareCount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top projects
    const topProjects = await Project.find({ isDeleted: { $ne: true } })
      .sort({ likeCount: -1 })
      .limit(10)
      .select('title author likeCount shareCount createdAt')
      .lean();

    // Top active users
    const topActiveUsers = await User.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'author.id',
          as: 'userProjects'
        }
      },
      {
        $addFields: {
          projectCount: { $size: '$userProjects' },
          totalLikes: { $sum: '$userProjects.likeCount' },
          totalComments: { $sum: { $size: '$userProjects.comments' } }
        }
      },
      { $match: { type: { $in: ['student', 'mentor'] } } },
      { $sort: { totalLikes: -1, projectCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          fullName: 1,
          email: 1,
          type: 1,
          projectCount: 1,
          totalLikes: 1,
          totalComments: 1
        }
      }
    ]);

    // Engagement trends
    const engagementTrends = await Project.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          avgLikesPerProject: { $avg: '$likeCount' },
          avgCommentsPerProject: { $avg: { $size: '$comments' } },
          avgSharesPerProject: { $avg: '$shareCount' },
          totalProjects: { $sum: 1 },
          totalLikes: { $sum: '$likeCount' },
          totalComments: { $sum: { $size: '$comments' } },
          totalShares: { $sum: '$shareCount' }
        }
      }
    ]);

    return NextResponse.json({
      userStats,
      projectStats,
      topProjects,
      topActiveUsers,
      engagementTrends: engagementTrends[0] || {
        avgLikesPerProject: 0,
        avgCommentsPerProject: 0,
        avgSharesPerProject: 0,
        totalProjects: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0
      }
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
