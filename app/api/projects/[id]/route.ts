import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

// Soft delete function
async function softDeleteProject(projectId: string, userId: string) {
  const restoreAvailableUntil = new Date();
  restoreAvailableUntil.setHours(restoreAvailableUntil.getHours() + 24);
  
  return Project.findByIdAndUpdate(
    projectId,
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      restoreAvailableUntil: restoreAvailableUntil
    },
    { new: true }
  ).exec();
}

/**
 * GET /api/projects/[id]
 * Fetch a single project by ID
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    // Await the params in Next.js 13+ app router
    const { id } = await params;
    
    // Debug: Log the params
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
      console.log('🔑 Session in GET:', session?.user?.email ? 'Found' : 'Not found');
      
      if (session?.user?.email) {
        // Get the actual user from database to ensure we have the correct ID
        const user = await User.findOne({ email: session.user.email }).exec();
        if (user) {
          console.log('👤 Database User ID:', user._id.toString());
          console.log('👤 Session User ID:', session.user.id);
          
          // Use database user ID for consistency
          const userIdStr = user._id.toString();
          const likesArray = Array.isArray(project.likes) ? project.likes : [];
          
          console.log('🔍 Debugging like calculation:');
          console.log('Database User ID:', userIdStr);
          console.log('Likes array:', likesArray);
          console.log('Likes array types:', likesArray.map(id => ({ id, type: typeof id, toString: () => id.toString() })));
          
          likedByUser = likesArray.some(likeId => {
            const likeIdStr = likeId.toString();
            
            // Handle both string and ObjectId comparison
            let isMatch = likeIdStr === userIdStr;
            
            // If likeId is an ObjectId with equals method, use that too
            if (likeId && typeof likeId === 'object' && typeof likeId.equals === 'function') {
              try {
                isMatch = isMatch || likeId.equals(user._id);
              } catch (e) {
                // If equals fails, fall back to string comparison
                console.log('ObjectId.equals failed, using string comparison');
              }
            }
            
            console.log(`Checking like ID ${likeIdStr} against database user ID ${userIdStr}: ${isMatch}`);
            return isMatch;
          });
          
          console.log('🎯 Final likedByUser result:', likedByUser);
        } else {
          console.log('❌ User not found in database');
        }
      } else {
        console.log('❌ No valid session found');
        console.log('Session email:', session?.user?.email);
        console.log('Session ID:', session?.user?.id);
      }
    } catch (error) {
      console.log('❌ Error checking like status:', error);
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

    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user || project.author.id !== user._id.toString()) {
      return Response.json({ error: 'Not authorized to update this project' }, { status: 403 });
    }

    const formData = await req.formData();
    const title = formData.get('title')?.toString() || '';
    const description = formData.get('description')?.toString() || '';
    const githubUrl = formData.get('githubUrl')?.toString() || '';
    const liveUrl = formData.get('liveUrl')?.toString() || '';
    const tags = (formData.get('tags')?.toString() || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    // Handle image uploads
    const images: string[] = [...(project.images || [])];
    const files = formData.getAll('images') as File[];
    if (files && files.length) {
      const { mkdir, writeFile } = await import('fs/promises');
      const { join } = await import('path');
      const { v4: uuidv4 } = await import('uuid');
      
      const uploadsDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });
      for (const file of files) {
        const ext = file.name.split('.').pop() || 'png';
        const filename = `${uuidv4()}.${ext}`;
        const filePath = join(uploadsDir, filename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);
        images.push(`/uploads/${filename}`);
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        title,
        description,
        tags,
        images,
        githubUrl,
        liveUrl,
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();

    return Response.json(updatedProject);
  } catch (error: any) {
    console.error('PATCH /api/projects/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * Soft delete project (only author can delete)
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user || project.author.id !== user._id.toString()) {
      return Response.json({ error: 'Not authorized to delete this project' }, { status: 403 });
    }

    // Soft delete function
    async function softDeleteProject(projectId: string, userId: string) {
      try {
        await connectDB();
        const project = await Project.findById(projectId).exec();
        
        if (!project) {
          throw new Error('Project not found');
        }
        
        // Mark as soft deleted
        project.isDeleted = true;
        project.deletedAt = new Date();
        project.deletedBy = userId;
        project.restoreAvailableUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        
        await project.save();
        return project;
      } catch (error) {
        throw new Error('Failed to soft delete project');
      }
    }

    // Soft delete the project
    const deletedProject = await softDeleteProject(id, user._id.toString());
    
    return Response.json({ 
      message: 'Project deleted successfully. You can restore it within 24 hours.',
      project: deletedProject,
      restoreAvailableUntil: deletedProject.restoreAvailableUntil
    });
  } catch (error: any) {
    console.error('DELETE /api/projects/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
