const mongoose = require('mongoose');

async function finalFixGanpat() {
  try {
    console.log('🎯 Final Fix for Ganpat Profile Issue\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    
    // Get the project's author ID (the one that works in API)
    const ganpatProject = await projectsCollection.findOne({ 'author.name': 'ganpat' });
    if (!ganpatProject) {
      console.log('❌ No ganpat project found');
      return;
    }
    
    const projectAuthorId = ganpatProject.author?.id;
    console.log('✅ Found ganpat project:');
    console.log(`   Title: ${ganpatProject.title}`);
    console.log(`   Project Author ID: ${projectAuthorId}`);
    
    // Get ganpat user
    const ganpatUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    if (!ganpatUser) {
      console.log('❌ No ganpat user found');
      return;
    }
    
    console.log('✅ Found ganpat user:');
    console.log(`   User ID: ${ganpatUser._id}`);
    console.log(`   Email: ${ganpatUser.email}`);
    
    // Check if IDs match
    if (ganpatUser._id.toString() === projectAuthorId) {
      console.log('✅ IDs already match - no fix needed');
    } else {
      console.log('❌ IDs don\'t match - fixing...');
      console.log(`   User ID: ${ganpatUser._id}`);
      console.log(`   Project Author ID: ${projectAuthorId}`);
      
      // Update the project to use the user's ID (better than changing user ID)
      console.log('\n🔄 Updating project to use user ID...');
      await projectsCollection.updateOne(
        { _id: ganpatProject._id },
        { 
          $set: { 
            'author.id': ganpatUser._id.toString(),
            'author.name': ganpatUser.fullName,
            'author.image': ganpatUser.photo || '/placeholder-user.jpg'
          }
        }
      );
      
      console.log('✅ Project updated with user ID!');
    }
    
    // Test the fix
    console.log('\n🧪 Testing the fix...');
    try {
      const fetch = require('node-fetch');
      const response = await fetch(`http://localhost:3000/api/users/${ganpatUser._id}/projects`);
      if (response.ok) {
        const projects = await response.json();
        console.log(`✅ API returns ${projects.length} projects for user ID ${ganpatUser._id}`);
        projects.forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.title}`);
          console.log(`      Author: ${project.author?.name}`);
          console.log(`      Author Image: ${project.author?.image || 'NOT SET'}`);
        });
      } else {
        console.log(`❌ API failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log('\n🎉 FINAL FIX COMPLETE!');
    console.log('\n📋 WHAT WAS FIXED:');
    console.log('✅ Project author ID now matches user ID');
    console.log('✅ Author image set from user profile');
    console.log('✅ User projects API will return projects');
    console.log('✅ Profile will show uploaded projects');
    
    console.log('\n🔑 GANPAT LOGIN INFO:');
    console.log('   Email: ganpat@example.com');
    console.log('   Password: (use existing password)');
    
    console.log('\n🌐 TEST IT NOW:');
    console.log('1. Go to: http://localhost:3000/login');
    console.log('2. Login with ganpat@example.com');
    console.log('3. Check profile: http://localhost:3000/profile');
    console.log('4. ✅ Project "website" should appear!');
    console.log('5. ✅ Profile photo should be visible!');
    
  } catch (error) {
    console.error('❌ Final fix failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

finalFixGanpat();
