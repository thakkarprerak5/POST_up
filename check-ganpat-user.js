const mongoose = require('mongoose');

async function checkGanpatUser() {
  try {
    console.log('🔍 Checking Ganpat User in Database\n');
    
    await mongoose.connect('mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    
    // Check in users collection directly
    console.log('📋 Step 1: Checking users collection directly');
    const usersCollection = db.collection('users');
    const ganpatUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    
    if (ganpatUser) {
      console.log('✅ Found ganpat user in users collection:');
      console.log(`   Email: ${ganpatUser.email}`);
      console.log(`   Name: ${ganpatUser.fullName}`);
      console.log(`   Photo: ${ganpatUser.photo || 'NOT SET'}`);
      console.log(`   Type: ${ganpatUser.type || 'NOT SET'}`);
      console.log(`   _id: ${ganpatUser._id}`);
      
      // Check if User model can find it
      console.log('\n📋 Step 2: Testing User model');
      try {
        const User = require('@/models/User').default;
        const userModelUser = await User.findOne({ email: 'ganpat@example.com' });
        
        if (userModelUser) {
          console.log('✅ User model found ganpat:');
          console.log(`   Email: ${userModelUser.email}`);
          console.log(`   Name: ${userModelUser.fullName}`);
          console.log(`   Photo: ${userModelUser.photo || 'NOT SET'}`);
        } else {
          console.log('❌ User model could not find ganpat');
          console.log('💡 This suggests a schema mismatch or model issue');
        }
      } catch (error) {
        console.log('❌ Error testing User model:', error.message);
      }
      
    } else {
      console.log('❌ Ganpat user not found in users collection');
      
      // Check all users to see what exists
      console.log('\n📋 Step 3: Checking all users in database');
      const allUsers = await usersCollection.find({}).toArray();
      console.log(`   Found ${allUsers.length} users:`);
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.fullName})`);
      });
    }
    
    await mongoose.disconnect();
    
    console.log('\n🎯 DIAGNOSIS COMPLETE!');
    console.log('\n📋 What This Means:');
    console.log('• If ganpat found in users collection but not in User model: Schema issue');
    console.log('• If ganpat not found anywhere: User does not exist');
    console.log('• If ganpat found everywhere: Everything should work');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkGanpatUser();
