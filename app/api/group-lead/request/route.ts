import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

// POST /api/group-lead/request - Request group lead status
export async function POST(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, reason } = body;
    
    if (!userId || !reason) {
      return NextResponse.json({
        success: false,
        message: 'User ID and reason are required'
      }, { status: 400 });
    }
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Check if user is already a group lead
    if (user.profile?.isGroupLead) {
      return NextResponse.json({
        success: false,
        message: 'User is already a group lead'
      }, { status: 400 });
    }
    
    // Create group lead request (you could create a separate collection for this)
    // For now, we'll add to a requests array in user profile
    if (!user.profile.groupLeadRequests) {
      user.profile.groupLeadRequests = [];
    }
    
    // Add the request with timestamp
    user.profile.groupLeadRequests.push({
      id: new Date().getTime().toString(),
      reason: reason,
      status: 'pending',
      requestedAt: new Date(),
      userId: user._id.toString()
    });
    
    await user.save();
    
    console.log('📋 Group lead request submitted:', {
      user: user.fullName,
      reason: reason,
      status: 'pending'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Group lead request submitted successfully',
      request: {
        id: user.profile.groupLeadRequests[user.profile.groupLeadRequests.length - 1].id,
        reason: reason,
        status: 'pending',
        requestedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('❌ Error submitting group lead request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/group-lead/requests - Get all group lead requests (admin only)
export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Get all users with pending group lead requests
    const users = await User.find({
      'profile.groupLeadRequests.status': 'pending'
    }).select('fullName email profile.groupLeadRequests profile.course profile.branch');
    
    const requests = [];
    users.forEach(user => {
      user.profile.groupLeadRequests.forEach((req: any) => {
        if (req.status === 'pending') {
          requests.push({
            id: req.id,
            userId: user._id,
            userName: user.fullName,
            userEmail: user.email,
            reason: req.reason,
            requestedAt: req.requestedAt,
            status: req.status,
            course: user.profile.course,
            branch: user.profile.branch
          });
        }
      });
    });
    
    return NextResponse.json({
      success: true,
      requests: requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
    });
    
  } catch (error) {
    console.error('❌ Error fetching group lead requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
