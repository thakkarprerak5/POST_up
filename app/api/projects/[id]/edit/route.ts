import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import MentorInvitation from '@/models/MentorInvitation';
import User from '@/models/User';

// PUT /api/projects/[id]/edit - Mentor can edit supervised projects
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();

    await connectDB();

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is mentor of this project (via accepted invitation)
    const mentorInvitation = await MentorInvitation.findOne({
      mentorId: session.user.id,
      projectId: projectId,
      status: 'accepted'
    });

    // Check if user is super admin
    const user = await User.findById(session.user.id);
    const isSuperAdmin = user?.type === 'super-admin';
    const isProjectOwner = project.author?.id === session.user.id;

    // Grant edit access if: mentor of project, super admin, or project owner
    if (!mentorInvitation && !isSuperAdmin && !isProjectOwner) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Allowed fields for mentors to edit
    const allowedFields = ['title', 'description', 'tags', 'images'];
    const isMentor = mentorInvitation && !isProjectOwner && !isSuperAdmin;

    let updateData: any = {};

    if (isMentor) {
      // Mentors can only edit specific fields
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      });
    } else {
      // Super admins and project owners can edit all fields
      updateData = { ...body };
    }

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('author', 'fullName email photo');

    console.log('🔒 Project edit permissions:', {
      projectId,
      userId: session.user.id,
      isMentor,
      isSuperAdmin,
      isProjectOwner,
      allowedFields: isMentor ? allowedFields : 'all'
    });

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: isMentor
        ? 'Project updated successfully (mentor permissions applied)'
        : 'Project updated successfully'
    });

  } catch (error: any) {
    console.error('PUT /api/projects/[id]/edit error:', error);
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
}
