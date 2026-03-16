import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();

    // IMPORTANT: Only return users with role = "mentor"
    // This fixes the issue where non-mentor users were being returned
    const mentors = await User.find({
      type: { $in: ['mentor', 'admin', 'super-admin'] }
    })
      .select('fullName email photo profile expertise bio')
      .lean()
      .exec();

    // Map to clean response format for frontend
    const mappedMentors = mentors.map((mentor: any) => ({
      _id: mentor._id,
      fullName: mentor.fullName || mentor.email,
      email: mentor.email,
      photo: mentor.photo || mentor.profile?.photo || '/placeholder.svg',
      expertise: mentor.profile?.expertise || mentor.expertise || [],
      bio: mentor.profile?.bio || mentor.bio || '',
      type: 'mentor' // Explicitly set type
    }));

    return NextResponse.json(mappedMentors);
  } catch (error: any) {
    console.error('GET /api/mentors error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
