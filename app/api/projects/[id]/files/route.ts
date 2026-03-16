import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import MentorInvitation from '@/models/MentorInvitation';
import User from '@/models/User';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// POST /api/projects/[id]/files - Mentor can manage project files
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

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

    // Grant file management access if: mentor of project, super admin, or project owner
    if (!mentorInvitation && !isSuperAdmin && !isProjectOwner) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Handle file upload
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'projects');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory already exists, continue
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${projectId}_${uuidv4()}.${fileExtension}`;
    const filePath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update project with new file
    const fileUrl = `/uploads/projects/${filename}`;
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        $push: { images: fileUrl },
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log('🔒 Project file upload permissions:', {
      projectId,
      userId: session.user.id,
      isMentor: !!mentorInvitation,
      isSuperAdmin,
      isProjectOwner,
      fileName: file.name,
      fileUrl
    });

    return NextResponse.json({
      success: true,
      fileUrl,
      message: 'File uploaded successfully'
    });

  } catch (error: any) {
    console.error('POST /api/projects/[id]/files error:', error);
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/files - Mentor can delete project files
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('🔒 Files API called:', { method: 'DELETE', params });

  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    console.log('🔒 Session check:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userId: session?.user?.id
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).exec();
    console.log('🔒 User lookup result:', {
      found: !!user,
      userType: user?.type,
      userId: user?._id?.toString()
    });

    if (!user || user.type !== 'mentor') {
      return NextResponse.json({ error: 'Mentor access required' }, { status: 403 });
    }

    // Use the already awaited id
    const projectId = id;
    const url = new URL(request.url);
    const fileUrl = url.searchParams.get('fileUrl');

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('🔒 Project found:', {
      id: project._id,
      authorId: project.author?.id,
      mentorId: project.mentorId,
      title: project.title
    });

    // Check if user is mentor of this project (via accepted invitation)
    const mentorInvitation = await MentorInvitation.findOne({
      mentorId: session.user.id,
      projectId: projectId,
      status: 'accepted'
    });

    console.log('🔒 Mentor invitation check:', {
      found: !!mentorInvitation,
      mentorId: mentorInvitation?.mentorId,
      projectId: mentorInvitation?.projectId,
      status: mentorInvitation?.status
    });

    // Check if user is super admin
    const sessionUser = await User.findById(session.user.id);
    const isSuperAdmin = sessionUser?.type === 'super-admin';
    const isProjectOwner = project.author?.id === session.user.id;

    console.log('🔒 Permission check:', {
      isSuperAdmin,
      isProjectOwner,
      mentorInvitation: mentorInvitation?.mentorId,
      sessionUserId: session.user.id,
      projectAuthorId: project.author?.id
    });

    // Grant file deletion access if: mentor of project, super admin, or project owner
    if (!mentorInvitation && !isSuperAdmin && !isProjectOwner) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Remove file from project images array
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        $pull: { images: fileUrl },
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log('🔒 Project file deletion permissions:', {
      projectId,
      userId: session.user.id,
      isMentor: !!mentorInvitation,
      isSuperAdmin,
      isProjectOwner,
      deletedFileUrl: fileUrl
    });

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error: any) {
    console.error('DELETE /api/projects/[id]/files error:', error);
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
}
