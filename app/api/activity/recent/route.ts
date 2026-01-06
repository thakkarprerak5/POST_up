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
    const authenticatedOnly = url.searchParams.get('authenticated') === 'true';

    const activities: any[] = [];

    // Fetch recent projects
    let recentProjects = await Project.find({})
      .select('_id title author createdAt githubUrl liveUrl images')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    // Apply same filtering logic as projects API
    if (authenticatedOnly) {
      recentProjects = recentProjects.filter((project: any) => {
        // Check for real uploaded images (starts with /uploads/)
        const hasRealUploadedImages = project.images && project.images.length > 0 && 
          project.images.some((img: string) => img.startsWith('/uploads/'));
        
        // Check for generic URLs (sample project pattern)
        const hasGenericGithubUrl = project.githubUrl === "https://github.com" || project.githubUrl === "#";
        const hasGenericLiveUrl = project.liveUrl === "https://example.com" || project.liveUrl === "#";
        const hasGenericUrls = hasGenericGithubUrl && hasGenericLiveUrl;
        
        // Hide sample projects: has generic URLs AND no real uploaded images
        // Show projects if they DON'T have generic URLs OR they DO have real uploaded images
        return !hasGenericUrls || hasRealUploadedImages;
      });
    }

    recentProjects.forEach((project: any) => {
      activities.push({
        _id: `project_${project._id}`,
        type: 'project_upload',
        user: {
          _id: project.author?.id,
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
