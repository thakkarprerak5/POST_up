import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAllAssignmentsForMentor } from '@/models/MentorAssignment';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

async function checkAdmin(req: NextRequest) {
    const token = await getToken({ req: req as any });
    if (!token) return false;
    const user = token as any;
    return user.type === 'admin' || user.type === 'super-admin' ||
        user.role === 'admin' || user.role === 'super-admin';
}

export async function GET(
    req: NextRequest,
    { params }: { params: { mentorId: string } }
) {
    try {
        if (!await checkAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const mentorId = params.mentorId;
        await connectDB();

        // Get all assignments for this mentor
        const assignments = await getAllAssignmentsForMentor(mentorId);

        // Extract students from assignments
        const students = assignments.students.map((assignment: any) => ({
            id: assignment.studentId._id,
            fullName: assignment.studentId.fullName,
            email: assignment.studentId.email,
            photo: assignment.studentId.photo,
            joinedAt: assignment.assignedAt
        }));

        // Get group details
        const groups = assignments.groups.map((group: any) => ({
            id: group._id,
            name: group.name,
            description: group.description,
            studentCount: group.studentIds.length,
            assignedAt: assignments.updatedAt // Using assignment update time as proxy for assignment time
        }));

        return NextResponse.json({
            students,
            groups,
            totalStudents: students.length,
            totalGroups: groups.length,
            summary: assignments.summary
        });

    } catch (error) {
        console.error('Error fetching mentor students:', error);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}
