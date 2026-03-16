// app/api/mentor/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findAssignmentsByMentor } from '@/models/MentorAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import User from '@/models/User';

// GET /api/mentor/students - Get students assigned to current mentor
export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }

    // Find the current user from database
    const currentUser = await User.findOne({ email: session.user.email }).exec();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is a mentor or admin
    if (!['mentor', 'admin', 'super-admin'].includes(currentUser.type)) {
      return NextResponse.json({ error: 'Access denied - Not a mentor or admin' }, { status: 403 });
    }

    const userId = currentUser._id.toString();
    console.log('🔍 Fetching students for mentor:', currentUser.fullName, 'ID:', userId);

    // Get all assignments for this mentor
    const assignments = await findAssignmentsByMentor(userId);

    // Group students by assignment type
    const groupAssignments = assignments.filter((a: any) => a.groupId);
    const directAssignments = assignments.filter((a: any) => a.studentId && !a.groupId);

    // Group assignments by group
    const groupMap = new Map();
    groupAssignments.forEach((assignment: any) => {
      const groupId = assignment.groupId?._id.toString();
      if (groupId) {
        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, {
            id: groupId,
            name: assignment.groupId.name,
            students: []
          });
        }
        groupMap.get(groupId).students.push({
          id: assignment.studentId._id.toString(),
          name: assignment.studentId.fullName,
          email: assignment.studentId.email,
          photo: assignment.studentId.photo
        });
      }
    });

    // Direct assignments
    const directStudents = directAssignments.map((assignment: any) => ({
      id: assignment.studentId._id.toString(),
      name: assignment.studentId.fullName,
      email: assignment.studentId.email,
      photo: assignment.studentId.photo
    }));

    return NextResponse.json({
      groups: Array.from(groupMap.values()),
      directStudents,
      totalStudents: assignments.length
    });

  } catch (error) {
    console.error('Error fetching mentor students:', error);
    return NextResponse.json({ error: 'Failed to fetch assigned students' }, { status: 500 });
  }
}
