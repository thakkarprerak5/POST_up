import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

// DELETE: Admin/Super Admin delete comment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;

  console.log('=== ADMIN DELETE COMMENT DEBUG ===');
  console.log('Comment ID:', commentId);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('No session found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log('User not found in database');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or super_admin
    if (!['admin', 'super_admin'].includes(user.role)) {
      console.log('User not authorized. Role:', user.role);
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('Admin user found:', user._id, 'Role:', user.role);

    // Search for comment across all projects
    const projects = await Project.find({});
    let targetComment = null;
    let targetProject = null;

    for (const project of projects) {
      const commentIndex = project.comments.findIndex(
        (comment: any) => comment.id === commentId
      );
      
      if (commentIndex !== -1) {
        targetComment = project.comments[commentIndex];
        targetProject = project;
        break;
      }
    }

    if (!targetComment || !targetProject) {
      console.log('Comment not found across all projects');
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    console.log('Comment found:', targetComment.id, 'in project:', targetProject._id);
    console.log('Comment author:', targetComment.userId);

    // Check if user is comment author or project author
    const isCommentAuthor = targetComment.userId === user._id.toString() || 
                           targetComment.userId === session.user.email ||
                           targetComment.userId === user.email;
    
    const isProjectAuthor = targetProject.author?.id?.toString() === user._id.toString();
    
    if (!isCommentAuthor && !isProjectAuthor) {
      console.log('User not authorized. Comment author:', targetComment.userId, 'Current user:', user._id.toString(), 'Project author:', targetProject.author?.id?.toString());
      return NextResponse.json(
        { 
          success: false, 
          error: 'Not authorized to delete this comment',
          details: 'You must be the comment author or project author to delete this comment'
        },
        { status: 403 }
      );
    }

    // Remove the comment
    const commentIndex = targetProject.comments.findIndex(
      (comment: any) => comment.id === commentId
    );
    
    if (commentIndex !== -1) {
      targetProject.comments.splice(commentIndex, 1);
      await targetProject.save();
      console.log('Comment deleted successfully by admin:', user.email);
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully by admin',
      comment: {
        id: targetComment.id,
        deletedBy: user.email,
        deletedByRole: user.role,
        deletedAt: new Date()
      }
    });

  } catch (error: any) {
    console.error('Error deleting comment by admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
} 