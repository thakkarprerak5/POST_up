import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Post } from '@/models/Post';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id: postId } = await params;

    // Validate postId
    if (!postId || postId.length !== 24) {
      return NextResponse.json(
        { success: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // Try to find in posts collection first
    let item = await Post.findById(postId).populate('comments.author', 'fullName email photo avatar');
    let isProject = false;

    // If not found in posts, try projects collection
    if (!item) {
      try {
        const mongoose = await import('mongoose');
        const db = mongoose.connection.db;
        
        // Check if ObjectId is valid before querying
        if (!mongoose.Types.ObjectId.isValid(postId)) {
          return NextResponse.json(
            { success: false, error: 'Invalid post ID format' },
            { status: 400 }
          );
        }
        
        item = await db.collection('projects').findOne({ _id: new mongoose.Types.ObjectId(postId) });
        isProject = true;
        
        // Populate author information for comments if it's a project
        if (item && item.comments && item.comments.length > 0) {
          const authorIds = [...new Set(item.comments.map((c: any) => c.userId).filter(Boolean))];
          const users = await db.collection('users').find({ _id: { $in: authorIds.map(id => new mongoose.Types.ObjectId(id)) } }).toArray();
          
          item.comments = item.comments.map((comment: any) => {
            const user = users.find((u: any) => u._id.toString() === comment.userId);
            return {
              ...comment,
              author: user ? {
                id: user._id.toString(),
                fullName: user.fullName,
                email: user.email,
                photo: user.photo || user.avatar
              } : null
            };
          });
        }
      } catch (dbError) {
        console.error('Error querying projects collection:', dbError);
        return NextResponse.json(
          { success: false, error: 'Database query error' },
          { status: 500 }
        );
      }
    }

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Post or Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      comments: item.comments || []
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id: postId } = await params;
    const { userId, content } = await request.json();

    // Validate postId
    if (!postId || postId.length !== 24) {
      return NextResponse.json(
        { success: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    if (!userId || !content) {
      return NextResponse.json(
        { success: false, error: 'User ID and content are required' },
        { status: 400 }
      );
    }

    // Validate ObjectId for userId
    const mongoose = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Try to find in posts collection first
    let item = await Post.findById(postId);
    let isProject = false;

    // If not found in posts, try projects collection
    if (!item) {
      try {
        const db = mongoose.connection.db;
        
        // Check if ObjectId is valid before querying
        if (!mongoose.Types.ObjectId.isValid(postId)) {
          return NextResponse.json(
            { success: false, error: 'Invalid post ID format' },
            { status: 400 }
          );
        }
        
        item = await db.collection('projects').findOne({ _id: new mongoose.Types.ObjectId(postId) });
        isProject = true;
      } catch (dbError) {
        console.error('Error querying projects collection:', dbError);
        return NextResponse.json(
          { success: false, error: 'Database query error' },
          { status: 500 }
        );
      }
    }

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Post or Project not found' },
        { status: 404 }
      );
    }

    // Create new comment
    const newComment = {
      author: new mongoose.Types.ObjectId(userId),
      content: content.trim(),
      createdAt: new Date()
    };

    if (isProject) {
      // Handle project comments
      const db = mongoose.connection.db;
      await db.collection('projects').updateOne(
        { _id: new mongoose.Types.ObjectId(postId) },
        { 
          $push: { 
            comments: {
              userId: userId,
              content: content.trim(),
              createdAt: new Date()
            }
          }
        }
      );
    } else {
      // Handle post comments
      await Post.findByIdAndUpdate(
        postId,
        { $push: { comments: newComment } }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        userId: userId,
        content: content.trim(),
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add comment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
