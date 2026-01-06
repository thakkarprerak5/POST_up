import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

// Restore function
async function restoreProject(projectId: string, userId: string) {
  const project = await Project.findById(projectId).exec();
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  if (!project.isDeleted) {
    throw new Error('Project is not deleted');
  }
  
  if (project.deletedBy !== userId) {
    throw new Error('You can only restore your own deleted projects');
  }
  
  if (project.restoreAvailableUntil && new Date() > project.restoreAvailableUntil) {
    throw new Error('Restore period has expired. Project cannot be restored.');
  }
  
  return Project.findByIdAndUpdate(
    projectId,
    {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      restoreAvailableUntil: undefined
    },
    { new: true }
  ).exec();
}

/**
 * POST /api/projects/[id]/restore
 * Restore a soft-deleted project
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Restore the project
    const restoredProject = await restoreProject(id, user._id.toString());
    
    return Response.json({ 
      message: 'Project restored successfully!',
      project: restoredProject
    });
  } catch (error: any) {
    console.error('POST /api/projects/[id]/restore error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/projects/[id]/restore
 * Check if a project can be restored
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const project = await Project.findById(id).exec();
    
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.isDeleted) {
      return Response.json({ 
        canRestore: false, 
        message: 'Project is not deleted' 
      });
    }

    if (project.deletedBy !== user._id.toString()) {
      return Response.json({ 
        canRestore: false, 
        message: 'You can only restore your own deleted projects' 
      });
    }

    const now = new Date();
    const canRestore = project.restoreAvailableUntil && now < project.restoreAvailableUntil;
    
    return Response.json({ 
      canRestore,
      restoreAvailableUntil: project.restoreAvailableUntil,
      timeRemaining: canRestore && project.restoreAvailableUntil ? 
        Math.max(0, project.restoreAvailableUntil.getTime() - now.getTime()) : 0
    });
  } catch (error: any) {
    console.error('GET /api/projects/[id]/restore error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
