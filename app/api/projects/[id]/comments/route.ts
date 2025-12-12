import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

/**
 * POST /api/projects/[id]/comment
 * Add a comment to a project
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text || text.trim().length === 0) {
      return Response.json({ error: 'Comment text is required' }, { status: 400 });
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

    const comment = {
      id: `comment_${Date.now()}`,
      userId: user._id.toString(),
      userName: user.fullName,
      userAvatar: user.photo || '/placeholder-user.jpg',
      text: text.trim(),
      createdAt: new Date()
    };

    project.comments.push(comment);
    await project.save();

    return Response.json({
      comment,
      commentCount: project.comments.length
    });
  } catch (error: any) {
    console.error('POST /api/projects/[id]/comment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]/comment/[commentId]
 * Delete a comment (only comment author or project author can delete)
 */
export async function DELETE(req: Request, { params }: { params: { id: string; commentId: string } }) {
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

    const comment = project.comments.find((c: any) => c.id === params.commentId);
    if (!comment) {
      return Response.json({ error: 'Comment not found' }, { status: 404 });
    }

    const userId = user._id.toString();
    const isCommentAuthor = comment.userId === userId;
    const isProjectAuthor = project.author.id === userId;

    if (!isCommentAuthor && !isProjectAuthor) {
      return Response.json({ error: 'Not authorized to delete this comment' }, { status: 403 });
    }

    project.comments = project.comments.filter((c: any) => c.id !== params.commentId);
    await project.save();

    return Response.json({
      message: 'Comment deleted',
      commentCount: project.comments.length
    });
  } catch (error: any) {
    console.error('DELETE /api/projects/[id]/comment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
