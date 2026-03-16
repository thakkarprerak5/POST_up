import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Project from '@/models/Project';
import Report from '@/models/Report';
import { subDays, startOfDay, endOfDay } from 'date-fns';

async function checkAdmin(req: NextRequest) {
    const token = await getToken({ req: req as any });
    if (!token) return false;
    const user = token as any;
    return user.type === 'admin' || user.type === 'super-admin' ||
        user.role === 'admin' || user.role === 'super-admin';
}

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        if (!await checkAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const period = parseInt(searchParams.get('period') || '30');
        const startDate = subDays(startOfDay(new Date()), period);

        // 1. User Overview & Growth
        const [
            totalUsers,
            studentCount,
            mentorCount,
            activeUsers,
            newUsersTrend,
            prevMonthUsers
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ type: 'student' }),
            User.countDocuments({ type: 'mentor' }),
            User.countDocuments({ isActive: true }),
            User.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                        students: { $sum: { $cond: [{ $eq: ["$type", "student"] }, 1, 0] } },
                        mentors: { $sum: { $cond: [{ $eq: ["$type", "mentor"] }, 1, 0] } }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            User.countDocuments({ createdAt: { $lt: subDays(new Date(), period), $gte: subDays(new Date(), period * 2) } })
        ]);

        // 2. Project Analytics
        const [
            totalProjects,
            activeProjects,
            projectStatusStats,
            projectTypeStats,
            projectsTrend
        ] = await Promise.all([
            Project.countDocuments({ isDeleted: { $ne: true } }),
            Project.countDocuments({ projectStatus: 'active', isDeleted: { $ne: true } }),
            Project.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$projectStatus", count: { $sum: 1 } } }
            ]),
            Project.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$registrationType", count: { $sum: 1 } } }
            ]),
            Project.aggregate([
                { $match: { createdAt: { $gte: startDate }, isDeleted: { $ne: true } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                        likes: { $sum: "$likeCount" },
                        shares: { $sum: "$shareCount" },
                        comments: { $sum: { $size: { $ifNull: ["$comments", []] } } }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        // 3. Engagement Metrics
        const engagementStats = await Project.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    totalLikes: { $sum: "$likeCount" },
                    totalShares: { $sum: "$shareCount" },
                    totalComments: { $sum: { $size: { $ifNull: ["$comments", []] } } }
                }
            }
        ]);

        const engagement = engagementStats[0] || { totalLikes: 0, totalShares: 0, totalComments: 0 };

        // 4. Moderation Analytics
        const [
            pendingReports,
            reportsTrend,
            reportStatusStats
        ] = await Promise.all([
            Report.countDocuments({ status: 'pending' }),
            Report.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Report.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ])
        ]);

        // 5. Top Projects & Users
        const [topProjects, topActiveUsers] = await Promise.all([
            Project.find({ isDeleted: { $ne: true } })
                .sort({ likeCount: -1 })
                .limit(5)
                .select('title author likeCount shareCount createdAt')
                .lean(),
            User.aggregate([
                { $match: { type: { $in: ['student', 'mentor'] } } },
                {
                    $lookup: {
                        from: 'projects',
                        localField: '_id',
                        foreignField: 'authorId',
                        as: 'userProjects'
                    }
                },
                {
                    $project: {
                        fullName: 1,
                        email: 1,
                        type: 1,
                        projectCount: { $size: "$userProjects" },
                        totalLikes: { $sum: "$userProjects.likeCount" }
                    }
                },
                { $sort: { totalLikes: -1 } },
                { $limit: 10 }
            ])
        ]);

        return NextResponse.json({
            overview: {
                totalUsers,
                studentCount,
                mentorCount,
                activeUsers,
                totalProjects,
                activeProjects,
                pendingReports,
                userGrowth: totalUsers - prevMonthUsers
            },
            userStats: newUsersTrend.map(t => ({
                _id: t._id,
                students: t.students,
                mentors: t.mentors,
                total: t.count
            })),
            projectStats: projectsTrend.map(t => ({
                _id: t._id,
                projects: t.count,
                totalLikes: t.likes,
                totalComments: t.comments,
                totalShares: t.shares
            })),
            projectDistribution: {
                status: projectStatusStats.reduce((acc: any, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
                type: projectTypeStats.reduce((acc: any, curr) => ({ ...acc, [curr._id]: curr.count }), {})
            },
            engagementTrends: {
                ...engagement,
                totalProjects,
                avgLikesPerProject: totalProjects > 0 ? engagement.totalLikes / totalProjects : 0,
                avgCommentsPerProject: totalProjects > 0 ? engagement.totalComments / totalProjects : 0,
                avgSharesPerProject: totalProjects > 0 ? engagement.totalShares / totalProjects : 0,
            },
            moderation: {
                pendingReports,
                statusDistribution: reportStatusStats.reduce((acc: any, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
                trend: reportsTrend
            },
            topProjects,
            topActiveUsers
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
