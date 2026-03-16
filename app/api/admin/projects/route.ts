import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User'; // For population if needed
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import Group from '@/models/Group';

async function checkAdmin(req: NextRequest) {
    const token = await getToken({ req: req as any });
    if (!token) return false;
    const user = token as any;
    return user.type === 'admin' || user.type === 'super-admin' ||
        user.role === 'admin' || user.role === 'super-admin';
}

export async function GET(req: NextRequest) {
    try {
        if (!await checkAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        // Populate author if possible, assuming 'author' field refers to User
        const projects = await Project.find({})
            .sort({ createdAt: -1 })
            .populate('author', 'name email image');

        return NextResponse.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

// PUT /api/admin/projects - Update project status (for bulk operations)
export async function PUT(req: NextRequest) {
    try {
        if (!await checkAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        const { projectIds, action, reason } = body;

        if (!projectIds || !Array.isArray(projectIds) || !action) {
            return NextResponse.json({ 
                error: 'Missing required fields: projectIds (array), action' 
            }, { status: 400 });
        }

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ 
                error: 'Invalid action. Must be approve or reject' 
            }, { status: 400 });
        }

        const session = await getToken({ req: req as any });
        const adminId = session?.sub;

        const updateData: any = {};
        if (action === 'approve') {
            updateData.projectStatus = 'APPROVED';
            updateData.approvedAt = new Date();
            updateData.approvedBy = adminId;
        } else if (action === 'reject') {
            updateData.projectStatus = 'REJECTED';
            updateData.rejectedAt = new Date();
            updateData.rejectedBy = adminId;
            updateData.rejectionReason = reason || 'Project rejected by admin';
        }

        const result = await Project.updateMany(
            { 
                _id: { $in: projectIds },
                projectStatus: 'PENDING' // Only update pending projects
            },
            updateData
        );

        console.log(`✅ Bulk ${action} completed: ${result.modifiedCount} projects updated`);

        return NextResponse.json({
            success: true,
            message: `Successfully ${action}d ${result.modifiedCount} projects`,
            updatedCount: result.modifiedCount,
            requestedCount: projectIds.length
        });

    } catch (error: any) {
        console.error('Error in bulk project update:', error);
        return NextResponse.json(
            { error: 'Failed to update projects', details: error.message },
            { status: 500 }
        );
    }
}
