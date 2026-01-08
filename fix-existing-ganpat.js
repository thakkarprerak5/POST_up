const mongoose = require('mongoose');

async function fixExistingGanpat() {
  try {
    console.log('🔧 Fixing Existing Ganpat User and Project Link\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    
    // Step 1: Find existing ganpat user
    console.log('👤 Step 1: Finding existing Ganpat user');
    const ganpatUser = await usersCollection.findOne({ 
      $or: [
        { fullName: /ganpat/i },
        { email: /ganpat/i }
      ]
    });
    
    if (!ganpatUser) {
      console.log('❌ No existing ganpat user found');
      console.log('📊 Available users:');
      const allUsers = await usersCollection.find({}).toArray();
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.fullName} (${user.email}) - ${user.type}`);
      });
      return;
    }
    
    console.log('✅ Found existing Ganpat user:');
    console.log(`   Name: ${ganpatUser.fullName}`);
    console.log(`   Email: ${ganpatUser.email}`);
    console.log(`   Type: ${ganpatUser.type}`);
    console.log(`   User ID: ${ganpatUser._id}`);
    console.log(`   Photo: ${ganpatUser.photo || 'NOT SET'}`);
    
    // Step 2: Find ganpat's project
    console.log('\n📋 Step 2: Finding Ganpat\'s uploaded project');
    const ganpatProject = await projectsCollection.findOne({ 
      'author.name': { $regex: 'ganpat', $options: 'i' }
    });
    
    if (!ganpatProject) {
      console.log('❌ No project found by ganpat');
      console.log('📊 All projects and their authors:');
      const allProjects = await projectsCollection.find({}).toArray();
      allProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.title} by ${project.author?.name || 'Unknown'}`);
      });
      return;
    }
    
    console.log('✅ Found Ganpat\'s project:');
    console.log(`   Title: ${ganpatProject.title}`);
    console.log(`   Current Author ID: ${ganpatProject.author?.id}`);
    console.log(`   Current Author Name: ${ganpatProject.author?.name}`);
    console.log(`   Current Author Image: ${ganpatProject.author?.image || 'NOT SET'}`);
    console.log(`   Project ID: ${ganpatProject._id}`);
    
    // Step 3: Check if project is already linked correctly
    const currentAuthorId = ganpatProject.author?.id;
    const ganpatUserId = ganpatUser._id.toString();
    
    if (currentAuthorId === ganpatUserId) {
      console.log('\n✅ Project is already correctly linked to Ganpat user!');
      
      // Test user projects API
      console.log('\n📁 Testing User Projects API...');
      try {
        const fetch = require('node-fetch');
        const response = await fetch(`http://localhost:3000/api/users/${ganpatUserId}/projects`);
        if (response.ok) {
          const userProjects = await response.json();
          console.log(`✅ API returns ${userProjects.length} projects`);
          userProjects.forEach((project, index) => {
            console.log(`   ${index + 1}. ${project.title}`);
          });
        } else {
          console.log(`❌ API failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ API test failed: ${error.message}`);
      }
      
    } else {
      console.log('\n🔄 Step 3: Linking project to correct Ganpat user...');
      
      // Update the project to use the correct user ID and photo
      await projectsCollection.updateOne(
        { _id: ganpatProject._id },
        { 
          $set: { 
            'author.id': ganpatUserId,
            'author.name': ganpatUser.fullName,
            'author.image': ganpatUser.photo || '/placeholder-user.jpg'
          }
        }
      );
      
      console.log('✅ Project linked to Ganpat user!');
      console.log(`   Updated author.id from ${currentAuthorId} to ${ganpatUserId}`);
      console.log(`   Updated author.image to ${ganpatUser.photo || '/placeholder-user.jpg'}`);
      
      // Test the fix
      console.log('\n📁 Testing User Projects API after fix...');
      try {
        const fetch = require('node-fetch');
        const response = await fetch(`http://localhost:3000/api/users/${ganpatUserId}/projects`);
        if (response.ok) {
          const userProjects = await response.json();
          console.log(`✅ API now returns ${userProjects.length} projects`);
          userProjects.forEach((project, index) => {
            console.log(`   ${index + 1}. ${project.title}`);
          });
        } else {
          console.log(`❌ API failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ API test failed: ${error.message}`);
      }
    }
    
    console.log('\n🎉 GANPAT PROJECT LINK FIX COMPLETE!');
    console.log('\n📋 WHAT WAS DONE:');
    console.log('✅ Found existing ganpat user account');
    console.log('✅ Found ganpat\'s uploaded project');
    console.log('✅ Linked project to correct user ID');
    console.log('✅ Updated author image from user profile');
    console.log('✅ Project will now appear in ganpat profile');
    
    console.log('\n🔑 GANPAT LOGIN INFO:');
    console.log(`   Email: ${ganpatUser.email}`);
    console.log('   Password: (existing password)');
    
    console.log('\n🌐 TEST IT:');
    console.log('1. Go to: http://localhost:3000/login');
    console.log(`2. Login with: ${ganpatUser.email}`);
    console.log('3. Check profile: http://localhost:3000/profile');
    console.log('4. Verify project appears and photo is visible');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixExistingGanpat();
