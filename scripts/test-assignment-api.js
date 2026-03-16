// scripts/test-assignment-api.js
// Test script for mentor assignment API
const mongoose = require('mongoose');

async function testAssignmentAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get sample student and mentor
    const students = await db.collection('users').find({ type: 'student' }).toArray();
    const mentors = await db.collection('users').find({ isActive: true, isBlocked: false }).toArray();

    console.log('📊 Found students:', students.length);
    console.log('📊 Found mentors:', mentors.length);

    if (students.length === 0 || mentors.length === 0) {
      console.log('❌ No students or mentors found for testing');
      return;
    }

    const student = students[0];
    const mentor = mentors.find(m => m.fullName && m.fullName.toLowerCase().includes('ganpat')) || mentors[0];

    console.log('🎯 Using for test:');
    console.log('  Student:', student.fullName, '(ID:', student._id.toString(), ')');
    console.log('  Mentor:', mentor.fullName, '(ID:', mentor._id.toString(), ')');

    // Test assignment API
    console.log('\n📡 Testing assignment API...');
    
    const response = await fetch('http://localhost:3000/api/admin/assign-mentor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer super-admin-token'
      },
      body: JSON.stringify({
        studentId: student._id.toString(),
        mentorId: mentor._id.toString(),
        assignmentType: 'direct',
        groupId: undefined
      })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📡 Response body:', responseText);

    if (response.ok) {
      console.log('✅ Assignment API working!');
      const result = JSON.parse(responseText);
      console.log('✅ Assignment result:', result);
    } else {
      console.log('❌ Assignment API failed');
      console.log('❌ Error:', responseText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAssignmentAPI();
