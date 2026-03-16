import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Post } from '@/models/Post';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id: postId } = await params;
    const { userId, action } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (action === 'like') {
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

      let isLiked: boolean;
      let newLikeCount: number;

      if (isProject) {
        // Handle project likes
        const likes = item.likes || [];
        isLiked = likes.includes(userId);
        
        if (isLiked) {
          // Unlike
          item.likes = likes.filter((id: string) => id !== userId);
        } else {
          // Like
          item.likes = [...likes, userId];
        }
        
        // Update likeCount
        item.likeCount = item.likes.length;
        newLikeCount = item.likes.length;

        // Save to database
        const mongoose = await import('mongoose');
        const db = mongoose.connection.db;
        await db.collection('projects').updateOne(
          { _id: new mongoose.Types.ObjectId(postId) },
          { 
            $set: { 
              likes: item.likes,
              likeCount: item.likeCount
            }
          }
        );
      } else {
        // Handle post likes
        const post = item as any;
        isLiked = post.likes.includes(userId as any);
        
        if (isLiked) {
          // Unlike
          post.likes = post.likes.filter((id: any) => id.toString() !== userId);
        } else {
          // Like
          post.likes.push(userId as any);
        }
        
        await post.save();
        newLikeCount = post.likes.length;
      }
      
      return NextResponse.json({
        success: true,
        liked: !isLiked,
        likeCount: newLikeCount
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in like endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500 }
    );
  }
}
