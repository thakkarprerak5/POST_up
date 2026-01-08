const mongoose = require('mongoose');

async function testProjectUserFix() {
  try {
    console.log('🧪 Testing Project-User Relationship Fixes\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    console.log('✅ Connected to database');
    
    // Get collections
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    
    // Test 1: Check if users exist
    const users = await usersCollection.find({}).toArray();
    console.log(`\n📊 Found ${users.length} users in database`);
    
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`   First user: ${firstUser.email} (${firstUser._id})`);
      
      // Test 2: Check projects with correct author.id structure
      const userProjects = await projectsCollection.find({ 'author.id': firstUser._id.toString() }).toArray();
      console.log(`\n📁 Found ${userProjects.length} projects for first user using 'author.id' field`);
      
      // Test 3: Check if any projects still use old structure
      const oldStructureProjects = await projectsCollection.find({ 'author._id': { $exists: true } }).toArray();
      console.log(`⚠️  Found ${oldStructureProjects.length} projects still using old 'author._id' structure`);
      
      // Test 4: Show sample project structure
      if (userProjects.length > 0) {
        const sampleProject = userProjects[0];
        console.log(`\n📋 Sample project structure:`);
        console.log(`   Title: ${sampleProject.title}`);
        console.log(`   Author ID: ${sampleProject.author?.id}`);
        console.log(`   Author Name: ${sampleProject.author?.name}`);
        console.log(`   Author Image: ${sampleProject.author?.image ? 'Yes' : 'No'}`);
      }
      
      // Test 5: Test API endpoint simulation
      console.log(`\n🔗 Testing API endpoint simulation:`);
      console.log(`   GET /api/users/${firstUser._id}/projects should return ${userProjects.length} projects`);
      
    } else {
      console.log('❌ No users found in database');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testProjectUserFix();
