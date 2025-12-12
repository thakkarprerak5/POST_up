import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  await connectDB();
  // Return users that have a profile (signed-up users with profile data)
  const users = await (User as any)
    .find({ profile: { $ne: null } })
    .select('-password')
    .exec();
  return NextResponse.json(users);
}
