// Create JavaScript version of the API to avoid TypeScript issues
const fs = require('fs');

const jsAPI = `// app/api/public/student-mentor/route.js - JAVASCRIPT VERSION
const { NextRequest, NextResponse } = require('next/server');
const mongoose = require('mongoose');

// GET /api/public/student-mentor - Get active mentor for specific student
async function GET(request) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('🚀 JS Student Mentor API: Connected to database');
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const t = searchParams.get('t'); // Cache-busting timestamp
    
    console.log(\`🚀 JS Student Mentor API: Fetching mentor for studentId: \${studentId}, t: \${t}\`);
    
    if (!studentId) {
      console.log('❌ JS Student Mentor API: No studentId provided');
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Direct database query - no models, no complexity
    const db = mongoose.connection.db;
    const assignment = await db.collection('mentorassignments').findOne({
      studentId: studentId,
      status: 'active'
    });
    
    console.log('🔍 JS Student Mentor API: Raw assignment result:', assignment);
    
    if (!assignment) {
      console.log('❌ JS Student Mentor API: No active mentor assignment found');
      return NextResponse.json({
        hasMentor: false,
        mentors: [],
        message: 'No mentor assigned to this student'
      });
    }

    // Get mentor data
    const mentorData = await db.collection('users').findOne({
      _id: assignment.mentorId
    });
    
    console.log('🔍 JS Student Mentor API: Mentor data:', mentorData ? {
      _id: mentorData._id,
      fullName: mentorData.fullName,
      email: mentorData.email
    } : 'None');
    
    if (!mentorData) {
      console.log('❌ JS Student Mentor API: Mentor not found');
      return NextResponse.json({
        hasMentor: false,
        mentors: [],
        message: 'Mentor not found'
      });
    }

    // Return clean response structure
    const response = {
      hasMentor: true,
      mentors: [{
        id: assignment._id.toString(),
        mentor: {
          id: mentorData._id.toString(),
          name: mentorData.fullName,
          email: mentorData.email,
          photo: mentorData.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(mentorData.fullName) + '&background=random&color=fff'
        },
        assignedBy: mentorData.fullName || 'System',
        assignedAt: assignment.assignedAt
      }]
    };

    console.log('✅ JS Student Mentor API: Returning clean response');
    console.log(\`🔍 JS Student Mentor API: Mentor: \${response.mentors[0].mentor.name} (\${response.mentors[0].mentor.email})\`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ JS Student Mentor API Error:', error);
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
};

module.exports = { GET };`;

// Write the JavaScript API
fs.writeFileSync('./app/api/public/student-mentor/route.js', jsAPI);
console.log('✅ Created JavaScript student-mentor API');
console.log('🔄 Please restart the server to apply changes');
