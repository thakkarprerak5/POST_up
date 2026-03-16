import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

// GET /api/mentors/by-email?email=mentor@example.com
export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Find mentor by email
    const mentor = await User.findOne({ 
      email: email.toLowerCase().trim(),
      type: 'mentor'
    })
    .select('_id fullName email photo profile type')
    .lean()
    .exec();

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    // Return full mentor object with proper ID
    const mentorData = {
      _id: mentor._id,
      id: mentor._id.toString(), // Add id field for compatibility
      fullName: mentor.fullName,
      email: mentor.email,
      photo: mentor.photo || mentor.profile?.photo || '/placeholder.svg',
      type: mentor.type,
      profile: mentor.profile || {}
    };

    console.log('🔍 Mentor found by email:', {
      email,
      mentorId: mentorData._id,
      fullName: mentorData.fullName
    });

    return NextResponse.json(mentorData);
  } catch (error: any) {
    console.error('GET /api/mentors/by-email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
