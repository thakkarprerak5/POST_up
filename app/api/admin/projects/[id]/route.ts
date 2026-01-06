import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
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

// GET /api/admin/projects/[id] - Get single project details
export async function GET(
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

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Get project API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/projects/[id]/permanent - Permanent delete (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminInfo = getAdminInfo(request);
    
    if (!isSuperAdmin(adminInfo.userRole)) {
      return NextResponse.json(
        { error: 'Only super admin can permanently delete projects' },
        { status: 403 }
      );
    }

    await connectDB();

    const project = await Project.findById(params.id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Permanent delete
    await Project.findByIdAndDelete(params.id);

    // Log activity
    await createActivityLog({
      adminId: adminInfo.userId,
      adminName: adminInfo.userEmail,
      adminEmail: adminInfo.userEmail,
      action: 'permanent_delete_project',
      actionType: 'delete',
      targetType: 'project',
      targetId: params.id,
      targetName: project.title,
      description: `Permanently deleted project: ${project.title}`,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      message: 'Project permanently deleted successfully'
    });
  } catch (error) {
    console.error('Permanent delete project API error:', error);
    return NextResponse.json(
      { error: 'Failed to permanently delete project' },
      { status: 500 }
    );
  }
}
