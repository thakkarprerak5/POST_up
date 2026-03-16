// app/api/public/student-mentor/route.ts - ENHANCED FOR DATABASE INTEGRATION
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getActiveMentorForStudent } from '@/models/MentorAssignment';
import User from '@/models/User';

// GET /api/public/student-mentor - Get active mentor for specific student
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Enhanced Student Mentor API: Called');
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    console.log(`🚀 Enhanced Student Mentor API: Fetching mentor for studentId: ${studentId}`);
    
    if (!studentId) {
      console.log('❌ Enhanced Student Mentor API: No studentId provided');
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    console.log('✅ Database connected');

    // CRITICAL FIX: Query database for actual mentor assignments
    try {
      const assignment = await getActiveMentorForStudent(studentId);
      console.log('🔍 Mentor assignment found:', assignment);

      if (assignment) {
        // Use the found assignment directly
        
        // Fetch mentor details
        const mentor = await User.findById(assignment.mentorId).select('fullName email photo profile').exec();
        
        if (!mentor) {
          console.log('❌ Mentor not found in database for assignment:', assignment.mentorId);
          return NextResponse.json({
            hasMentor: false,
            mentors: [],
            message: 'Mentor not found in database'
          });
        }

        // Get student details for context
        const student = await User.findById(studentId).select('fullName email').exec();
        
        const response = {
          hasMentor: true,
          mentors: [{
            id: assignment._id.toString(),
            mentor: {
              id: mentor._id.toString(),
              name: mentor.fullName,
              email: mentor.email,
              photo: mentor.photo || '/placeholder-user.jpg',
              type: mentor.type,
              profile: mentor.profile || {}
            },
            student: student ? {
              id: student._id.toString(),
              name: student.fullName,
              email: student.email
            } : undefined,
            assignedBy: assignment.assignedBy || 'System',
            assignedAt: assignment.assignedAt || new Date().toISOString(),
            projectId: assignment.projectId,
            groupId: assignment.groupId,
            status: assignment.status
          }]
        };

        console.log('✅ Enhanced Student Mentor API: Returning real mentor data:', {
          mentorName: mentor.fullName,
          studentName: student?.fullName || 'Unknown'
        });
        
        return NextResponse.json(response);
      }
      
      // No active assignments found
      console.log('❌ Enhanced Student Mentor API: No active mentor assignments found');
      return NextResponse.json({
        hasMentor: false,
        mentors: [],
        message: 'No active mentor assignment found for this student'
      });

    } catch (dbError) {
      console.error('❌ Database error in student-mentor API:', dbError);
      return NextResponse.json({
        hasMentor: false,
        mentors: [],
        error: 'Database error',
        message: 'Failed to fetch mentor information'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Enhanced Student Mentor API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch mentor information',
        hasMentor: false,
        mentors: []
      },
      { status: 500 }
    );
  }
}