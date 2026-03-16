const mongoose = require('mongoose');

async function createTestInvitation() {
  try {
    // Connect to MongoDB directly
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/postup');
    const db = mongoose.connection.db;
    
    // Create a test invitation with the exact ID that frontend is trying to update
    const testInvitation = {
      _id: new mongoose.Types.ObjectId('696f5c39d0d7d552dc586a96'),
      mentorId: '6932becc696e13382a825371', // ganpat's mentor ID
      studentId: 'test-student-id',
      projectId: 'test-project-id',
      projectTitle: 'Test Project',
      projectDescription: 'Test Description',
      proposalFile: '/test-proposal.pdf',
      message: 'Test message',
      status: 'pending',
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('🔍 Creating test invitation:', testInvitation);
    
    // Insert the invitation
    const result = await db.collection('mentorinvitations').insertOne(testInvitation);
    console.log('✅ Test invitation created:', result.insertedId);
    
    // Verify it was created
    const verification = await db.collection('mentorinvitations').findOne({ _id: testInvitation._id });
    console.log('🔍 Verification result:', verification);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestInvitation();
