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
  // Extract the project ID from URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const projectIdFromUrl = pathSegments[pathSegments.indexOf('projects') + 1];
  
  // Use the ID from params first, fallback to URL extraction
  const projectId = params?.id || projectIdFromUrl;
  
  console.log('🔵 Like endpoint called with params:', { 
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
      // Check if user already liked the project
      const likesArray = Array.isArray(project.likes) ? project.likes : [];
      const userIdStr = user._id.toString();
      const userIdObj = user._id;
      
      // Check if user ID exists in likes array (handle both string and ObjectId)
      console.log('🔍 Debugging like calculation:');
      console.log('User ID:', userIdStr);
      console.log('User ID Object:', userIdObj);
      console.log('Likes array:', likesArray);
      console.log('Likes array types:', likesArray.map(id => ({ id, type: typeof id, toString: () => id.toString(), equals: (other) => id.equals(other) })));
      
      const likeIndex = likesArray.findIndex(likeId => {
        const likeIdStr = likeId.toString();
        const likeIdObj = likeId;
        const isMatch = likeIdStr === userIdStr || likeIdObj.equals(userIdObj);
        
        console.log(`Checking like ID ${likeIdStr} against user ID ${userIdStr}: ${isMatch}`);
        return isMatch;
      });
      
      console.log(`👍 Current like status: ${likeIndex > -1 ? 'LIKED' : 'NOT LIKED'}`);

      // Update like status
      if (likeIndex > -1) {
        // Unlike
        project.likes.splice(likeIndex, 1);
        project.likeCount = Math.max(0, project.likeCount - 1);
        console.log('➖ Removed like, new count:', project.likeCount);
      } else {
        // Like
        project.likes.push(userId);
        project.likeCount = project.likes.length;
        console.log('➕ Added like, new count:', project.likeCount);
      }
      
      // Save the updated project
      try {
        await project.save();
        console.log('💾 Project saved successfully');
        
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
        throw new Error('Failed to save like to database');
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

/**
 * GET /api/projects/[id]
 * Get project details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params in Next.js 13+ app router
    const { id } = await params;
    
    console.log('GET /api/projects/[id] - id:', id);
    
    const project = await Project.findById(id).exec();
    
    console.log('Project found:', !!project);
    
    if (!project) {
      console.log('Project not found for ID:', id);
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if project is soft deleted and user is not the owner
    if (project.isDeleted) {
      console.log('Project is soft deleted, checking user permissions...');
      
      // Check if user is authenticated and is the owner
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        console.log('User not authenticated');
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }

      const user = await User.findOne({ email: session.user.email }).exec();
      if (!user || project.author.id !== user._id.toString()) {
        console.log('User not authorized to view deleted project');
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }
      
      // If user is owner, return project with deleted status
      console.log('User is owner, returning deleted project');
      return Response.json({
        ...project.toObject(),
        isDeleted: true,
        deletedAt: project.deletedAt,
        restoreAvailableUntil: project.restoreAvailableUntil
      });
    }

    console.log('Returning active project');
    
    // Check if user is authenticated to get like status
    let likedByUser = false;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const user = await User.findOne({ email: session.user.email }).exec();
        if (user) {
          // Check if user has liked this project
          const likesArray = Array.isArray(project.likes) ? project.likes : [];
          const userIdStr = user._id.toString();
          const userIdObj = user._id;
          
          // Check if user ID exists in likes array (handle both string and ObjectId)
          likedByUser = likesArray.some(likeId => {
            const likeIdStr = likeId.toString();
            const likeIdObj = likeId;
            const isMatch = likeIdStr === userIdStr || likeIdObj.equals(userIdObj);
            return isMatch;
          });
        }
      }
    } catch (error) {
      console.log('Error checking like status:', error);
    }
    
    return Response.json({
      ...project.toObject(),
      likedByUser: likedByUser
    });
  } catch (error: any) {
    console.error('GET /api/projects/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/projects/[id]
 * Update project (only author can update)
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const project = await Project.findById(id).exec();
    
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Check if user is the author
    if (project.author.id !== session.user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Update project with request body data
    const updateData = await req.json();
    Object.assign(project, updateData);
    project.updatedAt = new Date();
    
    await project.save();
    return Response.json({ success: true, project: project.toObject() });
  } catch (error: any) {
    console.error('PATCH /api/projects/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
