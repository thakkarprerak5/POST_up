// app/api/student/mentor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import mongoose from 'mongoose';
import User from '@/models/User';
import MentorAssignment, { IMentorAssignment } from '@/models/MentorAssignment';

// GET /api/student/mentor - Get mentors for current student or specific student
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const targetStudentId = searchParams.get('studentId');

    let studentId: string;

    if (targetStudentId) {
      // Public view: fetch mentor data for specific student
      console.log('🔍 API: Public view for studentId:', targetStudentId);
      console.log('🔍 API: Student ID type:', typeof targetStudentId, 'length:', targetStudentId?.length);
      studentId = targetStudentId;
      
      // Validate that student exists
      const student = await User.findById(studentId).select('_id fullName type').exec();
      if (!student) {
        console.log('❌ API: Student not found:', studentId);
        return NextResponse.json({ 
          error: 'Student not found', 
          hasMentor: false,
          mentors: []
        }, { status: 200 }); // Return 200 with empty data instead of 404
      }
      
      if (student.type !== 'student') {
        console.log('❌ API: User is not a student:', student.type);
        return NextResponse.json({ 
          error: 'User is not a student', 
          hasMentor: false,
          mentors: []
        }, { status: 200 }); // Return 200 with empty data instead of 400
      }
    } else {
      // Owner view: get current user session
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 });
      }

      // Find current user from database
      const currentUser = await User.findOne({ email: session.user.email }).exec();
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Verify user is a student (only for owner view)
      if (currentUser.type !== 'student') {
        return NextResponse.json({ error: 'Access denied - Not a student' }, { status: 403 });
      }

      studentId = currentUser._id.toString();
    }

    // Get mentors assigned to this student
    console.log('🔍 API: Getting mentors for studentId:', studentId);
    
    // Declare mentorAssignments outside the try block to avoid scoping issues
    let mentorAssignments: any[] = [];
    
    try {
      // Get assignments without populate first
      const assignments = await MentorAssignment.find({ studentId })
        .sort({ createdAt: -1 })
        .exec();
      
      console.log('🔍 API: Raw assignments found:', assignments.length);
      for (const assignment of assignments) {
        console.log('🔍 API: Processing assignment:', assignment._id);
        
        // Get mentor user
        const mentorUser = await User.findById(assignment.mentorId).select('fullName email photo').exec();
        
        // Get assignedBy user - handle both ObjectId and string cases
        let assignedByUser;
        if (assignment.assignedBy) {
          // Check if assignedBy is a valid ObjectId (24 character hex string)
          if (assignment.assignedBy.length === 24 && /^[0-9a-fA-F]+$/.test(assignment.assignedBy)) {
            assignedByUser = await User.findById(assignment.assignedBy).select('fullName').exec();
          } else {
            // If it's not a valid ObjectId, try to find by email or username
            console.log('⚠️ API: assignedBy is not a valid ObjectId, trying to find by email/username:', assignment.assignedBy);
            assignedByUser = await User.findOne({ 
              $or: [
                { email: assignment.assignedBy },
                { fullName: assignment.assignedBy }
              ]
            }).select('fullName').exec();
          }
        }
        
        if (mentorUser) {
          // Get assignedBy user - handle both ObjectId and string cases
          let assignedByName = 'System';
          if (assignment.assignedBy) {
            // Check if assignedBy is a valid ObjectId (24 character hex string)
            if (assignment.assignedBy.length === 24 && /^[0-9a-fA-F]+$/.test(assignment.assignedBy)) {
              assignedByUser = await User.findById(assignment.assignedBy).select('fullName').exec();
              if (assignedByUser) {
                assignedByName = assignedByUser.fullName;
              }
            } else {
              // If it's not a valid ObjectId, try to find by email or username
              console.log('⚠️ API: assignedBy is not a valid ObjectId, trying to find by email/username:', assignment.assignedBy);
              assignedByUser = await User.findOne({ 
                $or: [
                  { email: assignment.assignedBy },
                  { fullName: assignment.assignedBy }
                ]
              }).select('fullName').exec();
              if (assignedByUser) {
                assignedByName = assignedByUser.fullName;
              } else {
                // If no user found, use the assignedBy value as is
                assignedByName = assignment.assignedBy;
              }
            }
          }
          
          mentorAssignments.push({
            id: assignment._id,
            mentor: {
              id: assignment.mentorId,
              name: mentorUser.fullName,
              email: mentorUser.email,
              photo: mentorUser.photo
            },
            assignedBy: assignedByName,
            assignedAt: assignment.createdAt
          });
        }
      }
      
      console.log('✅ API: Processed mentor assignments:', mentorAssignments.length);
    } catch (error: any) {
      console.error('❌ API: Error in getMentorsForStudent:', error);
      console.error('❌ API: Error name:', error.name);
      console.error('❌ API: Error message:', error.message);
      console.error('❌ API: Error stack:', error.stack);
      console.error('❌ API: User model available:', !!User);
      return NextResponse.json(
        { error: 'Failed to fetch mentor assignments', hasMentor: false, mentors: [] },
        { status: 500 }
      );
    }

    if (mentorAssignments.length === 0) {
      return NextResponse.json({
        hasMentor: false,
        message: 'No mentors assigned',
        mentors: []
      });
    }

    return NextResponse.json({
      hasMentor: true,
      studentId,
      mentors: mentorAssignments,
      count: mentorAssignments.length
    });

  } catch (error) {
    console.error('Get student mentors API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student mentors' },
      { status: 500 }
    );
  }
}
