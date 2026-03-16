const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function comprehensiveDebug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const studentId = '696a148fc3722c5eb7fa4bbc';
    
    console.log('🔍 Comprehensive Debug: Testing studentId:', studentId);
    
    // Check all assignments
    const allAssignments = await db.collection('mentorassignments').find({}).toArray();
    console.log('📊 All assignments in database:', allAssignments.length);
    
    allAssignments.forEach((assignment, index) => {
      console.log(`  Assignment ${index + 1}:`, {
        id: assignment._id,
        mentorId: assignment.mentorId,
        studentId: assignment.studentId,
        status: assignment.status
      });
    });
    
    // Check for this specific student
    const studentAssignments = await db.collection('mentorassignments').find({
      studentId: studentId
    }).toArray();
    
    console.log(`\n🔍 Assignments for student ${studentId}:`, studentAssignments.length);
    studentAssignments.forEach((assignment, index) => {
      console.log(`  Student Assignment ${index + 1}:`, {
        id: assignment._id,
        mentorId: assignment.mentorId,
        studentId: assignment.studentId,
        status: assignment.status
      });
    });
    
    // Check if the assignment exists
    const assignment = await db.collection('mentorassignments').findOne({
      studentId: studentId,
      status: 'active'
    });
    
    console.log('\n🔍 Single assignment query result:', assignment);
    
    if (assignment) {
      console.log('✅ Assignment found!');
      console.log('🔍 Mentor ID from assignment:', assignment.mentorId);
      
      // Check if mentor exists
      const mentor = await db.collection('users').findOne({
        _id: new ObjectId(assignment.mentorId)
      });
      
      console.log('🔍 Mentor lookup result:', mentor ? {
        _id: mentor._id,
        fullName: mentor.fullName,
        email: mentor.email
      } : 'None');
      
      if (mentor) {
        console.log('✅ Success! API should return mentor data for:', mentor.fullName);
      } else {
        console.log('❌ Mentor not found in database');
      }
    } else {
      console.log('❌ No assignment found for student');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug error:', error);
    process.exit(1);
  }
}

comprehensiveDebug();
