import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { filterProjectsByVisibility, getVisibilityStats } from '@/lib/project-visibility-filter';

export async function GET(request: Request) {
  try {
    // Ensure database connection first
    await connectDB();
    
    // Wait for connection to be fully established
    let retries = 0;
    while (require('mongoose').connection.readyState !== 1 && retries < 5) {
      console.log('🔍 Home Projects API: Waiting for connection... state:', require('mongoose').connection.readyState);
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Get user session for likedByUser calculation
    const session = await getServerSession(authOptions);
    let currentUser = null;
    if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email }).exec();
    }
    
    // Use direct MongoDB connection like feed API
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017/post-up');
    
    await client.connect();
    const db = client.db();
    const projectsCollection = db.collection('projects');
    
    // Query for public projects only
    const query = {
      isDeleted: { $ne: true }, // Exclude soft-deleted projects
      // visibility: 'public' // Only show public projects - commented out for backward compatibility
    };
    
    // Fetch projects using direct MongoDB
    const projects = await projectsCollection.find(query).limit(limit).sort({ createdAt: -1 }).toArray();
    
    await client.close();
    
    console.log('🔍 Home Projects API - Raw projects found:', projects.length);
    console.log('🔍 Sample project:', projects[0] ? {
      id: projects[0]._id,
      title: projects[0].title,
      hasVisibility: projects[0].visibility !== undefined,
      visibility: projects[0].visibility,
      isDeleted: projects[0].isDeleted
    } : 'No projects');
    
    // Simplified author population - don't filter out projects
    const projectsWithAuthors = await Promise.all(
      projects.map(async (project) => {
        let authorInfo = {
          id: project.authorId || '',
          name: 'Unknown Author',
          username: 'user',
          profileImage: null,
          image: null,
          avatar: null,
          email: '',
          type: 'student'
        };
        
        // Try to fetch author data if authorId exists
        if (project.authorId) {
          try {
            const author = await User.findById(project.authorId).exec();
            if (author) {
              authorInfo = {
                id: author._id.toString(),
                name: author.fullName || 'Unknown Author',
                username: author.email ? author.email.split('@')[0] : 'user',
                profileImage: author.photo && author.photo !== '/placeholder-user.jpg' ? author.photo : null,
                image: author.photo && author.photo !== '/placeholder-user.jpg' ? author.photo : null,
                avatar: author.photo && author.photo !== '/placeholder-user.jpg' ? author.photo : null,
                email: author.email,
                type: author.type || 'student'
              };
            }
          } catch (error) {
            console.log(`Error fetching author for project ${project._id}:`, error);
          }
        }
        
        // Calculate likedByUser if user is logged in
        let likedByUser = false;
        if (currentUser && project.likes && Array.isArray(project.likes)) {
          const userIdStr = currentUser._id.toString();
          likedByUser = project.likes.some(likeId => likeId.toString() === userIdStr);
        }
        
        return {
          _id: project._id.toString(),
          id: project._id.toString(),
          title: project.title,
          description: project.description,
          techStack: project.tags || [],
          tags: project.tags || [],
          createdById: project.authorId,
          createdBy: authorInfo,
          author: authorInfo, // Ensure author field is populated for compatibility
          createdAt: project.createdAt,
          status: project.projectStatus || 'active',
          visibility: project.visibility || 'public',
          images: project.images || [],
          githubUrl: project.githubUrl || '#',
          liveUrl: project.liveUrl || '#',
          likeCount: project.likeCount || 0,
          likedByUser, // Add this crucial field!
          commentsCount: project.comments?.length || 0,
          shareCount: project.shareCount || 0,
          // Add mentor information if assigned
          mentor: project.mentorStatus && project.mentorStatus !== 'not_assigned' ? {
            status: project.mentorStatus,
            invitation: project.mentorInvitation
          } : null,
          // Mark as project type for home page
          type: 'project'
        };
      })
    );
    
    // Apply 3-Step Gate filtering for project registration projects
    console.log('🚪 Home API - Applying 3-Step Gate filtering...');
    const visibilityFilteredProjects = filterProjectsByVisibility(projectsWithAuthors);
    console.log('🚪 Home API - 3-Step Gate filtered projects:', visibilityFilteredProjects.length);
    
    // Log visibility statistics for debugging
    const visibilityStats = getVisibilityStats(projectsWithAuthors);
    console.log('🚪 Home API - Visibility Stats:', visibilityStats);
    
    const validProjects = visibilityFilteredProjects;
    
    console.log(`📊 Home API - Project filtering: ${projects.length} total → ${validProjects.length} valid (filtered ${projects.length - validProjects.length} invalid projects)`);
    
    return NextResponse.json({
      success: true,
      projects: validProjects,
      total: validProjects.length
    });
    
  } catch (error) {
    console.error('Error fetching home projects:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch projects',
        projects: [],
        total: 0
      },
      { status: 500 }
    );
  }
}
