import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get current user info
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Find and update all projects by this user
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
    console.error('Error updating project authors:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
