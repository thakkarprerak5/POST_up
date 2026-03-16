import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Project from '@/models/Project';
import Report from '@/models/Report';

// GET /api/public/dashboard - Public dashboard stats (no auth required)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Public Dashboard API called');
    
    await connectDB();
    console.log('✅ Database connected');

    // Get dashboard stats
    const [
      totalUsers,
      totalProjects,
      totalReports,
      studentCount,
      mentorCount,
      adminCount,
      recentProjects,
      recentReports
    ] = await Promise.all([
      User.countDocuments({ $or: [{ isActive: true }, { isActive: { $exists: false } }] }),
      Project.countDocuments({ isDeleted: { $ne: true } }),
      Report.countDocuments(),
      User.countDocuments({ type: 'student', $or: [{ isActive: true }, { isActive: { $exists: false } }] }),
      User.countDocuments({ type: 'mentor', $or: [{ isActive: true }, { isActive: { $exists: false } }] }),
      User.countDocuments({ type: { $in: ['admin', 'super-admin'] }, $or: [{ isActive: true }, { isActive: { $exists: false } }] }),
      Project.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5),
      Report.find().sort({ createdAt: -1 }).limit(5)
    ]);

    // Get engagement metrics
    const engagementStats = await Project.aggregate([
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likeCount' },
          totalComments: { $sum: { $ifNull: [{ $size: { $ifNull: ['$comments', []] } }, 0] } },
          totalShares: { $sum: '$shareCount' },
          avgLikesPerProject: { $avg: '$likeCount' }
        }
      }
    ]);

    console.log('📊 Fetching dashboard stats...');
    
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
      }
    };

    console.log('✅ Dashboard stats calculated:', Object.keys(stats));
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
