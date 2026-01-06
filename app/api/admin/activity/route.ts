import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getActivityLogs, getActivityLogsCount } from '@/models/AdminActivityLog';

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

// GET /api/admin/activity - Get activity logs (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const adminInfo = getAdminInfo(request);
    
    if (!isSuperAdmin(adminInfo.userRole)) {
      return NextResponse.json(
        { error: 'Only super admin can view activity logs' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId') || '';
    const actionType = searchParams.get('actionType') || '';
    const targetType = searchParams.get('targetType') || '';
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filters: any = {
      adminId: adminId || undefined,
      actionType: actionType || undefined,
      targetType: targetType || undefined,
      startDate,
      endDate,
      page,
      limit
    };

    const [logs, totalCount] = await Promise.all([
      getActivityLogs(filters),
      getActivityLogsCount({
        adminId: adminId || undefined,
        actionType: actionType || undefined,
        targetType: targetType || undefined,
        startDate,
        endDate
      })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Activity logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}
