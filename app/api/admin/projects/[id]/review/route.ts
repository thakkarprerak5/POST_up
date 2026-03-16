import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import Group from '@/models/Group';
import { createMentorAssignment } from '@/models/MentorAssignment';
import mongoose from 'mongoose';

// POST /api/admin/projects/[id]/review - Admin project review and approval
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await User.findOne({ email: session.user.email }).exec();
    if (!currentUser || (currentUser.type !== 'admin' && currentUser.type !== 'super-admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const projectId = params.id;
    const body = await request.json();
    const { action, reason, mentorId } = body; // action: 'approve' | 'reject', optional mentorId for direct assignment

    // Validate required fields
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        error: 'Invalid action. Must be approve or reject'
      }, { status: 400 });
    }

    // Find the project
    const project = await Project.findById(projectId).populate('author').exec();
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if project is in PENDING_APPROVAL status
    if (project.projectStatus !== 'PENDING') {
      return NextResponse.json({
        error: 'Project is not in pending status'
      }, { status: 400 });
    }

    console.log(`🔍 Admin ${currentUser.fullName} performing ${action} on project: ${project.title}`);

    // Start a database transaction for atomic updates
    const session_db = await mongoose.startSession();
    session_db.startTransaction();

    try {
      if (action === 'reject') {
        // REJECT PROJECT
        project.projectStatus = 'REJECTED';
        project.rejectedAt = new Date();
        project.rejectedBy = currentUser._id.toString();
        project.rejectionReason = reason || 'Project rejected by admin';

        await project.save({ session: session_db });

        console.log('✅ Project rejected successfully');

        await session_db.commitTransaction();

        return NextResponse.json({
          success: true,
          message: 'Project rejected successfully',
          project: {
            id: project._id,
            title: project.title,
            status: project.projectStatus,
            rejectionReason: project.rejectionReason
          }
        });

      } else if (action === 'approve') {
        // APPROVE PROJECT
        project.projectStatus = 'APPROVED';
        project.approvedAt = new Date();
        project.approvedBy = currentUser._id.toString();

        console.log('✅ Project approved successfully');

        // Send notifications via NotificationService
        const { sendNotification, sendGroupNotification, notifyMentorAssignment } = await import('@/lib/services/NotificationService');

        // Notify project author
        await sendNotification({
          recipientId: project.author._id.toString(),
          senderId: currentUser._id.toString(),
          type: 'PROJECT_APPROVED',
          priority: 'HIGH',
          metadata: {
            projectId: project._id.toString(),
            projectTitle: project.title,
            actionUrl: `/projects/${project._id}`,
            targetType: 'project',
            targetId: project._id.toString()
          }
        });

        // If it's a group project, notify all group members
        if (project.registrationType === 'group' && project.groupId) {
          await sendGroupNotification({
            groupId: project.groupId.toString(),
            senderId: currentUser._id.toString(),
            type: 'PROJECT_APPROVED',
            priority: 'HIGH',
            metadata: {
              projectId: project._id.toString(),
              projectTitle: project.title,
              actionUrl: `/projects/${project._id}`,
              targetType: 'project',
              targetId: project._id.toString()
            }
          });
        }

        // If admin provided a mentorId, create direct mentor assignment
        if (mentorId) {
          console.log('🔍 Admin assigning mentor directly:', mentorId);

          // Validate the mentor exists and is actually a mentor
          const mentor = await User.findById(mentorId).session(session_db).exec();
          if (!mentor || mentor.type !== 'mentor') {
            await session_db.abortTransaction();
            return NextResponse.json({
              error: 'Invalid mentor ID or user is not a mentor'
            }, { status: 400 });
          }

          // Create mentor assignment based on project type
          const assignmentData: any = {
            mentorId: mentorId,
            assignedBy: currentUser._id.toString(),
            status: 'active',
            projectId: project._id.toString()
          };

          if (project.registrationType === 'group' && project.groupId) {
            // Group assignment
            assignmentData.assignedToType = 'group';
            assignmentData.groupId = project.groupId;
            console.log('👥 Creating group mentor assignment');
          } else {
            // Individual assignment
            assignmentData.assignedToType = 'student';
            assignmentData.studentId = project.author._id.toString();
            console.log('👤 Creating individual mentor assignment');
          }

          const assignment = await createMentorAssignment(assignmentData);
          console.log('✅ Mentor assignment created:', assignment._id);

          // Update project with assigned mentor
          project.mentorId = mentorId;
          project.mentorStatus = 'assigned';
          await project.save({ session: session_db });

          // Notify about mentor assignment
          await notifyMentorAssignment(
            mentorId,
            mentor.fullName,
            currentUser._id.toString(),
            project._id.toString(),
            project.title,
            project.registrationType === 'group',
            project.groupId?.toString(),
            project.author._id.toString()
          );
        }

        await session_db.commitTransaction();

        return NextResponse.json({
          success: true,
          message: 'Project approved successfully',
          project: {
            id: project._id,
            title: project.title,
            status: project.projectStatus,
            approvedAt: project.approvedAt,
            mentorAssigned: !!mentorId
          },
          notificationsSent: notificationPromises.length
        });
      }

    } catch (error) {
      await session_db.abortTransaction();
      throw error;
    }

  } catch (error: any) {
    console.error('❌ Error in admin project review:', error);
    return NextResponse.json(
      { error: 'Failed to review project', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/projects/[id]/review - Get project details for review
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await User.findOne({ email: session.user.email }).exec();
    if (!currentUser || (currentUser.type !== 'admin' && currentUser.type !== 'super-admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const projectId = params.id;

    // Find the project with populated data
    const project = await Project.findById(projectId)
      .populate('author', 'fullName email photo')
      .exec();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // If it's a group project, fetch group details
    let groupDetails = null;
    if (project.registrationType === 'group' && project.groupId) {
      groupDetails = await Group.findById(project.groupId)
        .populate('studentIds', 'fullName email photo')
        .populate('lead', 'fullName email photo')
        .exec();
    }

    return NextResponse.json({
      project: {
        id: project._id,
        title: project.title,
        description: project.description,
        tags: project.tags,
        images: project.images,
        proposalFile: project.proposalFile,
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl,
        registrationType: project.registrationType,
        projectStatus: project.projectStatus,
        createdAt: project.createdAt,
        author: project.author,
        mentorStatus: project.mentorStatus,
        mentorId: project.mentorId,
        group: groupDetails ? {
          id: groupDetails._id,
          name: groupDetails.name,
          description: groupDetails.description,
          lead: groupDetails.lead,
          studentIds: groupDetails.studentIds,
          memberCount: groupDetails.studentIds?.length || 0
        } : null
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching project for review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project', details: error.message },
      { status: 500 }
    );
  }
}
