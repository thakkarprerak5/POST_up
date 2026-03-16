const mongoose = require('mongoose');

async function checkMentorAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    // Check mentorassignments collection
    const mentorAssignments = await db.collection('mentorassignments').find({}).toArray();
    console.log('🔍 All mentor assignments:', mentorAssignments.length);
    
    mentorAssignments.forEach((assignment, index) => {
      console.log(`  Assignment ${index + 1}:`, {
        _id: assignment._id,
        mentorId: assignment.mentorId,
        studentId: assignment.studentId,
        status: assignment.status,
        assignedAt: assignment.assignedAt
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMentorAssignments();
