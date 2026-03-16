const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    
    console.log('👥 All users in database:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user._id}, Name: ${user.fullName}, Email: ${user.email}, Type: ${user.type}`);
    });
    
    // Look for the specific mentor ID from assignment
    const mentorId = '6932becc696e13382a825371';
    const mentor = users.find(user => user._id.toString() === mentorId);
    
    console.log(`\n🔍 Looking for mentor with ID: ${mentorId}`);
    console.log(`🔍 Mentor found: ${mentor ? `${mentor.fullName} (${mentor.email})` : 'None'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();
