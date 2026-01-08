import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST() {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get the current user's latest profile information
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update all projects where the author matches the current user's ID
    const result = await Project.updateMany(
      { 'author.id': session.user.id },
      { 
        $set: { 
          'author.name': user.fullName,
          'author.image': user.photo || null,
          'author.username': user.email?.split('@')[0] || `@${user.fullName.toLowerCase().replace(/\s+/g, '')}`
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} projects with your current profile information`,
      updatedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error updating project author names:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
