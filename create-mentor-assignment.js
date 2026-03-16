const mongoose = require('mongoose');

// Direct MongoDB connection
async function createAssignment() {
  try {
    // Connect to MongoDB directly
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Find the student and mentor
    const student = await db.collection('users').findOne({ 
      email: 'thakkarprerak5@gmail.com' 
    });
    
    const mentor = await db.collection('users').findOne({ 
      email: 'sgsab@gmail.com' 
    });
    
    console.log('👤 Student found:', student ? `${student.fullName} (${student._id})` : 'None');
    console.log('🧑‍🏫 Mentor found:', mentor ? `${mentor.fullName} (${mentor._id})` : 'None');
    
    if (!student || !mentor) {
      console.log('❌ Student or mentor not found');
      process.exit(1);
    }
    
    // Check for existing assignment
    const existingAssignment = await db.collection('mentorassignments').findOne({
      studentId: student._id.toString(),
      status: 'active'
    });
    
    if (existingAssignment) {
      console.log('✅ Assignment already exists:', existingAssignment._id);
      console.log('🔍 Assignment details:');
      console.log('  Mentor:', mentor.fullName);
      console.log('  Student:', student.fullName);
      console.log('  Status:', existingAssignment.status);
    } else {
      // Create new assignment
      const newAssignment = {
        mentorId: mentor._id.toString(),
        assignedToType: 'student',
        studentId: student._id.toString(),
        assignedBy: mentor._id.toString(),
        assignedAt: new Date(),
        status: 'active'
      };
      
      const result = await db.collection('mentorassignments').insertOne(newAssignment);
      console.log('✅ Created new assignment:', result.insertedId);
      console.log('🔍 Assignment details:');
      console.log('  Mentor:', mentor.fullName);
      console.log('  Student:', student.fullName);
      console.log('  Status: active');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAssignment();
