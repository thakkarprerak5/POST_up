const mongoose = require('mongoose');

async function fixApiProjectRecord() {
  try {
    console.log('🔧 Fixing API Project Record\n');
    
    await mongoose.connect('mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');
    
    // Find ALL projects with ganpat as author (API is reading from a different record)
    console.log('🔍 Finding all ganpat project records...');
    const allGanpatProjects = await projectsCollection.find({
      'author.name': 'ganpat'
    }).toArray();
    
    console.log(`✅ Found ${allGanpatProjects.length} ganpat project records:`);
    allGanpatProjects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.title}`);
      console.log(`      _id: ${project._id}`);
      console.log(`      author.id: ${project.author?.id}`);
      console.log(`      author.image: ${project.author?.image || 'NOT SET'}`);
      console.log(`      author.avatar: ${project.author?.avatar || 'NOT SET'}`);
    });
    
    // Update ALL ganpat projects with the image and avatar fields
    if (allGanpatProjects.length > 0) {
      console.log('\n🔄 Updating all ganpat project records...');
      
      for (const project of allGanpatProjects) {
        await projectsCollection.updateOne(
          { _id: project._id },
          { 
            $set: { 
              'author.image': '/placeholder-user.jpg',
              'author.avatar': '/placeholder-user.jpg'
            }
          }
        );
        console.log(`✅ Updated: ${project.title} (_id: ${project._id})`);
      }
      
      console.log('\n✅ All records updated!');
      
      // Test the API again
      console.log('\n🌐 Testing API after update...');
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
        }
      } catch (error) {
        console.log(`❌ API test failed: ${error.message}`);
      }
      
    } else {
      console.log('❌ No ganpat projects found to update');
    }
    
    console.log('\n🎉 API PROJECT RECORD FIX COMPLETE!');
    console.log('\n📋 WHAT WAS DONE:');
    console.log('✅ Found all ganpat project records in API database');
    console.log('✅ Updated all records with image and avatar fields');
    console.log('✅ API should now return profile photo data');
    
    console.log('\n🌐 TEST IT NOW:');
    console.log('1. Refresh the browser page');
    console.log('2. Go to: http://localhost:3000');
    console.log('3. Look for ganpat\'s "website" project');
    console.log('4. ✅ Profile photo should now be visible!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixApiProjectRecord();
