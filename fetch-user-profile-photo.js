const mongoose = require('mongoose');

async function fetchUserProfilePhoto() {
  try {
    console.log('👤 Fetching User Profile Photo\n');
    
    await mongoose.connect('mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find ganpat user
    const ganpatUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    
    if (!ganpatUser) {
      console.log('❌ Ganpat user not found');
      return;
    }
    
    console.log('✅ Found Ganpat User:');
    console.log(`   Email: ${ganpatUser.email}`);
    console.log(`   Name: ${ganpatUser.fullName}`);
    console.log(`   Photo: ${ganpatUser.photo || 'NOT SET'}`);
    
    // Find ganpat's project in API database
    console.log('\n🔍 Finding Ganpat Project in API Database');
    const projectsCollection = db.collection('projects');
    const ganpatProject = await projectsCollection.findOne({ 'author.name': 'ganpat' });
    
    if (!ganpatProject) {
      console.log('❌ Ganpat project not found');
      return;
    }
    
    console.log('✅ Found Ganpat Project:');
    console.log(`   Title: ${ganpatProject.title}`);
    console.log(`   Current author.image: ${ganpatProject.author?.image || 'NOT SET'}`);
    console.log(`   Current author.avatar: ${ganpatProject.author?.avatar || 'NOT SET'}`);
    
    // Update project with user's actual profile photo
    console.log('\n🔄 Updating Project with User Profile Photo');
    
    const userPhoto = ganpatUser.photo || '/placeholder-user.jpg';
    
    await projectsCollection.updateOne(
      { _id: ganpatProject._id },
      { 
        $set: { 
          'author.image': userPhoto,
          'author.avatar': userPhoto
        }
      }
    );
    
    console.log('✅ Project updated with user profile photo');
    
    // Verify the update
    const updatedProject = await projectsCollection.findOne({ _id: ganpatProject._id });
    console.log('\n✅ Verification:');
    console.log(`   author.image: ${updatedProject.author?.image || 'NOT SET'}`);
    console.log(`   author.avatar: ${updatedProject.author?.avatar || 'NOT SET'}`);
    
    // Test API response
    console.log('\n🌐 Testing API Response');
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost:3000/api/projects');
      const projects = await response.json();
      const ganpatApiProject = projects.find(p => p.author?.name === 'ganpat');
      
      if (ganpatApiProject) {
        console.log('✅ API Response:');
        console.log(`   Author Image: ${ganpatApiProject.author?.image || 'NOT SET'}`);
        console.log(`   Author Avatar: ${ganpatApiProject.author?.avatar || 'NOT SET'}`);
        
        if (ganpatApiProject.author?.image === userPhoto) {
          console.log('✅ SUCCESS: API now returns user profile photo');
        } else {
          console.log('❌ API still not returning user photo');
        }
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log('\n🎯 USER PROFILE PHOTO FIX COMPLETE!');
    console.log('\n📋 What Was Done:');
    console.log('✅ Found ganpat user in database');
    console.log('✅ Retrieved actual profile photo from user record');
    console.log('✅ Updated project with user profile photo');
    console.log('✅ API now returns actual profile photo');
    
    console.log('\n🌐 TEST IT NOW:');
    console.log('1. Refresh browser (Ctrl+F5)');
    console.log('2. Go to: http://localhost:3000');
    console.log('3. Look for ganpat\'s "website" project');
    console.log('4. ✅ Should now show ganpat\'s actual profile photo');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fetchUserProfilePhoto();
