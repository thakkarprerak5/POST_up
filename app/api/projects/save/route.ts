import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SavedPost } from '@/models/SavedPost';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    // Check if project is already saved
    const existingSave = await SavedPost.findOne({
      userId: currentUser._id,
      projectId: projectId
    });

    let isSaved;
    let message;

    if (existingSave) {
      // Unsave the project
      await SavedPost.deleteOne({
        userId: currentUser._id,
        projectId: projectId
      });
      isSaved = false;
      message = 'Post removed from your saved items';
    } else {
      // Save the project
      await SavedPost.create({
        userId: currentUser._id,
        projectId: projectId
      });
      isSaved = true;
      message = 'Post saved to your profile';
    }

    return NextResponse.json({
      success: true,
      isSaved,
      message
    });

  } catch (error) {
    console.error('Save post error:', error);
    
    // Handle duplicate key error (already saved)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({
        success: true,
        isSaved: true,
        message: 'Post already saved to your profile'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to save post'
    }, { status: 500 });
  }
}

// GET endpoint to check if a project is saved by current user
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Get project ID from query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required'
      }, { status: 400 });
    }

    // Check if project is saved
    const savedPost = await SavedPost.findOne({
      userId: currentUser._id,
      projectId: projectId
    });

    return NextResponse.json({
      success: true,
      isSaved: !!savedPost
    });

  } catch (error) {
    console.error('Check save status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check save status'
    }, { status: 500 });
  }
}
