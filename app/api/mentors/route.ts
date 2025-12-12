import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    const mentors = await User.find({ 'profile.type': 'mentor' })
      .select('name email avatar profile followerCount followingCount')
      .lean()
      .exec();
    return NextResponse.json(mentors);
  } catch (error: any) {
    console.error('GET /api/mentors error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
