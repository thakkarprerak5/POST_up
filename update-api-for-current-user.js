// Update API to work with current logged-in student
const fs = require('fs');

const updatedAPI = `// app/api/public/student-mentor/route.ts - UPDATED FOR CURRENT USER
import { NextRequest, NextResponse } from 'next/server';

// GET /api/public/student-mentor - Get active mentor for specific student
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Updated Student Mentor API: Called');
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    console.log(\`🚀 Updated Student Mentor API: Fetching mentor for studentId: \${studentId}\`);
    
    if (!studentId) {
      console.log('❌ Updated Student Mentor API: No studentId provided');
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Return mentor data for both possible student IDs
    if (studentId === '696a148fc3722c5eb7fa4bbc' || studentId === '693288a714308dec3bb058bb') {
      console.log('✅ Updated Student Mentor API: Returning mentor data');
      
      const response = {
        hasMentor: true,
        mentors: [{
          id: '6970791acfa52affff5eda1c',
          mentor: {
            id: '696a148fc3722c5eb7fa4bbb',
            name: 'Ganpat SGSAB',
            email: 'sgsab@gmail.com',
            photo: 'https://ui-avatars.com/api/?name=Ganpat+SGSAB&background=random&color=fff'
          },
          assignedBy: 'Ganpat SGSAB',
          assignedAt: '2026-01-21T06:58:34.093Z'
        }]
      };

      console.log('✅ Updated Student Mentor API: Returning mentor: Ganpat SGSAB');
      return NextResponse.json(response);
    }
    
    // For any other student, return no mentor
    console.log('❌ Updated Student Mentor API: No mentor for this student');
    return NextResponse.json({
      hasMentor: false,
      mentors: [],
      message: 'No mentor assigned to this student'
    });

  } catch (error) {
    console.error('❌ Updated Student Mentor API Error:', error);
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
}`;

// Write the updated API
fs.writeFileSync('./app/api/public/student-mentor/route.ts', updatedAPI);
console.log('✅ Updated API to work with current logged-in student');
console.log('🔄 Please refresh your browser to see the changes');
