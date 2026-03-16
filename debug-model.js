// Test using the same model as the API
const mongoose = require('mongoose');

// Import the same way as the API
async function debugModel() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    // Import models the same way as API
    const { getActiveMentorForStudent } = require('./models/MentorAssignment.ts');
    
    const studentId = '696a148fc3722c5eb7fa4bbc';
    console.log('🔍 Testing getActiveMentorForStudent with:', studentId);
    
    const assignment = await getActiveMentorForStudent(studentId);
    
    console.log('📊 Model query result:', assignment);
    
    // Also try direct query with the model
    const MentorAssignment = mongoose.model('MentorAssignment');
    const directQuery = await MentorAssignment.findOne({ 
      studentId: studentId, 
      status: 'active' 
    })
      .populate('mentorId', 'fullName email photo')
      .exec();
    
    console.log('📊 Direct model query result:', directQuery);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugModel();
