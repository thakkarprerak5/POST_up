import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { createActivityLog } from '@/models/AdminActivityLog';

// Helper function to get admin info from request headers
const getAdminInfo = (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  const userEmail = request.headers.get('x-user-email');
  
  if (!userId || !userRole || !userEmail) {
    throw new Error('Admin authentication required');
  }
  
  return { userId, userRole, userEmail };
};

// Helper function to check if user is super admin
const isSuperAdmin = (userRole: string) => userRole === 'super_admin';

// GET /api/admin/users/[id] - Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminInfo = getAdminInfo(request);
    await connectDB();

    const user = await User.findById(params.id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
