const mongoose = require('mongoose');

async function updateProjectPlaceholder() {
  try {
    console.log('🖼️ Updating Project with Placeholder Image\n');
    
    await mongoose.connect('mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');
    
    // Find ganpat's project
    const ganpatProject = await projectsCollection.findOne({ 'author.name': 'ganpat' });
    if (!ganpatProject) {
      console.log('❌ Ganpat project not found');
      return;
    }
    
    console.log('✅ Found Ganpat Project:');
    console.log(`   Title: ${ganpatProject.title}`);
    console.log(`   Current author.image: ${ganpatProject.author?.image}`);
    
    // Update with proper placeholder
    await projectsCollection.updateOne(
      { _id: ganpatProject._id },
      { 
        $set: { 
          'author.image': '/placeholder-user.jpg',
          'author.avatar': '/placeholder-user.jpg'
        }
      }
    );
    
    console.log('✅ Updated with placeholder image');
    
    // Test API
    console.log('\n🌐 Testing API...');
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost:3000/api/projects');
      const projects = await response.json();
      const ganpatApiProject = projects.find(p => p.author?.name === 'ganpat');
      
      if (ganpatApiProject) {
        console.log('✅ Found ganpat project in API:');
        console.log(`   Title: ${ganpatApiProject.title}`);
        console.log(`   Author Image: ${ganpatApiProject.author?.image || 'NOT SET'}`);
        console.log(`   Author Avatar: ${ganpatApiProject.author?.avatar || 'NOT SET'}`);
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log('\n🎉 PLACEHOLDER UPDATE COMPLETE!');
    console.log('\n📋 WHAT WAS DONE:');
    console.log('✅ Updated project with /placeholder-user.jpg');
    console.log('✅ Set both image and avatar fields');
    console.log('✅ Should now show placeholder image');
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

updateProjectPlaceholder();
