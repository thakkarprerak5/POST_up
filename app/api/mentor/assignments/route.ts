import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAllAssignmentsForMentor, removeMentorAssignment } from '@/models/MentorAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import User from '@/models/User';

// GET /api/mentor/assignments - Get students and groups assigned to current mentor
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }

    // Find current user from database
    const currentUser = await User.findOne({ email: session.user.email }).exec();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is a mentor or admin
    if (!['mentor', 'admin', 'super-admin'].includes(currentUser.type)) {
      return NextResponse.json({ error: 'Access denied - Not a mentor or admin' }, { status: 403 });
    }

    const mentorId = currentUser._id.toString();

    // Get all assignments for this mentor
    const assignments = await getAllAssignmentsForMentor(mentorId);

    return NextResponse.json({
      mentorId,
      mentor: {
        id: currentUser._id,
        name: currentUser.fullName,
        email: currentUser.email,
        photo: currentUser.photo
      },
      students: assignments.students.map(assignment => ({
        id: assignment._id,
        student: assignment.studentId,
        assignedBy: assignment.assignedBy,
        assignedAt: assignment.createdAt
      })),
      groups: assignments.groups.map(assignment => ({
        id: assignment._id,
        group: assignment.groupId,
        assignedBy: assignment.assignedBy,
        assignedAt: assignment.createdAt
      })),
      summary: {
        totalStudents: assignments.students.length,
        totalGroups: assignments.groups.length,
        totalAssignments: assignments.students.length + assignments.groups.length
      }
    });

  } catch (error) {
    console.error('Get mentor assignments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentor assignments' },
      { status: 500 }
    );
  }
}

// DELETE /api/mentor/assignments - Remove student or group assignment
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
    }

    // Find current user from database
    const currentUser = await User.findOne({ email: session.user.email }).exec();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is a mentor or admin
    if (!['mentor', 'admin', 'super-admin'].includes(currentUser.type)) {
      return NextResponse.json({ error: 'Access denied - Not a mentor or admin' }, { status: 403 });
    }

    const mentorId = currentUser._id.toString();

    // Parse request body
    const body = await request.json();
    const { studentId, groupId } = body;

    console.log('🗑️ Mentor removing assignment:', { mentorId, studentId, groupId });

    if (!studentId && !groupId) {
      return NextResponse.json({ error: 'Either student ID or group ID is required' }, { status: 400 });
    }

    // Remove the assignment
    const result = await removeMentorAssignment(mentorId, studentId, groupId);

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'No assignment found to remove' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment removed successfully',
      result
    });

  } catch (error) {
    console.error('Remove mentor assignment API error:', error);
    return NextResponse.json(
      { error: 'Failed to remove assignment' },
      { status: 500 }
    );
  }
}
