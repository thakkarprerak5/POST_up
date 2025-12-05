import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { findUserByEmail } from '@/models/User';
import User from '@/models/User';

export async function GET() {
  await connectDB();
  const mentors = await (User as any).find({ type: 'mentor' }).select('-password').exec();
  return NextResponse.json(mentors);
}
