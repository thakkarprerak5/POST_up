import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectToDatabase();
    
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    
    // Get all users with their projects
    const users = await db.collection('users').find({}).toArray();
    
    const allProjects = [];
    
    // For each user, fetch their projects
    for (const user of users) {
      const userProjects = await db.collection('projects').find({ 
        $or: [
          { authorId: user._id.toString() },
          { 'group.lead.id': user._id.toString() },
          { 'members.id': user._id.toString() }
        ]
      }).toArray();
      
      // Transform projects to include user info
      const transformedProjects = userProjects.map(project => ({
        ...project,
        _id: project._id.toString(),
        id: project._id.toString(),
        author: {
          id: user._id.toString(),
          name: user.fullName || 'Unknown User',
          photo: user.photo || user.avatar || '/placeholder-user.jpg',
          role: user.type || 'student'
        },
        likeCount: project.likeCount || project.likes?.length || 0,
        commentCount: project.comments?.length || 0,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        type: 'project',
        image: project.images?.[0] || null,
        title: project.title,
        likes: project.likes || [],
        content: project.description
      }));
      
      allProjects.push(...transformedProjects);
    }
    
    // Sort all projects by creation date (newest first)
    const sortedProjects = allProjects.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return NextResponse.json({
      success: true,
      projects: sortedProjects,
      total: sortedProjects.length,
      usersProcessed: users.length
    });
    
  } catch (error) {
    console.error('Error fetching all user projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
