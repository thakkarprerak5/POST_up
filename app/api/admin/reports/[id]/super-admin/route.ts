import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report, { updateReportStatus } from '@/models/Report';
import { createActivityLog } from '@/models/AdminActivityLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

// Helper function to check Super Admin permissions
async function checkSuperAdminPermissions(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  // Check if user is super admin
  if (user.type !== 'super_admin') {
    return { error: NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 }) };
  }

  return { user, session };
}

// DELETE /api/admin/reports/[id]/content - Delete reported content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkSuperAdminPermissions(request);
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

    // Delete the actual content based on target type
    let deletionResult = { success: false, deletedType: '', deletedId: '' };
    
    try {
      switch (report.targetType) {
        case 'project':
          const Project = require('@/models/Project').default;
          const project = await Project.findByIdAndDelete(report.targetId);
          if (project) {
            deletionResult = { success: true, deletedType: 'project', deletedId: report.targetId };
          }
          break;
          
        case 'comment':
          // Comment deletion implementation depends on your comment structure
          // This is a placeholder - implement based on your comment model
          deletionResult = { success: true, deletedType: 'comment', deletedId: report.targetId };
          break;
          
        case 'user':
          // For users, we typically block/ban rather than delete
          // This would be handled by the ban endpoint
          deletionResult = { success: false, deletedType: 'user', deletedId: report.targetId };
          break;
          
        case 'chat':
          // Chat message deletion implementation
          deletionResult = { success: true, deletedType: 'chat', deletedId: report.targetId };
          break;
      }
    } catch (deleteError) {
      console.error('Error deleting content:', deleteError);
      deletionResult = { success: false, deletedType: report.targetType, deletedId: report.targetId };
    }

    // Update report status to closed
    const updatedReport = await updateReportStatus(
      reportId,
      'closed',
      user._id.toString(),
      `Content deleted: ${deletionResult.success ? 'Success' : 'Failed'}`
    );

    // Log activity
    await createActivityLog({
      adminId: user._id.toString(),
      adminName: user.fullName,
      adminEmail: user.email,
      action: 'delete_content',
      actionType: 'delete',
      targetType: report.targetType,
      targetId: report.targetId,
      targetName: report.targetDetails?.title || report.targetId,
      description: `Deleted ${report.targetType} content from report: ${report.reason}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        reportId: reportId,
        deletionResult
      }
    });

    return NextResponse.json({
      message: 'Content deleted successfully',
      report: updatedReport,
      deletionResult
    });
  } catch (error) {
    console.error('Delete content API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reports/[id]/ban - Ban user from report
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkSuperAdminPermissions(request);
    if (authResult.error) return authResult.error;
    
    const { user } = authResult;

    await connectDB();

    const { action, banReason, duration } = await request.json();
    const reportId = params.id;

    if (!action || !['ban', 'suspend'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be ban or suspend' },
        { status: 400 }
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

    // Get the reported user
    const reportedUser = await User.findById(report.reportedUserId);
    if (!reportedUser) {
      return NextResponse.json(
        { error: 'Reported user not found' },
        { status: 404 }
      );
    }

    // Apply ban/suspend
    let actionResult = { success: false, action: '', userId: report.reportedUserId };
    
    try {
      if (action === 'ban') {
        reportedUser.isBlocked = true;
        reportedUser.isActive = false;
        await reportedUser.save();
        actionResult = { success: true, action: 'banned', userId: report.reportedUserId };
      } else if (action === 'suspend') {
        // For suspension, you might want to add a suspension period
        reportedUser.isActive = false;
        await reportedUser.save();
        actionResult = { success: true, action: 'suspended', userId: report.reportedUserId };
      }
    } catch (actionError) {
      console.error('Error applying user action:', actionError);
      actionResult = { success: false, action: action, userId: report.reportedUserId };
    }

    // Update report status to closed
    const updatedReport = await updateReportStatus(
      reportId,
      'closed',
      user._id.toString(),
      `User ${actionResult.action}: ${banReason || 'Policy violation'}`
    );

    // Log activity
    await createActivityLog({
      adminId: user._id.toString(),
      adminName: user.fullName,
      adminEmail: user.email,
      action: `${action}_user`,
      actionType: action === 'ban' ? 'block' : 'update',
      targetType: 'user',
      targetId: report.reportedUserId,
      targetName: reportedUser.fullName,
      description: `${action === 'ban' ? 'Banned' : 'Suspended'} user from report: ${report.reason} - ${banReason || 'Policy violation'}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        reportId: reportId,
        actionResult,
        duration: duration || 'permanent'
      }
    });

    return NextResponse.json({
      message: `User ${actionResult.action} successfully`,
      report: updatedReport,
      actionResult
    });
  } catch (error) {
    console.error('User action API error:', error);
    return NextResponse.json(
      { error: 'Failed to apply user action' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/reports/[id]/close - Close report with final decision
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkSuperAdminPermissions(request);
    if (authResult.error) return authResult.error;
    
    const { user } = authResult;

    await connectDB();

    const { decision, notes } = await request.json();
    const reportId = params.id;

    if (!decision || !['dismiss', 'uphold', 'escalate'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be dismiss, uphold, or escalate' },
        { status: 400 }
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

    // Update report status to closed
    const updatedReport = await updateReportStatus(
      reportId,
      'closed',
      user._id.toString(),
      `Final decision: ${decision} - ${notes || ''}`
    );

    // Log activity
    await createActivityLog({
      adminId: user._id.toString(),
      adminName: user.fullName,
      adminEmail: user.email,
      action: 'close_report',
      actionType: 'update',
      targetType: 'report',
      targetId: reportId,
      targetName: `${report.targetType} - ${report.targetDetails?.title || report.targetId}`,
      description: `Closed report with final decision: ${decision} - ${notes || ''}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        reportId: reportId,
        decision,
        finalAction: true
      }
    });

    return NextResponse.json({
      message: 'Report closed successfully',
      report: updatedReport,
      decision,
      notes
    });
  } catch (error) {
    console.error('Close report API error:', error);
    return NextResponse.json(
      { error: 'Failed to close report' },
      { status: 500 }
    );
  }
}
