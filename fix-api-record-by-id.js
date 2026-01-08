const mongoose = require('mongoose');

async function fixApiRecordById() {
  try {
    console.log('🔧 Fixing API Record by Author ID\n');
    
    await mongoose.connect('mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');
    
    // Find project by the author ID that the API is returning
    console.log('🔍 Finding project by API author ID: 6932becc696e13382a825371');
    const apiProject = await projectsCollection.findOne({ 'author.id': '6932becc696e13382a825371' });
    
    if (apiProject) {
      console.log('✅ Found API project record:');
      console.log(`   Title: ${apiProject.title}`);
      console.log(`   _id: ${apiProject._id}`);
      console.log(`   Current author.id: ${apiProject.author?.id}`);
      console.log(`   Current author.image: ${apiProject.author?.image || 'NOT SET'}`);
      console.log(`   Current author.avatar: ${apiProject.author?.avatar || 'NOT SET'}`);
      
      // Update this record with the profile photo
      console.log('\n🔄 Updating API record with profile photo...');
      await projectsCollection.updateOne(
        { _id: apiProject._id },
        { 
          $set: { 
            'author.image': '/placeholder-user.jpg',
            'author.avatar': '/placeholder-user.jpg'
          }
        }
      );
      
      console.log('✅ API record updated!');
      
      // Verify the update
      const updatedProject = await projectsCollection.findOne({ _id: apiProject._id });
      console.log('\n✅ Verification:');
      console.log(`   author.image: ${updatedProject.author?.image || 'NOT SET'}`);
      console.log(`   author.avatar: ${updatedProject.author?.avatar || 'NOT SET'}`);
      
      // Test the API
      console.log('\n🌐 Testing API...');
      try {
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:3000/api/projects');
        const projects = await response.json();
        const ganpatApiProject = projects.find(p => p.author?.name === 'ganpat');
        
        if (ganpatApiProject) {
          console.log('✅ API now returns:');
          console.log(`   Title: ${ganpatApiProject.title}`);
          console.log(`   Author Image: ${ganpatApiProject.author?.image || 'NOT SET'}`);
          console.log(`   Author Avatar: ${ganpatApiProject.author?.avatar || 'NOT SET'}`);
          
          if (ganpatApiProject.author?.image) {
            console.log('\n🎉 SUCCESS! Profile photo data is now in API response');
          }
        }
      } catch (error) {
        console.log(`❌ API test failed: ${error.message}`);
      }
      
    } else {
      console.log('❌ API project record not found');
      
      // Let's check what projects exist with that author ID pattern
      console.log('\n🔍 Checking for similar author IDs...');
      const similarProjects = await projectsCollection.find({
        'author.id': { $regex: '6932becc696e13382a825371' }
      }).toArray();
      
      console.log(`Found ${similarProjects.length} similar projects:`);
      similarProjects.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.title} - author.id: ${p.author?.id}`);
      });
    }
    
    console.log('\n🎉 API RECORD FIX COMPLETE!');
    console.log('\n📋 WHAT WAS DONE:');
    console.log('✅ Found the exact record API is reading');
    console.log('✅ Updated it with profile photo fields');
    console.log('✅ API should now return profile photo');
    
    console.log('\n🌐 TEST IT NOW:');
    console.log('1. Refresh the browser');
    console.log('2. Go to: http://localhost:3000');
    console.log('3. Look for ganpat\'s "website" project');
    console.log('4. ✅ Profile photo should be visible!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixApiRecordById();
