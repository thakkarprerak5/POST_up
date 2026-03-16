import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import User from '@/models/User';
import MentorAssignment from '@/models/MentorAssignment';

// GET /api/public/active-mentors - Get active mentors and their assignments (no auth required)
export async function GET() {
  try {
    console.log('🔍 Public Active Mentors API called');
    
    await connectDB();
    console.log('✅ Database connected');

    // Get all mentors only
    const mentors = await User.find({ 
      type: 'mentor'
    })
    .select('_id fullName email photo type createdAt')
    .lean()
    .exec();

    // Get mentor assignments for each mentor
    const mentorsWithAssignments = await Promise.all(
      mentors.map(async (mentor: any) => {
        const assignments = await MentorAssignment.find({
          mentorId: mentor._id.toString(),
          status: 'active'
        })
        .populate('studentId', 'fullName email photo')
        .lean()
        .exec();

        return {
          ...mentor,
          id: mentor._id.toString(),
          registrationDate: mentor.createdAt,
          assignments: assignments.map((assignment: any) => ({
            id: assignment._id.toString(),
            studentId: assignment.studentId?._id?.toString(),
            student: assignment.studentId,
            assignedToType: assignment.assignedToType,
            assignedAt: assignment.assignedAt,
            status: assignment.status
          })),
          totalAssignments: assignments.length,
          activeStudents: assignments.filter((a: any) => a.assignedToType === 'student').length
        };
      })
    );

    console.log(`✅ Found ${mentorsWithAssignments.length} active mentors`);
    return NextResponse.json({ mentors: mentorsWithAssignments });
  } catch (error) {
    console.error('Active Mentors API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to fetch active mentors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
 