import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
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

export async function GET(req: NextRequest) {
    try {
        if (!await checkAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Fetch all mentors only (strict role checking)
        const mentors = await User.find({
            type: 'mentor'
        }).select('-password').sort({ createdAt: -1 });

        // Get assignments for each mentor using the MentorAssignment model
        const mentorsWithAssignments = await Promise.all(
            mentors.map(async (mentor) => {
                try {
                    // Get all assignments for this mentor
                    const assignments = await getAllAssignmentsForMentor(mentor._id.toString());

                    // Extract student data from assignments
                    const assignedStudents = assignments.students.map((assignment: any) => ({
                        studentId: assignment.studentId._id,
                        name: assignment.studentId.fullName,
                        email: assignment.studentId.email,
                        photo: assignment.studentId.photo,
                        joinedAt: assignment.assignedAt
                    }));

                    return {
                        mentorId: mentor._id,
                        name: mentor.fullName,
                        email: mentor.email,
                        profilePhoto: mentor.photo || mentor.image || mentor.avatar,
                        expertiseTags: mentor.profile?.skills || mentor.profile?.expertise || [],
                        availabilityStatus: mentor.availability || 'available',

                        assignedStudentsCount: assignedStudents.length,
                        assignedGroupsCount: assignments.groups.length,

                        assignedStudentsPreview: assignedStudents.slice(0, 3),
                        assignedGroupsPreview: assignments.groups.slice(0, 3)
                    };

                } catch (error) {
                    console.error(`Error resolving assignments for mentor ${mentor._id}:`, error);
                    // Return mentor with zero assignments if resolution fails
                    return {
                        mentorId: mentor._id,
                        name: mentor.fullName,
                        email: mentor.email,
                        profilePhoto: mentor.photo || mentor.image || mentor.avatar,
                        expertiseTags: mentor.profile?.skills || mentor.profile?.expertise || [],
                        availabilityStatus: mentor.availability || 'available',

                        assignedStudentsCount: 0,
                        assignedGroupsCount: 0,

                        assignedStudentsPreview: [],
                        assignedGroupsPreview: []
                    };
                }
            })
        );

        return NextResponse.json(mentorsWithAssignments);
    } catch (error) {
        console.error('Error fetching mentors with assignments:', error);
        return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
    }
}
