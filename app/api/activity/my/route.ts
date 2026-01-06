import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

/**
 * GET /api/activity/my
 * Get current authenticated user's activities
 * Query params:
 * - limit: number of activities to return (default 10)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Get current user
    const user = await User.findOne({ email: session.user.email })
      .select('_id')
      .lean()
      .exec();

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);

    const activities: any[] = [];

    // Fetch user's recent projects
    const userProjects = await Project.find({ author: user._id })
      .select('_id title createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    userProjects.forEach((project: any) => {
      activities.push({
        _id: `project_${project._id}`,
        type: 'project_upload',
        user: {
          _id: user._id,
          name: session.user.name || 'User',
          avatar: session.user.image
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
    console.error('GET /api/activity/my error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
