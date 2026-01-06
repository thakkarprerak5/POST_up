import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report, { updateReportStatus } from '@/models/Report';
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
    UNDER_REVIEW: 'under_review',
    RESOLVED: 'resolved',
    REJECTED: 'rejected'
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
async function checkAdminPermissions(request: NextRequest, requiredRole: 'admin' | 'super_admin' = 'admin') {
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
  
  if (requiredRole === 'super_admin') {
    if (userRole !== 'super_admin') {
      return { error: NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 }) };
    }
  } else {
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return { error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }) };
    }
  }

  return { 
    user, 
    session, 
    userRole,
    isSuperAdmin: userRole === 'super_admin',
    isAdmin: userRole === 'admin' || userRole === 'super_admin'
  };
}

// 🔹 Admin Action Validation Functions
function validateAdminAction(action: string, userRole: string): { allowed: boolean; reason?: string } {
  const adminRestrictedActions = ['deleteContent', 'banUser', 'suspendUser', 'changeRole'];
  const superAdminOnlyActions = ['finalAuthority', 'bypassAudit'];
  
  if (userRole === 'admin') {
    if (adminRestrictedActions.includes(action)) {
      return { allowed: false, reason: `Admins cannot perform action: ${action}` };
    }
    if (superAdminOnlyActions.includes(action)) {
      return { allowed: false, reason: `Super Admin only action: ${action}` };
    }
  }
  
  return { allowed: true };
}

// 🔹 Report Processing Logic
async function processReportAction(
  reportId: string,
  action: string,
  actionData: any,
  adminUser: any,
  request: NextRequest
) {
  const { userRole, isSuperAdmin } = adminUser;
  
  // Get report details
  const report = await Report.findById(reportId);
  if (!report) {
    return { error: NextResponse.json({ error: 'Report not found' }, { status: 404 }) };
  }

  // Validate action based on role
  const actionValidation = validateAdminAction(action, userRole);
  if (!actionValidation.allowed) {
    return { error: NextResponse.json({ error: actionValidation.reason || 'Action not allowed' }, { status: 403 }) };
  }

  // Process different actions
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
      
    case 'escalate':
      if (!isSuperAdmin) {
        return { error: NextResponse.json({ error: 'Only Super Admins can escalate reports' }, { status: 403 }) };
      }
      result = await handleEscalateAction(report, actionData, adminUser);
      break;
      
    case 'deleteContent':
      if (!isSuperAdmin) {
        return { error: NextResponse.json({ error: 'Only Super Admins can delete content' }, { status: 403 }) };
      }
      result = await handleDeleteContentAction(report, actionData, adminUser);
      break;
      
    case 'banUser':
      if (!isSuperAdmin) {
        return { error: NextResponse.json({ error: 'Only Super Admins can ban users' }, { status: 403 }) };
      }
      result = await handleBanUserAction(report, actionData, adminUser);
      break;
      
    default:
      return { error: NextResponse.json({ error: 'Invalid action' }, { status: 400 }) };
  }

  // Log the action
  await logAdminAction(adminUser, action, report, result, request);
  
  return result;
}

// 🔹 Action Handler Functions
async function handleReviewAction(report: any, actionData: any, adminUser: any) {
  const updatedReport = await Report.findByIdAndUpdate(
    report._id,
    { 
      status: REPORT_PROCESSING_RULES.REPORT_STATUS_FLOW.UNDER_REVIEW,
      assignedTo: adminUser.user._id.toString(),
      adminNotes: actionData.notes || ''
    },
    { new: true }
  );

  return NextResponse.json({
    message: 'Report marked for review',
    report: updatedReport,
    action: 'review'
  });
}

async function handleResolveAction(report: any, actionData: any, adminUser: any, isSuperAdmin: boolean) {
  const updatedReport = await updateReportStatus(
    report._id,
    REPORT_PROCESSING_RULES.REPORT_STATUS_FLOW.RESOLVED,
    adminUser.user._id.toString(),
    actionData.resolutionNotes
  );

  return NextResponse.json({
    message: 'Report resolved successfully',
    report: updatedReport,
    action: 'resolve'
  });
}

async function handleRejectAction(report: any, actionData: any, adminUser: any, isSuperAdmin: boolean) {
  const updatedReport = await updateReportStatus(
    report._id,
    REPORT_PROCESSING_RULES.REPORT_STATUS_FLOW.REJECTED,
    adminUser.user._id.toString(),
    actionData.resolutionNotes
  );

  return NextResponse.json({
    message: 'Report rejected successfully',
    report: updatedReport,
    action: 'reject'
  });
}

async function handleAssignAction(report: any, actionData: any, adminUser: any) {
  const updatedReport = await Report.findByIdAndUpdate(
    report._id,
    { 
      status: REPORT_PROCESSING_RULES.REPORT_STATUS_FLOW.UNDER_REVIEW,
      assignedTo: adminUser.user._id.toString()
    },
    { new: true }
  );

  return NextResponse.json({
    message: 'Report assigned successfully',
    report: updatedReport,
    action: 'assign'
  });
}

async function handleEscalateAction(report: any, actionData: any, adminUser: any) {
  const updatedReport = await Report.findByIdAndUpdate(
    report._id,
    { 
      status: REPORT_PROCESSING_RULES.REPORT_STATUS_FLOW.UNDER_REVIEW,
      assignedTo: adminUser.user._id.toString(),
      escalatedTo: adminUser.user._id.toString(),
      escalationReason: actionData.escalationReason
    },
    { new: true }
  );

  return NextResponse.json({
    message: 'Report escalated successfully',
    report: updatedReport,
    action: 'escalate'
  });
}

async function handleDeleteContentAction(report: any, actionData: any, adminUser: any) {
  // This would integrate with your content deletion system
  // For now, just log the action
  return NextResponse.json({
    message: 'Content deletion initiated',
    action: 'deleteContent'
  });
}

async function handleBanUserAction(report: any, actionData: any, adminUser: any) {
  // This would integrate with your user management system
  // For now, just log the action
  return NextResponse.json({
    message: 'User ban initiated',
    action: 'banUser'
  });
}

// 🔹 Audit Logging Function
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
    actionType: 'update',
    targetType: 'report',
    targetId: report._id.toString(),
    targetName: `${report.targetType} - ${report.targetDetails?.title || report.targetId}`,
    description: `${action} on report: ${report.reason}`,
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  };

  await createActivityLog(logData);
}

// 🔹 Report Status Validation
function validateReportStatusTransition(currentStatus: string, newStatus: string, userRole: string): { allowed: boolean; reason?: string } {
  const validTransitions = {
    'pending': ['under_review', 'rejected'],
    'under_review': ['resolved', 'rejected', 'escalated'],
    'resolved': [], // Final state
    'rejected': []  // Final state
  };

  if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
    return { allowed: false, reason: `Invalid status transition from ${currentStatus} to ${newStatus}` };
  }

  return { allowed: true };
}

// 🔹 Main API Handlers
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminPermissions(request, 'admin');
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const targetType = searchParams.get('targetType') || '';
    const priority = searchParams.get('priority') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get reports with filtering
    const { getReports, getReportsCount, getReportStats } = await import('@/models/Report');
    
    const [reports, totalCount, stats] = await Promise.all([
      getReports({
        status: status || undefined,
        targetType: targetType || undefined,
        priority: priority || undefined,
        page,
        limit
      }),
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminPermissions(request, 'admin');
    if (authResult.error) return authResult.error;
    
    const { action, ...actionData } = await request.json();
    const reportId = params.id;

    const result = await processReportAction(reportId, action, actionData, authResult, request);
    return result;
    
  } catch (error) {
    console.error('Report action API error:', error);
    return NextResponse.json(
      { error: 'Failed to process report action' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await checkAdminPermissions(request, 'admin');
    if (authResult.error) return authResult.error;
    
    const { action, ...actionData } = await request.json();
    const reportId = params.id;

    const result = await processReportAction(reportId, action, actionData, authResult, request);
    return result;
    
  } catch (error) {
    console.error('Report action API error:', error);
    return NextResponse.json(
      { error: 'Failed to process report action' },
      { status: 500 }
    );
  }
}
