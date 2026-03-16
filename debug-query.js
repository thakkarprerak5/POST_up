const mongoose = require('mongoose');

async function debugQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const studentId = '696a148fc3722c5eb7fa4bbc';
    
    console.log('🔍 Testing query for studentId:', studentId);
    console.log('🔍 studentId type:', typeof studentId);
    
    // Test the exact same query as API
    const assignment = await db.collection('mentorassignments').findOne({
      studentId: studentId,
      status: 'active'
    });
    
    console.log('🔍 Query result:', assignment);
    
    if (assignment) {
      console.log('🔍 Assignment found, mentorId:', assignment.mentorId);
      console.log('🔍 mentorId type:', typeof assignment.mentorId);
      
      // Test ObjectId conversion
      try {
        const { ObjectId } = mongoose.Types;
        const mentorId = new ObjectId(assignment.mentorId);
        console.log('🔍 ObjectId conversion successful:', mentorId);
        
        // Test mentor lookup
        const mentor = await db.collection('users').findOne({
          _id: mentorId
        });
        
        console.log('🔍 Mentor lookup result:', mentor ? {
          _id: mentor._id,
          fullName: mentor.fullName,
          email: mentor.email
        } : 'Not found');
        
      } catch (error) {
        console.error('❌ ObjectId conversion error:', error);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug error:', error);
    process.exit(1);
  }
}

debugQuery();
