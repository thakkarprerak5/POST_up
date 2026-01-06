import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function POST() {
  try {
    await connectDB();
    
    // Get all projects
    const projects = await Project.find({});
    let updatedCount = 0;

    for (const project of projects) {
      // Check if the project needs to be updated
      if (!project.author.avatar || !project.author.username) {
        // If author.image exists but avatar doesn't, copy the value
        if (!project.author.avatar && project.author.image) {
          project.author.avatar = project.author.image;
        }
        
        // If username is missing, generate one from email or use a default
        if (!project.author.username) {
          // Try to get username from session or use a default
          const session = await getServerSession(authOptions);
          project.author.username = session?.user?.email?.split('@')[0] || 'user';
        }
        
        // Remove the old image field if it exists
        if (project.author.image) {
          delete project.author.image;
        }
        
        await project.save();
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: `Successfully updated ${updatedCount} projects`,
      totalProjects: projects.length,
      updated: updatedCount,
      unchanged: projects.length - updatedCount
    });
    
  } catch (error) {
    console.error('Error updating projects:', error);
    return NextResponse.json(
      { error: 'Failed to update projects' },
      { status: 500 }
    );
  }
}
