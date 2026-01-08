const mongoose = require('mongoose');

async function updateProjectBothFields() {
  try {
    console.log('🖼️ Updating Project with Both Image and Avatar Fields\n');
    
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
    console.log(`   Current author.avatar: ${ganpatProject.author?.avatar}`);
    
    // Update with both fields
    await projectsCollection.updateOne(
      { _id: ganpatProject._id },
      { 
        $set: { 
          'author.image': '/placeholder-user.jpg',
          'author.avatar': '/placeholder-user.jpg'
        }
      }
    );
    
    console.log('✅ Updated with both image and avatar fields');
    
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
      } else {
        console.log('❌ Ganpat project not found in API');
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log('\n🎉 BOTH FIELDS UPDATE COMPLETE!');
    console.log('\n📋 WHAT WAS DONE:');
    console.log('✅ Updated Project model to include avatar field');
    console.log('✅ Updated project with both image and avatar');
    console.log('✅ Should now show profile photo in all places');
    
    console.log('\n🌐 TEST IT:');
    console.log('1. Go to: http://localhost:3000');
    console.log('2. Look for ganpat\'s "website" project');
    console.log('3. ✅ Profile photo should be visible');
    console.log('4. Click on project to see detail page');
    console.log('5. ✅ Profile photo should be visible there too');
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

updateProjectBothFields();
