// Update activity API to include mentor assignments
const fs = require('fs');

const updatedActivityAPI = `import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * GET /api/activity/recent
 * Get recent activities from platform including mentor assignments
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
      .select('_id title author authorId createdAt githubUrl liveUrl images')
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

    // Get user data for all projects (same logic as projects API)
    const activitiesWithUserData = await Promise.all(recentProjects.map(async (project: any) => {
      let currentUserData = {
        _id: project.author?.id,
        name: project.author?.name,
        avatar: null
      };
      
      // Ensure authorId is always set - use author.id as fallback
      const authorId = project.authorId || project.author?.id;
      
      // FIX: Fetch current author data dynamically using authorId
      if (authorId) {
        try {
          // Fetch the user's current data from database using authorId
          const user = await User.findById(authorId).exec();
          if (user) {
            // Update author object with current user data
            currentUserData._id = user._id.toString();
            currentUserData.name = user.fullName;
            currentUserData.avatar = user.photo && user.photo !== '/placeholder-user.jpg' ? user.photo : null;
          } else {
            // If user not found by ID, this is a data integrity issue
            // Don't fallback to old name as it creates confusion
            currentUserData.name = 'Unknown Author';
            currentUserData.avatar = null;
          }
        } catch (error) {
          // If user lookup fails, mark as unknown to avoid confusion
          currentUserData.name = 'Unknown Author';
          currentUserData.avatar = null;
        }
      } else if (project.author?.name) {
        // Legacy fallback for projects without authorId
        try {
          // Try to find user by stored name first
          const user = await User.findOne({ fullName: project.author.name }).exec();
          if (user) {
            // Found user by name - update with current data
            currentUserData._id = user._id.toString();
            currentUserData.name = user.fullName;
            currentUserData.avatar = user.photo && user.photo !== '/placeholder-user.jpg' ? user.photo : null;
          } else {
            // No user found with this name - mark as unknown
            currentUserData.name = 'Unknown Author';
            currentUserData.avatar = null;
          }
        } catch (error) {
          // If lookup fails, mark as unknown
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

    // ADD MENTOR ASSIGNMENT ACTIVITIES
    try {
      const db = mongoose.connection.db;
      const mentorAssignments = await db.collection('mentorassignments').find({}).toArray();
      
      console.log('🔍 Adding mentor assignments to activity feed:', mentorAssignments.length);
      
      const mentorAssignmentActivities = await Promise.all(mentorAssignments.map(async (assignment: any) => {
        try {
          // Get mentor data
          const mentor = await db.collection('users').findOne({
            _id: new mongoose.Types.ObjectId(assignment.mentorId)
          });
          
          // Get student data
          const student = await db.collection('users').findOne({
            _id: new mongoose.Types.ObjectId(assignment.studentId)
          });
          
          if (mentor && student) {
            return {
              _id: \`mentor_assignment_\${assignment._id}\`,
              type: 'mentor_assignment',
              user: {
                _id: mentor._id.toString(),
                name: mentor.fullName,
                avatar: mentor.photo && mentor.photo !== '/placeholder-user.jpg' ? mentor.photo : null
              },
              project: null,
              timestamp: assignment.assignedAt,
              description: \`was assigned as mentor to \${student.fullName}\`
            };
          }
          return null;
        } catch (error) {
          console.error('Error processing mentor assignment activity:', error);
          return null;
        }
      }));
      
      // Filter out null results and add to activities
      const validMentorActivities = mentorAssignmentActivities.filter(activity => activity !== null);
      activities.push(...validMentorActivities);
      
      console.log('✅ Added mentor assignment activities:', validMentorActivities.length);
      
    } catch (error) {
      console.error('Error fetching mentor assignments for activity feed:', error);
    }

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

// Write the updated activity API
fs.writeFileSync('./app/api/activity/recent/route.ts', updatedActivityAPI);
console.log('✅ Updated activity API to include mentor assignments');
console.log('🔄 Please refresh your browser to see mentor assignment activities');
