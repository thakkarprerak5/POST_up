import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

/**
 * POST /api/projects/[id]/share
 * Share or unshare a project
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('=== SHARE API DEBUG ===');
    console.log('Project ID:', id);
    console.log('Project ID type:', typeof id);
    console.log('Project ID length:', id?.length);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Looking for project with ID:', id);
    const project = await Project.findById(id).exec();
    console.log('Project found:', !!project);
    
    if (!project) {
      console.log('Project not found in database');
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const userId = user._id.toString();
    
    // Always increment share count on every click
    project.shares.push(userId);
    project.shareCount = project.shares.length;
    console.log('Share count incremented to:', project.shareCount);

    await project.save();
    return Response.json({
      shared: true,
      shareCount: project.shareCount,
      message: 'Project shared successfully!'
    });
  } catch (error: any) {
    console.error('POST /api/projects/[id]/share error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
