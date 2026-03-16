const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function verifyState() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check current assignment
    const assignment = await db.collection('mentorassignments').findOne({
      _id: new ObjectId('6970791acfa52affff5eda1c')
    });
    
    console.log('🔍 Current assignment state:', {
      mentorId: assignment?.mentorId,
      studentId: assignment?.studentId,
      status: assignment?.status
    });
    
    // Check if correct mentor exists
    const correctMentor = await db.collection('users').findOne({
      _id: new ObjectId('696a148fc3722c5eb7fa4bbb')
    });
    
    console.log('🔍 Correct mentor exists:', correctMentor ? {
      _id: correctMentor._id,
      fullName: correctMentor.fullName,
      email: correctMentor.email
    } : 'None');
    
    // Test what the API should return
    if (assignment && correctMentor) {
      console.log('✅ API should return mentor data for:', correctMentor.fullName);
    } else {
      console.log('❌ Missing assignment or mentor data');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyState();
