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

// GET /api/admin/settings - Get system settings (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const adminInfo = getAdminInfo(request);
    
    if (!isSuperAdmin(adminInfo.userRole)) {
      return NextResponse.json(
        { error: 'Only super admin can view system settings' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get system stats
    const [totalUsers, adminUsers, activeUsers, blockedUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ type: { $in: ['admin', 'super_admin'] } }),
      User.countDocuments({ isActive: true, isBlocked: false }),
      User.countDocuments({ isBlocked: true })
    ]);

    // Mock system settings (in production, these would be stored in a settings collection)
    const settings = {
      maintenance: false,
      registrationOpen: true,
      projectApprovalRequired: false,
      maxProjectsPerUser: 10,
      allowProjectDeletion: true,
      enableReporting: true,
      enableComments: true,
      enableLikes: true,
      enableSharing: true
    };

    return NextResponse.json({
      settings,
      stats: {
        totalUsers,
        adminUsers,
        activeUsers,
        blockedUsers
      }
    });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update system settings (Super Admin only)
export async function PUT(request: NextRequest) {
  try {
    const adminInfo = getAdminInfo(request);
    
    if (!isSuperAdmin(adminInfo.userRole)) {
      return NextResponse.json(
        { error: 'Only super admin can update system settings' },
        { status: 403 }
      );
    }

    await connectDB();

    const settings = await request.json();

    // Log activity
    await createActivityLog({
      adminId: adminInfo.userId,
      adminName: adminInfo.userEmail,
      adminEmail: adminInfo.userEmail,
      action: 'update_settings',
      actionType: 'system_setting',
      targetType: 'system',
      targetId: 'system',
      description: `Updated system settings: ${JSON.stringify(settings)}`,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: { settings }
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/create-admin - Create new admin (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const adminInfo = getAdminInfo(request);
    
    if (!isSuperAdmin(adminInfo.userRole)) {
      return NextResponse.json(
        { error: 'Only super admin can create admin users' },
        { status: 403 }
      );
    }

    await connectDB();

    const { email, role = 'admin' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { type: role },
      { new: true }
    ).select('-password');

    // Log activity
    await createActivityLog({
      adminId: adminInfo.userId,
      adminName: adminInfo.userEmail,
      adminEmail: adminInfo.userEmail,
      action: 'create_admin',
      actionType: 'role_change',
      targetType: 'user',
      targetId: user._id.toString(),
      targetName: user.fullName,
      description: `Created new ${role}: ${user.fullName} (${email})`,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: `User promoted to ${role} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Create admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}
