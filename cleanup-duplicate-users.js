const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function cleanupDuplicateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/POST_up');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    console.log('👥 All users before cleanup:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user._id}, Name: ${user.fullName}, Email: ${user.email}, Type: ${user.type}`);
    });
    
    // Find and remove duplicate/conflicting users
    const usersToRemove = [];
    
    // Remove the wrong ganpat user (ID: 6932becc696e13382a825371)
    const wrongGanpat = users.find(user => 
      user._id.toString() === '6932becc696e13382a825371' && 
      user.email === 'sgsab@gmail.com' && 
      user.fullName === 'ganpat'
    );
    
    if (wrongGanpat) {
      usersToRemove.push(wrongGanpat._id);
      console.log(`🗑️ Found wrong user to remove: ${wrongGanpat.fullName} (${wrongGanpat.email}) - ID: ${wrongGanpat._id}`);
    }
    
    // Remove any other duplicates with same email
    const emailGroups = {};
    users.forEach(user => {
      if (!emailGroups[user.email]) {
        emailGroups[user.email] = [];
      }
      emailGroups[user.email].push(user);
    });
    
    Object.keys(emailGroups).forEach(email => {
      if (emailGroups[email].length > 1) {
        // Keep the one with correct ID structure, remove others
        const keepUser = emailGroups[email].find(u => 
          u._id.toString().length === 24 && // Keep proper ObjectIds
          /^[0-9a-f]{24}$/.test(u._id.toString())
        );
        
        const duplicatesToRemove = emailGroups[email].filter(u => u._id !== keepUser._id);
        duplicatesToRemove.forEach(duplicate => {
          usersToRemove.push(duplicate._id);
          console.log(`🗑️ Found duplicate user to remove: ${duplicate.fullName} (${duplicate.email}) - ID: ${duplicate._id}`);
        });
      }
    });
    
    // Remove the identified users
    if (usersToRemove.length > 0) {
      console.log(`\n🗑️ Removing ${usersToRemove.length} duplicate/conflicting users...`);
      
      for (const userId of usersToRemove) {
        const result = await db.collection('users').deleteOne({ _id: userId });
        console.log(`  ✅ Removed user with ID: ${userId}`);
      }
      
      // Also remove any assignments associated with removed users
      const assignmentResult = await db.collection('mentorassignments').deleteMany({
        mentorId: { $in: usersToRemove }
      });
      console.log(`  ✅ Removed ${assignmentResult.deletedCount} assignments associated with removed users`);
    }
    
    // Verify final state
    const finalUsers = await db.collection('users').find({}).toArray();
    console.log('\n👥 Final users after cleanup:');
    finalUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user._id}, Name: ${user.fullName}, Email: ${user.email}, Type: ${user.type}`);
    });
    
    // Verify assignments
    const finalAssignments = await db.collection('mentorassignments').find({}).toArray();
    console.log('\n📊 Final assignments:');
    finalAssignments.forEach((assignment, index) => {
      console.log(`  ${index + 1}. Mentor: ${assignment.mentorId}, Student: ${assignment.studentId}, Status: ${assignment.status}`);
    });
    
    console.log('\n✅ Cleanup completed!');
    console.log('🔄 Please refresh your browser to see the changes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupDuplicateUsers();
