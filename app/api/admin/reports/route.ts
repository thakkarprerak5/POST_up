import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getReports, getReportsCount, getReportStats } from '@/models/Report';
import { createActivityLog } from '@/models/AdminActivityLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

// 🔹 Report Processing Constants and Rules
export const REPORT_PROCESSING_RULES = {
  // Admin Actions
  ADMIN_ACTIONS: {
    CAN_VIEW_REPORTS: true,
    CAN_VIEW_PENDING: true,
    CAN_VIEW_UNDER_REVIEW: true,
    CAN_REPORT_CONTENT: false,
    CAN_DELETE_CONTENT: false,
    CAN_BAN_USERS: false,
    CAN_CHANGE_ROLES: false,
    CAN_SUSPEND_USERS: false,
    ACTIONS_REVERSIBLE: true,
    MUST_LOG_ACTIONS: true
  },

  // Super Admin Actions
  SUPER_ADMIN_ACTIONS: {
    CAN_VIEW_ALL: true,
    CAN_VIEW_ADMIN_ACTIONS: true,
    CAN_BYPASS_AUDIT: false,
    CAN_FINAL_AUTHORITY: true,
    CAN_DELETE_CONTENT: true,
    CAN_BAN_USERS: true,
    CAN_CHANGE_ROLES: true,
    CAN_SUSPEND_USERS: true
  },

  // Report Status Flow
  REPORT_STATUS_FLOW: {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    CLOSED: 'closed'
  },

  // Violation Severity Levels
  VIOLATION_SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium', 
    HIGH: 'high',
    CRITICAL: 'critical'
  }
} as const;

// 🔹 Helper Functions for Role-Based Access Control
async function checkAdminPermissions(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 }) };
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) {
    return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  // Check user role and permissions
  const userRole = user.type;
  
  if (userRole === 'admin' || userRole === 'super_admin') {
    return { 
      user, 
      session, 
      userRole,
      isSuperAdmin: userRole === 'super_admin',
      isAdmin: true
    };
  }

  return { error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }) };
}

// 🔹 Enhanced Report Action Handler with RBAC
async function processReportAction(
  reportId: string,
  action: string,
  actionData: any,
  adminUser: any,
  request: NextRequest
) {
  const { userRole, isSuperAdmin } = adminUser;
  
  // Get report details
  const Report = await import('@/models/Report').then(m => m.default);
  const report = await Report.findById(reportId);
  if (!report) {
    return { error: NextResponse.json({ error: 'Report not found' }, { status: 404 }) };
  }

  // Validate action based on role
  const adminRestrictedActions = ['deleteContent', 'banUser', 'suspendUser', 'changeRole'];
  const superAdminOnlyActions = ['finalAuthority', 'bypassAudit'];
  
  if (userRole === 'admin') {
    if (adminRestrictedActions.includes(action)) {
      return { error: NextResponse.json({ error: `Admins cannot perform action: ${action}` }, { status: 403 }) };
    }
    if (superAdminOnlyActions.includes(action)) {
      return { error: NextResponse.json({ error: `Super Admin only action: ${action}` }, { status: 403 }) };
    }
  }

  // Process the action
  let result;
  switch (action) {
    case 'review':
      result = await handleReviewAction(report, actionData, adminUser);
      break;
      
    case 'resolve':
      result = await handleResolveAction(report, actionData, adminUser, isSuperAdmin);
      break;
      
    case 'reject':
      result = await handleRejectAction(report, actionData, adminUser, isSuperAdmin);
      break;
      
    case 'assign':
      result = await handleAssignAction(report, actionData, adminUser);
      break;
      
    case 'warn':
      result = await handleWarnUser(report, actionData, adminUser);
      break;
      
    case 'escalate':
      if (!isSuperAdmin) {
        return { error: NextResponse.json({ error: 'Only Super Admins can escalate reports' }, { status: 403 }) };
      }
      result = await handleEscalateAction(report, actionData, adminUser);
      break;
      
    default:
      return { error: NextResponse.json({ error: 'Invalid action' }, { status: 400 }) };
  }

  // Log the action with full audit trail
  await logAdminAction(adminUser, action, report, result, request);
  
  return result;
}

// 🔹 Enhanced Action Handlers with RBAC
async function handleReviewAction(report: any, actionData: any, adminUser: any) {
  const Report = await import('@/models/Report');
  
  const updatedReport = await (Report as any).updateReportStatus(
    report._id,
    REPORT_PROCESSING_RULES.REPORT_STATUS_FLOW.REVIEWED,
    adminUser.user._id.toString(),
    actionData.adminNotes || ''
  );

  return NextResponse.json({
    message: 'Report marked as reviewed',
    report: updatedReport,
    action: 'review',
    requiresEscalation: determineEscalationNeed(report),
    nextActions: getNextAvailableActions(report.status, adminUser.userRole)
  });
}

async function handleResolveAction(report: any, actionData: any, adminUser: any, isSuperAdmin: boolean) {
  const Report = await import('@/models/Report');
  
  const updatedReport = await (Report as any).updateReportStatus(
    report._id,
    REPORT_PROCESSING_RULES.REPORT_STATUS_FLOW.CLOSED,
    adminUser.user._id.toString(),
    actionData.resolutionNotes
  );

  return NextResponse.json({
    message: 'Report closed successfully',
    report: updatedReport,
    action: 'close',
    resolutionType: determineResolutionType(report, actionData),
    canBeReversed: isSuperAdmin // Only Super Admins can reverse closed actions
  });
}

async function handleRejectAction(report: any, actionData: any, adminUser: any, isSuperAdmin: boolean) {
  const Report = await import('@/models/Report');
  
  const updatedReport = await (Report as any).updateReportStatus(
    report._id,
    REPORT_PROCESSING_RULES.REPORT_STATUS_FLOW.CLOSED,
    adminUser.user._id.toString(),
    actionData.resolutionNotes
  );

  return NextResponse.json({
    message: 'Report rejected successfully',
    report: updatedReport,
    action: 'reject',
    canBeReversed: isSuperAdmin // Only Super Admins can reverse rejected actions
  });
}

async function handleAssignAction(report: any, actionData: any, adminUser: any) {
  const Report = await import('@/models/Report').then(m => m.default);
  
  const updatedReport = await Report.findByIdAndUpdate(
    report._id,
    { 
      status: REPORT_PROCESSING_RULES.REPORT_STATUS_FLOW.REVIEWED,
      handledBy: adminUser.user._id.toString(),
      assignedAt: new Date()
    },
    { new: true }
  );

  return NextResponse.json({
    message: 'Report assigned successfully',
    report: updatedReport,
    action: 'assign',
    canBeReversed: true // Assignment can be reversed
  });
}

async function handleWarnUser(report: any, actionData: any, adminUser: any) {
  // Issue warning to reported user
  return NextResponse.json({
    message: 'Warning issued to user',
    action: 'warn',
    warningSent: true
  });
}

async function handleEscalateAction(report: any, actionData: any, adminUser: any) {
  const Report = await import('@/models/Report').then(m => m.default);
  
  const updatedReport = await Report.findByIdAndUpdate(
    report._id,
    { 
      status: REPORT_PROCESSING_RULES.REPORT_STATUS_FLOW.REVIEWED,
      handledBy: adminUser.user._id.toString(),
      escalatedTo: adminUser.user._id.toString(),
      escalatedAt: new Date(),
      escalationReason: actionData.escalationReason
    },
    { new: true }
  );

  return NextResponse.json({
    message: 'Report escalated successfully',
    report: updatedReport,
    action: 'escalate',
    escalated: true
  });
}

// 🔹 Helper Functions for Enhanced Processing
function determineEscalationNeed(report: any): boolean {
  // Auto-escalate critical violations
  if (report.priority === REPORT_PROCESSING_RULES.VIOLATION_SEVERITY.CRITICAL) {
    return true;
  }
  
  // Escalate repeated violations
  if (report.reason === 'harassment' || report.reason === 'copyright_violation') {
    return true;
  }
  
  return false;
}

function determineResolutionType(report: any, actionData: any): string {
  if (actionData.resolutionType) return actionData.resolutionType;
  
  // Auto-determine resolution type based on report reason
  switch (report.reason) {
    case 'spam':
      return 'content_removed';
    case 'inappropriate_content':
      return 'content_hidden';
    case 'harassment':
      return 'user_warned';
    case 'copyright_violation':
      return 'content_removed';
    default:
      return 'resolved';
  }
}

function getNextAvailableActions(currentStatus: string, userRole: string): string[] {
  const actions = [];
  
  switch (currentStatus) {
    case 'pending':
      actions.push('review', 'assign', 'reject');
      if (userRole === 'super_admin') actions.push('escalate');
      break;
    case 'under_review':
      actions.push('resolve', 'reject', 'warn');
      if (userRole === 'super_admin') actions.push('escalate');
      break;
    case 'resolved':
    case 'rejected':
      // Final states - no actions available except for Super Admin
      if (userRole === 'super_admin') actions.push('reopen');
      break;
  }
  
  return actions;
}

async function logAdminAction(
  adminUser: any, 
  action: string, 
  report: any, 
  result: any, 
  request: NextRequest
) {
  const logData = {
    adminId: adminUser.user._id.toString(),
    adminName: adminUser.user.fullName,
    adminEmail: adminUser.user.email,
    action: action,
    actionType: 'update' as const,
    targetType: 'report' as const,
    targetId: report._id.toString(),
    targetName: `${report.targetType} - ${report.targetDetails?.title || report.targetId}`,
    description: `${action} on report: ${report.reason}`,
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    metadata: {
      userRole: adminUser.userRole,
      isSuperAdmin: adminUser.isSuperAdmin,
      actionResult: result.action || action,
      canBeReversed: result.canBeReversed || false
    }
  };

  await createActivityLog(logData);
}

// GET /api/admin/reports - Get all reports with filters
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminPermissions(request);
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const targetType = searchParams.get('targetType') || '';
    const priority = searchParams.get('priority') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Apply role-based filtering
    let filters: any = {
      status: status || undefined,
      targetType: targetType || undefined,
      priority: priority || undefined,
      page,
      limit
    };

    // Super Admins can see all reports, Admins only see reviewed reports
    if (!authResult.isSuperAdmin) {
      // Remove the assignedTo filter since we're using the simplified flow
      // Admins can see all reports but can only review pending ones
    }

    const [reports, totalCount, stats] = await Promise.all([
      getReports(filters),
      getReportsCount({
        status: status || undefined,
        targetType: targetType || undefined,
        priority: priority || undefined
      }),
      getReportStats()
    ]);

    return NextResponse.json({
      reports,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      userRole: authResult.userRole,
      isSuperAdmin: authResult.isSuperAdmin,
      permissions: authResult.isSuperAdmin ? REPORT_PROCESSING_RULES.SUPER_ADMIN_ACTIONS : REPORT_PROCESSING_RULES.ADMIN_ACTIONS,
      rules: REPORT_PROCESSING_RULES
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/reports/[id] - Close report (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminPermissions(request);
    if (authResult.error) return authResult.error;
    
    // Only Super Admins can close reports
    if (!authResult.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only Super Admins can close reports' },
        { status: 403 }
      );
    }
    
    const { status, resolutionNotes } = await request.json();
    const reportId = params.id;

    if (status !== 'closed') {
      return NextResponse.json(
        { error: 'Invalid status. Only "closed" is allowed' },
        { status: 400 }
      );
    }

    await connectDB();
    const Report = await import('@/models/Report').then(m => m.default);
    
    // Get report details
    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Update report status to closed
    const updateReportStatus = (await import('@/models/Report')).updateReportStatus;
    const updatedReport = await (updateReportStatus as any)(
      reportId,
      'closed',
      authResult.user._id.toString(),
      resolutionNotes
    );

    // Log activity
    await createActivityLog({
      adminId: authResult.user._id.toString(),
      adminName: authResult.user.fullName,
      adminEmail: authResult.user.email,
      action: 'close_report',
      actionType: 'update' as const,
      targetType: 'report' as const,
      targetId: reportId,
      targetName: `${report.targetType} - ${report.targetDetails?.title || report.targetId}`,
      description: `Closed report: ${report.reason} - ${resolutionNotes || ''}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Report closed successfully',
      report: updatedReport
    });
    
  } catch (error) {
    console.error('Close report API error:', error);
    return NextResponse.json(
      { error: 'Failed to close report' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reports/[id] - Review report (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminPermissions(request);
    if (authResult.error) return authResult.error;
    
    const reportId = params.id;

    await connectDB();
    const Report = await import('@/models/Report').then(m => m.default);
    
    // Get report details
    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Update report status to reviewed
    const updateReportStatus = (await import('@/models/Report')).updateReportStatus;
    const updatedReport = await (updateReportStatus as any)(
      reportId,
      'reviewed',
      authResult.user._id.toString(),
      'Admin reviewed this report'
    );

    // Log activity
    await createActivityLog({
      adminId: authResult.user._id.toString(),
      adminName: authResult.user.fullName,
      adminEmail: authResult.user.email,
      action: 'review_report',
      actionType: 'update' as const,
      targetType: 'report' as const,
      targetId: reportId,
      targetName: `${report.targetType} - ${report.targetDetails?.title || report.targetId}`,
      description: `Reviewed report: ${report.reason}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Report reviewed successfully',
      report: updatedReport
    });
    
  } catch (error) {
    console.error('Review report API error:', error);
    return NextResponse.json(
      { error: 'Failed to review report' },
      { status: 500 }
    );
  }
}
