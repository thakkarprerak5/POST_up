import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

// GET /api/users/lookup?email=... - Lookup user by email
export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('_id fullName email photo type').exec();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found',
        user: null 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        photo: user.photo,
        type: user.type
      }
    });
    
  } catch (error) {
    console.error('Error looking up user:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to lookup user' 
    }, { status: 500 });
  }
}
