import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Project from '@/models/Project';
import Report from '@/models/Report';
import { Post } from '@/models/Post';
import { getActivityLogs } from '@/models/AdminActivityLog';

export async function GET() {
  try {
    await connectDB();

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ type: 'student' });
    const mentors = await User.countDocuments({ type: 'mentor' });
    const admins = await User.countDocuments({
      $or: [{ type: 'admin' }, { type: 'super-admin' }]
    });

    // Get project statistics from database
    const totalProjects = await Project.countDocuments({});
    const recentProjects = await Project.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id title author createdAt')
      .populate('author', 'fullName email')
      .lean()
      .exec();

    // Get REAL reports statistics
    const totalReports = await Report.countDocuments({});
    const recentReports = await Report.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id reason targetType createdAt status')
      .lean()
      .exec();

    // Get REAL engagement statistics using aggregation
    const [projectEngagement, postEngagement] = await Promise.all([
      Project.aggregate([
        {
          $group: {
            _id: null,
            totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
            totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } }
          }
        }
      ]),
      Post.aggregate([
        {
          $group: {
            _id: null,
            totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
            totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } }
          }
        }
      ])
    ]);

    const projectStats = projectEngagement[0] || { totalLikes: 0, totalComments: 0 };
    const postStats = postEngagement[0] || { totalLikes: 0, totalComments: 0 };

    const totalLikes = projectStats.totalLikes + postStats.totalLikes;
    const totalComments = projectStats.totalComments + postStats.totalComments;
    const avgLikesPerProject = totalProjects > 0 ? (totalLikes / totalProjects).toFixed(1) : 0;

    const engagement = {
      totalLikes,
      totalComments,
      totalShares: 0, // Shares not implemented yet
      avgLikesPerProject: parseFloat(avgLikesPerProject as string)
    };

    // Get REAL activity logs for super admin
    const activityLogs = await getActivityLogs({ limit: 10, page: 1 });

    const stats = {
      users: {
        total: totalUsers,
        students,
        mentors,
        admins
      },
      projects: {
        total: totalProjects,
        recent: recentProjects
      },
      reports: {
        total: totalReports,
        recent: recentReports
      },
      engagement,
      activityLogs: activityLogs || []
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
