import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { authOptions } from '@/auth';
import { ProjectRegistrationInvitation as MentorInvitation } from '@/models/ProjectRegistration';
import { createMentorAssignment } from '@/models/MentorAssignment';
import Group from '@/models/Group';
import User from '@/models/User';
import Project from '@/models/Project';

// POST /api/mentor/invitations/[id]/respond - Respond to mentor invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    await connectDB();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { decision, responseMessage } = body;

    if (!decision || !['accept', 'reject'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    const User = mongoose.models.User;

    // Get user from email
    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user || !['mentor', 'admin', 'super-admin'].includes(user.type)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find the invitation
    const invitation = await MentorInvitation.findById(params.id);
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify this invitation belongs to the mentor
    if (invitation.mentorId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation already responded to' }, { status: 400 });
    }

    // Update invitation status
    invitation.status = decision;
    invitation.respondedAt = new Date();
    invitation.responseMessage = responseMessage || '';

    await invitation.save();

    // If accepted, create proper assignment and update all related records
    if (decision === 'accept') {
      console.log('🎯 Processing mentor acceptance for invitation:', invitation._id);

      // Determine if this is a group project based on groupId presence
      const isGroupProject = !!invitation.groupId;
      console.log('📋 Project type:', isGroupProject ? 'GROUP' : 'INDIVIDUAL');

      // Start transaction for data integrity
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Create mentor assignment with proper type and IDs
        const assignmentData: any = {
          mentorId: invitation.mentorId,
          assignedToType: isGroupProject ? 'group' : 'student',
          projectId: invitation.projectId,
          assignedBy: invitation.mentorId // Mentor accepts, so they are the assigner
        };

        if (isGroupProject) {
          assignmentData.groupId = invitation.groupId;
        } else {
          assignmentData.studentId = invitation.studentId;
        }

        console.log('➕ Creating mentor assignment:', assignmentData);
        await createMentorAssignment(assignmentData);

        // Update the project to reflect mentor acceptance
        const project = await Project.findById(invitation.projectId).session(session);
        if (project) {
          project.mentorId = invitation.mentorId;
          project.mentorStatus = 'accepted';
          project.projectStatus = 'ACTIVE';
          project.updatedAt = new Date();

          // Mark mentor as assigned for 3-step gate filtering
          if (project.origin === 'project_registration') {
            project.mentorAssigned = true;
          }

          await project.save({ session });
          console.log('✅ Project updated with mentor acceptance');
        }

        // BUG FIX 3: Update ALL group members to see this mentor
        if (isGroupProject && invitation.groupSnapshot?.members) {
          console.log('👥 Updating mentor assignment for all group members...');

          for (const member of invitation.groupSnapshot.members) {
            if (member.id) {
              // Update each group member's assignedMentor field
              await User.findByIdAndUpdate(
                member.id,
                {
                  assignedMentor: invitation.mentorId,
                  updatedAt: new Date()
                },
                { session }
              );
              console.log(`✅ Updated mentor for member: ${member.name} (${member.email})`);
            }
          }

          // Also update the group lead
          if (invitation.groupSnapshot?.lead?.id) {
            await User.findByIdAndUpdate(
              invitation.groupSnapshot.lead.id,
              {
                assignedMentor: invitation.mentorId,
                updatedAt: new Date()
              },
              { session }
            );
            console.log(`✅ Updated mentor for group lead: ${invitation.groupSnapshot.lead.name}`);
          }
        } else if (!isGroupProject && invitation.studentId) {
          // Update individual student's assignedMentor field
          await User.findByIdAndUpdate(
            invitation.studentId,
            {
              assignedMentor: invitation.mentorId,
              updatedAt: new Date()
            },
            { session }
          );
          console.log('✅ Updated mentor for individual student');
        }

        await session.commitTransaction();
        session.endSession();

        console.log('✅ Mentor acceptance processed successfully');

      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    }

    return NextResponse.json({
      message: `Invitation ${decision} successfully`,
      invitation: {
        id: invitation._id,
        status: invitation.status,
        respondedAt: invitation.respondedAt
      }
    });
  } catch (error) {
    console.error('Error responding to invitation:', error);
    return NextResponse.json(
      { error: 'Failed to respond to invitation' },
      { status: 500 }
    );
  }
}
