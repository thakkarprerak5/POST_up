const mongoose = require('mongoose');
const { connectDB } = require('./lib/db.js');

async function testMentorAssignment() {
  try {
    await connectDB();
    
    // Get the User and MentorAssignment models
    const User = mongoose.model('User');
    const MentorAssignment = mongoose.model('MentorAssignment');
    
    // Find a student and mentor
    const student = await User.findOne({ type: 'student' }).exec();
    const mentor = await User.findOne({ type: 'mentor' }).exec();
    
    console.log('👤 Student found:', student ? `${student.fullName} (${student.email})` : 'None');
    console.log('🧑‍🏫 Mentor found:', mentor ? `${mentor.fullName} (${mentor.email})` : 'None');
    
    if (student && mentor) {
      // Check for existing assignment
      const existingAssignment = await MentorAssignment.findOne({
        studentId: student._id.toString(),
        status: 'active'
      }).populate('mentorId', 'fullName email').exec();
      
      console.log('🔍 Existing assignment:', existingAssignment ? 'Found' : 'None');
      
      if (existingAssignment) {
        console.log('✅ Assignment details:');
        console.log('  Student:', existingAssignment.studentId);
        console.log('  Mentor:', existingAssignment.mentorId?.fullName);
        console.log('  Status:', existingAssignment.status);
      } else {
        console.log('❌ No active assignment found');
        
        // Create a test assignment
        const testAssignment = new MentorAssignment({
          mentorId: mentor._id.toString(),
          assignedToType: 'student',
          studentId: student._id.toString(),
          assignedBy: mentor._id.toString()
        });
        
        const saved = await testAssignment.save();
        console.log('✅ Test assignment created:', saved._id);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testMentorAssignment();
