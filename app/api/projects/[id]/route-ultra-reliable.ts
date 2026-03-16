import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * GET /api/projects/[id]
 * Fetch a single project by ID - Ultra-reliable version
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure database connection
    await connectDB();
    
    // Await the params in Next.js 13+ app router
    const { id } = await params;
    
    console.log('🔍 [PROJECT API] Fetching project with ID:', id);
    console.log('🔍 [PROJECT API] MongoDB connection state:', mongoose.connection.readyState);
    
    // Validate ObjectId format
    if (!id || typeof id !== 'string') {
      console.log('❌ [PROJECT API] Invalid ID format:', id);
      return Response.json({ error: 'Invalid project ID format' }, { status: 400 });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ [PROJECT API] Invalid ObjectId:', id);
      return Response.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    
    let project = null;
    
    // Method 1: Try standard Project model first
    try {
      project = await Project.findById(id).exec();
      console.log('📊 [PROJECT API] Method 1 - Project.findById result:', project ? 'Found' : 'Not found');
    } catch (error) {
      console.log('⚠️ [PROJECT API] Method 1 failed:', error.message);
    }
    
    // Method 2: If not found, try direct collection access
    if (!project) {
      try {
        const db = mongoose.connection.db;
        if (db) {
          const projectsCollection = db.collection('projects');
          project = await projectsCollection.findOne({ _id: new mongoose.Types.ObjectId(id) });
          console.log('📊 [PROJECT API] Method 2 - Direct collection result:', project ? 'Found' : 'Not found');
        }
      } catch (error) {
        console.log('⚠️ [PROJECT API] Method 2 failed:', error.message);
      }
    }
    
    // Method 3: Try with string ID (for compatibility)
    if (!project) {
      try {
        const db = mongoose.connection.db;
        if (db) {
          const projectsCollection = db.collection('projects');
          project = await projectsCollection.findOne({ _id: id });
          console.log('📊 [PROJECT API] Method 3 - String ID result:', project ? 'Found' : 'Not found');
        }
      } catch (error) {
        console.log('⚠️ [PROJECT API] Method 3 failed:', error.message);
      }
    }
    
    if (!project) {
      console.log('❌ [PROJECT API] Project not found with ID:', id);
      
      // List some available projects for debugging
      try {
        const db = mongoose.connection.db;
        if (db) {
          const projectsCollection = db.collection('projects');
          const sampleProjects = await projectsCollection.find({}).limit(3).toArray();
          console.log('🔍 [PROJECT API] Sample available projects:');
          sampleProjects.forEach((p, i) => {
            console.log(`  ${i + 1}. ID: ${p._id}, Title: ${p.title}`);
          });
        }
      } catch (error) {
        console.log('⚠️ [PROJECT API] Could not list sample projects:', error.message);
      }
      
      return Response.json({ 
        error: 'Project not found',
        requestedId: id,
        debug: 'Project not found in database'
      }, { status: 404 });
    }
    
    // Check if project is soft deleted
    if (project.isDeleted) {
      console.log('🗑️ [PROJECT API] Project is soft deleted, checking permissions...');
      
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }

      const user = await User.findOne({ email: session.user.email }).exec();
      const authorId = project.author?.id || project.author?._id || project.author;
      if (!user || authorId !== user._id.toString()) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }
      
      // Return deleted project for owner
      return Response.json({
        ...project,
        isDeleted: true,
        deletedAt: project.deletedAt,
        restoreAvailableUntil: project.restoreAvailableUntil
      });
    }
    
    // Fetch author data
    const authorId = project.author?.id || project.author?._id || project.author;
    if (authorId) {
      try {
        const authorData = await User.findById(authorId).exec();
        if (authorData) {
          // Update project with current author data
          project.author = {
            id: authorData._id.toString(),
            _id: authorData._id.toString(),
            name: authorData.fullName || 'Unknown Author',
            email: authorData.email || '',
            image: authorData.photo && authorData.photo !== '/placeholder-user.jpg' ? authorData.photo : null,
            avatar: authorData.photo && authorData.photo !== '/placeholder-user.jpg' ? authorData.photo : null
          };
        } else {
          console.log('⚠️ [PROJECT API] Author not found:', authorId);
          project.author = {
            id: authorId.toString(),
            _id: authorId.toString(),
            name: 'Unknown Author',
            email: '',
            image: null,
            avatar: null
          };
        }
      } catch (error) {
        console.log('⚠️ [PROJECT API] Error fetching author data:', error.message);
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
        console.log('⚠️ [PROJECT API] Error checking like status:', error.message);
      }
    }
    
    console.log('✅ [PROJECT API] Successfully returned project:', project.title);
    
    return Response.json({
      ...project,
      likedByUser
    });
    
  } catch (error: any) {
    console.error('❌ [PROJECT API] Critical error:', error);
    console.error('❌ [PROJECT API] Error stack:', error.stack);
    return Response.json({ 
      error: error.message || 'Failed to fetch project',
      details: error.stack,
      debug: 'Critical API error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * Soft delete project (only author can delete)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const project = await Project.findById(id);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 403 });
    }

    const isAuthorized = project.author.toString() === user._id.toString();
    if (!isAuthorized) {
      return Response.json({ error: 'Not authorized to delete this project' }, { status: 403 });
    }

    // Soft delete the project
    project.isDeleted = true;
    project.deletedAt = new Date();
    project.restoreAvailableUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await project.save();
    
    return Response.json({ 
      message: 'Project deleted successfully. You can restore it within 24 hours.',
      project: project,
      restoreAvailableUntil: project.restoreAvailableUntil
    });
  } catch (error: any) {
    console.error('DELETE /api/projects/[id] error:', error);
    return Response.json({ 
      error: error.message || 'Failed to delete project'
    }, { status: 500 });
  }
}
