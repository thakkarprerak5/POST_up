import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

/**
 * GET /api/activity/recent
 * Get recent activities from the platform
 * Query params:
 * - limit: number of activities to return (default 20)
 * - userId: (optional) filter by user ID
 * - followingOnly: (optional) for authenticated users, show only followed users' activities
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const userId = url.searchParams.get('userId');

    const activities: any[] = [];

    // Fetch recent projects
    const recentProjects = await Project.find({})
      .select('_id title author createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    recentProjects.forEach((project: any) => {
      activities.push({
        _id: `project_${project._id}`,
        type: 'project_upload',
        user: {
          _id: project.author?._id,
          name: project.author?.name,
          avatar: project.author?.avatar
        },
        project: {
          _id: project._id,
          title: project.title
        },
        timestamp: project.createdAt,
        description: `uploaded "${project.title}"`
      });
    });

    // Sort by timestamp descending and limit
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return Response.json(activities.slice(0, limit));
  } catch (error: any) {
    console.error('GET /api/activity/recent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
