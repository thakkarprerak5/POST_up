import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import { getMentorInvitations, updateInvitationStatus } from '@/models/MentorInvitation';
import User from '@/models/User';
import Project from '@/models/Project';
import MentorInvitation from '@/models/MentorInvitation';
import { createMentorAssignment } from '@/models/MentorAssignment';
import Group from '@/models/Group';
import { notifyMentorAccepted, notifyMentorRejected } from '@/lib/notifications';

// GET /api/mentor/invitations - Get mentor's invitations
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user || !['mentor', 'admin', 'super-admin'].includes(user.type)) {
      return NextResponse.json({ error: 'Mentor or Admin access required' }, { status: 403 });
    }

    // Additional privacy check: Ensure the user can only access their own data
    const { searchParams } = new URL(request.url);
    const requestedMentorId = searchParams.get('mentorId');

    if (requestedMentorId && requestedMentorId !== user._id.toString()) {
      return NextResponse.json({ error: 'Access denied. You can only view your own invitations.' }, { status: 403 });
    }

    const status = searchParams.get('status') || undefined; // 'pending', 'accepted', 'rejected'

    console.log('🔍 GET invitations for mentor:', user._id.toString());
    console.log('🔍 Status filter:', status);

    const invitations = await getMentorInvitations(user._id.toString(), status);

    console.log('🔍 Found invitations count:', invitations.length);
    console.log('🔍 Found invitations:', invitations.map(inv => ({
      _id: inv._id,
      mentorId: inv.mentorId,
      studentId: inv.studentId,
      projectId: inv.projectId,
      status: inv.status,
      projectTitle: inv.projectTitle
    })));

    const stats = {
      total: invitations.length,
      pending: invitations.filter(inv => inv.status === 'pending').length,
      accepted: invitations.filter(inv => inv.status === 'accepted').length,
      rejected: invitations.filter(inv => inv.status === 'rejected').length
    };

    return NextResponse.json({
      invitations,
      stats: {
        pending: invitations.filter(inv => inv.status === 'pending').length,
        accepted: invitations.filter(inv => inv.status === 'accepted').length,
        rejected: invitations.filter(inv => inv.status === 'rejected').length,
        total: invitations.length
      }
    });
  } catch (error) {
    console.error('Mentor invitations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}

// POST /api/mentor/invitations - Respond to invitation (workaround for PUT route issue)
export async function POST(request: NextRequest) {
  console.log('🚀 POST route called for invitation response');

  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    console.log('🔍 Session check:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userId: session?.user?.id
    });

    if (!session?.user?.email) {
      console.log('❌ No session email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).exec();
    console.log('🔍 User lookup result:', {
      found: !!user,
      userType: user?.type,
      userId: user?._id?.toString()
    });

    if (!user || !['mentor', 'admin', 'super-admin'].includes(user.type)) {
      console.log('❌ User not found or not mentor/admin');
      return NextResponse.json({ error: 'Mentor or Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { invitationId, status, responseMessage } = body;

    if (!invitationId || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    console.log('🔍 Attempting to update invitation:', invitationId, 'with status:', status);

    const updatedInvitation = await updateInvitationStatus(
      invitationId,
      status as 'accepted' | 'rejected',
      responseMessage || undefined
    );

    console.log('🔍 Updated invitation result:', updatedInvitation);

    if (!updatedInvitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Privacy check: Ensure the invitation belongs to this mentor
    const invitationMentorId = updatedInvitation.mentorId._id
      ? updatedInvitation.mentorId._id.toString()
      : updatedInvitation.mentorId.toString();

    if (invitationMentorId !== user._id.toString()) {
      console.log('❌ Access denied: Invitation mentorId does not match session user');
      console.log('🔍 Invitation mentorId:', invitationMentorId);
      console.log('🔍 Session user ID:', user._id.toString());
      return NextResponse.json({ error: 'Access denied. You can only respond to your own invitations.' }, { status: 403 });
    }

    // If accepted, update project status AND create mentor assignment
    if (status === 'accepted') {
      // Handle both populated object and string cases for projectId
      const projectId = updatedInvitation.projectId._id
        ? updatedInvitation.projectId._id.toString()
        : updatedInvitation.projectId.toString();

      await Project.findByIdAndUpdate(projectId, {
        mentorStatus: 'accepted',
        projectStatus: 'active',
        mentorInvitation: {
          mentorName: user.fullName,
          status: 'accepted',
          timestamp: new Date().toISOString()
        }
      });

      // Create mentor assignment so student can see mentor in their profile
      try {
        console.log('🎯 Creating mentor assignment for accepted invitation');
        console.log('🔍 Updated invitation studentId:', updatedInvitation.studentId);
        console.log('🔍 Updated invitation groupId:', updatedInvitation.groupId);

        // Handle both populated object and string cases for IDs
        const studentId = updatedInvitation.studentId?._id
          ? updatedInvitation.studentId._id.toString()
          : updatedInvitation.studentId?.toString();

        const projectId = updatedInvitation.projectId._id
          ? updatedInvitation.projectId._id.toString()
          : updatedInvitation.projectId.toString();

        console.log('🔍 Extracted IDs:', { studentId, projectId });

        // THE CRITICAL FIX: Dynamic payload based on invitation type
        let assignmentData = {
          mentorId: user._id.toString(),
          projectId: projectId,
          status: 'active',
          assignedBy: user._id.toString()
        };

        // Check if this is a group invitation
        if (updatedInvitation.groupId) {
          // Group assignment
          const groupId = updatedInvitation.groupId._id
            ? updatedInvitation.groupId._id.toString()
            : updatedInvitation.groupId.toString();

          assignmentData.assignedToType = 'group';
          assignmentData.groupId = groupId;
          // DO NOT set studentId for group assignments

          console.log('🎯 Creating GROUP assignment with payload:', assignmentData);
        } else {
          // Individual assignment
          assignmentData.assignedToType = 'student';
          assignmentData.studentId = studentId;
          // DO NOT set groupId for individual assignments

          console.log('🎯 Creating STUDENT assignment with payload:', assignmentData);
        }

        // Create the MentorAssignment using the dynamic assignmentData
        const createdAssignment = await createMentorAssignment(assignmentData);
        console.log('✅ Mentor assignment created successfully:', createdAssignment);

        // Notify the Group: If this was a group assignment, notify all members
        if (updatedInvitation.groupId) {
          console.log('📧 Sending notifications to group members...');

          try {
            const groupId = updatedInvitation.groupId._id
              ? updatedInvitation.groupId._id.toString()
              : updatedInvitation.groupId.toString();

            // Fetch the group to get all members
            const group = await Group.findById(groupId).populate('lead members').exec();

            if (group) {
              const notificationPromises = [];

              // Notify group lead
              if (group.lead) {
                notificationPromises.push(
                  notifyMentorAccepted({
                    recipientId: group.lead._id.toString(),
                    senderId: user._id.toString(),
                    mentorName: user.fullName,
                    projectId: projectId,
                    projectTitle: updatedInvitation.projectTitle || 'Project',
                  }).catch(err => console.error('Failed to notify group lead:', err))
                );
              }

              // Notify all group members
              if (group.members && group.members.length > 0) {
                group.members.forEach((member: any) => {
                  notificationPromises.push(
                    notifyMentorAccepted({
                      recipientId: member._id.toString(),
                      senderId: user._id.toString(),
                      mentorName: user.fullName,
                      projectId: projectId,
                      projectTitle: updatedInvitation.projectTitle || 'Project',
                    }).catch(err => console.error(`Failed to notify member ${member._id}:`, err))
                  );
                });
              }

              // Send all notifications in parallel
              await Promise.all(notificationPromises);
              console.log(`✅ Sent notifications to ${notificationPromises.length} group members`);
            } else {
              console.warn('⚠️ Group not found for notifications:', groupId);
            }
          } catch (notificationError) {
            console.error('❌ Failed to send group notifications:', notificationError);
            // Don't fail the assignment creation if notifications fail
          }
        } else {
          // Notify individual student about acceptance
          try {
            await notifyMentorAccepted({
              recipientId: studentId,
              senderId: user._id.toString(),
              mentorName: user.fullName,
              projectId: projectId,
              projectTitle: updatedInvitation.projectTitle || 'Project',
            });
            console.log('✅ Sent notification to individual student');
          } catch (notifyError) {
            console.error('❌ Failed to send acceptance notification:', notifyError);
          }
        }
      } catch (assignmentError) {
        console.error('❌ Failed to create mentor assignment:', assignmentError);
        console.error('❌ Assignment error details:', {
          message: assignmentError.message,
          stack: assignmentError.stack
        });
        // Don't fail the whole operation if assignment creation fails
        // The invitation was still accepted successfully
      }
    } else {
      // If rejected, update project status
      await Project.findByIdAndUpdate(updatedInvitation.projectId, {
        mentorStatus: 'rejected',
        projectStatus: 'active',
        mentorInvitation: {
          mentorName: user.fullName,
          status: 'rejected',
          timestamp: new Date().toISOString()
        }
      });

      // Notify student about rejection
      try {
        await notifyMentorRejected({
          recipientId: updatedInvitation.studentId._id
            ? updatedInvitation.studentId._id.toString()
            : updatedInvitation.studentId.toString(),
          senderId: user._id.toString(),
          mentorName: user.fullName,
          projectId: updatedInvitation.projectId._id
            ? updatedInvitation.projectId._id.toString()
            : updatedInvitation.projectId.toString(),
          projectTitle: updatedInvitation.projectTitle || 'Project',
          reason: responseMessage
        });
      } catch (notifyError) {
        console.error('❌ Failed to send rejection notification:', notifyError);
      }
    }

    return NextResponse.json({
      message: `Invitation ${status} successfully`,
      invitation: updatedInvitation
    });
  } catch (error) {
    console.error('Respond to invitation API error:', error);
    return NextResponse.json({ error: 'Failed to respond to invitation' }, { status: 500 });
  }
}

// PUT /api/mentor/invitations/[id] - Respond to invitation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user || !['mentor', 'admin', 'super-admin'].includes(user.type)) {
      return NextResponse.json({ error: 'Mentor or Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { status, responseMessage } = body;

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update invitation status
    const updatedInvitation = await updateInvitationStatus(
      params.id,
      status as 'accepted' | 'rejected',
      responseMessage
    );

    if (!updatedInvitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Privacy check: Ensure the invitation belongs to this mentor
    const invitationMentorId = updatedInvitation.mentorId._id
      ? updatedInvitation.mentorId._id.toString()
      : updatedInvitation.mentorId.toString();

    if (invitationMentorId !== user._id.toString()) {
      console.log('❌ Access denied: Invitation mentorId does not match session user');
      console.log('🔍 Invitation mentorId:', invitationMentorId);
      console.log('🔍 Session user ID:', user._id.toString());
      return NextResponse.json({ error: 'Access denied. You can only respond to your own invitations.' }, { status: 403 });
    }

    // If accepted, update project status AND create mentor assignment
    if (status === 'accepted') {
      // Handle both populated object and string cases for projectId
      const projectId = updatedInvitation.projectId._id
        ? updatedInvitation.projectId._id.toString()
        : updatedInvitation.projectId.toString();

      await Project.findByIdAndUpdate(projectId, {
        mentorStatus: 'accepted',
        projectStatus: 'active',
        mentorInvitation: {
          mentorName: user.fullName,
          status: 'accepted',
          timestamp: new Date().toISOString()
        }
      });

      // Create mentor assignment so student can see mentor in their profile
      try {
        console.log('🎯 Creating mentor assignment for accepted invitation (PUT method)');
        console.log('🔍 Updated invitation studentId:', updatedInvitation.studentId);
        console.log('🔍 Updated invitation studentId type:', typeof updatedInvitation.studentId);
        console.log('🔍 Updated invitation groupId:', updatedInvitation.groupId);

        // Handle both populated object and string cases
        const studentId = updatedInvitation.studentId._id
          ? updatedInvitation.studentId._id.toString()
          : updatedInvitation.studentId.toString();

        console.log('🔍 Extracted studentId:', studentId);

        // Check if this is a group invitation or individual invitation
        const isGroupInvitation = updatedInvitation.groupId && updatedInvitation.groupId._id;

        if (isGroupInvitation) {
          console.log('🎯 This is a GROUP invitation - creating group assignment');
          // For group invitations, create group assignment
          const groupId = updatedInvitation.groupId._id
            ? updatedInvitation.groupId._id.toString()
            : updatedInvitation.groupId.toString();

          await createMentorAssignment({
            mentorId: user._id.toString(),
            assignedToType: 'group',
            groupId: groupId,
            assignedBy: user._id.toString()
          });
          console.log('✅ Group mentor assignment created successfully (PUT method)');
        } else {
          console.log('🎯 This is an INDIVIDUAL invitation - creating student assignment');
          // For individual invitations, create student assignment
          await createMentorAssignment({
            mentorId: user._id.toString(),
            assignedToType: 'student',
            studentId: studentId,
            assignedBy: user._id.toString()
          });
          console.log('✅ Student mentor assignment created successfully (PUT method)');
        }
      } catch (assignmentError) {
        console.error('❌ Failed to create mentor assignment (PUT method):', assignmentError);
        // Don't fail the whole operation if assignment creation fails
        // The invitation was still accepted successfully
      }

      // Notify student about acceptance
      try {
        await notifyMentorAccepted({
          recipientId: updatedInvitation.studentId._id
            ? updatedInvitation.studentId._id.toString()
            : updatedInvitation.studentId.toString(),
          senderId: user._id.toString(),
          mentorName: user.fullName,
          projectId: updatedInvitation.projectId._id
            ? updatedInvitation.projectId._id.toString()
            : updatedInvitation.projectId.toString(),
          projectTitle: updatedInvitation.projectTitle || 'Project',
        });
      } catch (notifyError) {
        console.error('❌ Failed to send acceptance notification (PUT):', notifyError);
      }
    } else {
      // If rejected, update project status
      await Project.findByIdAndUpdate(updatedInvitation.projectId, {
        mentorStatus: 'rejected',
        projectStatus: 'active',
        mentorInvitation: {
          mentorName: user.fullName,
          status: 'rejected',
          timestamp: new Date().toISOString()
        }
      });

      // Notify student about rejection
      try {
        await notifyMentorRejected({
          recipientId: updatedInvitation.studentId._id
            ? updatedInvitation.studentId._id.toString()
            : updatedInvitation.studentId.toString(),
          senderId: user._id.toString(),
          mentorName: user.fullName,
          projectId: updatedInvitation.projectId._id
            ? updatedInvitation.projectId._id.toString()
            : updatedInvitation.projectId.toString(),
          projectTitle: updatedInvitation.projectTitle || 'Project',
          reason: responseMessage
        });
      } catch (notifyError) {
        console.error('❌ Failed to send rejection notification (PUT):', notifyError);
      }
    }

    return NextResponse.json({
      message: `Invitation ${status} successfully`,
      invitation: updatedInvitation
    });
  } catch (error) {
    console.error('Respond to invitation API error:', error);
    return NextResponse.json({ error: 'Failed to respond to invitation' }, { status: 500 });
  }
}

// DELETE /api/mentor/invitations - Delete an invitation
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).exec();
    if (!user || !['mentor', 'admin', 'super-admin'].includes(user.type)) {
      return NextResponse.json({ error: 'Mentor or Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    console.log('🗑️ Attempting to delete invitation:', invitationId);

    // Find the invitation first to verify ownership
    const invitation = await MentorInvitation.findById(invitationId);

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Privacy check: Ensure invitation belongs to this mentor
    if (invitation.mentorId !== user._id.toString()) {
      return NextResponse.json({ error: 'Access denied. You can only delete your own invitations.' }, { status: 403 });
    }

    // Only allow deletion of accepted or rejected invitations
    if (invitation.status === 'pending') {
      return NextResponse.json({ error: 'Cannot delete pending invitations. Please accept or reject first.' }, { status: 400 });
    }

    // Delete the invitation
    await MentorInvitation.findByIdAndDelete(invitationId);

    console.log('✅ Invitation deleted successfully:', invitationId);

    return NextResponse.json({
      message: 'Invitation deleted successfully'
    });
  } catch (error) {
    console.error('Delete invitation API error:', error);
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
  }
}
