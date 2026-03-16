import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST() {
  try {
    await connectDB();
    
    // Update thakkarprerak5@gmail.com to ensure it's student
    const result = await User.updateOne(
      { email: 'thakkarprerak5@gmail.com' },
      { 
        type: 'student',
        lastUpdated: new Date()
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User type fixed in database',
      email: 'thakkarprerak5@gmail.com',
      type: 'student',
      action: 'Please sign out and sign back in to refresh your session',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Fix user session API error:', error);
    return NextResponse.json({ error: 'Failed to fix user session' }, { status: 500 });
  }
}
