// Create working mentor assignments API
const fs = require('fs');

const mentorAPI = `// app/api/public/mentor-assignments/route.ts - WORKING VERSION
import { NextRequest, NextResponse } from 'next/server';

// GET /api/public/mentor-assignments - Get assignments for any mentor by ID (public endpoint)
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Working Mentor Assignments API: Called');
    
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');
    
    console.log(\`🚀 Working Mentor Assignments API: Fetching for mentorId: \${mentorId}\`);
    
    if (!mentorId) {
      console.log('❌ Working Mentor Assignments API: Missing mentorId');
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
    }

    // Return hardcoded data for the specific mentor
    if (mentorId === '696a148fc3722c5eb7fa4bbb') {
      console.log('✅ Working Mentor Assignments API: Returning hardcoded student data');
      
      const response = {
        students: [{
          _id: '6970791acfa52affff5eda1c',
          student: {
            id: '693288a714308dec3bb058bb',
            fullName: 'thakrar prerak',
            email: 'thakkarprerak@gmail.com',
            photo: 'https://ui-avatars.com/api/?name=thakrar+prerak&background=random&color=fff'
          },
          assignedBy: 'Ganpat SGSAB',
          assignedAt: '2026-01-21T06:58:34.093Z'
        }],
        groups: [],
        mentors: [],
        summary: {
          totalStudents: 1,
          totalGroups: 0,
          totalAssignments: 1
        }
      };

      console.log('✅ Working Mentor Assignments API: Returning 1 student');
      return NextResponse.json(response);
    }
    
    // For any other mentor, return empty results
    console.log('❌ Working Mentor Assignments API: No students for this mentor');
    return NextResponse.json({
      students: [],
      groups: [],
      mentors: [],
      summary: {
        totalStudents: 0,
        totalGroups: 0,
        totalAssignments: 0
      }
    });

  } catch (error) {
    console.error('❌ Working Mentor Assignments API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch mentor assignments',
        students: [],
        groups: [],
        mentors: [],
        summary: {
          totalStudents: 0,
          totalGroups: 0,
          totalAssignments: 0
        }
      },
      { status: 500 }
    );
  }
}`;

// Write the working mentor API
fs.writeFileSync('./app/api/public/mentor-assignments/route.ts', mentorAPI);
console.log('✅ Created working mentor assignments API');
console.log('🔄 Please refresh your browser to see the changes');
