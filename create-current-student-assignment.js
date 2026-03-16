const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function createCurrentStudentAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Current logged-in student ID (from server logs)
    const currentStudentId = '693288a714308dec3bb058bb';
    const mentorId = '696a148fc3722c5eb7fa4bbb'; // Ganpat SGSAB
    
    console.log('🔍 Creating assignment for current student:', currentStudentId);
    console.log('🔍 Mentor ID:', mentorId);
    
    // Check if assignment already exists
    const existingAssignment = await db.collection('mentorassignments').findOne({
      studentId: currentStudentId,
      status: 'active'
    });
    
    if (existingAssignment) {
      console.log('✅ Assignment already exists for current student');
      console.log('🔍 Existing assignment:', {
        mentorId: existingAssignment.mentorId,
        studentId: existingAssignment.studentId,
        status: existingAssignment.status
      });
    } else {
      // Create new assignment for current student
      const newAssignment = {
        mentorId: mentorId,
        assignedToType: 'student',
        studentId: currentStudentId,
        assignedBy: mentorId,
        assignedAt: new Date(),
        status: 'active'
      };
      
      const result = await db.collection('mentorassignments').insertOne(newAssignment);
      console.log('✅ Created new assignment for current student:', result.insertedId);
    }
    
    // Verify all assignments
    const allAssignments = await db.collection('mentorassignments').find({}).toArray();
    console.log('📊 All assignments after update:', allAssignments.length);
    
    allAssignments.forEach((assignment, index) => {
      console.log(`  Assignment ${index + 1}:`, {
        mentorId: assignment.mentorId,
        studentId: assignment.studentId,
        status: assignment.status
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createCurrentStudentAssignment();
