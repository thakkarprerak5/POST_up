// Create activity API with only user uploaded projects as posts
const fs = require('fs');

const userPostsOnlyAPI = `import { connectDB } from '@/lib/db';
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
    console.log(\`📊 Limit: \${limit}, UserId: \${userId}, AuthenticatedOnly: \${authenticatedOnly}\`);

    const activities: any[] = [];

    // Fetch recent projects ONLY
    let recentProjects = await Project.find({})
      .select('_id title author authorId createdAt githubUrl liveUrl images')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    console.log(\`📊 Found \${recentProjects.length} projects\`);

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
      
      console.log(\`📊 Filtered to \${recentProjects.length} real projects\`);
    }

    // Get user data for all projects
    const activitiesWithUserData = await Promise.all(recentProjects.map(async (project: any) => {
      let currentUserData = {
        _id: project.author?.id,
        name: project.author?.name,
        avatar: null
      };
      
      // Ensure authorId is always set - use author.id as fallback
      const authorId = project.authorId || project.author?.id;
      
      // Fetch current author data dynamically using authorId
      if (authorId) {
        try {
          const user = await User.findById(authorId).exec();
          if (user) {
            currentUserData._id = user._id.toString();
            currentUserData.name = user.fullName;
            currentUserData.avatar = user.photo && user.photo !== '/placeholder-user.jpg' ? user.photo : null;
          } else {
            currentUserData.name = 'Unknown Author';
            currentUserData.avatar = null;
          }
        } catch (error) {
          currentUserData.name = 'Unknown Author';
          currentUserData.avatar = null;
        }
      } else if (project.author?.name) {
        try {
          const user = await User.findOne({ fullName: project.author.name }).exec();
          if (user) {
            currentUserData._id = user._id.toString();
            currentUserData.name = user.fullName;
            currentUserData.avatar = user.photo && user.photo !== '/placeholder-user.jpg' ? user.photo : null;
          } else {
            currentUserData.name = 'Unknown Author';
            currentUserData.avatar = null;
          }
        } catch (error) {
          currentUserData.name = 'Unknown Author';
          currentUserData.avatar = null;
        }
      }

      return {
        _id: \`project_\${project._id}\`,
        type: 'project_upload',
        user: currentUserData,
        project: {
          _id: project._id,
          title: project.title
        },
        timestamp: project.createdAt,
        description: \`uploaded "\${project.title}"\`
      };
    }));

    activities.push(...activitiesWithUserData);

    console.log('✅ User Posts Only API: Returning only user uploaded projects');
    console.log(\`📊 Total user posts: \${activities.length}\`);

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
}`;

// Write user posts only API
fs.writeFileSync('./app/api/activity/recent/route.ts', userPostsOnlyAPI);
console.log('✅ Created user posts only activity API');
console.log('🔄 Please refresh your browser to see only user uploaded projects');
