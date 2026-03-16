import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Project from '@/models/Project';

// GET /api/public/analytics - Get analytics data (no auth required)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Public Analytics API called');
    
    await connectDB();
    console.log('✅ Database connected');

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // User analytics
    console.log('📊 Fetching user analytics...');
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
    console.log('📊 Fetching project analytics...');
    const projectStats = await Project.aggregate([
      { $match: { createdAt: { $gte: daysAgo }, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          projects: { $sum: 1 },
          totalLikes: { $sum: "$likeCount" },
          totalComments: { $sum: { $ifNull: [{ $size: { $ifNull: ['$comments', []] } }, 0] } },
          totalShares: { $sum: "$shareCount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top projects
    console.log('📊 Fetching top projects...');
    const topProjects = await Project.find({ isDeleted: { $ne: true } })
      .sort({ likeCount: -1 })
      .limit(10)
      .select('title author likeCount shareCount createdAt')
      .lean();

    // Top active users (simplified version to avoid aggregation issues)
    console.log('📊 Fetching top active users...');
    const topActiveUsers = await User.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'author',
          as: 'userProjects'
        }
      },
      {
        $addFields: {
          projectCount: { $size: '$userProjects' },
          totalLikes: { $sum: '$userProjects.likeCount' },
          totalComments: { $sum: { $ifNull: [{ $size: { $ifNull: ['$userProjects.comments', []] } }, 0] } }
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
    console.log('📊 Fetching engagement trends...');
    const engagementTrends = await Project.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          avgLikesPerProject: { $avg: '$likeCount' },
          avgCommentsPerProject: { $avg: { $ifNull: [{ $size: { $ifNull: ['$comments', []] } }, 0] } },
          avgSharesPerProject: { $avg: '$shareCount' },
          totalProjects: { $sum: 1 },
          totalLikes: { $sum: '$likeCount' },
          totalComments: { $sum: { $ifNull: [{ $size: { $ifNull: ['$comments', []] } }, 0] } },
          totalShares: { $sum: '$shareCount' }
        }
      }
    ]);

    console.log('✅ Analytics data calculated successfully');
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
