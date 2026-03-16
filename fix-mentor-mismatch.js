const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function fixMentorMismatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check all users
    const users = await db.collection('users').find({}).toArray();
    console.log('👥 All users:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.fullName} (${user.email}) - ID: ${user._id} - Type: ${user.type}`);
    });
    
    // Find current mentor (ganpat)
    const currentMentor = await db.collection('users').findOne({ 
      email: 'sgsab@gmail.com' 
    });
    
    console.log('\n🧑‍🏫 Current mentor from profile:', currentMentor ? `${currentMentor.fullName} (${currentMentor._id})` : 'None');
    
    // Update assignment with correct mentor ID
    if (currentMentor) {
      const result = await db.collection('mentorassignments').updateOne(
        { _id: new ObjectId('6970791acfa52affff5eda1c') },
        { $set: { mentorId: currentMentor._id.toString() } }
      );
      
      console.log('✅ Updated assignment mentor ID:', result);
      
      // Verify update
      const updated = await db.collection('mentorassignments').findOne({
        _id: new ObjectId('6970791acfa52affff5eda1c')
      });
      
      console.log('🔍 Updated assignment:', {
        mentorId: updated.mentorId,
        studentId: updated.studentId,
        status: updated.status
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMentorMismatch();
