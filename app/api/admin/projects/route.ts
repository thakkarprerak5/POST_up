import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project, { softDeleteProject, restoreProject } from '@/models/Project';
import { createActivityLog } from '@/models/AdminActivityLog';

// Helper function to get admin info from request headers
const getAdminInfo = (request: NextRequest) => {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');
  const userEmail = request.headers.get('x-user-email');
  
  if (!userId || !userRole || !userEmail) {
    throw new Error('Admin authentication required');
  }
  
  return { userId, userRole, userEmail };
};

// Helper function to check if user is super admin
const isSuperAdmin = (userRole: string) => userRole === 'super_admin';

// GET /api/admin/projects - Get all projects with filters
export async function GET(request: NextRequest) {
  try {
    const adminInfo = getAdminInfo(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'author.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'deleted') {
      query.isDeleted = true;
    } else if (status === 'active') {
      query.isDeleted = { $ne: true };
    }

    const skip = (page - 1) * limit;

    const [projects, totalCount] = await Promise.all([
      Project.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(query)
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/projects/[id] - Soft delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminInfo = getAdminInfo(request);
    await connectDB();

    const project = await Project.findById(params.id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.isDeleted) {
      return NextResponse.json(
        { error: 'Project already deleted' },
        { status: 400 }
      );
    }

    // Soft delete the project
    const deletedProject = await softDeleteProject(params.id, adminInfo.userId);

    // Log activity
    await createActivityLog({
      adminId: adminInfo.userId,
      adminName: adminInfo.userEmail,
      adminEmail: adminInfo.userEmail,
      action: 'delete_project',
      actionType: 'delete',
      targetType: 'project',
      targetId: params.id,
      targetName: project.title,
      description: `Soft deleted project: ${project.title}`,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Project deleted successfully',
      project: deletedProject
    });
  } catch (error) {
    console.error('Delete project API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/projects/[id]/restore - Restore deleted project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminInfo = getAdminInfo(request);
    await connectDB();

    const project = await Project.findById(params.id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.isDeleted) {
      return NextResponse.json(
        { error: 'Project is not deleted' },
        { status: 400 }
      );
    }

    // Restore the project (override the user check for admin)
    const restoredProject = await Project.findByIdAndUpdate(
      params.id,
      {
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined,
        restoreAvailableUntil: undefined
      },
      { new: true }
    );

    // Log activity
    await createActivityLog({
      adminId: adminInfo.userId,
      adminName: adminInfo.userEmail,
      adminEmail: adminInfo.userEmail,
      action: 'restore_project',
      actionType: 'restore',
      targetType: 'project',
      targetId: params.id,
      targetName: project.title,
      description: `Restored deleted project: ${project.title}`,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Project restored successfully',
      project: restoredProject
    });
  } catch (error) {
    console.error('Restore project API error:', error);
    return NextResponse.json(
      { error: 'Failed to restore project' },
      { status: 500 }
    );
  }
}
