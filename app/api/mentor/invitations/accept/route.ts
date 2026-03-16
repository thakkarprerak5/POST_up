import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { authOptions } from '@/auth';
import { findInvitationById, updateInvitationStatus } from '@/models/MentorInvitation';
import { createMentorAssignment } from '@/models/MentorAssignment';
import { getAllGroupMemberIds } from '@/models/Group';
import User from '@/models/User';
import Project from '@/models/Project';

// POST /api/mentor/invitations/accept - Accept mentor invitation with complete group support
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    await connectDB();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Get mentor user
    const mentor = await User.findOne({ email: session.user.email }).exec();
    if (!mentor || !['mentor', 'admin', 'super-admin'].includes(mentor.type)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('🎯 MENTOR ACCEPTANCE FLOW STARTED');
    console.log('📋 Invitation ID:', invitationId);
    console.log('👤 Mentor:', mentor.fullName, '(', mentor._id.toString(), ')');

    // STEP 1: Fetch Invitation & Project
    console.log('📋 STEP 1: Fetching invitation and project...');
    const invitation = await findInvitationById(invitationId);
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify this invitation belongs to the mentor
    if (invitation.mentorId.toString() !== mentor._id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({
        error: 'Invitation is no longer pending'
      }, { status: 400 });
    }

    const project = await Project.findById(invitation.projectId).exec();
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('✅ STEP 1 COMPLETE: Fetched invitation and project');
    console.log('📊 Invitation details:', {
      id: invitation._id,
      projectTitle: invitation.projectTitle,
      hasGroupId: !!invitation.groupId,
      groupId: invitation.groupId,
      studentId: invitation.studentId
    });

    // STEP 2: Determine Assignment Type
    console.log('📋 STEP 2: Determining assignment type...');
    const isGroupAssignment = !!invitation.groupId;
    console.log('📊 Assignment type:', isGroupAssignment ? 'GROUP' : 'INDIVIDUAL');

    // Start database transaction for atomic updates
    const session_db = await mongoose.startSession();
    session_db.startTransaction();

    try {
      let allStudentIds: string[] = [];
      let createdAssignment: any = null;

      if (isGroupAssignment) {
        // GROUP ASSIGNMENT LOGIC
        console.log('📋 STEP 3: Creating GROUP assignment...');

        // Get all group member IDs
        allStudentIds = await getAllGroupMemberIds(invitation.groupId.toString());
        console.log('👥 Group members found:', allStudentIds.length, 'students');
        console.log('📊 Member IDs:', allStudentIds);

        // Create group mentor assignment
        const groupAssignmentData = {
          mentorId: mentor._id.toString(),
          assignedToType: 'group', // CRITICAL: MUST be 'group'
          groupId: invitation.groupId.toString(), // CRITICAL: MUST include groupId
          projectId: invitation.projectId.toString(),
          assignedBy: session.user.id, // Use session user ID
          assignedAt: new Date(), // CRITICAL: Explicitly set assignedAt to prevent "Invalid Date"
          status: 'active' // CRITICAL: Explicitly set status to 'active'
        };

        console.log('🔥 CREATING GROUP ASSIGNMENT WITH PAYLOAD:', groupAssignmentData);
        console.log('🔥 PAYLOAD VERIFICATION:');
        console.log('   - mentorId:', groupAssignmentData.mentorId);
        console.log('   - assignedToType:', groupAssignmentData.assignedToType, '(MUST be "group")');
        console.log('   - groupId:', groupAssignmentData.groupId, '(MUST be set for groups)');
        console.log('   - projectId:', groupAssignmentData.projectId);
        console.log('   - assignedBy:', groupAssignmentData.assignedBy);
        console.log('   - status:', groupAssignmentData.status, '(MUST be "active")');

        // CRITICAL: Do NOT include studentId for group assignments
        if ('studentId' in groupAssignmentData) {
          console.error('❌ CRITICAL ERROR: studentId should NOT be present in group assignments');
        }

        createdAssignment = await createMentorAssignment(groupAssignmentData);
        console.log('✅ STEP 3 COMPLETE: Group assignment created successfully');
        console.log('📊 SAVED ASSIGNMENT TO MONGODB:', {
          assignmentId: createdAssignment._id,
          mentorId: createdAssignment.mentorId,
          assignedToType: createdAssignment.assignedToType,
          groupId: createdAssignment.groupId,
          studentId: createdAssignment.studentId, // Should be null/undefined
          projectId: createdAssignment.projectId,
          status: createdAssignment.status,
          assignedAt: createdAssignment.assignedAt
        });

        // Verify the assignment was saved correctly
        if (createdAssignment.assignedToType !== 'group' || !createdAssignment.groupId) {
          console.error('❌ CRITICAL: Assignment was not saved correctly!');
          console.error('❌ Expected assignedToType: "group", got:', createdAssignment.assignedToType);
          console.error('❌ Expected groupId to be set, got:', createdAssignment.groupId);
          throw new Error('Group assignment was not saved correctly to database');
        }

      } else {
        // INDIVIDUAL ASSIGNMENT LOGIC
        console.log('📋 STEP 3: Creating INDIVIDUAL assignment...');
        allStudentIds = [invitation.studentId.toString()];

        const individualAssignmentData = {
          mentorId: mentor._id.toString(),
          assignedToType: 'student', // Individual assignment
          studentId: invitation.studentId.toString(), // CRITICAL: Include studentId for individual
          projectId: invitation.projectId.toString(),
          assignedBy: session.user.id, // Use session user ID
          assignedAt: new Date(), // CRITICAL: Explicitly set assignedAt to prevent "Invalid Date"
          status: 'active' // CRITICAL: Explicitly set status to 'active'
        };

        console.log('🔥 CREATING INDIVIDUAL ASSIGNMENT WITH PAYLOAD:', individualAssignmentData);
        console.log('🔥 PAYLOAD VERIFICATION:');
        console.log('   - mentorId:', individualAssignmentData.mentorId);
        console.log('   - assignedToType:', individualAssignmentData.assignedToType, '(MUST be "student")');
        console.log('   - studentId:', individualAssignmentData.studentId, '(MUST be set for individuals)');
        console.log('   - projectId:', individualAssignmentData.projectId);
        console.log('   - assignedBy:', individualAssignmentData.assignedBy);
        console.log('   - status:', individualAssignmentData.status, '(MUST be "active")');

        // CRITICAL: Do NOT include groupId for individual assignments
        if ('groupId' in individualAssignmentData) {
          console.error('❌ CRITICAL ERROR: groupId should NOT be present in individual assignments');
        }

        createdAssignment = await createMentorAssignment(individualAssignmentData);
        console.log('✅ STEP 3 COMPLETE: Individual assignment created successfully');
        console.log('📊 SAVED ASSIGNMENT TO MONGODB:', {
          assignmentId: createdAssignment._id,
          mentorId: createdAssignment.mentorId,
          assignedToType: createdAssignment.assignedToType,
          studentId: createdAssignment.studentId,
          groupId: createdAssignment.groupId, // Should be null/undefined
          projectId: createdAssignment.projectId,
          status: createdAssignment.status,
          assignedAt: createdAssignment.assignedAt
        });

        // Verify the assignment was saved correctly
        if (createdAssignment.assignedToType !== 'student' || !createdAssignment.studentId) {
          console.error('❌ CRITICAL: Individual assignment was not saved correctly!');
          console.error('❌ Expected assignedToType: "student", got:', createdAssignment.assignedToType);
          console.error('❌ Expected studentId to be set, got:', createdAssignment.studentId);
          throw new Error('Individual assignment was not saved correctly to database');
        }
      }

      // STEP 4: Update Invitation Status
      console.log('📋 STEP 4: Updating invitation status...');
      await updateInvitationStatus(invitationId, 'accepted', 'Mentor accepted the invitation');
      console.log('✅ STEP 4 COMPLETE: Invitation status updated to accepted');

      // STEP 5: Activate Project
      console.log('📋 STEP 5: Activating project...');
      await Project.findByIdAndUpdate(invitation.projectId, {
        projectStatus: 'ACTIVE',
        mentorId: mentor._id.toString(),
        mentorStatus: 'assigned',
        activatedAt: new Date()
      }, { session: session_db });
      console.log('✅ STEP 5 COMPLETE: Project activated and mentor assigned');

      // STEP 6: Send Notifications via NotificationService
      console.log('📋 STEP 6: Sending notifications via NotificationService...');

      const { notifyMentorResponse, notifySuperAdminsOfMentorActivity } = await import('@/lib/services/NotificationService');

      // Get student name for super-admin notification
      let studentName = 'Unknown Student';
      if (allStudentIds.length > 0) {
        const firstStudent = await User.findById(allStudentIds[0]).select('fullName').exec();
        if (firstStudent) {
          studentName = firstStudent.fullName;
        }
      }

      // Notify students (individual or group)
      await notifyMentorResponse(
        invitation.projectId.toString(),
        invitation.projectTitle,
        mentor._id.toString(),
        mentor.fullName,
        'accepted',
        isGroupAssignment,
        isGroupAssignment ? invitation.groupId?.toString() : undefined,
        !isGroupAssignment ? invitation.studentId?.toString() : undefined
      );

      // Notify super-admins of mentor activity
      await notifySuperAdminsOfMentorActivity(
        mentor._id.toString(),
        mentor.fullName,
        allStudentIds[0], // Representative student
        studentName,
        'accepted',
        invitation.projectId.toString(),
        invitation.projectTitle
      );

      console.log(`✅ STEP 6 COMPLETE: Notifications sent to ${allStudentIds.length} students and super-admins`);


      await session_db.commitTransaction();
      console.log('✅ TRANSACTION COMMITTED SUCCESSFULLY');

      return NextResponse.json({
        success: true,
        message: 'Mentor invitation accepted successfully',
        data: {
          assignmentId: createdAssignment._id.toString(),
          assignmentType: createdAssignment.assignedToType,
          projectId: invitation.projectId.toString(),
          projectTitle: invitation.projectTitle,
          mentorId: mentor._id.toString(),
          mentorName: mentor.fullName,
          groupId: isGroupAssignment ? invitation.groupId?.toString() : null,
          studentsUpdated: successfulUpdates.length,
          totalStudents: allStudentIds.length
        }
      });

    } catch (error) {
      await session_db.abortTransaction();
      console.error('❌ TRANSACTION ABORTED:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('❌ MENTOR ACCEPTANCE ERROR:', error);
    return NextResponse.json(
      {
        error: 'Failed to accept mentor invitation',
        details: error.message
      },
      { status: 500 }
    );
  }
}
