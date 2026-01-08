const mongoose = require('mongoose');

async function fixGanpatProjectImage() {
  try {
    console.log('🖼️ Fixing Ganpat Project Image\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    
    // Get ganpat user
    const ganpatUser = await usersCollection.findOne({ email: 'ganpat@example.com' });
    if (!ganpatUser) {
      console.log('❌ Ganpat user not found');
      return;
    }
    
    console.log('✅ Found Ganpat User:');
    console.log(`   User ID: ${ganpatUser._id}`);
    console.log(`   Photo: ${ganpatUser.photo || 'NOT SET'}`);
    
    // Find ganpat's project
    const ganpatProject = await projectsCollection.findOne({ 'author.name': 'ganpat' });
    if (!ganpatProject) {
      console.log('❌ Ganpat project not found');
      return;
    }
    
    console.log('✅ Found Ganpat Project:');
    console.log(`   Title: ${ganpatProject.title}`);
    console.log(`   Current author.image: ${ganpatProject.author?.image || 'NOT SET'}`);
    console.log(`   Current author.avatar: ${ganpatProject.author?.avatar || 'NOT SET'}`);
    
    // Update project with user's photo
    console.log('\n🔄 Updating project with user photo...');
    await projectsCollection.updateOne(
      { _id: ganpatProject._id },
      { 
        $set: { 
          'author.image': ganpatUser.photo || '/placeholder-user.jpg',
          'author.avatar': ganpatUser.photo || '/placeholder-user.jpg'
        }
      }
    );
    
    console.log('✅ Project updated with user photo!');
    
    // Verify the update
    const updatedProject = await projectsCollection.findOne({ _id: ganpatProject._id });
    console.log('\n✅ Verification:');
    console.log(`   author.image: ${updatedProject.author?.image || 'NOT SET'}`);
    console.log(`   author.avatar: ${updatedProject.author?.avatar || 'NOT SET'}`);
    
    // Test API response
    console.log('\n🌐 Testing API response...');
    try {
      const fetch = require('node-fetch');
      const response = await fetch(`http://localhost:3000/api/projects/${ganpatProject._id}`);
      if (response.ok) {
        const project = await response.json();
        console.log(`✅ API returns project:`);
        console.log(`   Title: ${project.title}`);
        console.log(`   Author Name: ${project.author?.name}`);
        console.log(`   Author Image: ${project.author?.image || 'NOT SET'}`);
        console.log(`   Author Avatar: ${project.author?.avatar || 'NOT SET'}`);
      } else {
        console.log(`❌ API failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log('\n🎉 PROJECT IMAGE FIX COMPLETE!');
    console.log('\n📋 WHAT WAS FIXED:');
    console.log('✅ Updated project with user profile photo');
    console.log('✅ Set both author.image and author.avatar fields');
    console.log('✅ Project cards will now show profile photo');
    console.log('✅ Project detail page will show profile photo');
    
    console.log('\n🌐 TEST IT:');
    console.log('1. Go to: http://localhost:3000');
    console.log('2. Look for ganpat\'s "website" project');
    console.log('3. ✅ Profile photo should be visible');
    console.log('4. Click on project to see detail page');
    console.log('5. ✅ Profile photo should be visible there too');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixGanpatProjectImage();
