import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import { ObjectId } from 'mongodb';

/**
 * GET /api/projects/[id]/check-like
 * Check if the current user has liked a project
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Extract the project ID from the URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const projectIdFromUrl = pathSegments[pathSegments.indexOf('projects') + 1];
  
  // Use the ID from params first, fallback to URL extraction
  const projectId = params?.id || projectIdFromUrl;
  
  console.log('🔵 Check-like endpoint called with params:', { 
    id: params?.id, 
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
          type: typeof projectId
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
          error: 'You must be logged in to check like status' 
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
    console.log(`🔍 Checking like status for project ${project._id} by user ${userId}`);

    try {
      // Check if user has liked the project
      const likeIndex = project.likes.findIndex((id: any) => id.toString() === userId);
      const isLiked = likeIndex > -1;
      
      console.log(`👍 Like status: ${isLiked ? 'LIKED' : 'NOT LIKED'}`);

      // Return success response
      return Response.json({
        success: true,
        liked: isLiked,
        likeCount: project.likeCount,
        project: {
          _id: project._id,
          title: project.title,
          likeCount: project.likeCount
        }
      });

    } catch (checkError) {
      console.error('❌ Error checking like status:', checkError);
      return Response.json(
        { 
          success: false,
          error: 'Failed to check like status',
          details: checkError instanceof Error ? checkError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Unexpected error in check-like endpoint:', error);
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
