import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

/**
 * POST /api/projects/[id]/share
 * Share or unshare a project
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const project = await Project.findById(params.id).exec();
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const userId = user._id.toString();
    const shareIndex = project.shares.indexOf(userId);

    if (shareIndex > -1) {
      // Unshare
      project.shares.splice(shareIndex, 1);
      project.shareCount = Math.max(0, project.shareCount - 1);
    } else {
      // Share
      project.shares.push(userId);
      project.shareCount = project.shares.length;
    }

    await project.save();
    return Response.json({
      shared: shareIndex === -1,
      shareCount: project.shareCount
    });
  } catch (error: any) {
    console.error('POST /api/projects/[id]/share error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
