const mongoose = require('mongoose');

async function testInvitations() {
  try {
    // Connect to MongoDB directly
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/postup');
    const db = mongoose.connection.db;
    
    const invitations = await db.collection('mentorinvitations').find({}).toArray();
    console.log('🔍 All invitations in database:');
    invitations.forEach(inv => {
      console.log('  ID:', inv._id, 'MentorID:', inv.mentorId, 'Status:', inv.status);
    });
    
    // Check specific invitation ID
    const targetId = '696f5c39d0d7d552dc586a96';
    const specificInvitation = await db.collection('mentorinvitations').findOne({ _id: new mongoose.Types.ObjectId(targetId) });
    console.log('\n🔍 Looking for invitation ID:', targetId);
    console.log('🔍 Found:', specificInvitation);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testInvitations();
