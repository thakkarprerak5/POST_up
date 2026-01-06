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

// GET /api/admin/users - Get all users with search and filters
export async function GET(request: NextRequest) {
  try {
    const adminInfo = getAdminInfo(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (status === 'active') {
      query.isActive = true;
      query.isBlocked = false;
    } else if (status === 'blocked') {
      query.isBlocked = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user (role change, block/unblock)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminInfo = getAdminInfo(request);
    await connectDB();

    const { action, role, reason } = await request.json();
    const userId = params.id;

    // Get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions for role changes (only super admin)
    if (action === 'change_role' && !isSuperAdmin(adminInfo.userRole)) {
      return NextResponse.json(
        { error: 'Only super admin can change user roles' },
        { status: 403 }
      );
    }

    // Prevent blocking other admins unless you're super admin
    if (action === 'block' && 
        (targetUser.type === 'admin' || targetUser.type === 'super_admin') && 
        !isSuperAdmin(adminInfo.userRole)) {
      return NextResponse.json(
        { error: 'Cannot block admin users' },
        { status: 403 }
      );
    }

    let updateData: any = {};
    let actionType: string;
    let description: string;

    switch (action) {
      case 'change_role':
        if (!['student', 'mentor', 'admin', 'super_admin'].includes(role)) {
          return NextResponse.json(
            { error: 'Invalid role' },
            { status: 400 }
          );
        }
        updateData.type = role;
        actionType = 'role_change';
        description = `Changed user role from ${targetUser.type} to ${role}`;
        break;

      case 'block':
        updateData.isBlocked = true;
        actionType = 'block';
        description = `Blocked user${reason ? ': ' + reason : ''}`;
        break;

      case 'unblock':
        updateData.isBlocked = false;
        actionType = 'unblock';
        description = `Unblocked user`;
        break;

      case 'deactivate':
        updateData.isActive = false;
        actionType = 'update';
        description = `Deactivated user${reason ? ': ' + reason : ''}`;
        break;

      case 'activate':
        updateData.isActive = true;
        actionType = 'update';
        description = `Activated user`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    // Log activity
    await createActivityLog({
      adminId: adminInfo.userId,
      adminName: adminInfo.userEmail,
      adminEmail: adminInfo.userEmail,
      action: action,
      actionType: actionType as any,
      targetType: 'user',
      targetId: userId,
      targetName: targetUser.fullName,
      description,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('User update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
