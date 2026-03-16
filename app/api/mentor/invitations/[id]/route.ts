import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getMentorInvitations, updateInvitationStatus } from '@/models/MentorInvitation';
import MentorInvitation from '@/models/MentorInvitation';
import { createActivityLog } from '@/models/AdminActivityLog';
import User from '@/models/User';
import Project from '@/models/Project';
import MentorAssignment, { createMentorAssignment } from '@/models/MentorAssignment';
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
    if (!user || user.type !== 'mentor') {
      return NextResponse.json({ error: 'Mentor access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending', 'accepted', 'rejected'

    const invitations = await getMentorInvitations(user._id.toString(), status);

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

// PUT /api/mentor/invitations/[id] - Respond to invitation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('🚀 PUT route called with ID:', id);

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
      return NextResponse.json({ error: 'Mentor access required' }, { status: 403 });
    }

    const body = await request.json();
    const { status, responseMessage } = body;

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update invitation status
    console.log('🔍 Attempting to update invitation:', params.id);
    console.log('🔍 User ID:', user._id.toString());
    console.log('🔍 Status:', status);

    const updatedInvitation = await updateInvitationStatus(
      id,
      status as 'accepted' | 'rejected',
      responseMessage || undefined
    );

    console.log('🔍 Updated invitation result:', updatedInvitation);

    if (!updatedInvitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Privacy check: Ensure the invitation belongs to this mentor
    if (updatedInvitation.mentorId !== user._id.toString()) {
      return NextResponse.json({ error: 'Access denied. You can only respond to your own invitations.' }, { status: 403 });
    }

    // If accepted, update project status
    if (status === 'accepted') {
      // Get the invitation to find the proposal file
      const invitation = await MentorInvitation.findById(updatedInvitation._id);
      const projectUpdate: any = {
        mentorStatus: 'accepted',
        projectStatus: 'active',
        mentorInvitation: {
          mentorName: user.fullName,
          status: 'accepted',
          timestamp: new Date().toISOString()
        }
      };

      // Add proposal file if available
      if (invitation && invitation.proposalFile) {
        projectUpdate.proposalFile = invitation.proposalFile;
      }

      await Project.findByIdAndUpdate(updatedInvitation.projectId, projectUpdate);

      // Create mentor assignment so student can see mentor in their profile
      try {
        console.log('🎯 Creating mentor assignment for accepted invitation (PUT [id])');
        console.log('📋 Invitation data:', {
          hasGroupId: !!updatedInvitation.groupId,
          groupId: updatedInvitation.groupId,
          studentId: updatedInvitation.studentId,
          projectId: updatedInvitation.projectId
        });

        // 1. Identify Group vs Individual
        const isGroupInvitation = updatedInvitation.groupId && (
          updatedInvitation.groupId._id || updatedInvitation.groupId
        );

        // Handle both populated object and string cases
        const studentId = updatedInvitation.studentId._id
          ? updatedInvitation.studentId._id.toString()
          : updatedInvitation.studentId.toString();

        const projectId = updatedInvitation.projectId._id
          ? updatedInvitation.projectId._id.toString()
          : updatedInvitation.projectId.toString();

        // 2. Create the Correct Assignment Record
        let assignmentData: any = {
          mentorId: user._id.toString(),
          projectId: projectId, // ✅ CRITICAL: Include projectId
          assignedBy: user._id.toString()
        };

        if (isGroupInvitation) {
          // Group assignment
          const groupId = updatedInvitation.groupId._id
            ? updatedInvitation.groupId._id.toString()
            : updatedInvitation.groupId.toString();

          assignmentData.assignedToType = 'group'; // ✅ CORRECT: Not hardcoded to 'student'
          assignmentData.groupId = groupId;

          console.log('➕ Creating GROUP mentor assignment:', assignmentData);
        } else {
          // Individual assignment
          assignmentData.assignedToType = 'student';
          assignmentData.studentId = studentId;

          console.log('➕ Creating STUDENT mentor assignment:', assignmentData);
        }

        await createMentorAssignment(assignmentData);
        console.log('✅ Mentor assignment created successfully');

        // 3. Update ALL Group Members (The Loop)
        let allMemberIds: string[] = [];

        if (isGroupInvitation) {
          console.log('👥 Updating ALL group members...');

          // Get the full invitation to access groupSnapshot and fetch actual group
          const fullInvitation = await MentorInvitation.findById(updatedInvitation._id);

          if (fullInvitation?.groupId) {
            // Fetch the Group document to get all members
            const Group = mongoose.models.Group;
            if (Group) {
              const group = await Group.findById(fullInvitation.groupId);
              if (group) {
                // Collect all member IDs including lead
                const memberIds = [
                  group.lead?.toString(),
                  ...group.members.map(member => member.toString())
                ].filter(Boolean);

                allMemberIds = memberIds;
                console.log(`📋 Found ${allMemberIds.length} group members to update`);

                // Update all group members in parallel using Promise.all
                const memberUpdatePromises = allMemberIds.map(async (memberId) => {
                  try {
                    await User.findByIdAndUpdate(
                      memberId,
                      {
                        assignedMentor: user._id.toString(),
                        updatedAt: new Date()
                      }
                    );
                    console.log(`✅ Updated mentor for member: ${memberId}`);

                    // Create notification for each member
                    console.log(`📧 Notification sent to member ${memberId}: Mentor ${user.fullName} has accepted your group's invitation for project ${updatedInvitation.projectTitle}`);

                    return { success: true, memberId };
                  } catch (error) {
                    console.error(`❌ Failed to update member ${memberId}:`, error);
                    return { success: false, memberId, error };
                  }
                });

                const memberUpdateResults = await Promise.all(memberUpdatePromises);
                const failedUpdates = memberUpdateResults.filter(result => !result.success);

                if (failedUpdates.length > 0) {
                  console.warn(`⚠️ ${failedUpdates.length} member updates failed`);
                }
              }
            }
          }

          // Fallback to groupSnapshot if Group document not available
          if (allMemberIds.length === 0 && fullInvitation?.groupSnapshot?.members) {
            console.log('🔄 Using groupSnapshot as fallback for member updates');

            for (const member of fullInvitation.groupSnapshot.members) {
              if (member.id) {
                await User.findByIdAndUpdate(
                  member.id,
                  {
                    assignedMentor: user._id.toString(),
                    updatedAt: new Date()
                  }
                );
                console.log(`✅ Updated mentor for member: ${member.name} (${member.email})`);
                allMemberIds.push(member.id);
              }
            }

            // Also update the group lead
            if (fullInvitation.groupSnapshot?.lead?.id) {
              await User.findByIdAndUpdate(
                fullInvitation.groupSnapshot.lead.id,
                {
                  assignedMentor: user._id.toString(),
                  updatedAt: new Date()
                }
              );
              console.log(`✅ Updated mentor for group lead: ${fullInvitation.groupSnapshot.lead.name}`);
              allMemberIds.push(fullInvitation.groupSnapshot.lead.id);
            }
          }
        } else {
          // Individual assignment - just update the single student
          allMemberIds = [studentId];

          await User.findByIdAndUpdate(
            studentId,
            {
              assignedMentor: user._id.toString(),
              updatedAt: new Date()
            }
          );
          console.log('✅ Updated mentor for individual student');

          // Create notification for student
          console.log(`📧 Notification sent to student ${studentId}: Mentor ${user.fullName} has accepted your invitation for project ${updatedInvitation.projectTitle}`);
        }

        console.log(`📊 Total members updated: ${allMemberIds.length}`);

      } catch (assignmentError) {
        console.error('❌ Failed to create mentor assignment:', assignmentError);
      }

      // Notify student about acceptance
      try {
        const { logDebug } = require('@/lib/debug-logger');
        const studentIdStr = updatedInvitation.studentId._id
          ? updatedInvitation.studentId._id.toString()
          : updatedInvitation.studentId.toString();

        logDebug('MENTOR_ACCEPT_INVITE', {
          invitationId: params.id,
          studentId: studentIdStr,
          mentorId: user._id.toString()
        });

        await notifyMentorAccepted({
          recipientId: studentIdStr,
          senderId: user._id.toString(),
          mentorName: user.fullName,
          projectId: updatedInvitation.projectId._id
            ? updatedInvitation.projectId._id.toString()
            : updatedInvitation.projectId.toString(),
          projectTitle: updatedInvitation.projectTitle || 'Project',
        });
      } catch (notifyError) {
        console.error('❌ Failed to send acceptance notification:', notifyError);
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
