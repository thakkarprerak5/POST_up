import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Find user by ID
    const user = await User.findById(id).select('-password').exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user profile data
    const profileData = {
      id: user._id.toString(),
      fullName: user.fullName || user.name || '',
      name: user.name || '',
      email: user.email,
      photo: user.photo || user.image || '',
      image: user.image || user.photo || '',
      course: user.course || '',
      branch: user.branch || '',
      bio: user.bio || '',
      skills: user.skills || [],
      projects: user.projects || [],
      socialLinks: user.socialLinks || {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json(profileData);

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
