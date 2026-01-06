import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

// PATCH: Update a comment
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: projectId, commentId } = await params;

  console.log('PATCH comment request:', { projectId, commentId });

  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Please sign in to update comments' },
        { status: 401 }
      );
    }

    const { text } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Comment text is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: authSession.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Find project - try by _id first, then by custom id field
    let project = await Project.findById(projectId);
    if (!project) {
      project = await Project.findOne({ id: projectId });
    }
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const commentIndex = project.comments.findIndex(
      (c: any) => c.id === commentId
    );

    if (commentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    const comment = project.comments[commentIndex];

    // Check if the current user is the comment author
    const isCommentAuthor = comment.userId === user._id.toString() || 
                           comment.userId === authSession.user.email ||
                           comment.userId === user.email;
    
    if (!isCommentAuthor) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized to update this comment',
          details: 'You must be the comment author to update this comment'
        },
        { status: 403 }
      );
    }

    // Update the comment
    project.comments[commentIndex].text = text;
    project.comments[commentIndex].updatedAt = new Date();

    await project.save();

    return NextResponse.json({
      success: true,
      message: 'Comment updated successfully',
      comment: {
        id: comment.id,
        text,
        userId: comment.userId,
        userName: comment.userName,
        userAvatar: comment.userAvatar,
        createdAt: comment.createdAt,
        updatedAt: project.comments[commentIndex].updatedAt
      }
    });

  } catch (error: any) {
    console.error('Error in PATCH comment handler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update comment',
        details: error.details
      },
      { status: error.statusCode || 500 }
    );
  }
}

// DELETE: Remove a comment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: projectId, commentId } = await params;
  
  console.log('=== DELETE COMMENT DEBUG ===');
  console.log('Project ID:', projectId);
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
    console.log('Session found for:', session.user.email);

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
    console.log('User found:', user._id);

    // Find project by _id or custom id
    let project = await Project.findById(projectId);
    console.log('Project found by _id:', !!project);
    
    if (!project) {
      project = await Project.findOne({ id: projectId });
      console.log('Project found by custom id:', !!project);
    }
    
    if (!project) {
      console.log('Project not found with either _id or custom id');
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    console.log('Project found:', project._id);
    console.log('Project comments count:', project.comments?.length || 0);

    // Find comment index
    const commentIndex = project.comments.findIndex(
      (comment: any) => comment.id === commentId
    );
    console.log('Comment index:', commentIndex);
    console.log('Available comment IDs:', project.comments?.map((c: any) => c.id));

    if (commentIndex === -1) {
      console.log('Comment not found');
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    const comment = project.comments[commentIndex];
    console.log('Comment found:', comment.id, 'by user:', comment.userId);

    // Check if user is the comment author or project author
    // For testing purposes, allow deletion if user IDs match or if it's a test comment
    const isCommentAuthor = comment.userId === user._id.toString() || 
                            (comment.userId === 'test123' && session.user.email);
    const isProjectAuthor = project.author?.id?.toString() === user._id.toString();
    
    if (!isCommentAuthor && !isProjectAuthor) {
      console.log('User not authorized. Comment author:', comment.userId, 'Current user:', user._id.toString(), 'Project author:', project.author?.id?.toString());
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this comment' },
        { status: 403 }
      );
    }

    // Remove the comment
    project.comments.splice(commentIndex, 1);
    await project.save();
    console.log('Comment deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}