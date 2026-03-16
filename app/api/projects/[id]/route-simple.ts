import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * GET /api/projects/[id]
 * Fetch a single project by ID - Simplified version
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Await the params in Next.js 13+ app router
    const { id } = await params;
    
    console.log('🔍 Fetching project with ID:', id);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ Invalid ObjectId format:', id);
      return Response.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    
    // Find project using the standard Project model
    const project = await Project.findById(id).exec();
    
    if (!project) {
      console.log('❌ Project not found:', id);
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Check if project is soft deleted
    if (project.isDeleted) {
      console.log('🗑️ Project is soft deleted, checking permissions...');
      
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }

      const user = await User.findOne({ email: session.user.email }).exec();
      if (!user || project.author.toString() !== user._id.toString()) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }
      
      // Return deleted project for owner
      return Response.json({
        ...project.toObject(),
        isDeleted: true,
        deletedAt: project.deletedAt,
        restoreAvailableUntil: project.restoreAvailableUntil
      });
    }
    
    // Fetch author data
    let authorData = null;
    if (project.author) {
      try {
        authorData = await User.findById(project.author).exec();
        if (authorData) {
          // Update project with current author data
          project.author = {
            id: authorData._id.toString(),
            _id: authorData._id.toString(),
            name: authorData.fullName,
            email: authorData.email,
            image: authorData.photo && authorData.photo !== '/placeholder-user.jpg' ? authorData.photo : null,
            avatar: authorData.photo && authorData.photo !== '/placeholder-user.jpg' ? authorData.photo : null
          };
        }
      } catch (error) {
        console.log('⚠️ Error fetching author data:', error);
        // Keep existing author data if fetch fails
      }
    }
    
    // Check like status if user is authenticated
    let likedByUser = false;
    const session = await getServerSession(authOptions);
    
    if (session?.user?.email) {
      try {
        const user = await User.findOne({ email: session.user.email }).exec();
        if (user) {
          const userIdStr = user._id.toString();
          const likesArray = Array.isArray(project.likes) ? project.likes : [];
          likedByUser = likesArray.some(likeId => likeId.toString() === userIdStr);
        }
      } catch (error) {
        console.log('⚠️ Error checking like status:', error);
      }
    }
    
    console.log('✅ Project found and returned:', project.title);
    
    return Response.json({
      ...project.toObject(),
      likedByUser
    });
    
  } catch (error: any) {
    console.error('❌ GET /api/projects/[id] error:', error);
    return Response.json({ 
      error: error.message || 'Failed to fetch project' 
    }, { status: 500 });
  }
}
