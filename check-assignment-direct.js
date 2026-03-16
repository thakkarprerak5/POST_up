const mongoose = require('mongoose');

async function checkAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check all assignments
    const assignments = await db.collection('mentorassignments').find({}).toArray();
    console.log('📊 All assignments:', assignments.length);
    
    assignments.forEach((assignment, index) => {
      console.log(`Assignment ${index + 1}:`, {
        _id: assignment._id,
        mentorId: assignment.mentorId,
        studentId: assignment.studentId,
        status: assignment.status,
        assignedAt: assignment.assignedAt
      });
    });
    
    // Check specific student
    const studentId = '696a148fc3722c5eb7fa4bbc';
    const studentAssignment = await db.collection('mentorassignments').findOne({
      studentId: studentId,
      status: 'active'
    });
    
    console.log('\n🔍 Student assignment for', studentId, ':', studentAssignment ? 'Found' : 'None');
    if (studentAssignment) {
      console.log('Details:', studentAssignment);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAssignment();
