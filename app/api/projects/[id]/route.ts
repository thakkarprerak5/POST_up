import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

/**
 * GET /api/projects/[id]
 * Fetch a single project by ID
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const project = await Project.findById(params.id).exec();
    
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    return Response.json(project);
  } catch (error: any) {
    console.error('GET /api/projects/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/projects/[id]
 * Update project (only author can update)
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const project = await Project.findById(params.id).exec();
    
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is the author
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user || project.author.id !== user._id.toString()) {
      return Response.json({ error: 'Not authorized to update this project' }, { status: 403 });
    }

    const data = await req.json();
    Object.assign(project, data);
    await project.save();

    return Response.json(project);
  } catch (error: any) {
    console.error('PATCH /api/projects/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete project (only author can delete)
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const project = await Project.findById(params.id).exec();
    
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user || project.author.id !== user._id.toString()) {
      return Response.json({ error: 'Not authorized to delete this project' }, { status: 403 });
    }

    await Project.findByIdAndDelete(params.id).exec();
    return Response.json({ message: 'Project deleted' });
  } catch (error: any) {
    console.error('DELETE /api/projects/[id] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
