import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * GET /api/projects/student-projects
 * Get all projects for the current student (bypasses 3-step gate for own projects)
 */
export async function GET(request: Request) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('🔍 [STUDENT PROJECTS] Fetching projects for user:', user.email, 'ID:', user._id.toString());

    // Use direct collection access to bypass ALL filters
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    const projectsCollection = db.collection('projects');
    
    // Get ALL projects for this user (both as author and from registration)
    const userProjects = await projectsCollection.find({
      $or: [
        { author: user._id.toString() }, // Projects where user is author
        { 'mentorId': user._id.toString() }, // Projects assigned to user as mentor
        { 'studentId': user._id.toString() } // Projects where user is registered student
      ]
    }).sort({ createdAt: -1 }).toArray();

    console.log('🔍 [STUDENT PROJECTS] Found projects:', userProjects.length);

    // Serialize projects with author data
    const serializedProjects = await Promise.all(userProjects.map(async (project: any) => {
      // Get author data
      let authorData = {
        id: user._id.toString(),
        name: user.fullName || user.name || 'Unknown Author',
        email: user.email,
        username: user.username || 'unknown',
        image: user.photo && user.photo !== '/placeholder-user.jpg' ? user.photo : null,
        avatar: user.photo && user.photo !== '/placeholder-user.jpg' ? user.photo : null
      };

      return {
        _id: project._id.toString(),
        title: project.title,
        description: project.description,
        tags: project.tags || [],
        images: project.images || [],
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl,
        author: authorData,
        likes: project.likes || [],
        likeCount: project.likes?.length || 0,
        comments: project.comments || [],
        commentsCount: project.comments?.length || 0,
        shares: project.shares || [],
        shareCount: project.shareCount || 0,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        // Add ownership info for frontend
        isOwner: true,
        canDelete: true,
        canEdit: true
      };
    }));

    return NextResponse.json({
      projects: serializedProjects,
      count: serializedProjects.length
    });

  } catch (error: any) {
    console.error('❌ [STUDENT PROJECTS] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch student projects',
      details: error.stack
    }, { status: 500 });
  }
}
