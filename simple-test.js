// Simple test to check what's happening
async function simpleTest() {
  console.log('🔍 Simple Test\n');
  
  try {
    // Test 1: Check all projects
    console.log('📋 Test 1: All Projects');
    const allResponse = await fetch('http://localhost:3000/api/projects');
    const allProjects = await allResponse.json();
    console.log(`   Found ${allProjects.length} projects`);
    
    // Find ganpat project
    const ganpatProject = allProjects.find(p => 
      p.author?.name?.toLowerCase().includes('ganpat')
    );
    
    if (ganpatProject) {
      console.log(`   ✅ Found ganpat project: ${ganpatProject.title}`);
      console.log(`   Author ID: ${ganpatProject.author?.id}`);
      console.log(`   Author Name: ${ganpatProject.author?.name}`);
      
      // Test 2: Check user projects with that author ID
      console.log('\n📁 Test 2: User Projects with Author ID');
      const userResponse = await fetch(`http://localhost:3000/api/users/${ganpatProject.author?.id}/projects`);
      const userProjects = await userResponse.json();
      console.log(`   Found ${userProjects.length} projects for author ID ${ganpatProject.author?.id}`);
      
      if (userProjects.length > 0) {
        userProjects.forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.title}`);
        });
      }
      
      // Test 3: Try direct database check
      console.log('\n🗄️ Test 3: Direct Database Check');
      const mongoose = require('mongoose');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
      const db = mongoose.connection.db;
      const projectsCollection = db.collection('projects');
      
      const directProject = await projectsCollection.findOne({ 
        'author.name': 'ganpat' 
      });
      
      if (directProject) {
        console.log(`   ✅ Found in database: ${directProject.title}`);
        console.log(`   Author ID: ${directProject.author?.id}`);
        console.log(`   Author Name: ${directProject.author?.name}`);
      } else {
        console.log('   ❌ Not found in database');
      }
      
      await mongoose.disconnect();
      
    } else {
      console.log('   ❌ No ganpat project found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleTest();
