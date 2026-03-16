import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAllAssignmentsForMentor } from '@/models/MentorAssignment';

// GET /api/mentor/[mentorId]/assignments/public - Public read-only API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  const resolvedParams = await params;
  console.log('🌐 Public Mentor Assignments API called for mentorId:', resolvedParams.mentorId);

  try {
    await connectDB();
    console.log('✅ Database connected');

    const mentorId = resolvedParams.mentorId;

    // Verify mentor exists and is actually a mentor
    const mentor = await User.findById(mentorId).select('fullName photo type expertise').exec();

    if (!mentor) {
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }

    if (!['mentor', 'admin', 'super-admin'].includes(mentor.type)) {
      return NextResponse.json(
        { error: 'User is not a mentor' },
        { status: 400 }
      );
    }

    console.log('🎯 Found mentor:', mentor.fullName);

    // Get all assignments directly with deep populate
    // Using direct query to force population of nested fields
    const MentorAssignment = (global as any).MentorAssignment ||
      (await import('@/models/MentorAssignment')).default;

    const rawAssignments = await MentorAssignment.find({
      mentorId: mentorId,
      status: 'active'
    })
      .populate({
        path: 'groupId',
        select: 'name description lead studentIds members',
        populate: [
          { path: 'lead', model: 'User', select: 'fullName email photo type' },
          { path: 'studentIds', model: 'User', select: 'fullName email photo type' },
          { path: 'members', model: 'User', select: 'fullName email photo type' }
        ]
      })
      .populate({
        path: 'studentId',
        model: 'User',
        select: 'fullName email photo'
      })
      .sort({ assignedAt: -1 })
      .lean()
      .exec();

    // Separate into students and groups
    const studentAssignments = rawAssignments.filter((a: any) => a.assignedToType === 'student' && a.studentId);
    const groupAssignments = rawAssignments.filter((a: any) => a.assignedToType === 'group' && a.groupId);

    // Transform data for public consumption - ONLY SAFE FIELDS
    const publicData = {
      mentor: {
        name: mentor.fullName,
        photo: mentor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.fullName)}&background=random&color=fff`,
        expertise: mentor.expertise || []
      },
      assignments: {
        students: studentAssignments.map((assignment: any) => ({
          id: assignment.studentId._id, // Needed for navigation
          name: assignment.studentId.fullName || 'Unknown Student',
          photo: assignment.studentId.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignment.studentId.fullName || 'Student')}&background=random&color=fff`,
          assignedAt: assignment.assignedAt
        })),
        groups: groupAssignments.map((assignment: any) => {
          const group = assignment.groupId;
          const rawMembers = [...(group?.studentIds || []), ...(group?.members || [])];

          return {
            id: group?._id, // Needed for navigation
            name: group?.name || 'Unknown Group',
            description: group?.description,
            assignedAt: assignment.assignedAt,
            // Safe Lead Data (No Email)
            lead: group?.lead ? {
              fullName: group.lead.fullName,
              name: group.lead.fullName,
              photo: group.lead.photo,
              type: group.lead.type
            } : null,
            // Safe Member Data (No Email)
            studentIds: rawMembers.map((m: any) => ({
              fullName: m.fullName,
              name: m.fullName,
              photo: m.photo,
              type: m.type
            }))
          };
        })
      },
      summary: {
        totalStudents: studentAssignments.length,
        totalGroups: groupAssignments.length,
        totalAssignments: studentAssignments.length + groupAssignments.length
      },
      // Public API flag for frontend
      isPublicView: true
    };

    console.log('✅ Public Mentor Assignments API: Data prepared successfully');

    return NextResponse.json({
      success: true,
      data: publicData
    });

  } catch (error) {
    console.error('❌ Error in GET /api/mentor/[mentorId]/assignments/public:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
