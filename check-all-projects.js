const mongoose = require('mongoose');

async function checkAllProjects() {
  try {
    console.log('🔍 Checking All Projects in Database\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');
    
    const allProjects = await projectsCollection.find({}).toArray();
    console.log(`📊 Found ${allProjects.length} projects`);
    
    if (allProjects.length === 0) {
      console.log('❌ No projects found in database');
      return;
    }
    
    console.log('\n📋 All Projects:');
    allProjects.forEach((project, index) => {
      console.log(`\n   ${index + 1}. ${project.title}`);
      console.log(`      Author ID: ${project.author?.id || 'MISSING'}`);
      console.log(`      Author Name: ${project.author?.name || 'MISSING'}`);
      console.log(`      Author Image: ${project.author?.image || 'MISSING'}`);
      console.log(`      Project ID: ${project._id}`);
    });
    
    // Look for any project with ganpat in the name
    console.log('\n🔍 Searching for "ganpat" in any field...');
    const ganpatRelated = allProjects.filter(p => 
      p.author?.name?.toLowerCase().includes('ganpat') ||
      p.title?.toLowerCase().includes('ganpat') ||
      p.description?.toLowerCase().includes('ganpat')
    );
    
    if (ganpatRelated.length > 0) {
      console.log(`✅ Found ${ganpatRelated.length} projects related to ganpat:`);
      ganpatRelated.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.title} by ${project.author?.name}`);
      });
    } else {
      console.log('❌ No projects found related to "ganpat"');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllProjects();
