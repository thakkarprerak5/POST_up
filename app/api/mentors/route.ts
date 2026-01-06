import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    const mentors = await User.find({ type: 'mentor' })
      .select('fullName email photo profile followerCount followingCount')
      .lean()
      .exec();
    
    // Map to match expected structure with all necessary fields
    const mappedMentors = mentors.map((mentor: any) => ({
      id: mentor._id,
      name: mentor.fullName || mentor.email,
      email: mentor.email,
      avatar: mentor.photo || mentor.profile?.photo || '/placeholder.svg',
      title: 'Mentor',
      position: mentor.profile?.position || 'Mentor',
      field: mentor.profile?.expertise?.[0] || 'General',
      expertise: mentor.profile?.expertise || [],
      bio: mentor.profile?.bio || '',
      skills: mentor.profile?.skills || [],
      linkedin: mentor.profile?.socialLinks?.linkedin || '#',
      github: mentor.profile?.socialLinks?.github || '#',
      linkedinUrl: mentor.profile?.socialLinks?.linkedin || '#',
      githubUrl: mentor.profile?.socialLinks?.github || '#'
    }));
    
    return NextResponse.json(mappedMentors);
  } catch (error: any) {
    console.error('GET /api/mentors error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
