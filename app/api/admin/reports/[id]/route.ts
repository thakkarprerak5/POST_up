import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report, { updateReportStatus } from '@/models/Report';
import { createActivityLog } from '@/models/AdminActivityLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

// Helper function to check admin permissions
async function checkAdminPermissions(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  // Check if user is admin or super admin
  if (user.type !== 'admin' && user.type !== 'super_admin') {
    return { error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }) };
  }

  return { user, session };
}

// PUT /api/admin/reports/[id] - Resolve or reject a report
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminPermissions(request);
    if (authResult.error) return authResult.error;
    
    const { user } = authResult;

    await connectDB();

    const { status, resolutionNotes } = await request.json();
    const reportId = params.id;

    if (!['closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Only Super Admins can close reports' },
        { status: 400 }
      );
    }

    // Check if user is super admin for closing reports
    if (user.type !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only Super Admins can close reports' },
        { status: 403 }
      );
    }

    // Get report details
    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Update report status
    const updatedReport = await updateReportStatus(
      reportId,
      status,
      user._id.toString(),
      resolutionNotes
    );

    // Log activity
    await createActivityLog({
      adminId: user._id.toString(),
      adminName: user.fullName,
      adminEmail: user.email,
      action: `${status}_report`,
      actionType: 'update',
      targetType: 'report',
      targetId: reportId,
      targetName: `${report.targetType} - ${report.targetDetails?.title || report.targetId}`,
      description: `${status === 'resolved' ? 'Resolved' : 'Rejected'} report: ${report.reason}${resolutionNotes ? ' - ' + resolutionNotes : ''}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: `Report ${status} successfully`,
      report: updatedReport
    });
  } catch (error) {
    console.error('Update report API error:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reports/[id] - Assign report to admin
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminPermissions(request);
    if (authResult.error) return authResult.error;
    
    const { user } = authResult;

    await connectDB();

    const reportId = params.id;

    // Get report details
    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Update report status to reviewed and assign to admin
    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      {
        status: 'reviewed',
        handledBy: user._id.toString()
      },
      { new: true }
    );

    // Log activity
    await createActivityLog({
      adminId: user._id.toString(),
      adminName: user.fullName,
      adminEmail: user.email,
      action: 'assign_report',
      actionType: 'update',
      targetType: 'report',
      targetId: reportId,
      targetName: `${report.targetType} - ${report.targetDetails?.title || report.targetId}`,
      description: `Assigned report to review: ${report.reason}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Report assigned successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Assign report API error:', error);
    return NextResponse.json(
      { error: 'Failed to assign report' },
      { status: 500 }
    );
  }
}
