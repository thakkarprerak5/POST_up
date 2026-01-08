import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

// GET: Get all comments across all projects (for admin)
export async function GET(request: Request) {
  console.log('=== ADMIN GET ALL COMMENTS ===');

  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    console.log('User email:', session?.user?.email);

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
    console.log('Found user:', user);
    if (!user) {
      console.log('User not found in database');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or super_admin
    if (!user || !['admin', 'super_admin'].includes(user.type)) {
      console.log('User not authorized. Role:', user.type);
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all projects and their comments
    const projects = await Project.find({});
    const allComments = [];

    for (const project of projects) {
      if (project.comments && project.comments.length > 0) {
        for (const comment of project.comments) {
          allComments.push({
            ...comment,
            projectId: project._id,
            projectTitle: project.title,
            projectAuthor: project.author?.name || 'Unknown'
          });
        }
      }
    }

    // Sort by newest first
    allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({
      success: true,
      comments: allComments,
      total: allComments.length
    });

  } catch (error: any) {
    console.error('Error fetching all comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
