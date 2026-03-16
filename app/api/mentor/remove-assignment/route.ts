import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import MentorAssignment, { IMentorAssignment } from '@/models/MentorAssignment';
import User from '@/models/User';
import mongoose from 'mongoose';

interface RemovalRequest {
  assignmentId: string;
  assignmentType?: 'student' | 'group';
  removalReason: 'project_completed' | 'report_issue' | 'other';
  removalDetails?: string;
  // Support legacy field names
  reason?: 'project_completed' | 'report_issue' | 'other';
  details?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: RemovalRequest = await request.json();

    // Support both new and legacy field names
    const assignmentId = body.assignmentId;
    const reason = body.removalReason || body.reason;
    const details = body.removalDetails || body.details;
    const assignmentType = body.assignmentType;

    // Validate required fields
    if (!assignmentId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: assignmentId and removalReason' },
        { status: 400 }
      );
    }

    // Validate reason
    if (!['project_completed', 'report_issue', 'other'].includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid reason. Must be one of: project_completed, report_issue, other' },
        { status: 400 }
      );
    }

    // Require details for 'other' reason
    if (reason === 'other' && (!details || details.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Details are required when reason is "other"' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Get current mentor user
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || !['mentor', 'admin', 'super-admin'].includes(currentUser.type)) {
      return NextResponse.json(
        { error: 'Only mentors and admins can remove assignments' },
        { status: 403 }
      );
    }

    // Find the assignment
    const assignment = await MentorAssignment.findById(assignmentId);
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Verify the assignment belongs to the current mentor
    if (assignment.mentorId !== currentUser._id.toString()) {
      return NextResponse.json(
        { error: 'You can only remove your own assignments' },
        { status: 403 }
      );
    }

    // Verify assignment is currently active
    if (assignment.status !== 'active') {
      return NextResponse.json(
        { error: 'Assignment is already removed or completed' },
        { status: 400 }
      );
    }

    // Start a session for transaction
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      // Update assignment based on reason
      const updateData: Partial<IMentorAssignment> = {
        removedBy: currentUser._id.toString(),
        removedAt: new Date(),
      };

      let reportId: string | undefined;

      switch (reason) {
        case 'project_completed':
          updateData.status = 'completed';
          updateData.completedAt = new Date();
          updateData.completedBy = currentUser._id.toString();
          updateData.removalReason = 'project_completed';
          break;

        case 'report_issue':
          updateData.status = 'removed';
          updateData.removalReason = 'report_issue';
          // For report_issue, we'll create a separate report entry
          // The reportId will be set after creating the report
          break;

        case 'other':
          updateData.status = 'removed';
          updateData.removalReason = 'other';
          updateData.removalDetails = details;
          break;
      }

      // Update the assignment
      const updatedAssignment = await MentorAssignment.findByIdAndUpdate(
        assignmentId,
        updateData,
        { new: true, session: mongoSession }
      ).populate('studentId', 'fullName email photo')
        .populate('groupId', 'name description')
        .populate('projectId', 'title description');

      // If reason is 'report_issue', create a report entry
      if (reason === 'report_issue') {
        const Report = mongoose.models.Report;
        if (Report) {
          const reportData = {
            title: `Mentor Report - ${assignment.assignedToType === 'student' ? 'Student' : 'Group'}`,
            description: details || 'Mentor reported issue with assignment',
            reportedBy: currentUser._id.toString(),
            reportedAgainst: assignment.assignedToType === 'student'
              ? assignment.studentId
              : assignment.groupId,
            reportType: 'mentor_issue',
            status: 'pending',
            priority: 'medium',
            assignmentId: assignment._id.toString(),
            mentorId: assignment.mentorId,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const newReport = new Report(reportData);
          const savedReport = await newReport.save({ session: mongoSession });

          // Update assignment with report ID
          updatedAssignment.reportId = savedReport._id.toString();
          await updatedAssignment.save({ session: mongoSession });

          reportId = savedReport._id.toString();
        }
      }

      // Update project status if applicable
      if (assignment.projectId) {
        const Project = mongoose.models.Project;
        if (Project) {
          const projectUpdate: any = {};

          switch (reason) {
            case 'project_completed':
              projectUpdate.projectStatus = 'completed';
              projectUpdate.mentorStatus = 'completed';
              break;
            case 'report_issue':
              projectUpdate.projectStatus = 'under_review';
              projectUpdate.mentorStatus = 'suspended';
              break;
            case 'other':
              projectUpdate.projectStatus = 'needs_reassignment';
              projectUpdate.mentorStatus = 'removed';
              projectUpdate.mentorId = null; // Clear mentor for reassignment
              break;
          }

          await Project.findByIdAndUpdate(
            assignment.projectId,
            projectUpdate,
            { session: mongoSession }
          );
        }
      }

      // Commit transaction
      await mongoSession.commitTransaction();
      mongoSession.endSession();

      // Log the action for audit
      console.log(`🔍 Mentor Removal Action:`, {
        mentorId: currentUser._id.toString(),
        mentorName: currentUser.fullName,
        assignmentId,
        reason,
        details,
        timestamp: new Date().toISOString(),
        assignmentType: assignment.assignedToType,
        targetId: assignment.assignedToType === 'student' ? assignment.studentId : assignment.groupId
      });

      // Notify the student/group about the removal
      try {
        const { notifyAssignmentRemoved } = await import('@/lib/services/NotificationService');

        if (assignment.assignedToType === 'student' && assignment.studentId) {
          // Handle populated vs string ID
          const studentId = (assignment.studentId as any)._id
            ? (assignment.studentId as any)._id.toString()
            : assignment.studentId.toString();

          // ✅ SAFE: Handle null projectId with optional chaining and fallback
          const projectTitle = assignment.projectId?.title || 'a project';
          const projectId = assignment.projectId?._id?.toString() || assignment.projectId?.toString();

          await notifyAssignmentRemoved({
            recipientId: studentId,
            projectId: projectId || 'unknown',
            projectTitle: projectTitle,
            reason: reason === 'project_completed' ? 'Project Completed' : (details || 'Assignment removed'),
            isGroup: false
          });

          console.log('🔔 Sent removal notification to student');
        } else if (assignment.assignedToType === 'group' && assignment.groupId) {
          // ✅ SAFE: Handle group notifications with null checks
          const groupId = (assignment.groupId as any)._id
            ? (assignment.groupId as any)._id.toString()
            : assignment.groupId.toString();

          const groupName = assignment.groupId?.name || 'your group';
          const projectTitle = assignment.projectId?.title || 'a project';
          const projectId = assignment.projectId?._id?.toString() || assignment.projectId?.toString();

          console.log(`📋 Group assignment removed: ${groupName}, project: ${projectTitle}`);

          // Send to ALL group members via NotificationService
          await notifyAssignmentRemoved({
            recipientId: 'GROUP', // Not used for group notifications but required by type
            projectId: projectId || 'unknown',
            projectTitle: projectTitle,
            reason: reason === 'project_completed' ? 'Project Completed' : (details || 'Assignment removed'),
            isGroup: true,
            groupId: groupId
          });

          console.log('🔔 Sent removal notification to ALL group members');
        }
      } catch (notifyError) {
        console.error('❌ Failed to send removal notification:', notifyError);
        // Don't fail the request if notification fails
      }

      return NextResponse.json({
        success: true,
        message: `Assignment ${reason === 'project_completed' ? 'completed' : 'removed'} successfully`,
        assignment: updatedAssignment,
        reportId,
        action: reason
      });

    } catch (transactionError) {
      // Abort transaction on error
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Error in mentor removal API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch removal history for audit purposes
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Get current user
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');
    const targetId = searchParams.get('targetId');

    // Build query
    let query: any = {};

    // If user is a mentor, only show their own removals
    if (currentUser.type === 'mentor') {
      query.mentorId = currentUser._id.toString();
    } else if (mentorId) {
      // Admin can view specific mentor's history
      query.mentorId = mentorId;
    }

    // Filter by target if specified
    if (targetId) {
      query.$or = [
        { studentId: targetId },
        { groupId: targetId }
      ];
    }

    // Only fetch removed or completed assignments
    query.status = { $in: ['removed', 'completed'] };

    // Fetch assignments with removal history
    const assignments = await MentorAssignment.find(query)
      .populate('mentorId', 'fullName email')
      .populate('studentId', 'fullName email photo')
      .populate('groupId', 'name description')
      .populate('projectId', 'title description')
      .populate('removedBy', 'fullName email')
      .populate('completedBy', 'fullName email')
      .populate('reportId', 'title status')
      .sort({ removedAt: -1, completedAt: -1 });

    return NextResponse.json({
      success: true,
      assignments,
      count: assignments.length
    });

  } catch (error) {
    console.error('❌ Error fetching removal history:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
