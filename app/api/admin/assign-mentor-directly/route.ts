import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import AdminAssignmentRequest from '@/models/AdminAssignmentRequest';
import Project from '@/models/Project';
import User from '@/models/User';

// POST /api/admin/assign-mentor-directly - Direct mentor assignment without request
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { projectId, mentorId, requestType } = body;

        // Validate required fields
        if (!projectId || !mentorId || !requestType) {
            return NextResponse.json({ 
                error: 'Missing required fields: projectId, mentorId, requestType' 
            }, { status: 400 });
        }

        // Validate requestType
        if (!['INDIVIDUAL', 'GROUP'].includes(requestType)) {
            return NextResponse.json({ 
                error: 'Invalid requestType. Must be INDIVIDUAL or GROUP' 
            }, { status: 400 });
        }

        // Validate project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Validate mentor exists and is actually a mentor
        const mentor = await User.findById(mentorId);
        if (!mentor || mentor.type !== 'mentor') {
            return NextResponse.json({ error: 'Invalid mentor ID' }, { status: 400 });
        }

        // NEW LIFECYCLE: Direct mentor assignment with project activation
        const result = await AdminAssignmentRequest.assignMentorDirectly(
            projectId, 
            mentorId, 
            currentUser._id.toString(),
            requestType
        );

        console.log(`✅ Direct mentor assignment: ${mentor.fullName} assigned to project ${projectId} - Project ACTIVATED`);

        return NextResponse.json({
            success: true,
            message: 'Mentor assigned directly - Project activated',
            project: result,
            mentor: {
                id: mentor._id,
                name: mentor.fullName,
                email: mentor.email
            }
        });

    } catch (error: any) {
        console.error('❌ Error in direct mentor assignment:', error);
        return NextResponse.json(
            { error: 'Failed to assign mentor directly', details: error.message },
            { status: 500 }
        );
    }
}
