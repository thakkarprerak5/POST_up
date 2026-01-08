const mongoose = require('mongoose');

async function checkUsers() {
  try {
    console.log('👥 Checking Users in Database\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    console.log('✅ Connected to database');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Check all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users in database`);
    
    if (users.length === 0) {
      console.log('❌ No users found! You need to create a user account first.');
      console.log('💡 Go to http://localhost:3000/signup to create an account');
      console.log('💡 Or go to http://localhost:3000/login if you already have one');
    } else {
      console.log('\n📋 Available Users:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.fullName} (${user.email})`);
        console.log(`      ID: ${user._id}`);
        console.log(`      Type: ${user.type}`);
        console.log(`      Active: ${user.isActive ? '✅' : '❌'}`);
      });
      
      console.log('\n🔑 To test upload functionality:');
      console.log('   1. Go to http://localhost:3000/login');
      console.log('   2. Login with one of the above accounts');
      console.log('   3. Then try uploading a project');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
