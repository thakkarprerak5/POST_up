import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Get the token from the request
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token?.sub) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    await connectDB();
    
    // Find user and check ban status
    const user = await User.findById(token.sub).select('banStatus banExpiresAt banReason isBlocked isActive');
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check if temporary ban has expired
    let currentBanStatus = user.banStatus;
    let isActiveBan = false;

    if (user.banStatus === 'SOFT_BAN' && user.banExpiresAt) {
      const now = new Date();
      const expiryDate = new Date(user.banExpiresAt);
      
      if (now > expiryDate) {
        // Ban has expired, reactivate user
        await User.findByIdAndUpdate(token.sub, {
          banStatus: 'NONE',
          banExpiresAt: null,
          banReason: null,
          isBlocked: false,
          isActive: true
        });
        
        currentBanStatus = 'NONE';
      } else {
        isActiveBan = true;
      }
    } else if (user.banStatus === 'PROPER_BAN') {
      isActiveBan = true;
    }

    return NextResponse.json({
      banStatus: currentBanStatus,
      banExpiresAt: user.banExpiresAt,
      banReason: user.banReason,
      isBlocked: user.isBlocked,
      isActive: user.isActive,
      isActiveBan
    });

  } catch (error) {
    console.error('Ban check error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
