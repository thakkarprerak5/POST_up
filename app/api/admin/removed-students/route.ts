import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { connectDB } from '@/lib/db';
import MentorAssignment from '@/models/MentorAssignment';
import User from '@/models/User';
import Project from '@/models/Project';
import Group from '@/models/Group';

// GET /api/admin/removed-students - Fetch removed students and groups
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        console.log('🔍 Fetching removed students...');
        
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and is an admin
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await User.findOne({ email: session.user.email }).exec();

        if (!currentUser || (currentUser.type !== 'admin' && currentUser.type !== 'super-admin')) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const reason = searchParams.get('reason'); // project_completed, report_issue, other
        const type = searchParams.get('type'); // student, group
        const search = searchParams.get('search'); // search by name or project title

        console.log('📊 Query parameters:', { reason, type, search });

        // Build query for removed/completed assignments
        const query: any = {
            status: { $in: ['removed', 'completed'] }
        };

        // Filter by removal reason if specified
        if (reason && ['project_completed', 'report_issue', 'other'].includes(reason)) {
            query.removalReason = reason;
        }

        console.log('🔍 Final query:', query);

        // Fetch mentor assignments with removal data
        const assignments = await MentorAssignment.find(query)
            .populate('mentorId', 'fullName email photo')
            .populate('studentId', 'fullName email photo')
            .populate('groupId', 'name description')
            .populate('projectId', 'title description')
            .populate('assignedBy', 'fullName email')
            .sort({ removedAt: -1, completedAt: -1 })
            .exec();

        console.log('✅ Found assignments:', assignments.length);

        // Filter by type if specified
        let filteredAssignments = assignments;
        if (type && ['student', 'group'].includes(type)) {
            filteredAssignments = assignments.filter(assignment => 
                assignment.assignedToType === type
            );
        }

        // Filter by search if specified
        if (search) {
            const searchLower = search.toLowerCase();
            filteredAssignments = filteredAssignments.filter(assignment => {
                // Search by student/group name
                const targetName = assignment.assignedToType === 'student' 
                    ? assignment.studentId?.fullName?.toLowerCase()
                    : assignment.groupId?.name?.toLowerCase();
                    
                // Search by project title
                const projectTitle = assignment.projectId?.title?.toLowerCase();
                
                // Search by mentor name
                const mentorName = assignment.mentorId?.fullName?.toLowerCase();
                
                return (
                    targetName?.includes(searchLower) ||
                    projectTitle?.includes(searchLower) ||
                    mentorName?.includes(searchLower)
                );
            });
        }

        // Format response data
        const formattedAssignments = filteredAssignments.map(assignment => ({
            _id: assignment._id.toString(),
            assignedToType: assignment.assignedToType,
            studentId: assignment.studentId,
            groupId: assignment.groupId,
            projectId: assignment.projectId,
            mentorId: assignment.mentorId,
            removalReason: assignment.removalReason,
            removalDetails: assignment.removalDetails,
            removedBy: assignment.removedBy,
            removedAt: assignment.removedAt?.toISOString() || assignment.completedAt?.toISOString(),
            reportId: assignment.reportId,
            completedBy: assignment.completedBy,
            completedAt: assignment.completedAt?.toISOString(),
            status: assignment.status
        }));

        // Calculate stats
        const stats = {
            total: formattedAssignments.length,
            project_completed: formattedAssignments.filter(a => a.removalReason === 'project_completed').length,
            report_issue: formattedAssignments.filter(a => a.removalReason === 'report_issue').length,
            other: formattedAssignments.filter(a => a.removalReason === 'other').length,
            students: formattedAssignments.filter(a => a.assignedToType === 'student').length,
            groups: formattedAssignments.filter(a => a.assignedToType === 'group').length
        };

        console.log('📊 Stats:', stats);

        return NextResponse.json({
            success: true,
            assignments: formattedAssignments,
            stats,
            count: formattedAssignments.length
        });

    } catch (error) {
        console.error('❌ Error fetching removed students:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST /api/admin/removed-students - Reassign mentor to removed student/group
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
        const { assignmentId, newMentorId } = body;

        if (!assignmentId || !newMentorId) {
            return NextResponse.json(
                { error: 'Missing required fields: assignmentId and newMentorId' },
                { status: 400 }
            );
        }

        // Find the removed assignment
        const assignment = await MentorAssignment.findById(assignmentId);
        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 }
            );
        }

        // Verify assignment is in removed/completed state
        if (!['removed', 'completed'].includes(assignment.status)) {
            return NextResponse.json(
                { error: 'Assignment is not in a removable state' },
                { status: 400 }
            );
        }

        // Verify new mentor exists and is a mentor
        const newMentor = await User.findById(newMentorId);
        if (!newMentor || newMentor.type !== 'mentor') {
            return NextResponse.json(
                { error: 'Invalid mentor selected' },
                { status: 400 }
            );
        }

        // Create new assignment
        const newAssignment = new MentorAssignment({
            mentorId: newMentorId,
            assignedToType: assignment.assignedToType,
            studentId: assignment.studentId,
            groupId: assignment.groupId,
            projectId: assignment.projectId,
            assignedBy: currentUser._id.toString(),
            assignedAt: new Date(),
            status: 'active'
        });

        await newAssignment.save();

        // Update project if applicable
        if (assignment.projectId) {
            await Project.findByIdAndUpdate(
                assignment.projectId,
                {
                    mentorId: newMentorId,
                    mentorStatus: 'assigned',
                    projectStatus: 'active'
                }
            );
        }

        console.log('✅ New assignment created:', newAssignment._id);

        return NextResponse.json({
            success: true,
            message: 'Mentor reassigned successfully',
            assignment: newAssignment
        });

    } catch (error) {
        console.error('❌ Error reassigning mentor:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
