import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import MentorAssignment from '@/models/MentorAssignment';
import User from '@/models/User';
import { notifyAssignmentRemoved } from '@/lib/notifications';

// DELETE /api/mentor/assignments/[assignmentId] - Remove specific mentor assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const resolvedParams = await params;
  console.log('🗑️ DELETE mentor assignment API called for assignmentId:', resolvedParams.assignmentId);

  try {
    await connectDB();

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    // Find current user from database
    const currentUser = await User.findOne({ email: session.user.email }).exec();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is a mentor
    if (!['mentor', 'admin', 'super-admin'].includes(currentUser.type)) {
      return NextResponse.json(
        { error: 'Access denied. Only mentors and admins can remove assignments.' },
        { status: 403 }
      );
    }

    const assignmentId = resolvedParams.assignmentId;
    const mentorId = currentUser._id.toString();

    console.log('🔍 Looking for assignment:', { assignmentId, mentorId });

    // Find the assignment first to validate ownership
    const assignment = await MentorAssignment.findById(assignmentId).exec();

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.status !== 'active') {
      return NextResponse.json(
        { error: 'Assignment is already removed' },
        { status: 400 }
      );
    }

    // CRITICAL SECURITY CHECK: Ensure the assignment belongs to the current mentor
    if (assignment.mentorId !== mentorId) {
      console.error('🚨 SECURITY VIOLATION: Mentor trying to remove assignment that belongs to another mentor');
      return NextResponse.json(
        { error: 'Access denied. You can only remove your own assignments.' },
        { status: 403 }
      );
    }

    console.log('✅ Ownership validated, removing assignment...');

    // Parse request body for enhanced removal data
    let removalData = {
      pathway: 'other' as const,
      reason: undefined as string | undefined,
      assignmentType: 'student' as const
    };

    try {
      const body = await request.json();
      removalData = {
        pathway: body.pathway || 'other',
        reason: body.reason,
        assignmentType: body.assignmentType || 'student'
      };
      console.log('📝 Removal data received:', removalData);
    } catch (error) {
      console.log('📝 No body data, using default removal values');
    }

    // Determine status and fields based on pathway
    let updateFields: any = { status: 'removed' };
    let auditAction = 'removed';

    switch (removalData.pathway) {
      case 'completed':
        updateFields = {
          status: 'completed',
          removalReason: 'project_completed',
          completedAt: new Date(),
          completedBy: currentUser._id.toString()
        };
        auditAction = 'completed';
        break;
      case 'report':
        updateFields = {
          status: 'removed',
          removalReason: 'report_issue',
          removedBy: currentUser._id.toString(),
          removedAt: new Date()
        };
        auditAction = 'removed_due_to_report';
        break;
      case 'other':
        updateFields = {
          status: 'removed',
          removalReason: 'other',
          removalDetails: removalData.reason,
          removedBy: currentUser._id.toString(),
          removedAt: new Date()
        };
        auditAction = 'removed_for_reassignment';
        break;
    }

    // Update the assignment with enhanced removal data
    const result = await MentorAssignment.updateOne(
      { _id: assignmentId, mentorId: mentorId },
      updateFields
    ).exec();

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to remove assignment or assignment already removed' },
        { status: 400 }
      );
    }

    // For 'other' pathway, update student/group status to awaiting_reassignment
    if (removalData.pathway === 'other') {
      try {
        const User = (global as any).User || mongoose.models.User;
        const Group = (global as any).Group || mongoose.models.Group;

        if (assignment.studentId) {
          await User.findByIdAndUpdate(assignment.studentId, {
            status: 'awaiting_reassignment',
            previousMentorId: assignment.mentorId,
            removalReason: removalData.reason,
            removedAt: new Date()
          });
        } else if (assignment.groupId) {
          await Group.findByIdAndUpdate(assignment.groupId, {
            status: 'awaiting_reassignment',
            previousMentorId: assignment.mentorId,
            removalReason: removalData.reason,
            removedAt: new Date()
          });
        }
      } catch (statusUpdateError) {
        console.error('⚠️ Failed to update reassignment status:', statusUpdateError);
        // Don't fail the request, but log the error
      }
    }

    // Log the removal action for audit
    console.log('🔍 AUDIT LOG: Mentor assignment ' + auditAction, {
      removedBy: {
        id: currentUser._id,
        email: currentUser.email,
        fullName: currentUser.fullName
      },
      assignmentId,
      removalPathway: removalData.pathway,
      removalReason: removalData.reason,
      assignmentDetails: {
        mentorId: assignment.mentorId,
        assignedToType: assignment.assignedToType,
        studentId: assignment.studentId,
        groupId: assignment.groupId,
        assignedAt: assignment.assignedAt
      },
      timestamp: new Date().toISOString()
    });

    // Notify the student/group about the removal
    try {
      if (assignment.assignedToType === 'student' && assignment.studentId) {
        // Handle populated vs string ID
        const studentId = (assignment.studentId as any)._id
          ? (assignment.studentId as any)._id.toString()
          : assignment.studentId.toString();

        // Fetch project title if not populated
        let projectTitle = 'Project';
        if (assignment.projectId && typeof assignment.projectId === 'object' && 'title' in assignment.projectId) {
          projectTitle = (assignment.projectId as any).title;
        }

        await notifyAssignmentRemoved({
          recipientId: studentId,
          projectId: assignment.projectId ? assignment.projectId.toString() : '',
          projectTitle: projectTitle,
          reason: removalData.pathway === 'completed' ? 'Project Completed' : (removalData.reason || 'Assignment removed'),
        });
      }
    } catch (notifyError) {
      console.error('❌ Failed to send removal notification:', notifyError);
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment removed successfully',
      data: {
        assignmentId,
        removedBy: currentUser.fullName,
        removedAt: new Date(),
        assignmentType: assignment.assignedToType,
        affectedEntity: assignment.studentId || assignment.groupId,
        pathway: removalData.pathway,
        reason: removalData.reason,
        status: updateFields.status
      }
    });

  } catch (error) {
    console.error('❌ Error in DELETE /api/mentor/assignments/[assignmentId]:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/mentor/assignments/[assignmentId] - Get specific assignment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const resolvedParams = await params;
  console.log('🔍 GET mentor assignment API called for assignmentId:', resolvedParams.assignmentId);

  try {
    await connectDB();

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    // Find current user from database
    const currentUser = await User.findOne({ email: session.user.email }).exec();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const assignmentId = resolvedParams.assignmentId;

    // Find the assignment with populated details
    const assignment = await MentorAssignment.findById(assignmentId)
      .populate('mentorId', 'fullName email photo')
      .populate('studentId', 'fullName email photo')
      .populate('groupId', 'name description')
      .populate('assignedBy', 'fullName')
      .exec();

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check permissions:
    // 1. Mentor can view their own assignments
    // 2. Students can view assignments they're part of
    // 3. Admins can view all assignments (if we add admin check later)

    const isMentor = currentUser.type === 'mentor';
    const isStudent = currentUser.type === 'student';
    const currentUserStrId = currentUser._id.toString();

    let canView = false;
    let canManage = false;

    if (isMentor && assignment.mentorId._id.toString() === currentUserStrId) {
      // Mentor viewing their own assignment
      canView = true;
      canManage = true;
    } else if (isStudent && assignment.studentId && assignment.studentId._id.toString() === currentUserStrId) {
      // Student viewing their own assignment
      canView = true;
      canManage = false;
    }

    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied. You cannot view this assignment.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        assignment: assignment,
        permissions: {
          canView: true,
          canManage: canManage,
          isOwnAssignment: canManage
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/mentor/assignments/[assignmentId]:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
