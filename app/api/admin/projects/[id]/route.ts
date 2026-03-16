import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

async function checkSuperAdmin(req: NextRequest) {
    const token = await getToken({ req: req as any });
    if (!token) return false;
    const user = token as any;
    return user.type === 'super-admin' || user.role === 'super-admin';
}

// DELETE /api/admin/projects/[id] - Delete a project (super-admin only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check super-admin authorization
        if (!await checkSuperAdmin(req)) {
            return NextResponse.json(
                { error: 'Unauthorized. Super-admin access required.' },
                { status: 401 }
            );
        }

        await connectDB();
        const { id: projectId } = await params;

        if (!projectId) {
            return NextResponse.json(
                { error: 'Project ID is required' },
                { status: 400 }
            );
        }

        // Find and delete the project
        const deletedProject = await Project.findByIdAndDelete(projectId);

        if (!deletedProject) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        console.log(`✅ Project deleted: ${deletedProject.title} (ID: ${projectId})`);

        return NextResponse.json({
            success: true,
            message: 'Project deleted successfully',
            deletedProject: {
                id: deletedProject._id,
                title: deletedProject.title
            }
        });

    } catch (error: any) {
        console.error('Error deleting project:', error);
        return NextResponse.json(
            { error: 'Failed to delete project', details: error.message },
            { status: 500 }
        );
    }
}
