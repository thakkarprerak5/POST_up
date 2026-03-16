import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import { ObjectId } from 'mongodb';

/**
 * POST /api/projects/[id]/like
 * Like or unlike a project
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params in Next.js 13+ app router
  const { id } = await params;

  // Extract the project ID from the URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const projectIdFromUrl = pathSegments[pathSegments.indexOf('projects') + 1];

  // Use the ID from params first, fallback to URL extraction
  const projectId = id || projectIdFromUrl;

  console.log('🔵 Like endpoint called with params:', {
    id: id,
    projectIdFromUrl,
    finalProjectId: projectId,
    type: typeof projectId,
    pathname: url.pathname
  });

  try {
    // Validate project ID
    if (!projectId) {
      console.error('❌ No project ID provided');
      return Response.json(
        {
          success: false,
          error: 'Project ID is required',
          receivedId: projectId,
          type: typeof projectId,
          params: params,
          url: request.url
        },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('❌ Unauthorized: No session or email found');
      return Response.json(
        {
          success: false,
          error: 'You must be logged in to like a project'
        },
        { status: 401 }
      );
    }
    console.log('🔑 User session found for:', session.user.email);

    // Connect to database
    try {
      await connectDB();
      console.log('✅ Connected to database');
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return Response.json(
        {
          success: false,
          error: 'Database connection error',
          details: dbError instanceof Error ? dbError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Find user
    let user;
    try {
      user = await User.findOne({ email: session.user.email }).lean().exec();
      if (!user) {
        console.error('❌ User not found with email:', session.user.email);
        return Response.json(
          {
            success: false,
            error: 'User not found'
          },
          { status: 404 }
        );
      }
      console.log('👤 User found:', user._id);
    } catch (userError) {
      console.error('❌ Error finding user:', userError);
      return Response.json(
        {
          success: false,
          error: 'Error finding user',
          details: userError instanceof Error ? userError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Find project
    let project;
    try {
      // Try to find by _id if it's a valid ObjectId
      if (ObjectId.isValid(projectId)) {
        project = await Project.findById(projectId).exec();
      }

      // If not found by _id, try finding by id field
      if (!project) {
        project = await Project.findOne({ id: projectId }).exec();
      }

      if (!project) {
        console.error('❌ Project not found with ID:', projectId);
        return Response.json(
          {
            success: false,
            error: 'Project not found',
            receivedId: projectId,
            type: typeof projectId
          },
          { status: 404 }
        );
      }

      // Fix projectStatus enum validation issue
      if (project.projectStatus && typeof project.projectStatus === 'string') {
        const validStatuses = ['PENDING', 'ACTIVE', 'ARCHIVED'];
        if (!validStatuses.includes(project.projectStatus)) {
          // Convert lowercase to uppercase if it matches a valid status
          const upperStatus = project.projectStatus.toUpperCase();
          if (validStatuses.includes(upperStatus)) {
            project.projectStatus = upperStatus;
            console.log(`🔧 Fixed projectStatus: ${project.projectStatus} → ${upperStatus}`);
          } else {
            // Default to PENDING if invalid status
            project.projectStatus = 'PENDING';
            console.log(`🔧 Defaulted projectStatus to PENDING (was: ${project.projectStatus})`);
          }
        }
      }

      console.log('📦 Project found:', project._id);
    } catch (projectError) {
      console.error('❌ Error finding project:', projectError);
      return Response.json(
        {
          success: false,
          error: 'Error finding project',
          details: projectError instanceof Error ? projectError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    const userId = user._id.toString();
    console.log(`🔄 Processing like for project ${project._id} by user ${userId}`);

    try {
      // Initialize likes array if it doesn't exist
      if (!project.likes || !Array.isArray(project.likes)) {
        project.likes = [];
        console.log('🔧 Initialized likes array');
      }

      // Initialize likeCount if it doesn't exist
      if (typeof project.likeCount !== 'number') {
        project.likeCount = project.likes.length;
        console.log('🔧 Initialized likeCount:', project.likeCount);
      }

      // Check if user already liked the project
      const likeIndex = project.likes.findIndex((id: any) => id.toString() === userId);
      console.log(`👍 Current like status: ${likeIndex > -1 ? 'LIKED' : 'NOT LIKED'}`);

      // Update like status
      if (likeIndex > -1) {
        // Unlike
        project.likes.splice(likeIndex, 1);
        project.likeCount = Math.max(0, project.likes.length);
        console.log('➖ Removed like, new count:', project.likeCount);
      } else {
        // Like
        project.likes.push(userId);
        project.likeCount = project.likes.length;
        console.log('➕ Added like, new count:', project.likeCount);
      }

      // Mark the document as modified to ensure save works
      project.markModified('likes');
      project.markModified('likeCount');

      // Save the updated project
      try {
        await project.save();
        console.log('💾 Project saved successfully');

        // Create notification for project author (only when liking, not unliking)
        if (likeIndex === -1 && project.authorId && project.authorId.toString() !== userId) {
          try {
            const { notifyLike } = await import('@/lib/services/NotificationService');
            await notifyLike(
              project.authorId.toString(),
              userId,
              user.fullName || 'Someone',
              'project',
              project._id.toString(),
              project.title
            );
            console.log('🔔 Like notification sent to project author');
          } catch (notifError) {
            console.error('❌ Failed to send like notification:', notifError);
            // Don't fail the like action if notification fails
          }
        }

        // Verify the save worked
        const savedProject = await Project.findById(project._id).exec();
        if (savedProject) {
          console.log('✅ Verification - Likes in DB:', savedProject.likes.length);
          console.log('✅ Verification - Like count:', savedProject.likeCount);
        } else {
          console.log('❌ Verification - Project not found after save');
        }
      } catch (saveError) {
        console.error('❌ Save error:', saveError);
        console.error('❌ Save error details:', {
          message: saveError instanceof Error ? saveError.message : 'Unknown error',
          name: saveError instanceof Error ? saveError.name : 'Unknown',
          stack: saveError instanceof Error ? saveError.stack : 'No stack'
        });
        throw new Error(`Failed to save like to database: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
      }

      // Return success response
      return Response.json({
        success: true,
        liked: likeIndex === -1, // true if newly liked, false if unliked
        likeCount: project.likeCount,
        project: {
          _id: project._id,
          title: project.title,
          likeCount: project.likeCount
        }
      });

    } catch (saveError) {
      console.error('❌ Error saving project:', saveError);
      return Response.json(
        {
          success: false,
          error: 'Failed to update like',
          details: saveError instanceof Error ? saveError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Unexpected error in like endpoint:', error);
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}