import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

/**
 * GET /api/activity/recent
 * Get recent user uploaded projects as posts (PROJECTS ONLY)
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

    console.log('🚀 User Posts Only API: Called');
    console.log(`📊 Limit: ${limit}, UserId: ${userId}, AuthenticatedOnly: ${authenticatedOnly}`);

    const activities: any[] = [];

    // Fetch recent projects ONLY
    let recentProjects = await Project.find({})
      .select('_id title author authorId createdAt githubUrl liveUrl images')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    console.log(`📊 Found ${recentProjects.length} projects`);

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
      
      console.log(`📊 Filtered to ${recentProjects.length} real projects`);
    }

    // Get user data for all projects
    const activitiesWithUserData = await Promise.all(recentProjects.map(async (project: any) => {
      let currentUserData = {
        _id: null,
        name: 'Unknown Author',
        username: 'unknown',
        profileImage: null,
        avatar: null
      };
      
      // Try to fetch user data using author field (ObjectId) or authorId
      let authorId = project.authorId;
      if (!authorId && project.author) {
        // author field contains ObjectId
        authorId = project.author;
      }
      
      if (authorId) {
        try {
          const user = await User.findById(authorId).select('_id fullName photo email').exec();
          if (user) {
            currentUserData._id = user._id.toString();
            currentUserData.name = user.fullName || 'Unknown Author';
            currentUserData.username = user.email ? user.email.split('@')[0] : 'user';
            currentUserData.profileImage = user.photo && user.photo !== '/placeholder-user.jpg' ? user.photo : null;
            currentUserData.avatar = user.photo && user.photo !== '/placeholder-user.jpg' ? user.photo : null;
          }
        } catch (error) {
          console.error('Error fetching user by ID:', error);
        }
      }

      // Clean project title - remove any image paths or malformed data
      let projectTitle = project.title;
      if (!projectTitle || typeof projectTitle !== 'string') {
        projectTitle = 'Untitled Project';
      } else {
        // Remove any image paths, HTML-like content, or malformed data from title
        projectTitle = projectTitle
          .replace(/\/uploads\/[^\s"']+/g, '') // Remove upload paths
          .replace(/,?\s*alt:\s*['"][^'"]*['"]/g, '') // Remove alt attributes
          .replace(/,?\s*src:\s*['"][^'"]*['"]/g, '') // Remove src attributes
          .replace(/,\s*}/g, '') // Remove trailing commas and braces
          .replace(/['"]/g, '') // Remove quotes
          .replace(/^\s*,\s*/, '') // Remove leading commas
          .trim();
        
        if (!projectTitle || projectTitle === '}' || projectTitle === '') {
          projectTitle = 'Untitled Project';
        }
      }

      return {
        _id: `project_${project._id}`,
        type: 'project_upload',
        user: currentUserData,
        project: {
          _id: project._id,
          title: projectTitle
        },
        timestamp: project.createdAt,
        description: `uploaded "${projectTitle}"`
      };
    }));

    activities.push(...activitiesWithUserData);

    console.log('✅ User Posts Only API: Returning only user uploaded projects');
    console.log(`📊 Total user posts: ${activities.length}`);

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