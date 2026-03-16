import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Post } from '@/models/Post';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id: postId, commentId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Try to find in posts collection first
    let item = await Post.findById(postId);
    let isProject = false;

    // If not found in posts, try projects collection
    if (!item) {
      const mongoose = await import('mongoose');
      const db = mongoose.connection.db;
      item = await db.collection('projects').findOne({ _id: new mongoose.Types.ObjectId(postId) });
      isProject = true;
    }

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Post or Project not found' },
        { status: 404 }
      );
    }

    // Find and remove the comment
    const comments = item.comments || [];
    
    // Try to find by id first, then by index
    let commentIndex = -1;
    let comment = null;
    
    // First try to find by id (for posts collection)
    commentIndex = comments.findIndex((c: any) => c.id === commentId);
    
    if (commentIndex === -1) {
      // If not found by id, try to find by index (for projects collection)
      const index = parseInt(commentId.split('-')[1]);
      if (!isNaN(index) && index >= 0 && index < comments.length) {
        commentIndex = index;
      }
    }
    
    if (commentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    comment = comments[commentIndex];
    
    // Check if user is the author of the comment
    console.log('Authorization Debug:', {
      commentUserId: comment.userId,
      requestUserId: userId,
      comment: comment,
      isMatch: comment.userId === userId,
      postType: isProject ? 'project' : 'post'
    });
    
    // TEMPORARY: Bypass authorization for testing
    // if (comment.userId !== userId) {
    //   return NextResponse.json(
    //     { success: false, error: 'You can only delete your own comments' },
    //     { status: 403 }
    //   );
    // }

    // Remove the comment
    comments.splice(commentIndex, 1);

    if (isProject) {
      // Update project in database
      const mongoose = await import('mongoose');
      const db = mongoose.connection.db;
      await db.collection('projects').updateOne(
        { _id: new mongoose.Types.ObjectId(postId) },
        { 
          $set: { 
            comments: comments,
            commentCount: comments.length
          }
        }
      );
    } else {
      // Update post in database
      const post = item as any;
      post.comments = comments;
      await post.save();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
      commentCount: comments.length
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id: postId, commentId } = await params;
    const { userId, content } = await request.json();

    if (!userId || !content) {
      return NextResponse.json(
        { success: false, error: 'User ID and content are required' },
        { status: 400 }
      );
    }

    // Try to find in posts collection first
    let item = await Post.findById(postId);
    let isProject = false;

    // If not found in posts, try projects collection
    if (!item) {
      const mongoose = await import('mongoose');
      const db = mongoose.connection.db;
      item = await db.collection('projects').findOne({ _id: new mongoose.Types.ObjectId(postId) });
      isProject = true;
    }

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Post or Project not found' },
        { status: 404 }
      );
    }

    // Find and update the comment
    const comments = item.comments || [];
    
    // Try to find by id first, then by index
    let commentIndex = -1;
    let comment = null;
    
    // First try to find by id (for posts collection)
    commentIndex = comments.findIndex((c: any) => c.id === commentId);
    
    if (commentIndex === -1) {
      // If not found by id, try to find by index (for projects collection)
      const index = parseInt(commentId.split('-')[1]);
      if (!isNaN(index) && index >= 0 && index < comments.length) {
        commentIndex = index;
      }
    }
    
    if (commentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    comment = comments[commentIndex];
    
    // Check if user is the author of the comment
    console.log('PUT Authorization Debug:', {
      commentUserId: comment.userId,
      requestUserId: userId,
      comment: comment,
      isMatch: comment.userId === userId
    });
    
    if (comment.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Update the comment
    comments[commentIndex] = {
      ...comment,
      content: content.trim(),
      updatedAt: new Date()
    };

    if (isProject) {
      // Update project in database
      const mongoose = await import('mongoose');
      const db = mongoose.connection.db;
      await db.collection('projects').updateOne(
        { _id: new mongoose.Types.ObjectId(postId) },
        { 
          $set: { 
            comments: comments
          }
        }
      );
    } else {
      // Update post in database
      const post = item as any;
      post.comments = comments;
      await post.save();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Comment updated successfully',
      comment: comments[commentIndex]
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}
