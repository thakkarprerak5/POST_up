import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Report, { updateReportStatus } from '@/models/Report';
import { createActivityLog } from '@/models/AdminActivityLog';
import { getServerSession } from 'next-auth/next';
import User from '@/models/User';
import Project from '@/models/Project';
import Comment from '@/models/Comment';
import Chat from '@/models/Chat';
import { NextRequest } from 'mongodb';

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
async function checkAdminPermissions(request: NextRequest, requiredRole: 'admin' | 'super-admin' = 'admin') {
  const session = await getServerSession();

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
  const isSuperAdmin = userRole === 'super-admin';

  if (requiredRole === 'super-admin') {
    if (userRole !== 'super-admin') {
      return { error: NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 }) };
    }
  } else {
    if (userRole !== 'admin' && userRole !== 'super-admin') {
      return { error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }) };
    }
  }

  return {
    user,
    session,
    userRole,
    isSuperAdmin,
    isAdmin: userRole === 'admin' || userRole === 'super-admin'
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
  try {
    await connectDB();
    
    // Delete actual content based on target type
    switch (report.targetType) {
      case 'project':
        await Project.findByIdAndDelete(report.targetId);
        console.log(`🗑️ Deleted project: ${report.targetId}`);
        break;
        
      case 'comment':
        // Comment model now exists
        try {
          await Comment.findByIdAndDelete(report.targetId);
          console.log(`🗑️ Deleted comment: ${report.targetId}`);
        } catch (err) {
          console.log('⚠️ Comment model not found, skipping deletion');
        }
        break;
        
      case 'user':
        // Don't delete user, just ban them
        await User.findByIdAndUpdate(report.reportedUserId, {
          isActive: false,
          isBlocked: true,
          banStatus: 'PROPER_BAN',
          banReason: 'Account deleted due to policy violations',
          bannedBy: adminUser.user._id.toString(),
          banExpiresAt: null
        });
        console.log(`🚫 Banned user: ${report.reportedUserId}`);
        break;
        
      case 'chat':
        // Chat model exists
        try {
          await Chat.findByIdAndDelete(report.targetId);
          console.log(`🗑️ Deleted chat: ${report.targetId}`);
        } catch (err) {
          console.log('⚠️ Chat model not found, skipping deletion');
        }
        break;
    }

    // Log deletion action
    await createActivityLog({
      adminId: adminUser.user._id.toString(),
      adminName: adminUser.user.fullName,
      action: 'delete_content',
      targetType: report.targetType,
      targetId: report.targetId,
      targetName: report.targetDetails?.title || report.targetId,
      description: `Deleted ${report.targetType} due to: ${report.reason}`,
      ipAddress: adminUser.ipAddress || 'unknown'
    });

    return NextResponse.json({
      message: `${report.targetType} deleted successfully`,
      action: 'deleteContent',
      deletedType: report.targetType,
      deletedId: report.targetId
    });

  } catch (error) {
    console.error('❌ Error deleting content:', error);
    return NextResponse.json({
      error: 'Failed to delete content',
      details: error.message
    }, { status: 500 });
  }
}

async function handleBanUserAction(report: any, actionData: any, adminUser: any) {
  try {
    await connectDB();
    
    const { banType, banDuration, banReason } = actionData;
    
    // Calculate ban expiration
    let banExpiresAt = null;
    if (banType === 'SOFT_BAN' && banDuration) {
      const durationMap = {
        '1_day': 1,
        '1_week': 7,
        '1_month': 30,
        'permanent': null
      };
      const days = durationMap[banDuration];
      if (days) {
        banExpiresAt = new Date();
        banExpiresAt.setDate(banExpiresAt.getDate() + days);
      }
    }
    
    // Update user with ban information
    const updatedUser = await User.findByIdAndUpdate(
      report.reportedUserId,
      {
        isActive: banType !== 'PROPER_BAN', // Proper ban = inactive
        isBlocked: true,
        banStatus: banType,
        banExpiresAt,
        banReason: banReason || `Banned for: ${report.reason}`,
        bannedBy: adminUser.user._id.toString()
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({
        error: 'User not found',
        action: 'banUser'
      }, { status: 404 });
    }

    // Log ban action
    await createActivityLog({
      adminId: adminUser.user._id.toString(),
      adminName: adminUser.user.fullName,
      action: 'ban_user',
      targetType: 'user',
      targetId: report.reportedUserId,
      targetName: updatedUser.fullName,
      description: `Banned user (${banType}) for: ${report.reason}. Expires: ${banExpiresAt || 'Permanent'}`,
      ipAddress: adminUser.ipAddress || 'unknown',
      metadata: {
        banType,
        banExpiresAt,
        originalReportId: report._id
      }
    });

    return NextResponse.json({
      message: `User ${banType.toLowerCase()} successfully`,
      action: 'banUser',
      bannedUser: {
        id: updatedUser._id,
        name: updatedUser.fullName,
        email: updatedUser.email,
        banStatus: banType,
        banExpiresAt
      }
    });

  } catch (error) {
    console.error('❌ Error banning user:', error);
    return NextResponse.json({
      error: 'Failed to ban user',
      details: error.message
    }, { status: 500 });
  }
}

// 🔹 Main Report Action Processing Function
export async function processReportAction(
  action: string,
  report: any,
  actionData: any,
  request: NextRequest,
  userId: string
) {
  try {
    await connectDB();
    
    // Get admin user info
    const adminUser = await checkAdminPermissions(request);
    if (adminUser.error) {
      return adminUser.error;
    }

    // Validate action permissions
    const actionValidation = validateAdminAction(action, adminUser.userRole);
    if (!actionValidation.allowed) {
      return NextResponse.json({ 
        error: actionValidation.reason 
      }, { status: 403 });
    }

    // Process the action
    let result;
    switch (action) {
      case 'review':
        result = await handleReviewAction(report, actionData, adminUser);
        break;
      case 'resolve':
        result = await handleResolveAction(report, actionData, adminUser, adminUser.isSuperAdmin);
        break;
      case 'reject':
        result = await handleRejectAction(report, actionData, adminUser, adminUser.isSuperAdmin);
        break;
      case 'escalate':
        result = await handleEscalateAction(report, actionData, adminUser);
        break;
      case 'deleteContent':
        result = await handleDeleteContentAction(report, actionData, adminUser);
        break;
      case 'banUser':
        result = await handleBanUserAction(report, actionData, adminUser);
        break;
      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 });
    }

    // Log the action
    await createActivityLog({
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
    });

    return result;

  } catch (error) {
    console.error('❌ Error processing report action:', error);
    return NextResponse.json({
      error: 'Failed to process action',
      details: error.message
    }, { status: 500 });
  }
}

// 🔹 Report Status Validation
function validateReportStatusTransition(currentStatus: string, newStatus: string, userRole: string): { allowed: boolean; reason?: string } {
  const validTransitions = {
    'pending': ['under_review', 'rejected'],
    'under_review': ['resolved', 'rejected', 'escalated'],
    'resolved': [], // Final state
    'rejected': [], // Final state
    'escalated': ['resolved', 'rejected'] // Can still be resolved/rejected after escalation
  };

  if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(newStatus)) {
    return { 
      allowed: false, 
      reason: `Cannot transition from ${currentStatus} to ${newStatus}` 
    };
  }

  return { allowed: true };
}
