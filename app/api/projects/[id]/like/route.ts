import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

/**
 * POST /api/projects/[id]/like
 * Like or unlike a project
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
    const likeIndex = project.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      project.likes.splice(likeIndex, 1);
      project.likeCount = Math.max(0, project.likeCount - 1);
    } else {
      // Like
      project.likes.push(userId);
      project.likeCount = project.likes.length;
    }

    await project.save();
    return Response.json({
      liked: likeIndex === -1,
      likeCount: project.likeCount,
      project
    });
  } catch (error: any) {
    console.error('POST /api/projects/[id]/like error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
